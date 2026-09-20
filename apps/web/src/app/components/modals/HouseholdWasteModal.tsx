import { useState } from 'react';
import { Home, Plus, Edit, Trash2, Search } from 'lucide-react';

interface HouseholdWaste {
  id: string;
  barangay: string;
  date: string;
  weight: number;
  wasteType: string;
  collectionTruck: string;
  status: 'Collected' | 'Pending' | 'Processed';
}

export function HouseholdWasteModal() {
  const [records, setRecords] = useState<HouseholdWaste[]>([
    { id: '1', barangay: 'Barangay 1-5', date: '2026-05-13', weight: 3.2, wasteType: 'Mixed', collectionTruck: 'Truck #01', status: 'Processed' },
    { id: '2', barangay: 'Barangay 6-10', date: '2026-05-13', weight: 2.8, wasteType: 'Mixed', collectionTruck: 'Truck #02', status: 'Collected' },
    { id: '3', barangay: 'Barangay 11-15', date: '2026-05-12', weight: 3.5, wasteType: 'Biodegradable', collectionTruck: 'Truck #03', status: 'Processed' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    barangay: '',
    date: '',
    weight: 0,
    wasteType: '',
    collectionTruck: '',
    status: 'Pending' as HouseholdWaste['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setRecords(records.map(r => r.id === editingId ? { ...formData, id: editingId } : r));
    } else {
      setRecords([...records, { ...formData, id: Date.now().toString() }]);
    }
    resetForm();
  };

  const handleEdit = (record: HouseholdWaste) => {
    setFormData(record);
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this household waste record?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ barangay: '', date: '', weight: 0, wasteType: '', collectionTruck: '', status: 'Pending' });
    setEditingId(null);
    setShowForm(false);
  };

  const totalWeight = records.reduce((sum, r) => sum + r.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Household Waste Records</h3>
          <p className="text-sm text-gray-600">Track residential waste collection data</p>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          <p className="text-sm text-green-600">Total Weight</p>
          <p className="text-2xl font-bold text-green-800">{totalWeight.toFixed(1)} tons</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search barangay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (tons)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                <select
                  value={formData.wasteType}
                  onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                >
                  <option value="">Select Type</option>
                  <option>Mixed</option>
                  <option>Biodegradable</option>
                  <option>Non-Biodegradable</option>
                  <option>Recyclable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Truck</label>
                <input
                  type="text"
                  value={formData.collectionTruck}
                  onChange={(e) => setFormData({ ...formData, collectionTruck: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as HouseholdWaste['status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Collected">Collected</option>
                  <option value="Processed">Processed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingId ? 'Update' : 'Add'} Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Barangay</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Weight (tons)</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waste Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Truck</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.filter(r => r.barangay.toLowerCase().includes(searchTerm.toLowerCase())).map((record) => (
              <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{record.barangay}</td>
                <td className="py-3 px-4 text-gray-600">{record.date}</td>
                <td className="py-3 px-4 text-gray-600">{record.weight} tons</td>
                <td className="py-3 px-4 text-gray-600">{record.wasteType}</td>
                <td className="py-3 px-4 text-gray-600">{record.collectionTruck}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'Processed' ? 'bg-green-100 text-green-700' :
                    record.status === 'Collected' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{record.status}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
