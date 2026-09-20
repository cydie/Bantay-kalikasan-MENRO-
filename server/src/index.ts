import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { waitForDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import authRoutes from './routes/auth.js';
import inquiryRoutes from './routes/inquiries.js';
import activityRoutes from './routes/activities.js';
import employeeRoutes from './routes/employees.js';
import recordRoutes from './routes/records.js';
import statsRoutes from './routes/stats.js';
import historyRoutes from './routes/history.js';
import adminStaffRoutes from './routes/adminStaff.js';
import usersRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';
import departmentsRoutes from './routes/departments.js';
import servicesRoutes from './routes/services.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await waitForDatabase();
  await seedDatabase();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'Bantay Kalikasan MENRO API',
      database: 'PostgreSQL',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/records', recordRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/admin-staff', adminStaffRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/departments', departmentsRoutes);
  app.use('/api/services', servicesRoutes);

  const distPath = path.join(__dirname, '..', '..', 'apps', 'web', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bantay Kalikasan API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
