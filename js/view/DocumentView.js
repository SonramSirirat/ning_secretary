/* ---------------- Document input view ---------------- */
import { ICONS } from './icons.js';
import { escapeHtml } from '../util/helpers.js';

export function renderInputStep(docModel) {
  return `
  <div class="card">
    <h2>Add a document</h2>
    <p class="sub">Upload a markdown file, or paste markdown directly into the box below. Edit freely before checking — the review only sees what's here.</p>

    <div class="dropzone" id="dropzone">
      ${ICONS.upload}
      <div class="dz-title">Drop a .md file here, or click to browse</div>
      <div class="dz-sub">Accepts .md / text markdown</div>
    </div>
    <input type="file" id="fileinput" accept=".md,text/markdown" />

    ${docModel.fileName ? `
      <div class="filebar">
        <div>${ICONS.file} <span class="fname">${escapeHtml(docModel.fileName)}</span></div>
        <div class="fmeta">markdown</div>
      </div>
    ` : ''}

    <p class="sub" style="margin-top:20px;margin-bottom:8px;">Or paste / edit markdown directly:</p>
    <textarea class="mdbox" id="mdedit" placeholder="Paste markdown here…">${escapeHtml(docModel.markdown)}</textarea>

    <div class="actionrow">
      <button class="btn btn-ghost" id="btn-download-md" ${docModel.markdown ? '' : 'disabled'}>${ICONS.download} Download .md</button>
      <button class="btn btn-primary" id="btn-run-check" ${docModel.markdown.trim() ? '' : 'disabled'}>
        ${docModel.checking ? '<span class="spinner"></span> Checking…' : ICONS.clipboard + ' Check document'}
      </button>
    </div>
    ${docModel.checkError ? `<div class="errbox">${escapeHtml(docModel.checkError)}</div>` : ''}
    ${docModel.uploadError ? `<div class="errbox">${escapeHtml(docModel.uploadError)}</div>` : ''}
  </div>`;
}
