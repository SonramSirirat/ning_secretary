/**
 * AquaCheck API proxy — Gemini edition.
 *
 * Sits between the static GitHub Pages frontend and Google's Gemini API
 * (generativelanguage.googleapis.com), which has a genuine no-credit-card
 * free tier. The frontend never sees the real API key — it's stored as a
 * Worker secret (GEMINI_API_KEY) and attached here server-side.
 *
 * The frontend still speaks the same "shape" it always has (Anthropic-style
 * { model, max_tokens, messages: [{ role, content }] } in, { content: [{type,
 * text}] } out) — this Worker translates to/from Gemini's request/response
 * format so js/api/claudeApi.js and js/config.js don't need to change.
 */

const GEMINI_VERSION = 'v1beta';
const DEFAULT_MODEL = 'gemini-3.6-flash'; // solid free-tier balance of quality/quota
const MAX_TOKENS_CEILING = 4000; // hard cap regardless of what the client requests

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
  });
}

// Anthropic-style messages -> Gemini "contents" array.
// Each message's `content` is expected to be a plain string (that's all
// this app ever sends). role "assistant" maps to Gemini's "model".
function toGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content) }],
  }));
}

// Gemini's response -> the { content: [{type:'text', text}] } shape the
// frontend already expects (mirrors Anthropic's response envelope).
function fromGeminiResponse(geminiData) {
  const candidate = geminiData?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.map(p => p.text || '').join('');
  return { content: [{ type: 'text', text }] };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, env);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Server misconfigured: GEMINI_API_KEY not set' }, 500, env);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: 'Invalid JSON body' }, 400, env);
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'Request must include a non-empty "messages" array' }, 400, env);
    }

    const model = typeof body.model === 'string' && body.model.startsWith('gemini')
      ? body.model
      : DEFAULT_MODEL;
    const maxOutputTokens = Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CEILING);

    const geminiPayload = {
      contents: toGeminiContents(body.messages),
      generationConfig: {
        maxOutputTokens,
        responseMimeType: 'application/json', // this app always asks the model for JSON-only output
      },
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/${GEMINI_VERSION}/models/${model}:generateContent`;

    let upstream;
    try {
      upstream = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify(geminiPayload),
      });
    } catch (err) {
      return json({ error: 'Failed to reach Gemini API', detail: String(err) }, 502, env);
    }

    if (!upstream.ok) {
      // Forward Gemini's own error body/status as-is — useful for debugging
      // (e.g. 429 rate limit, 400 bad key, etc.)
      const errText = await upstream.text();
      return new Response(errText, {
        status: upstream.status,
        headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await upstream.json();
    const translated = fromGeminiResponse(geminiData);

    return json(translated, 200, env);
  },
};