/* ---------------- Checklist settings view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';
import { CATEGORIES } from '../model/ChecklistModel.js';

export function renderChecklistView(checklistModel) {
  if (!checklistModel.getAll()) {
    return `<div class="card"><div class="empty">Loading checklist…</div></div>`;
  }
  const grouped = checklistModel.getGroupedByCategory();

  return `
  <div class="card">
    <h2>Checklist configuration</h2>
    <p class="sub">Manage the rules used to inspect aqua feed documents. Toggle a rule off to exclude it from checks, edit the wording inline, or add your own.</p>
    ${Object.keys(grouped).filter(c => grouped[c].length).map(cat => `
      <div class="catgroup">
        <h3>${escapeHtml(cat)}</h3>
        ${grouped[cat].map(r => `
          <div class="ruleitem" data-id="${r.id}">
            <div class="ruletoggle ${r.enabled ? 'on' : ''}" data-toggle="${r.id}"><div class="knob"></div></div>
            <div class="ruletext">
              <textarea rows="2" data-edit="${r.id}">${escapeHtml(r.rule)}</textarea>
              <select class="rulecat-select" data-cat="${r.id}">
                ${CATEGORIES.map(c => `<option value="${c}" ${c === r.category ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <button class="ruledel" data-del="${r.id}" title="Remove rule">${ICONS.trash}</button>
          </div>
        `).join('')}
      </div>
    `).join('')}
    <div class="addrule">
      <select class="newcat" id="newrule-cat">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      <input type="text" id="newrule-text" placeholder="Add a new checklist rule…" />
      <button class="btn btn-teal btn-sm" id="btn-add-rule">${ICONS.plus} Add</button>
    </div>
  </div>`;
}