import { useState } from 'react';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

interface InstitutionalWaste {
  id: string;
  institution: string;
  type: string;
  date: string;
  weight: number;
  wasteCategory: string;
  status: 'Collected' | 'Pending' | 'Processed';
}

export function InstitutionalWasteModal() {
  const [records, setRecords] = useState<InstitutionalWaste[]>([
    { id: '1', institution: 'Rizal District Hospital', type: 'Medical Waste', date: '2026-05-13', weight: 1.5, wasteCategory: 'Hazardous', status: 'Processed' },
    { id: '2', institution: 'Municipal Schools District', type: 'Paper & Plastic', date: '2026-05-12', weight: 2.3, wasteCategory: 'Recyclable', status: 'Processed' },
    { id: '3', institution: 'Municipal Hall', type: 'Mixed Waste', date: '2026-05-11', weight: 0.8, wasteCategory: 'General', status: 'Collected' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: '',
    type: '',
    date: '',
    weight: 0,
    wasteCategory: '',
    status: 'Pending' as InstitutionalWaste['status']
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

  const handleEdit = (record: InstitutionalWaste) => {
    setFormData(record);
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this institutional waste record?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ institution: '', type: '', date: '', weight: 0, wasteCategory: '', status: 'Pending' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Institutional Waste Records</h3>
          <p className="text-sm text-gray-600">Track waste from schools, hospitals, and government offices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                <input type="text" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type</label>
                <input type="text" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Category</label>
                <select value={formData.wasteCategory} onChange={(e) => setFormData({ ...formData, wasteCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required>
                  <option value="">Select Category</option>
                  <option>General</option>
                  <option>Recyclable</option>
                  <option>Hazardous</option>
                  <option>Medical Waste</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as InstitutionalWaste['status'] })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Collected">Collected</option>
                  <option value="Processed">Processed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{editingId ? 'Update' : 'Add'} Record</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Institution</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Waste Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Weight</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{record.institution}</td>
                <td className="py-3 px-4 text-gray-600">{record.type}</td>
                <td className="py-3 px-4 text-gray-600">{record.date}</td>
                <td className="py-3 px-4 text-gray-600">{record.weight} tons</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.wasteCategory === 'Hazardous' || record.wasteCategory === 'Medical Waste' ? 'bg-red-100 text-red-700' :
                    record.wasteCategory === 'Recyclable' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{record.wasteCategory}</span>
                </td>
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
