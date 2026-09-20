import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, mainAdminOnly } from '../middleware/auth.js';
import { getSectionLabel } from '../lib/sections.js';

const router = Router();

router.get('/', authMiddleware, mainAdminOnly, async (_req, res) => {
  try {
    const staffRows = await query<Record<string, unknown>>(
      'SELECT id, name, email, department, staff_role, role FROM staff_users ORDER BY name ASC'
    );
    const citizenRows = await query<Record<string, unknown>>(
      'SELECT id, name, email, phone, created_at FROM citizens ORDER BY name ASC'
    );

    const staffAccounts = staffRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      account_type: 'staff' as const,
      department: row.department,
      staff_role: row.staff_role,
      role: row.role,
      section_label: getSectionLabel(String(row.department)),
    }));

    const citizenAccounts = citizenRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      account_type: 'citizen' as const,
      phone: row.phone || '',
      section_label: 'Citizen',
      created_at: row.created_at,
    }));

    res.json([...staffAccounts, ...citizenAccounts]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
