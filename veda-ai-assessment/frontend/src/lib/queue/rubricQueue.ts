import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import Rubric from '../models/Rubric';
import { connectToDatabase } from '../mongoose';
import { generateAIContent } from '../llmRouter';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const rubricQueue = new Queue('rubric-generation', { connection });

const runGeminiRubricGeneration = async (assignmentDescription: string) => {
  const prompt = `You are an expert educator. Create a comprehensive grading rubric for the following assignment.
  The rubric should evaluate multiple aspects of the assignment based on its specific requirements.
  
  Assignment Description:
  ${assignmentDescription}

  Return the result ONLY as a valid JSON array of category objects matching this exact structure:
  [
    {
      "title": "Category Name (e.g. Grammar & Spelling)",
      "weight": 20,
      "levels": [
        { "score": 5, "label": "Excellent", "description": "Criteria description..." },
        { "score": 3, "label": "Average", "description": "Criteria description..." },
        { "score": 1, "label": "Poor", "description": "Criteria description..." }
      ]
    }
  ]
  
  Rules:
  1. The total weight of all categories MUST sum exactly to 100.
  2. Each category MUST have at least 3 levels (e.g., Excellent, Average, Poor) with corresponding descending scores.
  3. Do not include markdown formatting like \`\`\`json. Just return the raw JSON array.`;

  const response = await generateAIContent(prompt);
  let jsonText = response.text.trim();
  const tokenUsage = response.tokenUsage;
  
  const firstBracket = jsonText.indexOf('[');
  const lastBracket = jsonText.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    jsonText = jsonText.substring(firstBracket, lastBracket + 1);
  } else {
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  try {
    const rubricData = JSON.parse(jsonText);
    if (!Array.isArray(rubricData) || rubricData.length === 0) {
      throw new Error('Failed to parse rubric from Gemini response.');
    }
    return { rubricData, tokenUsage };
  } catch (err) {
    console.error("Gemini JSON parse failed:", jsonText);
    throw new Error('AI returned an invalid rubric format. Please try again.');
  }
};

// Initialize worker (will start automatically upon import)
export const rubricWorker = new Worker(
  'rubric-generation',
  async (job: Job) => {
    const { rubricId, assignmentDescription } = job.data;
    console.log(`[Worker] Processing rubric generation for ID: ${rubricId}`);

    try {
      await connectToDatabase();

      // 3. Update to PROCESSING
      await Rubric.findByIdAndUpdate(rubricId, { status: 'PROCESSING' });

      // 4. Generate Rubric using Gemini
      console.log(`[Worker] Generating rubric using Gemini for assignment: ${assignmentDescription.substring(0, 50)}...`);
      const { rubricData: generatedRubricData, tokenUsage } = await runGeminiRubricGeneration(assignmentDescription);

      // 5. Save Rubric to MongoDB and mark COMPLETED
      await Rubric.findByIdAndUpdate(rubricId, {
        status: 'COMPLETED',
        criteria: generatedRubricData,
        tokenUsage,
      });

      console.log(`[Worker] Finished rubric generation for ID: ${rubricId}`);
      return { success: true, rubricId };
    } catch (error) {
      console.error(`[Worker] Failed rubric generation for ID: ${rubricId}`, error);
      
      await connectToDatabase();
      await Rubric.findByIdAndUpdate(rubricId, { status: 'FAILED' });
      throw error;
    }
  },
  { connection }
);
