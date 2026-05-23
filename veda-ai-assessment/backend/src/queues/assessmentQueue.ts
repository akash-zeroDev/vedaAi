import { Queue } from 'bullmq';
import redisClient from '../config/redis';
import type { AssessmentPayload } from '../utils/promptBuilder';

export const assessmentQueue = new Queue('assessment-generation', {
  connection: redisClient,
});

export const addAssessmentJob = async (assignmentId: string, payload: AssessmentPayload) => {
  return await assessmentQueue.add('generate', { assignmentId, payload });
};
