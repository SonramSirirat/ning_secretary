import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function checkAuth(req: Request): boolean {
  const serverKey = process.env.APP_KEY?.trim();
  if (!serverKey) {
    // If no APP_KEY is set in environment, allow access
    return true;
  }
  const clientKey = (req.headers['x-app-key'] as string) || req.body?.accessKey || '';
  return clientKey.trim() === serverKey;
}

// API proxy endpoint supporting both verify and inspection checks
app.post(['/api', '/api/verify', '/api/check'], async (req: Request, res: Response): Promise<void> => {
  try {
    const isAuthorized = checkAuth(req);
    if (!isAuthorized) {
      res.status(401).json({ error: 'Access key rejected.' });
      return;
    }

    const { action, messages } = req.body;

    if (action === 'verify' || req.path === '/api/verify') {
      res.status(200).json({ ok: true });
      return;
    }

    let prompt = '';
    if (Array.isArray(messages) && messages.length > 0) {
      prompt = messages.map(m => m.content).join('\n\n');
    } else if (req.body.prompt) {
      prompt = req.body.prompt;
    } else {
      res.status(400).json({ error: 'Missing prompt or messages payload.' });
      return;
    }

    let ai: GoogleGenAI;
    try {
      ai = getGenAI();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'GEMINI_API_KEY missing.' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '[]';

    // Format output envelope compatible with frontend expectations
    res.status(200).json({
      content: [
        {
          type: 'text',
          text: outputText,
        },
      ],
    });
  } catch (error: any) {
    console.error('Error handling inspection request:', error);
    res.status(500).json({
      error: 'Inspection check failed.',
      detail: error?.message || String(error),
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static assets
app.use(express.static(__dirname));

// Fallback to index.html for root or SPA navigation
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AquaCheck server running on http://0.0.0.0:${PORT}`);
});
