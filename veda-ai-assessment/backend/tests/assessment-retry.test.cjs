const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Job, UnrecoverableError } = require('bullmq');
const { GoogleGenerativeAIFetchError } = require('@google/generative-ai');
const { createAssessmentProcessor, handleAssessmentFailure, reconcileFailedBatch } = require('../src/workers/assessmentProcessor');
const { ASSESSMENT_JOB_OPTIONS, assessmentBackoff, classifyFailure, parseRetryAfter, retryDelay } = require('../src/utils/assessmentRetry');

const content = { sections: [{ sectionTitle: 'Section A', instructions: 'Answer all questions.', questions: [
  { questionText: 'What is a queue?', difficulty: 'Easy', marks: 5, options: [] },
] }] };
const retryInfo = delay => ({ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: delay });
const quota = quotaId => ({ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId }] });
const providerError = (status, details = []) => new GoogleGenerativeAIFetchError('sensitive provider error omitted', status, 'error', details);

// Real installed BullMQ Job.moveToFailed/Backoffs/UnrecoverableError are used.
// Only Redis Lua I/O and MongoDB/provider/socket dependencies are replaced. No
// service connections, real timers, credentials, or Gemini quota are required.
function harness(responses = [content], options = {}) {
  const assignment = { _id: 'assignment-1', userId: 'test-user', generationId: 'generation-1', status: 'pending' };
  const results = new Map();
  const statuses = [], events = [], logs = [], delays = [];
  let state = 'active', calls = 0, saveCalls = 0;
  let completionFailures = options.completionFailures || 0;
  let postSaveFailures = options.postSaveFailures || 0;
  const queue = {
    name: 'assessment-generation', qualifiedName: 'test:assessment-generation', keys: {},
    toKey: key => `test:assessment-generation:${key}`,
    opts: { settings: { backoffStrategy: assessmentBackoff } },
    trace: async (_kind, _operation, _name, callback) => callback(),
  };
  const job = new Job(queue, 'generate', {
    assignmentId: assignment._id, generationId: assignment.generationId,
    payload: { questionTypes: [{ type: 'Short Answer', count: 1, marks: 5 }], totalQuestions: 1, totalMarks: 5, instructions: 'private uploaded material' },
  }, { ...ASSESSMENT_JOB_OPTIONS }, 'job-1');
  job.getState = async () => state;
  job.scripts = {
    moveToDelayed: async (_id, _now, delay) => { state = 'delayed'; delays.push(delay); },
    retryJob: async () => { state = 'waiting'; },
    moveToFailedArgs: () => [null, Date.now()],
    moveToFinishedKeys: [],
    moveToFinished: async () => { state = 'failed'; },
  };
  const store = {
    loadAssignment: async () => ({ ...assignment }),
    loadResult: async (_id, generationId) => results.get(generationId) || null,
    saveResult: async (_id, generationId, value, tokens) => {
      saveCalls++;
      if (!results.has(generationId)) results.set(generationId, { _id: 'result-1', content: value, tokenUsage: tokens });
      if (postSaveFailures-- > 0) throw Object.assign(new Error('write acknowledgment lost'), { name: 'MongoNetworkError' });
      return results.get(generationId);
    },
    transition: async (_id, generationId, status, tokenUsage) => {
      if (generationId !== assignment.generationId || !['pending', 'processing'].includes(assignment.status)) return null;
      if (status === 'completed' && completionFailures-- > 0) throw Object.assign(new Error('DB temporarily unavailable'), { name: 'MongoNetworkError' });
      assignment.status = status;
      if (tokenUsage !== undefined) assignment.tokenUsage = tokenUsage;
      statuses.push(status);
      return { ...assignment };
    },
  };
  const deps = {
    store, random: () => 0,
    generate: async () => {
      const response = responses[Math.min(calls++, responses.length - 1)];
      if (response instanceof Error) throw response;
      if (typeof response === 'function') return response();
      return { text: JSON.stringify(response), tokenUsage: 42 };
    },
    invalidate: async () => {},
    emit: (name, payload) => {
      if (payload.status === 'completed') {
        assert.ok(results.size > 0, 'completion must follow durable result persistence');
        assert.equal(assignment.status, 'completed');
      }
      events.push({ name, ...payload });
    },
    log: fields => logs.push(fields),
  };
  const process = createAssessmentProcessor(deps);
  async function attempt() {
    state = 'active';
    try {
      const result = await process(job);
      state = 'completed';
      return { result };
    } catch (error) {
      await job.moveToFailed(error, 'test-lock');
      await handleAssessmentFailure(job, error, deps);
      return { error };
    }
  }
  return { assignment, results, statuses, events, logs, delays, job, deps, process, attempt,
    get calls() { return calls; }, get saveCalls() { return saveCalls; }, get state() { return state; } };
}

