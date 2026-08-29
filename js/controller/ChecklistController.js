/* ---------------- Checklist controller ---------------- */
import { renderChecklistView } from '../view/ChecklistView.js';

export class ChecklistController {
  constructor(checklistModel, mountEl) {
    this.checklistModel = checklistModel;
    this.mountEl = mountEl;
    this.activeDocType = null;
  }

  render() {
    const model = this.checklistModel;
    if (model.getDocTypes && model.getAll()) {
      if (!this.activeDocType || !model.getDocTypes().includes(this.activeDocType)) {
        this.activeDocType = model.getActiveDocType();
      }
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
        const dt = el.dataset.doctype;
        this.activeDocType = dt;
        model.setActiveDocType(dt);
        this.render();
      });
    });

    this.mountEl.querySelectorAll('[data-doctype-del]').forEach(el => {
      el.addEventListener('click', async e => {
        e.stopPropagation();
        const dt = el.dataset.doctypeDel;
        const removed = await model.removeDocType(dt);
        if (removed && this.activeDocType === dt) {
          this.activeDocType = model.getActiveDocType();
        }
        this.render();
      });
    });

    const addDocTypeInput = document.getElementById('newdoctype-text');
    const addDocTypeBtn = document.getElementById('btn-add-doctype');

    const handleAddDocType = async () => {
      if (!addDocTypeInput) return;
      const name = addDocTypeInput.value.trim();
      if (!name) return;
      const added = await model.addDocType(name);
      if (added) {
        this.activeDocType = name;
        model.setActiveDocType(name);
      }
      this.render();
    };

    if (addDocTypeBtn) addDocTypeBtn.addEventListener('click', handleAddDocType);
    if (addDocTypeInput) {
      addDocTypeInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddDocType();
        }
      });
    }

    const starterRulesBtn = document.getElementById('btn-add-starter-rules');
    if (starterRulesBtn) {
      starterRulesBtn.addEventListener('click', async () => {
        await model.addStarterChecklist(this.activeDocType);
        this.render();
      });
    }

    const toggleAllBtn = document.getElementById('btn-toggle-all-rules');
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', async () => {
        const dt = toggleAllBtn.dataset.doctypeToggle || this.activeDocType;
        await model.toggleAll(dt);
        this.render();
      });
    }

    this.mountEl.querySelectorAll('[data-cat-toggle]').forEach(el => {
      el.addEventListener('click', async () => {
        const cat = el.dataset.catToggle;
        const dt = el.dataset.catDoctype || this.activeDocType;
        await model.toggleCategory(dt, cat);
        this.render();
      });
    });

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

    const addRuleInput = document.getElementById('newrule-text');
    const addRuleCatSel = document.getElementById('newrule-cat');
    const addRuleBtn = document.getElementById('btn-add-rule');

    const handleAddRule = async () => {
      if (!addRuleInput || !addRuleCatSel) return;
      const text = addRuleInput.value.trim();
      if (!text) return;
      await model.add(this.activeDocType, addRuleCatSel.value, text);
      this.render();
      const nextInput = document.getElementById('newrule-text');
      if (nextInput) nextInput.focus();
    };

    if (addRuleBtn) addRuleBtn.addEventListener('click', handleAddRule);
    if (addRuleInput) {
      addRuleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddRule();
        }
      });
    }
  }
}

