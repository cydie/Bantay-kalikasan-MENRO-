const initSqlJs = require('sql.js');

const fs = require('fs');

const path = require('path');

const { app } = require('electron');



let SQL = null;

let db = null;



function getDbPath() {

  return path.join(app.getPath('userData'), 'bantay-kalikasan-local.db');

}



function runMigration(database, sql) {

  try {

    database.run(sql);

  } catch {

    // Column or table may already exist

  }

}



function initSchema(database) {

  database.run(`

    CREATE TABLE IF NOT EXISTS entities (

      entity TEXT NOT NULL,

      id TEXT NOT NULL,

      data TEXT NOT NULL,

      PRIMARY KEY (entity, id)

    );



    CREATE TABLE IF NOT EXISTS cache (

      path TEXT PRIMARY KEY,

      data TEXT NOT NULL,

      updated_at TEXT NOT NULL

    );



    CREATE TABLE IF NOT EXISTS sync_queue (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      method TEXT NOT NULL,

      path TEXT NOT NULL,

      body TEXT,

      created_at TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'pending',

      record_id TEXT,

      module_name TEXT,

      operation_type TEXT,

      local_updated_at TEXT,

      error_message TEXT,

      retry_count INTEGER NOT NULL DEFAULT 0

    );



    CREATE TABLE IF NOT EXISTS sync_logs (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      queue_id INTEGER,

      module_name TEXT NOT NULL,

      record_id TEXT NOT NULL,

      operation_type TEXT NOT NULL,

      status TEXT NOT NULL,

      message TEXT NOT NULL,

      created_at TEXT NOT NULL

    );



    CREATE TABLE IF NOT EXISTS id_mappings (

      local_id TEXT NOT NULL,

      module_name TEXT NOT NULL,

      server_id TEXT NOT NULL,

      mapped_at TEXT NOT NULL,

      PRIMARY KEY (local_id, module_name)

    );



    CREATE TABLE IF NOT EXISTS sync_metadata (

      key TEXT PRIMARY KEY,

      value TEXT NOT NULL

    );



    CREATE INDEX IF NOT EXISTS idx_entities_entity ON entities(entity);

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

    CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at);

  `);



  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN record_id TEXT');

  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN module_name TEXT');

  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN operation_type TEXT');

  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN local_updated_at TEXT');

  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN error_message TEXT');

  runMigration(database, 'ALTER TABLE sync_queue ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0');

}



function persist(database) {

  const data = database.export();

  fs.writeFileSync(getDbPath(), Buffer.from(data));

}



async function ensureSql() {

  if (!SQL) {

    SQL = await initSqlJs();

  }

  return SQL;

}



async function getDb() {

  if (db) return db;



  const Sql = await ensureSql();

  const dbPath = getDbPath();



  if (fs.existsSync(dbPath)) {

    const buffer = fs.readFileSync(dbPath);

    db = new Sql.Database(buffer);

    initSchema(db);

    persist(db);

  } else {

    db = new Sql.Database();

    initSchema(db);

    persist(db);

  }



  return db;

}



function rowToQueueItem(row) {

  return {

    id: row.id,

    method: row.method,

    path: row.path,

    body: row.body ?? undefined,

    created_at: row.created_at,

    status: row.status,

    record_id: row.record_id ?? undefined,

    module_name: row.module_name ?? undefined,

    operation_type: row.operation_type ?? undefined,

    local_updated_at: row.local_updated_at ?? undefined,

    error_message: row.error_message ?? undefined,

    retry_count: row.retry_count ?? 0,

  };

}



