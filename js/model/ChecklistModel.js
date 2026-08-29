/* ---------------- Checklist model ---------------- */
/* Owns the checklist data + its persistence. No DOM/view code lives here.
   Rules are grouped two ways:
   - docType: which kind of document the rule applies to (e.g. "Health
     Certificate", "Packing List", "Invoice") — chosen when adding a rule,
     and used to scope both the Checklist Settings tab and which rules a
     compliance check actually runs against.
   - category: the existing rule category (Completeness, Regulatory
     Requirements, etc.), used to sub-group rules within a document type. */

export const DEFAULT_DOC_TYPE = 'Health Certificate';

export const DEFAULT_DOC_TYPES = ['Health Certificate', 'Packing List', 'Invoice'];

export const DEFAULT_RULES = [
  { id: 'r1', docType: DEFAULT_DOC_TYPE, category: 'Completeness', enabled: true, rule: 'Consignor, consignee, and manufacturer details are all stated in full (name and address).' },
  { id: 'r2', docType: DEFAULT_DOC_TYPE, category: 'Completeness', enabled: true, rule: 'Country of origin, place/port of dispatch, and destination port are all stated.' },
  { id: 'r3', docType: DEFAULT_DOC_TYPE, category: 'Completeness', enabled: true, rule: 'Species of raw material are named for every batch listed — none are left blank.' },
  { id: 'r4', docType: DEFAULT_DOC_TYPE, category: 'Regulatory Requirements', enabled: true, rule: 'The heat-treatment statement specifies at least 85°C for at least 15 minutes, or an officially recognized equivalent method.' },
  { id: 'r5', docType: DEFAULT_DOC_TYPE, category: 'Regulatory Requirements', enabled: true, rule: 'Microbiological limits are declared for Salmonella (absence in 25 g) and Enterobacteriaceae, with n / c / m / M values defined.' },
  { id: 'r6', docType: DEFAULT_DOC_TYPE, category: 'Regulatory Requirements', enabled: true, rule: 'The certificate confirms the product is free of ruminant-derived ingredients, verified by PCR or an equivalent method.' },
  { id: 'r7', docType: DEFAULT_DOC_TYPE, category: 'Data Consistency', enabled: true, rule: 'Each batch\u2019s date of manufacture falls before the certificate\u2019s date of issue.' },
  { id: 'r8', docType: DEFAULT_DOC_TYPE, category: 'Data Consistency', enabled: true, rule: 'Batch numbers on any attached sheet match the batch numbers referenced on the main certificate.' },
  { id: 'r9', docType: DEFAULT_DOC_TYPE, category: 'Data Consistency', enabled: false, rule: 'The total package count and net weight stated match the sum of the individual line items.' },
  { id: 'r10', docType: DEFAULT_DOC_TYPE, category: 'Formalities', enabled: true, rule: 'The certificate is signed and bears the official stamp of an authorized veterinary official.' },
];

export const CATEGORIES = ['Completeness', 'Regulatory Requirements', 'Data Consistency', 'Formalities'];

const RULES_STORAGE_KEY = 'checklist-items';
const DOCTYPES_STORAGE_KEY = 'checklist-doctypes';
const ACTIVE_DOCTYPE_STORAGE_KEY = 'checklist-active-doctype';

export class ChecklistModel {
  constructor() {
    this.rules = null;    // populated by load()
    this.docTypes = null; // populated by load()
    this.activeDocType = null;
  }

  async load() {
    // 1. Load Rules from storage
    let loadedRules = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(RULES_STORAGE_KEY);
        if (stored) loadedRules = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read rules from localStorage', e);
    }

    if (!loadedRules && typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      try {
        const res = await window.storage.get(RULES_STORAGE_KEY, false);
        if (res && res.value) loadedRules = JSON.parse(res.value);
      } catch (e) {
        console.warn('Could not read rules from window.storage', e);
      }
    }

    if (Array.isArray(loadedRules)) {
      this.rules = loadedRules;
    } else {
      this.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
      await this.saveRules();
    }

