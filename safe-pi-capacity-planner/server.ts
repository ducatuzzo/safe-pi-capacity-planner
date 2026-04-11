import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import {
  listTenants,
  getTenant,
  createTenant,
  verifyAdminCode,
  getTenantState,
  setTenantState,
  applyTenantAllocationChange,
  applyTenantSettingsChange,
  resetTenantState,
  updateTenant,
} from './server/tenant-manager';
import type { AllocationType, SavedProjectState } from './src/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Lock-State: employeeId → { userName, timer }
const locks = new Map<string, { userName: string; timer: ReturnType<typeof setTimeout> }>();
const LOCK_TIMEOUT_MS = 30_000;

// Rate-Limiter für Admin-Code-Versuche (in-memory, pro tenantId)
const adminFailedAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function checkRateLimit(tenantId: string): boolean {
  const entry = adminFailedAttempts.get(tenantId);
  if (!entry) return true;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return false;
  return true;
}

function recordFailedAttempt(tenantId: string): void {
  const entry = adminFailedAttempts.get(tenantId) ?? { count: 0 };
  entry.count += 1;
  if (entry.count >= 3) {
    entry.lockedUntil = Date.now() + 60_000;
  }
  adminFailedAttempts.set(tenantId, entry);
}

function resetAttempts(tenantId: string): void {
  adminFailedAttempts.delete(tenantId);
}

const app = express();
const httpServer = createServer(app);

const CORS_ORIGINS: (string | RegExp)[] = [
  /^http:\/\/localhost:\d+$/,
  'https://safe-pi-capacity-planner.vercel.app',
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  },
});

app.use(express.json());

// CORS-Header für REST-Endpoints
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// OPTIONS Pre-flight
app.options('*', (_req, res) => {
  res.sendStatus(200);
});

// Gesundheitscheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Tenant-Endpoints ---

// Liste aller Tenants (ohne adminCodeHash)
app.get('/api/tenants', (_req, res) => {
  res.json(listTenants());
});

// Neuen Tenant anlegen
app.post('/api/tenants', (req, res) => {
  const { id, name, adminCode } = req.body as { id?: string; name?: string; adminCode?: string };
  if (!id || !name || !adminCode) {
    res.status(400).json({ error: 'id, name und adminCode sind erforderlich.' });
    return;
  }
  try {
    const tenant = createTenant(id, name, adminCode);
    res.status(201).json(tenant);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    res.status(400).json({ error: message });
  }
});

// State eines Tenants lesen
app.get('/api/tenants/:tenantId/state', (req, res) => {
  const { tenantId } = req.params;
  if (!getTenant(tenantId)) {
    res.status(404).json({ error: `Tenant '${tenantId}' nicht gefunden.` });
    return;
  }
  res.json(getTenantState(tenantId));
});

// State eines Tenants setzen (Backup-Import)
app.post('/api/tenants/:tenantId/state', (req, res) => {
  const { tenantId } = req.params;
  if (!getTenant(tenantId)) {
    res.status(404).json({ error: `Tenant '${tenantId}' nicht gefunden.` });
    return;
  }
  try {
    const newState = req.body as SavedProjectState;
    setTenantState(tenantId, newState);
    io.to(`tenant:${tenantId}`).emit('state:full', getTenantState(tenantId));
    res.json({ ok: true });
  } catch (err) {
    console.error(`[API] POST /api/tenants/${tenantId}/state Fehler:`, err);
    res.status(500).json({ error: 'State konnte nicht gesetzt werden' });
  }
});

