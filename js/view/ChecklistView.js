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
  const counts = checklistModel.getCounts(current);
  const allEnabled = checklistModel.areAllEnabled(current);
  const hasSome = checklistModel.hasAnyEnabled(current);

  return `
  <div class="card">
    <h2>Checklist configuration</h2>
    <p class="sub">Manage the rules used to inspect aqua feed documents, grouped by document type. Use the toggle switch to select or deselect the checklist, toggle individual rules, edit wording inline, or add your own.</p>

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

    ${hasAnyRules ? `
      <div class="checklist-header-bar">
        <div class="checklist-header-info">
          <div class="checklist-title-label">Checklist for <strong>${escapeHtml(current)}</strong></div>
          <div class="checklist-count-badge">${counts.enabled} of ${counts.total} rules selected</div>
        </div>
        <div class="checklist-switch-control" id="btn-toggle-all-rules" data-doctype-toggle="${escapeHtml(current)}" title="Switch toggle to select or deselect all rules in this checklist">
          <span class="checklist-switch-label">${allEnabled ? 'Deselect entire checklist' : 'Select entire checklist'}</span>
          <div class="ruletoggle ${allEnabled ? 'on' : (hasSome ? 'partial' : '')}">
            <div class="knob"></div>
          </div>
        </div>
      </div>
    ` : ''}

    ${hasAnyRules ? Object.keys(grouped).filter(c => grouped[c].length).map(cat => {
      const catList = grouped[cat];
      const catEnabledCount = catList.filter(r => r.enabled).length;
      const catAllEnabled = catList.length > 0 && catEnabledCount === catList.length;
      const catHasSome = catEnabledCount > 0;

      return `
      <div class="catgroup">
        <div class="catgroup-header">
          <h3>${escapeHtml(cat)} <span class="cat-count">(${catEnabledCount}/${catList.length})</span></h3>
          <div class="cat-toggle-wrap" data-cat-toggle="${escapeHtml(cat)}" data-cat-doctype="${escapeHtml(current)}" title="Toggle to select or deselect all ${escapeHtml(cat)} rules">
            <span class="cat-toggle-label">${catAllEnabled ? 'Deselect category' : 'Select category'}</span>
            <div class="ruletoggle ruletoggle-sm ${catAllEnabled ? 'on' : (catHasSome ? 'partial' : '')}">
              <div class="knob"></div>
            </div>
          </div>
        </div>
        ${catList.map(r => `
          <div class="ruleitem" data-id="${r.id}">
            <div class="ruletoggle ${r.enabled ? 'on' : ''}" data-toggle="${r.id}" title="Toggle rule"><div class="knob"></div></div>
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
      `;
    }).join('') : `
      <div class="empty-checklist-box">
        <p>No checklist rules defined yet for <strong>${escapeHtml(current)}</strong>.</p>
        <p class="sub">Add custom rules below, or populate a starter compliance checklist.</p>
        <div class="empty-checklist-actions">
          <button class="btn btn-primary btn-sm" id="btn-add-starter-rules">${ICONS.clipboard} Populate starter checklist</button>
        </div>
      </div>
    `}

    <div class="addrule">
      <select class="newcat" id="newrule-cat">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      <input type="text" id="newrule-text" placeholder="Add a new checklist rule for ${escapeHtml(current)}… (Press Enter)" />
      <button class="btn btn-teal btn-sm" id="btn-add-rule">${ICONS.plus} Add rule</button>
    </div>
  </div>`;
}