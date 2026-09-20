import { generateId, query } from '../db.js';

export async function logHistory(entry: {
  title: string;
  description: string;
  activity_type: string;
  section: string;
  status?: string;
  performed_by: string;
  event_date?: string;
}) {
  await query(
    `INSERT INTO history_logs (id, title, description, activity_type, section, status, performed_by, event_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      generateId(),
      entry.title,
      entry.description,
      entry.activity_type,
      entry.section,
      entry.status || 'Completed',
      entry.performed_by,
      entry.event_date || new Date().toISOString().slice(0, 10),
    ]
  );
}
