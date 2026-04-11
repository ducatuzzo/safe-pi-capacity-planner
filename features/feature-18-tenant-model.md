# Feature 18: Tenant-Model (Mandatenfähigkeit — Phase 1)

## Ziel
Der Server verwaltet beliebig viele unabhängige Tenants (Trains). Jeder Tenant hat seinen eigenen isolierten State (`state_{tenantId}.json`). Die App startet mit einer Tenant-Auswahl. Bestehende Single-Tenant-Architektur bleibt vollständig erhalten — Tenants sind rückwärtskompatibel.

## Status
🔲 Geplant

## Abhängigkeiten
- Feature 15 (Multiuser / Socket.io) — Socket-Rooms werden pro Tenant getrennt
- Feature 17 (Team-Config) — jeder Tenant hat eigene TeamConfigs
- server/state-manager.ts — wird zu TenantStateManager erweitert

---

## Architekturentscheidungen

### Tenant-ID Format
- Lowercase alphanumerisch + Bindestrich: `ps-net`, `ps-app`, `ps-db`
- Max. 20 Zeichen
- Validierung per Regex: `/^[a-z0-9-]{2,20}$/`

### State-Datei pro Tenant
```
data/
  state_ps-net.json
  state_ps-app.json
  state_ps-db.json
  tenants.json         ← Registry: alle bekannten Tenants
```

### Socket.io Rooms
- Jeder Client joined genau einen Room: `tenant:{tenantId}`
- `state:full` und alle Mutations werden nur im jeweiligen Room gebroadcastet
- `allocation:change`, `settings:change`, `lock:row`, `unlock:row` bleiben strukturell gleich

### REST-API-Änderungen
```
GET  /api/tenants                   → Liste aller Tenants (id, name, createdAt)
POST /api/tenants                   → Neuen Tenant anlegen { id, name, adminCode }
GET  /api/tenants/:tenantId/state   → State eines Tenants lesen (ersetzt /api/state)
POST /api/tenants/:tenantId/state   → State eines Tenants setzen (Backup-Restore)
```

### Admin-Code (Phase 1, kein echter 2FA)
- Beim Tenant-Anlegen wird ein `adminCode` gesetzt (6-stelliger alphanumerischer Code)
- Code wird als bcrypt-Hash in `tenants.json` gespeichert
- Der Code schützt: Tenant anlegen, State resetten
- Kein Session-Konzept in Phase 1 — Code wird pro Operation mitgeschickt

---

## Backend-Änderungen

### Neue Datei: `server/tenant-manager.ts`
Verantwortlich für:
- Tenant-Registry laden/speichern (`tenants.json`)
- Tenant-State pro Tenant laden/speichern (`state_{tenantId}.json`)
- Tenant validieren (existiert, Admin-Code korrekt)

```typescript
export interface TenantMeta {
  id: string;           // "ps-net"
  name: string;         // "PS-NET Train"
  adminCodeHash: string;// bcryptjs-Hash des Admin-Codes
  createdAt: string;    // ISO-Datum
}

export function listTenants(): TenantMeta[]
export function getTenant(tenantId: string): TenantMeta | null
export function createTenant(id: string, name: string, adminCode: string): TenantMeta
export function verifyAdminCode(tenantId: string, code: string): boolean
export function getTenantState(tenantId: string): SavedProjectState
export function setTenantState(tenantId: string, state: SavedProjectState): void
export function applyTenantAllocationChange(tenantId: string, employeeId: string, dateStr: string, type: AllocationType): void
export function applyTenantSettingsChange(tenantId: string, changeType: string, data: unknown): void
```

