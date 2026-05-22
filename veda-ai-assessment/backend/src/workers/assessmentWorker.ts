import { Worker, Job } from 'bullmq';
import redisClient from '../config/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildStructuredPrompt, parseAIResponse } from '../utils/promptBuilder';
import Assignment from '../models/Assignment';
import Result from '../models/Result';
import { io } from '../server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

export const assessmentWorker = new Worker(
  'assessment-generation',
  async (job: Job) => {
    const assignmentId = job.data.assignmentId;
    console.log(`[Worker] Started processing job ${job.id} for assignment ${assignmentId}`);

    try {

      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });


      const prompt = buildStructuredPrompt(job.data.payload);

      console.log(`[Worker] Calling Gemini LLM...`);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log(`[Worker] Parsing LLM response...`);
      const parsedContent = parseAIResponse(responseText);


      const newResult = new Result({
        assignmentId,
        content: parsedContent,
      });
      await newResult.save();


      await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });


      io.emit('assignment:updated', {
        assignmentId,
        status: 'completed',
        data: parsedContent,
      });

      console.log(`[Worker] Finished processing job ${job.id} successfully`);
      return { success: true, resultId: newResult._id };
    } catch (error: any) {
      console.error(`[Worker] Error processing job ${job.id}:`, error);


      if (assignmentId) {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });


        io.emit('assignment:updated', {
          assignmentId,
          status: 'failed',
          error: error.message || 'Unknown error occurred',
        });
      }

      throw error;
    }
  },
  {
    connection: redisClient,
  }
);

assessmentWorker.on('completed', (job) => {
  console.log(`[Worker Shell] Job ${job.id} completed successfully`);
});

assessmentWorker.on('failed', (job, err) => {
  console.error(`[Worker Shell] Job ${job?.id} failed with error:`, err.message);
});
