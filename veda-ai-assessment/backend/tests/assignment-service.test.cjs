const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const mongoose = require('mongoose');

// Block production queue/Redis initialization before loading the service.
const redis = { get: async () => null, set: async () => 'OK', del: async () => 1 };
const queued = [];
const addAssessmentJob = async (...args) => { queued.push(args); return { id: 'queued-job' }; };
for (const [path, exports] of [
  ['../src/config/redis', { __esModule: true, default: redis }],
  ['../src/queues/assessmentQueue', { addAssessmentJob }],
]) {
  const filename = require.resolve(path);
  const mock = new Module(filename);
  mock.exports = exports;
  mock.loaded = true;
  require.cache[filename] = mock;
}
const Assignment = require('../src/models/Assignment').default;
const Result = require('../src/models/Result').default;
const { AssignmentService } = require('../src/services/assignment.service');
const payload = { title: 'Test', dueDate: '2027-01-01', totalQuestions: 1, totalMarks: 5,
  questionTypes: [{ type: 'Short Answer', count: 1, marks: 5 }] };

test('new assignments are pending and enqueue the same generation token without changing response fields', async t => {
  queued.length = 0;
  let saved;
  t.mock.method(Assignment.prototype, 'save', async function () { saved = this; return this; });
  const response = await AssignmentService.createAssignment(payload, null, 'user');
  assert.equal(saved.status, 'pending');
  assert.ok(saved.generationId);
  assert.equal(queued.length, 1);
  assert.equal(queued[0][2], saved.generationId);
  assert.equal(queued[0][0], saved._id.toString());
  assert.equal(response.jobId, 'queued-job');
  assert.equal(String(response.assignmentId), saved._id.toString());
  assert.equal(response.isCached, false);
});

test('regeneration rotates ownership before enqueueing and deletes only the old generation result', async t => {
  queued.length = 0;
  const assignment = { ...payload, _id: new mongoose.Types.ObjectId(), userId: 'user', generationId: 'old' };
  t.mock.method(Assignment, 'findById', async () => assignment);
  let newGeneration;
  t.mock.method(Assignment, 'findByIdAndUpdate', async (_id, update) => {
    assert.equal(update.$set.status, 'pending');
    assert.equal(update.$set.tokenUsage, 0);
    newGeneration = update.$set.generationId;
    assert.notEqual(newGeneration, 'old');
  });
  t.mock.method(Result, 'deleteMany', async query => {
    assert.equal(query.generationId, 'old');
    assert.ok(newGeneration, 'ownership must rotate before old results are removed');
  });
  const response = await AssignmentService.regenerateAssignment(String(assignment._id));
  assert.equal(queued[0][2], newGeneration);
  assert.equal(response.jobId, 'queued-job');
});

test('polling cannot expose a saved result while the assignment is pending or processing', async t => {
  const get = t.mock.method(redis, 'get', async () => { throw new Error('must not consult stale cache'); });
  for (const status of ['pending', 'processing']) {
    const mock = t.mock.method(Assignment, 'findById', async () => ({ status, generationId: 'generation' }));
    await assert.rejects(AssignmentService.getAssignmentResult('id'), /NOT_FOUND: Result not found/);
    mock.mock.restore();
  }
  assert.equal(get.mock.callCount(), 0);
});

test('only terminal MongoDB failure produces the existing FAILED contract', async t => {
  t.mock.method(Assignment, 'findById', async () => ({ status: 'failed', generationId: 'generation' }));
  await assert.rejects(AssignmentService.getAssignmentResult('id'), /FAILED: Generation failed/);
});

test('a stale cached generation is ignored in favor of the current durable result', async t => {
  t.mock.method(Assignment, 'findById', async () => ({ status: 'completed', generationId: 'new' }));
  t.mock.method(redis, 'get', async () => JSON.stringify({ content: { stale: true }, assignment: { generationId: 'old' } }));
  t.mock.method(Result, 'findOne', query => {
    assert.equal(query.generationId, 'new');
    return { lean: async () => ({ _id: 'result', content: { sections: [] } }) };
  });
  const response = await AssignmentService.getAssignmentResult('id');
  assert.deepEqual(response.content, { sections: [] });
  assert.equal(response.assignment.generationId, 'new');
});

test('legacy completed assignments without generation metadata remain readable', async t => {
  t.mock.method(Assignment, 'findById', async () => ({ status: 'completed' }));
  t.mock.method(redis, 'get', async () => null);
  t.mock.method(Result, 'findOne', query => {
    assert.deepEqual(query.generationId, { $exists: false });
    return { lean: async () => ({ _id: 'legacy-result', content: { sections: [] } }) };
  });
  const response = await AssignmentService.getAssignmentResult('id');
  assert.equal(response._id, 'legacy-result');
});
