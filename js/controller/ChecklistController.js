/* ---------------- Checklist controller ---------------- */
import { renderChecklistView } from '../view/ChecklistView.js';

export class ChecklistController {
  constructor(checklistModel, mountEl) {
    this.checklistModel = checklistModel;
    this.mountEl = mountEl;
  }

  render() {
    this.mountEl.innerHTML = renderChecklistView(this.checklistModel);
    this._wireEvents();
  }

  _wireEvents() {
    const model = this.checklistModel;

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
        await model.add(catSel.value, text);
        this.render();
      });
    }
  }
}
