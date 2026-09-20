import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://menro:menro_password@localhost:5433/bantay_kalikasan';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS citizens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      citizen_id TEXT REFERENCES citizens(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Normal',
      status TEXT NOT NULL DEFAULT 'Pending',
      assigned_to TEXT NOT NULL,
      response TEXT,
      date_submitted TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Scheduled',
      participants INTEGER NOT NULL DEFAULT 0,
      department TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      position TEXT NOT NULL,
      phone TEXT,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      date_hired TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS history_logs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      section TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      performed_by TEXT NOT NULL,
      event_date TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS section_services (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      section_name TEXT NOT NULL,
      inquiry_category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS department_metrics (
      department TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      metric_value TEXT NOT NULL,
      PRIMARY KEY (department, metric_key)
    );

    CREATE TABLE IF NOT EXISTS seedlings (
      id TEXT PRIMARY KEY,
      species TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      record_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS environmental_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS waste_collections (
      id TEXT PRIMARY KEY,
      route TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      status TEXT NOT NULL,
      collection_time TEXT NOT NULL,
      volume TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS landfill_disposals (
      id TEXT PRIMARY KEY,
      waste_type TEXT NOT NULL,
      source TEXT NOT NULL,
      weight TEXT NOT NULL,
      disposal_date TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS landfill_capacity_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_month TEXT NOT NULL,
      capacity_percent INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS enforcement_cases (
      id TEXT PRIMARY KEY,
      case_id TEXT UNIQUE NOT NULL,
      case_type TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      case_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS department_services (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL REFERENCES departments(id),
      service_name TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      processing_time TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS staff_role TEXT NOT NULL DEFAULT 'section_admin';
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS department_id TEXT;
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS service_id TEXT;
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS sync_client_mappings (
      local_id TEXT NOT NULL,
      module_name TEXT NOT NULL,
      server_id TEXT NOT NULL,
      synced_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (local_id, module_name)
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      module_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      conflict BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);
  `);
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function nextTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const row = await queryOne<{ ticket_number: string }>(
    `SELECT ticket_number FROM inquiries
     WHERE ticket_number LIKE $1
     ORDER BY ticket_number DESC LIMIT 1`,
    [`INQ-${year}-%`]
  );

  let next = 1;
  if (row?.ticket_number) {
    const parts = row.ticket_number.split('-');
    next = parseInt(parts[2], 10) + 1;
  }
  return `INQ-${year}-${String(next).padStart(3, '0')}`;
}

export async function waitForDatabase(retries = 30, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to PostgreSQL');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`Waiting for PostgreSQL... (${i + 1}/${retries}) — ${message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to PostgreSQL');
}
