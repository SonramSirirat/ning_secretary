/* ---------------- Checklist settings view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';
import { CATEGORIES } from '../model/ChecklistModel.js';

export function renderChecklistView(checklistModel, activeDocType) {
  if (!checklistModel.getAll()) {
    return `<div class="card"><div class="empty">Loading checklist…</div></div>`;
  }
  const docTypes = checklistModel.getDocTypes();
  const current = docTypes.includes(activeDocType) ? activeDocType : docTypes[0];
  const grouped = checklistModel.getGroupedByCategory(current);
  const hasAnyRules = Object.values(grouped).some(list => list.length);

  return `
  <div class="card">
    <h2>Checklist configuration</h2>
    <p class="sub">Manage the rules used to inspect aqua feed documents, grouped by document type. Toggle a rule off to exclude it from checks, edit the wording inline, or add your own.</p>

    <div class="doctypetabs">
      ${docTypes.map(dt => `
        <div class="doctypetab ${dt === current ? 'active' : ''}" data-doctype="${escapeHtml(dt)}">
          ${escapeHtml(dt)}
          ${docTypes.length > 1 ? `<span class="doctypetab-del" data-doctype-del="${escapeHtml(dt)}" title="Remove document type">${ICONS.x}</span>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="adddoctype">
      <input type="text" id="newdoctype-text" placeholder="Add a document type…e.g. Bill of Lading" />
      <button class="btn btn-ghost btn-sm" id="btn-add-doctype">${ICONS.plus} Add type</button>
    </div>

    ${hasAnyRules ? Object.keys(grouped).filter(c => grouped[c].length).map(cat => `
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
    `).join('') : `<div class="empty">No rules yet for ${escapeHtml(current)}. Add one below.</div>`}

    <div class="addrule">
      <select class="newcat" id="newrule-cat">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      <input type="text" id="newrule-text" placeholder="Add a new checklist rule for ${escapeHtml(current)}…" />
      <button class="btn btn-teal btn-sm" id="btn-add-rule">${ICONS.plus} Add</button>
    </div>
  </div>`;
}