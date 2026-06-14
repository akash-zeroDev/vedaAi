const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDlz79Iwqd2zN6dy2M9mhc_YC6Ukb_IeiE");
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const assignmentDescription = "Create a detailed grading rubric for a B.Tech Elec...";
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

  const res = await model.generateContent(prompt);
  console.log(res.response.text());
}
run();