### Geänderte Datei: `server.ts`
- Alle Endpoints auf `/api/tenants/:tenantId/...` umschreiben
- Socket.io: `socket.join(`tenant:${tenantId}`)` nach Verbindungsaufbau
- `io.to(`tenant:${tenantId}`).emit(...)` statt `io.emit(...)`
- `socket.to(`tenant:${tenantId}`).emit(...)` statt `socket.broadcast.emit(...)`
- Neuer REST-Endpoint `GET /api/tenants` für Tenant-Liste
- Neuer REST-Endpoint `POST /api/tenants` für Tenant-Anlage (mit Admin-Code)

### Rückwärtskompatibilität
- Legacy-Endpoint `GET /api/state` und `POST /api/state` bleiben erhalten und leiten auf Default-Tenant `default` weiter
- Default-Tenant `default` wird beim ersten Start automatisch angelegt falls `state.json` existiert (Migration)

---

## Frontend-Änderungen

### Neue Datei: `src/components/tenant/TenantGate.tsx`
Splash-Screen der beim App-Start erscheint, falls kein aktiver Tenant in sessionStorage.

**UI:**
- Logo + Titel "SAFe PI Capacity Planner"
- Dropdown oder Kacheln: "Train auswählen" (lädt `/api/tenants`)
- Button "Weiter" → speichert `tenantId` in sessionStorage, startet App
- Link "Neuen Train anlegen" → öffnet Modal (Feature 19)
- CD-Bund-Design

**Logik:**
- `sessionStorage.getItem('pi-planner-tenant')` → falls vorhanden, direkt in App
- Falls leer → TenantGate anzeigen

### Neue Datei: `src/hooks/useTenant.ts`
```typescript
export function useTenant(): {
  tenantId: string;
  tenantName: string;
  clearTenant: () => void;
}
```
- Liest `pi-planner-tenant` aus sessionStorage
- `clearTenant()` löscht sessionStorage und lädt App neu (zurück zu TenantGate)

### Geänderte Datei: `src/hooks/useSocket.ts`
- Nach `connect`-Event: `socket.emit('tenant:join', { tenantId })` senden
- Server joingt daraufhin den Room
- Alle bestehenden Events bleiben strukturell identisch

### Geänderte Datei: `src/components/layout/Header.tsx`
- Tenant-Name im Header anzeigen (Subtitle oder Badge)
- "Train wechseln"-Button → `clearTenant()` aufrufen

### Geänderte Datei: `App.tsx`
- Vor Render: `useTenant()` aufrufen
- Falls kein `tenantId` → `<TenantGate />` rendern statt App
- `tenantId` an `useSocket` weitergeben (für Server-Kommunikation)

---

## npm-Abhängigkeit

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Begründung: Admin-Code-Hash für Tenant-Anlage. Einzige neue Abhängigkeit.

---

## Datenmodell-Erweiterung (types.ts)

```typescript
export interface TenantInfo {
  id: string;
  name: string;
  createdAt: string;
}
```

---

## Akzeptanzkriterien

- [ ] Server startet ohne `tenants.json` → legt Default-Tenant aus altem `state.json` an
- [ ] `GET /api/tenants` gibt Liste aller Tenants zurück
- [ ] `POST /api/tenants` legt neuen Tenant an (mit validiertem Admin-Code)
- [ ] Zwei parallele Browser-Sessions mit unterschiedlichem Tenant sehen verschiedene Daten
- [ ] Socket.io-Events eines Tenants erreichen nur Clients des gleichen Tenants
- [ ] TenantGate erscheint beim ersten App-Aufruf
- [ ] Nach Tenant-Auswahl erscheint die normale App
- [ ] Header zeigt den Train-Namen an
- [ ] "Train wechseln" führt zurück zum TenantGate
- [ ] Backup-Restore funktioniert pro Tenant unabhängig
- [ ] Legacy-Endpoint `/api/state` leitet auf Default-Tenant
- [ ] TypeScript: kein Compilerfehler

---

## Nicht in diesem Feature (kommt in Feature 19)

- Admin-Seite mit Code-Dialog für Reset/Löschen
- Tenant-Umbenennung
- Tenant-Löschen
- TOTP 2FA
- aGov OIDC
