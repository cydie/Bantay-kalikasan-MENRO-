import { useEffect, useState } from 'react';
import { Sprout, Plus, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSeedlings, type SeedlingRecord } from '../forms/AddSeedlingForm';
import { downloadCsv } from '../../lib/reportExport';
import { btnPrimaryClass, btnSecondaryClass, statusBadgeClass, tableWrapClass } from '../../lib/uiClasses';
import { EmptyState } from '../ui/PageStates';

interface SeedlingInventoryModalProps {
  onAddNew?: () => void;
}

export function SeedlingInventoryModal({ onAddNew }: SeedlingInventoryModalProps) {
  const [seedlings, setSeedlings] = useState<SeedlingRecord[]>([]);

  useEffect(() => {
    setSeedlings(getStoredSeedlings());
  }, []);

  const refresh = () => setSeedlings(getStoredSeedlings());

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('bantay:seedlings-updated', handler);
    return () => window.removeEventListener('bantay:seedlings-updated', handler);
  }, []);

  const totalSeedlings = seedlings.reduce((sum, s) => sum + s.quantity, 0);

  const handleExport = () => {
    if (seedlings.length === 0) {
      toast.error('No seedling data to export');
      return;
    }
    downloadCsv('seedling-inventory.csv', [
      ['Species', 'Quantity', 'Status', 'Date Planted', 'Location'],
      ...seedlings.map((s) => [s.species, String(s.quantity), s.status, s.datePlanted, s.location]),
    ]);
    toast.success('Inventory exported');
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-green-600 mb-1">Total Seedlings</p>
              <p className="text-2xl font-bold text-green-800">{totalSeedlings.toLocaleString()}</p>
            </div>
            <Sprout className="w-10 h-10 text-green-600 shrink-0" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-blue-600 mb-1">Species Count</p>
              <p className="text-2xl font-bold text-blue-800">{seedlings.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600 shrink-0" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-purple-600 mb-1">Ready for Distribution</p>
              <p className="text-2xl font-bold text-purple-800">
                {seedlings.filter((s) => s.status === 'Ready' || s.status === 'Ready for Distribution').reduce((sum, s) => sum + s.quantity, 0)}
              </p>
            </div>
            <Plus className="w-10 h-10 text-purple-600 shrink-0" />
          </div>
        </div>
      </div>

      <div className={tableWrapClass}>
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Seedling Inventory List</h3>
        </div>
        {seedlings.length === 0 ? (
          <EmptyState icon={Sprout} message="Add seedlings to start tracking inventory." />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Species</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date Planted</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
              </tr>
            </thead>
            <tbody>
              {seedlings.map((seedling) => (
                <tr key={seedling.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800 cell-wrap">{seedling.species}</td>
                  <td className="py-3 px-4 text-gray-600">{seedling.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={statusBadgeClass(seedling.status)}>{seedling.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{seedling.datePlanted}</td>
                  <td className="py-3 px-4 text-gray-600 cell-wrap">{seedling.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onAddNew} className={`flex-1 ${btnPrimaryClass}`}>
          Add New Seedlings
        </button>
        <button type="button" onClick={handleExport} className={`flex-1 ${btnSecondaryClass}`}>
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  );
}
