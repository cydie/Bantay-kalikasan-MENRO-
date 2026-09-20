import { useState } from 'react';
import { DashboardLayout } from '../DashboardLayout';
import { DashboardModuleContent } from '../DashboardModuleContent';
import { EnvironmentalReportsTab } from '../tabs/EnvironmentalReportsTab';
import { useDepartmentDashboard } from '../../hooks/useDashboardStats';
import { getStatIconColors } from '../../lib/uiColors';
import { handleDashboardFunctionClick } from '../../lib/uiClasses';
import {
  Trees, Bird, Leaf, FileText, MapPin, Calendar,
  TrendingUp, Upload, Search, Activity, Loader2
} from 'lucide-react';

const statIcons = [
  { label: 'Active Projects', icon: Activity, color: 'green' },
  { label: 'Protected Areas', icon: MapPin, color: 'blue' },
  { label: 'Wildlife Reports', icon: Bird, color: 'purple' },
  { label: 'Monitoring Ops', icon: TrendingUp, color: 'orange' },
];

export function EnvironmentalDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [, setActiveModal] = useState<string | null>(null);
  const { data, loading } = useDepartmentDashboard('environmental');

  const stats = statIcons.map((item) => ({
    ...item,
    value: data?.stats.find((s) => s.label === item.label)?.value ?? '—',
  }));

  const activeProjects = (data?.tableItems ?? []) as Array<{
    name: string;
    area: string;
    status: string;
    progress: number;
  }>;

  const functions = [
    { name: 'Mangrove Monitoring', description: 'Track mangrove ecosystems', icon: Trees, color: 'emerald' },
    { name: 'Wildlife Monitoring', description: 'Monitor wildlife populations', icon: Bird, color: 'blue' },
    { name: 'Flora & Fauna Records', description: 'Document biodiversity', icon: Leaf, color: 'green' },
    { name: 'Environmental Assessment', description: 'Conduct impact assessments', icon: FileText, color: 'indigo' },
    { name: 'Environmental Reports', description: 'Generate reports', icon: FileText, color: 'purple' },
    { name: 'GIS Mapping', description: 'Geographic information system', icon: MapPin, color: 'red' },
    { name: 'Monitoring Schedule', description: 'Schedule monitoring activities', icon: Calendar, color: 'orange' },
    { name: 'Project Tracking', description: 'Track environmental projects', icon: TrendingUp, color: 'teal' },
    { name: 'Upload Documentation', description: 'Upload field data', icon: Upload, color: 'pink' },
    { name: 'Environmental Analytics', description: 'Analyze environmental data', icon: Activity, color: 'cyan' },
  ];

  const renderContent = () => {
    if (activeTab === 'dashboard') return renderDashboard();
    return (
      <DashboardModuleContent
        activeTab={activeTab}
        reportsTab={<EnvironmentalReportsTab />}
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
          <h2 className="text-xl font-bold text-gray-800 mb-6">Environmental Functions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {functions.map((func) => (
              <button
                key={func.name}
                onClick={() => handleDashboardFunctionClick(func.name, [], setActiveTab, setActiveModal)}
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

        {/* Active Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Active Environmental Projects</h2>
          <div className="space-y-4">
            {activeProjects.map((project, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.area}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'Ongoing' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{project.progress}% Complete</p>
              </div>
            ))}
          </div>
        </div>
    </div>
  );

  return (
    <DashboardLayout title="Environmental Management Dashboard" activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
