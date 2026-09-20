import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { FunctionModal } from '../FunctionModal';
import { ManageEmployeesModal } from '../modals/ManageEmployeesModal';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { AdminReportsTab } from '../tabs/AdminReportsTab';
import { useAdminDashboard } from '../../hooks/useDashboardStats';
import {
  Users, FileText, UserCog, Activity, Bell,
  BarChart3, Shield, Clock, Settings, Download, HardDrive, Loader2
} from 'lucide-react';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';

const ADMIN_MODALS = ['Manage Employees'];

const statConfig = [
  { label: 'Total Employees', icon: Users, color: 'blue', key: 'totalEmployees' as const },
  { label: 'Active Departments', icon: Shield, color: 'green', key: 'activeDepartments' as const },
  { label: 'Pending Inquiries', icon: FileText, color: 'yellow', key: 'pendingInquiries' as const },
  { label: 'Recent Activities', icon: Activity, color: 'purple', key: 'totalActivities' as const },
];

export function AdminDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { stats: dashboardStats, loading } = useAdminDashboard();

  const stats = statConfig.map((item) => ({
    ...item,
    value: dashboardStats ? String(dashboardStats[item.key]) : '—',
  }));

  const recentActivities = (dashboardStats?.recentActivities ?? []).slice(0, 4).map((entry) => ({
    user: entry.user_name,
    action: entry.action,
    dept: entry.department,
    time: new Date(entry.created_at).toLocaleString(),
  }));

  const functions = [
    { name: 'Manage Employees', description: 'Add/Edit/Delete Personnel', icon: UserCog, color: 'blue' },
    { name: 'View All Reports', description: 'Generate Organizational Reports', icon: FileText, color: 'green' },
    { name: 'User Account Management', description: 'Manage user accounts and permissions', icon: Users, color: 'purple' },
    { name: 'System Logs', description: 'View system activity logs', icon: Clock, color: 'orange' },
    { name: 'Attendance Monitoring', description: 'Track employee attendance', icon: Activity, color: 'pink' },
    { name: 'Dashboard Analytics', description: 'View system analytics', icon: BarChart3, color: 'indigo' },
    { name: 'Backup Database', description: 'Create system backup', icon: HardDrive, color: 'red' },
    { name: 'System Settings', description: 'Configure system settings', icon: Settings, color: 'gray' },
    { name: 'Notifications Center', description: 'Manage notifications', icon: Bell, color: 'yellow' },
    { name: 'Download Reports', description: 'Export data and reports', icon: Download, color: 'teal' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<AdminReportsTab />}
        showAllInquiries
        showAllServices
      />
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat) => {
            const colors = getStatIconColors(stat.color);
            return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${colors.text}`} />
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Main Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => {
              const colors = getStatIconColors(func.color);
              return (
              <button
                key={func.name}
                onClick={() =>
                  handleDashboardFunctionClick(func.name, ADMIN_MODALS, setActiveTab, setActiveModal)
                }
                className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:shadow-md transition-all group min-w-0"
              >
                <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                  <func.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="font-semibold text-gray-800 text-sm dashboard-tile-label">{func.name}</p>
                  <p className="text-xs text-gray-500 mt-1 dashboard-tile-label">{func.description}</p>
                </div>
              </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{activity.dept}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <FunctionModal
          isOpen={activeModal === 'Manage Employees'}
          onClose={() => setActiveModal(null)}
          title="Manage Employees"
          icon={<UserCog className="w-6 h-6" />}
        >
          <ManageEmployeesModal />
        </FunctionModal>
    </div>
  );

  return (
    <DashboardLayout title="Admin Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
