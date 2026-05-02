import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import catRoutes from "./routes/catRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/purrcare";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "12mb" }));

const fallbackCatGuidance = `I'm PurrCare's assistant. I can help you think through changes in appetite, litter use, energy, grooming, or social behavior.

Common reasons behavior shifts: stress (moves, new pets), pain, illness, diet change, or boredom. Track eating, drinking, vomiting, and litter habits; note when the change started.

This is not veterinary advice. If your cat stops eating, struggles to urinate, breathes oddly, or seems in pain, contact a veterinarian promptly.`;

// Public auth routes
app.use("/api", authRoutes);

// Public chatbot route
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "messages[] required" });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content?.trim() || "";

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  if (!apiKey) {
    return res.json({
      reply: `${fallbackCatGuidance}\n\n(You asked: "${userText.slice(0, 200)}${userText.length > 200 ? "…" : ""}")\n\nTip: Set OPENAI_API_KEY in backend/.env for full AI answers.`,
    });
  }

  try {
    const system = {
      role: "system",
      content:
        "You are a friendly cat care coach for PurrCare. Give practical, calm guidance about cat behavior and daily care. Never diagnose. Encourage vet visits for emergencies or persistent symptoms. Keep answers concise.",
    };

    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [system, ...messages.slice(-12)],
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({
        reply: fallbackCatGuidance,
        error: data?.error?.message || "Upstream API error",
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.json({ reply: reply || fallbackCatGuidance });
  } catch (err) {
    return res.status(502).json({
      reply: fallbackCatGuidance,
      error: err.message,
    });
  }
});

// Public health route
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

// Protected routes last
app.use("/api", catRoutes);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`PurrCare API http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Start MongoDB or set MONGODB_URI in .env");
    process.exit(1);
  }
}

start();