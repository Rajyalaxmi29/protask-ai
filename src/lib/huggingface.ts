import { HfInference } from '@huggingface/inference';

const HF_API_TOKEN = import.meta.env.VITE_HF_API_TOKEN as string;
const MODEL = 'Qwen/Qwen2.5-72B-Instruct';

const hf = new HfInference(HF_API_TOKEN);

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Calls Hugging Face Inference API using the official SDK (CORS-safe)
 * and returns the AI-generated response text.
 */
export async function callHuggingFace(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const result = await hf.chatCompletion({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]
  });

  const text: string = result?.choices?.[0]?.message?.content ?? '';
  return text.trim();
}
