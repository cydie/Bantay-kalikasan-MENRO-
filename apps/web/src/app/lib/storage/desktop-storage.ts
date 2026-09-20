import type {
  EntityName,
  LocalStorageAdapter,
  SyncLogEntry,
  SyncMetadata,
  SyncQueueItem,
} from './types';

export class DesktopStorageAdapter implements LocalStorageAdapter {
  readonly platform = 'desktop' as const;

  private get api() {
    if (!window.electronAPI?.storage) {
      throw new Error('Desktop storage API is not available');
    }
    return window.electronAPI.storage;
  }

  async init(): Promise<void> {
    await this.api.init();
  }

  async getAll<T>(entity: EntityName): Promise<T[]> {
    return this.api.getAll(entity) as Promise<T[]>;
  }

  async upsert<T extends { id: string }>(entity: EntityName, items: T | T[]): Promise<void> {
    await this.api.upsert(entity, items);
  }

  async remove(entity: EntityName, id: string): Promise<void> {
    await this.api.remove(entity, id);
  }

  async replaceAll<T extends { id: string }>(entity: EntityName, items: T[]): Promise<void> {
    await this.api.replaceAll(entity, items);
  }

  async getCache<T>(path: string): Promise<T | null> {
    return this.api.getCache(path) as Promise<T | null>;
  }

  async setCache<T>(path: string, data: T): Promise<void> {
    await this.api.setCache(path, data);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.api.getSyncQueue();
  }

  async getSyncQueueStats(): Promise<{ pending: number; failed: number; syncing: number }> {
    return this.api.getSyncQueueStats();
  }

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'status'>): Promise<void> {
    await this.api.addToSyncQueue(item);
  }

  async markSyncQueueSynced(ids: number[]): Promise<void> {
    await this.api.markSyncQueueSynced(ids);
  }

  async markSyncQueueFailed(id: number, errorMessage: string): Promise<void> {
    await this.api.markSyncQueueFailed(id, errorMessage);
  }

  async resetFailedSyncQueue(): Promise<void> {
    await this.api.resetFailedSyncQueue();
  }

  async clearFailedSyncQueue(): Promise<void> {
    await this.api.clearFailedSyncQueue();
  }

  async addSyncLog(entry: Omit<SyncLogEntry, 'id'>): Promise<void> {
    await this.api.addSyncLog(entry);
  }

  async getSyncLogs(limit?: number): Promise<SyncLogEntry[]> {
    return this.api.getSyncLogs(limit);
  }

  async setIdMapping(localId: string, moduleName: string, serverId: string): Promise<void> {
    await this.api.setIdMapping(localId, moduleName, serverId);
  }

  async getIdMapping(localId: string, moduleName: string): Promise<string | null> {
    return this.api.getIdMapping(localId, moduleName);
  }

  async getSyncMetadata(): Promise<SyncMetadata> {
    return this.api.getSyncMetadata();
  }

  async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    await this.api.updateSyncMetadata(updates);
  }
}

export const desktopStorage = new DesktopStorageAdapter();
