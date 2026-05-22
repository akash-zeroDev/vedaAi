export const buildStructuredPrompt = (payload: any): string => {
  const { questionTypes, totalQuestions, totalMarks, instructions } = payload;

  const promptTemplate = `
You are an expert AI Assessment Creator.
Generate an assessment based on the user criteria provided below.

USER CRITERIA:
- Question Types: ${Array.isArray(questionTypes) ? questionTypes.join(', ') : questionTypes}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
${instructions ? `- Additional Instructions: ${instructions}` : ''}

You MUST return the output strictly as a valid JSON object matching the EXACT schema layout below.
Do not include any conversational preamble, markdown formatting fences (e.g. \`\`\`json), or trailing text. Return ONLY the JSON object.

TARGET JSON OUTPUT TEMPLATE:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "Question text string goes here",
          "difficulty": "Easy",
          "marks": 5
        }
      ]
    }
  ]
}
`;

  return promptTemplate.trim();
};

export const parseAIResponse = (text: string): any => {
  const cleanedText = text
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleanedText);
};
