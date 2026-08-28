/* ---------------- Document input view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderInputStep(docModel) {
  return `
  <div class="card">
    <h2>Add a document</h2>
    <p class="sub">Paste or type the document's markdown into the box below. Edit freely before checking — the review only sees what's here.</p>

    <textarea class="mdbox" id="mdedit" placeholder="Paste markdown here…">${escapeHtml(docModel.markdown)}</textarea>

    <div class="actionrow">
      <button class="btn btn-ghost" id="btn-download-md" ${docModel.markdown ? '' : 'disabled'}>${ICONS.download} Download .md</button>
      <button class="btn btn-primary" id="btn-run-check" ${docModel.markdown.trim() ? '' : 'disabled'}>
        ${docModel.checking ? '<span class="spinner"></span> Checking…' : ICONS.clipboard + ' Check document'}
      </button>
    </div>
    ${docModel.checkError ? `<div class="errbox">${escapeHtml(docModel.checkError)}</div>` : ''}
  </div>`;
}
