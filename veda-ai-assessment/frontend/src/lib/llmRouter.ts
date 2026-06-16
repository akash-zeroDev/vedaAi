import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateAIContent(
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; tokenUsage: number }> {
  
  console.log(`[Router] Using Google Gemini (Free Tier)`);
  const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...(systemInstruction && { systemInstruction })
  });

  const response = await geminiModel.generateContent(prompt);
  return {
    text: response.response.text(),
    tokenUsage: response.response.usageMetadata?.totalTokenCount || 0
  };
}
