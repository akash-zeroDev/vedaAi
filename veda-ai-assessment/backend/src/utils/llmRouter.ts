import { GoogleGenerativeAIFetchError, GoogleGenerativeAIResponseError } from '@google/generative-ai';
import { parseRetryAfter } from './assessmentRetry';

export const GEMINI_TIMEOUT_MS = 60_000;

export async function generateAIContent(
  contents: any[],
  useJsonSchema?: any
): Promise<{ text: string; tokenUsage: number }> {
  // @google/generative-ai 0.24.1 discards HTTP headers when constructing its
  // FetchError. Use the same REST request/schema, preserving Retry-After and the
  // SDK's structured status/errorDetails. One HTTP call only; BullMQ owns retries.
  // Keep the API key in a header, never in an error-prone/logged URL.
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: contents.map(part => typeof part === 'string' ? { text: part } : part) }],
      ...(useJsonSchema && { generationConfig: { responseMimeType: 'application/json', responseSchema: useJsonSchema } }),
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as any;
    const error = new GoogleGenerativeAIFetchError('Gemini request failed', response.status, response.statusText, body.error?.details) as GoogleGenerativeAIFetchError & { retryAfterMs?: number };
    error.retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
    throw error;
  }
  const body = await response.json() as any;
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts?.map((part: any) => part.text || '').join('') || '';
  if (!text || (candidate.finishReason && !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason))) {
    throw new GoogleGenerativeAIResponseError('Gemini returned no usable assessment', {});
  }
  return {
    text,
    tokenUsage: body.usageMetadata?.totalTokenCount || 0,
  };
}
