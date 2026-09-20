import { Router } from 'express';
import { authMiddleware, staffOnly, mainAdminOnly, verifyToken } from '../middleware/auth.js';
import { query, queryOne } from '../db.js';
import { processBatchSync } from '../lib/syncProcessor.js';
import { syncEvents } from '../lib/syncEvents.js';

const router = Router();

router.post('/batch', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { operations } = req.body;
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: 'Operations array is required' });
    }

    if (operations.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 operations per batch' });
    }

    for (const op of operations) {
      if (!op.queueId || !op.module || !op.operation || !op.localId) {
        return res.status(400).json({ error: 'Each operation requires queueId, module, operation, and localId' });
      }
    }

    const result = await processBatchSync(operations, req.user!);

    if (result.synced > 0) {
      syncEvents.emitSyncCompleted(result.synced);
      const modules = [...new Set(operations.map((o: { module: string }) => o.module))];
      for (const mod of modules) {
        syncEvents.emitDataChanged(mod);
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Batch sync failed' });
  }
});

router.get('/status', authMiddleware, mainAdminOnly, async (_req, res) => {
  try {
    const stats = await queryOne<{ total: string; conflicts: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE conflict = true)::text AS conflicts
       FROM sync_logs`
    );

    const lastSync = await queryOne<{ created_at: string }>(
      'SELECT created_at FROM sync_logs ORDER BY created_at DESC LIMIT 1'
    );

    const recentLogs = await query(
      `SELECT id, module_name, record_id, operation_type, status, message, performed_by, conflict, created_at
       FROM sync_logs ORDER BY created_at DESC LIMIT 50`
    );

    res.json({
      totalLogs: parseInt(stats?.total || '0', 10),
      totalConflicts: parseInt(stats?.conflicts || '0', 10),
      lastSyncAt: lastSync?.created_at || null,
      recentLogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/logs', authMiddleware, mainAdminOnly, async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10), 500);
    const logs = await query(
      `SELECT id, module_name, record_id, operation_type, status, message, performed_by, conflict, created_at
       FROM sync_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/events', (req, res) => {
  const header = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = verifyToken(token);
    if (req.user.type !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

  const handler = (payload: unknown) => sendEvent(payload);
  syncEvents.on('sync-event', handler);

  const heartbeat = setInterval(() => {
    sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    syncEvents.off('sync-event', handler);
  });
});

export default router;
