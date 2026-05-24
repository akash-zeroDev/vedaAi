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


      const basePrompt = buildStructuredPrompt(job.data.payload);

      let contents: any[] = [basePrompt];
      
      if (job.data.payload.fileData) {
        if (job.data.payload.fileData.type === 'inline') {
          const filePart = {
            inlineData: {
              data: job.data.payload.fileData.data,
              mimeType: job.data.payload.fileData.mimeType,
            }
          };
          contents = [filePart, basePrompt];
        } else if (job.data.payload.fileData.type === 'text') {
          const combinedPrompt = basePrompt + "\n\nSource Material:\n" + job.data.payload.fileData.data;
          contents = [combinedPrompt];
        }
      }

      console.log(`[Worker] Calling Gemini LLM...`);
      const result = await model.generateContent(contents);
      const responseText = result.response.text();

      console.log(`[Worker] Parsing LLM response...`);
      const parsedContent = parseAIResponse(responseText);


      const newResult = new Result({
        assignmentId,
        content: parsedContent,
      });
      await newResult.save();

      // Save to LLM Cache to instantly resolve duplicate requests in the future
      if (job.data.llmHash) {
        await redisClient.set(`llm_cache:${job.data.llmHash}`, JSON.stringify(parsedContent), 'EX', 2592000); // 30 days
      }

      await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });

      // Invalidate caches since the status changed and a result was created
      await redisClient.del('assignments:all');
      await redisClient.del(`assignment:result:${assignmentId}`);

      io.emit('assignment:updated', {
        assignmentId,
        status: 'completed',
        data: parsedContent,
      });

      console.log(`[Worker] Finished processing job ${job.id} successfully`);
      return { success: true, resultId: newResult._id };
    } catch (error: unknown) {
      console.error(`[Worker] Error processing job ${job.id}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (assignmentId) {
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        
        // Invalidate cache so the UI reflects the failed status
        await redisClient.del('assignments:all');
        await redisClient.del(`assignment:result:${assignmentId}`);

        io.emit('assignment:updated', {
          assignmentId,
          status: 'failed',
          error: errorMessage,
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
