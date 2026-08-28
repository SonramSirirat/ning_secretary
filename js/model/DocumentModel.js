/* ---------------- Document model ---------------- */
/* Owns the state for the document-under-review: its markdown content,
   which step of the flow we're on, and the outcome of the last check.
   PDF upload/conversion is intentionally not part of this app anymore —
   markdown is supplied directly by typing/pasting into the editor. */

export const STEPS = ['input', 'results'];

export class DocumentModel {
  constructor() {
    this.markdown = '';
    this.step = 'input';       // 'input' | 'results'
    this.checking = false;
    this.checkError = null;
    this.results = null;       // array of {id, status, finding}
    this.resultFilter = 'all';
  }

  setMarkdown(text) {
    this.markdown = text;
  }

  reset() {
    this.markdown = '';
    this.step = 'input';
    this.checking = false;
    this.checkError = null;
    this.results = null;
    this.resultFilter = 'all';
  }

  downloadMarkdown() {
    const blob = new Blob([this.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
