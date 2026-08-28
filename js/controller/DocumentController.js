/* ---------------- Document controller ---------------- */
import { renderStepper } from '../view/StepperView.js';
import { renderInputStep } from '../view/DocumentView.js';
import { renderResultsStep } from '../view/ResultsView.js';
import { runChecklistCheck, AuthError } from '../api/claudeApi.js';

export class DocumentController {
  constructor(docModel, checklistModel, authModel, mountEl) {
    this.docModel = docModel;
    this.checklistModel = checklistModel;
    this.authModel = authModel;
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
      const mdedit = document.getElementById('mdedit');
      const dlBtn = document.getElementById('btn-download-md');
      const checkBtn = document.getElementById('btn-run-check');

      if (mdedit) {
        mdedit.addEventListener('input', e => {
          m.setMarkdown(e.target.value);
          const hasText = e.target.value.trim().length > 0;
          if (checkBtn) checkBtn.disabled = !hasText;
          if (dlBtn) dlBtn.disabled = !hasText;
        });
      }

      if (dlBtn) dlBtn.addEventListener('click', () => m.downloadMarkdown());
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
      const results = await runChecklistCheck(m.markdown, activeRules, this.authModel.key);
      m.results = results;
      m.step = 'results';
      m.resultFilter = 'all';
    } catch (err) {
      console.error(err);
      if (err instanceof AuthError) {
        m.checkError = 'Your access key is no longer valid. Please sign in again.';
        this.authModel.forget();
        this._onAuthLost && this._onAuthLost();
      } else {
        m.checkError = 'The check could not be completed. Please try again.';
      }
    }
    m.checking = false;
    this.render();
  }
}