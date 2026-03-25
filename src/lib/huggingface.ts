export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Calls the /api/chat serverless proxy which securely forwards the request
 * to Hugging Face server-side (token is never exposed to the browser).
 */
export async function callHuggingFace(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  const data = await res.json();
  return (data.text as string) ?? '';
}
