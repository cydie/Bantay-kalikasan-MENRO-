import type { EntityName } from './storage';

export type SyncOperationType = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type ConnectionStatus = 'online' | 'offline' | 'syncing';

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

export interface BatchSyncOperation {
  queueId: number;
  module: string;
  operation: SyncOperationType;
  localId: string;
  localUpdatedAt: string;
  payload: Record<string, unknown>;
}

export interface BatchSyncResultItem {
  queueId: number;
  success: boolean;
  localId: string;
  serverId?: string;
  serverRecord?: Record<string, unknown>;
  conflict?: boolean;
  conflictResolution?: 'local' | 'server';
  error?: string;
}

export interface BatchSyncResponse {
  results: BatchSyncResultItem[];
  synced: number;
  failed: number;
  conflicts: number;
}

export interface ServerSyncStatus {
  pendingOnServer: number;
  totalLogs: number;
  recentLogs: Array<{
    id: string;
    module_name: string;
    record_id: string;
    operation_type: string;
    status: string;
    message: string;
    performed_by: string;
    created_at: string;
  }>;
  lastSyncAt: string | null;
}

export interface RefreshResult {
  synced: number;
  failed: number;
  conflicts: number;
  pulled: number;
  pullErrors: string[];
}

export const SYNC_PENDING_MARKER = '_syncStatus' as const;
export const LOCAL_UPDATED_AT = '_localUpdatedAt' as const;
