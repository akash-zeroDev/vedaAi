import { Queue } from 'bullmq';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('Missing REDIS_URL');

const redisClient = new Redis(redisUrl);
const assessmentQueue = new Queue('assessment-generation', { connection: redisClient });

async function check() {
  const active = await assessmentQueue.getActiveCount();
  const waiting = await assessmentQueue.getWaitingCount();
  const failed = await assessmentQueue.getFailedCount();
  const completed = await assessmentQueue.getCompletedCount();
  console.log(`Active: ${active}, Waiting: ${waiting}, Failed: ${failed}, Completed: ${completed}`);
  
  const failedJobs = await assessmentQueue.getFailed();
  if (failedJobs.length > 0) {
    console.log("Last failed job error:");
    console.log(failedJobs[0].failedReason);
  }
  process.exit(0);
}
check();
