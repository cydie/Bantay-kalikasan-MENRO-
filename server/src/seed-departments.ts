import { DEPARTMENTS } from './lib/departments.js';
import { generateId, query, queryOne } from './db.js';

interface ServiceSeed {
  department_id: string;
  service_name: string;
  description: string;
  requirements: string;
  processing_time: string;
}

const SERVICE_SEEDS: ServiceSeed[] = [
  { department_id: 'nursery', service_name: 'Seedling Request', description: 'Request mahogany, narra, or native seedlings for barangay planting programs.', requirements: 'Barangay resolution and valid ID of requester', processing_time: '3-5 working days' },
  { department_id: 'nursery', service_name: 'Tree Planting Coordination', description: 'Schedule a tree planting activity with MENRO nursery support.', requirements: 'Proposed site location and participant estimate', processing_time: '5-7 working days' },
  { department_id: 'solid-waste', service_name: 'Garbage Collection / Papahakot Basura', description: 'Report missed collection or request garbage pickup schedule.', requirements: 'Barangay name and exact location', processing_time: '1-2 working days' },
  { department_id: 'solid-waste', service_name: 'Waste Segregation Guidance', description: 'Request guidance on proper waste segregation for households or businesses.', requirements: 'Type of establishment or household setup', processing_time: '2-3 working days' },
  { department_id: 'environmental', service_name: 'Environmental Impact Inquiry', description: 'Ask about environmental compliance for projects or activities.', requirements: 'Project description and location details', processing_time: '7-10 working days' },
  { department_id: 'environmental', service_name: 'Coastal / Wildlife Report', description: 'Report illegal dumping, wildlife concerns, or ecosystem disturbances.', requirements: 'Photos and exact location if available', processing_time: '1-3 working days' },
  { department_id: 'landfill', service_name: 'Disposal Procedure Inquiry', description: 'Learn proper disposal procedures for special or bulk waste.', requirements: 'Type of waste material involved', processing_time: '2-4 working days' },
  { department_id: 'landfill', service_name: 'Landfill Disposal Scheduling', description: 'Schedule disposal of household, industrial, or institutional waste.', requirements: 'Waste type, estimated volume, and source', processing_time: '3-5 working days' },
  { department_id: 'enforcement', service_name: 'Environmental Violation Report', description: 'Report illegal logging, dumping, or environmental law violations.', requirements: 'Date, location, and description of incident', processing_time: '1-2 working days' },
  { department_id: 'enforcement', service_name: 'Danger Tree Assessment', description: 'Request assessment for hazardous trees in residential or public areas.', requirements: 'Exact location and photos of the tree', processing_time: '3-5 working days' },
  { department_id: 'admin', service_name: 'General Inquiry', description: 'General questions directed to MENRO main office.', requirements: 'Valid contact information', processing_time: '2-5 working days' },
];

const REMOVED_DEPARTMENT_IDS = ['mdrrmo', 'treasury', 'assessor'];

async function removeRetiredDepartments() {
  for (const id of REMOVED_DEPARTMENT_IDS) {
    await query('DELETE FROM department_services WHERE department_id = $1', [id]);
    await query('DELETE FROM departments WHERE id = $1', [id]);
  }
}

async function backfillInquiryDepartmentIds() {
  const labelToId: Record<string, string> = {
    Nursery: 'nursery',
    Environmental: 'environmental',
    'Solid Waste': 'solid-waste',
    Landfill: 'landfill',
    Enforcement: 'enforcement',
    Admin: 'admin',
  };

  for (const [label, id] of Object.entries(labelToId)) {
    await query(
      `UPDATE inquiries
       SET department_id = $1
       WHERE department_id IS NULL AND assigned_to = $2`,
      [id, label]
    );
  }
}

export async function seedDepartmentsAndServices() {
  await removeRetiredDepartments();
  await backfillInquiryDepartmentIds();

  for (const dept of DEPARTMENTS) {
    await query(
      `INSERT INTO departments (id, name, description, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         status = EXCLUDED.status`,
      [dept.id, dept.name, dept.description ?? null, dept.status]
    );
  }

  for (const service of SERVICE_SEEDS) {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM department_services
       WHERE department_id = $1 AND service_name = $2`,
      [service.department_id, service.service_name]
    );

    if (existing) {
      await query(
        `UPDATE department_services
         SET description = $1,
             requirements = $2,
             processing_time = $3,
             status = 'Active'
         WHERE id = $4`,
        [service.description, service.requirements, service.processing_time, existing.id]
      );
    } else {
      await query(
        `INSERT INTO department_services
          (id, department_id, service_name, description, requirements, processing_time, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'Active', 'System Seed')`,
        [
          generateId(),
          service.department_id,
          service.service_name,
          service.description,
          service.requirements,
          service.processing_time,
        ]
      );
    }
  }
}
