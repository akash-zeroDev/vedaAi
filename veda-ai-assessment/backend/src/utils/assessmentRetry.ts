import { GoogleGenerativeAIFetchError, GoogleGenerativeAIAbortError, GoogleGenerativeAIRequestInputError, GoogleGenerativeAIResponseError } from '@google/generative-ai';
import { UnrecoverableError, type JobsOptions } from 'bullmq';

export const MAX_ATTEMPTS = 3;
export const BASE_DELAY_MS = 2_000;
export const MAX_PROVIDER_DELAY_MS = 120_000;
export const BACKOFF_TYPE = 'assessment-provider';
export const ASSESSMENT_JOB_OPTIONS: JobsOptions = {
  attempts: MAX_ATTEMPTS,
  backoff: { type: BACKOFF_TYPE, delay: BASE_DELAY_MS },
};

export interface Failure {
  category: string;
  retryable: boolean;
  httpStatus?: number;
  retryAfterMs?: number;
}

type RecordValue = Record<string, any>;
const record = (value: unknown): RecordValue => value !== null && typeof value === 'object' ? value as RecordValue : {};

export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | undefined {
  if (!value?.trim()) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}

function durationMs(value: unknown): number | undefined {
  if (typeof value === 'string' && /^\d+(?:\.\d+)?s$/.test(value)) return Math.ceil(parseFloat(value) * 1000);
  const duration = record(value);
  if (duration.seconds !== undefined || duration.nanos !== undefined) {
    const ms = Number(duration.seconds ?? 0) * 1000 + Number(duration.nanos ?? 0) / 1e6;
    if (Number.isFinite(ms) && ms >= 0) return Math.ceil(ms);
  }
  return undefined;
}

/** Inspect the installed SDK's status/errorDetails, including google.rpc details.
 * Text is only a fallback for old responses without structured quota metadata.
 * Never return the raw provider message (SDK messages can include URLs/content).
 */
export function classifyFailure(error: unknown): Failure {
  if (error instanceof AssessmentAttemptError || error instanceof PermanentAssessmentError) return error.failure;
  const e = record(error);
  const status = error instanceof GoogleGenerativeAIFetchError ? error.status : e.status ?? e.response?.status ?? e.error?.code;
  const httpStatus = typeof status === 'number' ? status : undefined;
  const rawDetails = e.errorDetails ?? e.error?.details ?? e.details;
  const details: RecordValue[] = Array.isArray(rawDetails) ? rawDetails.map(record) : [];
  const violations = details.filter(d => String(d['@type']).endsWith('google.rpc.QuotaFailure'))
    .flatMap(d => Array.isArray(d.violations) ? d.violations.map(record) : []);
  const quotaText = violations.map(v => [v.quotaId, v.quotaMetric, v.description, v.subject].join(' ')).join(' ');
  const delays = details.filter(d => String(d['@type']).endsWith('google.rpc.RetryInfo'))
    .map(d => durationMs(d.retryDelay));
  const headers = e.headers ?? e.response?.headers;
  const retryHeader = typeof headers?.get === 'function' ? headers.get('retry-after') : headers?.['retry-after'];
  delays.push(parseRetryAfter(retryHeader));
  if (Number.isFinite(e.retryAfterMs) && e.retryAfterMs >= 0) delays.push(e.retryAfterMs);
  const validDelays = delays.filter((delay): delay is number => delay !== undefined && Number.isFinite(delay));
  const retryAfterMs = validDelays.length ? Math.max(...validDelays) : undefined;
  const failure = (category: string, retryable: boolean, delay = retryAfterMs): Failure => ({
    category, retryable, ...(httpStatus !== undefined && { httpStatus }), ...(delay !== undefined && { retryAfterMs: delay }),
  });

  if (httpStatus === 401 || httpStatus === 403) return failure('credentials_or_permissions', false);
  if (httpStatus === 400 || error instanceof GoogleGenerativeAIRequestInputError) return failure('invalid_request', false);
  if (httpStatus === 408) return failure('timeout', true);
  if (httpStatus === 429) {
    // Daily exhaustion overrides RetryInfo: Gemini sometimes supplies both.
    const daily = /per[\s_/-]*day|daily|\brpd\b|\btpd\b/i;
    if (daily.test(quotaText) || daily.test(String(e.message ?? '')) || e.error?.code === 'quota_exceeded') return failure('daily_quota', false);
    if (violations.some(v => String(v.quotaValue) === '0')) return failure('quota_unavailable', false);
    const minuteQuota = /per[\s_/-]*minute|\brpm\b|\btpm\b/i.test(quotaText);
    const secondQuota = /per[\s_/-]*second/i.test(quotaText);
    const delay = retryAfterMs ?? (minuteQuota ? 60_000 : secondQuota ? 1_000 : undefined);
    if (delay === undefined) return failure('quota_unknown', false);
    if (delay > MAX_PROVIDER_DELAY_MS) return failure('retry_delay_exceeds_budget', false, delay);
    return failure('temporary_quota', true, delay);
  }
  if ([500, 502, 503, 504].includes(httpStatus ?? 0)) {
    return failure(retryAfterMs !== undefined && retryAfterMs > MAX_PROVIDER_DELAY_MS ? 'retry_delay_exceeds_budget' : 'provider_unavailable',
      retryAfterMs === undefined || retryAfterMs <= MAX_PROVIDER_DELAY_MS);
  }
  if (error instanceof GoogleGenerativeAIAbortError || e.name === 'AbortError' || e.name === 'TimeoutError') return failure('timeout', true);
  const code = String(e.code ?? e.cause?.code ?? '');
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET'].includes(code)) return failure('network', true);
  if (['MongoNetworkError', 'MongoNetworkTimeoutError', 'MongoServerSelectionError', 'MongoOperationTimeoutError'].includes(String(e.name))) return failure('persistence_unavailable', true);
  if (error instanceof GoogleGenerativeAIResponseError || e.name === 'SyntaxError') return failure('invalid_response', false);
  return failure('unknown', false);
}

export class AssessmentAttemptError extends Error {
  constructor(public readonly failure: Failure, public readonly retryDelayMs: number) {
    super(`Assessment attempt failed: ${failure.category}`);
    this.name = 'AssessmentAttemptError';
  }
}

export class PermanentAssessmentError extends UnrecoverableError {
  constructor(public readonly failure: Failure) {
    super(`Assessment generation stopped: ${failure.category}`);
    // BullMQ checks instanceof UnrecoverableError; keep its name for serialized errors too.
    this.name = 'UnrecoverableError';
  }
}

export function retryDelay(attempt: number, failure: Failure, random = Math.random): number {
  const exponential = BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const floor = Math.max(exponential, failure.retryAfterMs ?? 0);
  // Positive jitter never undercuts the provider's minimum delay.
  const spread = Math.max(0, Math.min(exponential * 0.5, MAX_PROVIDER_DELAY_MS - floor));
  return Math.ceil(floor + Math.max(0, Math.min(1, random())) * spread);
}

/** Called by BullMQ when it atomically schedules a delayed retry. */
export function assessmentBackoff(attemptsMade: number, _type?: string, error?: Error): number {
  const failure = classifyFailure(error);
  if (!failure.retryable) return -1;
  return error instanceof AssessmentAttemptError ? error.retryDelayMs : retryDelay(attemptsMade, failure);
}

export function maximumAttempts(job: { opts: { attempts?: number } }): number {
  return Math.max(1, Math.min(MAX_ATTEMPTS, job.opts.attempts || 1));
}
