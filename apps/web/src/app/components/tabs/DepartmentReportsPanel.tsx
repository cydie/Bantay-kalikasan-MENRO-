import { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { downloadCsv } from '../../lib/reportExport';
import { getSectionLabel } from '../../config/sections';

interface DepartmentReportsPanelProps {
  title: string;
  department?: string;
  isAdmin?: boolean;
}

const reportTypes = [
  { id: 'monthly', name: 'Monthly Report', icon: Calendar },
  { id: 'quarterly', name: 'Quarterly Report', icon: BarChart3 },
  { id: 'annual', name: 'Annual Report', icon: FileText },
];

export function DepartmentReportsPanel({ title, department, isAdmin = false }: DepartmentReportsPanelProps) {
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDepartment, setSelectedDepartment] = useState(department || 'all');
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<Array<{ name: string; date: string; size: string }>>([]);

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'nursery', label: 'Nursery' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'solid-waste', label: 'Solid Waste' },
    { value: 'landfill', label: 'Landfill' },
    { value: 'enforcement', label: 'Enforcement' },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const dept = isAdmin ? selectedDepartment : department;
      const rows: string[][] = [['Section', 'Metric', 'Value']];

      if (isAdmin || dept === 'all') {
        const stats = await api.stats.dashboard();
        rows.push(['Organization', 'Total Employees', String(stats.totalEmployees)]);
        rows.push(['Organization', 'Pending Inquiries', String(stats.pendingInquiries)]);
        rows.push(['Organization', 'Total Activities', String(stats.totalActivities)]);
        rows.push(['Organization', 'Active Departments', String(stats.activeDepartments)]);
        stats.recentActivities.forEach((entry) => {
          rows.push(['Activity Log', entry.action, `${entry.user_name} (${entry.department})`]);
        });
      }

      if (dept && dept !== 'all') {
        const data = await api.stats.department(dept);
        data.stats.forEach((stat) => rows.push([getSectionLabel(dept), stat.label, stat.value]));
        data.tableItems.forEach((item, index) => {
          rows.push([getSectionLabel(dept), `Row ${index + 1}`, JSON.stringify(item)]);
        });
      }

      const inquiries = await api.inquiries.list();
      inquiries.slice(0, 50).forEach((inq) => {
        rows.push(['Inquiry', inq.ticket_number, `${inq.subject} — ${inq.status}`]);
      });

      const filename = `menro-${dept || 'all'}-${reportType}-${selectedMonth}.csv`;
      downloadCsv(filename, rows);

      const entry = {
        name: `${reportTypes.find((t) => t.id === reportType)?.name} — ${selectedMonth}`,
        date: new Date().toLocaleDateString(),
        size: `${rows.length} rows`,
      };
      setRecentReports((prev) => [entry, ...prev].slice(0, 8));
      toast.success('Report generated and downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 mt-1">Generate and download reports from live system data (CSV)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setReportType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === type.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <type.icon className={`w-8 h-8 mx-auto mb-2 ${reportType === type.id ? 'text-green-600' : 'text-gray-400'}`} />
              <p className="font-medium text-gray-800">{type.name}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                {departments.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          {generating ? 'Generating...' : 'Generate & Download Report'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Reports (this session)</h3>
        </div>
        {recentReports.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 text-sm">No reports generated yet in this session.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentReports.map((report, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{report.name}</p>
                      <p className="text-sm text-gray-500">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-700 font-medium shrink-0">Downloaded</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
