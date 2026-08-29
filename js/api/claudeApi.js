/* ---------------- Claude API helpers ---------------- */
// Requests go through a Cloudflare Worker proxy (js/config.js -> API_PROXY_URL)
// rather than calling api.anthropic.com directly. The browser never holds a
// real API key; the Worker attaches it server-side. See /cloudflare-worker/.

import { API_PROXY_URL } from '../config.js';

async function callClaude(messages, { maxTokens = 1500, accessKey } = {}) {
  const response = await fetch(API_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': accessKey || '',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (response.status === 401) {
    throw new AuthError('Access key rejected.');
  }
  if (!response.ok) {
    let msg = 'API request failed (' + response.status + ')';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        msg = errData.error + (errData.detail ? ': ' + errData.detail : '');
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
  const response = await fetch(API_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': accessKey || '',
    },
    body: JSON.stringify({ action: 'verify' }),
  });
  if (response.status === 401) return false;
  if (!response.ok) throw new Error('Verification request failed: ' + response.status);
  return true;
}

export async function runChecklistCheck(markdown, rules, accessKey) {
  const ruleList = rules.map(r => `- id: ${r.id}\n  rule: ${r.rule}`).join('\n');
  const prompt = `You are a compliance reviewer for aquaculture feed export documents (health certificates, technical documents, and related paperwork).

Below is a document transcribed to markdown, followed by a checklist of rules. Evaluate the document against EVERY rule.

For each rule, respond with a status:
- "pass": the document clearly satisfies the rule
- "fail": the document clearly violates the rule or is missing required information the rule needs
- "warning": something looks off or worth a second look, but it isn't a clear failure
- "unclear": the document doesn't contain enough information to judge this rule

Respond with ONLY a JSON array, no markdown code fences, no preamble. Each element: {"id": "<rule id>", "status": "pass|fail|warning|unclear", "finding": "<one or two sentence plain-English explanation, citing specifics from the document where relevant>"}.

CHECKLIST:
${ruleList}

DOCUMENT (markdown):
"""
${markdown}
"""`;
  const messages = [{ role: 'user', content: prompt }];
  const raw = await callClaude(messages, { maxTokens: 2500, accessKey });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}