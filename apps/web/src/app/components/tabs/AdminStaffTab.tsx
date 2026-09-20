import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { api, AdminStaffAccount } from '../../lib/api';
import { SECTIONS } from '../../config/sections';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';

export function AdminStaffTab() {
  const { refreshKey } = useDataRefresh();
  const [accounts, setAccounts] = useState<AdminStaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'admin',
    staff_role: 'section_admin' as 'main_admin' | 'section_admin',
    role: '',
  });

  useReloadTracker(loading);

  const loadAccounts = () => {
    setLoading(true);
    api.adminStaff.list()
      .then(setAccounts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, [refreshKey]);

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.adminStaff.update(editingId, {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          staff_role: formData.staff_role,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        });
      } else {
        await api.adminStaff.create({
          name: formData.name,
          email: formData.email,
          password: formData.password || 'rizal2026',
          department: formData.department,
          staff_role: formData.staff_role,
          role: formData.role,
        });
      }
      resetForm();
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this admin account?')) return;
    try {
      await api.adminStaff.delete(id);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', department: 'admin', staff_role: 'section_admin', role: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (account: AdminStaffAccount) => {
    setFormData({
      name: account.name,
      email: account.email,
      password: '',
      department: account.department,
      staff_role: account.staff_role,
      role: account.role,
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Staff</h2>
          <p className="text-gray-600 mt-1">
            Manage one Main Admin and one Section Admin per section. Section Admins can only access their assigned section.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Only the Main Admin has full system access. Each section may have exactly one Section Admin account assigned.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Admin Account' : 'New Admin Account'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-4 py-2 border rounded-lg" />
            <input required type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="px-4 py-2 border rounded-lg" />
            <input type="password" placeholder={editingId ? 'New password (optional)' : 'Password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="px-4 py-2 border rounded-lg" />
            <input required placeholder="Role title" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="px-4 py-2 border rounded-lg" />
            <select value={formData.staff_role} onChange={(e) => setFormData({ ...formData, staff_role: e.target.value as 'main_admin' | 'section_admin', department: e.target.value === 'main_admin' ? 'admin' : formData.department })} className="px-4 py-2 border rounded-lg">
              <option value="main_admin">Main Admin</option>
              <option value="section_admin">Section Admin</option>
            </select>
            <select
              value={formData.department}
              disabled={formData.staff_role === 'main_admin'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="px-4 py-2 border rounded-lg disabled:bg-gray-100"
            >
              <option value="admin">Main Admin (All Sections)</option>
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search admin accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden table-scroll">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Access Level</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Section</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account.id} className="border-t border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{account.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{account.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.staff_role === 'main_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {account.staff_role === 'main_admin' ? 'Main Admin' : 'Section Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{account.section_label}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      {account.staff_role !== 'main_admin' && (
                        <button onClick={() => handleDelete(account.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
