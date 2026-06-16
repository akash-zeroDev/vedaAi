import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import Analysis from '../models/Analysis';
import { connectToDatabase } from '../mongoose';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
const { PDFParse } = require('pdf-parse');
import { generateAIContent } from '../llmRouter';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const analysisQueue = new Queue('analysisQueue', { connection });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const runGeminiAnalysis = async (rawText: string) => {
  const model = getGeminiModel();

  // Step 1: Classification
  const classificationPrompt = `Analyze the following text and determine if it contains a list of questions, an exam, a quiz, or an assignment with problems to solve. 
  If it does NOT contain questions (e.g. it is a syllabus, PRD, regular article, or random text), respond with exactly "NO".
  If it DOES contain questions, respond with exactly "YES".
  
  Text to analyze:
  ${rawText.substring(0, 5000)}...`;

  const classRes = await generateAIContent(classificationPrompt);
  const classText = classRes.text.trim().toUpperCase();
  const classTokens = classRes.tokenUsage;

  if (classText.includes('NO')) {
    throw new Error('Invalid Document: This does not appear to be a question paper or assignment. Please upload a document containing questions.');
  }

  // Step 2: Extraction & Analysis
  const analysisPrompt = `Extract the actual questions from the following text (ignore headers, instructions, and noise). 
  For each question, evaluate its cognitive difficulty and categorize it as "Easy", "Medium", or "Hard".
  Assign a calculatedScore from 1 to 10 (1 being easiest, 10 being hardest).
  Provide a short aiJustification (1-2 sentences) explaining why it received that difficulty rating.

  IMPORTANT: When the question contains mathematical expressions, preserve them using LaTeX notation enclosed in dollar signs:
  - Inline math: $expression$ (e.g. $\\sum_{n=1}^{\\infty}$, $\\sqrt{x}$, $\\frac{1}{n}$)
  - Block math: $$expression$$ (for standalone equations)
  
  Return the result ONLY as a valid JSON array of objects matching this exact structure:
  [
    {
      "questionText": "The extracted question with $math$ preserved as LaTeX...",
      "category": "Easy|Medium|Hard",
      "calculatedScore": 5,
      "aiJustification": "Reasoning..."
    }
  ]
  
  Do not include markdown formatting like \`\`\`json. Just return the raw JSON array.

  Text to analyze:
  ${rawText}`;

  const analysisRes = await generateAIContent(analysisPrompt);
  let jsonText = analysisRes.text.trim();
  const analysisTokens = analysisRes.tokenUsage;
  
  const firstBrace = jsonText.indexOf('[');
  const lastBrace = jsonText.lastIndexOf(']');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  } else {
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  try {
    const analyzedQuestions = JSON.parse(jsonText);
    if (!Array.isArray(analyzedQuestions) || analyzedQuestions.length === 0) {
      throw new Error('Failed to parse questions from the document.');
    }
    return {
      analyzedQuestions,
      tokenUsage: classTokens + analysisTokens
    };
  } catch (err) {
    console.error("Gemini JSON parse failed:", jsonText);
    throw new Error('AI returned an invalid format. Please try again.');
  }
};

// Prevent duplicate workers during Next.js hot-reloading
const globalForWorker = global as unknown as { analysisWorker: Worker };

const worker = globalForWorker.analysisWorker || new Worker(
  'analysisQueue',
  async (job: Job) => {
    const { analysisId, questions, s3Key } = job.data;

    try {
      await connectToDatabase();
      
      // Mark as PROCESSING
      await Analysis.findByIdAndUpdate(analysisId, { status: 'PROCESSING' });

      let rawText = '';
      if (questions && questions.length > 0) {
        rawText = questions.join('\n\n');
      }

      // If an S3 Key is provided, download and parse the PDF
      if (s3Key) {
        console.log(`Downloading document from S3: ${s3Key}`);
        const getObjectCmd = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
        });

        const response = await s3Client.send(getObjectCmd);
        
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();
          const buffer = Buffer.from(byteArray);
          
          console.log(`Parsing PDF document (Size: ${buffer.length} bytes)...`);
          
          if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
            throw new Error("Downloaded S3 file is not a valid buffer or is empty");
          }

          // pdf-parse v2 exact API: pass buffer as { data: buffer } to constructor
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          await parser.destroy();
          rawText = pdfData.text;
        }
      }

      if (!rawText || rawText.trim() === '') {
        throw new Error('No questions or readable text found to analyze. Document may be empty or unreadable.');
      }

      // 1. Intelligent Classification & Analysis via Gemini
      const { analyzedQuestions, tokenUsage } = await runGeminiAnalysis(rawText);

      // Calculate stats
      let totalScore = 0;
      let easyCount = 0;
      let mediumCount = 0;
      let hardCount = 0;

      for (const q of analyzedQuestions) {
        totalScore += q.calculatedScore;
        if (q.category === 'Easy') easyCount++;
        else if (q.category === 'Medium') mediumCount++;
        else if (q.category === 'Hard') hardCount++;
      }

      const averageScore = analyzedQuestions.length > 0 ? Number((totalScore / analyzedQuestions.length).toFixed(1)) : 0;

      const overallStats = {
        averageScore,
        easyCount,
        mediumCount,
        hardCount,
      };

      // Save results
      await Analysis.findByIdAndUpdate(analysisId, {
        status: 'COMPLETED',
        overallStats,
        analyzedQuestions,
        tokenUsage,
      });

      console.log(`Analysis job ${job.id} completed successfully for document ${analysisId}.`);
    } catch (error) {
      console.error(`Analysis job ${job.id} failed:`, error);
      await connectToDatabase();
      await Analysis.findByIdAndUpdate(analysisId, { status: 'FAILED' });
      throw error;
    }
  },
  { connection }
);

if (process.env.NODE_ENV !== 'production') {
  globalForWorker.analysisWorker = worker;
}

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with error ${err.message}`);
});
