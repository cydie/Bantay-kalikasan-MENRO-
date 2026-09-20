import { useEffect, useState } from 'react';
import { History, Filter, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, HistoryEntry } from '../../lib/api';
import { SECTIONS } from '../../config/sections';
import { useAuth } from '../../contexts/AuthContext';
import { isMainAdmin } from '../../lib/permissions';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';

export function HistoryTab() {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useReloadTracker(loading);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (sectionFilter !== 'all') params.section = sectionFilter;
    if (typeFilter !== 'all') params.activity_type = typeFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (searchTerm) params.search = searchTerm;

    api.history.list(params)
      .then(setEntries)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [sectionFilter, typeFilter, statusFilter, dateFilter, searchTerm, refreshKey]);

  const activityTypes = [
    'Activity Created', 'Activity Completed', 'Activity Update',
    'Record Update', 'Report Generated', 'Inquiry Response', 'Admin Action',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">History</h2>
        <p className="text-gray-600 mt-1">
          Documentation and tracking of completed activities, updates, and important admin actions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          {isMainAdmin(user) && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All Types</option>
            {activityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Updated">Updated</option>
            <option value="Archived">Archived</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{entry.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{entry.activity_type}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{entry.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Section: {entry.section_label}</span>
                      <span>By: {entry.performed_by}</span>
                      <span>Date: {entry.event_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No history entries match your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
