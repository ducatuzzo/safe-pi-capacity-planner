# Claude Code Prompt: Feature 18 + 19 — Mandatenfähigkeit (Tenant-Model + Admin-Bereich)

## Kontext
Du arbeitest am Projekt **SAFe PI Capacity Planner** (BIT, Schweizer Bundesverwaltung).

**Lies zuerst diese Dateien — in dieser Reihenfolge, bevor du irgendetwas implementierst:**
1. `C:\Users\Davide\Documents\AI\safe-pi-planner\AI.md`
2. `C:\Users\Davide\Documents\AI\safe-pi-planner\CLAUDE.md`
3. `C:\Users\Davide\Documents\AI\safe-pi-planner\STATUS.md`
4. `C:\Users\Davide\Documents\AI\safe-pi-planner\features\feature-18-tenant-model.md`
5. `C:\Users\Davide\Documents\AI\safe-pi-planner\features\feature-19-admin-bereich.md`
6. `safe-pi-capacity-planner/server.ts`
7. `safe-pi-capacity-planner/server/state-manager.ts`
8. `safe-pi-capacity-planner/src/hooks/useSocket.ts`
9. `safe-pi-capacity-planner/src/App.tsx`
10. `safe-pi-capacity-planner/src/types.ts`
11. `safe-pi-capacity-planner/src/components/layout/Header.tsx`
12. `safe-pi-capacity-planner/src/components/layout/TabNav.tsx`

---

## Aufgabe

Implementiere **Feature 18 (Tenant-Model)** und **Feature 19 (Admin-Bereich)** vollständig und fehlerfrei.

**Arbeite strikt in dieser Reihenfolge. Schliesse jeden Schritt ab bevor du zum nächsten gehst.**

---

## Schritt 1: npm-Abhängigkeit installieren

