/* ---------------- Access key gate controller ---------------- */
import { renderGate } from '../view/GateView.js';
import { verifyKey } from '../api/claudeApi.js';

export class GateController {
  constructor(authModel, mountEl, onVerified) {
    this.authModel = authModel;
    this.mountEl = mountEl;
    this.onVerified = onVerified;
  }

  render() {
    this.mountEl.innerHTML = renderGate(this.authModel);
    this._wireEvents();
  }

  _wireEvents() {
    const input = document.getElementById('gate-key');
    const submitBtn = document.getElementById('gate-submit');

    if (input) {
      input.addEventListener('input', e => { this.authModel.setKey(e.target.value); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') this._submit(); });
      input.focus();
    }
    if (submitBtn) submitBtn.addEventListener('click', () => this._submit());
  }

  async _submit() {
    const a = this.authModel;
    if (!a.key) {
      a.error = 'Enter an access key.';
      this.render();
      return;
    }
    a.verifying = true;
    a.error = null;
    this.render();
    try {
      const ok = await verifyKey(a.key);
      if (ok) {
        a.verified = true;
        a.persist();
        a.verifying = false;
        this.onVerified();
      } else {
        a.verifying = false;
        a.error = 'That access key was not recognized.';
        this.render();
      }
    } catch (err) {
      console.error(err);
      a.verifying = false;
      a.error = 'Could not verify the key right now. Please try again.';
      this.render();
    }
  }
}
