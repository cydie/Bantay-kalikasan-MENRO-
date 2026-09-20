import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, mainAdminOnly } from '../middleware/auth.js';
import { getSectionLabel } from '../lib/sections.js';
import { logHistory } from '../lib/history.js';

const router = Router();

function mapAccount(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department,
    staff_role: row.staff_role,
    role: row.role,
    section_label: getSectionLabel(String(row.department)),
  };
}

router.get('/', authMiddleware, mainAdminOnly, async (_req, res) => {
  try {
    const rows = await query('SELECT id, name, email, department, staff_role, role FROM staff_users ORDER BY staff_role DESC, department ASC');
    res.json(rows.map(mapAccount));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, mainAdminOnly, async (req, res) => {
  try {
    const { name, email, password, department, staff_role, role } = req.body;
    if (!name || !email || !department || !staff_role || !role) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (staff_role === 'section_admin') {
      const existing = await queryOne(
        `SELECT id FROM staff_users WHERE staff_role = 'section_admin' AND department = $1`,
        [department]
      );
      if (existing) {
        return res.status(409).json({ error: 'This section already has a Section Admin assigned' });
      }
    }

    if (staff_role === 'main_admin') {
      const existingMain = await queryOne(`SELECT id FROM staff_users WHERE staff_role = 'main_admin'`);
      if (existingMain) {
        return res.status(409).json({ error: 'A Main Admin account already exists' });
      }
    }

    const id = generateId();
    const passwordHash = bcrypt.hashSync(password || 'rizal2026', 10);
    const finalDepartment = staff_role === 'main_admin' ? 'admin' : department;

    await query(
      `INSERT INTO staff_users (id, name, email, password_hash, department, staff_role, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, email, passwordHash, finalDepartment, staff_role, role]
    );

    await logHistory({
      title: 'Admin account created',
      description: `${name} assigned as ${staff_role === 'main_admin' ? 'Main Admin' : 'Section Admin'} for ${getSectionLabel(finalDepartment)}`,
      activity_type: 'Admin Action',
      section: finalDepartment,
      performed_by: 'Main Admin',
    });

    const created = await queryOne('SELECT id, name, email, department, staff_role, role FROM staff_users WHERE id = $1', [id]);
    res.status(201).json(mapAccount(created!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, mainAdminOnly, async (req, res) => {
  try {
    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM staff_users WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Account not found' });

    const { name, email, password, department, staff_role, role } = req.body;
    const finalRole = staff_role ?? existing.staff_role;
    const finalDepartment = finalRole === 'main_admin' ? 'admin' : (department ?? existing.department);

    if (finalRole === 'section_admin') {
      const conflict = await queryOne(
        `SELECT id FROM staff_users WHERE staff_role = 'section_admin' AND department = $1 AND id != $2`,
        [finalDepartment, req.params.id]
      );
      if (conflict) {
        return res.status(409).json({ error: 'This section already has a Section Admin assigned' });
      }
    }

    await query(
      `UPDATE staff_users SET name=$1, email=$2, department=$3, staff_role=$4, role=$5 WHERE id=$6`,
      [name ?? existing.name, email ?? existing.email, finalDepartment, finalRole, role ?? existing.role, req.params.id]
    );

    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      await query('UPDATE staff_users SET password_hash=$1 WHERE id=$2', [passwordHash, req.params.id]);
    }

    const updated = await queryOne('SELECT id, name, email, department, staff_role, role FROM staff_users WHERE id = $1', [req.params.id]);
    res.json(mapAccount(updated!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, mainAdminOnly, async (req, res) => {
  try {
    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM staff_users WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Account not found' });
    if (existing.staff_role === 'main_admin') {
      return res.status(400).json({ error: 'Cannot delete the Main Admin account' });
    }

    await query('DELETE FROM staff_users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
