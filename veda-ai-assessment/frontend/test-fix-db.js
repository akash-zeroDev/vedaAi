const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const RubricSchema = new mongoose.Schema({ 
    status: String, 
    criteria: Array,
    description: String 
  }, { strict: false });
  const Rubric = mongoose.models.Rubric || mongoose.model('Rubric', RubricSchema, 'rubrics');

  const rubric = await Rubric.findById("6a2d10883ff923aaaef3231a");
  console.log("Found rubric:", rubric.title);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDlz79Iwqd2zN6dy2M9mhc_YC6Ukb_IeiE");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `You are an expert educator. Create a comprehensive grading rubric for the following assignment.
  The rubric should evaluate multiple aspects of the assignment based on its specific requirements.
  
  Assignment Description:
  ${rubric.description}

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

  console.log("Generating with Gemini...");
  const response = await model.generateContent(prompt);
  let jsonText = response.response.text().trim();
  
  if (jsonText.startsWith('\`\`\`json')) {
    jsonText = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  } else if (jsonText.startsWith('\`\`\`')) {
    jsonText = jsonText.replace(/\`\`\`/g, '').trim();
  }

  const generatedRubricData = JSON.parse(jsonText);
  console.log("Generated array length:", generatedRubricData.length);

  await Rubric.findByIdAndUpdate("6a2d10883ff923aaaef3231a", {
    status: 'COMPLETED',
    criteria: generatedRubricData
  });
  
  console.log("Updated DB with correct criteria! Front-end should now render the table.");
  process.exit(0);
}
run().catch(console.error);
