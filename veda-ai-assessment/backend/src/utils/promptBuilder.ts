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

  const promptTemplate = `
You are an expert AI Assessment Creator.
Generate an assessment based on the user criteria provided below.

USER CRITERIA:
- Question Types: ${Array.isArray(questionTypes) ? questionTypes.map(q => typeof q === 'string' ? q : q.count + 'x ' + q.type + ' (' + q.marks + ' marks total)').join(', ') : questionTypes}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
${instructions ? `- Additional Instructions: ${instructions}` : ''}
CRITICAL MATH FORMATTING RULE: If the subject involves math, physics, or scientific formulas, you MUST use standard LaTeX syntax. 
1. You must double-escape all LaTeX backslashes so they survive JSON parsing (e.g., use \\\\frac instead of \\frac, \\\\text instead of \\text).
2. You MUST wrap all inline equations, variables, and units in single dollar signs (e.g., A force of $5 \\\\text{ N}$ is applied).
3. You MUST wrap block/display equations in double dollar signs (e.g., $$E = mc^2$$).

You MUST return the output strictly as a valid JSON object matching the EXACT schema layout below.
You MUST create exactly one section for each Question Type requested. The "title" of each section MUST be the exact name of the Question Type (e.g., "Multiple Choice Questions").

Do not include any conversational preamble, markdown formatting fences (e.g. \`\`\`json), or trailing text. Return ONLY the JSON object.

TARGET JSON OUTPUT TEMPLATE:
{
  "sections": [
    {
      "title": "Multiple Choice Questions",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "Question text string goes here",
          "difficulty": "Easy",
          "marks": 5,
          "options": ["Option A", "Option B", "Option C", "Option D"] 
        }
      ]
    }
  ]
}
`;

  return promptTemplate.trim();
};

export const parseAIResponse = (text: string): AssessmentResult => {
  const cleanedText = text
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    // If standard parsing fails, attempt to sanitize single-escaped LaTeX backslashes
    // This regex finds backslashes that are NOT preceded by a backslash AND NOT followed by a quote or backslash
    // e.g. \frac -> \\frac, but \" -> \" and \\frac -> \\frac
    const sanitizedText = cleanedText
      .replace(/(?<!\\)\\(?!["\\/])/g, '\\\\')
      .replace(/[\u0000-\u001F]+/g, ''); // Remove literal control characters (like literal unescaped newlines/tabs) that break JSON strings

    try {
      return JSON.parse(sanitizedText);
    } catch (fallbackError) {
      console.error('Failed to parse AI response even after sanitization.', sanitizedText);
      throw new Error('Invalid JSON format from AI model');
    }
  }
};
