/** Shared Tailwind class strings for consistent forms, tables, and layout. */

export const inputClass =
  'w-full min-w-0 max-w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm sm:text-base';

export const selectClass = inputClass;

export const textareaClass =
  'w-full min-w-0 max-w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-y min-h-[80px] text-sm sm:text-base';

export const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

export const requiredMark = 'text-red-500 ml-0.5';

export const formGridClass = 'grid grid-cols-1 md:grid-cols-2 gap-4';

export const formActionsClass = 'flex flex-wrap justify-end gap-3 pt-2';

export const btnPrimaryClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium';

export const btnSecondaryClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 text-sm font-medium';

export const btnDangerClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 text-sm font-medium';

export const cardClass = 'bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 min-w-0';

export const tableWrapClass = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden table-scroll min-w-0';

export const thClass = 'text-left py-3 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap';

export const tdClass = 'py-3 px-4 text-sm text-gray-600 align-top';

export const tdTruncateClass = `${tdClass} max-w-[200px] sm:max-w-[280px] truncate`;

export const tdWrapClass = `${tdClass} break-words max-w-xs sm:max-w-md`;

export const pageHeaderClass = 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 min-w-0';

export const pageTitleClass = 'text-xl sm:text-2xl font-bold text-gray-800';

export const pageSubtitleClass = 'text-gray-600 mt-1 text-sm sm:text-base';

export function statusBadgeClass(status: string): string {
  const base = 'inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Healthy: 'bg-green-100 text-green-700',
    Completed: 'bg-green-100 text-green-700',
    Resolved: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Scheduled: 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Monitoring: 'bg-blue-100 text-blue-700',
    Ready: 'bg-blue-100 text-blue-700',
    Archived: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700',
    Closed: 'bg-gray-100 text-gray-700',
    Urgent: 'bg-red-100 text-red-700',
    Normal: 'bg-blue-100 text-blue-700',
    Low: 'bg-gray-100 text-gray-700',
  };
  return `${base} ${map[status] ?? 'bg-gray-100 text-gray-700'}`;
}

export type DashboardTabId =
  | 'dashboard'
  | 'activities'
  | 'history'
  | 'records'
  | 'reports'
  | 'services'
  | 'inquiries'
  | 'settings'
  | 'users'
  | 'admin-staff'
  | 'sync-monitoring';

/** Map dashboard function tile labels to existing working tabs. */
export function resolveFunctionToTab(functionName: string): DashboardTabId | null {
  const n = functionName.toLowerCase();

  if (n.includes('report') || n.includes('analytics') || n.includes('download')) return 'reports';
  if (n.includes('upload') || n.includes('documentation') || n.includes('search record') || n.includes('disposal tracking') || n.includes('distribution record') || n.includes('fee record') || n.includes('garbage fee')) return 'records';
  if (
    n.includes('schedul') ||
    n.includes('activit') ||
    n.includes('monitor') ||
    n.includes('attendance') ||
    n.includes('planting') ||
    n.includes('collection route') ||
    n.includes('personnel assign') ||
    n.includes('equipment') ||
    n.includes('survival') ||
    n.includes('growth') ||
    n.includes('mangrove') ||
    n.includes('inspection') ||
    n.includes('enforcement') ||
    n.includes('illegal') ||
    n.includes('safety') ||
    n.includes('disposal schedul')
  ) {
    return 'activities';
  }
  if (n.includes('notification') || n.includes('inquir')) return 'inquiries';
  if (n.includes('setting')) return 'settings';
  if (n.includes('system log') || n.includes('log')) return 'history';
  if (n.includes('user account')) return 'users';
  if (n.includes('service')) return 'services';
  if (n.includes('backup') || n.includes('sync')) return 'sync-monitoring';

  return null;
}

export function handleDashboardFunctionClick(
  functionName: string,
  modalNames: string[],
  setActiveTab: (tab: DashboardTabId | string) => void,
  setActiveModal: (modal: string | null) => void
) {
  if (modalNames.includes(functionName)) {
    setActiveModal(functionName);
    return;
  }

  const tab = resolveFunctionToTab(functionName);
  if (tab) {
    setActiveModal(null);
    setActiveTab(tab);
    return;
  }

  setActiveTab('records');
}
