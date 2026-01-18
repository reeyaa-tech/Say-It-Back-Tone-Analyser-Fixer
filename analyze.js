import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1️⃣ Load environment variables
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing! Check your .env file.");
  process.exit(1);
}

// 2️⃣ Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// 3️⃣ Initialize Gemini AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 4️⃣ Analyze endpoint
app.post("/analyze", async (req, res) => {
  const { text } = req.body;
  console.log("Received text:", text);

  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    // Escape quotes to prevent JSON issues
    const safeText = text.replace(/"/g, '\\"');

    const prompt = `
Analyze the sentence below and return:

tone (1 word)
intent (1 short line)
impact (short line)
rewrite (rewrite politely if needed)

Sentence: "${safeText}"

Output JSON ONLY like:
{"tone":"X","intent":"X","impact":"X","rewrite":"X"}
`;

    // Call Gemini
    const result = await model.generateContent(prompt);
    console.log("Full Gemini response:", result);

    // Safely extract text from SDK response
    const responseText = (result.output?.[0]?.content?.[0]?.text || "").trim();
    console.log("Extracted text:", responseText);

    // Parse JSON
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ JSON parse failed. Gemini returned:", responseText);
      return res.status(500).json({
        error: "Invalid AI JSON",
        raw: responseText
      });
    }

    // Send parsed JSON to client
    res.json(json);

  } catch (error) {
    // Detailed logging for debugging
    console.error("Gemini ERROR FULL:", error);
    res.status(500).json({
      error: "Gemini failed",
      details: error?.message || error
    });
  }
});

// 5️⃣ Start server
const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));