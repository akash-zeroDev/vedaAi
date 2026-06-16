import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import Summary from '../models/Summary';
import { connectToDatabase } from '../mongoose';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
const { PDFParse } = require('pdf-parse');
import { generateAIContent } from '../llmRouter';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const summaryQueue = new Queue('summary-generation', { connection });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const runGeminiSummaryGeneration = async (rawText: string) => {
  const prompt = `You are an expert educator. Create a comprehensive, well-structured lesson summary for the following text.
  
  The output MUST be in Markdown format and include exactly the following sections:
  # Core Themes
  (A concise paragraph outlining the main ideas of the text)

  ## Key Vocabulary
  (A bulleted list of 5-8 crucial terms from the text with brief definitions)

  ## Executive Summary
  (A deeper 2-3 paragraph summary of the text's contents, structure, and conclusions)

  Text to summarize:
  ${rawText}
  `;

  const response = await generateAIContent(prompt);
  return {
    generatedMarkdown: response.text.trim(),
    tokenUsage: response.tokenUsage,
  };
};

export const summaryWorker = new Worker(
  'summary-generation',
  async (job: Job) => {
    const { summaryId, fileUrl } = job.data;
    console.log(`[Worker] Processing summary generation for ID: ${summaryId}`);

    try {
      await connectToDatabase();

      // 1. Update to PARSING
      await Summary.findByIdAndUpdate(summaryId, { status: 'PARSING' });

      // 2. Download and Parse PDF from S3
      console.log(`[Worker] Downloading and parsing PDF from S3: ${fileUrl}`);
      // fileUrl is the S3 key we saved
      const getObjectCmd = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileUrl,
      });

      const response = await s3Client.send(getObjectCmd);
      if (!response.Body) {
        throw new Error('Failed to download document from S3.');
      }

      const byteArray = await response.Body.transformToByteArray();
      const buffer = Buffer.from(byteArray);
      
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("Downloaded S3 file is not a valid buffer or is empty");
      }

      // pdf-parse v2 exact API: pass buffer as { data: buffer } to constructor
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      const rawText = pdfData.text;

      if (!rawText || rawText.trim() === '') {
        throw new Error('No readable text found in the document.');
      }

      // 3. Update to PROCESSING
      await Summary.findByIdAndUpdate(summaryId, { status: 'PROCESSING' });

      // 4. Generate Summary using Gemini
      console.log(`[Worker] Generating summary using Gemini...`);
      const { generatedMarkdown, tokenUsage } = await runGeminiSummaryGeneration(rawText);

      // 5. Save Summary to MongoDB and mark COMPLETED
      await Summary.findByIdAndUpdate(summaryId, {
        status: 'COMPLETED',
        summaryMarkdown: generatedMarkdown,
        tokenUsage,
      });

      console.log(`[Worker] Finished summary generation for ID: ${summaryId}`);
      return { success: true, summaryId };
    } catch (error) {
      console.error(`[Worker] Failed summary generation for ID: ${summaryId}`, error);
      
      await connectToDatabase();
      await Summary.findByIdAndUpdate(summaryId, { status: 'FAILED' });
      throw error;
    }
  },
  { connection }
);
