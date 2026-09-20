import { getApiBase, getAuthTokenKey } from './platform';

type RealtimeHandler = (payload: { type: string; module?: string; synced?: number; timestamp: string }) => void;

let eventSource: EventSource | null = null;
let handlers: Set<RealtimeHandler> = new Set();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function getToken(): string | null {
  return localStorage.getItem(getAuthTokenKey());
}

export function subscribeToSyncEvents(handler: RealtimeHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

function notifyHandlers(payload: { type: string; module?: string; synced?: number; timestamp: string }) {
  for (const handler of handlers) {
    handler(payload);
  }
  window.dispatchEvent(new CustomEvent('bantay:sync-event', { detail: payload }));
}

export function connectRealtimeSync(): void {
  if (eventSource) return;

  const token = getToken();
  if (!token) return;

  const url = `${getApiBase()}/sync/events?token=${encodeURIComponent(token)}`;

  try {
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'heartbeat') return;
        notifyHandlers(payload);
        if (payload.type === 'data-changed' || payload.type === 'sync-completed') {
          window.dispatchEvent(new CustomEvent('bantay:data-refreshed', { detail: payload }));
        }
      } catch {
        // ignore malformed events
      }
    };

    eventSource.onerror = () => {
      disconnectRealtimeSync();
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectRealtimeSync();
      }, 10000);
    };
  } catch {
    // EventSource not available or connection failed
  }
}

export function disconnectRealtimeSync(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

export function isRealtimeConnected(): boolean {
  return eventSource?.readyState === EventSource.OPEN;
}
