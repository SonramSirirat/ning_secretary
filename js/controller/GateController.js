/* ---------------- Access key gate controller ---------------- */
import { renderGate } from '../view/GateView.js';
import { verifyKey } from '../api/claudeApi.js';
import { DEFAULT_API_PROXY_URL } from '../config.js';

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
    const toggleProxyBtn = document.getElementById('toggle-proxy-btn');
    const proxyInput = document.getElementById('gate-proxy-url');
    const resetProxyBtn = document.getElementById('reset-proxy-btn');

    if (input) {
      input.addEventListener('input', e => { this.authModel.setKey(e.target.value); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') this._submit(); });
      if (!this.authModel.showProxyConfig) input.focus();
    }
    if (submitBtn) submitBtn.addEventListener('click', () => this._submit());

    if (toggleProxyBtn) {
      toggleProxyBtn.addEventListener('click', () => {
        this.authModel.toggleProxyConfig();
        this.render();
      });
    }

    if (proxyInput) {
      proxyInput.addEventListener('input', e => {
        this.authModel.setProxyUrl(e.target.value);
      });
      proxyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') this._submit();
      });
    }

    if (resetProxyBtn) {
      resetProxyBtn.addEventListener('click', () => {
        this.authModel.setProxyUrl(DEFAULT_API_PROXY_URL);
        this.render();
      });
    }
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
      a.error = err?.message || 'Could not verify the key right now. Please check your proxy URL and try again.';
      // If error relates to proxy unreachable or not found, automatically expand proxy config
      if (err?.message?.includes('proxy') || err?.message?.includes('404')) {
        a.showProxyConfig = true;
      }
      this.render();
    }
  }
}

