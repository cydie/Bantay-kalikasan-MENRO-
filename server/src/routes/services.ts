import { Router } from 'express';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { staffDepartmentToId } from '../lib/departments.js';
import { isMainAdminDepartment } from '../lib/sections.js';

const router = Router();

function mapService(row: Record<string, unknown>) {
  return {
    id: row.id,
    department_id: row.department_id,
    department_name: row.department_name,
    service_name: row.service_name,
    description: row.description,
    requirements: row.requirements,
    processing_time: row.processing_time,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    section: row.department_id,
    section_name: row.department_name,
    title: row.service_name,
    inquiry_category: row.department_name,
  };
}

const baseSelect = `
  SELECT ds.*, d.name AS department_name
  FROM department_services ds
  JOIN departments d ON d.id = ds.department_id
`;

router.get('/', async (req, res) => {
  try {
    const { department_id } = req.query;
    let sql = `${baseSelect} WHERE ds.status = 'Active'`;
    const params: unknown[] = [];

    if (department_id) {
      sql += ` AND ds.department_id = $1`;
      params.push(department_id);
    }

    sql += ' ORDER BY d.name ASC, ds.service_name ASC';
    const rows = await query(sql, params);
    res.json(rows.map(mapService));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manage', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { department_id, status, search } = req.query;
    let sql = `${baseSelect} WHERE 1=1`;
    const params: unknown[] = [];
    let i = 1;

    const isAdmin = isMainAdminDepartment(req.user?.department, req.user?.staff_role);

    if (!isAdmin) {
      const deptId = staffDepartmentToId(req.user?.department);
      if (!deptId) return res.status(403).json({ error: 'Department not found' });
      sql += ` AND ds.department_id = $${i++}`;
      params.push(deptId);
    } else if (department_id && department_id !== 'all') {
      sql += ` AND ds.department_id = $${i++}`;
      params.push(department_id);
    }

    if (status && status !== 'all') {
      sql += ` AND ds.status = $${i++}`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (ds.service_name ILIKE $${i} OR ds.description ILIKE $${i} OR d.name ILIKE $${i})`;
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY d.name ASC, ds.service_name ASC';
    const rows = await query(sql, params);
    res.json(rows.map(mapService));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { department_id, service_name, description, requirements, processing_time, status } = req.body;
    if (!department_id || !service_name || !description) {
      return res.status(400).json({ error: 'Department, service name, and description are required' });
    }

    const isAdmin = isMainAdminDepartment(req.user?.department, req.user?.staff_role);
    const userDept = staffDepartmentToId(req.user?.department);
    if (!isAdmin && userDept !== department_id) {
      return res.status(403).json({ error: 'You can only manage services for your department' });
    }

    const staff = await queryOne<{ name: string }>('SELECT name FROM staff_users WHERE id = $1', [req.user!.id]);
    const id = generateId();

    await query(
      `INSERT INTO department_services
        (id, department_id, service_name, description, requirements, processing_time, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        department_id,
        service_name,
        description,
        requirements || null,
        processing_time || null,
        status || 'Active',
        staff?.name || 'Staff',
      ]
    );

    const row = await queryOne(`${baseSelect} WHERE ds.id = $1`, [id]);
    res.status(201).json(mapService(row!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const existing = await queryOne<{ department_id: string }>(
      'SELECT department_id FROM department_services WHERE id = $1',
      [req.params.id]
    );
    if (!existing) return res.status(404).json({ error: 'Service not found' });

    const isAdmin = isMainAdminDepartment(req.user?.department, req.user?.staff_role);
    const userDept = staffDepartmentToId(req.user?.department);
    if (!isAdmin && userDept !== existing.department_id) {
      return res.status(403).json({ error: 'You can only manage services for your department' });
    }

    const { service_name, description, requirements, processing_time, status } = req.body;
    await query(
      `UPDATE department_services SET
        service_name = COALESCE($1, service_name),
        description = COALESCE($2, description),
        requirements = COALESCE($3, requirements),
        processing_time = COALESCE($4, processing_time),
        status = COALESCE($5, status),
        updated_at = NOW()
       WHERE id = $6`,
      [service_name, description, requirements, processing_time, status, req.params.id]
    );

    const row = await queryOne(`${baseSelect} WHERE ds.id = $1`, [req.params.id]);
    res.json(mapService(row!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, staffOnly, async (req, res) => {
  try {
    const existing = await queryOne<{ department_id: string }>(
      'SELECT department_id FROM department_services WHERE id = $1',
      [req.params.id]
    );
    if (!existing) return res.status(404).json({ error: 'Service not found' });

    const isAdmin = isMainAdminDepartment(req.user?.department, req.user?.staff_role);
    const userDept = staffDepartmentToId(req.user?.department);
    if (!isAdmin && userDept !== existing.department_id) {
      return res.status(403).json({ error: 'You can only manage services for your department' });
    }

    await query('DELETE FROM department_services WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
