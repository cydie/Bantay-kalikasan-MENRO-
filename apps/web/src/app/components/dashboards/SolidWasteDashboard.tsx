import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { FunctionModal } from '../FunctionModal';
import { WasteCollectionModal } from '../modals/WasteCollectionModal';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { SolidWasteReportsTab } from '../tabs/SolidWasteReportsTab';
import { useDepartmentDashboard } from '../../hooks/useDashboardStats';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';

const SOLID_WASTE_MODALS = ['Collection Monitoring'];
import {
  Trash2, Truck, MapPin, DollarSign, Calendar, Users,
  FileText, Upload, TrendingUp, Wrench, Loader2
} from 'lucide-react';

const statIcons = [
  { label: 'Daily Waste (tons)', icon: Trash2, color: 'red' },
  { label: 'Collection Vehicles', icon: Truck, color: 'blue' },
  { label: 'Active Routes', icon: MapPin, color: 'green' },
  { label: 'Waste Operations', icon: TrendingUp, color: 'purple' },
];

export function SolidWasteDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data, loading } = useDepartmentDashboard('solid-waste');

  const stats = statIcons.map((item) => ({
    ...item,
    value: data?.stats.find((s) => s.label === item.label)?.value ?? '—',
  }));

  const todayCollections = (data?.tableItems ?? []) as Array<{
    route: string;
    vehicle: string;
    status: string;
    time: string;
    volume: string;
  }>;

  const functions = [
    { name: 'Collection Monitoring', description: 'Track garbage collection', icon: Trash2, color: 'red' },
    { name: 'Collection Routes', description: 'Manage collection routes', icon: MapPin, color: 'blue' },
    { name: 'Garbage Fee Records', description: 'Manage collection fees', icon: DollarSign, color: 'green' },
    { name: 'Equipment Monitoring', description: 'Track vehicles & equipment', icon: Wrench, color: 'orange' },
    { name: 'Waste Volume Tracking', description: 'Monitor waste volumes', icon: TrendingUp, color: 'purple' },
    { name: 'Collection Scheduling', description: 'Schedule collections', icon: Calendar, color: 'indigo' },
    { name: 'Personnel Assignment', description: 'Assign collection staff', icon: Users, color: 'teal' },
    { name: 'Collection Reports', description: 'Generate reports', icon: FileText, color: 'pink' },
    { name: 'Upload Documentation', description: 'Upload waste records', icon: Upload, color: 'cyan' },
    { name: 'Route Analytics', description: 'Analyze route efficiency', icon: TrendingUp, color: 'lime' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<SolidWasteReportsTab />}
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
          <h2 className="text-xl font-bold text-gray-800 mb-6">Waste Management Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => (
              <button
                key={func.name}
                onClick={() =>
                  handleDashboardFunctionClick(func.name, SOLID_WASTE_MODALS, setActiveTab, setActiveModal)
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

        {/* Today's Collections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Today's Collection Schedule</h2>
          <div className="table-scroll">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Route</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Volume</th>
                </tr>
              </thead>
              <tbody>
                {todayCollections.map((collection, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{collection.route}</td>
                    <td className="py-3 px-4 text-gray-600">{collection.vehicle}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        collection.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        collection.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {collection.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{collection.time}</td>
                    <td className="py-3 px-4 text-gray-600">{collection.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {activeModal === 'Collection Monitoring' && (
          <FunctionModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title={activeModal}
            icon={<Trash2 className="w-6 h-6" />}
          >
            <WasteCollectionModal
              onScheduleNew={() => {
                setActiveModal(null);
                setActiveTab('activities');
              }}
            />
          </FunctionModal>
        )}
    </div>
  );

  return (
    <DashboardLayout title="Solid Waste Management Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
