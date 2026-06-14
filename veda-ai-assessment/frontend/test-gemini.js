const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDlz79Iwqd2zN6dy2M9mhc_YC6Ukb_IeiE");
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("Hello");
    console.log(res.response.text());
  } catch (e) {
    console.error("1.5-flash failed:", e.message);
    try {
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const res2 = await model2.generateContent("Hello");
      console.log("1.5-flash-latest success:", res2.response.text());
    } catch (e2) {
      console.error("1.5-flash-latest failed:", e2.message);
      try {
        const model3 = genAI.getGenerativeModel({ model: "gemini-pro" });
        const res3 = await model3.generateContent("Hello");
        console.log("gemini-pro success:", res3.response.text());
      } catch (e3) {
        console.error("gemini-pro failed:", e3.message);
      }
    }
  }
}
run();
