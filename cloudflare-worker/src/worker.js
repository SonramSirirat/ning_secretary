/**
 * AquaCheck API proxy.
 *
 * Sits between the static GitHub Pages frontend and Anthropic's API.
 * The frontend never sees the real API key — it's stored as a Worker
 * secret (ANTHROPIC_API_KEY) and attached here server-side.
 *
 * Also strips the request down to an allow-list of fields (model,
 * max_tokens, messages) so the frontend can't smuggle extra params
 * (like a different API key or a different endpoint) through the proxy.
 */

const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, env);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'Server misconfigured: ANTHROPIC_API_KEY not set' }, 500, env);
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

    const payload = {
      model: typeof body.model === 'string' ? body.model : DEFAULT_MODEL,
      max_tokens: Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CEILING),
      messages: body.messages,
    };

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      return json({ error: 'Failed to reach Anthropic API', detail: String(err) }, 502, env);
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders(env), 'Content-Type': 'application/json' },
    });
  },
};
