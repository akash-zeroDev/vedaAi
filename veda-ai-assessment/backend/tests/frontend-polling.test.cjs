const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the actual frontend hook with mocked React effects/browser I/O. This
// avoids new frontend test packages while covering the minute-long retry regression.
const source = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/hooks/useAssignmentLifecycle.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function pollingHarness(apiFetch, socket = null) {
  const effects = [], timers = new Map(), statuses = [], navigations = [];
  let sequence = 0;
  const store = { status: 'processing', assignmentId: 'assignment', generationId: 'current-generation',
    setResultData: data => { store.resultData = data; },
    setJobStatus: (status, message) => { statuses.push({ status, message }); },
  };
  const router = { push: url => navigations.push(url) };
  const imports = {
    react: { useEffect: effect => effects.push(effect) },
    'next/navigation': { useRouter: () => router, useParams: () => ({}) },
    'next-auth/react': { useSession: () => ({ data: { user: { id: 'test-user' } } }) },
    '@/store/useAssessmentStore': { useAssessmentStore: () => store },
    '@/store/useSocketStore': { useSocketStore: () => ({ socket, connect: () => {} }) },
    '@/lib/api': { apiFetch },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, require: name => {
      assert.ok(imports[name], `unexpected frontend dependency: ${name}`);
      return imports[name];
    },
    AbortSignal, AbortController,
    console: { warn() {} },
    setTimeout: callback => { const id = ++sequence; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
  });
  exports.useAssignmentLifecycle();
  const socketCleanup = effects[1]();
  const cleanup = effects.at(-1)();
  const step = async () => {
    const [id, callback] = timers.entries().next().value;
    timers.delete(id);
    await callback();
  };
  return { store, timers, statuses, navigations, step, cleanup: () => { cleanup(); socketCleanup?.(); } };
}

test('frontend keeps polling through more than 20 pending results without reporting final failure', async () => {
  let calls = 0;
  const h = pollingHarness(async () => { calls++; return { ok: false, status: 404 }; });
  for (let i = 0; i < 25; i++) await h.step();
  assert.equal(calls, 25);
  assert.equal(h.statuses.length, 0);
  assert.equal(h.timers.size, 1);
  h.cleanup();
  assert.equal(h.timers.size, 0);
});

test('successful polling still stores the result and navigates to the existing output URL', async () => {
  const h = pollingHarness(async () => ({ ok: true, status: 200, json: async () => ({ content: { sections: [] } }) }));
  await h.step();
  assert.equal(h.statuses[0].status, 'success');
  assert.deepEqual(h.navigations, ['/dashboard/output/assignment']);
  assert.equal(h.timers.size, 0);
  assert.ok(h.store.resultData);
  h.cleanup();
});

test('only a terminal failed API response ends polling as an error', async () => {
  const h = pollingHarness(async () => ({ ok: false, status: 400, json: async () => ({ error: 'Generation failed for this assignment.' }) }));
  await h.step();
  assert.equal(h.statuses[0].status, 'error');
  assert.equal(h.timers.size, 0);
  h.cleanup();
});

test('poll requests do not overlap and cancellation aborts in-flight requests and ignores late results', async () => {
  let resolve, signal;
  const h = pollingHarness(async (_url, options) => {
    signal = options.signal;
    return new Promise(done => { resolve = done; });
  });
  const pending = h.step();
  assert.equal(h.timers.size, 0, 'next poll must wait for current request');
  h.cleanup();
  assert.equal(signal.aborted, true);
  resolve({ ok: true, json: async () => ({ content: { sections: [] } }) });
  await pending;
  assert.equal(h.statuses.length, 0);
  assert.equal(h.navigations.length, 0);
  assert.equal(h.timers.size, 0);
});

test('Socket.IO ignores late terminal events from an older generation and preserves current completion navigation', () => {
  let update;
  const socket = { on: (_name, handler) => { update = handler; }, off() {} };
  const h = pollingHarness(async () => ({ ok: false, status: 404 }), socket);
  update({ assignmentId: 'assignment', generationId: 'old-generation', status: 'failed', error: 'Old attempt failed' });
  update({ assignmentId: 'assignment', generationId: 'old-generation', status: 'completed', data: { sections: [] } });
  assert.equal(h.statuses.length, 0);
  assert.equal(h.navigations.length, 0);
  update({ assignmentId: 'assignment', generationId: 'current-generation', status: 'completed', data: { sections: [] } });
  assert.equal(h.statuses[0].status, 'success');
  assert.deepEqual(h.navigations, ['/dashboard/output/assignment']);
  h.cleanup();
});
