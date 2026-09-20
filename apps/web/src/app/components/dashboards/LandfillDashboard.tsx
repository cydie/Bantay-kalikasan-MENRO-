import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { FunctionModal } from '../FunctionModal';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { ReportsTab } from '../tabs/ReportsTab';
import { HouseholdWasteModal } from '../modals/HouseholdWasteModal';
import { IndustrialWasteModal } from '../modals/IndustrialWasteModal';
import { InstitutionalWasteModal } from '../modals/InstitutionalWasteModal';
import { CapacityMonitoringModal } from '../modals/CapacityMonitoringModal';
import { useDepartmentDashboard } from '../../hooks/useDashboardStats';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';

const LANDFILL_MODALS = [
  'Household Waste Records',
  'Industrial Waste Records',
  'Institutional Waste Records',
  'Capacity Monitoring',
];
import {
  Trash2, Home, Building2, Factory, BarChart3, Calendar,
  Shield, FileText, Upload, Search, Loader2
} from 'lucide-react';

const statIcons = [
  { label: 'Current Capacity', icon: BarChart3, color: 'orange' },
  { label: 'Disposal Rate (daily)', icon: Trash2, color: 'red' },
  { label: 'Disposal Operations', icon: Calendar, color: 'blue' },
  { label: 'Safety Status', icon: Shield, color: 'green' },
];

export function LandfillDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data, loading } = useDepartmentDashboard('landfill');

  const stats = statIcons.map((item) => ({
    ...item,
    value: data?.stats.find((s) => s.label === item.label)?.value ?? '—',
  }));

  const capacityPercent = data?.capacityPercent ?? 68;

  const recentDisposals = (data?.tableItems ?? []) as Array<{
    type: string;
    source: string;
    weight: string;
    date: string;
    status: string;
  }>;

  const functions = [
    { name: 'Household Waste Records', description: 'Track residential waste', icon: Home, color: 'blue' },
    { name: 'Industrial Waste Records', description: 'Monitor industrial waste', icon: Factory, color: 'red' },
    { name: 'Institutional Waste Records', description: 'Track institutional waste', icon: Building2, color: 'purple' },
    { name: 'Capacity Monitoring', description: 'Monitor landfill capacity', icon: BarChart3, color: 'orange' },
    { name: 'Disposal Scheduling', description: 'Schedule disposal operations', icon: Calendar, color: 'indigo' },
    { name: 'Safety Monitoring', description: 'Environmental safety checks', icon: Shield, color: 'green' },
    { name: 'Landfill Reports', description: 'Generate disposal reports', icon: FileText, color: 'pink' },
    { name: 'Disposal Tracking', description: 'Track waste disposal', icon: Trash2, color: 'red' },
    { name: 'Upload Documentation', description: 'Upload disposal records', icon: Upload, color: 'cyan' },
    { name: 'Search Records', description: 'Find disposal records', icon: Search, color: 'teal' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<ReportsTab department="landfill" />}
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

        {/* Capacity Monitor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Landfill Capacity Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Usage</span>
              <span className="text-sm font-bold text-orange-600">{capacityPercent}% Full</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 h-6 rounded-full transition-all" style={{ width: `${capacityPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Notice:</strong> Landfill approaching 70% capacity. Consider expansion planning.
              </p>
            </div>
          </div>
        </div>

        {/* Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Landfill Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => (
              <button
                key={func.name}
                onClick={() =>
                  handleDashboardFunctionClick(func.name, LANDFILL_MODALS, setActiveTab, setActiveModal)
                }
                className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:shadow-md transition-all group min-w-0"
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

        {/* Recent Disposals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Disposal Records</h2>
          <div className="table-scroll">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waste Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Weight</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDisposals.map((disposal, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{disposal.type}</td>
                    <td className="py-3 px-4 text-gray-600">{disposal.source}</td>
                    <td className="py-3 px-4 text-gray-600">{disposal.weight}</td>
                    <td className="py-3 px-4 text-gray-600">{disposal.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        disposal.status === 'Processed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {disposal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {activeModal === 'Household Waste Records' && (
          <FunctionModal isOpen={true} onClose={() => setActiveModal(null)} title={activeModal} icon={<Home className="w-6 h-6" />}>
            <HouseholdWasteModal />
          </FunctionModal>
        )}
        {activeModal === 'Industrial Waste Records' && (
          <FunctionModal isOpen={true} onClose={() => setActiveModal(null)} title={activeModal} icon={<Factory className="w-6 h-6" />}>
            <IndustrialWasteModal />
          </FunctionModal>
        )}
        {activeModal === 'Institutional Waste Records' && (
          <FunctionModal isOpen={true} onClose={() => setActiveModal(null)} title={activeModal} icon={<Building2 className="w-6 h-6" />}>
            <InstitutionalWasteModal />
          </FunctionModal>
        )}
        {activeModal === 'Capacity Monitoring' && (
          <FunctionModal isOpen={true} onClose={() => setActiveModal(null)} title={activeModal} icon={<BarChart3 className="w-6 h-6" />}>
            <CapacityMonitoringModal />
          </FunctionModal>
        )}
    </div>
  );

  return (
    <DashboardLayout title="Landfill Management Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
