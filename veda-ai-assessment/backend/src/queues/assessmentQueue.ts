import { Queue } from 'bullmq';
import redisClient from '../config/redis';

export const assessmentQueue = new Queue('assessment-generation', {
  connection: redisClient,
});

export const addAssessmentJob = async (assignmentId: string, payload: any) => {
  return await assessmentQueue.add('generate', { assignmentId, payload });
};
