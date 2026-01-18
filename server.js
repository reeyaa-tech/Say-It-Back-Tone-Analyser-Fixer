import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
console.log("Loaded key?", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  })
);
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-Flash" });

app.post("/api/analyze", async (req, res) => {
  try {
    const userText = req.body.text;

    const prompt = `
You are a tone, intent and impact analyzer.
Analyze the message below and respond ONLY in JSON:
{
"tone": "...",
"intent": "...",
"impact": "...",
"rewrite": "..."
}

Message: "${userText}"
`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (err) {
    console.error("FULL ERROR >>>", err.response ? err.response : err);
    res.status(500).json({
      tone: "Unknown",
      intent: "Unknown",
      impact: "Unknown",
      rewrite: "Model could not analyze."
    });
  }
});

app.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});