test('first-attempt success saves before one terminal completion event', async () => {
  const h = harness();
  await h.attempt();
  assert.deepEqual(h.statuses, ['processing', 'completed']);
  assert.equal(h.calls, 1);
  assert.equal(h.results.size, 1);
  assert.equal(h.assignment.tokenUsage, 42);
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].name, 'assignment:updated');
  assert.equal(h.events[0].status, 'completed');
});

test('503 is natively delayed then succeeds; MongoDB never becomes failed during retry', async () => {
  const h = harness([providerError(503), content]);
  const first = await h.attempt();
  assert.equal(h.state, 'delayed');
  assert.deepEqual(h.delays, [2000]);
  assert.equal(h.job.attemptsMade, 1);
  assert.equal(h.assignment.status, 'pending');
  assert.equal(h.events.length, 0);
  assert.ok(!(first.error instanceof UnrecoverableError));
  await h.attempt();
  assert.deepEqual(h.statuses, ['processing', 'pending', 'processing', 'completed']);
  assert.equal(h.calls, 2);
  assert.equal(h.events.length, 1);
});

test('repeated 503 exhausts exactly three total attempts and emits failure once', async () => {
  const h = harness([providerError(503)]);
  await h.attempt(); await h.attempt();
  assert.equal(h.assignment.status, 'pending');
  const { error } = await h.attempt();
  assert.equal(h.state, 'failed');
  assert.equal(h.calls, 3);
  assert.deepEqual(h.delays, [2000, 4000]);
  assert.equal(h.assignment.status, 'failed');
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].status, 'failed');
  await handleAssessmentFailure(h.job, error, h.deps);
  assert.equal(h.events.length, 1, 'duplicate native event delivery must not duplicate user event');
});

test('temporary 429 respects protobuf RetryInfo and then succeeds', async () => {
  const h = harness([providerError(429, [quota('GenerateRequestsPerMinutePerModel'), retryInfo('35.5s')]), content]);
  await h.attempt();
  assert.deepEqual(h.delays, [35500]);
  assert.equal(h.assignment.status, 'pending');
  assert.equal(h.events.length, 0);
  await h.attempt();
  assert.equal(h.assignment.status, 'completed');
});

test('Retry-After and RetryInfo use the larger delay; jitter never undercuts it', async () => {
  const error = providerError(429, [retryInfo({ seconds: '20', nanos: 500_000_000 })]);
  error.headers = new Headers({ 'Retry-After': '40' });
  const failure = classifyFailure(error);
  assert.equal(failure.retryAfterMs, 40000);
  assert.equal(retryDelay(1, failure, () => 1), 41000);
  const h = harness([error, content]);
  await h.attempt();
  assert.deepEqual(h.delays, [40000]);
});

test('daily quota is immediately unrecoverable even when a short RetryInfo is also present', async () => {
  const h = harness([providerError(429, [quota('GenerateRequestsPerDayPerProjectPerModel-FreeTier'), retryInfo('10s')])]);
  const { error } = await h.attempt();
  assert.ok(error instanceof UnrecoverableError);
  assert.equal(h.calls, 1);
  assert.equal(h.state, 'failed');
  assert.equal(h.assignment.status, 'failed');
  assert.equal(h.events.length, 1);
  assert.deepEqual(h.delays, []);
});

for (const status of [400, 401, 403]) test(`${status} fails immediately without consuming the retry budget`, async () => {
  const h = harness([providerError(status)]);
  const { error } = await h.attempt();
  assert.ok(error instanceof UnrecoverableError);
  assert.equal(h.calls, 1);
  assert.equal(h.job.attemptsMade, 1);
  assert.equal(h.state, 'failed');
  assert.equal(h.events[0].status, 'failed');
});

test('a lost result-write acknowledgment reuses durable content and tokens without another Gemini call', async () => {
  const h = harness([content], { postSaveFailures: 1 });
  await h.attempt();
  assert.equal(h.assignment.status, 'pending');
  assert.equal(h.results.size, 1);
  await h.attempt();
  assert.equal(h.calls, 1);
  assert.equal(h.saveCalls, 1);
  assert.equal(h.results.size, 1);
  assert.equal(h.assignment.status, 'completed');
  assert.equal(h.assignment.tokenUsage, 42);
  assert.equal(h.events.length, 1);
});

