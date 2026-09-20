import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { api, Department, SectionService } from '../../lib/api';
import { canAccessAdminStaff } from '../../lib/permissions';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';

interface DepartmentServicesTabProps {
  isAdminView?: boolean;
}

const emptyForm = {
  department_id: '',
  service_name: '',
  description: '',
  requirements: '',
  processing_time: '',
  status: 'Active' as 'Active' | 'Inactive',
};

export function DepartmentServicesTab({ isAdminView = false }: DepartmentServicesTabProps) {
  const { user } = useAuth();
  const isAdmin = isAdminView || canAccessAdminStaff(user);
  const { refreshKey } = useDataRefresh();

  const [services, setServices] = useState<SectionService[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useReloadTracker(loading);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (deptFilter !== 'all') params.department_id = deptFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const [serviceRows, deptRows] = await Promise.all([
        api.services.manage(params),
        isAdmin ? api.departments.list() : Promise.resolve([]),
      ]);
      setServices(serviceRows);
      setDepartments(deptRows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, deptFilter, statusFilter, user?.department, refreshKey]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      department_id: isAdmin ? '' : user?.department || '',
    });
    setShowForm(true);
  };

  const openEdit = (service: SectionService) => {
    setEditingId(service.id);
    setForm({
      department_id: service.department_id,
      service_name: service.service_name,
      description: service.description,
      requirements: service.requirements || '',
      processing_time: service.processing_time || '',
      status: service.status,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.services.update(editingId, form);
        toast.success('Service updated successfully');
      } else {
        await api.services.create(form);
        toast.success('Service created successfully');
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service offer?')) return;
    try {
      await api.services.delete(id);
      toast.success('Service deleted');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  const toggleStatus = async (service: SectionService) => {
    try {
      const next = service.status === 'Active' ? 'Inactive' : 'Active';
      await api.services.update(service.id, { status: next });
      toast.success(`Service marked as ${next}`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Services Offered</h2>
          <p className="text-sm text-gray-600">
            {isAdmin
              ? 'Monitor and manage services from all departments.'
              : 'Manage the services your department offers to citizens.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        {isAdmin && (
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <article key={service.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800">{service.service_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${service.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {service.status}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 font-medium mb-1">{service.department_name}</p>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  {service.requirements && <p className="text-xs text-gray-500 mb-1"><strong>Requirements:</strong> {service.requirements}</p>}
                  {service.processing_time && <p className="text-xs text-gray-500"><strong>Processing time:</strong> {service.processing_time}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggleStatus(service)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">
                    {service.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => openEdit(service)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(service.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {services.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
              No services found. Add your first service offer.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Service' : 'Add Service'}</h3>
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  required
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input required value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processing Time</label>
              <input value={form.processing_time} onChange={(e) => setForm({ ...form, processing_time: e.target.value })} placeholder="e.g. 3-5 working days" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })} className="w-full px-3 py-2 border rounded-lg">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
