# Pflichtenheft – SAFe PI Capacity Planner
**Version:** 1.0  
**Stand:** 29.04.2026  
**Erstellt für:** BIT – Bundesamt für Informatik und Telekommunikation  
**Zielgruppe:** Entwickler (Onboarding, lokales Setup, Architekturüberblick)

> Dieses Dokument konsolidiert die technischen Entwicklerinformationen aus `AI.md` und `installationshandbuch_v1.0.md`. Bei Widersprüchen gilt `AI.md` (Architektur) bzw. `STATUS.md` (Implementierungsstatus).

---

## 1. Projektkontext

Der **SAFe PI Capacity Planner** ist eine Fullstack-Webanwendung zur Kapazitätsplanung für SAFe PI Planning in der Schweizer Bundesverwaltung (BIT). Die App berechnet verfügbare Story Points pro Team und Iteration unter Berücksichtigung von Absenzen, Feiertagen, Schulferien und Betriebsaufgaben.

| Eigenschaft | Wert |
|-------------|------|
| Zielbenutzer | IT-Manager, Scrum Master, Chapter Leads (BIT) |
| Frontend (Produktion) | https://safe-pi-capacity-planner.vercel.app |
| Backend (Produktion) | https://safe-pi-planner-backend.railway.app |
| GitHub-Repo | https://github.com/ducatuzzo/safe-pi-capacity-planner |
| Branch | `master` (Auto-Deploy auf Vercel) |

---

## 2. Voraussetzungen

| Komponente | Mindestversion | Prüfbefehl |
|------------|---------------|------------|
| Node.js | ≥ 20.x LTS | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| Git | beliebig | `git --version` |
| Browser | Chrome / Edge (aktuell) | — |

---

## 3. Ordnerstruktur

```
safe-pi-planner/                        ← Context Engineering Root (kein Code)
├── AI.md                               ← Architektur, Datenmodell, Konventionen (führend)
├── PRD.md                              ← Product Requirements, Feature-Liste (führend)
├── STATUS.md                           ← Implementierungsstatus (führend)
├── CLAUDE.md                           ← Session-Referenz für AI-Entwicklungspartner
├── docs/
│   ├── pflichtenheft_v1.0.md           ← dieses Dokument
│   ├── installationshandbuch_v1.0.md   ← Kurzreferenz für Endanwender-Installation
│   ├── deployment_handbuch_v1.0.md     ← Deployment-Optionen (Lokal / LAN / Cloud)
│   └── benutzerdokumentation_v1.7.md   ← Bedienungsanleitung für Endanwender
├── features/                           ← Feature-Spezifikationen (feature-XX.md)
├── decisions/
│   └── log.md                          ← Architekturentscheidungen (chronologisch)
└── safe-pi-capacity-planner/           ← App-Code (Unterordner!)
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── server.ts                        ← Express + Socket.io Einstiegspunkt
    ├── server/
    │   └── tenant-manager.ts            ← Tenant-Verwaltung, State-Dateien, Migration
    ├── src/
    │   ├── index.tsx                    ← React-Einstiegspunkt
    │   ├── index.css                    ← CSS Custom Properties (Swiss DS Tokens)
    │   ├── App.tsx                      ← Root-Komponente, Routing, Socket.io-Init
    │   ├── types.ts                     ← ALLE Interfaces (keine any erlaubt)
    │   ├── constants.ts                 ← TEAM_COLORS_HEX, AllocationType-Labels etc.
    │   ├── assets/
    │   │   └── bundeslogo.svg           ← Logo (negativ, weiss auf transparent)
    │   ├── components/
    │   │   ├── planung/                 ← Kalender-Grid, Drag-Buchung
    │   │   ├── kapazitaet/             ← SP-Berechnung pro Mitarbeiter/Team
    │   │   ├── dashboard/              ← KPI-Karten, BarChart, Absenz-Tabelle, Lücken
    │   │   ├── pidashboard/            ← SP-Vergleich Jira vs. App (PIDashboardView etc.)
    │   │   ├── settings/               ← Einstellungen-Tab (Mitarbeiter, PI, Feiertage …)
    │   │   └── admin/                  ← Train-Verwaltung, Reset, Code-Änderung
    │   ├── hooks/
    │   │   ├── usePIDashboard.ts       ← Datenaggregation PI Dashboard
    │   │   └── …                       ← weitere Custom Hooks
    │   └── utils/                      ← pure Hilfsfunktionen (SP-Berechnung, Datumslogik)
    ├── public/
    │   ├── fonts/                       ← NotoSans TTF (selbst-gehostet, kein CDN)
    │   └── docs/                        ← Dokumente für In-App-Download
    └── data/                            ← JSON-State-Dateien (Runtime, nicht committen)
        ├── tenants.json                 ← Tenant-Registry
        └── state_{tenantId}.json        ← isolierter State pro Train
```

