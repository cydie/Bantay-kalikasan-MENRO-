import { isDesktop } from '../platform';
import { desktopStorage } from './desktop-storage';
import type { LocalStorageAdapter } from './types';

let adapter: LocalStorageAdapter | null = null;
let initPromise: Promise<LocalStorageAdapter> | null = null;

export function getStorage(): LocalStorageAdapter {
  if (!isDesktop()) {
    throw new Error('Local storage is only available in the desktop app');
  }
  if (!adapter) {
    adapter = desktopStorage;
  }
  return adapter;
}

export async function initStorage(): Promise<LocalStorageAdapter> {
  if (!isDesktop()) {
    throw new Error('Local storage is only available in the desktop app');
  }

  if (adapter) return adapter;

  if (!initPromise) {
    initPromise = (async () => {
      const storage = getStorage();
      await storage.init();
      adapter = storage;
      return storage;
    })();
  }

  return initPromise;
}

export { type LocalStorageAdapter, type EntityName, type SyncQueueItem } from './types';
