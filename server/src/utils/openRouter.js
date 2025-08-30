import OpenAI from "openai";

// Check if OpenRouter API key is available
if (!process.env.OPENROUTER_API_KEY) {
  console.log("API Key:", process.env.OPENROUTER_API_KEY);
  console.error("OPENROUTER_API_KEY environment variable is missing!");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Oryn Chat App",
  },
});

// List of free models to try in order
const FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "huggingfaceh4/zephyr-7b-beta:free",
];

export const generateAIResponse = async (message, conversationHistory = []) => {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful AI assistant in Oryn chat application. Keep responses concise and friendly.",
    },
    ...conversationHistory.slice(-5).map((msg) => ({
      role: msg.isAI ? "assistant" : "user",
      content: msg.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];

  // Try each model in order until one works
  for (let i = 0; i < FREE_MODELS.length; i++) {
    const model = FREE_MODELS[i];
    try {
      console.log(`Trying model: ${model}`);

      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      console.log(`Success with model: ${model}`);
      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`Model ${model} failed:`, error.message);

      // If it's a rate limit error and we have more models to try, continue
      if (error.status === 429 && i < FREE_MODELS.length - 1) {
        console.log(`Rate limited on ${model}, trying next model...`);
        continue;
      }

      // If it's the last model or a different error, return fallback
      if (i === FREE_MODELS.length - 1) {
        console.error("All models failed or rate limited");
        return "Sorry, all AI models are currently busy. Please try again in a few moments.";
      }
    }
  }

  return "Sorry, I encountered an error. Please try again later.";
};

export const generateAIResponseWithModel = async (
  message,
  conversationHistory = [],
  model = "google/gemini-2.0-flash-exp:free"
) => {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant in Oryn chat application. Keep responses concise and friendly.",
      },
      ...conversationHistory.slice(-5).map((msg) => ({
        role: msg.isAI ? "assistant" : "user",
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter API error:", error);

    // If the specified model fails, try the fallback system
    if (error.status === 429) {
      console.log("Specified model rate limited, trying fallback system...");
      return generateAIResponse(message, conversationHistory);
    }

    return "Sorry, I encountered an error. Please try again later.";
  }
};