> **Wichtig:** Der App-Code liegt im **Unterordner** `safe-pi-capacity-planner/`. Alle `npm`-Befehle müssen in diesem Unterordner ausgeführt werden. Vercel und Railway sind entsprechend konfiguriert.

---

## 4. Packages (`package.json`)

### 4.1 Produktions-Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `react` | ^19.0.0 | UI-Framework |
| `react-dom` | ^19.0.0 | React DOM-Renderer |
| `express` | ^5.0.0 | HTTP-Server / REST-API (Backend) |
| `socket.io` | ^4.8.0 | Echtzeit-Kommunikation (Backend → Clients) |
| `socket.io-client` | ^4.8.0 | Echtzeit-Kommunikation (Frontend) |
| `recharts` | ^2.13.0 | Diagramme (BarChart, PieChart im Dashboard) |
| `jspdf` | ^2.5.2 | PDF-Export |
| `html2canvas` | ^1.4.1 | Screenshot-to-Canvas für PNG/PDF-Export |
| `lucide-react` | ^0.469.0 | Icon-Bibliothek |
| `bcryptjs` | ^3.0.3 | Passwort-Hashing für Admin-Code |

### 4.2 Dev-Dependencies

| Package | Version | Zweck |
|---------|---------|-------|
| `vite` | ^6.0.0 | Build-Tool, Dev-Server (Port 5173) |
| `@vitejs/plugin-react` | ^4.3.0 | Vite-Plugin für React/JSX |
| `typescript` | ^5.7.0 | Typprüfung |
| `tsx` | ^4.19.0 | TypeScript-Ausführung für Node.js (Backend Dev) |
| `concurrently` | ^9.0.0 | Frontend + Backend gleichzeitig starten |
| `tailwindcss` | ^3.4.17 | Utility-CSS-Framework |
| `autoprefixer` | ^10.4.20 | PostCSS-Plugin für CSS-Präfixe |
| `postcss` | ^8.4.49 | CSS-Prozessor (Tailwind-Pipeline) |
| `eslint` | ^9.0.0 | Linting |
| `@typescript-eslint/parser` | ^8.0.0 | TypeScript-ESLint-Integration |
| `@typescript-eslint/eslint-plugin` | ^8.0.0 | TypeScript-ESLint-Regeln |
| `eslint-plugin-react-hooks` | ^5.0.0 | React-Hooks-Linting |
| `@types/*` | verschieden | TypeScript-Typdeklarationen |

> **Regel:** Keine neuen Packages ohne explizite Freigabe. Alles über `npm install` im App-Unterordner.

---

## 5. Umgebungsvariablen

### 5.1 Lokal (`.env` im App-Unterordner)

```env
# VITE_BACKEND_URL LEER LASSEN für lokale Entwicklung.
# Vite-Proxy leitet /api und /socket.io automatisch an localhost:3001 weiter.
VITE_BACKEND_URL=
```

> `.env` ist in `.gitignore` — nie committen.

### 5.2 Vercel (Produktions-Frontend)

| Variable | Wert | Beschreibung |
|----------|------|-------------|
| `VITE_BACKEND_URL` | `https://safe-pi-planner-backend.railway.app` | Railway-Backend-URL für direkten Socket.io-Connect |

