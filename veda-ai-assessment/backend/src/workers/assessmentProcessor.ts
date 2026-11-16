import type { Job } from 'bullmq';
import { buildStructuredPrompt, parseAIResponse, type AssessmentPayload, type AssessmentResult } from '../utils/promptBuilder';
import { AssessmentAttemptError, PermanentAssessmentError, classifyFailure, maximumAttempts, retryDelay } from '../utils/assessmentRetry';

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export interface AssignmentState {
  _id: unknown;
  userId: string;
  status: AssignmentStatus;
  generationId?: string;
}
export interface StoredResult {
  _id: unknown;
  content: AssessmentResult;
  tokenUsage?: number;
}
export interface AssessmentJobData {
  assignmentId: string;
  generationId?: string;
  payload: AssessmentPayload & { llmHash?: string; fileData?: { type: string; data: string; mimeType?: string } };
}
export type AssessmentJob = Job<AssessmentJobData>;
export interface AssessmentStore {
  loadAssignment(id: string): Promise<AssignmentState | null>;
  loadResult(id: string, generationId?: string): Promise<StoredResult | null>;
  saveResult(id: string, generationId: string | undefined, content: AssessmentResult, tokenUsage: number): Promise<StoredResult>;
  // Atomic compare-and-set; only pending/processing assignments in this generation
  // can transition. A returned document is the claim to emit a terminal event.
  transition(id: string, generationId: string | undefined, status: AssignmentStatus, tokenUsage?: number): Promise<AssignmentState | null>;
}
export interface ProcessorDependencies {
  store: AssessmentStore;
  generate(contents: any[]): Promise<{ text: string; tokenUsage: number }>;
  invalidate(assignmentId: string, userId: string): Promise<unknown>;
  cacheResult?(job: AssessmentJob, content: AssessmentResult): Promise<unknown>;
  emit(event: 'assignment:updated', payload: Record<string, unknown>): void;
  log(fields: Record<string, unknown>): void;
  random?: () => number;
}

export function validAssessment(content: unknown): content is AssessmentResult {
  const value = content as AssessmentResult | undefined;
  return !!value && Array.isArray(value.sections) && value.sections.length > 0 && value.sections.every(section =>
    !!section && typeof (section.sectionTitle ?? section.title) === 'string' &&
    typeof (section.instructions ?? section.instruction ?? '') === 'string' &&
    Array.isArray(section.questions) && section.questions.length > 0 && section.questions.every(q =>
      !!q && typeof (q.questionText ?? q.text) === 'string' && !!(q.questionText ?? q.text)?.trim() && typeof q.difficulty === 'string' &&
      typeof q.marks === 'number' && Number.isFinite(q.marks) && q.marks >= 0 &&
      (q.options === undefined || (Array.isArray(q.options) && q.options.every(option => typeof option === 'string')))));
}

function log(deps: ProcessorDependencies, job: AssessmentJob, fields: Record<string, unknown>) {
  deps.log({ jobId: job.id, assignmentId: job.data.assignmentId, attempt: job.attemptsMade + 1, maxAttempts: maximumAttempts(job), ...fields });
}

async function invalidate(deps: ProcessorDependencies, job: AssessmentJob, userId: string) {
  // A cache outage must not turn an already persisted result into another Gemini call.
  try { await deps.invalidate(job.data.assignmentId, userId); }
  catch { log(deps, job, { event: 'cache_invalidation_failed', category: 'cache', terminal: false }); }
}

function emit(deps: ProcessorDependencies, job: AssessmentJob, payload: Record<string, unknown>) {
  // Socket.IO is best effort. Polling reads the durable MongoDB terminal status.
  try { deps.emit('assignment:updated', { assignmentId: job.data.assignmentId, generationId: job.data.generationId, ...payload }); }
  catch { log(deps, job, { event: 'notification_failed', category: 'socket', terminal: false }); }
}

async function finish(job: AssessmentJob, result: StoredResult, deps: ProcessorDependencies, reusedResult: boolean, attempt = job.attemptsMade + 1) {
  const assignment = await deps.store.transition(job.data.assignmentId, job.data.generationId, 'completed', result.tokenUsage ?? 0);
  if (assignment) {
    emit(deps, job, { status: 'completed', data: result.content });
    await invalidate(deps, job, assignment.userId);
    try { await deps.cacheResult?.(job, result.content); }
    catch { log(deps, job, { event: 'result_cache_write_failed', category: 'cache', terminal: false }); }
  }
  log(deps, job, { event: 'generation_completed', attempt, outcome: assignment ? 'completed' : 'already_finalized_or_superseded', reusedResult, terminal: true, transient: false, nextRetryDelayMs: null });
  return { success: true, resultId: String(result._id) };
}

