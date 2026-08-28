/* ---------------- Stepper view ---------------- */
import { STEPS } from '../model/DocumentModel.js';

const LABELS = { input: 'Document', results: 'Check Results' };

export function renderStepper(docModel) {
  const curIdx = STEPS.indexOf(docModel.step);
  return `<div class="stepper">
    ${STEPS.map((key, i) => {
      const idx = STEPS.indexOf(key);
      const cls = idx === curIdx ? 'active' : (idx < curIdx ? 'done clickable' : '');
      const clickable = idx <= curIdx || (key === 'results' && docModel.results);
      return `<div class="step ${cls} ${clickable ? 'clickable' : ''}" data-step="${key}">
        <div class="step-num">${idx < curIdx ? '✓' : (i + 1)}</div>
        <div class="step-label">${LABELS[key]}</div>
      </div>${i < STEPS.length - 1 ? '<div class="step-sep"></div>' : ''}`;
    }).join('')}
  </div>`;
}