Setzen unter: Vercel → Projekt → Settings → Environment Variables

### 5.3 Railway (Produktions-Backend)

| Variable | Wert | Beschreibung |
|----------|------|-------------|
| `PORT` | automatisch | Von Railway gesetzt (nicht manuell setzen) |
| `DEFAULT_ADMIN_CODE` | `000815` | Demo-Train Initial-Admincode |

### 5.4 Proxy-Logik (wie Frontend die Backend-URL findet)

```
Lokal:       VITE_BACKEND_URL="" → window.location.origin → Vite-Proxy → localhost:3001
Produktion:  VITE_BACKEND_URL="https://…railway.app" → direkter Socket.io-Connect
```

---

## 6. Lokales Setup – Schritt für Schritt

### Schritt 1: Repository klonen

```bash
git clone https://github.com/ducatuzzo/safe-pi-capacity-planner.git
cd safe-pi-capacity-planner/safe-pi-capacity-planner
```

### Schritt 2: Abhängigkeiten installieren

```bash
npm install
```

Ergebnis: `node_modules/` mit allen Frontend- und Backend-Paketen.

### Schritt 3: Umgebungsvariable setzen

Datei `.env` im Verzeichnis `safe-pi-capacity-planner/` erstellen:

```env
VITE_BACKEND_URL=
```

> Leer lassen — der Vite-Proxy übernimmt die Weiterleitung zu Port 3001.

### Schritt 4: App starten

```bash
npm run dev
```

Startet gleichzeitig:
- **Vite Frontend:** http://localhost:5173
- **Express Backend:** http://localhost:3001

### Schritt 5: App im Browser öffnen

```
http://localhost:5173
```

Beim ersten Start: Demo-Train auswählen oder neu anlegen (Admin-Code: `000815`).

### Schritt 6: Demo-Daten importieren (optional)

Im Tab **Einstellungen → Backup & Restore → Import** eine der Demo-CSV-Dateien laden:

| Datei | Inhalt |
|-------|--------|
| `mitarbeiterstamm.csv` | Demo-Mitarbeiter (4 Teams: NET, ACM, CON, PAF) |
| `gesetzliche_feiertage.csv` | Feiertage Schweiz |
| `schulferien.csv` | Schulferienperioden |
| `pi_planung_iterationen.csv` | PI-Planung |
| `blocker_spezielle_perioden.csv` | Blocker/Change-Freeze |

---

## 7. npm-Scripts Referenz

| Script | Befehl | Beschreibung |
|--------|--------|-------------|
| Dev (Full) | `npm run dev` | Frontend (5173) + Backend (3001) gleichzeitig via `concurrently` |
| Dev Frontend | `npm run dev:client` | Nur Vite (kein Backend) |
| Dev Backend | `npm run dev:server` | Nur Express + Socket.io via `tsx watch` |
| Build | `npm run build` | TypeScript-Prüfung + Vite-Build → `dist/` |
| Lint | `npm run lint` | ESLint mit 0 Warnings-Toleranz |
| Preview | `npm run preview` | Lokale Vorschau des Produktions-Builds |

> **Vercel Build Command:** `npx vite build` (nicht `npm run build`) — `vite` liegt in devDependencies, daher `npx`.

---

## 8. Techstack im Detail

### 8.1 Frontend

| Technologie | Rolle | Konfiguration |
|-------------|-------|--------------|
| React 19 | UI-Framework | `src/App.tsx` als Root |
| TypeScript 5.7 | Typsicherheit | `tsconfig.json` (strict mode) |
| Vite 6 | Build-Tool, Dev-Server | `vite.config.ts` |
| Tailwind CSS 3.4 | Utility-CSS | `tailwind.config.js`, CSS-Custom-Props in `src/index.css` |
| Recharts 2.13 | Diagramme | im Dashboard und PI Dashboard |
| Socket.io-Client 4.8 | Echtzeit-Sync | via `useTenant`-Hook und App.tsx |
| jsPDF + html2canvas | Export | PDF/PNG-Export aus Kalender und PI Dashboard |
| Lucide React | Icons | durchgängig |

