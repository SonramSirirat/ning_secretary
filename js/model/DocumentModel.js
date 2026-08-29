/* ---------------- Document model ---------------- */
/* Owns the state for the document-under-review: its markdown content,
   which step of the flow we're on, and the outcome of the last check.
   PDF upload/conversion is intentionally not part of this app anymore —
   markdown is supplied directly by typing/pasting into the editor. */

export const STEPS = ['input', 'results'];

export class DocumentModel {
  constructor() {
    this.markdown = '';
    this.docType = null;       // which checklist (by document type) to run against
    this.step = 'input';       // 'input' | 'results'
    this.checking = false;
    this.checkingElapsedSec = 0;
    this.showAbort = false;
    this.checkError = null;
    this.results = null;       // array of {id, status, finding}
    this.checkedDocType = null; // docType the current results were checked against
    this.resultFilter = 'all';
  }

  setMarkdown(text) {
    this.markdown = text;
  }

  reset() {
    this.markdown = '';
    this.step = 'input';
    this.checking = false;
    this.checkingElapsedSec = 0;
    this.showAbort = false;
    this.checkError = null;
    this.results = null;
    this.checkedDocType = null;
    this.resultFilter = 'all';
  }
}
