import bcrypt from 'bcryptjs';
import { query } from './db.js';

export const STAFF_DEFAULT_PASSWORD = 'rizal2026';

export const DEPARTMENT_STAFF_ACCOUNTS = [
  {
    id: '1',
    name: 'Engr. Maria Santos',
    email: 'admin@rizal.gov',
    department: 'admin',
    staff_role: 'main_admin',
    role: 'Main Admin',
  },
  {
    id: '2',
    name: 'Roberto C. Mendoza',
    email: 'nursery@rizal.gov',
    department: 'nursery',
    staff_role: 'section_admin',
    role: 'Section Admin - Nursery',
  },
  {
    id: '3',
    name: 'Dr. Elena V. Reyes',
    email: 'environmental@rizal.gov',
    department: 'environmental',
    staff_role: 'section_admin',
    role: 'Section Admin - Environmental',
  },
  {
    id: '4',
    name: 'Carlos P. Fernandez',
    email: 'waste@rizal.gov',
    department: 'solid-waste',
    staff_role: 'section_admin',
    role: 'Section Admin - Solid Waste',
  },
  {
    id: '5',
    name: 'Juan M. Dela Cruz',
    email: 'landfill@rizal.gov',
    department: 'landfill',
    staff_role: 'section_admin',
    role: 'Section Admin - Landfill',
  },
  {
    id: '6',
    name: 'Francisco R. Valdez',
    email: 'enforcement@rizal.gov',
    department: 'enforcement',
    staff_role: 'section_admin',
    role: 'Section Admin - Enforcement',
  },
] as const;

export async function seedStaffAccounts(password = STAFF_DEFAULT_PASSWORD) {
  const passwordHash = bcrypt.hashSync(password, 10);

  for (const user of DEPARTMENT_STAFF_ACCOUNTS) {
    await query(
      `INSERT INTO staff_users (id, name, email, password_hash, department, staff_role, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         department = EXCLUDED.department,
         staff_role = EXCLUDED.staff_role,
         role = EXCLUDED.role`,
      [user.id, user.name, user.email, passwordHash, user.department, user.staff_role, user.role]
    );
  }

  await query(`UPDATE staff_users SET staff_role = 'main_admin' WHERE department = 'admin'`);
  await query(
    `UPDATE staff_users SET staff_role = 'section_admin'
     WHERE department != 'admin' AND staff_role IS DISTINCT FROM 'main_admin'`
  );
}

export function logStaffAccounts(password = STAFF_DEFAULT_PASSWORD) {
  console.log('Staff demo accounts (all departments):');
  for (const account of DEPARTMENT_STAFF_ACCOUNTS) {
    console.log(`  ${account.department.padEnd(16)} ${account.email} / ${password}`);
  }
}
