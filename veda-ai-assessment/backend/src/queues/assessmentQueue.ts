import { Queue } from 'bullmq';
import redisClient from '../config/redis';
import type { AssessmentPayload } from '../utils/promptBuilder';
import { ASSESSMENT_JOB_OPTIONS } from '../utils/assessmentRetry';

export const assessmentQueue = new Queue('assessment-generation', {
  connection: redisClient,
  defaultJobOptions: ASSESSMENT_JOB_OPTIONS,
});

export const addAssessmentJob = async (assignmentId: string, payload: AssessmentPayload, generationId?: string) => {
  return await assessmentQueue.add('generate', { assignmentId, payload, generationId });
};
