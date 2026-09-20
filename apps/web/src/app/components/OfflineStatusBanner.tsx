import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';

import { useOnlineStatus } from '../contexts/OnlineStatusContext';

import { useDataRefresh } from '../contexts/DataRefreshContext';

import { isDesktop } from '../lib/platform';



export function ConnectionStatusIndicator() {

  const { connectionStatus, pendingSync } = useOnlineStatus();



  if (!isDesktop()) return null;



  const config = {

    online: {

      color: 'bg-green-100 text-green-800 border-green-200',

      dot: 'bg-green-500',

      label: 'Online',

      icon: Wifi,

    },

    offline: {

      color: 'bg-red-100 text-red-800 border-red-200',

      dot: 'bg-red-500',

      label: 'Offline',

      icon: WifiOff,

    },

    syncing: {

      color: 'bg-blue-100 text-blue-800 border-blue-200',

      dot: 'bg-blue-500 animate-pulse',

      label: 'Syncing',

      icon: Cloud,

    },

  }[connectionStatus];



  const Icon = config.icon;



  return (

    <div

      className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${config.color}`}

      title={pendingSync > 0 ? `${pendingSync} pending sync item(s)` : config.label}

    >

      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />

      <Icon className="w-3.5 h-3.5 shrink-0" />

      <span>{config.label}</span>

      {pendingSync > 0 && connectionStatus !== 'syncing' && (

        <span className="px-1.5 py-0.5 rounded bg-white/60 text-[10px]">{pendingSync}</span>

      )}

    </div>

  );

}



export function OfflineStatusBanner() {

  const { online, connectionStatus, pendingSync, failedSync } = useOnlineStatus();

  const { refreshData, isRefreshing } = useDataRefresh();



  if (!isDesktop()) return null;

  if (connectionStatus === 'online' && pendingSync === 0 && failedSync === 0) return null;



  const isSyncing = connectionStatus === 'syncing' || isRefreshing;



  return (

    <div

      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-2 text-sm shadow-lg max-w-md ${

        connectionStatus === 'offline'

          ? 'bg-red-900 text-white'

          : connectionStatus === 'syncing'

            ? 'bg-blue-50 text-blue-900 border border-blue-200'

            : 'bg-amber-50 text-amber-900 border border-amber-200'

      }`}

    >

      {connectionStatus === 'offline' ? (

        <WifiOff className="h-4 w-4 shrink-0" />

      ) : connectionStatus === 'syncing' ? (

        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />

      ) : (

        <Wifi className="h-4 w-4 shrink-0" />

      )}



      <div className="min-w-0">

        {connectionStatus === 'offline' && (

          <p>Offline Mode — changes saved locally with Pending Sync status.</p>

        )}

        {connectionStatus === 'syncing' && (

          <p>Synchronizing pending changes with server...</p>

        )}

        {connectionStatus === 'online' && pendingSync > 0 && (

          <p>

            {pendingSync} local change{pendingSync === 1 ? '' : 's'} waiting to sync

            {failedSync > 0 ? ` (${failedSync} failed)` : ''}

          </p>

        )}

        {connectionStatus === 'online' && pendingSync === 0 && failedSync > 0 && (

          <p>{failedSync} sync item(s) failed. Retry from Sync Monitoring.</p>

        )}

      </div>



      {online && !isSyncing && (pendingSync > 0 || failedSync > 0) && (

        <button

          type="button"

          onClick={() => void refreshData()}

          disabled={isSyncing}

          className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60 shrink-0"

        >

          <RefreshCw className="h-3 w-3" />

          Sync now

        </button>

      )}

    </div>

  );

}


