# BUG-04: Persistenter Server-State (JSON-File)

## Status
🔴 Offen

## Klassifikation
**Bug** (kein neues Feature) — Datenverlust bei Server-Neustart oder Browser-Refresh

## Problem
Der `state-manager.ts` hält den gesamten App-State (`SavedProjectState`) rein in-memory:
```ts
let currentState: SavedProjectState = buildInitialState();
```
Konsequenz:
- Jeder Server-Neustart setzt alle Daten auf SEED-Daten zurück
- Browser-Refresh lädt zwar den Server-State neu — aber nur solange der Server noch läuft
- Auf Vercel (Serverless) läuft das Backend gar nicht → kein State, kein Socket.io

## Lösung: Zwei unabhängige Teile

### Teil 1 — JSON-File-Persistenz im state-manager.ts (lokal + Railway)
**Ziel:** State wird bei jeder Änderung in `data/state.json` geschrieben und beim Start daraus geladen.

**Betroffene Datei:** `server/state-manager.ts`

**Änderungen:**
1. `fs` (Node.js built-in) importieren — kein neues npm-Paket nötig
2. Beim Start: `state.json` laden falls vorhanden, sonst SEED-State verwenden
3. Nach jeder Mutation (`setState`, `applyAllocationChange`, `applySettingsChange`): `persistState()` aufrufen
4. `persistState()` schreibt synchron (`writeFileSync`) in `data/state.json`
5. `data/` Verzeichnis anlegen falls nicht vorhanden (`mkdirSync` mit `recursive: true`)

**State-Datei:** `safe-pi-capacity-planner/data/state.json`
- Muss in `.gitignore` eingetragen werden (enthält Produktivdaten, nicht im Repo)
- Wird automatisch erstellt beim ersten Start

**Konkrete Implementierung:**
```ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');

function loadPersistedState(): SavedProjectState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const raw = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as SavedProjectState;
  } catch (err) {
    console.warn('[StateManager] state.json konnte nicht geladen werden:', err);
    return null;
  }
}

function persistState(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[StateManager] Persistierung fehlgeschlagen:', err);
  }
}

let currentState: SavedProjectState = loadPersistedState() ?? buildInitialState();
```

### Teil 2 — Backend-Hosting auf Railway (statt Vercel für Backend)
**Ziel:** Node.js-Server mit Socket.io persistent hosten (Vercel kann das nicht)

**Architektur nach dem Fix:**
- **Frontend:** Vercel (bleibt) → `https://safe-pi-capacity-planner.vercel.app`
- **Backend:** Railway → separater Service (z.B. `https://safe-pi-planner-backend.railway.app`)

**Schritte Railway-Setup:**
1. Account auf `railway.app` erstellen (kostenlos, GitHub-Login)
2. Neues Projekt → "Deploy from GitHub Repo" → `ducatuzzo/safe-pi-capacity-planner`
3. Root Directory: `safe-pi-capacity-planner`
4. Start Command: `node --loader tsx server.ts` oder via `npm run dev:server`
5. Port: Railway erkennt `PORT` Environment Variable automatisch → `server.ts` muss `process.env.PORT` verwenden
6. Volume mounten für `data/state.json` Persistenz (Railway Volumes, kostenpflichtig ab gewissem Volumen — Alternative: JSON in Railway Umgebungsvariable)

**Frontend-Anpassung (Vite/Socket.io):**
- Aktuell verbindet sich der Client auf `window.location.origin` (funktioniert lokal, bricht auf Vercel)
- Nach Fix: Backend-URL via Environment Variable: `VITE_BACKEND_URL=https://safe-pi-planner-backend.railway.app`
- `useSocket.ts` muss `import.meta.env.VITE_BACKEND_URL ?? window.location.origin` verwenden

**CORS-Anpassung in `server.ts`:**
- Aktuell nur `localhost` erlaubt
- Nach Fix: `https://safe-pi-capacity-planner.vercel.app` zur CORS-Whitelist hinzufügen

## Reihenfolge der Umsetzung
1. `server/state-manager.ts` → JSON-Persistenz einbauen (lokal testen)
2. `.gitignore` → `data/state.json` eintragen
3. `server.ts` → `process.env.PORT` verwenden
4. `server.ts` → CORS für Vercel-Domain erweitern
5. `useSocket.ts` → `VITE_BACKEND_URL` Environment Variable einbauen
6. Railway-Deployment einrichten
7. Vercel → `VITE_BACKEND_URL` als Environment Variable setzen → Redeploy

## Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `server/state-manager.ts` | JSON-File lesen/schreiben |
| `server.ts` | `process.env.PORT`, CORS erweitern |
| `src/hooks/useSocket.ts` | `VITE_BACKEND_URL` env var |
| `.gitignore` | `data/state.json` und `data/` eintragen |
| `safe-pi-capacity-planner/.env.example` | `VITE_BACKEND_URL=` dokumentieren |

## Nicht betroffen
- `App.tsx` — keine Änderung
- `src/types.ts` — keine Änderung
- Alle UI-Komponenten — keine Änderung
- Vercel-Konfiguration (Root Directory, Build Command) — bleibt identisch

## Akzeptanzkriterien
- [ ] Server-Neustart → Daten bleiben erhalten (state.json vorhanden)
- [ ] Browser-Refresh → Daten bleiben erhalten
- [ ] Zwei Browser-Fenster → Änderungen synchronisieren sich in Echtzeit
- [ ] Erster Start ohne state.json → SEED-Daten werden geladen und persistiert
- [ ] Backup/Restore (Feature 11) funktioniert weiterhin
- [ ] Vercel Frontend verbindet sich mit Railway Backend

## Risiken
- Railway Free Tier: Service schläft nach Inaktivität ein (ca. 30min) → erster Request langsam
- `data/state.json` auf Railway: Volumes kosten extra → Alternative wäre externes JSON-Store (z.B. JSONBin.io) oder Railway Redis Add-on
- Bei gleichzeitigen Schreibvorgängen (Multiuser): `writeFileSync` ist synchron und blockierend — für 5-10 User akzeptabel, bei mehr User würde eine Queue benötigt

## Dokumentationspflicht nach Abschluss
- `STATUS.md` → BUG-04 als behoben markieren, "Persistenter Server-State" aus Offene Punkte entfernen
- `AI.md` → Deployment-Sektion: Backend-URL Railway ergänzen
- `CLAUDE.md` → Backend-URL und VITE_BACKEND_URL dokumentieren
- `docs/installationshandbuch_vX.Y.md` → Railway-Setup und Environment Variables erklären
