import { getDepartmentAssignedLabel } from '../lib/departments.js';
import { isMainAdminDepartment } from './sections.js';

export function getStaffCategoryLabel(department?: string): string | null {
  if (!department || department === 'admin') return null;
  return getDepartmentAssignedLabel(department);
}

export function assertDepartmentAccess(
  userDepartment: string | undefined,
  staffRole: string | undefined,
  targetDepartment: string
): boolean {
  if (isMainAdminDepartment(userDepartment, staffRole)) return true;
  return userDepartment === targetDepartment;
}
