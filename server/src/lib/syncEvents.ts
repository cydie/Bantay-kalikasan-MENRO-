import { EventEmitter } from 'events';

export type SyncEventType = 'data-changed' | 'sync-completed';

export interface SyncEventPayload {
  type: SyncEventType;
  module?: string;
  synced?: number;
  timestamp: string;
}

class SyncEventBus extends EventEmitter {
  emitDataChanged(module?: string) {
    const payload: SyncEventPayload = {
      type: 'data-changed',
      module,
      timestamp: new Date().toISOString(),
    };
    this.emit('sync-event', payload);
  }

  emitSyncCompleted(synced: number) {
    const payload: SyncEventPayload = {
      type: 'sync-completed',
      synced,
      timestamp: new Date().toISOString(),
    };
    this.emit('sync-event', payload);
  }
}

export const syncEvents = new SyncEventBus();
