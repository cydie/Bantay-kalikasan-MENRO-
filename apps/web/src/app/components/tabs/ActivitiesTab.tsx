import { useState, useEffect } from 'react';
import { Activity, Plus, Edit, Trash2, Calendar, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, Activity as ActivityItem } from '../../lib/api';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  cardClass,
  formActionsClass,
  formGridClass,
  inputClass,
  labelClass,
  pageHeaderClass,
  pageSubtitleClass,
  pageTitleClass,
  requiredMark,
  selectClass,
  statusBadgeClass,
  textareaClass,
} from '../../lib/uiClasses';
import { EmptyState, LoadingState } from '../ui/PageStates';

const emptyForm = {
  title: '',
  description: '',
  date: '',
  location: '',
  status: 'Scheduled' as ActivityItem['status'],
  participants: 0,
};

export function ActivitiesTab() {
  const { refreshKey } = useDataRefresh();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useReloadTracker(loading);

  useEffect(() => {
    setLoading(true);
    api.activities
      .list()
      .then(setActivities)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load activities'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.activities.update(editingId, formData);
        setActivities(activities.map((a) => (a.id === editingId ? updated : a)));
        toast.success('Activity updated');
      } else {
        const created = await api.activities.create(formData);
        setActivities([created, ...activities]);
        toast.success('Activity created');
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (activity: ActivityItem) => {
    setFormData({
      title: activity.title,
      description: activity.description,
      date: activity.date,
      location: activity.location,
      status: activity.status,
      participants: activity.participants,
    });
    setEditingId(activity.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await api.activities.delete(id);
      setActivities(activities.filter((a) => a.id !== id));
      toast.success('Activity deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className={pageHeaderClass}>
        <div className="min-w-0">
          <h2 className={pageTitleClass}>Activities Management</h2>
          <p className={pageSubtitleClass}>Manage and track all environmental activities</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className={btnPrimaryClass}>
          <Plus className="w-5 h-5" />
          New Activity
        </button>
      </div>

      {showForm && (
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Activity' : 'Create New Activity'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
            <div className={formGridClass}>
              <div className="min-w-0">
                <label className={labelClass}>
                  Activity Title<span className={requiredMark}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className={labelClass}>
                  Date<span className={requiredMark}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className={labelClass}>
                  Location<span className={requiredMark}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className={labelClass}>
                  Expected Participants<span className={requiredMark}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.participants}
                  onChange={(e) =>
                    setFormData({ ...formData, participants: parseInt(e.target.value, 10) || 0 })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className={labelClass}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ActivityItem['status'] })
                  }
                  className={selectClass}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-2 min-w-0">
                <label className={labelClass}>
                  Description<span className={requiredMark}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={textareaClass}
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className={formActionsClass}>
              <button type="button" onClick={resetForm} className={btnSecondaryClass} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={btnPrimaryClass} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Activity' : 'Create Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 min-w-0">
        {loading ? (
          <LoadingState label="Loading activities..." />
        ) : activities.length === 0 ? (
          <div className={cardClass}>
            <EmptyState
              icon={Activity}
              title="No activities found"
              message="Create your first activity to start tracking environmental programs."
            />
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className={`${cardClass} hover:shadow-md transition-shadow min-w-0`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 break-words">{activity.title}</h3>
                    <span className={statusBadgeClass(activity.status)}>{activity.status}</span>
                  </div>
                  <p className="text-gray-600 mb-3 break-words">{activity.description}</p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1 min-w-0">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="truncate">{activity.date}</span>
                    </span>
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="break-words">{activity.location}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4 shrink-0" />
                      {activity.participants} participants
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(activity)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="Edit activity"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activity.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