module.exports = {

  async init() {

    await getDb();

    return { path: getDbPath() };

  },



  async getAll(entity) {

    const database = await getDb();

    const stmt = database.prepare('SELECT data FROM entities WHERE entity = ?');

    stmt.bind([entity]);

    const rows = [];

    while (stmt.step()) {

      const row = stmt.getAsObject();

      rows.push(JSON.parse(row.data));

    }

    stmt.free();

    return rows;

  },



  async upsert(entity, items) {

    const database = await getDb();

    const list = Array.isArray(items) ? items : [items];



    database.run('BEGIN');

    try {

      for (const item of list) {

        database.run(

          'INSERT OR REPLACE INTO entities (entity, id, data) VALUES (?, ?, ?)',

          [entity, item.id, JSON.stringify(item)]

        );

      }

      database.run('COMMIT');

    } catch (error) {

      database.run('ROLLBACK');

      throw error;

    }



    persist(database);

  },



  async remove(entity, id) {

    const database = await getDb();

    database.run('DELETE FROM entities WHERE entity = ? AND id = ?', [entity, id]);

    persist(database);

  },



  async replaceAll(entity, items) {

    const database = await getDb();



    database.run('BEGIN');

    try {

      database.run('DELETE FROM entities WHERE entity = ?', [entity]);

      for (const item of items) {

        database.run(

          'INSERT INTO entities (entity, id, data) VALUES (?, ?, ?)',

          [entity, item.id, JSON.stringify(item)]

        );

      }

      database.run('COMMIT');

    } catch (error) {

      database.run('ROLLBACK');

      throw error;

    }



    persist(database);

  },



  async getCache(pathKey) {

    const database = await getDb();

    const stmt = database.prepare('SELECT data FROM cache WHERE path = ?');

    stmt.bind([pathKey]);

    if (!stmt.step()) {

      stmt.free();

      return null;

    }

    const row = stmt.getAsObject();

    stmt.free();

    return JSON.parse(row.data);

  },



  async setCache(pathKey, data) {

    const database = await getDb();

    database.run(

      'INSERT OR REPLACE INTO cache (path, data, updated_at) VALUES (?, ?, ?)',

      [pathKey, JSON.stringify(data), new Date().toISOString()]

    );

    persist(database);

  },



  async getSyncQueue() {

    const database = await getDb();

    const stmt = database.prepare(

      "SELECT id, method, path, body, created_at, status, record_id, module_name, operation_type, local_updated_at, error_message, retry_count FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC, id ASC"

    );

    const rows = [];

    while (stmt.step()) {

      rows.push(rowToQueueItem(stmt.getAsObject()));

    }

    stmt.free();

    return rows;

  },



  async getSyncQueueStats() {

    const database = await getDb();

    const stmt = database.prepare(

      "SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status"

    );

    const stats = { pending: 0, failed: 0, syncing: 0 };

    while (stmt.step()) {

      const row = stmt.getAsObject();

      if (row.status === 'pending') stats.pending = row.count;

      if (row.status === 'failed') stats.failed = row.count;

      if (row.status === 'syncing') stats.syncing = row.count;

    }

    stmt.free();

    return stats;

  },



  async addToSyncQueue(item) {

    const database = await getDb();

    database.run(

      `INSERT INTO sync_queue (method, path, body, created_at, status, record_id, module_name, operation_type, local_updated_at, retry_count)

       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, 0)`,

      [

        item.method,

        item.path,

        item.body ?? null,

        item.created_at,

        item.record_id ?? null,

        item.module_name ?? null,

        item.operation_type ?? null,

        item.local_updated_at ?? item.created_at,

      ]

    );

    persist(database);

  },



  async markSyncQueueSynced(ids) {

    if (!ids.length) return;

    const database = await getDb();

    const placeholders = ids.map(() => '?').join(',');

    database.run(`DELETE FROM sync_queue WHERE id IN (${placeholders})`, ids);

    persist(database);

  },



  async markSyncQueueFailed(id, errorMessage) {

    const database = await getDb();

    database.run(

      `UPDATE sync_queue SET status = 'failed', error_message = ?, retry_count = retry_count + 1 WHERE id = ?`,

      [errorMessage, id]

    );

    persist(database);

  },



  async resetFailedSyncQueue() {

    const database = await getDb();

    database.run("UPDATE sync_queue SET status = 'pending', error_message = NULL WHERE status = 'failed'");

    persist(database);

  },



  async clearFailedSyncQueue() {

    const database = await getDb();

    database.run("DELETE FROM sync_queue WHERE status = 'failed'");

    persist(database);

  },



  async addSyncLog(entry) {

    const database = await getDb();

    database.run(

      `INSERT INTO sync_logs (queue_id, module_name, record_id, operation_type, status, message, created_at)

       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [

        entry.queue_id ?? null,

        entry.module_name,

        entry.record_id,

        entry.operation_type,

        entry.status,

        entry.message,

        entry.created_at || new Date().toISOString(),

      ]

    );

    persist(database);

  },



  async getSyncLogs(limit = 100) {

    const database = await getDb();

    const stmt = database.prepare(

      'SELECT id, queue_id, module_name, record_id, operation_type, status, message, created_at FROM sync_logs ORDER BY created_at DESC LIMIT ?'

    );

    stmt.bind([limit]);

    const rows = [];

    while (stmt.step()) {

      rows.push(stmt.getAsObject());

    }

    stmt.free();

    return rows;

  },



  async setIdMapping(localId, moduleName, serverId) {

    const database = await getDb();

    database.run(

      `INSERT OR REPLACE INTO id_mappings (local_id, module_name, server_id, mapped_at) VALUES (?, ?, ?, ?)`,

      [localId, moduleName, serverId, new Date().toISOString()]

    );

    persist(database);

  },



  async getIdMapping(localId, moduleName) {

    const database = await getDb();

    const stmt = database.prepare(

      'SELECT server_id FROM id_mappings WHERE local_id = ? AND module_name = ?'

    );

    stmt.bind([localId, moduleName]);

    if (!stmt.step()) {

      stmt.free();

      return null;

    }

    const row = stmt.getAsObject();

    stmt.free();

    return row.server_id;

  },



  async getSyncMetadata() {

    const database = await getDb();

    const stmt = database.prepare('SELECT key, value FROM sync_metadata');

    const meta = {

      last_sync_at: null,

      last_sync_status: 'idle',

      total_synced: 0,

      total_failed: 0,

      total_conflicts: 0,

    };

    while (stmt.step()) {

      const row = stmt.getAsObject();

      if (row.key === 'last_sync_at') meta.last_sync_at = row.value;

      if (row.key === 'last_sync_status') meta.last_sync_status = row.value;

      if (row.key === 'total_synced') meta.total_synced = parseInt(row.value, 10) || 0;

      if (row.key === 'total_failed') meta.total_failed = parseInt(row.value, 10) || 0;

      if (row.key === 'total_conflicts') meta.total_conflicts = parseInt(row.value, 10) || 0;

    }

    stmt.free();

    return meta;

  },



  async updateSyncMetadata(updates) {

    const database = await getDb();

    for (const [key, value] of Object.entries(updates)) {

      database.run(

        'INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)',

        [key, String(value)]

      );

    }

    persist(database);

  },



  close() {

    if (db) {

      persist(db);

      db.close();

      db = null;

    }

  },

};


