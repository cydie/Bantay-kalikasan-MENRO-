import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import {
  LogOut, Menu, X, Bell, User, Users, Settings,
  Home, ShieldCheck, FileText, Database, Activity, History, Briefcase, RefreshCw, Cloud
} from 'lucide-react';
import { appLogo } from '../../assets/brand';
import { canAccessAdminStaff, canAccessSyncMonitoring, canAccessUsers, getRoleBadge } from '../lib/permissions';
import { getSectionLabel } from '../config/sections';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import { isDesktop as isDesktopApp, isOnline } from '../lib/platform';
import { ConnectionStatusIndicator } from './OfflineStatusBanner';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardLayout({ children, title, activeTab = 'dashboard', onTabChange }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { refreshData, isRefreshing, syncing } = useDataRefresh();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncLayout = () => {
      const desktop = mediaQuery.matches;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (tab: string) => {
    onTabChange?.(tab);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  const handleRefresh = () => {
    if (!isOnline() || isRefreshing) return;
    void refreshData();
  };

  const refreshTitle = isRefreshing
    ? syncing
      ? 'Syncing databases...'
      : 'Loading latest data...'
    : isDesktopApp()
      ? 'Sync local database with server and reload latest data'
      : 'Reload latest data from server';

  const refreshLabel = isRefreshing ? (syncing ? 'Syncing...' : 'Loading...') : 'Refresh';

  const workflowItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'activities', label: 'Activity', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'records', label: 'Records', icon: Database },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'services', label: 'Services Offered', icon: Briefcase },
    { id: 'inquiries', label: 'Online Inquiries', icon: Bell },
  ];

  const managementItems = [
    ...(canAccessUsers(user) ? [{ id: 'users', label: 'Users', icon: Users }] : []),
    ...(canAccessAdminStaff(user) ? [{ id: 'admin-staff', label: 'Admin Staff', icon: ShieldCheck }] : []),
    ...(canAccessSyncMonitoring(user) && isDesktopApp()
      ? [{ id: 'sync-monitoring', label: 'Sync Monitoring', icon: Cloud }]
      : []),
  ];

  const navButtonClass = (tabId: string) =>
    `w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
      activeTab === tabId
        ? 'bg-green-600 text-white'
        : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50 top-0 left-0">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              >
                {sidebarOpen && !isDesktop ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-800 text-sm sm:text-base truncate">{title}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Municipality of Rizal - MENRO</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <ConnectionStatusIndicator />

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || !isOnline()}
                title={refreshTitle}
                aria-busy={isRefreshing}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                  isRefreshing
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-200'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium hidden sm:inline">{refreshLabel}</span>
              </button>

              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{user?.name}</p>
                  <p className="text-xs text-gray-500">{getRoleBadge(user)}</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
              </div>

              <div className="md:hidden w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/40 z-30 top-[52px] sm:top-[57px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-[52px] sm:top-[57px] bottom-0 w-[min(100vw-2.5rem,17rem)] sm:w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 sm:p-4">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-1 shrink-0">
                <img src={appLogo} alt="Bantay Kalikasan Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">MENRO Portal</p>
                <p className="text-xs text-gray-600">Rizal Municipality</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-green-300">
              <p className="text-xs font-medium text-green-800 truncate">
                {getSectionLabel(user?.department || '').toUpperCase()}
              </p>
            </div>
          </div>

          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Workflow</p>
          <nav className="space-y-1 mb-4">
            {workflowItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={navButtonClass(item.id)}>
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {managementItems.length > 0 && (
            <>
              <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Management</p>
              <nav className="space-y-1 mb-4">
                {managementItems.map((item) => (
                  <button key={item.id} onClick={() => handleNavClick(item.id)} className={navButtonClass(item.id)}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
            </>
          )}

          <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">System</p>
          <nav className="space-y-1">
            <button onClick={() => handleNavClick('settings')} className={navButtonClass('settings')}>
              <Settings className="w-5 h-5 shrink-0" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      <main
        className={`pt-[52px] sm:pt-[57px] transition-[margin] duration-300 min-w-0 ${
          sidebarOpen && isDesktop ? 'lg:ml-64' : 'ml-0'
        }`}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
