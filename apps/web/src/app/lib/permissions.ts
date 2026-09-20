import { StaffUser } from './api';

export function isMainAdmin(user: StaffUser | null | undefined) {
  return user?.staff_role === 'main_admin' || user?.department === 'admin';
}

export function isSectionAdmin(user: StaffUser | null | undefined) {
  return user?.staff_role === 'section_admin';
}

export function canAccessAdminStaff(user: StaffUser | null | undefined) {
  return isMainAdmin(user);
}

export function canAccessUsers(user: StaffUser | null | undefined) {
  return isMainAdmin(user);
}

export function canAccessSyncMonitoring(user: StaffUser | null | undefined) {
  return isMainAdmin(user);
}

export function canAccessSection(user: StaffUser | null | undefined, sectionId: string) {
  if (!user) return false;
  if (isMainAdmin(user)) return true;
  return user.department === sectionId;
}

export function getRoleBadge(user: StaffUser | null | undefined) {
  if (!user) return '';
  if (isMainAdmin(user)) return 'Main Admin';
  if (isSectionAdmin(user)) return 'Section Admin';
  return user.role;
}
