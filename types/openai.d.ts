import { createOpenAI } from '@ai-sdk/openai';

// Ensure the API key is defined
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openaiClient;
