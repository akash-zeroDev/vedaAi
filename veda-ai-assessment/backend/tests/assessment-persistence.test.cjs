const { test } = require('node:test');
const assert = require('node:assert/strict');
const Result = require('../src/models/Result').default;
const Assignment = require('../src/models/Assignment').default;
const { assessmentStore, resultId, generationFilter } = require('../src/workers/assessmentPersistence');

test('result IDs are stable per generation; historical documents need no unique-index migration', () => {
  assert.equal(String(resultId('assignment', 'generation')), String(resultId('assignment', 'generation')));
  assert.notEqual(String(resultId('assignment', 'generation-1')), String(resultId('assignment', 'generation-2')));
  assert.deepEqual(generationFilter(), { generationId: { $exists: false } });
});

test('result persistence uses atomic insert-only upsert on the unique MongoDB _id', async t => {
  const rows = new Map();
  let selector;
  t.mock.method(Result, 'findOneAndUpdate', (filter, update, options) => {
    selector = filter;
    assert.equal(options.upsert, true);
    assert.equal(options.new, true);
    assert.equal(options.runValidators, true);
    assert.deepEqual(Object.keys(update), ['$setOnInsert']);
    const key = String(filter._id);
    if (!rows.has(key)) rows.set(key, { _id: filter._id, ...update.$setOnInsert });
    return { lean: async () => rows.get(key) };
  });
  const first = await assessmentStore.saveResult('assignment', 'generation', { sections: [] }, 42);
  const second = await assessmentStore.saveResult('assignment', 'generation', { sections: ['do not overwrite'] }, 99);
  assert.equal(String(selector._id), String(resultId('assignment', 'generation')));
  assert.equal(first, second);
  assert.equal(rows.size, 1);
  assert.equal(second.tokenUsage, 42);
});

test('a duplicate-key upsert race reads the winning durable result', async t => {
  t.mock.method(Result, 'findOneAndUpdate', () => ({ lean: async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); } }));
  t.mock.method(Result, 'findOne', filter => ({ lean: async () => ({ _id: filter._id, content: { sections: [] }, tokenUsage: 42 }) }));
  const result = await assessmentStore.saveResult('assignment', 'generation', { sections: [] }, 99);
  assert.equal(result.tokenUsage, 42);
});

test('status transition atomically guards generation and terminal status', async t => {
  t.mock.method(Assignment, 'findOneAndUpdate', (selector, update, options) => {
    assert.deepEqual(selector, { _id: 'assignment', generationId: 'generation', status: { $in: ['pending', 'processing'] } });
    assert.deepEqual(update, { $set: { status: 'completed', tokenUsage: 42 } });
    assert.equal(options.new, true);
    return { lean: async () => null };
  });
  assert.equal(await assessmentStore.transition('assignment', 'generation', 'completed', 42), null);
});
