import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { FunctionModal } from '../FunctionModal';
import { SeedlingInventoryModal } from '../modals/SeedlingInventoryModal';
import { AddSeedlingForm } from '../forms/AddSeedlingForm';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { NurseryReportsTab } from '../tabs/NurseryReportsTab';
import { useDepartmentDashboard } from '../../hooks/useDashboardStats';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';
import {
  Sprout, TrendingUp, Users, FileText, Calendar,
  Search, Upload, MapPin, Activity, Database, Loader2
} from 'lucide-react';

const statIcons = [
  { label: 'Total Seedlings', icon: Sprout, color: 'green' },
  { label: 'Distributed Plants', icon: TrendingUp, color: 'blue' },
  { label: 'Survival Rate', icon: Activity, color: 'purple' },
  { label: 'Nursery Activities', icon: Calendar, color: 'orange' },
];

const NURSERY_MODALS = ['Seedling Inventory', 'Add New Seedlings'];

export function NurseryDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data, loading } = useDepartmentDashboard('nursery');

  const stats = statIcons.map((item) => ({
    ...item,
    value: data?.stats.find((s) => s.label === item.label)?.value ?? '—',
  }));

  const recentPlants = (data?.tableItems ?? []) as Array<{
    species: string;
    quantity: number;
    status: string;
    date: string;
  }>;

  const functions = [
    { name: 'Seedling Inventory', description: 'Manage seedling stock', icon: Database, color: 'green' },
    { name: 'Add New Seedlings', description: 'Register new seedlings', icon: Sprout, color: 'emerald' },
    { name: 'Monitor Growth', description: 'Track seedling development', icon: TrendingUp, color: 'lime' },
    { name: 'Distribution Records', description: 'Manage plant distribution', icon: Users, color: 'blue' },
    { name: 'Survival Monitoring', description: 'Track survival rates', icon: Activity, color: 'purple' },
    { name: 'Nursery Scheduling', description: 'Schedule nursery tasks', icon: Calendar, color: 'orange' },
    { name: 'Planting Activities', description: 'Tree planting programs', icon: MapPin, color: 'teal' },
    { name: 'Nursery Reports', description: 'Generate nursery reports', icon: FileText, color: 'indigo' },
    { name: 'Upload Documentation', description: 'Upload plant records', icon: Upload, color: 'pink' },
    { name: 'Search Species', description: 'Find plant species info', icon: Search, color: 'cyan' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<NurseryReportsTab />}
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

        {/* Functions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Nursery Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => {
              const colors = getStatIconColors(func.color);
              return (
              <button
                key={func.name}
                onClick={() =>
                  handleDashboardFunctionClick(func.name, NURSERY_MODALS, setActiveTab, setActiveModal)
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

        {/* Recent Plants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Recent Seedling Records</h2>
          <div className="table-scroll">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Species</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPlants.map((plant, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{plant.species}</td>
                    <td className="py-3 px-4 text-gray-600">{plant.quantity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        plant.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                        plant.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {plant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{plant.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {activeModal && (
          <FunctionModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title={activeModal}
            icon={<Sprout className="w-6 h-6" />}
          >
            {activeModal === 'Seedling Inventory' ? (
              <SeedlingInventoryModal onAddNew={() => setActiveModal('Add New Seedlings')} />
            ) : activeModal === 'Add New Seedlings' ? (
              <AddSeedlingForm onCancel={() => setActiveModal(null)} onSaved={() => setActiveModal('Seedling Inventory')} />
            ) : null}
          </FunctionModal>
        )}
    </div>
  );

  return (
    <DashboardLayout title="Nursery Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
