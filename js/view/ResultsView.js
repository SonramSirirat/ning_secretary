/* ---------------- Results view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

function stampFor(status) {
  const map = {
    pass: { icon: ICONS.check, word: 'PASS' },
    fail: { icon: ICONS.x, word: 'FAIL' },
    warning: { icon: ICONS.alert, word: 'REVIEW' },
    unclear: { icon: ICONS.question, word: 'UNCLEAR' },
  };
  const m = map[status] || map.unclear;
  return `<div class="stamp ${status}"><div class="stamp-inner">${m.icon}<div class="stamp-word">${m.word}</div></div></div>`;
}

export function renderResultsStep(docModel, checklistModel) {
  if (!docModel.results) {
    return `<div class="card"><div class="empty">${ICONS.clipboard}<div>No results yet — run a check from the document step.</div></div></div>`;
  }
  const rules = checklistModel.getAll();
  const byId = Object.fromEntries(rules.map(r => [r.id, r]));
  const counts = { pass: 0, fail: 0, warning: 0, unclear: 0 };
  docModel.results.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  const filtered = docModel.resultFilter === 'all'
    ? docModel.results
    : docModel.results.filter(r => r.status === docModel.resultFilter);

  const checkedDocType = docModel.checkedDocType;
  const enabledCount = rules.filter(r => r.enabled && (!checkedDocType || r.docType === checkedDocType)).length;

  return `
  <div class="card">
    <h2>Inspection results</h2>
    <p class="sub">${checkedDocType ? `Checked as <strong>${escapeHtml(checkedDocType)}</strong> against ` : 'Checked against '}${enabledCount} active checklist rule${enabledCount === 1 ? '' : 's'}.</p>
    <div class="resultsummary">
      <div class="sumchip"><span class="dot" style="background:var(--success)"></span>${counts.pass} pass</div>
      <div class="sumchip"><span class="dot" style="background:var(--coral)"></span>${counts.fail} fail</div>
      <div class="sumchip"><span class="dot" style="background:var(--amber)"></span>${counts.warning} review</div>
      <div class="sumchip"><span class="dot" style="background:var(--ink-soft)"></span>${counts.unclear} unclear</div>
    </div>
    <div class="toolbar">
      <div class="filters">
        ${['all', 'fail', 'warning', 'unclear', 'pass'].map(f => `<button class="filterbtn ${docModel.resultFilter === f ? 'active' : ''}" data-filter="${f}">${f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}</button>`).join('')}
      </div>
      <div class="recheck-actions">
        <button class="btn btn-ghost btn-sm" id="btn-recheck" ${docModel.checking ? 'disabled' : ''}>
          ${docModel.checking ? `<span class="spinner"></span> Checking… <span class="checking-elapsed-tag" id="checking-elapsed-time">(${docModel.checkingElapsedSec}s)</span>` : ICONS.stamp + ' Re-check'}
        </button>
        ${docModel.checking && docModel.showAbort ? `
          <button class="btn btn-danger btn-sm" id="btn-abort-check" type="button" title="Cancel this inspection check">
            ${ICONS.stop} Abort check
          </button>
        ` : ''}
      </div>
    </div>
    ${docModel.checkError ? `<div class="errbox">${escapeHtml(docModel.checkError)}</div>` : ''}
    ${filtered.map(r => {
      const rule = byId[r.id];
      if (!rule) return '';
      return `<div class="resultcard">
        ${stampFor(r.status)}
        <div class="resultbody">
          <div class="rcat">${escapeHtml(rule.category)}</div>
          <div class="rrule">${escapeHtml(rule.rule)}</div>
          <div class="rfinding">${escapeHtml(r.finding || '')}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
