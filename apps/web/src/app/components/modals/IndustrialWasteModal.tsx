import { useState } from 'react';
import { Factory, Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react';

interface IndustrialWaste {
  id: string;
  company: string;
  wasteType: string;
  date: string;
  weight: number;
  hazardLevel: 'Low' | 'Medium' | 'High';
  permitNumber: string;
  status: 'Pending' | 'Approved' | 'Processed';
}

export function IndustrialWasteModal() {
  const [records, setRecords] = useState<IndustrialWaste[]>([
    { id: '1', company: 'Rizal Manufacturing Corp', wasteType: 'Chemical Waste', date: '2026-05-13', weight: 5.1, hazardLevel: 'High', permitNumber: 'IWP-2026-001', status: 'Processed' },
    { id: '2', company: 'Green Factory Inc', wasteType: 'Metal Scraps', date: '2026-05-12', weight: 8.3, hazardLevel: 'Low', permitNumber: 'IWP-2026-002', status: 'Approved' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    wasteType: '',
    date: '',
    weight: 0,
    hazardLevel: 'Low' as IndustrialWaste['hazardLevel'],
    permitNumber: '',
    status: 'Pending' as IndustrialWaste['status']
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

  const handleEdit = (record: IndustrialWaste) => {
    setFormData(record);
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this industrial waste record?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ company: '', wasteType: '', date: '', weight: 0, hazardLevel: 'Low', permitNumber: '', status: 'Pending' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Industrial Waste Records</h3>
          <p className="text-sm text-gray-600">Monitor industrial waste disposal and permits</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">High Hazard</p>
          </div>
          <p className="text-2xl font-bold text-red-800">{records.filter(r => r.hazardLevel === 'High').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-2">Medium Hazard</p>
          <p className="text-2xl font-bold text-yellow-800">{records.filter(r => r.hazardLevel === 'Medium').length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-2">Low Hazard</p>
          <p className="text-2xl font-bold text-green-800">{records.filter(r => r.hazardLevel === 'Low').length}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                <input type="text" value={formData.wasteType} onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (tons)</label>
                <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hazard Level</label>
                <select value={formData.hazardLevel} onChange={(e) => setFormData({ ...formData, hazardLevel: e.target.value as IndustrialWaste['hazardLevel'] })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permit Number</label>
                <input type="text" value={formData.permitNumber} onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{editingId ? 'Update' : 'Add'} Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Company</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waste Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Weight</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hazard Level</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{record.company}</td>
                <td className="py-3 px-4 text-gray-600">{record.wasteType}</td>
                <td className="py-3 px-4 text-gray-600">{record.date}</td>
                <td className="py-3 px-4 text-gray-600">{record.weight} tons</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.hazardLevel === 'High' ? 'bg-red-100 text-red-700' :
                    record.hazardLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{record.hazardLevel}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'Processed' ? 'bg-green-100 text-green-700' :
                    record.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
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
