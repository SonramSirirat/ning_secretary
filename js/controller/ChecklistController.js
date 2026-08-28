/* ---------------- Checklist controller ---------------- */
import { renderChecklistView } from '../view/ChecklistView.js';

export class ChecklistController {
  constructor(checklistModel, mountEl) {
    this.checklistModel = checklistModel;
    this.mountEl = mountEl;
    this.activeDocType = null; // set once checklistModel has loaded
  }

  render() {
    const model = this.checklistModel;
    if (!this.activeDocType && model.getDocTypes && model.getAll()) {
      this.activeDocType = model.getDocTypes()[0];
    }
    this.mountEl.innerHTML = renderChecklistView(model, this.activeDocType);
    this._wireEvents();
  }

  _wireEvents() {
    const model = this.checklistModel;

    this.mountEl.querySelectorAll('[data-doctype]').forEach(el => {
      el.addEventListener('click', e => {
        // Ignore clicks on the delete "x" inside the tab — that has its own handler.
        if (e.target.closest('[data-doctype-del]')) return;
        this.activeDocType = el.dataset.doctype;
        this.render();
      });
    });

    this.mountEl.querySelectorAll('[data-doctype-del]').forEach(el => {
      el.addEventListener('click', async e => {
        e.stopPropagation();
        const dt = el.dataset.doctypeDel;
        const removed = await model.removeDocType(dt);
        if (removed && this.activeDocType === dt) {
          this.activeDocType = model.getDocTypes()[0];
        }
        this.render();
      });
    });

    const addDocTypeBtn = document.getElementById('btn-add-doctype');
    if (addDocTypeBtn) {
      addDocTypeBtn.addEventListener('click', async () => {
        const input = document.getElementById('newdoctype-text');
        const name = input.value.trim();
        if (!name) return;
        const added = await model.addDocType(name);
        if (added) this.activeDocType = name;
        this.render();
      });
    }

    this.mountEl.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', async () => {
        await model.toggle(el.dataset.toggle);
        this.render();
      });
    });

    this.mountEl.querySelectorAll('[data-edit]').forEach(el => {
      el.addEventListener('change', async () => {
        await model.setText(el.dataset.edit, el.value);
      });
    });

    this.mountEl.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('change', async () => {
        await model.setCategory(el.dataset.cat, el.value);
        this.render();
      });
    });

    this.mountEl.querySelectorAll('[data-del]').forEach(el => {
      el.addEventListener('click', async () => {
        await model.remove(el.dataset.del);
        this.render();
      });
    });

    const addBtn = document.getElementById('btn-add-rule');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const input = document.getElementById('newrule-text');
        const catSel = document.getElementById('newrule-cat');
        const text = input.value.trim();
        if (!text) return;
        await model.add(this.activeDocType, catSel.value, text);
        this.render();
      });
    }
  }
}
