/* ---------------- Document controller ---------------- */
import { renderStepper } from '../view/StepperView.js';
import { renderInputStep } from '../view/DocumentView.js';
import { renderResultsStep } from '../view/ResultsView.js';
import { runChecklistCheck } from '../api/claudeApi.js';

export class DocumentController {
  constructor(docModel, checklistModel, mountEl) {
    this.docModel = docModel;
    this.checklistModel = checklistModel;
    this.mountEl = mountEl;
  }

  render() {
    const m = this.docModel;
    this.mountEl.innerHTML = `
      ${renderStepper(m)}
      ${m.step === 'input' ? renderInputStep(m) : ''}
      ${m.step === 'results' ? renderResultsStep(m, this.checklistModel) : ''}
    `;
    this._wireEvents();
  }

  _wireEvents() {
    const m = this.docModel;

    // Stepper navigation
    this.mountEl.querySelectorAll('.step.clickable').forEach(el => {
      el.addEventListener('click', () => {
        m.step = el.dataset.step;
        this.render();
      });
    });

    if (m.step === 'input') {
      const dz = document.getElementById('dropzone');
      const fi = document.getElementById('fileinput');
      if (dz) {
        dz.addEventListener('click', () => fi.click());
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
        dz.addEventListener('drop', e => {
          e.preventDefault();
          dz.classList.remove('drag');
          if (e.dataTransfer.files.length) this._handleFile(e.dataTransfer.files[0]);
        });
      }
      if (fi) fi.addEventListener('change', e => { if (e.target.files.length) this._handleFile(e.target.files[0]); });

      const mdedit = document.getElementById('mdedit');
      if (mdedit) mdedit.addEventListener('input', e => { m.setMarkdownFromPaste(e.target.value); });

      const dlBtn = document.getElementById('btn-download-md');
      if (dlBtn) dlBtn.addEventListener('click', () => m.downloadMarkdown());

      const checkBtn = document.getElementById('btn-run-check');
      if (checkBtn) checkBtn.addEventListener('click', () => this._runCheck());
    }

    if (m.step === 'results') {
      const recheckBtn = document.getElementById('btn-recheck');
      if (recheckBtn) recheckBtn.addEventListener('click', () => this._runCheck());

      this.mountEl.querySelectorAll('.filterbtn').forEach(el => {
        el.addEventListener('click', () => {
          m.resultFilter = el.dataset.filter;
          this.render();
        });
      });
    }
  }

  async _handleFile(file) {
    const m = this.docModel;
    m.uploadError = null;
    const isMd = file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown';
    if (!isMd) {
      m.uploadError = 'Please upload a .md file.';
      this.render();
      return;
    }
    const text = await file.text();
    m.setMarkdownFromFile(file.name, text);
    this.render();
  }

  async _runCheck() {
    const m = this.docModel;
    m.checking = true;
    m.checkError = null;
    this.render();
    try {
      const activeRules = this.checklistModel.getEnabled();
      if (activeRules.length === 0) {
        m.checkError = 'No checklist rules are enabled. Turn some on in Checklist Settings.';
        m.checking = false;
        this.render();
        return;
      }
      const results = await runChecklistCheck(m.markdown, activeRules);
      m.results = results;
      m.step = 'results';
      m.resultFilter = 'all';
    } catch (err) {
      console.error(err);
      m.checkError = 'The check could not be completed. Please try again.';
    }
    m.checking = false;
    this.render();
  }
}
