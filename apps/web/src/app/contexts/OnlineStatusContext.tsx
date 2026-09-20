import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useRef,

  useState,

  type ReactNode,

} from 'react';

import { toast } from 'sonner';

import { isDesktop } from '../lib/platform';

import { startConnectivityMonitor, probeServerConnectivity } from '../lib/connectivity';

import { initStorage } from '../lib/storage';

import { performFullSync } from '../lib/sync-engine';

import type { ConnectionStatus, SyncMetadata } from '../lib/sync-types';

import { connectRealtimeSync, disconnectRealtimeSync } from '../lib/realtime-sync';



interface OnlineStatusContextValue {

  online: boolean;

  connectionStatus: ConnectionStatus;

  pendingSync: number;

  failedSync: number;

  syncing: boolean;

  syncMetadata: SyncMetadata | null;

  syncNow: () => Promise<void>;

  refreshPendingCount: () => Promise<void>;

}



const defaultMetadata: SyncMetadata = {

  last_sync_at: null,

  last_sync_status: 'idle',

  total_synced: 0,

  total_failed: 0,

  total_conflicts: 0,

};



const OnlineStatusContext = createContext<OnlineStatusContextValue | null>(null);



export function OnlineStatusProvider({ children }: { children: ReactNode }) {

  const [online, setOnline] = useState(false);

  const [pendingSync, setPendingSync] = useState(0);

  const [failedSync, setFailedSync] = useState(0);

  const [syncing, setSyncing] = useState(false);

  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(null);

  const wasOnlineRef = useRef<boolean | null>(null);

  const syncInProgressRef = useRef(false);



  const refreshPendingCount = useCallback(async () => {

    if (!isDesktop()) return;

    const storage = await initStorage();

    const queue = await storage.getSyncQueue();

    setPendingSync(queue.length);



    const stats = await storage.getSyncQueueStats?.();

    if (stats) setFailedSync(stats.failed);



    const meta = await storage.getSyncMetadata?.();

    if (meta) setSyncMetadata(meta);

  }, []);



  const syncNow = useCallback(async () => {

    if (!isDesktop() || syncInProgressRef.current) return;



    const reachable = await probeServerConnectivity();

    if (!reachable) return;



    syncInProgressRef.current = true;

    setSyncing(true);

    toast.info('Synchronization Started', { description: 'Uploading pending changes to server...' });



    try {

      const storage = await initStorage();

      await storage.resetFailedSyncQueue?.();

      await performFullSync();

      await refreshPendingCount();

      const meta = await storage.getSyncMetadata?.();

      const failed = meta?.total_failed ?? 0;



      if (failed > 0) {

        toast.warning('Synchronization Completed', {

          description: `Some changes could not be synced (${failed} failed). Check Sync Monitoring.`,

        });

      } else {

        toast.success('Synchronization Completed', {

          description: 'All pending changes have been synced to the server.',

        });

      }



      window.dispatchEvent(new CustomEvent('bantay:sync-completed'));

    } catch (err) {

      toast.error('Synchronization Failed', {

        description: err instanceof Error ? err.message : 'Could not sync with server',

      });

    } finally {

      syncInProgressRef.current = false;

      setSyncing(false);

    }

  }, [refreshPendingCount]);



  const connectionStatus: ConnectionStatus = syncing ? 'syncing' : online ? 'online' : 'offline';



  useEffect(() => {

    if (!isDesktop()) return;



    void initStorage().then(() => refreshPendingCount());

    connectRealtimeSync();



    const stopMonitor = startConnectivityMonitor((nowOnline) => {

      setOnline(nowOnline);



      if (wasOnlineRef.current === false && nowOnline) {

        toast.success('Connection Restored', { description: 'Starting automatic synchronization...' });

        void syncNow();

      } else if (wasOnlineRef.current === true && !nowOnline) {

        toast.error('Offline Mode Activated', {

          description: 'Changes will be saved locally and synced when connection returns.',

        });

      }



      wasOnlineRef.current = nowOnline;

    });



    const handleQueueChanged = () => void refreshPendingCount();

    const handleSyncEvent = () => void refreshPendingCount();



    window.addEventListener('bantay:queue-changed', handleQueueChanged);

    window.addEventListener('bantay:sync-completed', handleSyncEvent);

    window.addEventListener('bantay:data-refreshed', handleSyncEvent);



    return () => {

      stopMonitor();

      disconnectRealtimeSync();

      window.removeEventListener('bantay:queue-changed', handleQueueChanged);

      window.removeEventListener('bantay:sync-completed', handleSyncEvent);

      window.removeEventListener('bantay:data-refreshed', handleSyncEvent);

    };

  }, [refreshPendingCount, syncNow]);



  return (

    <OnlineStatusContext.Provider

      value={{

        online,

        connectionStatus,

        pendingSync,

        failedSync,

        syncing,

        syncMetadata,

        syncNow,

        refreshPendingCount,

      }}

    >

      {children}

    </OnlineStatusContext.Provider>

  );

}



export function useOnlineStatus() {

  const context = useContext(OnlineStatusContext);

  if (!context) {

    return {

      online: true,

      connectionStatus: 'online' as ConnectionStatus,

      pendingSync: 0,

      failedSync: 0,

      syncing: false,

      syncMetadata: defaultMetadata,

      syncNow: async () => undefined,

      refreshPendingCount: async () => undefined,

    };

  }

  return context;

}


