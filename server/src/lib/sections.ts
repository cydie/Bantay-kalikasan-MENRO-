export const SECTION_LABELS: Record<string, string> = {
  admin: 'Main Admin',
  nursery: 'Nursery',
  environmental: 'Environmental Management',
  'solid-waste': 'Solid Waste Management',
  landfill: 'Landfill Management',
  enforcement: 'Enforcement',
};

export function getSectionLabel(section: string) {
  return SECTION_LABELS[section] || section;
}

export function isMainAdminDepartment(department?: string, staffRole?: string) {
  return staffRole === 'main_admin' || department === 'admin';
}
