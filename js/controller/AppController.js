/* ---------------- App controller ---------------- */
import { DocumentModel } from '../model/DocumentModel.js';
import { ChecklistModel } from '../model/ChecklistModel.js';
import { AuthModel } from '../model/AuthModel.js';
import { DocumentController } from './DocumentController.js';
import { ChecklistController } from './ChecklistController.js';
import { GateController } from './GateController.js';
import { verifyKey } from '../api/claudeApi.js';

export class AppController {
  constructor() {
    this.mainTab = 'document'; // 'document' | 'checklist'
    this.docModel = new DocumentModel();
    this.checklistModel = new ChecklistModel();
    this.authModel = new AuthModel();

    this.gateEl = document.getElementById('view-gate');
    this.shellEl = document.getElementById('app-shell');

    this.gateController = new GateController(this.authModel, this.gateEl, () => this._boot());
    this.documentController = new DocumentController(
      this.docModel,
      this.checklistModel,
      this.authModel,
      document.getElementById('view-document')
    );
    this.checklistController = new ChecklistController(
      this.checklistModel,
      document.getElementById('view-checklist')
    );
    // If a request comes back 401 mid-session (e.g. the key was rotated),
    // drop back to the gate instead of leaving the user stuck.
    this.documentController._onAuthLost = () => this._showGate();
  }

  async init() {
    this._wireTabs();

    // If we have a remembered key, verify it silently before showing anything.
    if (this.authModel.key) {
      this.authModel.verifying = true;
      try {
        const ok = await verifyKey(this.authModel.key);
        if (ok) {
          this.authModel.verified = true;
          await this._boot();
          return;
        }
      } catch (e) {
        /* fall through to gate */
      }
      this.authModel.forget();
    }
    this._showGate();
  }

  _showGate() {
    this.authModel.verified = false;
    this.authModel.verifying = false;
    this.shellEl.style.display = 'none';
    this.gateEl.style.display = '';
    this.gateController.render();
  }

  async _boot() {
    this.gateEl.style.display = 'none';
    this.shellEl.style.display = '';
    await this.checklistModel.load();
    this.render();
  }

  _wireTabs() {
    document.getElementById('tab-document').addEventListener('click', () => {
      this.mainTab = 'document';
      this.render();
    });
    document.getElementById('tab-checklist').addEventListener('click', () => {
      this.mainTab = 'checklist';
      this.render();
    });
  }

  render() {
    document.getElementById('tab-document').classList.toggle('active', this.mainTab === 'document');
    document.getElementById('tab-checklist').classList.toggle('active', this.mainTab === 'checklist');
    document.getElementById('view-document').style.display = this.mainTab === 'document' ? '' : 'none';
    document.getElementById('view-checklist').style.display = this.mainTab === 'checklist' ? '' : 'none';
    this.documentController.render();
    this.checklistController.render();
  }
}