test('status-write failure after save retries finalization without generating again', async () => {
  const h = harness([content], { completionFailures: 1 });
  await h.attempt();
  assert.equal(h.assignment.status, 'pending');
  await h.attempt();
  assert.equal(h.calls, 1);
  assert.equal(h.events.length, 1);
});

test('redelivery after completion produces no duplicate Result or terminal event', async () => {
  const h = harness();
  await h.attempt();
  await h.process(h.job);
  await h.process(h.job);
  assert.equal(h.calls, 1);
  assert.equal(h.results.size, 1);
  assert.equal(h.events.length, 1);
});

test('a failed bookkeeping attempt with a saved result recovers completed state instead of failure', async () => {
  const h = harness();
  h.job.attemptsMade = 2;
  h.deps.store.transition = async () => { throw Object.assign(new Error(), { name: 'MongoNetworkError' }); };
  // Seed a durable result to model a crash between result save and status finalization.
  h.results.set('generation-1', { _id: 'result-1', content, tokenUsage: 42 });
  let error;
  try { await h.process(h.job); } catch (caught) { error = caught; }
  assert.ok(error);
  await h.job.moveToFailed(error, 'test-lock');
  await assert.rejects(handleAssessmentFailure(h.job, error, h.deps), { name: 'MongoNetworkError' });
  assert.equal(h.state, 'failed');
  assert.equal(h.events.length, 0);
  h.deps.store.transition = async (_id, gen, status) => {
    if (gen !== h.assignment.generationId || !['pending', 'processing'].includes(h.assignment.status)) return null;
    h.assignment.status = status;
    return { ...h.assignment };
  };
  await handleAssessmentFailure(h.job, error, h.deps);
  assert.equal(h.assignment.status, 'completed');
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].status, 'completed');
  assert.equal(h.calls, 0);
});

test('a cache or Socket.IO failure cannot fail generation or repeat Gemini', async () => {
  const h = harness();
  h.deps.invalidate = async () => { throw new Error('redis://secret@private-host'); };
  h.deps.cacheResult = async () => { throw new Error('private text'); };
  h.deps.emit = () => { throw new Error('private text'); };
  await h.attempt();
  assert.equal(h.assignment.status, 'completed');
  await h.process(h.job);
  assert.equal(h.calls, 1);
  assert.doesNotMatch(JSON.stringify(h.logs), /secret|private text|private uploaded material|sensitive provider/);
});

test('regeneration supersedes old delayed jobs without overwriting state or emitting failure', async () => {
  const h = harness([providerError(503)]);
  await h.attempt();
  h.assignment.generationId = 'generation-2';
  const result = await h.process(h.job);
  assert.equal(result.superseded, true);
  assert.equal(h.calls, 1);
  assert.equal(h.assignment.status, 'pending');
  assert.equal(h.events.length, 0);
});

test('regeneration while a provider call is in flight prevents stale persistence and notifications', async () => {
  let h;
  h = harness([() => {
    h.assignment.generationId = 'generation-2';
    h.assignment.status = 'pending';
    return { text: JSON.stringify(content), tokenUsage: 42 };
  }]);
  const result = await h.process(h.job);
  assert.equal(result.superseded, true);
  assert.equal(h.results.size, 0);
  assert.equal(h.events.length, 0);
});

test('malformed or unusable Gemini output fails once and logs no content', async () => {
  const h = harness([{ sections: [] }]);
  await h.attempt();
  assert.equal(h.calls, 1);
  assert.equal(h.state, 'failed');
  assert.equal(h.results.size, 0);
});

test('status is never overwritten by a late failed event after completion', async () => {
  const h = harness();
  await h.attempt();
  h.job.getState = async () => 'failed';
  await handleAssessmentFailure(h.job, providerError(503), h.deps);
  assert.equal(h.assignment.status, 'completed');
  assert.equal(h.events.length, 1);
});

