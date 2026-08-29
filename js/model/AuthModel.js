/* ---------------- Auth model ---------------- */
/* Holds the shared access key that gates use of the app. This is not a
   login system (no accounts/usernames) — it's a single key, defined by
   whoever deploys the app (Worker secret APP_KEY), that everyone with
   access to the app is expected to know. The Worker is the source of
   truth: it rejects requests whose X-App-Key header doesn't match. */

import { getApiProxyUrl, setApiProxyUrl, DEFAULT_API_PROXY_URL } from '../config.js';

const KEY_STORAGE = 'aquacheck-access-key';

export class AuthModel {
  constructor() {
    this.key = localStorage.getItem(KEY_STORAGE) || '';
    this.proxyUrl = getApiProxyUrl();
    this.showProxyConfig = false;
    this.verified = false;
    this.verifying = false;
    this.error = null;
  }

  setKey(key) {
    this.key = (key || '').trim();
  }

  setProxyUrl(url) {
    this.proxyUrl = (url || '').trim();
    setApiProxyUrl(this.proxyUrl);
  }

  toggleProxyConfig(show) {
    this.showProxyConfig = typeof show === 'boolean' ? show : !this.showProxyConfig;
  }

  persist() {
    if (this.key) localStorage.setItem(KEY_STORAGE, this.key);
    setApiProxyUrl(this.proxyUrl);
  }

  forget() {
    this.key = '';
    this.verified = false;
    localStorage.removeItem(KEY_STORAGE);
  }
}