### 8.2 Backend

| Technologie | Rolle | Konfiguration |
|-------------|-------|--------------|
| Node.js ≥ 20 | Laufzeitumgebung | — |
| Express 5 | HTTP-Server / REST | `server.ts` |
| Socket.io 4.8 | Echtzeit-Events | `server.ts` |
| tsx 4.19 | TS-Ausführung (Dev) | `npm run dev:server` |
| bcryptjs | Admin-Code-Hashing | `server/tenant-manager.ts` |
| JSON-Dateien | Persistenz (kein DB) | `data/tenants.json`, `data/state_{id}.json` |

### 8.3 Architektur-Entscheidungen (Zusammenfassung)

- **Kein Redux:** State via React `useState`/`useReducer`
- **Keine externe Datenbank:** JSON-File-Persistenz (Begründung: Einfachheit, kein Infra-Overhead)
- **Kein localStorage für Server-kritische Daten:** piTeamTargets und alle AppData-Felder leben im Server-State (→ decisions/log.md 07.04.2026)
- **Kein CDN für Fonts:** NotoSans selbst-gehostet in `public/fonts/` (Datenschutz Bund)

---

## 9. Ports und Netzwerk

| Dienst | Port | Konfiguration |
|--------|------|--------------|
| Vite Frontend (Dev) | 5173 | `vite.config.ts` → `server.port` |
| Express Backend | 3001 | `server.ts` → `const PORT` |
| Produktions-Frontend | 443 (HTTPS) | Vercel |
| Produktions-Backend | 443 (HTTPS) | Railway |

### Vite-Proxy (lokal)

```typescript
// vite.config.ts
proxy: {
  '/api':       { target: 'http://localhost:3001', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:3001', ws: true },
}
```

### CORS (Backend)

```typescript
// server.ts
const CORS_ORIGINS = [
  /^http:\/\/localhost:\d+$/,                        // lokal alle Ports
  'https://safe-pi-capacity-planner.vercel.app',     // Produktions-Frontend
];
```

---

## 10. Tenant-Architektur (Mandatenfähigkeit)

Die App unterstützt mehrere Trains (Tenants) mit vollständiger State-Isolation.

| Konzept | Details |
|---------|---------|
| Tenant-Registry | `data/tenants.json` — Liste aller Trains |
| State pro Tenant | `data/state_{tenantId}.json` |
| TenantManager | `server/tenant-manager.ts` — CRUD, Migration, State-Read/Write |
| Socket.io-Rooms | Ein Room pro Tenant → keine Event-Crosskontamination |
| Frontend | `TenantGate` (Splash-Screen), `useTenant`-Hook |
| Rückwärtskompatibilität | Legacy `state.json` → `state_default.json` (automatische Migration beim ersten Start) |

**REST-Endpunkte Backend:**

```
GET    /api/tenants                → Liste aller Tenants
POST   /api/tenants                → Neuen Tenant anlegen
GET    /api/tenants/:id            → Einzelner Tenant
PATCH  /api/tenants/:id            → Tenant aktualisieren
DELETE /api/tenants/:id            → Tenant löschen
POST   /api/tenants/:id/reset      → State zurücksetzen
GET    /api/state?tenantId=...     → AppData lesen
POST   /api/state?tenantId=...     → AppData schreiben
```

---

## 11. Corporate Design Bund – Technische Umsetzung

### CSS Custom Properties (Feature 23, `src/index.css`)

```css
/* Primärfarben-Skala */
--color-primary-50  … --color-primary-900   /* Bundesblau-Töne */
--color-secondary-50 … --color-secondary-900 /* Bundesrot-Töne */

/* Anker-Werte */
--color-primary-700:   #003F7F;   /* Bundesblau (Primärfarbe) */
--color-secondary-500: #E63312;   /* Bundesrot (Sekundärfarbe) */
```

### Tailwind-Aliase (rückwärtskompatibel, nie löschen)

