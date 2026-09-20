import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { generateId, query, queryOne } from '../db.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      department: string;
      staff_role: 'main_admin' | 'section_admin';
      role: string;
    }>('SELECT * FROM staff_users WHERE email = $1', [email]);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

  const token = signToken({ id: user.id, type: 'staff', email: user.email, department: user.department, staff_role: user.staff_role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      staff_role: user.staff_role,
      role: user.role,
    },
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/citizen/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await queryOne('SELECT id FROM citizens WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const id = generateId();
    const passwordHash = bcrypt.hashSync(password, 10);

    await query(
      `INSERT INTO citizens (id, name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5)`,
      [id, name, email, passwordHash, phone || '']
    );

    const token = signToken({ id, type: 'citizen', email });
    res.status(201).json({ token, user: { id, name, email, phone: phone || '' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/citizen/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      phone: string;
    }>('SELECT * FROM citizens WHERE email = $1', [email]);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, type: 'citizen', email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user?.type === 'staff') {
      const user = await queryOne(
        'SELECT id, name, email, department, staff_role, role FROM staff_users WHERE id = $1',
        [req.user.id]
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ type: 'staff', user });
    }

    if (req.user?.type === 'citizen') {
      const user = await queryOne(
        'SELECT id, name, email, phone FROM citizens WHERE id = $1',
        [req.user.id]
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ type: 'citizen', user });
    }

    res.status(401).json({ error: 'Invalid session' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
