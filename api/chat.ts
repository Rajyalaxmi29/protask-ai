import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_API_TOKEN);
const MODEL = 'Qwen/Qwen2.5-72B-Instruct';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, messages } = req.body as {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const result = await hf.chatCompletion({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt || 'You are ProTask AI, a helpful productivity assistant.' },
        ...messages,
      ],
    });

    const text: string = result?.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ text: text.trim() });
  } catch (err: unknown) {
    console.error('HuggingFace API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
