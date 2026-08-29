/* ---------------- App configuration ---------------- */

export const PROXY_URL_STORAGE_KEY = 'aquacheck-proxy-url';
export const DEFAULT_API_PROXY_URL = '/api';

export function getApiProxyUrl() {
  const saved = localStorage.getItem(PROXY_URL_STORAGE_KEY);
  if (saved && saved.trim()) {
    return saved.trim();
  }
  return DEFAULT_API_PROXY_URL;
}

export function setApiProxyUrl(url) {
  const trimmed = (url || '').trim();
  if (trimmed && trimmed !== DEFAULT_API_PROXY_URL) {
    localStorage.setItem(PROXY_URL_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(PROXY_URL_STORAGE_KEY);
  }
}

// For backward compatibility
export const API_PROXY_URL = DEFAULT_API_PROXY_URL;
