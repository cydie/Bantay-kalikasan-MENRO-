import { generateId, query, queryOne } from './db.js';

async function tableEmpty(table: string): Promise<boolean> {
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${table}`);
  return parseInt(row?.count || '0', 10) === 0;
}

async function upsertMetric(department: string, key: string, value: string) {
  await query(
    `INSERT INTO department_metrics (department, metric_key, metric_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (department, metric_key) DO UPDATE SET metric_value = EXCLUDED.metric_value`,
    [department, key, value]
  );
}

export async function seedDashboardData() {
  await seedNurseryData();
  await seedEnvironmentalData();
  await seedSolidWasteData();
  await seedLandfillData();
  await seedEnforcementData();
}

async function seedNurseryData() {
  if (await tableEmpty('department_metrics')) {
    const nurseryMetrics = [
      ['total_seedlings', '15,245'],
      ['distributed_plants', '8,432'],
      ['survival_rate', '87%'],
      ['nursery_activities', '34'],
    ];
    for (const [key, value] of nurseryMetrics) {
      await upsertMetric('nursery', key, value);
    }
  } else {
    const nurseryCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM department_metrics WHERE department = 'nursery'"
    );
    if (parseInt(nurseryCount?.count || '0', 10) === 0) {
      await upsertMetric('nursery', 'total_seedlings', '15,245');
      await upsertMetric('nursery', 'distributed_plants', '8,432');
      await upsertMetric('nursery', 'survival_rate', '87%');
      await upsertMetric('nursery', 'nursery_activities', '34');
    }
  }

  if (!(await tableEmpty('seedlings'))) return;

  const seedlings = [
    ['Mahogany', 500, 'Healthy', '2026-05-10'],
    ['Narra', 300, 'Monitoring', '2026-05-08'],
    ['Mangrove', 750, 'Ready', '2026-05-05'],
    ['Bamboo', 200, 'Growing', '2026-05-01'],
    ['Ipil-ipil', 420, 'Healthy', '2026-04-28'],
  ];

  for (const [species, quantity, status, recordDate] of seedlings) {
    await query(
      `INSERT INTO seedlings (id, species, quantity, status, record_date) VALUES ($1, $2, $3, $4, $5)`,
      [generateId(), species, quantity, status, recordDate]
    );
  }
}

async function seedEnvironmentalData() {
  const envMetricCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM department_metrics WHERE department = 'environmental'"
  );
  if (parseInt(envMetricCount?.count || '0', 10) === 0) {
    const metrics = [
      ['active_projects', '12'],
      ['protected_areas', '8'],
      ['wildlife_reports', '45'],
      ['monitoring_ops', '28'],
    ];
    for (const [key, value] of metrics) {
      await upsertMetric('environmental', key, value);
    }
  }

  if (!(await tableEmpty('environmental_projects'))) return;

  const projects = [
    ['Mangrove Restoration Project', 'Coastal Zone A', 'In Progress', 75],
    ['Wildlife Habitat Conservation', 'Forest Area B', 'In Progress', 60],
    ['Biodiversity Assessment Study', 'Protected Area C', 'Planning', 30],
    ['Ecosystem Monitoring Program', 'Multiple Sites', 'Ongoing', 90],
  ];

  for (const [name, area, status, progress] of projects) {
    await query(
      `INSERT INTO environmental_projects (id, name, area, status, progress) VALUES ($1, $2, $3, $4, $5)`,
      [generateId(), name, area, status, progress]
    );
  }
}

async function seedSolidWasteData() {
  const metricCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM department_metrics WHERE department = 'solid-waste'"
  );
  if (parseInt(metricCount?.count || '0', 10) === 0) {
    const metrics = [
      ['daily_waste_tons', '12.5'],
      ['collection_vehicles', '8'],
      ['active_routes', '15'],
      ['waste_operations', '24'],
    ];
    for (const [key, value] of metrics) {
      await upsertMetric('solid-waste', key, value);
    }
  }

  if (!(await tableEmpty('waste_collections'))) return;

  const collections = [
    ['Route A - Downtown', 'Truck #01', 'Completed', '08:30 AM', '2.3 tons'],
    ['Route B - Residential', 'Truck #02', 'In Progress', '09:00 AM', '1.8 tons'],
    ['Route C - Commercial', 'Truck #03', 'In Progress', '10:15 AM', '3.1 tons'],
    ['Route D - Industrial', 'Truck #04', 'Pending', '11:00 AM', '-'],
    ['Route E - Market Area', 'Truck #05', 'Completed', '07:45 AM', '1.9 tons'],
  ];

  for (const [route, vehicle, status, collectionTime, volume] of collections) {
    await query(
      `INSERT INTO waste_collections (id, route, vehicle, status, collection_time, volume)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [generateId(), route, vehicle, status, collectionTime, volume]
    );
  }
}

