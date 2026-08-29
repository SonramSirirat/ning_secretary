/* ---------------- Access key gate view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderGate(authModel) {
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  const isDefaultProxy = authModel.proxyUrl === '/api';

  return `
  <div class="gate-wrap">
    <div class="gate-card">
      <div class="gate-icon">${ICONS.lock}</div>
      <h2>Access key required</h2>
      <p class="sub">Enter the access key to use AquaCheck.</p>
      
      <input
        type="password"
        class="gate-input"
        id="gate-key"
        placeholder="Access key"
        autocomplete="off"
        value="${escapeHtml(authModel.key)}"
      />
      <button class="btn btn-primary" id="gate-submit" ${authModel.verifying ? 'disabled' : ''}>
        ${authModel.verifying ? '<span class="spinner"></span> Checking…' : ICONS.lock + ' Enter'}
      </button>

      ${authModel.error ? `<div class="errbox">${escapeHtml(authModel.error)}</div>` : ''}

      ${isGitHubPages && isDefaultProxy ? `
        <div class="gate-tip">
          <strong>GitHub Pages note:</strong> Since GitHub Pages is static-only, connect your Cloudflare Worker URL or custom proxy below.
        </div>
      ` : ''}

      <div class="gate-proxy-toggle">
        <button type="button" class="btn-link" id="toggle-proxy-btn">
          ${authModel.showProxyConfig ? 'Hide Endpoint Settings' : 'Proxy / Endpoint Settings'}
        </button>
      </div>

      ${authModel.showProxyConfig ? `
        <div class="gate-proxy-section">
          <label for="gate-proxy-url">API Proxy URL</label>
          <input
            type="text"
            id="gate-proxy-url"
            class="gate-proxy-input"
            placeholder="https://aquacheck-proxy.your-name.workers.dev"
            value="${escapeHtml(authModel.proxyUrl || '')}"
          />
          <div class="gate-proxy-actions">
            <button type="button" class="btn-link" id="reset-proxy-btn">Reset to /api</button>
          </div>
        </div>
      ` : ''}
    </div>
  </div>`;
}