| Alias | Wert | Verwendung |
|-------|------|-----------|
| `bund-blau` | `primary-700` (#003F7F) | Header, Buttons, Badges |
| `bund-rot` | `secondary-500` (#E63312) | Fehler, Heute-Markierung |
| `bund-bg` | #F5F5F5 | Seiten-Hintergrund |
| `bund-text` | #1A1A1A | Standardtext |

### Schrift

```
Frutiger (systemweit BIT) → NotoSans (selbst-gehostet public/fonts/) → Arial
```

### Teamfarben (`src/constants.ts` — Single Source of Truth)

| Team | Hex |
|------|-----|
| NET | #003F7F |
| ACM | #0070C0 |
| CON | #00B050 |
| PAF | #FF6600 |

---

## 12. Konventionen (verbindlich)

| Bereich | Regel |
|---------|-------|
| Sprache UI + Kommentare | Deutsch |
| Sprache Variablen/Typen | Englisch |
| Variablen | camelCase |
| Konstanten | UPPER_SNAKE_CASE |
| Dateinamen | kebab-case (allgemein), PascalCase (React-Komponenten) |
| Interfaces | alle in `src/types.ts` |
| `any` | verboten |
| Inline Styles | verboten (Ausnahme: dynamische Hex-Farben aus FarbConfig) |
| DOM-Manipulation | verboten (nur React-State) |
| localStorage | nur für UI-Preferences (kein Server-kritischer State) |
| npm-Pakete | nur mit expliziter Freigabe |

---

## 13. Bekannte Risiken und Einschränkungen

| Risiko | Beschreibung | Akzeptiert? |
|--------|-------------|-------------|
| JSON-Race-Condition | Gleichzeitige Socket.io-Schreibzugriffe ohne File-Locking | Ja (< 10 gleichzeitige User) |
| Kein Unit-Test-Coverage | SP-Berechnungsfunktionen ungetestet | Offen (vor Feature 22 kritisch) |
| Backup-Schema unversioniert | Datenmodell-Erweiterung erfordert Schema-Migration | Offen (Feature 22) |
| State-Verlust bei Neustart | Kein automatisches Backup — manueller JSON-Export nötig | Akzeptiert (Doku vorhanden) |

---

## 14. Troubleshooting

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Port 5173 belegt | Anderer Vite-Prozess | `npx kill-port 5173` |
| Port 3001 belegt | Anderer Prozess | `npx kill-port 3001` |
| Verbindungsindikator rot | Backend nicht gestartet | `npm run dev:server` separat ausführen |
| State nach Neustart leer | In-memory Backend, kein Backup | JSON-Backup importieren (Einstellungen → Restore) |
| Vercel Build schlägt fehl | Root Directory falsch oder falscher Build-Command | Root Dir: `safe-pi-capacity-planner`, Build: `npx vite build` |
| TypeScript-Fehler beim Build | `any` oder fehlende Typen | Alle Interfaces in `src/types.ts` prüfen |
| ESLint schlägt fehl | Ungenutzte Variablen/Parameter | `noUnusedLocals` + `noUnusedParameters` sind aktiv (strict) |

---

## 15. Dokumentationspflicht

Bei jeder Änderung müssen folgende Dokumente nachgeführt werden:

| Trigger | Dokument |
|---------|----------|
| Neues Feature (User-seitig) | `docs/benutzerdokumentation_vX.Y.md` + `STATUS.md` |
| Infrastruktur/Ports/Pakete | `docs/installationshandbuch_vX.Y.md` + dieses Dokument |
| Neues Datenmodell / AppData | `AI.md` + Benutzerdokumentation |
| Architekturentscheidung | `decisions/log.md` (chronologisch am Ende) |
| Feature abgeschlossen | `PRD.md` Status-Spalte + `STATUS.md` |
| Breaking Change | `docs/deployment_handbuch_vX.Y.md` + Migrationsdoku |

---

## 16. Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|---------|
| 1.0 | 29.04.2026 | Erstveröffentlichung — konsolidiert aus AI.md + installationshandbuch_v1.0.md |
