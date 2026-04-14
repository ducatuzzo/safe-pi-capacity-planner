# CLAUDE.md – Technischer Kompass für Claude Code Sessions

> Dieses Dokument ist das primäre Referenz-Dokument für alle Claude Code Sessions in diesem Projekt.
> Immer zuerst lesen. Ergänzend: AI.md (Architektur), STATUS.md (Stand), features/ (Specs).

## Projekt-Kontext
- **Name:** SAFe PI Capacity Planner (BIT)
- **Typ:** Fullstack-Webanwendung (React + Node.js)
- **Ziel:** Kapazitätsplanung für SAFe PI Planning in der Bundesverwaltung (BIT)
- **App-Pfad:** `safe-pi-capacity-planner/`
- **Context-Pfad:** Wurzel dieses Repos (AI.md, PRD.md, STATUS.md, features/, docs/)
- **Frontend-Deployment:** https://safe-pi-capacity-planner.vercel.app (Vercel, Auto-Deploy via GitHub master)
- **Backend-Deployment:** Railway → URL nach Setup in AI.md und Vercel-Env-Var eintragen
- **Vercel Root Directory:** `safe-pi-capacity-planner` (Unterordner! nicht `./` — kritisch für Build)
- **Vercel Build Command:** `npx vite build` (nicht `vite build`, vite liegt in devDependencies)

## Environment Variables
| Variable | Wo setzen | Wert |
|----------|-----------|------|
| `VITE_BACKEND_URL` | Vercel → Environment Variables | Railway-Backend-URL (z.B. `https://xxx.railway.app`) |
| `VITE_BACKEND_URL` | lokal `.env` | leer lassen (Vite-Proxy übernimmt) |
| `PORT` | Railway → automatisch | wird von Railway gesetzt, kein manueller Eintrag nötig |

- **Demo-Train Initial-Passwort:** `000815` (konfigurierbar via Env-Var `DEFAULT_ADMIN_CODE`) — muss nach erstem Login geändert werden
- Lokal: `VITE_BACKEND_URL` nicht setzen → `window.location.origin` → Vite-Proxy → `localhost:3001`
- Produktion: `VITE_BACKEND_URL=https://xxx.railway.app` in Vercel setzen → direkter Socket.io-Connect
- Template: `safe-pi-capacity-planner/.env.example`

## Techstack (Kurzfassung)
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Express 5, Socket.io, TypeScript, tsx
- Export: jsPDF, html2canvas
- Kein Redux, kein ORM, keine externe Datenbank

## Starten der App
```bash
cd safe-pi-capacity-planner
npm run dev          # Frontend (Port 5173) + Backend (Port 3001) gleichzeitig
npm run dev:client   # nur Vite Frontend
npm run dev:server   # nur Express Backend
```

## Navigations-Tabs (Stand 01.04.2026)
| Tab | Route-Key | Beschreibung |
|-----|-----------|-------------|
| Planung | `planung` | Kalender-Grid mit Drag-Buchung |
| Kapazität | `kapazitaet` | SP-Berechnung pro Mitarbeiter/Team |
| Dashboard | `dashboard` | KPI-Karten, BarChart, Absenz-Tabelle, Lücken |
| PI Dashboard | `pidashboard` | SP-Vergleich Jira vs. App pro PI/Team/Iteration |
| Einstellungen | `settings` | Mitarbeiter, PI-Planung, Feiertage, Zielwerte, Farben |
| Admin | `admin` | Train-Verwaltung, Daten-Reset, Admin-Code ändern (Code-geschützt) |

## PI Dashboard Tab (Feature neu 01.04.2026)
**Pfad:** `src/components/pidashboard/`
**Hook:** `src/hooks/usePIDashboard.ts`

### Spalten der Tabelle
| Spalte | Quelle | Beschreibung |
|--------|--------|-------------|
| Iteration | PIPlanning | Name der Iteration |
| Betriebstage | getWorkingDays() | Arbeitstage Mo–Fr ohne Feiertage |
| SP in Jira | localStorage | Manuell eingetragen, editierbar per Klick |
| Berechnet SP | Formel | Theoretisch: Arbeitstage × SP-Rate × FTE × (1-Betrieb%) × (1-Pauschale%) |
| Verfügbar SP Netto | sp-calculator.ts | Tagesgenau: berücksichtigt Buchungen (FERIEN, ABWESEND etc.) |
| Auslastung Jira % | spJira / verfuegbarSP | Farbcodiert: grün/orange/rot |
| Auslastung App % | berechnetSP / verfuegbarSP | Zeigt Einfluss der Buchungen |

### Farbcodierung Auslastung
- **Grün** (`< 85 %`): Kapazität gut ausgeschöpft
- **Orange** (`85–100 %`): Achtung, nah an der Kapazitätsgrenze
- **Rot** (`> 100 %`): Überlastet

### localStorage
- Key: `pi-dashboard-sp-jira-v1`
- Format: JSON-Objekt `{ "${piId}::${iterationId}::${team}": number }`
- Wird NICHT auf den Server synchronisiert (lokale Planung)

## Wichtige Konventionen
- Sprache: Deutsch (UI + Kommentare), Englisch (Variablen/Typen)
- Alle Interfaces in `src/types.ts` (kein `any`)
- Keine inline styles – nur Tailwind-Klassen
- Teamfarben: NET `#003F7F`, ACM `#0070C0`, CON `#00B050`, PAF `#FF6600`
- CD Bund Primärfarbe: `#003F7F` (Bundesblau), Klasse `text-bund-blau`, `bg-bund-blau`

## Dokumentationspflicht
Bei jeder Änderung die folgende Bereiche betrifft:
- Neues Feature → `features/feature-XX.md` + `STATUS.md` + `docs/benutzerdokumentation_vX.Y.md`
- Infrastruktur/Ports → `docs/installationshandbuch_vX.Y.md`
- Entscheidung → `decisions/log.md`

## Verbote
- Keine npm-Pakete ohne explizite Freigabe
- Kein `any` in TypeScript
- Keine direkten DOM-Manipulationen
- Kein localStorage für Server-kritische Daten (SP in Jira = UI-Präferenz, erlaubt)
- Keine CDN-Fonts (Datenschutz Bund)
