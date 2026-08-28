/* ---------------- Document input view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderInputStep(docModel, checklistModel) {
  const docTypes = checklistModel.getDocTypes ? checklistModel.getDocTypes() : [];
  const current = docTypes.includes(docModel.docType) ? docModel.docType : docTypes[0];

  return `
  <div class="card">
    <h2>Add a document</h2>
    <p class="sub">Paste or type the document's markdown into the box below. Edit freely before checking — the review only sees what's here.</p>

    ${docTypes.length ? `
      <div class="doctypefield">
        <label for="doctype-select">Document type</label>
        <select id="doctype-select">
          ${docTypes.map(dt => `<option value="${escapeHtml(dt)}" ${dt === current ? 'selected' : ''}>${escapeHtml(dt)}</option>`).join('')}
        </select>
        <span class="doctypefield-hint">Determines which checklist rules this document is checked against.</span>
      </div>
    ` : ''}

    <textarea class="mdbox" id="mdedit" placeholder="Paste markdown here…">${escapeHtml(docModel.markdown)}</textarea>

    <div class="actionrow">
      <button class="btn btn-primary" id="btn-run-check" ${docModel.markdown.trim() ? '' : 'disabled'}>
        ${docModel.checking ? '<span class="spinner"></span> Checking…' : ICONS.clipboard + ' Check document'}
      </button>
    </div>
    ${docModel.checkError ? `<div class="errbox">${escapeHtml(docModel.checkError)}</div>` : ''}
  </div>`;
}
