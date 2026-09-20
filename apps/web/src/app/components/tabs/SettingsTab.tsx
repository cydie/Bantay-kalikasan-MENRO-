import { useState, useEffect } from 'react';
import { User, Bell, Shield, Server } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBase, isDesktop, normalizeApiBase, setApiBase, clearApiBaseOverride } from '../../lib/platform';
import { btnPrimaryClass, btnSecondaryClass, cardClass, inputClass, labelClass, pageSubtitleClass, pageTitleClass } from '../../lib/uiClasses';

const NOTIF_KEY = 'bantay_notification_prefs';

function loadNotificationPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw) as { email: boolean; push: boolean; reports: boolean };
  } catch {
    // ignore
  }
  return { email: true, push: true, reports: false };
}

export function SettingsTab() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(loadNotificationPrefs);
  const [serverUrl, setServerUrl] = useState(() => getApiBase().replace(/\/api$/, ''));
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    toast.success('Notification preferences saved');
    setTimeout(() => setSavingPrefs(false), 400);
  };

  const handleSaveServerUrl = () => {
    if (!serverUrl.trim()) {
      toast.error('Enter the server address (example: http://192.168.1.10:3001)');
      return;
    }
    setApiBase(serverUrl);
    toast.success(`Server set to ${normalizeApiBase(serverUrl)}`);
  };

  const handleResetServerUrl = () => {
    clearApiBaseOverride();
    setServerUrl(getApiBase().replace(/\/api$/, ''));
    toast.success('Server address reset to default');
  };

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h2 className={pageTitleClass}>Settings</h2>
        <p className={pageSubtitleClass}>Manage your account and preferences</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-green-600 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-800">Profile Settings</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Profile details are managed by your administrator.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className={labelClass}>Full Name</label>
            <input type="text" value={user?.name ?? ''} readOnly className={`${inputClass} bg-gray-50 text-gray-600`} />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Email</label>
            <input type="email" value={user?.email ?? ''} readOnly className={`${inputClass} bg-gray-50 text-gray-600`} />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Department</label>
            <input
              type="text"
              value={user?.department.toUpperCase().replace('-', ' ') ?? ''}
              readOnly
              className={`${inputClass} bg-gray-50 text-gray-600`}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Position</label>
            <input type="text" value={user?.role ?? ''} readOnly className={`${inputClass} bg-gray-50 text-gray-600`} />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <Server className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Server Connection</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {isDesktop()
            ? 'Point this device to the MENRO server on your network so inquiries from all devices go to the same database.'
            : 'Set the central API server when using the web app across devices on your intranet.'}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.10:3001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Current API: <span className="font-mono">{getApiBase()}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleSaveServerUrl} className={btnPrimaryClass}>
              Save Server
            </button>
            <button type="button" onClick={handleResetServerUrl} className={btnSecondaryClass}>
              Reset Default
            </button>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-green-600 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-800">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates about activities</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Push Notifications</p>
              <p className="text-sm text-gray-500">Get push notifications on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Weekly Reports</p>
              <p className="text-sm text-gray-500">Receive weekly summary reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.reports}
                onChange={(e) => setNotifications({...notifications, reports: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
        <button type="button" onClick={handleSavePreferences} disabled={savingPrefs} className={`mt-4 ${btnPrimaryClass}`}>
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-green-600 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-800">Security</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Password changes are handled by your administrator. Contact MENRO IT support to reset your password.
        </p>
        <div className="space-y-4 opacity-60 pointer-events-none" aria-hidden="true">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
