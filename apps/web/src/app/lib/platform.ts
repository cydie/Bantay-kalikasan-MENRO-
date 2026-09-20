export type Platform = 'desktop' | 'web';

export function getPlatform(): Platform {
  if (typeof window !== 'undefined' && window.electronAPI?.isDesktop) {
    return 'desktop';
  }
  return 'web';
}

export function isDesktop(): boolean {
  return getPlatform() === 'desktop';
}

export function isWeb(): boolean {
  return getPlatform() === 'web';
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function getAuthTokenKey(): string {
  return isDesktop() ? 'desktop_authToken' : 'web_authToken';
}

const API_BASE_STORAGE_KEY = 'bantay_api_base_url';

/** Normalize API root, e.g. http://192.168.1.10:3001/api */
export function normalizeApiBase(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

export function getApiBase(): string {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_URL || '/api';
  }

  const saved = localStorage.getItem(API_BASE_STORAGE_KEY);
  if (saved) return normalizeApiBase(saved);

  const electronUrl = window.electronAPI?.apiUrl;
  if (electronUrl) return normalizeApiBase(electronUrl);

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return normalizeApiBase(envUrl);
  }

  // Web on LAN: when served from the API host (port 3001), use same-origin /api
  const { hostname, port, protocol } = window.location;
  if (isWeb() && port === '3001' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001/api`;
  }

  return envUrl || '/api';
}

export function setApiBase(url: string) {
  localStorage.setItem(API_BASE_STORAGE_KEY, normalizeApiBase(url));
}

export function clearApiBaseOverride() {
  localStorage.removeItem(API_BASE_STORAGE_KEY);
}
