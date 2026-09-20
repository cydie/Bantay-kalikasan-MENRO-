import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { ReportsTab } from '../tabs/ReportsTab';
import { useDepartmentDashboard } from '../../hooks/useDashboardStats';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';
import {
  AlertTriangle, Trees, Bird, Mountain, FileWarning,
  Shield, Upload, Calendar, Users, FileText, Loader2
} from 'lucide-react';

const statIcons = [
  { label: 'Active Cases', icon: FileWarning, color: 'red' },
  { label: 'Enforcement Ops', icon: Shield, color: 'blue' },
  { label: 'Violations Recorded', icon: AlertTriangle, color: 'orange' },
  { label: 'Field Personnel', icon: Users, color: 'green' },
];

export function EnforcementDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [, setActiveModal] = useState<string | null>(null);
  const { data, loading } = useDepartmentDashboard('enforcement');

  const stats = statIcons.map((item) => ({
    ...item,
    value: data?.stats.find((s) => s.label === item.label)?.value ?? '—',
  }));

  const activeCases = (data?.tableItems ?? []) as Array<{
    caseId: string;
    type: string;
    location: string;
    status: string;
    priority: string;
    date: string;
  }>;

  const functions = [
    { name: 'Illegal Logging Operations', description: 'Monitor logging violations', icon: Trees, color: 'red' },
    { name: 'Wildlife Protection', description: 'Protect endangered species', icon: Bird, color: 'blue' },
    { name: 'Illegal Mining Monitoring', description: 'Track mining violations', icon: Mountain, color: 'orange' },
    { name: 'Danger Tree Operations', description: 'Manage hazardous trees', icon: AlertTriangle, color: 'yellow' },
    { name: 'Incident Reporting', description: 'Report violations', icon: FileWarning, color: 'red' },
    { name: 'Violation Records', description: 'Maintain violation logs', icon: FileText, color: 'purple' },
    { name: 'Evidence Upload', description: 'Upload evidence files', icon: Upload, color: 'pink' },
    { name: 'Enforcement Scheduling', description: 'Schedule operations', icon: Calendar, color: 'indigo' },
    { name: 'Personnel Assignment', description: 'Assign field staff', icon: Users, color: 'teal' },
    { name: 'Enforcement Reports', description: 'Generate reports', icon: FileText, color: 'cyan' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<ReportsTab department="enforcement" />}
      />
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full ${getStatIconColors(stat.color).bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${getStatIconColors(stat.color).text}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Enforcement Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => (
              <button
                key={func.name}
                onClick={() => handleDashboardFunctionClick(func.name, [], setActiveTab, setActiveModal)}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:shadow-md transition-all group min-w-0"
              >
                <div className={`w-12 h-12 rounded-full ${getStatIconColors(func.color).bg} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                  <func.icon className={`w-6 h-6 ${getStatIconColors(func.color).text}`} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="font-semibold text-gray-800 text-sm dashboard-tile-label">{func.name}</p>
                  <p className="text-xs text-gray-500 mt-1 dashboard-tile-label">{func.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Active Enforcement Cases</h2>
          <div className="space-y-4">
            {activeCases.map((caseItem) => (
              <div key={caseItem.caseId} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{caseItem.caseId}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        caseItem.priority === 'Critical' ? 'bg-red-600 text-white' :
                        caseItem.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {caseItem.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{caseItem.type}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {caseItem.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {caseItem.date}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      caseItem.status === 'Active Operation' ? 'bg-green-100 text-green-700' :
                      caseItem.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' :
                      caseItem.status === 'Evidence Collection' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );

  return (
    <DashboardLayout title="Enforcement Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
