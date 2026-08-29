/* ---------------- Document input view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderInputStep(docModel, checklistModel) {
  const docTypes = checklistModel.getDocTypes ? checklistModel.getDocTypes() : [];
  const current = docTypes.includes(docModel.docType) ? docModel.docType : docTypes[0];
  const counts = checklistModel.getCounts ? checklistModel.getCounts(current) : { enabled: 0, total: 0 };
  const allEnabled = checklistModel.areAllEnabled ? checklistModel.areAllEnabled(current) : false;
  const hasSome = checklistModel.hasAnyEnabled ? checklistModel.hasAnyEnabled(current) : false;

  return `
  <div class="card">
    <h2>Add a document</h2>
    <p class="sub">Paste or type the document's markdown into the box below. Edit freely before checking — the review only sees what's here.</p>

    ${docTypes.length ? `
      <div class="doctypefield">
        <div class="doctypefield-top">
          <label for="doctype-select">Document type</label>
          <div class="doc-checklist-toggle-wrap" id="btn-toggle-doc-rules" data-doctype="${escapeHtml(current)}" title="Switch toggle to select or deselect this entire checklist">
            <span class="doc-checklist-toggle-text">${counts.enabled} of ${counts.total} rules selected</span>
            <div class="ruletoggle ruletoggle-sm ${allEnabled ? 'on' : (hasSome ? 'partial' : '')}">
              <div class="knob"></div>
            </div>
          </div>
        </div>
        <select id="doctype-select">
          ${docTypes.map(dt => `<option value="${escapeHtml(dt)}" ${dt === current ? 'selected' : ''}>${escapeHtml(dt)}</option>`).join('')}
        </select>
        <span class="doctypefield-hint">Determines which checklist rules this document is checked against. Toggle switch above to select or deselect this checklist.</span>
      </div>
    ` : ''}

    <textarea class="mdbox" id="mdedit" placeholder="Paste markdown here…">${escapeHtml(docModel.markdown)}</textarea>

    <div class="actionrow">
      <button class="btn btn-primary" id="btn-run-check" ${docModel.markdown.trim() && counts.enabled > 0 && !docModel.checking ? '' : 'disabled'}>
        ${docModel.checking ? `<span class="spinner"></span> Checking… <span class="checking-elapsed-tag" id="checking-elapsed-time">(${docModel.checkingElapsedSec}s)</span>` : ICONS.clipboard + ' Check document'}
      </button>

      ${docModel.checking && docModel.showAbort ? `
        <button class="btn btn-danger" id="btn-abort-check" type="button" title="Cancel this inspection check">
          ${ICONS.stop} Abort check
        </button>
      ` : ''}
    </div>
    ${counts.enabled === 0 ? `<div class="warnbox">All rules for "${escapeHtml(current)}" are currently deselected. Use the toggle switch above or visit Checklist Settings to enable rules.</div>` : ''}
    ${docModel.checkError ? `<div class="errbox">${escapeHtml(docModel.checkError)}</div>` : ''}
  </div>`;
}