async function seedLandfillData() {
  const metricCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM department_metrics WHERE department = 'landfill'"
  );
  if (parseInt(metricCount?.count || '0', 10) === 0) {
    const metrics = [
      ['current_capacity', '68%'],
      ['disposal_rate', '8.2 tons'],
      ['disposal_operations', '156'],
      ['safety_status', 'Good'],
    ];
    for (const [key, value] of metrics) {
      await upsertMetric('landfill', key, value);
    }
  }

  if (await tableEmpty('landfill_disposals')) {
    const disposals = [
      ['Household', 'Barangay 1-5', '3.2 tons', '2026-05-13', 'Processed'],
      ['Industrial', 'Factory Zone A', '5.1 tons', '2026-05-13', 'Processing'],
      ['Institutional', 'Schools District', '1.5 tons', '2026-05-12', 'Processed'],
      ['Household', 'Barangay 6-10', '2.8 tons', '2026-05-12', 'Processed'],
    ];
    for (const [wasteType, source, weight, disposalDate, status] of disposals) {
      await query(
        `INSERT INTO landfill_disposals (id, waste_type, source, weight, disposal_date, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [generateId(), wasteType, source, weight, disposalDate, status]
      );
    }
  }

  if (!(await tableEmpty('landfill_capacity_snapshots'))) return;

  const snapshots = [
    ['Jan 2026', 50, 1],
    ['Feb 2026', 54, 2],
    ['Mar 2026', 58, 3],
    ['Apr 2026', 63, 4],
    ['May 2026', 68, 5],
  ];

  for (const [month, percent, sortOrder] of snapshots) {
    await query(
      `INSERT INTO landfill_capacity_snapshots (id, snapshot_month, capacity_percent, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [generateId(), month, percent, sortOrder]
    );
  }
}

async function seedEnforcementData() {
  const metricCount = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM department_metrics WHERE department = 'enforcement'"
  );
  if (parseInt(metricCount?.count || '0', 10) === 0) {
    const metrics = [
      ['active_cases', '14'],
      ['enforcement_ops', '28'],
      ['violations_recorded', '45'],
      ['field_personnel', '32'],
    ];
    for (const [key, value] of metrics) {
      await upsertMetric('enforcement', key, value);
    }
  }

  if (!(await tableEmpty('enforcement_cases'))) return;

  const cases = [
    ['ENF-2026-041', 'Illegal Logging', 'Forest Area B', 'Under Investigation', 'High', '2026-05-10'],
    ['ENF-2026-042', 'Wildlife Trafficking', 'Border Zone C', 'Evidence Collection', 'Critical', '2026-05-11'],
    ['ENF-2026-043', 'Illegal Mining', 'Mountain Area D', 'Active Operation', 'High', '2026-05-12'],
    ['ENF-2026-044', 'Danger Tree Removal', 'Residential Zone A', 'Scheduled', 'Medium', '2026-05-13'],
  ];

  for (const [caseId, caseType, location, status, priority, caseDate] of cases) {
    await query(
      `INSERT INTO enforcement_cases (id, case_id, case_type, location, status, priority, case_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [generateId(), caseId, caseType, location, status, priority, caseDate]
    );
  }
}
