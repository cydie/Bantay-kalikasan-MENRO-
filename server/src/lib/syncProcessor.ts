import { generateId, nextTicketNumber, query, queryOne } from '../db.js';
import { getDepartmentAssignedLabel, getDepartmentName } from './departments.js';
import { logHistory } from './history.js';
import type { AuthPayload } from '../middleware/auth.js';

export type SyncOperationType = 'create' | 'update' | 'delete';

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

function parseTimestamp(value: unknown): number {
  if (!value) return 0;
  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function getExistingMapping(localId: string, module: string) {
  return queryOne<{ server_id: string }>(
    'SELECT server_id FROM sync_client_mappings WHERE local_id = $1 AND module_name = $2',
    [localId, module]
  );
}

async function saveMapping(localId: string, module: string, serverId: string) {
  await query(
    `INSERT INTO sync_client_mappings (local_id, module_name, server_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (local_id, module_name) DO UPDATE SET server_id = EXCLUDED.server_id, synced_at = NOW()`,
    [localId, module, serverId]
  );
}

async function logSyncEvent(
  user: AuthPayload,
  entry: {
    module_name: string;
    record_id: string;
    operation_type: string;
    status: string;
    message: string;
    conflict?: boolean;
  }
) {
  await query(
    `INSERT INTO sync_logs (id, module_name, record_id, operation_type, status, message, performed_by, conflict)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      generateId(),
      entry.module_name,
      entry.record_id,
      entry.operation_type,
      entry.status,
      entry.message,
      user.email,
      entry.conflict ?? false,
    ]
  );
}

async function resolveServerId(localId: string, module: string, payload: Record<string, unknown>) {
  const mapping = await getExistingMapping(localId, module);
  if (mapping) return mapping.server_id;

  const payloadId = payload.id as string | undefined;
  if (payloadId) {
    const exists = await recordExists(module, payloadId);
    if (exists) return payloadId;
  }

  return localId.startsWith('LOCAL-') || localId.includes('-') ? null : localId;
}

async function recordExists(module: string, id: string): Promise<boolean> {
  const tableMap: Record<string, string> = {
    inquiries: 'inquiries',
    activities: 'activities',
    employees: 'employees',
    records: 'records',
    services: 'department_services',
  };
  const table = tableMap[module];
  if (!table) return false;
  const row = await queryOne(`SELECT id FROM ${table} WHERE id = $1`, [id]);
  return Boolean(row);
}

async function getServerUpdatedAt(module: string, serverId: string): Promise<number> {
  const tableMap: Record<string, string> = {
    inquiries: 'inquiries',
    activities: 'activities',
    employees: 'employees',
    records: 'records',
    services: 'department_services',
  };
  const table = tableMap[module];
  if (!table) return 0;

  const row = await queryOne<Record<string, unknown>>(
    `SELECT updated_at, created_at FROM ${table} WHERE id = $1`,
    [serverId]
  );
  if (!row) return 0;
  return parseTimestamp(row.updated_at ?? row.created_at);
}

async function processInquiry(
  op: BatchSyncOperation,
  user: AuthPayload
): Promise<BatchSyncResultItem> {
  const base: BatchSyncResultItem = { queueId: op.queueId, success: false, localId: op.localId };

  if (op.operation === 'create') {
    const existing = await getExistingMapping(op.localId, op.module);
    if (existing) {
      const record = await queryOne('SELECT * FROM inquiries WHERE id = $1', [existing.server_id]);
      return { ...base, success: true, serverId: existing.server_id, serverRecord: record ?? undefined };
    }

    const {
      name, email, phone, category, subject, message,
      priority, department_id, service_id,
    } = op.payload;

    if (!name || !email || !subject || !message) {
      return { ...base, error: 'Incomplete inquiry data' };
    }

    const id = generateId();
    const ticketNumber = await nextTicketNumber();
    const assignedTo = department_id
      ? getDepartmentAssignedLabel(String(department_id))
      : 'Admin';

    await query(
      `INSERT INTO inquiries (id, ticket_number, name, email, phone, category, subject, message,
        priority, status, assigned_to, department_id, service_id, date_submitted, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending',$10,$11,$12,$13,NOW())`,
      [
        id, ticketNumber, name, email, phone || '', category || assignedTo, subject, message,
        priority || 'Normal', assignedTo, department_id || null, service_id || null,
        new Date().toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: true,
        }),
      ]
    );

    await saveMapping(op.localId, op.module, id);
    const record = await queryOne('SELECT * FROM inquiries WHERE id = $1', [id]);
    await logSyncEvent(user, {
      module_name: op.module,
      record_id: id,
      operation_type: op.operation,
      status: 'success',
      message: `Created inquiry ${ticketNumber} from offline sync`,
    });
    return { ...base, success: true, serverId: id, serverRecord: record ?? undefined };
  }

  const serverId = (await resolveServerId(op.localId, op.module, op.payload)) ?? op.localId;
  if (!(await recordExists(op.module, serverId))) {
    return { ...base, error: 'Inquiry not found on server' };
  }

  if (op.operation === 'update') {
    const serverTime = await getServerUpdatedAt(op.module, serverId);
    const localTime = parseTimestamp(op.localUpdatedAt);
    let conflict = false;
    let conflictResolution: 'local' | 'server' | undefined;

    if (serverTime > localTime) {
      conflict = true;
      conflictResolution = 'server';
      const record = await queryOne('SELECT * FROM inquiries WHERE id = $1', [serverId]);
      await logSyncEvent(user, {
        module_name: op.module,
        record_id: serverId,
        operation_type: op.operation,
        status: 'conflict',
        message: 'Server version is newer; kept server copy',
        conflict: true,
      });
      return { ...base, success: true, serverId, serverRecord: record ?? undefined, conflict, conflictResolution };
    }

    const { status, response } = op.payload;
    if (status) {
      await query('UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2', [status, serverId]);
    }
    if (response) {
      await query('UPDATE inquiries SET response = $1, updated_at = NOW() WHERE id = $2', [response, serverId]);
    }

    const record = await queryOne('SELECT * FROM inquiries WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module,
      record_id: serverId,
      operation_type: op.operation,
      status: conflict ? 'conflict' : 'success',
      message: conflict ? 'Applied local changes (newer than server)' : 'Inquiry updated via sync',
      conflict,
    });
    return { ...base, success: true, serverId, serverRecord: record ?? undefined, conflict, conflictResolution: conflict ? 'local' : undefined };
  }

  if (op.operation === 'delete') {
    await query('DELETE FROM inquiries WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module,
      record_id: serverId,
      operation_type: op.operation,
      status: 'success',
      message: 'Inquiry deleted via sync',
    });
    return { ...base, success: true, serverId };
  }

  return { ...base, error: 'Unsupported operation' };
}

