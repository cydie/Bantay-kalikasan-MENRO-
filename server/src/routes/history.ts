import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { getSectionLabel, isMainAdminDepartment } from '../lib/sections.js';

const router = Router();

router.get('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { section, activity_type, status, date, search } = req.query;
    let sql = 'SELECT * FROM history_logs WHERE 1=1';
    const params: unknown[] = [];
    let i = 1;

    if (!isMainAdminDepartment(req.user?.department, req.user?.staff_role) && req.user?.department) {
      sql += ` AND section = $${i++}`;
      params.push(req.user.department);
    } else if (section && section !== 'all') {
      sql += ` AND section = $${i++}`;
      params.push(section);
    }

    if (activity_type && activity_type !== 'all') {
      sql += ` AND activity_type = $${i++}`;
      params.push(activity_type);
    }
    if (status && status !== 'all') {
      sql += ` AND status = $${i++}`;
      params.push(status);
    }
    if (date) {
      sql += ` AND event_date = $${i++}`;
      params.push(date);
    }
    if (search) {
      sql += ` AND (title ILIKE $${i} OR description ILIKE $${i + 1} OR performed_by ILIKE $${i + 2})`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY event_date DESC, created_at DESC';
    const rows = await query(sql, params);
    res.json(
      rows.map((row) => ({
        ...row,
        section_label: getSectionLabel(String(row.section)),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