export function createAssessmentProcessor(deps: ProcessorDependencies) {
  return async (job: AssessmentJob) => {
    log(deps, job, { event: 'attempt_started', outcome: 'processing', terminal: false });
    try {
      const assignment = await deps.store.loadAssignment(job.data.assignmentId);
      if (!assignment) throw new PermanentAssessmentError({ category: 'assignment_missing', retryable: false });
      if (assignment.generationId !== job.data.generationId) {
        log(deps, job, { event: 'generation_superseded', outcome: 'superseded', terminal: true });
        return { success: false, superseded: true };
      }
      const existing = await deps.store.loadResult(job.data.assignmentId, job.data.generationId);
      if (existing && validAssessment(existing.content)) return await finish(job, existing, deps, true);
      if (existing) throw new PermanentAssessmentError({ category: 'invalid_persisted_result', retryable: false });
      const active = await deps.store.transition(job.data.assignmentId, job.data.generationId, 'processing');
      if (!active) throw new PermanentAssessmentError({ category: 'assignment_already_terminal', retryable: false });

      const basePrompt = buildStructuredPrompt(job.data.payload);
      const file = job.data.payload.fileData;
      const contents = file?.type === 'inline'
        ? [{ inlineData: { data: file.data, mimeType: file.mimeType } }, basePrompt]
        : [file?.type === 'text' ? basePrompt + '\n\nSource Material:\n' + file.data : basePrompt];
      const { text, tokenUsage } = await deps.generate(contents);
      const parsedContent = parseAIResponse(text);
      if (!validAssessment(parsedContent)) throw new PermanentAssessmentError({ category: 'invalid_response', retryable: false });

      // Regeneration may have superseded this job while Gemini was running.
      const current = await deps.store.loadAssignment(job.data.assignmentId);
      if (!current || current.generationId !== job.data.generationId) {
        log(deps, job, { event: 'generation_superseded', outcome: 'superseded', terminal: true });
        return { success: false, superseded: true };
      }
      const result = await deps.store.saveResult(job.data.assignmentId, job.data.generationId, parsedContent, tokenUsage);
      return await finish(job, result, deps, false);
    } catch (error: unknown) {
      const failure = classifyFailure(error);
      const willRetry = failure.retryable && job.attemptsMade + 1 < maximumAttempts(job);
      const delay = willRetry ? retryDelay(job.attemptsMade + 1, failure, deps.random) : null;
      if (willRetry) {
        try {
          const pending = await deps.store.transition(job.data.assignmentId, job.data.generationId, 'pending');
          if (pending) await invalidate(deps, job, pending.userId);
        } catch {
          log(deps, job, { event: 'retry_status_sync_failed', category: 'persistence', terminal: false });
        }
      }
      log(deps, job, { event: 'attempt_failed', category: failure.category, httpStatus: failure.httpStatus ?? null,
        transient: failure.retryable, terminal: !willRetry, nextRetryDelayMs: delay,
        outcome: willRetry ? 'awaiting_retry' : 'awaiting_terminal_transition' });
      // Safe messages only: BullMQ persists these in failedReason/stacktrace.
      if (!willRetry) throw new PermanentAssessmentError(failure);
      throw new AssessmentAttemptError(failure, delay!);
    }
  };
}

/** Worker 'failed' fires for every attempt, including retries. Check the actual
 * native state AFTER moveToFailed before making MongoDB/user state terminal.
 */
export async function handleAssessmentFailure(job: AssessmentJob, error: unknown, deps: ProcessorDependencies) {
  if (await job.getState() !== 'failed') return;
  const failure = classifyFailure(error);
  const assignment = await deps.store.loadAssignment(job.data.assignmentId);
  if (!assignment || assignment.generationId !== job.data.generationId) return;
  if (assignment.status === 'completed' || assignment.status === 'failed') return;
  const existing = await deps.store.loadResult(job.data.assignmentId, job.data.generationId);
  // Includes failures after saving the result, or before BullMQ acknowledged it.
  if (existing && validAssessment(existing.content)) {
    await finish(job, existing, deps, true, job.attemptsMade || 1);
    return;
  }
  const failed = await deps.store.transition(job.data.assignmentId, job.data.generationId, 'failed');
  if (failed) {
    emit(deps, job, { status: 'failed', error: 'Generation failed for this assignment. Please try regenerating.' });
    await invalidate(deps, job, failed.userId);
  }
  log(deps, job, { event: 'generation_failed', attempt: job.attemptsMade || 1, category: failure.category,
    httpStatus: failure.httpStatus ?? null, transient: failure.retryable, terminal: true, nextRetryDelayMs: null,
    outcome: failed ? 'failed' : 'already_finalized' });
}

/** Repair a crash/DB outage between BullMQ's terminal transition and MongoDB's.
 * Bounded, paginated metadata reconciliation only: never executes a processor,
 * calls Gemini, retries a failed BullMQ job, or deletes historical records.
 */
export async function reconcileFailedBatch(
  queue: { getFailed(start: number, end: number): Promise<AssessmentJob[]> },
  deps: ProcessorDependencies,
  offset = 0,
): Promise<number> {
  const jobs = await queue.getFailed(offset, offset + 49);
  for (const job of jobs) {
    try { await handleAssessmentFailure(job, new Error('Terminal queue failure'), deps); }
    catch {
      log(deps, job, { event: 'terminal_status_sync_failed', attempt: job.attemptsMade || 1,
        category: 'persistence', outcome: 'reconciliation_required' });
    }
  }
  return jobs.length === 50 ? offset + 50 : 0;
}