```bash
cd safe-pi-capacity-planner
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Verifiziere danach dass `bcryptjs` in `package.json` unter `dependencies` erscheint.

---

## Schritt 2: Backend — `server/tenant-manager.ts` (NEU)

Erstelle die Datei `safe-pi-capacity-planner/server/tenant-manager.ts`.

**Exakte Anforderungen:**

```typescript
// Interfaces
export interface TenantMeta {
  id: string;           // z.B. "ps-net" — Regex /^[a-z0-9-]{2,20}$/
  name: string;         // z.B. "PS-NET Train"
  adminCodeHash: string;// bcryptjs.hashSync(adminCode, 10)
  createdAt: string;    // new Date().toISOString()
}
```

**Datei-Pfade:**
- `tenants.json` liegt im gleichen DATA_DIR wie `state.json` (Railway: `/app/data`, lokal: `../data`)
- Tenant-State: `state_{tenantId}.json` im gleichen DATA_DIR
- Migrationslogik beim Start: Falls `state.json` existiert aber `tenants.json` nicht → Default-Tenant `default` mit Name `"Standard-Train"` und Admin-Code-Hash von `"admin1"` anlegen, `state.json` → `state_default.json` kopieren (nicht löschen)

**Exportierte Funktionen:**
```typescript
export function listTenants(): Omit<TenantMeta, 'adminCodeHash'>[]
export function getTenant(tenantId: string): TenantMeta | null
export function createTenant(id: string, name: string, adminCode: string): Omit<TenantMeta, 'adminCodeHash'>
export function verifyAdminCode(tenantId: string, code: string): boolean
export function getTenantState(tenantId: string): SavedProjectState
export function setTenantState(tenantId: string, state: SavedProjectState): void
export function applyTenantAllocationChange(tenantId: string, employeeId: string, dateStr: string, type: AllocationType): void
export function applyTenantSettingsChange(tenantId: string, changeType: string, data: unknown): void
export function resetTenantState(tenantId: string): void
export function updateTenant(tenantId: string, updates: { name?: string; newAdminCode?: string }): void
```

**Tenant-ID-Validierung:** `/^[a-z0-9-]{2,20}$/` — wirf Error wenn ungültig.

**State-Caching:** In-memory Map `<tenantId, SavedProjectState>` — beim ersten Zugriff aus Datei laden, dann im Cache halten. Bei Mutation: Cache + Datei synchron aktualisieren.

**Migration in-memory State aus state-manager.ts:** Die bestehende `applyAllocationChange` und `applySettingsChange` Logik aus `state-manager.ts` vollständig in `applyTenantAllocationChange` und `applyTenantSettingsChange` übernehmen (inklusive aller switch-cases, Migrations-Defaults, deprecated teamZielwerte-Handling).

---

## Schritt 3: Backend — `server.ts` anpassen

**Ergänze/ändere folgende Teile in `server.ts`:**

### Imports
```typescript
import {
  listTenants, getTenant, createTenant, verifyAdminCode,
  getTenantState, setTenantState,
  applyTenantAllocationChange, applyTenantSettingsChange,
  resetTenantState, updateTenant
} from './server/tenant-manager';
```

### Rate-Limiter (in-memory, nach Imports)
```typescript
const adminFailedAttempts = new Map<string, { count: number; lockedUntil?: number }>();
function checkRateLimit(tenantId: string): boolean { /* max 3 Versuche, 60s Sperre */ }
function recordFailedAttempt(tenantId: string): void { /* count++, bei count>=3 lockedUntil=now+60000 */ }
function resetAttempts(tenantId: string): void { /* löschen nach Erfolg */ }
```

### Neue REST-Endpoints (BEFORE der Socket.io-Sektion)

```
GET  /api/tenants                         → listTenants() (ohne adminCodeHash)
POST /api/tenants                         → createTenant(id, name, adminCode) mit Validierung
GET  /api/tenants/:tenantId/state         → getTenantState(tenantId)
POST /api/tenants/:tenantId/state         → setTenantState + io.to('tenant:'+id).emit('state:full')
POST /api/tenants/:tenantId/reset         → verifyAdminCode + resetTenantState + emit state:full
PATCH /api/tenants/:tenantId              → verifyAdminCode + updateTenant(name, newAdminCode)
```

**Fehlerbehandlung:**
- Tenant nicht gefunden → 404
- Rate-Limit überschritten → 429 mit `{ error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' }`
- Admin-Code falsch → 401 mit `{ error: 'Admin-Code ungültig' }`
- Tenant-ID-Format ungültig → 400

### Legacy-Endpoints (BEHALTEN, leiten auf Default-Tenant)
```typescript
app.get('/api/state', (_req, res) => res.json(getTenantState('default')));
app.post('/api/state', (req, res) => { setTenantState('default', req.body); io.to('tenant:default').emit('state:full', getTenantState('default')); res.json({ ok: true }); });
```

### Socket.io — Tenant-Room-System

**Neues Event: `tenant:join`**
```typescript
socket.on('tenant:join', (payload: { tenantId: string }) => {
  // Alle bestehenden Rooms verlassen
  socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room); });
  socket.join('tenant:' + payload.tenantId);
  socket.emit('state:full', getTenantState(payload.tenantId));
});
```

**Alle bestehenden Events auf Tenant-Room umstellen:**
- `allocation:change`: `applyTenantAllocationChange(tenantId, ...)`, dann `socket.to('tenant:'+tenantId).emit(...)`
- `settings:change`: `applyTenantSettingsChange(tenantId, ...)`, dann `socket.to('tenant:'+tenantId).emit(...)`
- `lock:row` / `unlock:row`: `socket.to('tenant:'+tenantId).emit(...)`

**TenantId aus Socket-Room ermitteln:**
```typescript
function getTenantIdFromSocket(socket: Socket): string {
  for (const room of socket.rooms) {
    if (room.startsWith('tenant:')) return room.replace('tenant:', '');
  }
  return 'default';
}
```

**Beim `connection`-Event: NICHT mehr sofort `state:full` senden** — das passiert jetzt erst nach `tenant:join`.

---

## Schritt 4: Frontend — `src/types.ts` erweitern

Füge hinzu:
```typescript
export interface TenantInfo {
  id: string;
  name: string;
  createdAt: string;
}

export type ActiveTab = 'planung' | 'kapazitaet' | 'dashboard' | 'pidashboard' | 'settings' | 'admin';
```

---

## Schritt 5: Frontend — `src/hooks/useTenant.ts` (NEU)

```typescript
// sessionStorage-Key: 'pi-planner-tenant'
// Speichert: JSON { tenantId: string, tenantName: string }

export function useTenant(): {
  tenantId: string | null;
  tenantName: string;
  setTenant: (id: string, name: string) => void;
  clearTenant: () => void;
}
```

- `setTenant` schreibt in sessionStorage und triggert `window.location.reload()`
- `clearTenant` löscht sessionStorage-Key und triggert `window.location.reload()`
- Gibt `null` zurück wenn kein Tenant gesetzt

---

## Schritt 6: Frontend — `src/hooks/useSocket.ts` anpassen

**Ergänze Parameter:**
```typescript
interface UseSocketOptions {
  tenantId: string;          // NEU
  onAllocationChange: ...;
  onSettingsChange: ...;
  onLockChange: ...;
  onStateLoad: ...;
}
```

**Nach `connect`-Event:**
```typescript
socket.on('connect', () => {
  setIsConnected(true);
  socket.emit('tenant:join', { tenantId });  // NEU
});
```

**Beim Reconnect ebenfalls `tenant:join` senden** (Socket.io reconnect-Event behandeln).

**ACHTUNG:** `state:full` kommt jetzt als Antwort auf `tenant:join`, nicht mehr direkt bei `connection`. Das bestehende `socket.on('state:full', ...)` bleibt unverändert.

---

## Schritt 7: Frontend — `src/components/tenant/TenantGate.tsx` (NEU)

**CD-Bund-Design. Anforderungen:**

```
┌─────────────────────────────────────────┐
│  [Bundeslogo]                           │
│  SAFe PI Capacity Planner               │
│  Bundesamt für Informatik               │
│                                         │
│  Train auswählen                        │
│  ┌─────────────────────────────────┐    │
│  │  [PS-NET Train              ▼]  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Weiter →]                             │
│                                         │
│  + Neuen Train anlegen                  │
└─────────────────────────────────────────┘
```

- Lädt `GET /api/tenants` beim Mount (mit Loading-State und Fehlerbehandlung)
- Falls keine Tenants → zeigt "Noch kein Train vorhanden" + nur "Neuen Train anlegen"
- "Neuen Train anlegen" → InlineFormular: Train-ID, Train-Name, Admin-Code (6-stellig)
  - POST zu `/api/tenants` → bei Erfolg: Tenant auswählen und Weiter
- "Weiter" → `setTenant(selectedId, selectedName)` → App startet
- Background: `bg-bund-bg`, Karte: weiss, Bundesblau-Akzente
- Logo: `src/assets/bundeslogo.svg` (falls verfügbar, sonst Text-Fallback)

---

## Schritt 8: Frontend — `App.tsx` anpassen

```typescript
// Ganz oben in der Komponente:
const { tenantId, tenantName, clearTenant } = useTenant();

// Vor allem anderen rendern:
if (!tenantId) return <TenantGate />;

// tenantId an useSocket weitergeben:
const { ... } = useSocket({
  tenantId,          // NEU
  onAllocationChange: ...,
  ...
});

// Admin-Tab rendern:
{activeTab === 'admin' && <AdminView tenantId={tenantId} tenantName={tenantName} />}
```

---

## Schritt 9: Frontend — `src/components/layout/Header.tsx` anpassen

- Props erweitern: `tenantName: string`, `onSwitchTenant: () => void`
- Train-Name als Badge oder Subtitle unterhalb des Haupttitels anzeigen
- Kleiner "Train wechseln"-Link (Pfeil-Icon, `clearTenant()`) rechts neben Verbindungsindikator
- Beispiel-UI: `[●] Verbunden  |  PS-NET Train  [⇄]`

---

## Schritt 10: Frontend — `src/components/layout/TabNav.tsx` anpassen

- Neuer Tab `admin` (Key: `'admin'`, Label: `'Admin'`, Icon: `Shield` aus lucide-react)
- Tab wird IMMER angezeigt (kein Verstecken)
- Tab sieht gleich aus wie alle anderen Tabs (kein spezielles Styling nötig)
- `ActiveTab` aus `types.ts` ist bereits erweitert (Schritt 4)

---

## Schritt 11: Frontend — `src/components/admin/AdminGate.tsx` (NEU)

**OTP-Style Modal für Admin-Code-Eingabe:**

```
┌──────────────────────────────────────┐
│  🔒 Admin-Zugang                     │
│                                      │
│  [_] [_] [_] [_] [_] [_]            │
│  6-stelliger Admin-Code eingeben     │
│                                      │
│  [Bestätigen]    [Abbrechen]         │
│                                      │
│  ⚠ Falscher Code. 2 Versuche verbleibend │
└──────────────────────────────────────┘
```

- 6 einzelne `<input maxLength={1}>` Felder
- Auto-Focus: nach Eingabe eines Zeichens springt Fokus zum nächsten Feld
- Backspace: löscht aktuelles Feld und springt zurück
- Paste: verteilt automatisch auf alle 6 Felder
- "Bestätigen" → ruft `onSubmit(code)` callback auf
- Props: `onSubmit: (code: string) => Promise<{ ok: boolean; error?: string }>`, `onCancel: () => void`
- Fehlermeldung wird von `onSubmit` zurückgegeben und angezeigt
- Merkt sich Code in `sessionStorage['pi-planner-admin-code']` für 15 Minuten
  (Zeitstempel mitgespeichert: `{ code, expiresAt: Date.now() + 15*60*1000 }`)
- Beim Mount: prüft ob gültiger Code in sessionStorage → falls ja, direkt `onSubmit` aufrufen

---

## Schritt 12: Frontend — `src/components/admin/AdminView.tsx` (NEU)

**Drei Sektionen. CD-Bund-Design:**

### Sektion 1: Aktueller Train
```
Train-ID:    ps-net
Train-Name:  PS-NET Train          [Umbenennen]
Erstellt:    09.04.2026
```

### Sektion 2: Weitere Trains
Tabelle mit allen Tenants aus `GET /api/tenants`:
- ID, Name, Erstellt
- Button "Zu diesem Train wechseln" → `setTenant(id, name)`
- Button "+ Neuen Train anlegen" → Modal: Train-ID, Train-Name, Admin-Code

### Sektion 3: Gefährliche Aktionen (roter Rahmen, `border-red-300 bg-red-50`)

**"Alle Daten löschen":**
- Klick → Bestätigungs-Dialog: `input` wo User "LÖSCHEN" eintippen muss
- Dann AdminGate für Code-Eingabe
- POST zu `/api/tenants/:id/reset` mit `{ adminCode }`
- Bei Erfolg: Seite neu laden

**"Admin-Code ändern":**
- Formular: neuer Code (2× eingeben zur Bestätigung)
- AdminGate für alten Code
- PATCH zu `/api/tenants/:id` mit `{ adminCode: altCode, newAdminCode: neuerCode }`
- Bei Erfolg: Erfolgsmeldung

**Props:** `tenantId: string`, `tenantName: string`

---

## Regeln (UNBEDINGT einhalten)

1. **Kein `any` in TypeScript** — alle Typen explizit
2. **Keine neuen npm-Pakete** ausser `bcryptjs` (bereits in Schritt 1 installiert)
3. **Keine inline styles** — nur Tailwind-Klassen
4. **Keine direkten DOM-Manipulationen** — nur React-State
5. **Bestehende Funktionalität nicht brechen** — alle bestehenden Features (Planung, Kapazität, Dashboard, PI-Dashboard, Einstellungen, Backup/Restore) müssen nach der Implementierung vollständig funktionieren
6. **Legacy `/api/state`-Endpoint MUSS erhalten bleiben** (Rückwärtskompatibilität)
7. **Nach jedem Schritt TypeScript-Fehler prüfen:** `cd safe-pi-capacity-planner && npx tsc --noEmit`
8. **Sprache:** UI-Texte auf Deutsch, Variablen/Funktionen auf Englisch

---

## Akzeptanzkriterien (prüfen wenn alles implementiert)

### Feature 18
- [ ] `npm run dev` startet ohne Fehler
- [ ] `npx tsc --noEmit` gibt 0 Fehler
- [ ] App zeigt beim ersten Aufruf den TenantGate
- [ ] TenantGate lädt Tenants via GET /api/tenants
- [ ] Tenant auswählen + Weiter → normale App startet
- [ ] Header zeigt Train-Namen
- [ ] "Train wechseln" → zurück zu TenantGate
- [ ] Zwei Browser-Tabs mit verschiedenen Tenants sehen verschiedene Daten
- [ ] Socket.io Events eines Tenants erreichen nur den gleichen Tenant
- [ ] Legacy /api/state funktioniert noch (leitet auf 'default')
- [ ] Backup-Restore in Einstellungen funktioniert noch

### Feature 19
- [ ] Admin-Tab in Navigation sichtbar
- [ ] Klick → AdminGate öffnet (6-Felder OTP)
- [ ] Falscher Code → Fehlermeldung
- [ ] Richtiger Code → AdminView
- [ ] Innerhalb 15 Minuten: kein erneuter Code-Dialog
- [ ] "Alle Daten löschen" → State wird resettet
- [ ] "Admin-Code ändern" → neuer Code funktioniert
- [ ] "Neuen Train anlegen" → per TenantGate wählbar
- [ ] Rate-Limit: nach 3 Fehlversuchen 60s gesperrt

---

## Nach der Implementierung

Führe aus:
```bash
cd safe-pi-capacity-planner
git add .
git commit -m "FEAT: Mandatenfähigkeit (Feature 18+19) — Tenant-Model + Admin-Bereich"
git push
```

Dann `STATUS.md` aktualisieren: Feature 18 und 19 auf ✅ setzen.