// Tenant-State zurücksetzen (Admin-geschützt)
app.post('/api/tenants/:tenantId/reset', (req, res) => {
  const { tenantId } = req.params;
  const { adminCode } = req.body as { adminCode?: string };

  if (!getTenant(tenantId)) {
    res.status(404).json({ error: `Tenant '${tenantId}' nicht gefunden.` });
    return;
  }
  if (!adminCode) {
    res.status(400).json({ error: 'adminCode ist erforderlich.' });
    return;
  }
  if (!checkRateLimit(tenantId)) {
    res.status(429).json({ error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' });
    return;
  }
  if (!verifyAdminCode(tenantId, adminCode)) {
    recordFailedAttempt(tenantId);
    res.status(401).json({ error: 'Admin-Code ungültig' });
    return;
  }

  resetAttempts(tenantId);
  resetTenantState(tenantId);
  io.to(`tenant:${tenantId}`).emit('state:full', getTenantState(tenantId));
  res.json({ ok: true });
});

// Tenant-Name oder Admin-Code ändern (Admin-geschützt)
app.patch('/api/tenants/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const { adminCode, name, newAdminCode } = req.body as {
    adminCode?: string;
    name?: string;
    newAdminCode?: string;
  };

  if (!getTenant(tenantId)) {
    res.status(404).json({ error: `Tenant '${tenantId}' nicht gefunden.` });
    return;
  }
  if (!adminCode) {
    res.status(400).json({ error: 'adminCode ist erforderlich.' });
    return;
  }
  if (!checkRateLimit(tenantId)) {
    res.status(429).json({ error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' });
    return;
  }
  if (!verifyAdminCode(tenantId, adminCode)) {
    recordFailedAttempt(tenantId);
    res.status(401).json({ error: 'Admin-Code ungültig' });
    return;
  }

  resetAttempts(tenantId);
  updateTenant(tenantId, { name, newAdminCode });
  res.json({ ok: true });
});

// --- Legacy-Endpoints (leiten auf Default-Tenant) ---

app.get('/api/state', (_req, res) => {
  res.json(getTenantState('default'));
});

app.post('/api/state', (req, res) => {
  try {
    const newState = req.body as SavedProjectState;
    setTenantState('default', newState);
    io.to('tenant:default').emit('state:full', getTenantState('default'));
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] POST /api/state Fehler:', err);
    res.status(500).json({ error: 'State konnte nicht gesetzt werden' });
  }
});

// --- Hilfsfunktion: TenantId aus Socket-Room ermitteln ---

function getTenantIdFromSocket(socket: Socket): string {
  for (const room of socket.rooms) {
    if (room.startsWith('tenant:')) return room.replace('tenant:', '');
  }
  return 'default';
}

// Socket.io – Verbindungshandling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Verbunden: ${socket.id}`);

  // KEIN sofortiges state:full mehr — kommt erst nach tenant:join

  // Tenant-Room beitreten
  socket.on('tenant:join', (payload: { tenantId: string }) => {
    const { tenantId } = payload;

    // Alle bestehenden Rooms verlassen (ausser eigene Socket-ID)
    socket.rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });

    socket.join(`tenant:${tenantId}`);
    console.log(`[Socket.io] ${socket.id} joined tenant:${tenantId}`);

    // Neuen Client sofort mit vollem State versorgen
    socket.emit('state:full', getTenantState(tenantId));
  });

  // Einzelne Buchungsänderung
  socket.on('allocation:change', (payload: {
    employeeId: string;
    dateStr: string;
    allocationType: AllocationType;
  }) => {
    const tenantId = getTenantIdFromSocket(socket);
    applyTenantAllocationChange(tenantId, payload.employeeId, payload.dateStr, payload.allocationType);
    socket.to(`tenant:${tenantId}`).emit('allocation:change', payload);
  });

  // Settings-Änderung
  socket.on('settings:change', (payload: { type: string; data: unknown }) => {
    const tenantId = getTenantIdFromSocket(socket);
    applyTenantSettingsChange(tenantId, payload.type, payload.data);
    socket.to(`tenant:${tenantId}`).emit('settings:change', payload);
  });

  // Zeile sperren
  socket.on('lock:row', (payload: { employeeId: string; userName: string }) => {
    const tenantId = getTenantIdFromSocket(socket);
    const existing = locks.get(payload.employeeId);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      locks.delete(payload.employeeId);
      io.to(`tenant:${tenantId}`).emit('unlock:row', { employeeId: payload.employeeId });
      console.log(`[Socket.io] Lock-Timeout für ${payload.employeeId}`);
    }, LOCK_TIMEOUT_MS);

    locks.set(payload.employeeId, { userName: payload.userName, timer });
    socket.to(`tenant:${tenantId}`).emit('lock:row', payload);
  });

  // Zeile freigeben
  socket.on('unlock:row', (payload: { employeeId: string }) => {
    const tenantId = getTenantIdFromSocket(socket);
    const existing = locks.get(payload.employeeId);
    if (existing) {
      clearTimeout(existing.timer);
      locks.delete(payload.employeeId);
    }
    socket.to(`tenant:${tenantId}`).emit('unlock:row', payload);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Getrennt: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server] Läuft auf Port ${PORT}`);
});
