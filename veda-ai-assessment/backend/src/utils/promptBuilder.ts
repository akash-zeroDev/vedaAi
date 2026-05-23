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
- Formatting: You MUST format all mathematical variables, symbols, greek letters (like alpha, beta), and formulas using standard LaTeX enclosed in single dollar signs for inline math (e.g. $\\alpha$, $TE_{mn}$, $x^2$) and double dollar signs for block equations. Do NOT use plain text for math.
CRITICAL JSON REQUIREMENT: Because your output is parsed programmatically, you MUST double-escape all LaTeX backslashes in your JSON strings (e.g. use \\\\alpha instead of \\alpha, and \\\\frac instead of \\frac). Failure to do so will break the JSON parser!

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
