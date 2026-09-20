import { Router } from 'express';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { logHistory } from '../lib/history.js';

async function getStaffName(userId: string) {
  const staff = await queryOne<{ name: string }>('SELECT name FROM staff_users WHERE id = $1', [userId]);
  return staff?.name || 'Staff';
}

const router = Router();

router.get('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { department } = req.query;
    let sql = 'SELECT * FROM activities';
    const params: unknown[] = [];

    if (department && department !== 'all') {
      sql += ' WHERE department = $1';
      params.push(department);
    } else if (req.user?.department && req.user.department !== 'admin') {
      sql += ' WHERE department = $1';
      params.push(req.user.department);
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
    const { title, description, date, location, status, participants, department } = req.body;
    if (!title || !description || !date || !location) {
      return res.status(400).json({ error: 'Title, description, date, and location are required' });
    }

    const id = generateId();
    const dept = department || req.user?.department || 'admin';

    await query(
      `INSERT INTO activities (id, title, description, date, location, status, participants, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, title, description, date, location, status || 'Scheduled', participants || 0, dept]
    );

    const activity = await queryOne('SELECT * FROM activities WHERE id = $1', [id]);
    const staffName = await getStaffName(req.user!.id);
    await logHistory({
      title: `Activity created: ${title}`,
      description: description,
      activity_type: 'Activity Created',
      section: dept,
      status: status || 'Scheduled',
      performed_by: staffName,
    });
    res.status(201).json(activity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const existing = await queryOne<Record<string, unknown>>('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Activity not found' });

    const { title, description, date, location, status, participants, department } = req.body;

    await query(
      `UPDATE activities SET title=$1, description=$2, date=$3, location=$4, status=$5, participants=$6, department=$7 WHERE id=$8`,
      [
        title ?? existing.title, description ?? existing.description, date ?? existing.date,
        location ?? existing.location, status ?? existing.status, participants ?? existing.participants,
        department ?? existing.department, req.params.id,
      ]
    );

    const updated = await queryOne('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    const staffName = await getStaffName(req.user!.id);
    const newStatus = status ?? existing.status;
    await logHistory({
      title: newStatus === 'Completed' ? `Activity completed: ${updated?.title}` : `Activity updated: ${updated?.title}`,
      description: String(updated?.description || existing.description),
      activity_type: newStatus === 'Completed' ? 'Activity Completed' : 'Activity Update',
      section: String(updated?.department || existing.department),
      status: String(newStatus),
      performed_by: staffName,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const result = await query('DELETE FROM activities WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ error: 'Activity not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
