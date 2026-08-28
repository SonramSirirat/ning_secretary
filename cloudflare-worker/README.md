# AquaCheck API Proxy (Cloudflare Worker)

Keeps your real Anthropic API key off the client. The GitHub Pages frontend
calls this Worker; the Worker attaches the key and forwards to Anthropic.

```
Browser (GitHub Pages) → this Worker (holds API key) → api.anthropic.com → back to browser
```

## Prerequisites

- A Cloudflare account (free tier is enough)
- Node.js installed locally
- An Anthropic API key (console.anthropic.com → API Keys)

## Deploy

1. Install Wrangler (Cloudflare's CLI), if you don't have it:
   ```bash
   npm install -g wrangler
   ```

2. Log in:
   ```bash
   wrangler login
   ```

3. From this folder, set your real API key as a secret (you'll be prompted
   to paste it — it is **not** written to any file in this repo):
   ```bash
   wrangler secret put ANTHROPIC_API_KEY
   ```

4. Edit `wrangler.toml` and set `ALLOWED_ORIGIN` to your actual GitHub Pages
   URL, e.g. `https://sonramsirirat.github.io` (no trailing slash). This
   restricts who can call your proxy.

5. Deploy:
   ```bash
   wrangler deploy
   ```

6. Wrangler will print a URL like:
   ```
   https://aquacheck-proxy.<your-subdomain>.workers.dev
   ```
   Copy it.

## Wire it up to the frontend

In the AquaCheck repo, open `js/config.js` and set:

```js
export const API_PROXY_URL = 'https://aquacheck-proxy.<your-subdomain>.workers.dev';
```

Commit and push. GitHub Pages redeploys automatically, and `js/api/claudeApi.js`
will now call your Worker instead of `api.anthropic.com` directly.

## Notes

- The Worker enforces a `max_tokens` ceiling (4000) and only forwards
  `model`, `max_tokens`, and `messages` — the frontend can't smuggle a
  different API key or endpoint through it.
- `ALLOWED_ORIGIN` controls CORS. Setting it to `"*"` lets any website call
  your proxy (and burn your API credits) — keep it scoped to your actual
  domain in production.
- This Worker has no rate limiting or auth beyond the CORS origin check. For
  a small personal/team tool that's usually fine; for anything public-facing,
  consider adding Cloudflare's rate limiting rules or a lightweight
  shared-secret header check.
- Redeploying only requires `wrangler deploy` again after any change to
  `src/worker.js`.
