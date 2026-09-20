import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, staffOnly } from '../middleware/auth.js';
import { assertDepartmentAccess } from '../lib/access.js';

const router = Router();

const DEPARTMENT_LABELS: Record<string, string> = {
  nursery: 'Nursery',
  environmental: 'Environmental',
  'solid-waste': 'Solid Waste',
  landfill: 'Landfill',
  enforcement: 'Enforcement',
};

async function getMetrics(department: string): Promise<Record<string, string>> {
  const rows = await query<{ metric_key: string; metric_value: string }>(
    'SELECT metric_key, metric_value FROM department_metrics WHERE department = $1',
    [department]
  );
  return Object.fromEntries(rows.map((row) => [row.metric_key, row.metric_value]));
}

router.get('/dashboard', authMiddleware, staffOnly, async (req, res) => {
  try {
    const [empRow, pendingRow, actRow, deptRow, recentActivities] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM employees'),
      query<{ count: string }>("SELECT COUNT(*)::text AS count FROM inquiries WHERE status = 'Pending'"),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM activities'),
      query<{ count: string }>('SELECT COUNT(DISTINCT department)::text AS count FROM employees'),
      query(`SELECT user_name, action, department, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10`),
    ]);

    let departmentStats = null;
    if (req.user?.department && req.user.department !== 'admin') {
      const deptName = DEPARTMENT_LABELS[req.user.department];
      if (deptName) {
        const [deptInq, deptAct] = await Promise.all([
          query<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM inquiries WHERE assigned_to = $1 AND status NOT IN ('Resolved', 'Closed')`,
            [deptName]
          ),
          query<{ count: string }>(
            'SELECT COUNT(*)::text AS count FROM activities WHERE department = $1',
            [req.user.department]
          ),
        ]);
        departmentStats = {
          pendingInquiries: parseInt(deptInq[0]?.count || '0', 10),
          activities: parseInt(deptAct[0]?.count || '0', 10),
        };
      }
    }

    res.json({
      totalEmployees: parseInt(empRow[0]?.count || '0', 10),
      pendingInquiries: parseInt(pendingRow[0]?.count || '0', 10),
      totalActivities: parseInt(actRow[0]?.count || '0', 10),
      activeDepartments: parseInt(deptRow[0]?.count || '0', 10),
      recentActivities,
      departmentStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/department/:department', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { department } = req.params;

    if (!assertDepartmentAccess(req.user?.department, req.user?.staff_role, department)) {
      return res.status(403).json({ error: 'You can only view stats for your department' });
    }

    const metrics = await getMetrics(department);

    switch (department) {
      case 'nursery': {
        const tableItems = await query(
          `SELECT species, quantity, status, record_date AS date
           FROM seedlings ORDER BY record_date DESC`
        );
        res.json({
          stats: [
            { label: 'Total Seedlings', value: metrics.total_seedlings || '0' },
            { label: 'Distributed Plants', value: metrics.distributed_plants || '0' },
            { label: 'Survival Rate', value: metrics.survival_rate || '0%' },
            { label: 'Nursery Activities', value: metrics.nursery_activities || '0' },
          ],
          tableItems,
        });
        return;
      }

      case 'environmental': {
        const tableItems = await query(
          `SELECT name, area, status, progress FROM environmental_projects ORDER BY progress DESC`
        );
        res.json({
          stats: [
            { label: 'Active Projects', value: metrics.active_projects || '0' },
            { label: 'Protected Areas', value: metrics.protected_areas || '0' },
            { label: 'Wildlife Reports', value: metrics.wildlife_reports || '0' },
            { label: 'Monitoring Ops', value: metrics.monitoring_ops || '0' },
          ],
          tableItems,
        });
        return;
      }

      case 'solid-waste': {
        const tableItems = await query(
          `SELECT route, vehicle, status, collection_time AS time, volume
           FROM waste_collections ORDER BY collection_time ASC`
        );
        res.json({
          stats: [
            { label: 'Daily Waste (tons)', value: metrics.daily_waste_tons || '0' },
            { label: 'Collection Vehicles', value: metrics.collection_vehicles || '0' },
            { label: 'Active Routes', value: metrics.active_routes || '0' },
            { label: 'Waste Operations', value: metrics.waste_operations || '0' },
          ],
          tableItems,
        });
        return;
      }

      case 'landfill': {
        const [tableItems, capacityHistory] = await Promise.all([
          query(
            `SELECT waste_type AS type, source, weight, disposal_date AS date, status
             FROM landfill_disposals ORDER BY disposal_date DESC`
          ),
          query(
            `SELECT snapshot_month AS month, capacity_percent AS percent
             FROM landfill_capacity_snapshots ORDER BY sort_order ASC`
          ),
        ]);
        const capacityPercent = parseInt((metrics.current_capacity || '0').replace('%', ''), 10) || 0;
        res.json({
          stats: [
            { label: 'Current Capacity', value: metrics.current_capacity || '0%' },
            { label: 'Disposal Rate (daily)', value: metrics.disposal_rate || '0' },
            { label: 'Disposal Operations', value: metrics.disposal_operations || '0' },
            { label: 'Safety Status', value: metrics.safety_status || 'Good' },
          ],
          tableItems,
          capacityPercent,
          capacityHistory,
        });
        return;
      }

      case 'enforcement': {
        const tableItems = await query(
          `SELECT case_id AS "caseId", case_type AS type, location, status, priority, case_date AS date
           FROM enforcement_cases ORDER BY case_date DESC`
        );
        res.json({
          stats: [
            { label: 'Active Cases', value: metrics.active_cases || '0' },
            { label: 'Enforcement Ops', value: metrics.enforcement_ops || '0' },
            { label: 'Violations Recorded', value: metrics.violations_recorded || '0' },
            { label: 'Field Personnel', value: metrics.field_personnel || '0' },
          ],
          tableItems,
        });
        return;
      }

      default:
        res.status(404).json({ error: 'Unknown department' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
