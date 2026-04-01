# Feature 15: Multiuser-Fähigkeit

## Ziel
Mehrere Browser-Sessions (verschiedene User im gleichen Netzwerk) können gleichzeitig planen. Änderungen eines Users sind sofort bei allen anderen sichtbar. State wird auf dem Server gehalten — kein Datenverlust bei Browser-Refresh.

## Architektur

```
Browser A ──┐                    ┌── Browser B
            │  Socket.io events  │
            └──── server.ts ─────┘
                      │
                state-manager.ts  (in-memory, SavedProjectState)
                      │
                  /api/state  (REST für initialen Load)
```

### Prinzip
- **Server ist Source of Truth** — nicht der Browser
- Bei Verbindung: Client erhält vollständigen State via REST GET /api/state
- Bei Änderung: Client sendet Event via Socket.io → Server updated State → broadcast an alle anderen Clients
- Bei Reconnect: Client holt State neu via REST

## Akzeptanzkriterien

### Server
- [ ] `server/state-manager.ts` — hält SavedProjectState in-memory
- [ ] REST `GET /api/state` — liefert aktuellen State (für initialen Load + Reconnect)
- [ ] REST `POST /api/state` — ersetzt gesamten State (für Backup-Import)
- [ ] Socket.io Event `allocation:change` — einzelne Buchungsänderung broadcasten
- [ ] Socket.io Event `settings:change` — Settings-Änderung broadcasten (employees, pis, feiertage etc.)
- [ ] Socket.io Event `state:full` — Server sendet kompletten State an neuen Client
- [ ] Server broadcastet an alle ausser dem Sender (`socket.broadcast.emit`)

### Client
- [ ] `src/hooks/useSocket.ts` — Hook für Socket.io Verbindung
- [ ] Bei App-Start: State von GET /api/state laden (ersetzt Seed-Daten als Initialstate)
- [ ] Bei Änderung (Allokation/Settings): Event an Server senden
- [ ] Bei eingehendem Event: lokalen State aktualisieren (ohne Loop)
- [ ] Verbindungsindikator im Header: grüner Punkt = verbunden, roter Punkt = getrennt
- [ ] Reconnect-Logik: Socket.io Auto-Reconnect (bereits eingebaut)

### Locking (einfach)
- [ ] Beim Start einer Drag-Buchung: `lock:row` Event mit employeeId senden
- [ ] Andere Clients: Zeile visuell sperren (Cursor not-allowed + leichte Abdunklung)
- [ ] Nach Drag-Ende: `unlock:row` Event senden
- [ ] Lock timeout: 30 Sekunden (falls Browser crasht ohne unlock)

## Socket.io Events

### Client → Server
```
allocation:change  { employeeId, dateStr, allocationType }
settings:change    { type: 'employees'|'pis'|'feiertage'|'schulferien'|'blocker'|'teamZielwerte', data: [] }
lock:row           { employeeId, userName }
unlock:row         { employeeId }
```

### Server → Client (broadcast)
```
allocation:change  { employeeId, dateStr, allocationType }
settings:change    { type, data }
lock:row           { employeeId, userName }
unlock:row         { employeeId }
state:full         SavedProjectState  (nur an neuen Client)
```

## Technische Details

### State Manager
```typescript
// server/state-manager.ts
import type { SavedProjectState } from '../src/types';

let currentState: SavedProjectState = getInitialState();

export function getState(): SavedProjectState { return currentState; }
export function setState(s: SavedProjectState): void { currentState = s; }
export function applyAllocationChange(employeeId, dateStr, type): void { ... }
export function applySettingsChange(changeType, data): void { ... }
```

### useSocket Hook
```typescript
// src/hooks/useSocket.ts
export function useSocket(onAllocationChange, onSettingsChange, onLockChange) {
  const socket = useRef(io('http://localhost:3001'));
  // eingehende Events → Callbacks
  // ausgehende Events → emitAllocationChange(), emitSettingsChange()
  return { emitAllocationChange, emitSettingsChange, emitLock, emitUnlock, isConnected }
}
```

### Initialload (ersetzt Seed)
```typescript
// App.tsx: useEffect beim Start
useEffect(() => {
  fetch('/api/state')
    .then(r => r.json())
    .then(state => {
      setEmployees(state.employees);
      setPis(state.pis);
      // ...
    });
}, []);
```

### Loop-Verhinderung
- Eingehende Events setzen State direkt (setState) ohne neues Event zu senden
- Flag `isRemoteUpdate` verhindert dass der useEffect auf State-Änderungen erneut emittet

## Abhängigkeiten
- server.ts: Socket.io bereits vorhanden ✅
- types.ts: SavedProjectState bereits vorhanden ✅
- package.json: socket.io + socket.io-client bereits vorhanden ✅

## Reihenfolge der Implementierung
1. `server/state-manager.ts` erstellen
2. `server.ts` erweitern (REST + Socket Events)
3. `src/hooks/useSocket.ts` erstellen
4. `App.tsx` anpassen (Initialload + Socket-Integration)
5. Header: Verbindungsindikator
6. CalendarGrid: Row-Locking visuell

## Risiken
- **CORS**: Vite-Port wechselt (autoPort) → Socket.io CORS-Origin muss flexibel sein
- **State-Grösse**: Bei vielen Buchungen kann der State gross werden → kein Problem für In-Memory
- **Gleichzeitige Schreibkonflikte**: Zwei User buchen exakt gleiche Zelle gleichzeitig → Last-Write-Wins (akzeptabel für diesen Use Case)

## Status
- [ ] Design: abgeschlossen
- [x] Implementierung: abgeschlossen
- [ ] Tests: offen (nicht automatisiert)

## Session-Typ: IMPL (komplex — eigene Session, Rate-Limit beachten)
## Geschätzte Dauer: 45–60 Minuten im Code-Tab