test('error classification uses actual SDK status and structured quota limits', () => {
  for (const status of [500, 502, 503, 504]) assert.equal(classifyFailure(providerError(status)).retryable, true);
  assert.equal(classifyFailure(providerError(404)).retryable, false);
  assert.equal(classifyFailure(providerError(429)).retryable, false, 'ambiguous quota is conservative');
  assert.equal(classifyFailure(providerError(429, [quota('GenerateRequestsPerMinute')])).retryAfterMs, 60000);
  assert.equal(classifyFailure(providerError(429, [retryInfo('121s')])).retryable, false);
  assert.equal(classifyFailure(providerError(503, [retryInfo('121s')])).retryable, false);
  assert.equal(classifyFailure(providerError(429, [{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'PerMinute', quotaValue: '0' }] }, retryInfo('1s')])).retryable, false);
  assert.equal(classifyFailure(Object.assign(new Error(), { cause: { code: 'ECONNRESET' } })).retryable, true);
  assert.equal(classifyFailure(Object.assign(new Error(), { name: 'TimeoutError' })).retryable, true);
  assert.equal(classifyFailure(new Error('unknown permanent failure')).retryable, false);
  const now = Date.parse('2026-11-17T12:00:00Z');
  assert.equal(parseRetryAfter('Tue, 17 Nov 2026 12:00:30 GMT', now), 30000);
  assert.equal(parseRetryAfter('0.5', now), 500);
  assert.equal(parseRetryAfter('garbage', now), undefined);
  assert.equal(parseRetryAfter('-1', now), undefined);
  assert.equal(assessmentBackoff(1, 'assessment-provider', providerError(400)), -1);
});

test('structured failure logs contain attempt budget, category, HTTP status and exact scheduled delay', async () => {
  const h = harness([providerError(503)]);
  await h.attempt();
  const log = h.logs.find(row => row.event === 'attempt_failed');
  assert.equal(log.jobId, 'job-1');
  assert.equal(log.assignmentId, 'assignment-1');
  assert.equal(log.attempt, 1);
  assert.equal(log.maxAttempts, 3);
  assert.equal(log.httpStatus, 503);
  assert.equal(log.category, 'provider_unavailable');
  assert.equal(log.transient, true);
  assert.equal(log.terminal, false);
  assert.equal(log.nextRetryDelayMs, h.delays[0]);
  assert.doesNotMatch(JSON.stringify(h.logs), /sensitive provider error|private uploaded material/);
});

test('legacy jobs without retry options fail once rather than claiming another retry', async () => {
  const h = harness([providerError(503)]);
  h.job.opts.attempts = 0;
  await h.attempt();
  assert.equal(h.state, 'failed');
  assert.equal(h.calls, 1);
  assert.equal(h.assignment.status, 'failed');
});

test('even jobs configured externally with excessive attempts cannot exceed three provider attempts', async () => {
  const h = harness([providerError(503)]);
  h.job.opts.attempts = 10;
  await h.attempt(); await h.attempt(); await h.attempt();
  assert.equal(h.state, 'failed');
  assert.equal(h.calls, 3);
});

test('terminal reconciliation repairs a missed failure event without provider calls or duplicate notifications', async () => {
  const h = harness([providerError(403)]);
  let failure;
  try { await h.process(h.job); } catch (error) { failure = error; }
  await h.job.moveToFailed(failure, 'test-lock');
  assert.equal(h.assignment.status, 'processing');
  const queue = { getFailed: async (start, end) => {
    assert.equal(start, 0); assert.equal(end, 49);
    return [h.job];
  } };
  assert.equal(await reconcileFailedBatch(queue, h.deps), 0);
  assert.equal(h.assignment.status, 'failed');
  assert.equal(h.events.length, 1);
  await reconcileFailedBatch(queue, h.deps);
  assert.equal(h.events.length, 1);
  assert.equal(h.calls, 1);
});

test('terminal reconciliation survives a DB outage and can resume on the next pass', async () => {
  const h = harness([providerError(403)]);
  let failure;
  try { await h.process(h.job); } catch (error) { failure = error; }
  await h.job.moveToFailed(failure, 'test-lock');
  const load = h.deps.store.loadAssignment;
  h.deps.store.loadAssignment = async () => { throw new Error('DB offline'); };
  const queue = { getFailed: async () => [h.job] };
  await reconcileFailedBatch(queue, h.deps);
  assert.equal(h.assignment.status, 'processing');
  assert.equal(h.events.length, 0);
  h.deps.store.loadAssignment = load;
  await reconcileFailedBatch(queue, h.deps);
  assert.equal(h.assignment.status, 'failed');
  assert.equal(h.events.length, 1);
});

test('concurrent redelivery inserts one result and claims just one completion notification', async () => {
  const h = harness();
  await Promise.all([h.process(h.job), h.process(h.job)]);
  assert.equal(h.results.size, 1);
  assert.equal(h.events.length, 1);
  assert.equal(h.assignment.status, 'completed');
});
