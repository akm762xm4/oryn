import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY environment variable is missing!");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
    "X-Title": "Oryn Chat App",
  },
});

// Free models — ordered by reliability. First two are highest-quality fallbacks.
const FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "huggingfaceh4/zephyr-7b-beta:free",
];

// Small delay between retry attempts to reduce cascading rate-limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const generateAIResponse = async (message, conversationHistory = []) => {
  const messages = [
    {
      role: "system",
      content:
        "You are Oryn AI, a helpful and friendly assistant built into the Oryn chat application. Keep responses clear, concise and conversational. Use markdown when it helps readability.",
    },
    ...conversationHistory.slice(-6).map((msg) => ({
      role: msg.isAI ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  for (let i = 0; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i];
    try {
      console.log(`[AI] Trying model: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 512,
        temperature: 0.7,
      });
      const text = completion.choices[0]?.message?.content;
      if (text) {
        console.log(`[AI] ✅ Success with: ${model}`);
        return text;
      }
    } catch (error) {
      const status = error?.status || error?.response?.status;
      console.warn(`[AI] ❌ Model ${model} failed (${status}): ${error?.message}`);

      // Rate-limited — wait briefly before trying next model
      if (status === 429) {
        if (i < FREE_MODELS.length - 1) {
          await sleep(400);
          continue;
        }
      }

      // Context-length / other 4xx — skip immediately
      if (i < FREE_MODELS.length - 1) continue;
    }
  }

  return "I'm having trouble connecting right now. All AI models seem busy — please try again in a moment! 🤖";
};

export const generateAIResponseWithModel = async (
  message,
  conversationHistory = [],
  model = "google/gemini-2.0-flash-exp:free"
) => {
  const messages = [
    {
      role: "system",
      content:
        "You are Oryn AI, a helpful and friendly assistant built into the Oryn chat application. Keep responses clear, concise and conversational. Use markdown when it helps readability.",
    },
    ...conversationHistory.slice(-6).map((msg) => ({
      role: msg.isAI ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content;
    if (text) return text;
  } catch (error) {
    console.warn(`[AI] Model ${model} failed, using fallback: ${error?.message}`);
    if (error?.status === 429) {
      return generateAIResponse(message, conversationHistory);
    }
  }

  return generateAIResponse(message, conversationHistory);
};
