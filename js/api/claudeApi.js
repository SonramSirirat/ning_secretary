/* ---------------- Claude API helpers ---------------- */

async function callClaude(messages, { maxTokens = 1500 } = {}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!response.ok) {
    throw new Error('API request failed: ' + response.status);
  }
  const data = await response.json();
  const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text);
  return textBlocks.join('\n');
}

export async function runChecklistCheck(markdown, rules) {
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
  const raw = await callClaude(messages, { maxTokens: 2500 });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
