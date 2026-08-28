/* ---------------- App controller ---------------- */
import { DocumentModel } from '../model/DocumentModel.js';
import { ChecklistModel } from '../model/ChecklistModel.js';
import { DocumentController } from './DocumentController.js';
import { ChecklistController } from './ChecklistController.js';

export class AppController {
  constructor() {
    this.mainTab = 'document'; // 'document' | 'checklist'
    this.docModel = new DocumentModel();
    this.checklistModel = new ChecklistModel();
    this.documentController = new DocumentController(
      this.docModel,
      this.checklistModel,
      document.getElementById('view-document')
    );
    this.checklistController = new ChecklistController(
      this.checklistModel,
      document.getElementById('view-checklist')
    );
  }

  async init() {
    this._wireTabs();
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
