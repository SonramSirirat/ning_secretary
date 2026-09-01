/* ---------------- Claude API helpers ---------------- */
// Requests go through a Cloudflare Worker proxy (js/config.js -> API_PROXY_URL)
// rather than calling api.anthropic.com directly. The browser never holds a
// real API key; the Worker attaches it server-side. See /cloudflare-worker/.

import { getApiProxyUrl } from '../config.js';

async function callClaude(messages, { maxTokens = 1500, accessKey, signal } = {}) {
  const proxyUrl = getApiProxyUrl();
  let response;
  try {
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': accessKey || '',
      },
      body: JSON.stringify({
        model: 'gemini-3.1-flash-lite',
        max_tokens: maxTokens,
        messages,
      }),
      signal,
    });
  } catch (netErr) {
    if (netErr?.name === 'AbortError' || signal?.aborted) {
      const abortErr = new Error('Inspection check was aborted.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    throw new Error(`Cannot reach API proxy at "${proxyUrl}". If you are on GitHub Pages, configure your Cloudflare Worker URL in Proxy Settings.`);
  }

  if (response.status === 401) {
    throw new AuthError('Access key rejected.');
  }
  if (!response.ok) {
    if (response.status === 404 && proxyUrl === '/api') {
      throw new Error('API proxy endpoint (/api) not found. On GitHub Pages, please configure your Cloudflare Worker URL.');
    }
    let msg = 'API request failed (' + response.status + ')';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        msg = errData.error;
      }
    } catch (e) {}
    throw new Error(msg);
  }
  const data = await response.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  return textBlocks.join('\n');
}

export class AuthError extends Error {}

// Cheap round-trip that only checks the access key against the Worker's
// APP_KEY secret — it does not spend any Gemini/model quota.
export async function verifyKey(accessKey) {
  const proxyUrl = getApiProxyUrl();
  let response;
  try {
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': accessKey || '',
      },
      body: JSON.stringify({ action: 'verify' }),
    });
  } catch (netErr) {
    throw new Error(`Unable to connect to proxy endpoint at "${proxyUrl}". If on GitHub Pages, please provide your Cloudflare Worker URL.`);
  }

  if (response.status === 401) return false;
  if (!response.ok) {
    if (response.status === 404 && proxyUrl === '/api') {
      throw new Error('Static host cannot resolve "/api". Please configure your Cloudflare Worker URL.');
    }
    throw new Error('Verification request failed with status ' + response.status);
  }
  return true;
}

export async function runChecklistCheck(markdown, rules, accessKey, signal) {
  const ruleList = rules.map(r => `- id: ${r.id}\n  category: ${r.category}\n  rule: ${r.rule}`).join('\n');
  const prompt = `You are a compliance reviewer for aquaculture feed export documents (health certificates, technical documents, and related paperwork).

Below is a document transcribed to markdown, followed by a checklist of rules. Evaluate the document against EVERY rule in the checklist.

For each rule, respond with a status:
- "pass": the document clearly satisfies the rule
- "fail": the document clearly violates the rule or is missing required information the rule needs
- "warning": something looks off or worth a second look, but it isn't a clear failure
- "unclear": the document doesn't contain enough information to judge this rule

Respond with ONLY a JSON array, no markdown code fences, no preamble. Each element must have:
{"id": "<rule id>", "status": "pass|fail|warning|unclear", "finding": "<one or two sentence plain-English explanation, citing specifics from the document where relevant>"}

CHECKLIST:
${ruleList}

DOCUMENT (markdown):
"""
${markdown}
"""`;
  const messages = [{ role: 'user', content: prompt }];
  const raw = await callClaude(messages, { maxTokens: 4000, accessKey, signal });
  
  let list = [];
  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      list = JSON.parse(jsonMatch[0]);
    } else {
      list = JSON.parse(cleaned);
    }
  } catch (parseErr) {
    console.error('Failed to parse inspection JSON:', raw, parseErr);
    throw new Error('Failed to parse document inspection results from AI response.');
  }

  if (!Array.isArray(list)) {
    if (list && typeof list === 'object') {
      list = list.results || list.items || list.rules || Object.values(list);
    } else {
      list = [];
    }
  }

  // Normalize results against active rules
  const resultMap = new Map((Array.isArray(list) ? list : []).map(item => [item?.id, item]));
  return rules.map(rule => {
    const item = resultMap.get(rule.id) || {};
    let status = String(item.status || 'unclear').toLowerCase().trim();
    if (!['pass', 'fail', 'warning', 'unclear'].includes(status)) {
      if (status.includes('pass')) status = 'pass';
      else if (status.includes('fail')) status = 'fail';
      else if (status.includes('warn') || status.includes('review')) status = 'warning';
      else status = 'unclear';
    }
    return {
      id: rule.id,
      status,
      finding: item.finding || 'Evaluated against document content.',
    };
  });
}