import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateAIContent(
  contents: any[],
  useJsonSchema?: any
): Promise<{ text: string; tokenUsage: number }> {
  
  console.log(`[Router] Using Google Gemini (Free Tier)`);
  const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(useJsonSchema && {
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: useJsonSchema
      }
    })
  });

  const response = await geminiModel.generateContent(contents);
  return {
    text: response.response.text(),
    tokenUsage: response.response.usageMetadata?.totalTokenCount || 0
  };
}
