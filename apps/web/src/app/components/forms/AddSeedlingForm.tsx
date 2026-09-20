import { useState } from 'react';
import { toast } from 'sonner';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  formActionsClass,
  formGridClass,
  inputClass,
  labelClass,
  requiredMark,
  selectClass,
} from '../../lib/uiClasses';

const STORAGE_KEY = 'bantay_nursery_seedlings';

export interface SeedlingRecord {
  id: string;
  species: string;
  quantity: number;
  status: string;
  datePlanted: string;
  location: string;
}

function loadSeedlings(): SeedlingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SeedlingRecord[];
  } catch {
    // ignore
  }
  return [
    { id: '1', species: 'Mahogany', quantity: 500, status: 'Healthy', datePlanted: '2026-03-15', location: 'Nursery Area A' },
    { id: '2', species: 'Narra', quantity: 300, status: 'Monitoring', datePlanted: '2026-04-01', location: 'Nursery Area B' },
  ];
}

function saveSeedlings(items: SeedlingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getStoredSeedlings(): SeedlingRecord[] {
  return loadSeedlings();
}

interface AddSeedlingFormProps {
  onSaved?: () => void;
  onCancel?: () => void;
}

const emptyForm = {
  species: '',
  quantity: '',
  status: 'Healthy',
  datePlanted: '',
  location: '',
};

export function AddSeedlingForm({ onSaved, onCancel }: AddSeedlingFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.species.trim()) next.species = 'Species name is required';
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = 'Enter a valid quantity';
    if (!form.datePlanted) next.datePlanted = 'Date is required';
    if (!form.location.trim()) next.location = 'Location is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (saving) return;

    setSaving(true);
    try {
      const items = loadSeedlings();
      items.unshift({
        id: `${Date.now()}`,
        species: form.species.trim(),
        quantity: Number(form.quantity),
        status: form.status,
        datePlanted: form.datePlanted,
        location: form.location.trim(),
      });
      saveSeedlings(items);
      toast.success('Seedling record saved');
      window.dispatchEvent(new CustomEvent('bantay:seedlings-updated'));
      setForm(emptyForm);
      onSaved?.();
    } catch {
      toast.error('Failed to save seedling record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
      <div className={formGridClass}>
        <div className="min-w-0">
          <label className={labelClass}>
            Species Name<span className={requiredMark}>*</span>
          </label>
          <input
            type="text"
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            className={inputClass}
            placeholder="e.g., Mahogany"
          />
          {errors.species && <p className="text-xs text-red-600 mt-1">{errors.species}</p>}
        </div>
        <div className="min-w-0">
          <label className={labelClass}>
            Quantity<span className={requiredMark}>*</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className={inputClass}
            placeholder="Enter quantity"
          />
          {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
        </div>
        <div className="min-w-0">
          <label className={labelClass}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={selectClass}
          >
            <option>Healthy</option>
            <option>Monitoring</option>
            <option>Ready for Distribution</option>
            <option>Growing</option>
          </select>
        </div>
        <div className="min-w-0">
          <label className={labelClass}>
            Date Planted<span className={requiredMark}>*</span>
          </label>
          <input
            type="date"
            value={form.datePlanted}
            onChange={(e) => setForm({ ...form, datePlanted: e.target.value })}
            className={inputClass}
          />
          {errors.datePlanted && <p className="text-xs text-red-600 mt-1">{errors.datePlanted}</p>}
        </div>
        <div className="md:col-span-2 min-w-0">
          <label className={labelClass}>
            Location<span className={requiredMark}>*</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={inputClass}
            placeholder="Nursery location"
          />
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>
      </div>
      <div className={formActionsClass}>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondaryClass} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className={btnPrimaryClass} disabled={saving}>
          {saving ? 'Saving...' : 'Save Seedling'}
        </button>
      </div>
    </form>
  );
}