async function processActivity(
  op: BatchSyncOperation,
  user: AuthPayload
): Promise<BatchSyncResultItem> {
  const base: BatchSyncResultItem = { queueId: op.queueId, success: false, localId: op.localId };

  if (op.operation === 'create') {
    const existing = await getExistingMapping(op.localId, op.module);
    if (existing) {
      const record = await queryOne('SELECT * FROM activities WHERE id = $1', [existing.server_id]);
      return { ...base, success: true, serverId: existing.server_id, serverRecord: record ?? undefined };
    }

    const { title, description, date, location, status, participants, department } = op.payload;
    if (!title || !description || !date || !location) {
      return { ...base, error: 'Incomplete activity data' };
    }

    const id = generateId();
    const dept = String(department || user.department || 'admin');

    await query(
      `INSERT INTO activities (id, title, description, date, location, status, participants, department, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [id, title, description, date, location, status || 'Scheduled', participants || 0, dept]
    );

    await saveMapping(op.localId, op.module, id);
    const record = await queryOne('SELECT * FROM activities WHERE id = $1', [id]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: id, operation_type: op.operation,
      status: 'success', message: `Created activity "${title}" from offline sync`,
    });
    return { ...base, success: true, serverId: id, serverRecord: record ?? undefined };
  }

  const serverId = (await resolveServerId(op.localId, op.module, op.payload)) ?? op.localId;
  if (!(await recordExists(op.module, serverId))) {
    return { ...base, error: 'Activity not found on server' };
  }

  if (op.operation === 'update') {
    const serverTime = await getServerUpdatedAt(op.module, serverId);
    const localTime = parseTimestamp(op.localUpdatedAt);
    if (serverTime > localTime) {
      const record = await queryOne('SELECT * FROM activities WHERE id = $1', [serverId]);
      await logSyncEvent(user, {
        module_name: op.module, record_id: serverId, operation_type: op.operation,
        status: 'conflict', message: 'Server version is newer; kept server copy', conflict: true,
      });
      return { ...base, success: true, serverId, serverRecord: record ?? undefined, conflict: true, conflictResolution: 'server' };
    }

    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM activities WHERE id = $1', [serverId]);
    const { title, description, date, location, status, participants, department } = op.payload;

    await query(
      `UPDATE activities SET title=$1, description=$2, date=$3, location=$4, status=$5, participants=$6, department=$7, updated_at=NOW() WHERE id=$8`,
      [
        title ?? existing?.title, description ?? existing?.description, date ?? existing?.date,
        location ?? existing?.location, status ?? existing?.status, participants ?? existing?.participants,
        department ?? existing?.department, serverId,
      ]
    );

    const record = await queryOne('SELECT * FROM activities WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Activity updated via sync',
    });
    return { ...base, success: true, serverId, serverRecord: record ?? undefined };
  }

  if (op.operation === 'delete') {
    await query('DELETE FROM activities WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Activity deleted via sync',
    });
    return { ...base, success: true, serverId };
  }

  return { ...base, error: 'Unsupported operation' };
}

async function processEmployee(
  op: BatchSyncOperation,
  user: AuthPayload
): Promise<BatchSyncResultItem> {
  const base: BatchSyncResultItem = { queueId: op.queueId, success: false, localId: op.localId };

  if (op.operation === 'create') {
    const existing = await getExistingMapping(op.localId, op.module);
    if (existing) {
      const record = await queryOne('SELECT * FROM employees WHERE id = $1', [existing.server_id]);
      return { ...base, success: true, serverId: existing.server_id, serverRecord: record ?? undefined };
    }

    const { name, email, position, phone, department, status, dateHired } = op.payload;
    if (!name || !email || !position || !department || !dateHired) {
      return { ...base, error: 'Incomplete employee data' };
    }

    const id = generateId();
    await query(
      `INSERT INTO employees (id, name, email, position, phone, department, status, date_hired, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [id, name, email, position, phone || '', department, status || 'Active', dateHired]
    );

    await saveMapping(op.localId, op.module, id);
    const record = await queryOne('SELECT * FROM employees WHERE id = $1', [id]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: id, operation_type: op.operation,
      status: 'success', message: `Created employee "${name}" from offline sync`,
    });
    return { ...base, success: true, serverId: id, serverRecord: record ?? undefined };
  }

  const serverId = (await resolveServerId(op.localId, op.module, op.payload)) ?? op.localId;
  if (!(await recordExists(op.module, serverId))) {
    return { ...base, error: 'Employee not found on server' };
  }

  if (op.operation === 'update') {
    const serverTime = await getServerUpdatedAt(op.module, serverId);
    const localTime = parseTimestamp(op.localUpdatedAt);
    if (serverTime > localTime) {
      const record = await queryOne('SELECT * FROM employees WHERE id = $1', [serverId]);
      await logSyncEvent(user, {
        module_name: op.module, record_id: serverId, operation_type: op.operation,
        status: 'conflict', message: 'Server version is newer; kept server copy', conflict: true,
      });
      return { ...base, success: true, serverId, serverRecord: record ?? undefined, conflict: true, conflictResolution: 'server' };
    }

    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM employees WHERE id = $1', [serverId]);
    const { name, email, position, phone, department, status, dateHired } = op.payload;

    await query(
      `UPDATE employees SET name=$1, email=$2, position=$3, phone=$4, department=$5, status=$6, date_hired=$7, updated_at=NOW() WHERE id=$8`,
      [
        name ?? existing?.name, email ?? existing?.email, position ?? existing?.position,
        phone ?? existing?.phone, department ?? existing?.department, status ?? existing?.status,
        dateHired ?? existing?.date_hired, serverId,
      ]
    );

    const record = await queryOne('SELECT * FROM employees WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Employee updated via sync',
    });
    return { ...base, success: true, serverId, serverRecord: record ?? undefined };
  }

  if (op.operation === 'delete') {
    await query('DELETE FROM employees WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Employee deleted via sync',
    });
    return { ...base, success: true, serverId };
  }

  return { ...base, error: 'Unsupported operation' };
}

