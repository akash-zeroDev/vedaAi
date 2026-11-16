import { Worker } from 'bullmq';
import redisClient from '../config/redis';
import { SchemaType } from '@google/generative-ai';
import { io } from '../server';
import { generateAIContent } from '../utils/llmRouter';
import { assessmentBackoff, maximumAttempts } from '../utils/assessmentRetry';
import { assessmentStore } from './assessmentPersistence';
import { assessmentQueue } from '../queues/assessmentQueue';
import { createAssessmentProcessor, handleAssessmentFailure, reconcileFailedBatch, type ProcessorDependencies } from './assessmentProcessor';

const assignmentSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sectionTitle: { type: SchemaType.STRING },
          instructions: { type: SchemaType.STRING },
          questions: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    questionText: { type: SchemaType.STRING },
                    difficulty: { type: SchemaType.STRING },
                    marks: { type: SchemaType.NUMBER },
                    options: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING }
                    }
                  },
                  required: ["questionText", "difficulty", "marks", "options"]
                }
              }
            },
            required: ["sectionTitle", "instructions", "questions"]
          }
        }
      },
      required: ["sections"]
};

async function cacheOperation<T>(operation: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Cache operation timed out')), 2_000);
    })]);
  } finally { clearTimeout(timer); }
}

const dependencies: ProcessorDependencies = {
  store: assessmentStore,
  generate: contents => generateAIContent(contents, assignmentSchema),
  invalidate: (id, userId) => cacheOperation(redisClient.del('assignments:all', `assignments:user:${userId}`, `assignment:result:${id}`)),
  cacheResult: (job, content) => {
    const hash = job.data.payload.llmHash;
    return hash ? cacheOperation(redisClient.set(`llm_cache:${hash}`, JSON.stringify(content), 'EX', 2592000)) : Promise.resolve();
  },
  emit: (event, payload) => { io.emit(event, payload); },
  log: fields => { console.log(JSON.stringify({ component: 'assessment-worker', ...fields })); },
};

export const assessmentWorker = new Worker('assessment-generation', createAssessmentProcessor(dependencies), {
  connection: redisClient,
  concurrency: 2,
  settings: { backoffStrategy: assessmentBackoff },
});

assessmentWorker.on('failed', (job, error) => {
  if (!job) return;
  void handleAssessmentFailure(job, error, dependencies).catch(() => {
    dependencies.log({ event: 'terminal_status_sync_failed', jobId: job.id, assignmentId: job.data.assignmentId,
      attempt: job.attemptsMade, maxAttempts: maximumAttempts(job), category: 'persistence', outcome: 'reconciliation_required' });
  });
});

// Avoid the default unhandled EventEmitter error, and never print raw Redis/SDK errors.
assessmentWorker.on('error', () => {
  dependencies.log({ event: 'worker_error', category: 'queue_infrastructure', outcome: 'worker_waiting_for_recovery' });
});

let reconciling = false;
let failedOffset = 0;
async function reconcile() {
  if (reconciling) return;
  reconciling = true;
  try { failedOffset = await reconcileFailedBatch(assessmentQueue, dependencies, failedOffset); }
  catch { dependencies.log({ event: 'terminal_reconciliation_unavailable', category: 'queue_infrastructure' }); }
  finally { reconciling = false; }
}
assessmentWorker.on('ready', () => { void reconcile(); });
const reconciliationTimer = setInterval(() => { void reconcile(); }, 60_000);
reconciliationTimer.unref();
assessmentWorker.on('closed', () => { clearInterval(reconciliationTimer); });
