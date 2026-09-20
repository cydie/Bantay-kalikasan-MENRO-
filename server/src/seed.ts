import bcrypt from 'bcryptjs';
import { generateId, initDatabase, query, queryOne, waitForDatabase } from './db.js';
import { seedDashboardData } from './seed-dashboard.js';
import { seedDepartmentsAndServices } from './seed-departments.js';
import {
  logStaffAccounts,
  seedStaffAccounts,
} from './seed-staff.js';

export async function seedDatabase() {
  try {
    await waitForDatabase(15, 2000);
  } catch {
    console.error(`
Could not connect to PostgreSQL (localhost:5433).

The database is not running. Do this first:

  1. Open Docker Desktop on Windows and wait until it says "Running"
  2. Start only the database:
       npm run db:up
     or start everything:
       npm run docker:up
  3. Run seed again:
       npm run seed
`);
    throw new Error('PostgreSQL is not available');
  }

  await initDatabase();

  const staffCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM staff_users'
  );
  if (parseInt(staffCount?.count || '0', 10) > 0) {
    await seedStaffAccounts();

    const serviceCount = await queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM section_services');
    if (parseInt(serviceCount?.count || '0', 10) === 0) {
      await seedSectionServices();
    }
    const historyCount = await queryOne<{ count: string }>('SELECT COUNT(*)::text AS count FROM history_logs');
    if (parseInt(historyCount?.count || '0', 10) === 0) {
      await seedHistoryLogs();
    }

    await seedDashboardData();
    await seedDepartmentsAndServices();

    logStaffAccounts();
    console.log('Database already seeded.');
    return;
  }

  const citizenPasswordHash = bcrypt.hashSync('citizen123', 10);

  await seedStaffAccounts();

  const citizenId = generateId();
  await query(
    `INSERT INTO citizens (id, name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5)`,
    [citizenId, 'Maria Santos', 'maria.santos123@gmail.com', citizenPasswordHash, '0917-111-2222']
  );

  const inquiries = [
    ['INQ-2026-001', 'Maria Santos', 'maria.santos123@gmail.com', '0917-111-2222', 'Nursery', 'Request for Seedling Donation', 'Good day! I would like to request mahogany and narra seedlings for our barangay tree planting activity.', 'Normal', 'Pending', 'Nursery', null, '2026-05-14 09:30 AM'],
    ['INQ-2026-002', 'Juan Dela Cruz', 'juan.dc@yahoo.com', '0918-222-3333', 'Solid Waste', 'Missed Garbage Collection', 'Our area in Barangay 5 was not covered by the garbage collection this morning.', 'Urgent', 'In Progress', 'Solid Waste', 'Collection truck #03 will be dispatched this afternoon at 2 PM.', '2026-05-14 08:15 AM'],
    ['INQ-2026-003', 'Rosa Martinez', 'rosa.m@gmail.com', '0919-333-4444', 'Environmental', 'Report: Illegal Dumping in Coastal Area', 'Construction waste dumped in the coastal area near our community.', 'Urgent', 'Pending', 'Environmental', null, '2026-05-13 04:20 PM'],
    ['INQ-2026-004', 'Ana Lopez', 'ana.lopez@gmail.com', '0921-555-6666', 'Enforcement', 'Report: Illegal Tree Cutting', 'Illegal tree cutting witnessed in the forest area near our barangay.', 'Urgent', 'In Progress', 'Enforcement', 'Investigation team has been dispatched.', '2026-05-13 02:45 PM'],
    ['INQ-2026-005', 'Pedro Santos', 'pedro.s@yahoo.com', '0922-666-7777', 'Landfill', 'Inquiry: Proper Waste Segregation', 'What are the proper waste segregation procedures?', 'Low', 'Resolved', 'Landfill', 'Segregate into Biodegradable, Non-biodegradable, and Recyclable.', '2026-05-11 11:30 AM'],
  ];

  for (const inq of inquiries) {
    await query(
      `INSERT INTO inquiries (id, ticket_number, name, email, phone, category, subject, message, priority, status, assigned_to, response, date_submitted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [generateId(), ...inq]
    );
  }

  const activities = [
    ['Coastal Clean-up Drive', 'Community beach cleaning activity', '2026-05-18', 'Rizal Beach', 'Scheduled', 150, 'environmental'],
    ['Tree Planting Activity', 'Reforestation program', '2026-05-22', 'Municipal Park', 'Scheduled', 200, 'nursery'],
    ['Environmental Seminar', 'Waste management training', '2026-05-10', 'Community Center', 'Completed', 80, 'environmental'],
  ];

  for (const act of activities) {
    await query(
      `INSERT INTO activities (id, title, description, date, location, status, participants, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [generateId(), ...act]
    );
  }

  const employees = [
    ['1', 'Engr. Maria Santos', 'maria.santos@rizal.gov', 'MENRO Officer-in-Charge', '0917-123-4567', 'admin', 'Active', '2020-01-15'],
    ['2', 'Carlos R. Mendez', 'carlos.mendez@rizal.gov', 'Administrative Assistant', '0918-234-5678', 'admin', 'Active', '2021-03-10'],
    ['3', 'Roberto C. Mendoza', 'roberto.mendoza@rizal.gov', 'Nursery Supervisor', '0919-345-6789', 'nursery', 'Active', '2019-05-20'],
    ['4', 'Ana Marie L. Cruz', 'anamarie.cruz@rizal.gov', 'Nursery Technician', '0920-456-7890', 'nursery', 'Active', '2021-07-15'],
    ['5', 'Pedro B. Santos', 'pedro.santos@rizal.gov', 'Seedling Caretaker', '0921-567-8901', 'nursery', 'Active', '2022-02-01'],
    ['6', 'Dr. Elena V. Reyes', 'elena.reyes@rizal.gov', 'Environmental Specialist', '0922-678-9012', 'environmental', 'Active', '2018-09-12'],
    ['7', 'Michael T. Garcia', 'michael.garcia@rizal.gov', 'Wildlife Biologist', '0923-789-0123', 'environmental', 'Active', '2020-11-05'],
    ['8', 'Carlos P. Fernandez', 'carlos.fernandez@rizal.gov', 'Solid Waste Coordinator', '0924-890-1234', 'solid-waste', 'Active', '2019-03-08'],
    ['9', 'Ramon A. Lopez', 'ramon.lopez@rizal.gov', 'Collection Driver', '0925-901-2345', 'solid-waste', 'Active', '2020-06-20'],
    ['10', 'Jose M. Rivera', 'jose.rivera@rizal.gov', 'Collection Driver', '0926-012-3456', 'solid-waste', 'Active', '2021-01-10'],
    ['11', 'Juan M. Dela Cruz', 'juan.delacruz@rizal.gov', 'Landfill Operations Head', '0927-123-4567', 'landfill', 'Active', '2018-04-15'],
    ['12', 'Ricardo P. Torres', 'ricardo.torres@rizal.gov', 'Landfill Operator', '0928-234-5678', 'landfill', 'Active', '2020-08-22'],
    ['13', 'Francisco R. Valdez', 'francisco.valdez@rizal.gov', 'Enforcement Team Leader', '0931-567-8901', 'enforcement', 'Active', '2017-12-01'],
    ['14', 'Antonio L. Morales', 'antonio.morales@rizal.gov', 'Forest Ranger', '0932-678-9012', 'enforcement', 'Active', '2019-07-30'],
  ];

  for (const emp of employees) {
    await query(
      `INSERT INTO employees (id, name, email, position, phone, department, status, date_hired)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      emp
    );
  }

  const records = [
    ['Environmental Report', 'Mangrove Conservation Study', 'Quarterly assessment of mangrove ecosystem', '2026-05-01', 'Environmental', 'Active', 'Dr. Elena V. Reyes'],
    ['Waste Collection', 'April Collection Summary', 'Monthly waste collection data', '2026-04-30', 'Solid Waste', 'Active', 'Carlos P. Fernandez'],
    ['Seedling Distribution', 'Q1 Seedling Distribution', 'First quarter distribution records', '2026-03-31', 'Nursery', 'Archived', 'Roberto C. Mendoza'],
  ];

  for (const rec of records) {
    await query(
      `INSERT INTO records (id, record_type, title, description, date, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [generateId(), ...rec]
    );
  }

  const logs = [
    ['Roberto C. Mendoza', 'Updated seedling inventory', 'Nursery'],
    ['Dr. Elena V. Reyes', 'Submitted environmental assessment report', 'Environmental'],
    ['Engr. Maria Santos', 'Created new user account', 'Admin'],
    ['Carlos P. Fernandez', 'Submitted waste collection data', 'Solid Waste'],
  ];

  for (const log of logs) {
    await query(
      `INSERT INTO activity_logs (id, user_name, action, department) VALUES ($1, $2, $3, $4)`,
      [generateId(), ...log]
    );
  }

  await seedHistoryLogs();
  await seedSectionServices();
  await seedDashboardData();
  await seedDepartmentsAndServices();

  console.log('Database seeded successfully.');
  logStaffAccounts();
  console.log('Citizen demo: maria.santos123@gmail.com / citizen123');
}

async function seedHistoryLogs() {
  const historyEntries = [
    ['Environmental Seminar completed', 'Waste management training held at Community Center', 'Activity Completed', 'environmental', 'Completed', 'Dr. Elena V. Reyes', '2026-05-10'],
    ['Seedling inventory updated', 'Nursery stock records refreshed for Q2', 'Record Update', 'nursery', 'Updated', 'Roberto C. Mendoza', '2026-05-14'],
    ['Inquiry response sent', 'Resolved landfill segregation inquiry INQ-2026-005', 'Inquiry Response', 'landfill', 'Completed', 'Juan M. Dela Cruz', '2026-05-11'],
    ['Monthly report generated', 'Consolidated environmental activity report exported', 'Report Generated', 'admin', 'Completed', 'Engr. Maria Santos', '2026-05-01'],
  ];

  for (const entry of historyEntries) {
    await query(
      `INSERT INTO history_logs (id, title, description, activity_type, section, status, performed_by, event_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [generateId(), ...entry]
    );
  }
}

async function seedSectionServices() {
  const sectionServices = [
    ['nursery', 'Nursery', 'Nursery', 'Seedling Request', 'Request mahogany, narra, or native seedlings for barangay planting programs.', 'Barangay resolution and valid ID of requester', 1],
    ['nursery', 'Nursery', 'Nursery', 'Tree Planting Coordination', 'Schedule a tree planting activity with MENRO nursery support.', 'Proposed site location and participant estimate', 2],
    ['environmental', 'Environmental Management', 'Environmental Management', 'Environmental Impact Inquiry', 'Ask about environmental compliance for projects or activities.', 'Project description and location details', 1],
    ['environmental', 'Environmental Management', 'Environmental Management', 'Coastal / Wildlife Report', 'Report illegal dumping, wildlife concerns, or ecosystem disturbances.', 'Photos and exact location if available', 2],
    ['solid-waste', 'Solid Waste Management', 'Solid Waste Management', 'Garbage Collection Concern', 'Report missed collection or schedule concerns in your barangay.', 'Barangay name and collection schedule details', 1],
    ['solid-waste', 'Solid Waste Management', 'Solid Waste Management', 'Waste Segregation Guidance', 'Request guidance on proper waste segregation for households or businesses.', 'Type of establishment or household setup', 2],
    ['landfill', 'Landfill Management', 'Landfill Management', 'Disposal Procedure Inquiry', 'Learn proper disposal procedures for special or bulk waste.', 'Type of waste material involved', 1],
    ['enforcement', 'Enforcement', 'Enforcement', 'Environmental Violation Report', 'Report illegal logging, dumping, or environmental law violations.', 'Date, location, and description of incident', 1],
  ];

  for (const service of sectionServices) {
    await query(
      `INSERT INTO section_services (id, section, section_name, inquiry_category, title, description, requirements, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [generateId(), ...service]
    );
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
