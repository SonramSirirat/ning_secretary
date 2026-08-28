# AquaCheck API Proxy (Cloudflare Worker, Gemini edition)

Keeps your API key off the client. The GitHub Pages frontend calls this
Worker; the Worker attaches a **Google Gemini** API key (free tier, no
credit card required) and forwards to Google, translating the
request/response shape so the frontend doesn't need to know or care which
model provider is behind it.

```
Browser (GitHub Pages) → this Worker (holds Gemini key) → generativelanguage.googleapis.com → back to browser
```

## Why Gemini

Google's Gemini API has a genuine free tier: no credit card, no billing
setup. As of testing this, `gemini-2.5-flash` (the default model this
Worker uses) gets roughly **10 requests/minute and 250 requests/day** on
the free tier — Google does adjust these numbers over time, so check
[ai.google.dev](https://ai.google.dev/gemini-api/docs/rate-limits) for the
current figures if you're unsure.

## Prerequisites

- A Cloudflare account (free tier is enough)
- Node.js installed locally
- A free Gemini API key — get one at **https://aistudio.google.com/apikey**
  (sign in with a Google account, no payment info needed)

## Deploy

1. Install Wrangler (Cloudflare's CLI), if you don't have it:
   ```bash
   npm install -g wrangler
   ```

2. Log in:
   ```bash
   wrangler login
   ```

3. **If you previously set an `ANTHROPIC_API_KEY` secret on this Worker**,
   remove it (optional cleanup, not required for this to work):
   ```bash
   wrangler secret delete ANTHROPIC_API_KEY
   ```

4. Set your Gemini key as a secret (you'll be prompted to paste it — it is
   **not** written to any file in this repo):
   ```bash
   wrangler secret put GEMINI_API_KEY
   ```

5. Confirm `ALLOWED_ORIGIN` in `wrangler.toml` matches your actual GitHub
   Pages URL, e.g. `https://sonramsirirat.github.io` (no trailing slash).

6. Deploy:
   ```bash
   wrangler deploy
   ```

The URL stays the same as before if you're redeploying the same Worker
(`aquacheck-proxy`) — no changes needed in `js/config.js` on the frontend.

If this is a fresh Worker, copy the printed URL and paste it into
`js/config.js`'s `API_PROXY_URL`, same as before.

## What changed vs. the Anthropic version

| | Anthropic version | Gemini version |
|---|---|---|
| Secret name | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` |
| Upstream API | `api.anthropic.com` | `generativelanguage.googleapis.com` |
| Cost | Pay-as-you-go, requires credits | Free tier, no credit card |
| Frontend changes needed | — | **None** — same request/response shape preserved |

The Worker translates the frontend's Anthropic-shaped request
(`{ model, max_tokens, messages: [{role, content}] }`) into Gemini's format,
and translates Gemini's response back into the
`{ content: [{type:'text', text}] }` shape the frontend already expects.
`js/api/claudeApi.js` and `js/config.js` in the main app repo are untouched.

## Notes

- The Worker enforces a `maxOutputTokens` ceiling (4000) and forces JSON
  output mode (`responseMimeType: "application/json"`) since this app
  always prompts for a JSON-only response — this generally makes Gemini's
  output more reliably parseable.
- If you hit Gemini's free-tier rate limit, the Worker forwards Gemini's
  own `429` response straight through — the frontend's existing "check
  could not be completed" error message will show, which is expected
  under heavy testing. Wait a minute and retry, or check your quota at
  [aistudio.google.com](https://aistudio.google.com).
- `ALLOWED_ORIGIN` controls CORS. Setting it to `"*"` lets any website call
  your proxy (and burn your free-tier quota) — keep it scoped to your
  actual domain in production.