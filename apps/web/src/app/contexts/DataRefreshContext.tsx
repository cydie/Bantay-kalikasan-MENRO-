import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from 'react';

import { toast } from 'sonner';

import { isDesktop } from '../lib/platform';

import { refreshDatabases, type RefreshResult } from '../lib/offline-api';

import { initStorage } from '../lib/storage';

import { connectRealtimeSync, disconnectRealtimeSync } from '../lib/realtime-sync';

import { api } from '../lib/api';



interface DataRefreshContextValue {

  refreshKey: number;

  syncing: boolean;

  isRefreshing: boolean;

  lastResult: RefreshResult | null;

  refreshData: () => Promise<RefreshResult | null>;

  trackReload: () => () => void;

}



const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);



export function DataRefreshProvider({ children }: { children: ReactNode }) {

  const [refreshKey, setRefreshKey] = useState(0);

  const [syncing, setSyncing] = useState(false);

  const [reloadCount, setReloadCount] = useState(0);

  const [lastResult, setLastResult] = useState<RefreshResult | null>(null);



  const bumpRefresh = useCallback(() => {

    setRefreshKey((key) => key + 1);

  }, []);



  useEffect(() => {

    const handleRefresh = () => bumpRefresh();

    window.addEventListener('bantay:data-refreshed', handleRefresh);

    window.addEventListener('bantay:sync-completed', handleRefresh);

    window.addEventListener('bantay:sync-event', handleRefresh);

    if (api.getToken()) {

      connectRealtimeSync();

    }

    return () => {

      window.removeEventListener('bantay:data-refreshed', handleRefresh);

      window.removeEventListener('bantay:sync-completed', handleRefresh);

      window.removeEventListener('bantay:sync-event', handleRefresh);

      disconnectRealtimeSync();

    };

  }, [bumpRefresh]);



  const trackReload = useCallback(() => {

    setReloadCount((count) => count + 1);

    return () => setReloadCount((count) => Math.max(0, count - 1));

  }, []);



  const refreshData = useCallback(async () => {

    if (syncing) return null;



    setSyncing(true);

    try {

      const result = await refreshDatabases();

      setLastResult(result);

      bumpRefresh();



      if (isDesktop()) {

        const parts: string[] = [];

        if (result.synced > 0) parts.push(`${result.synced} change(s) sent to server`);

        if (result.conflicts > 0) parts.push(`${result.conflicts} conflict(s) resolved`);

        if (result.pulled > 0) parts.push(`${result.pulled} list(s) updated from server`);

        if (result.failed > 0) parts.push(`${result.failed} change(s) failed to sync`);

        if (result.pullErrors.length > 0) {

          parts.push(`${result.pullErrors.length} list(s) could not be refreshed`);

        }



        toast.success(

          parts.length > 0

            ? `Databases synced. ${parts.join('. ')}.`

            : 'Local and server databases are in sync.'

        );

      } else {

        toast.success('Data refreshed from server.');

      }



      window.dispatchEvent(new CustomEvent('bantay:sync-completed'));

      return result;

    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'Failed to refresh data');

      return null;

    } finally {

      setSyncing(false);

      if (isDesktop()) {

        try {

          await initStorage();

        } catch {

          // ignore

        }

      }

    }

  }, [syncing, bumpRefresh]);



  const isRefreshing = syncing || reloadCount > 0;



  const value = useMemo(

    () => ({

      refreshKey,

      syncing,

      isRefreshing,

      lastResult,

      refreshData,

      trackReload,

    }),

    [refreshKey, syncing, isRefreshing, lastResult, refreshData, trackReload]

  );



  return (

    <DataRefreshContext.Provider value={value}>

      {children}

    </DataRefreshContext.Provider>

  );

}



export function useDataRefresh() {

  const context = useContext(DataRefreshContext);

  if (!context) {

    return {

      refreshKey: 0,

      syncing: false,

      isRefreshing: false,

      lastResult: null,

      refreshData: async () => null,

      trackReload: () => () => undefined,

    };

  }

  return context;

}



export function useReloadTracker(loading: boolean) {

  const { trackReload } = useDataRefresh();



  useEffect(() => {

    if (!loading) return;

    return trackReload();

  }, [loading, trackReload]);

}


