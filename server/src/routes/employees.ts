import { Router } from 'express';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { assertDepartmentAccess } from '../lib/access.js';

const router = Router();

router.get('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { department, search } = req.query;
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params: unknown[] = [];
    let i = 1;

    if (department && department !== 'all') {
      sql += ` AND department = $${i++}`;
      params.push(department);
    }

    if (req.user?.department && req.user.department !== 'admin') {
      sql += ` AND department = $${i++}`;
      params.push(req.user.department);
    }
    if (search) {
      const term = `%${search}%`;
      sql += ` AND (name ILIKE $${i} OR email ILIKE $${i + 1} OR position ILIKE $${i + 2})`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY name ASC';
    res.json(await query(sql, params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { name, email, position, phone, department, status, dateHired } = req.body;
    if (!name || !email || !position || !department || !dateHired) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!assertDepartmentAccess(req.user?.department, req.user?.staff_role, department)) {
      return res.status(403).json({ error: 'You can only manage employees in your department' });
    }

    const id = generateId();
    await query(
      `INSERT INTO employees (id, name, email, position, phone, department, status, date_hired)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, email, position, phone || '', department, status || 'Active', dateHired]
    );

    res.status(201).json(await queryOne('SELECT * FROM employees WHERE id = $1', [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Employee not found' });

    const { name, email, position, phone, department, status, dateHired } = req.body;
    await query(
      `UPDATE employees SET name=$1, email=$2, position=$3, phone=$4, department=$5, status=$6, date_hired=$7 WHERE id=$8`,
      [name ?? existing.name, email ?? existing.email, position ?? existing.position, phone ?? existing.phone,
       department ?? existing.department, status ?? existing.status, dateHired ?? existing.date_hired, req.params.id]
    );

    res.json(await queryOne('SELECT * FROM employees WHERE id = $1', [req.params.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
