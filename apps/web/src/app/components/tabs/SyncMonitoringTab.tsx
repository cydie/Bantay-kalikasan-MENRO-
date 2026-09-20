import { useEffect, useState } from 'react';
import {
  RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, RotateCcw, Trash2,
} from 'lucide-react';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import { useDataRefresh } from '../../contexts/DataRefreshContext';
import { initStorage } from '../../lib/storage';
import type { SyncLogEntry, SyncMetadata } from '../../lib/storage/types';
import { api } from '../../lib/api';
import { isDesktop } from '../../lib/platform';

export function SyncMonitoringTab() {
  const { connectionStatus, pendingSync, failedSync, syncMetadata, syncNow } = useOnlineStatus();
  const { refreshData, isRefreshing } = useDataRefresh();
  const [localLogs, setLocalLogs] = useState<SyncLogEntry[]>([]);
  const [serverLogs, setServerLogs] = useState<Array<Record<string, unknown>>>([]);
  const [metadata, setMetadata] = useState<SyncMetadata | null>(syncMetadata);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isDesktop()) {
        const storage = await initStorage();
        const logs = await storage.getSyncLogs?.(100);
        const meta = await storage.getSyncMetadata?.();
        if (logs) setLocalLogs(logs);
        if (meta) setMetadata(meta);
      }

      try {
        const server = await api.sync.status();
        setServerLogs(server.recentLogs || []);
      } catch {
        // Server logs require admin + online
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [pendingSync, failedSync, syncMetadata]);

  const handleRetryFailed = async () => {
    if (!isDesktop()) return;
    const storage = await initStorage();
    await storage.resetFailedSyncQueue?.();
    await syncNow();
    await loadData();
  };

  const handleClearFailed = async () => {
    if (!isDesktop()) return;
    const storage = await initStorage();
    await storage.clearFailedSyncQueue();
    await loadData();
  };

  const statusColor = {
    online: 'text-green-700 bg-green-100',
    offline: 'text-red-700 bg-red-100',
    syncing: 'text-blue-700 bg-blue-100',
  }[connectionStatus];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sync Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Monitor offline-to-online synchronization, pending queue, and sync history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void refreshData()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending Sync</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingSync}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Successful (last run)</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{metadata?.total_synced ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{failedSync || (metadata?.total_failed ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Conflicts Resolved</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{metadata?.total_conflicts ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Status</p>
          <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColor}`}>
            {connectionStatus}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Last Sync</p>
          <p className="text-sm font-medium text-gray-800 mt-1">
            {metadata?.last_sync_at
              ? new Date(metadata.last_sync_at).toLocaleString()
              : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Last Result</p>
          <p className="text-sm font-medium text-gray-800 mt-1 capitalize">
            {metadata?.last_sync_status || 'idle'}
          </p>
        </div>
        {failedSync > 0 && isDesktop() && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => void handleRetryFailed()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Failed
            </button>
            <button
              onClick={() => void handleClearFailed()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Failed
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
        </div>
      ) : (
        <>
          {isDesktop() && localLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Local Sync Logs</h3>
              </div>
              <div className="max-h-64 overflow-y-auto table-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Time</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Module</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Operation</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localLogs.map((log) => (
                      <tr key={log.id} className="border-t border-gray-50">
                        <td className="py-2 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">{log.module_name}</td>
                        <td className="py-2 px-4 capitalize">{log.operation_type}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : log.status === 'conflict'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-600">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {serverLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Server Sync Logs</h3>
              </div>
              <div className="max-h-64 overflow-y-auto table-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Time</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Module</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Operation</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">By</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serverLogs.map((log) => (
                      <tr key={String(log.id)} className="border-t border-gray-50">
                        <td className="py-2 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(String(log.created_at)).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">{String(log.module_name)}</td>
                        <td className="py-2 px-4 capitalize">{String(log.operation_type)}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : log.status === 'conflict'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {String(log.status)}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-600">{String(log.performed_by)}</td>
                        <td className="py-2 px-4 text-gray-600">{String(log.message)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {localLogs.length === 0 && serverLogs.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              No sync logs yet. Logs appear here when offline changes are synchronized.
            </div>
          )}
        </>
      )}
    </div>
  );
}
