const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GoogleGenerativeAIFetchError } = require('@google/generative-ai');
const { generateAIContent } = require('../src/utils/llmRouter');
const { classifyFailure } = require('../src/utils/assessmentRetry');

test('Gemini transport preserves the model, schema, inline material and total tokens', async t => {
  const schema = { type: 'object', properties: { sections: { type: 'array' } } };
  const inline = { inlineData: { mimeType: 'application/pdf', data: 'mock-only' } };
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    assert.ok(!url.includes('key='));
    const body = JSON.parse(options.body);
    assert.deepEqual(body.contents, [{ role: 'user', parts: [inline, { text: 'prompt unchanged' }] }]);
    assert.deepEqual(body.generationConfig, { responseMimeType: 'application/json', responseSchema: schema });
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"sections":[]}' }] } }], usageMetadata: { totalTokenCount: 12 } }));
  });
  assert.deepEqual(await generateAIContent([inline, 'prompt unchanged'], schema), { text: '{"sections":[]}', tokenUsage: 12 });
  assert.equal(calls, 1);
});

test('HTTP failure retains SDK errorDetails and Retry-After without logging URLs, prompts or keys', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: 'sensitive source and credentials', details: [
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '10s' },
    ] } }), { status: 429, headers: { 'Retry-After': '30' } });
  });
  await assert.rejects(generateAIContent(['sensitive source']), error => {
    assert.ok(error instanceof GoogleGenerativeAIFetchError);
    assert.equal(error.status, 429);
    assert.equal(error.errorDetails.length, 1);
    assert.equal(classifyFailure(error).retryAfterMs, 30000);
    assert.doesNotMatch(error.message, /sensitive|credentials|https|key=/);
    return true;
  });
  assert.equal(calls, 1, 'transport must never add hidden retries');
});

test('network error preserves structured cause for retry classification', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed', { cause: { code: 'ETIMEDOUT' } }); });
  await assert.rejects(generateAIContent(['prompt']), error => classifyFailure(error).retryable);
});

test('blocked or empty model output is permanent rather than repeatedly billed', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] })));
  await assert.rejects(generateAIContent(['prompt']), error => classifyFailure(error).category === 'invalid_response' && !classifyFailure(error).retryable);
});
