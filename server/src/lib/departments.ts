export interface DepartmentRecord {
  id: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export const DEPARTMENTS: DepartmentRecord[] = [
  { id: 'nursery', name: 'Nursery Department', description: 'Seedling distribution and tree planting programs', status: 'Active' },
  { id: 'solid-waste', name: 'Solid Waste Management Department', description: 'Garbage collection and waste management', status: 'Active' },
  { id: 'environmental', name: 'Environmental Management Department', description: 'Environmental protection and monitoring', status: 'Active' },
  { id: 'landfill', name: 'Landfill Management Department', description: 'Landfill operations and disposal', status: 'Active' },
  { id: 'enforcement', name: 'Enforcement Department', description: 'Environmental law enforcement', status: 'Active' },
  { id: 'admin', name: 'Main Admin', description: 'General municipal inquiries', status: 'Active' },
];

export function getDepartmentName(id: string): string {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

export function getDepartmentAssignedLabel(id: string): string {
  const map: Record<string, string> = {
    nursery: 'Nursery',
    environmental: 'Environmental',
    'solid-waste': 'Solid Waste',
    landfill: 'Landfill',
    enforcement: 'Enforcement',
    admin: 'Admin',
  };
  return map[id] ?? id;
}

export function staffDepartmentToId(department?: string): string | null {
  if (!department) return null;
  if (department === 'admin') return 'admin';
  const found = DEPARTMENTS.find((d) => d.id === department);
  return found ? found.id : null;
}
