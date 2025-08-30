import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  generateAIResponse,
  generateAIResponseWithModel,
} from "../utils/openRouter.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for AI requests
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per user
  message: { message: "Too many AI requests, please try again later" },
});

router.use(authenticate);
router.use(aiLimiter);

// General AI chat endpoint
router.post("/ask", async (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const reply = await generateAIResponse(prompt, conversationHistory);
    res.json({ reply });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch response from OpenRouter." });
  }
});

// AI chat with specific model
router.post("/ask-with-model", async (req, res) => {
  try {
    const {
      prompt,
      conversationHistory = [],
      model = "deepseek/deepseek-chat-v3-0324:free",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const reply = await generateAIResponseWithModel(
      prompt,
      conversationHistory,
      model
    );
    res.json({ reply, model });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch response from OpenRouter." });
  }
});

// Get available models (you can expand this to fetch from OpenRouter API)
router.get("/models", async (req, res) => {
  try {
    const availableModels = [
      {
        id: "deepseek/deepseek-chat-v3-0324:free",
        name: "DeepSeek Chat V3 (Free)",
        description: "Fast and efficient chat model",
        free: true,
      },
      {
        id: "meta-llama/llama-3.2-3b-instruct:free",
        name: "Llama 3.2 3B (Free)",
        description: "Meta's Llama model",
        free: true,
      },
      {
        id: "microsoft/phi-3-mini-128k-instruct:free",
        name: "Phi-3 Mini (Free)",
        description: "Microsoft's compact model",
        free: true,
      },
    ];

    res.json({ models: availableModels });
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ error: "Failed to fetch available models." });
  }
});

export default router;
