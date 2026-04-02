import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  getState,
  setState,
  applyAllocationChange,
  applySettingsChange,
} from './server/state-manager';
import type { AllocationType, SavedProjectState } from './src/types';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Lock-State: employeeId → { userName, timer }
const locks = new Map<string, { userName: string; timer: ReturnType<typeof setTimeout> }>();
const LOCK_TIMEOUT_MS = 30_000;

const app = express();
const httpServer = createServer(app);

const CORS_ORIGINS: (string | RegExp)[] = [
  // Alle lokalen Entwicklungs-Ports (Vite AutoPort-Schutz)
  /^http:\/\/localhost:\d+$/,
  // Vercel Production Frontend
  'https://safe-pi-capacity-planner.vercel.app',
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// CORS-Header für REST-Endpoints (Fallback, Vite-Proxy übernimmt normalerweise)
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Gesundheitscheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialer State-Load für neue Clients (REST-Fallback und Reconnect)
app.get('/api/state', (_req, res) => {
  res.json(getState());
});

// Vollständigen State ersetzen (Backup-Import)
app.post('/api/state', (req, res) => {
  try {
    const newState = req.body as SavedProjectState;
    setState(newState);
    io.emit('state:full', getState());
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] POST /api/state Fehler:', err);
    res.status(500).json({ error: 'State konnte nicht gesetzt werden' });
  }
});

// Socket.io – Verbindungshandling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Verbunden: ${socket.id}`);

  // Neuen Client sofort mit vollem State versorgen
  socket.emit('state:full', getState());

  // Einzelne Buchungsänderung
  socket.on('allocation:change', (payload: {
    employeeId: string;
    dateStr: string;
    allocationType: AllocationType;
  }) => {
    applyAllocationChange(payload.employeeId, payload.dateStr, payload.allocationType);
    socket.broadcast.emit('allocation:change', payload);
  });

  // Settings-Änderung (employees, pis, feiertage, schulferien, blocker, teamZielwerte)
  socket.on('settings:change', (payload: { type: string; data: unknown }) => {
    applySettingsChange(payload.type, payload.data);
    socket.broadcast.emit('settings:change', payload);
  });

  // Zeile sperren
  socket.on('lock:row', (payload: { employeeId: string; userName: string }) => {
    const existing = locks.get(payload.employeeId);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      locks.delete(payload.employeeId);
      io.emit('unlock:row', { employeeId: payload.employeeId });
      console.log(`[Socket.io] Lock-Timeout für ${payload.employeeId}`);
    }, LOCK_TIMEOUT_MS);

    locks.set(payload.employeeId, { userName: payload.userName, timer });
    socket.broadcast.emit('lock:row', payload);
  });

  // Zeile freigeben
  socket.on('unlock:row', (payload: { employeeId: string }) => {
    const existing = locks.get(payload.employeeId);
    if (existing) {
      clearTimeout(existing.timer);
      locks.delete(payload.employeeId);
    }
    socket.broadcast.emit('unlock:row', payload);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Getrennt: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Server] Läuft auf Port ${PORT}`);
});
