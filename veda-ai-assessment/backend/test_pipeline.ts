import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Result from './src/models/Result';
import Assignment from './src/models/Assignment';
import { buildStructuredPrompt, parseAIResponse } from './src/utils/promptBuilder';

config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || '');
  console.log("Mongo connected");

  const jobPayload = {
    title: "Waveguide Impedance Direct Script Test",
    dueDate: "2026-12-31T23:59:59Z",
    questionTypes: [{"type":"Short Answer","count":1,"marks":5}],
    totalQuestions: 1,
    totalMarks: 5,
    instructions: "Generate a question containing the exact formula: Z_TE = \\frac{\\eta}{\\sqrt{1-(\\frac{f_c}{f})^2}}"
  };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
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
      }
    }
  });

  const basePrompt = buildStructuredPrompt(jobPayload as any);
  console.log("Calling Gemini...");
  const result = await model.generateContent([basePrompt]);
  const responseText = result.response.text();
  
  console.log("\n====== TRACE-A ======");
  console.log(JSON.stringify(responseText));

  let parsedContent;
  const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    parsedContent = JSON.parse(cleanedText);
    console.log("\n====== TRACE-B ======");
    console.log(JSON.stringify(parsedContent?.sections?.[0]?.questions?.[0]));
  } catch (err) {
    console.log("Failed to parse", err);
  }

  console.log("\n====== TRACE-C ======");
  console.log(JSON.stringify(parsedContent?.sections?.[0]?.questions?.[0]));

  const newAssignment = new Assignment(jobPayload);
  await newAssignment.save();

  const newResult = new Result({
    assignmentId: newAssignment._id,
    content: parsedContent,
  });

  console.log("\n====== TRACE-D ======");
  console.log(JSON.stringify(newResult.content?.sections?.[0]?.questions?.[0]));
  await newResult.save();

  // TRACE-E
  const fetchedResult = await Result.findOne({ assignmentId: newAssignment._id });
  const responseData = { ...fetchedResult?.toJSON() };
  console.log("\n====== TRACE-E ======");
  const eVal = responseData.content?.sections?.[0]?.questions?.[0];
  console.log(JSON.stringify(eVal));

  // TRACE-F
  console.log("\n====== TRACE-F ======");
  const rawText = eVal?.questionText || eVal?.text || '';
  const fVal = rawText.replace(/\\n/g, '\n').replace(/\*?\*?(Sub-questions?|Sub-parts?|Sub questions?):?\*?\*?/gi, '').replace(/\n{3,}/g, '\n\n').trim();
  console.log(JSON.stringify(fVal));

  await mongoose.disconnect();
}

run().catch(console.error);
