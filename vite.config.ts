import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';

// Inline dev-only handler for /api/chat so `npm run dev` works without Vercel CLI
function apiChatDevPlugin(geminiKey: string): Plugin {
  const GEMINI_MODEL = 'gemini-2.0-flash';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  return {
    name: 'api-chat-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const contents = (body.messages || []).map((m: { role: string; content: string }) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            }));

            const geminiRes = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: body.systemPrompt || 'You are ProTask AI.' }] },
                contents,
                generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
              }),
            });

            if (!geminiRes.ok) {
              const errText = await geminiRes.text();
              console.error('[API/chat dev]', geminiRes.status, errText);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: `Gemini API ${geminiRes.status}: ${errText}` }));
            }

            const data = await geminiRes.json() as {
              candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
            };
            const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ text: text.trim() }));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[API/chat dev] Error:', message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apiChatDevPlugin(env.GEMINI_API_KEY)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
