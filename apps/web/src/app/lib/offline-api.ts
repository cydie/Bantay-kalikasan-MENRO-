import { getAuthTokenKey, getApiBase, isDesktop } from './platform';

import { probeServerConnectivity, isOnline as checkOnline } from './connectivity';

import { initStorage } from './storage';

import type { EntityName } from './storage';

import {

  performFullSync,

  syncPendingChanges,

  pullServerData,

  markRecordPending,

  getEntityFromPath,

  methodToOperation,

} from './sync-engine';

import type { RefreshResult } from './sync-types';

import { LOCAL_UPDATED_AT, SYNC_PENDING_MARKER } from './sync-types';



export type { RefreshResult };



const DEPARTMENT_ASSIGNED_LABELS: Record<string, string> = {

  nursery: 'Nursery',

  environmental: 'Environmental',

  'solid-waste': 'Solid Waste',

  landfill: 'Landfill',

  enforcement: 'Enforcement',

  admin: 'Admin',

};



function getToken(): string | null {

  return localStorage.getItem(getAuthTokenKey());

}



async function fetchFromNetwork<T>(

  path: string,

  options: RequestInit = {}

): Promise<T> {

  const token = getToken();

  const headers: Record<string, string> = {

    'Content-Type': 'application/json',

    ...(options.headers as Record<string, string>),

  };

  if (token) {

    headers.Authorization = `Bearer ${token}`;

  }



  const response = await fetch(`${getApiBase()}${path}`, {

    ...options,

    headers,

  });



  const data = await response.json().catch(() => ({}));



  if (!response.ok) {

    throw new ApiError(data.error || 'Request failed', response.status);

  }



  return data as T;

}



async function cacheListResponse(path: string, data: unknown): Promise<void> {

  const storage = await initStorage();

  await storage.setCache(path, data);



  const entity = getEntityFromPath(path);

  if (entity && Array.isArray(data)) {

    await storage.replaceAll(entity, data as Array<{ id: string }>);

  }

}



async function getCachedList<T>(path: string): Promise<T | null> {

  const storage = await initStorage();

  const cached = await storage.getCache<T>(path);

  if (cached) return cached;



  const entity = getEntityFromPath(path);

  if (!entity) return null;



  const items = await storage.getAll(entity);

  return items as T;

}



async function resolveInquiryPayload(payload: Record<string, unknown>) {

  const storage = await initStorage();

  let departmentId = payload.department_id as string | undefined;

  let category = payload.category as string | undefined;

  let subject = payload.subject as string | undefined;



  if (payload.service_id) {

    const cachedServices =

      (await storage.getCache<Array<Record<string, string>>>('/services')) ||

      (await storage.getAll<Record<string, string>>('services'));

    const service = cachedServices.find((row) => row.id === payload.service_id);

    if (service) {

      departmentId = service.department_id || departmentId;

      category = service.department_name || service.section_name || category;

      subject = subject || service.service_name || service.title;

    }

  }



  if (departmentId && !category) {

    const cachedDepartments =

      (await storage.getCache<Array<{ id: string; name: string }>>('/departments')) || [];

    category = cachedDepartments.find((d) => d.id === departmentId)?.name || departmentId;

  }



  const assignedTo = departmentId

    ? DEPARTMENT_ASSIGNED_LABELS[departmentId] || String(departmentId)

    : 'Admin';



  const now = new Date().toISOString();



  return markRecordPending({

    ...payload,

    id: (payload.id as string) || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

    department_id: departmentId || null,

    category: category || assignedTo,

    subject: subject || 'Inquiry',

    assigned_to: assignedTo,

    status: 'Pending',

    ticket_number: `LOCAL-${Date.now()}`,

    date_submitted: new Date().toLocaleString('en-US', {

      year: 'numeric',

      month: '2-digit',

      day: '2-digit',

      hour: '2-digit',

      minute: '2-digit',

      hour12: true,

    }),

    [LOCAL_UPDATED_AT]: now,

  });

}



