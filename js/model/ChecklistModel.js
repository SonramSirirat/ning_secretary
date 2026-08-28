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

export class ChecklistModel {
  constructor() {
    this.rules = null;    // populated by load()
    this.docTypes = null; // populated by load()
  }

  async load() {
    try {
      const res = await window.storage.get(RULES_STORAGE_KEY, false);
      if (res && res.value) this.rules = JSON.parse(res.value);
    } catch (e) {
      /* not found — fall through to defaults */
    }
    if (!this.rules) {
      this.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
      await this.saveRules();
    }

    try {
      const res = await window.storage.get(DOCTYPES_STORAGE_KEY, false);
      if (res && res.value) this.docTypes = JSON.parse(res.value);
    } catch (e) {
      /* not found — fall through to defaults */
    }
    if (!this.docTypes) {
      this.docTypes = [...DEFAULT_DOC_TYPES];
      await this.saveDocTypes();
    }

    // Defensive: if a rule references a docType that somehow isn't in the
    // persisted list (e.g. imported/edited storage), surface it as a tab
    // rather than silently hiding those rules.
    let changed = false;
    const known = new Set(this.docTypes);
    this.rules.forEach(r => {
      if (!known.has(r.docType)) {
        this.docTypes.push(r.docType);
        known.add(r.docType);
        changed = true;
      }
    });
    if (changed) await this.saveDocTypes();
  }

  async saveRules() {
    try {
      await window.storage.set(RULES_STORAGE_KEY, JSON.stringify(this.rules), false);
    } catch (e) {
      console.error('checklist rules save failed', e);
    }
  }

  async saveDocTypes() {
    try {
      await window.storage.set(DOCTYPES_STORAGE_KEY, JSON.stringify(this.docTypes), false);
    } catch (e) {
      console.error('checklist doc types save failed', e);
    }
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
    if (!trimmed || this.docTypes.includes(trimmed)) return false;
    this.docTypes.push(trimmed);
    await this.saveDocTypes();
    return true;
  }

  async removeDocType(docType) {
    if (this.docTypes.length <= 1) return false; // always keep at least one
    this.docTypes = this.docTypes.filter(d => d !== docType);
    this.rules = this.rules.filter(r => r.docType !== docType);
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
    this.rules.push({ id: 'r_' + Date.now(), docType, category, enabled: true, rule: text });
    await this.saveRules();
  }
}
