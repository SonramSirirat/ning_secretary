/* ---------------- Access key gate view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderGate(authModel) {
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
    </div>
  </div>`;
}
