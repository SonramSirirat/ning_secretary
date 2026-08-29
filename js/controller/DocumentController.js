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
    this._abortController = null;
    this._timerInterval = null;
  }

  render() {
    const m = this.docModel;
    // Default the doc-type selection once the checklist has loaded.
    if (this.checklistModel.getDocTypes && this.checklistModel.getAll()) {
      const docTypes = this.checklistModel.getDocTypes();
      if (!m.docType || !docTypes.includes(m.docType)) {
        m.docType = this.checklistModel.getActiveDocType();
      }
    }
    this.mountEl.innerHTML = `
      ${renderStepper(m)}
      ${m.step === 'input' ? renderInputStep(m, this.checklistModel) : ''}
      ${m.step === 'results' ? renderResultsStep(m, this.checklistModel) : ''}
    `;
    this._wireEvents();
  }

  _wireEvents() {
    const m = this.docModel;

    // Stepper navigation
    this.mountEl.querySelectorAll('.step.clickable').forEach(el => {
      el.addEventListener('click', () => {
        if (m.checking) return; // Prevent navigation while checking
        m.step = el.dataset.step;
        this.render();
      });
    });

    // Abort button event (shared across steps)
    const abortBtn = document.getElementById('btn-abort-check');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => this._abortCurrentCheck());
    }

    if (m.step === 'input') {
      const mdedit = document.getElementById('mdedit');
      const checkBtn = document.getElementById('btn-run-check');
      const docTypeSelect = document.getElementById('doctype-select');

      if (mdedit) {
        mdedit.addEventListener('input', e => {
          m.setMarkdown(e.target.value);
          const hasText = e.target.value.trim().length > 0;
          if (checkBtn && !m.checking) checkBtn.disabled = !hasText;
        });
      }

      if (docTypeSelect) {
        docTypeSelect.addEventListener('change', e => {
          m.docType = e.target.value;
          this.checklistModel.setActiveDocType(e.target.value);
          this.render();
        });
      }

      const toggleDocRulesBtn = document.getElementById('btn-toggle-doc-rules');
      if (toggleDocRulesBtn) {
        toggleDocRulesBtn.addEventListener('click', async () => {
          if (m.checking) return;
          const dt = toggleDocRulesBtn.dataset.doctype || m.docType;
          await this.checklistModel.toggleAll(dt);
          this.render();
        });
      }

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

  _cleanupCheckingState() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _abortCurrentCheck() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._cleanupCheckingState();
    const m = this.docModel;
    m.checking = false;
    m.showAbort = false;
    m.checkingElapsedSec = 0;
    m.checkError = 'Checking was aborted.';
    this.render();
  }

  async _runCheck() {
    const m = this.docModel;
    if (m.checking) return;

    this._cleanupCheckingState();
    this._abortController = new AbortController();

    m.checking = true;
    m.checkingElapsedSec = 0;
    m.showAbort = false;
    m.checkError = null;
    this.render();

    const startTime = Date.now();
    this._timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      m.checkingElapsedSec = elapsed;

      if (elapsed >= 3 && !m.showAbort) {
        m.showAbort = true;
        this.render();
      } else {
        // Update elapsed time text directly in DOM to avoid rebuilding the DOM every second
        const elapsedEl = document.getElementById('checking-elapsed-time');
        if (elapsedEl) {
          elapsedEl.textContent = `(${elapsed}s)`;
        }
      }
    }, 500);

    try {
      const activeRules = this.checklistModel.getEnabled(m.docType);
      if (activeRules.length === 0) {
        this._cleanupCheckingState();
        m.checking = false;
        m.showAbort = false;
        m.checkError = `No checklist rules are enabled for "${m.docType}". Turn some on in Checklist Settings.`;
        this.render();
        return;
      }
      const results = await runChecklistCheck(
        m.markdown,
        activeRules,
        this.authModel.key,
        this._abortController.signal
      );
      this._cleanupCheckingState();
      this._abortController = null;
      m.checking = false;
      m.showAbort = false;
      m.results = results;
      m.checkedDocType = m.docType;
      m.step = 'results';
      m.resultFilter = 'all';
    } catch (err) {
      this._cleanupCheckingState();
      this._abortController = null;
      m.checking = false;
      m.showAbort = false;
      console.error(err);

      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        m.checkError = 'Checking was aborted.';
      } else if (err instanceof AuthError) {
        m.checkError = 'Your access key is no longer valid. Please sign in again.';
        this.authModel.forget();
        this._onAuthLost && this._onAuthLost();
      } else {
        m.checkError = err?.message || 'The check could not be completed. Please try again.';
      }
    }
    this.render();
  }
}