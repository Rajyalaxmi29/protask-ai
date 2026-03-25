import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { IncomingMessage, ServerResponse } from 'http';

// Inline dev-only handler for /api/chat so `npm run dev` works without Vercel CLI
function apiChatDevPlugin(hfToken: string): Plugin {
  return {
    name: 'api-chat-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { HfInference } = await import('@huggingface/inference');
            const hf = new HfInference(hfToken);
            const result = await hf.chatCompletion({
              model: 'Qwen/Qwen2.5-72B-Instruct',
              messages: [
                { role: 'system', content: body.systemPrompt || 'You are ProTask AI.' },
                ...(body.messages || []),
              ],
            });
            const text: string = result?.choices?.[0]?.message?.content ?? '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ text: text.trim() }));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
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
    plugins: [react(), tailwindcss(), apiChatDevPlugin(env.HF_API_TOKEN)],
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
