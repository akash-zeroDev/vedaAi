export interface AssessmentPayload {
  questionTypes: Array<string | { type: string; count: number; marks: number }>;
  totalQuestions: number;
  totalMarks: number;
  instructions?: string;
}

export interface AssessmentResult {
  sections: Array<{
    title?: string;
    sectionTitle?: string;
    instruction?: string;
    instructions?: string;
    questions: Array<{
      text?: string;
      questionText?: string;
      difficulty: string;
      marks: number;
      options?: string[];
    }>;
  }>;
}

export const buildStructuredPrompt = (payload: AssessmentPayload): string => {
  const { questionTypes, totalQuestions, totalMarks, instructions } = payload;

const promptTemplate = `You are an expert AI Assessment Creator.
Generate an assessment based on the user criteria provided below.

USER CRITERIA:
- Question Types: ${Array.isArray(questionTypes) ? questionTypes.map(q => typeof q === 'string' ? q : q.count + 'x ' + q.type + ' (' + q.marks + ' marks total)').join(', ') : questionTypes}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
${instructions ? `- Additional Instructions: ${instructions}` : ''}

CRITICAL RULES:
1. MATH/LATEX ESCAPING: If using math/physics formulas, use LaTeX. Because we use native structured output, do NOT double-escape backslashes. Use a SINGLE backslash (e.g., \\frac, \\sqrt, \\eta). Write LaTeX exactly as it would appear in a .tex file.
2. MATH DELIMITERS: Wrap inline equations in single dollar signs (e.g., $5 \\text{ N}$) and block equations in double dollar signs (e.g., $$E = mc^2$$).
3. SECTIONS: Create exactly one section for each Question Type requested. Name them sequentially ("Section A", "Section B", etc.).
4. OPTIONS: If the question type is NOT multiple choice (e.g., Short Answer, Fill in the Blanks), you MUST leave the "options" array empty [].
5. UNITS: NEVER use \\text{} (or any \\text-based unit annotation) inside $...$ or $$...$$ for units. Units must always be written as plain prose text immediately after the math expression closes. 
   WRONG: "$a = 2\\text{cm}$"
   CORRECT: "$a = 2$ cm"
   WRONG: "$f = 16\\text{GHz}$"
   CORRECT: "$f = 16$ GHz"

You MUST return ONLY a valid JSON object matching this EXACT schema. Do not include markdown formatting fences.

{
  "sections": [
    {
      "sectionTitle": "Section A",
      "instructions": "Multiple Choice Questions. Attempt all questions.",
      "questions": [
        {
          "questionText": "Question text string goes here",
          "difficulty": "Easy",
          "marks": 5,
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ]
    }
  ]
}`;

  return promptTemplate.trim();
};

export const parseAIResponse = (text: string): AssessmentResult => {
  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    let jsonString = cleanedText;
    console.log("[Worker] Llama 3 Raw Output:", jsonString);
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error: any) {
    console.error('Failed to parse AI response. Error:', error.message);
    throw new Error('Invalid JSON format from AI model');
  }
};
