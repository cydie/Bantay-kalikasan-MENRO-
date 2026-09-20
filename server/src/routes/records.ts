import { Router } from 'express';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { assertDepartmentAccess, getStaffCategoryLabel } from '../lib/access.js';

const router = Router();

router.get('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM records WHERE 1=1';
    const params: unknown[] = [];
    let i = 1;

    if (category && category !== 'All' && category !== 'all') {
      sql += ` AND category = $${i++}`;
      params.push(category);
    }

    const staffCategory = getStaffCategoryLabel(req.user?.department);
    if (staffCategory) {
      sql += ` AND category = $${i++}`;
      params.push(staffCategory);
    }
    if (search) {
      const term = `%${search}%`;
      sql += ` AND (title ILIKE $${i} OR description ILIKE $${i + 1} OR record_type ILIKE $${i + 2})`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY date DESC';
    res.json(await query(sql, params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { recordType, title, description, date, category, status, createdBy } = req.body;
    if (!recordType || !title || !description || !date || !category) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const id = generateId();
    await query(
      `INSERT INTO records (id, record_type, title, description, date, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, recordType, title, description, date, category, status || 'Active', createdBy || 'System']
    );

    res.status(201).json(await queryOne('SELECT * FROM records WHERE id = $1', [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM records WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    const { recordType, title, description, date, category, status, createdBy } = req.body;
    await query(
      `UPDATE records SET record_type=$1, title=$2, description=$3, date=$4, category=$5, status=$6, created_by=$7 WHERE id=$8`,
      [recordType ?? existing.record_type, title ?? existing.title, description ?? existing.description,
       date ?? existing.date, category ?? existing.category, status ?? existing.status,
       createdBy ?? existing.created_by, req.params.id]
    );

    res.json(await queryOne('SELECT * FROM records WHERE id = $1', [req.params.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const result = await query('DELETE FROM records WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
