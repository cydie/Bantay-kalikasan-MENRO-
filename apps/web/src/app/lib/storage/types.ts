export type EntityName =
  | 'inquiries'
  | 'activities'
  | 'employees'
  | 'records'
  | 'history'
  | 'services'
  | 'adminStaff';

export type SyncOperationType = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id?: number;
  method: string;
  path: string;
  body?: string;
  created_at: string;
  status: SyncStatus;
  record_id?: string;
  module_name?: EntityName | string;
  operation_type?: SyncOperationType;
  local_updated_at?: string;
  error_message?: string;
  retry_count?: number;
}

export interface SyncLogEntry {
  id?: number;
  queue_id?: number;
  module_name: string;
  record_id: string;
  operation_type: SyncOperationType;
  status: 'success' | 'failed' | 'conflict';
  message: string;
  created_at: string;
}

export interface SyncMetadata {
  last_sync_at: string | null;
  last_sync_status: 'success' | 'partial' | 'failed' | 'idle';
  total_synced: number;
  total_failed: number;
  total_conflicts: number;
}

export interface LocalStorageAdapter {
  readonly platform: 'desktop' | 'web';

  init(): Promise<void>;

  getAll<T>(entity: EntityName): Promise<T[]>;
  upsert<T extends { id: string }>(entity: EntityName, items: T | T[]): Promise<void>;
  remove(entity: EntityName, id: string): Promise<void>;
  replaceAll<T extends { id: string }>(entity: EntityName, items: T[]): Promise<void>;

  getCache<T>(path: string): Promise<T | null>;
  setCache<T>(path: string, data: T): Promise<void>;

  getSyncQueue(): Promise<SyncQueueItem[]>;
  getSyncQueueStats?(): Promise<{ pending: number; failed: number; syncing: number }>;
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'status'>): Promise<void>;
  markSyncQueueSynced(ids: number[]): Promise<void>;
  markSyncQueueFailed?(id: number, errorMessage: string): Promise<void>;
  resetFailedSyncQueue?(): Promise<void>;
  clearFailedSyncQueue(): Promise<void>;

  addSyncLog?(entry: Omit<SyncLogEntry, 'id'>): Promise<void>;
  getSyncLogs?(limit?: number): Promise<SyncLogEntry[]>;
  setIdMapping?(localId: string, moduleName: string, serverId: string): Promise<void>;
  getIdMapping?(localId: string, moduleName: string): Promise<string | null>;
  getSyncMetadata?(): Promise<SyncMetadata>;
  updateSyncMetadata?(updates: Partial<SyncMetadata>): Promise<void>;
}
