import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdminStaff, canAccessSyncMonitoring, canAccessUsers } from '../lib/permissions';
import { ActivitiesTab } from './tabs/ActivitiesTab';
import { HistoryTab } from './tabs/HistoryTab';
import { RecordsTab } from './tabs/RecordsTab';
import { OnlineInquiriesTab } from './tabs/OnlineInquiriesTab';
import { AdminStaffTab } from './tabs/AdminStaffTab';
import { UsersTab } from './tabs/UsersTab';
import { SyncMonitoringTab } from './tabs/SyncMonitoringTab';
import { DepartmentServicesTab } from './tabs/DepartmentServicesTab';
import { SettingsTab } from './tabs/SettingsTab';

interface DashboardModuleContentProps {
  activeTab: string;
  reportsTab: ReactNode;
  showAllInquiries?: boolean;
  showAllServices?: boolean;
}

export function DashboardModuleContent({
  activeTab,
  reportsTab,
  showAllInquiries = false,
  showAllServices = false,
}: DashboardModuleContentProps) {
  const { user } = useAuth();

  switch (activeTab) {
    case 'activities':
      return <ActivitiesTab />;
    case 'history':
      return <HistoryTab />;
    case 'records':
      return <RecordsTab />;
    case 'reports':
      return reportsTab;
    case 'services':
      return <DepartmentServicesTab isAdminView={showAllServices} />;
    case 'inquiries':
      return <OnlineInquiriesTab showAllDepartments={showAllInquiries} />;
    case 'sync-monitoring':
      return canAccessSyncMonitoring(user) ? (
        <SyncMonitoringTab />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
          Only the Main Admin can access sync monitoring.
        </div>
      );
    case 'users':
      return canAccessUsers(user) ? (
        <UsersTab />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
          Only the Main Admin can view all user accounts.
        </div>
      );
    case 'admin-staff':
      return canAccessAdminStaff(user) ? (
        <AdminStaffTab />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
          Only the Main Admin can manage admin accounts.
        </div>
      );
    case 'settings':
      return <SettingsTab />;
    default:
      return null;
  }
}