    // 2. Load DocTypes from storage
    let loadedDocTypes = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(DOCTYPES_STORAGE_KEY);
        if (stored) loadedDocTypes = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read docTypes from localStorage', e);
    }

    if (!loadedDocTypes && typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
      try {
        const res = await window.storage.get(DOCTYPES_STORAGE_KEY, false);
        if (res && res.value) loadedDocTypes = JSON.parse(res.value);
      } catch (e) {
        console.warn('Could not read docTypes from window.storage', e);
      }
    }

    if (Array.isArray(loadedDocTypes) && loadedDocTypes.length > 0) {
      this.docTypes = loadedDocTypes;
    } else {
      this.docTypes = [...DEFAULT_DOC_TYPES];
      await this.saveDocTypes();
    }

    // 3. Ensure any docType referenced in rules is registered in docTypes array
    let changed = false;
    const known = new Set(this.docTypes);
    this.rules.forEach(r => {
      if (r && r.docType && !known.has(r.docType)) {
        this.docTypes.push(r.docType);
        known.add(r.docType);
        changed = true;
      }
    });
    if (changed) {
      await this.saveDocTypes();
    }

    // 4. Load persisted active docType
    try {
      if (typeof localStorage !== 'undefined') {
        const active = localStorage.getItem(ACTIVE_DOCTYPE_STORAGE_KEY);
        if (active && this.docTypes.includes(active)) {
          this.activeDocType = active;
        }
      }
    } catch (e) {}

    if (!this.activeDocType && this.docTypes.length > 0) {
      this.activeDocType = this.docTypes[0];
    }
  }

  async saveRules() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(this.rules));
      }
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(RULES_STORAGE_KEY, JSON.stringify(this.rules), false);
      }
    } catch (e) {
      console.error('checklist rules save failed', e);
    }
  }

  async saveDocTypes() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DOCTYPES_STORAGE_KEY, JSON.stringify(this.docTypes));
      }
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(DOCTYPES_STORAGE_KEY, JSON.stringify(this.docTypes), false);
      }
    } catch (e) {
      console.error('checklist doc types save failed', e);
    }
  }

  setActiveDocType(docType) {
    if (this.docTypes && this.docTypes.includes(docType)) {
      this.activeDocType = docType;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ACTIVE_DOCTYPE_STORAGE_KEY, docType);
        }
      } catch (e) {}
    }
  }

  getActiveDocType() {
    if (this.activeDocType && this.docTypes && this.docTypes.includes(this.activeDocType)) {
      return this.activeDocType;
    }
    return this.docTypes ? this.docTypes[0] : DEFAULT_DOC_TYPE;
  }

  getAll() {
    return this.rules;
  }

  getDocTypes() {
    return this.docTypes;
  }

  getEnabled(docType) {
    return this.rules.filter(r => r.enabled && (docType == null || r.docType === docType));
  }

  getCounts(docType) {
    const list = docType ? this.rules.filter(r => r.docType === docType) : this.rules;
    const enabled = list.filter(r => r.enabled).length;
    return { enabled, total: list.length };
  }

  areAllEnabled(docType) {
    const list = docType ? this.rules.filter(r => r.docType === docType) : this.rules;
    return list.length > 0 && list.every(r => r.enabled);
  }

  hasAnyEnabled(docType) {
    const list = docType ? this.rules.filter(r => r.docType === docType) : this.rules;
    return list.some(r => r.enabled);
  }

  areCategoryAllEnabled(docType, category) {
    const list = this.rules.filter(r => r.docType === docType && r.category === category);
    return list.length > 0 && list.every(r => r.enabled);
  }

  async toggleAll(docType, forceState) {
    const list = docType ? this.rules.filter(r => r.docType === docType) : this.rules;
    if (list.length === 0) return;
    const targetState = typeof forceState === 'boolean' ? forceState : !this.areAllEnabled(docType);
    list.forEach(r => { r.enabled = targetState; });
    await this.saveRules();
  }

  async toggleCategory(docType, category, forceState) {
    const list = this.rules.filter(r => r.docType === docType && r.category === category);
    if (list.length === 0) return;
    const targetState = typeof forceState === 'boolean' ? forceState : !this.areCategoryAllEnabled(docType, category);
    list.forEach(r => { r.enabled = targetState; });
    await this.saveRules();
  }

  getGroupedByCategory(docType) {
    const grouped = {};
    CATEGORIES.forEach(c => { grouped[c] = []; });
    this.rules.filter(r => r.docType === docType).forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    return grouped;
  }

  async addDocType(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    if (!this.docTypes.includes(trimmed)) {
      this.docTypes.push(trimmed);
      await this.saveDocTypes();
    }
    this.setActiveDocType(trimmed);
    return true;
  }

  async removeDocType(docType) {
    if (this.docTypes.length <= 1) return false; // always keep at least one
    this.docTypes = this.docTypes.filter(d => d !== docType);
    this.rules = this.rules.filter(r => r.docType !== docType);
    if (this.activeDocType === docType) {
      this.setActiveDocType(this.docTypes[0]);
    }
    await this.saveDocTypes();
    await this.saveRules();
    return true;
  }

  async toggle(id) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.enabled = !rule.enabled;
    await this.saveRules();
  }

  async setText(id, text) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.rule = text.trim();
    await this.saveRules();
  }

  async setCategory(id, category) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.category = category;
    await this.saveRules();
  }

  async remove(id) {
    this.rules = this.rules.filter(r => r.id !== id);
    await this.saveRules();
  }

  async add(docType, category, text) {
    const trimmedText = (text || '').trim();
    if (!trimmedText) return null;
    const newRule = {
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      docType,
      category: category || 'Completeness',
      enabled: true,
      rule: trimmedText,
    };
    this.rules.push(newRule);
    await this.saveRules();
    return newRule;
  }

  async addStarterChecklist(docType) {
    if (!docType) return;
    const starters = [
      { docType, category: 'Completeness', enabled: true, rule: `All standard identification details (parties, dates, reference numbers) for ${docType} are fully stated.` },
      { docType, category: 'Regulatory Requirements', enabled: true, rule: `All required regulatory clauses and declarations for ${docType} comply with destination authority requirements.` },
      { docType, category: 'Data Consistency', enabled: true, rule: `Quantities, weights, and lot/batch descriptions on this ${docType} match cross-referenced export paperwork.` },
      { docType, category: 'Formalities', enabled: true, rule: `Authorized signatory, official stamp, and valid issuance date are present.` },
    ];
    for (const item of starters) {
      this.rules.push({
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        ...item,
      });
    }
    await this.saveRules();
  }
}