async function processRecord(
  op: BatchSyncOperation,
  user: AuthPayload
): Promise<BatchSyncResultItem> {
  const base: BatchSyncResultItem = { queueId: op.queueId, success: false, localId: op.localId };

  if (op.operation === 'create') {
    const existing = await getExistingMapping(op.localId, op.module);
    if (existing) {
      const record = await queryOne('SELECT * FROM records WHERE id = $1', [existing.server_id]);
      return { ...base, success: true, serverId: existing.server_id, serverRecord: record ?? undefined };
    }

    const recordType = op.payload.recordType ?? op.payload.record_type;
    const { title, description, date, category, status, createdBy } = op.payload;
    if (!recordType || !title || !description || !date || !category) {
      return { ...base, error: 'Incomplete record data' };
    }

    const id = generateId();
    await query(
      `INSERT INTO records (id, record_type, title, description, date, category, status, created_by, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [id, recordType, title, description, date, category, status || 'Active', createdBy || user.email]
    );

    await saveMapping(op.localId, op.module, id);
    const record = await queryOne('SELECT * FROM records WHERE id = $1', [id]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: id, operation_type: op.operation,
      status: 'success', message: `Created record "${title}" from offline sync`,
    });
    return { ...base, success: true, serverId: id, serverRecord: record ?? undefined };
  }

  const serverId = (await resolveServerId(op.localId, op.module, op.payload)) ?? op.localId;
  if (!(await recordExists(op.module, serverId))) {
    return { ...base, error: 'Record not found on server' };
  }

  if (op.operation === 'update') {
    const serverTime = await getServerUpdatedAt(op.module, serverId);
    const localTime = parseTimestamp(op.localUpdatedAt);
    if (serverTime > localTime) {
      const record = await queryOne('SELECT * FROM records WHERE id = $1', [serverId]);
      await logSyncEvent(user, {
        module_name: op.module, record_id: serverId, operation_type: op.operation,
        status: 'conflict', message: 'Server version is newer; kept server copy', conflict: true,
      });
      return { ...base, success: true, serverId, serverRecord: record ?? undefined, conflict: true, conflictResolution: 'server' };
    }

    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM records WHERE id = $1', [serverId]);
    const recordType = op.payload.recordType ?? op.payload.record_type;
    const { title, description, date, category, status, createdBy } = op.payload;

    await query(
      `UPDATE records SET record_type=$1, title=$2, description=$3, date=$4, category=$5, status=$6, created_by=$7, updated_at=NOW() WHERE id=$8`,
      [
        recordType ?? existing?.record_type, title ?? existing?.title, description ?? existing?.description,
        date ?? existing?.date, category ?? existing?.category, status ?? existing?.status,
        createdBy ?? existing?.created_by, serverId,
      ]
    );

    const record = await queryOne('SELECT * FROM records WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Record updated via sync',
    });
    return { ...base, success: true, serverId, serverRecord: record ?? undefined };
  }

  if (op.operation === 'delete') {
    await query('DELETE FROM records WHERE id = $1', [serverId]);
    await logSyncEvent(user, {
      module_name: op.module, record_id: serverId, operation_type: op.operation,
      status: 'success', message: 'Record deleted via sync',
    });
    return { ...base, success: true, serverId };
  }

  return { ...base, error: 'Unsupported operation' };
}

export async function processBatchSync(
  operations: BatchSyncOperation[],
  user: AuthPayload
): Promise<{ results: BatchSyncResultItem[]; synced: number; failed: number; conflicts: number }> {
  const results: BatchSyncResultItem[] = [];
  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const op of operations) {
    try {
      let result: BatchSyncResultItem;

      switch (op.module) {
        case 'inquiries':
          result = await processInquiry(op, user);
          break;
        case 'activities':
          result = await processActivity(op, user);
          break;
        case 'employees':
          result = await processEmployee(op, user);
          break;
        case 'records':
          result = await processRecord(op, user);
          break;
        default:
          result = {
            queueId: op.queueId,
            success: false,
            localId: op.localId,
            error: `Module "${op.module}" is not supported for batch sync`,
          };
      }

      results.push(result);
      if (result.success) {
        synced += 1;
        if (result.conflict) conflicts += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
      results.push({
        queueId: op.queueId,
        success: false,
        localId: op.localId,
        error: err instanceof Error ? err.message : 'Sync processing error',
      });
    }
  }

  return { results, synced, failed, conflicts };
}

export { getDepartmentName };
