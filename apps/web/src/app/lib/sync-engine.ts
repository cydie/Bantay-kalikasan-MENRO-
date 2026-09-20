import { getAuthTokenKey, getApiBase, isDesktop } from './platform';
import { probeServerConnectivity } from './connectivity';
import { initStorage } from './storage';
import type { EntityName } from './storage';
import type {
  BatchSyncOperation,
  BatchSyncResponse,
  RefreshResult,
  SyncOperationType,
} from './sync-types';
import { LOCAL_UPDATED_AT, SYNC_PENDING_MARKER } from './sync-types';

const BATCH_SIZE = 50;

const ENTITY_ROUTES: Record<string, EntityName> = {
  '/inquiries': 'inquiries',
  '/activities': 'activities',
  '/employees': 'employees',
  '/records': 'records',
  '/history': 'history',
  '/services': 'services',
  '/admin-staff': 'adminStaff',
};

const PULL_ROUTES = [
  '/inquiries',
  '/activities',
  '/employees',
  '/records',
  '/history',
  '/services',
  '/services/manage',
  '/departments',
];

function getEntityFromPath(path: string): EntityName | null {
  const base = path.split('?')[0];
  for (const [route, entity] of Object.entries(ENTITY_ROUTES)) {
    if (base === route || base.startsWith(`${route}/`)) {
      return entity;
    }
  }
  return null;
}

function methodToOperation(method: string): SyncOperationType {
  if (method === 'POST') return 'create';
  if (method === 'DELETE') return 'delete';
  return 'update';
}

function getToken(): string | null {
  return localStorage.getItem(getAuthTokenKey());
}

async function fetchFromNetwork<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

function validateQueueItem(item: {
  method: string;
  path: string;
  body?: string;
  module_name?: string;
}): string | null {
  if (!item.method || !item.path) return 'Missing method or path';
  const module = item.module_name || getEntityFromPath(item.path);
  if (!module) return 'Unknown module';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(item.method) === -1) return 'Invalid HTTP method';
  if (item.method !== 'DELETE' && !item.body) return 'Missing request body';
  return null;
}

function queueItemToBatchOp(item: {
  id?: number;
  method: string;
  path: string;
  body?: string;
  record_id?: string;
  module_name?: string;
  operation_type?: SyncOperationType;
  local_updated_at?: string;
  created_at: string;
}): BatchSyncOperation | null {
  const module = (item.module_name || getEntityFromPath(item.path)) as string;
  if (!module || !item.id) return null;

  const basePath = item.path.split('?')[0];
  const idMatch = basePath.match(/\/([^/]+)$/);
  const pathId = idMatch?.[1];

  let payload: Record<string, unknown> = {};
  if (item.body) {
    try {
      payload = JSON.parse(item.body);
    } catch {
      return null;
    }
  }

  const localId = item.record_id || pathId || (payload.id as string) || '';
  if (!localId && item.method !== 'POST') return null;

  return {
    queueId: item.id,
    module,
    operation: item.operation_type || methodToOperation(item.method),
    localId: localId || `${Date.now()}-pending`,
    localUpdatedAt: item.local_updated_at || item.created_at,
    payload,
  };
}

async function applyIdRemapping(
  module: string,
  localId: string,
  serverId: string,
  serverRecord?: Record<string, unknown>
): Promise<void> {
  const storage = await initStorage();
  const entity = module as EntityName;

  await storage.setIdMapping?.(localId, module, serverId);

  if (serverRecord) {
    const cleaned = { ...serverRecord };
    delete cleaned[SYNC_PENDING_MARKER];
    delete cleaned[LOCAL_UPDATED_AT];
    await storage.upsert(entity, cleaned as { id: string });

    if (localId !== serverId) {
      await storage.remove(entity, localId);
    }
  }
}

async function processBatchResults(
  response: BatchSyncResponse,
  operations: BatchSyncOperation[]
): Promise<{ synced: number; failed: number; conflicts: number }> {
  const storage = await initStorage();
  const opMap = new Map(operations.map((op) => [op.queueId, op]));
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  const syncedIds: number[] = [];

  for (const result of response.results) {
    const op = opMap.get(result.queueId);
    const module = op?.module || 'unknown';
    const operation = op?.operation || 'create';

    if (result.success) {
      synced += 1;
      syncedIds.push(result.queueId);
      if (result.conflict) conflicts += 1;

      if (module && result.serverId) {
        await applyIdRemapping(module, result.localId, result.serverId, result.serverRecord);
      }

      await storage.addSyncLog?.({
        queue_id: result.queueId,
        module_name: module,
        record_id: result.serverId || result.localId,
        operation_type: operation,
        status: result.conflict ? 'conflict' : 'success',
        message: result.conflict
          ? `Conflict resolved (${result.conflictResolution})`
          : 'Synced successfully',
        created_at: new Date().toISOString(),
      });
    } else {
      failed += 1;
      if (result.queueId) {
        await storage.markSyncQueueFailed?.(result.queueId, result.error || 'Sync failed');
      }
      await storage.addSyncLog?.({
        queue_id: result.queueId,
        module_name: module,
        record_id: result.localId,
        operation_type: operation,
        status: 'failed',
        message: result.error || 'Sync failed',
        created_at: new Date().toISOString(),
      });
    }
  }

  if (syncedIds.length > 0) {
    await storage.markSyncQueueSynced(syncedIds);
  }

  return { synced, failed, conflicts };
}

