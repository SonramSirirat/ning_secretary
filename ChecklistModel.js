/* ---------------- Checklist model ---------------- */
/* Owns the checklist data + its persistence. No DOM/view code lives here. */

export const DEFAULT_RULES = [
  { id: 'r1', category: 'Completeness', enabled: true, rule: 'Consignor, consignee, and manufacturer details are all stated in full (name and address).' },
  { id: 'r2', category: 'Completeness', enabled: true, rule: 'Country of origin, place/port of dispatch, and destination port are all stated.' },
  { id: 'r3', category: 'Completeness', enabled: true, rule: 'Species of raw material are named for every batch listed — none are left blank.' },
  { id: 'r4', category: 'Regulatory Requirements', enabled: true, rule: 'The heat-treatment statement specifies at least 85°C for at least 15 minutes, or an officially recognized equivalent method.' },
  { id: 'r5', category: 'Regulatory Requirements', enabled: true, rule: 'Microbiological limits are declared for Salmonella (absence in 25 g) and Enterobacteriaceae, with n / c / m / M values defined.' },
  { id: 'r6', category: 'Regulatory Requirements', enabled: true, rule: 'The certificate confirms the product is free of ruminant-derived ingredients, verified by PCR or an equivalent method.' },
  { id: 'r7', category: 'Data Consistency', enabled: true, rule: 'Each batch\u2019s date of manufacture falls before the certificate\u2019s date of issue.' },
  { id: 'r8', category: 'Data Consistency', enabled: true, rule: 'Batch numbers on any attached sheet match the batch numbers referenced on the main certificate.' },
  { id: 'r9', category: 'Data Consistency', enabled: false, rule: 'The total package count and net weight stated match the sum of the individual line items.' },
  { id: 'r10', category: 'Formalities', enabled: true, rule: 'The certificate is signed and bears the official stamp of an authorized veterinary official.' },
];

export const CATEGORIES = ['Completeness', 'Regulatory Requirements', 'Data Consistency', 'Formalities'];

const STORAGE_KEY = 'checklist-items';

export class ChecklistModel {
  constructor() {
    this.rules = null; // populated by load()
  }

  async load() {
    try {
      const res = await window.storage.get(STORAGE_KEY, false);
      if (res && res.value) {
        this.rules = JSON.parse(res.value);
        return;
      }
    } catch (e) {
      /* not found — fall through to defaults */
    }
    this.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    await this.save();
  }

  async save() {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(this.rules), false);
    } catch (e) {
      console.error('checklist save failed', e);
    }
  }

  getAll() {
    return this.rules;
  }

  getEnabled() {
    return this.rules.filter(r => r.enabled);
  }

  getGroupedByCategory() {
    const grouped = {};
    CATEGORIES.forEach(c => { grouped[c] = []; });
    this.rules.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    return grouped;
  }

  async toggle(id) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.enabled = !rule.enabled;
    await this.save();
  }

  async setText(id, text) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.rule = text.trim();
    await this.save();
  }

  async setCategory(id, category) {
    const rule = this.rules.find(r => r.id === id);
    if (!rule) return;
    rule.category = category;
    await this.save();
  }

  async remove(id) {
    this.rules = this.rules.filter(r => r.id !== id);
    await this.save();
  }

  async add(category, text) {
    this.rules.push({ id: 'r_' + Date.now(), category, enabled: true, rule: text });
    await this.save();
  }
}