async function applyLocalMutation(

  path: string,

  method: string,

  body?: BodyInit | null

): Promise<unknown> {

  const entity = getEntityFromPath(path);

  if (!entity) return { success: true };



  const storage = await initStorage();

  const payload = body ? JSON.parse(String(body)) : null;

  const basePath = path.split('?')[0];

  const idMatch = basePath.match(/\/([^/]+)$/);

  const id = idMatch?.[1];

  const now = new Date().toISOString();



  if (method === 'POST' && payload) {

    const newItem =

      basePath === '/inquiries'

        ? await resolveInquiryPayload(payload)

        : markRecordPending({

            ...payload,

            id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,

            [LOCAL_UPDATED_AT]: now,

          });

    await storage.upsert(entity, newItem as { id: string });

    return newItem;

  }



  if ((method === 'PUT' || method === 'PATCH') && id && payload) {

    const items = await storage.getAll<{ id: string }>(entity);

    const existing = items.find((item) => item.id === id);

    const updated = markRecordPending({ ...existing, ...payload, id, [LOCAL_UPDATED_AT]: now });

    await storage.upsert(entity, updated);

    return updated;

  }



  if (method === 'DELETE' && id) {

    await storage.remove(entity, id);

    return { success: true };

  }



  return { success: true };

}



function notifyQueueChanged() {

  window.dispatchEvent(new CustomEvent('bantay:queue-changed'));

}



async function queueOfflineMutation(

  path: string,

  method: string,

  body?: BodyInit | null

): Promise<unknown> {

  const storage = await initStorage();

  const entity = getEntityFromPath(path);

  const basePath = path.split('?')[0];

  const idMatch = basePath.match(/\/([^/]+)$/);

  const pathId = idMatch?.[1];

  const payload = body ? JSON.parse(String(body)) : null;

  const recordId = pathId || payload?.id || `${Date.now()}-pending`;

  const now = new Date().toISOString();



  await storage.addToSyncQueue({

    method,

    path,

    body: body ? String(body) : undefined,

    created_at: now,

    record_id: recordId,

    module_name: entity || undefined,

    operation_type: methodToOperation(method),

    local_updated_at: now,

  });



  notifyQueueChanged();



  return applyLocalMutation(path, method, body);

}



export async function refreshDatabases(): Promise<RefreshResult> {

  return performFullSync();

}



export { syncPendingChanges, pullServerData };



async function desktopRequest<T>(path: string, options: RequestInit = {}): Promise<T> {

  const method = (options.method || 'GET').toUpperCase();

  const isRead = method === 'GET';



  const online = isRead ? checkOnline() : await probeServerConnectivity();



  if (!online) {

    if (isRead) {

      const cached = await getCachedList<T>(path);

      if (cached !== null) return cached;

      throw new ApiError('You are offline. Data will sync when internet is available.', 0);

    }



    return (await queueOfflineMutation(path, method, options.body)) as T;

  }



  try {

    const data = await fetchFromNetwork<T>(path, options);

    if (isRead) {

      await cacheListResponse(path, data);

    } else if (isDesktop()) {

      const entity = getEntityFromPath(path);

      if (entity && data && typeof data === 'object' && 'id' in (data as object)) {

        await initStorage().then((s) => s.upsert(entity, data as { id: string }));

      }

    }

    return data;

  } catch (error) {

    if (isRead) {

      const cached = await getCachedList<T>(path);

      if (cached !== null) return cached;

    }



    if (!isRead && isDesktop()) {

      return (await queueOfflineMutation(path, method, options.body)) as T;

    }



    throw error;

  }

}



export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {

  if (!isDesktop()) {

    const online = await probeServerConnectivity();

    if (!online) {

      throw new ApiError('The web app requires an internet connection.', 0);

    }

    return fetchFromNetwork<T>(path, options);

  }



  return desktopRequest<T>(path, options);

}



export class ApiError extends Error {

  constructor(

    message: string,

    public status: number

  ) {

    super(message);

    this.name = 'ApiError';

  }

}



export function setToken(token: string | null) {

  const key = getAuthTokenKey();

  if (token) {

    localStorage.setItem(key, token);

  } else {

    localStorage.removeItem(key);

  }

}



export function isOnline(): boolean {

  return checkOnline();

}



export { getToken };

export { getApiBase } from './platform';

export { SYNC_PENDING_MARKER, LOCAL_UPDATED_AT } from './sync-types';