export async function syncPendingChanges(): Promise<{ synced: number; failed: number; conflicts: number }> {
  if (!isDesktop()) return { synced: 0, failed: 0, conflicts: 0 };

  const online = await probeServerConnectivity();
  if (!online) return { synced: 0, failed: 0, conflicts: 0 };

  const storage = await initStorage();
  const queue = await storage.getSyncQueue();

  if (queue.length === 0) return { synced: 0, failed: 0, conflicts: 0 };

  let totalSynced = 0;
  let totalFailed = 0;
  let totalConflicts = 0;

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    const operations: BatchSyncOperation[] = [];

    for (const item of batch) {
      const validationError = validateQueueItem(item);
      if (validationError) {
        if (item.id) {
          await storage.markSyncQueueFailed?.(item.id, validationError);
        }
        totalFailed += 1;
        continue;
      }

      const op = queueItemToBatchOp(item);
      if (op) {
        operations.push(op);
      } else if (item.id) {
        await storage.markSyncQueueFailed?.(item.id, 'Could not parse queue item');
        totalFailed += 1;
      }
    }

    if (operations.length === 0) continue;

    try {
      const response = await fetchFromNetwork<BatchSyncResponse>('/sync/batch', {
        method: 'POST',
        body: JSON.stringify({ operations }),
      });

      const result = await processBatchResults(response, operations);
      totalSynced += result.synced;
      totalFailed += result.failed;
      totalConflicts += result.conflicts;
    } catch (err) {
      for (const op of operations) {
        await storage.markSyncQueueFailed?.(op.queueId, err instanceof Error ? err.message : 'Batch sync failed');
        totalFailed += 1;
      }
    }
  }

  await storage.updateSyncMetadata?.({
    last_sync_at: new Date().toISOString(),
    last_sync_status: totalFailed > 0 ? (totalSynced > 0 ? 'partial' : 'failed') : 'success',
    total_synced: totalSynced,
    total_failed: totalFailed,
    total_conflicts: totalConflicts,
  });

  return { synced: totalSynced, failed: totalFailed, conflicts: totalConflicts };
}

async function cacheListResponse(path: string, data: unknown): Promise<void> {
  const storage = await initStorage();
  await storage.setCache(path, data);

  const entity = getEntityFromPath(path);
  if (entity && Array.isArray(data)) {
    const cleaned = (data as Array<Record<string, unknown>>).map((item) => {
      const copy = { ...item };
      delete copy[SYNC_PENDING_MARKER];
      delete copy[LOCAL_UPDATED_AT];
      return copy;
    });
    await storage.replaceAll(entity, cleaned as Array<{ id: string }>);
  }
}

export async function pullServerData(): Promise<{ pulled: number; pullErrors: string[] }> {
  const online = await probeServerConnectivity();
  if (!online) {
    throw new Error('Internet connection required to refresh data');
  }

  let pulled = 0;
  const pullErrors: string[] = [];

  for (const path of PULL_ROUTES) {
    try {
      const data = await fetchFromNetwork(path);
      if (isDesktop()) {
        await cacheListResponse(path, data);
      }
      pulled += 1;
    } catch {
      pullErrors.push(path);
    }
  }

  return { pulled, pullErrors };
}

export async function performFullSync(): Promise<RefreshResult> {
  const online = await probeServerConnectivity();
  if (!online) {
    throw new Error('Internet connection required to sync databases');
  }

  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  let pulled = 0;
  let pullErrors: string[] = [];

  if (isDesktop()) {
    const push = await syncPendingChanges();
    synced = push.synced;
    failed = push.failed;
    conflicts = push.conflicts;

    const pull = await pullServerData();
    pulled = pull.pulled;
    pullErrors = pull.pullErrors;
  }

  window.dispatchEvent(new CustomEvent('bantay:data-refreshed'));

  return { synced, failed, conflicts, pulled, pullErrors };
}

export function markRecordPending(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record,
    [SYNC_PENDING_MARKER]: 'pending',
    [LOCAL_UPDATED_AT]: new Date().toISOString(),
  };
}

export { getEntityFromPath, methodToOperation, PULL_ROUTES, ENTITY_ROUTES };
