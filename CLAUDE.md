# CLAUDE.md – Technischer Kompass für Claude Code Sessions

> Dieses Dokument ist das primäre Referenz-Dokument für alle Claude Code Sessions in diesem Projekt.
> Immer zuerst lesen. Ergänzend: AI.md (Architektur), STATUS.md (Stand), features/ (Specs).
> Zuletzt synchronisiert: 07.05.2026

## Projekt-Kontext
- **Name:** SAFe PI Capacity Planner (BIT)
- **Typ:** Fullstack-Webanwendung (React + Node.js)
- **Ziel:** Kapazitätsplanung für SAFe PI Planning in der Bundesverwaltung (BIT)
- **App-Pfad:** `safe-pi-capacity-planner/`
- **Context-Pfad:** Wurzel dieses Repos (AI.md, PRD.md, STATUS.md, features/, docs/)
- **Frontend-Deployment:** https://safe-pi-capacity-planner.vercel.app (Vercel, Auto-Deploy via GitHub master)
- **Backend-Deployment:** Railway → URL in AI.md und Vercel-Env-Var
- **Vercel Root Directory:** `safe-pi-capacity-planner` (Unterordner! nicht `./` — kritisch für Build)
- **Vercel Build Command:** `npx vite build` (nicht `vite build`, vite liegt in devDependencies)

## Dokumenten-Hierarchie (verbindlich)
1. **PRD.md** — führend für Feature-Liste und Nummerierung
2. **STATUS.md** — führend für aktuellen Implementierungsstatus
3. **AI.md** — führend für Architektur, Datenmodell, Konventionen
4. **CLAUDE.md** (dieses Dokument) — Kurzreferenz für Session-Start
5. **features/*.md** — Detailspezifikation pro Feature
6. **decisions/log.md** — Entscheidungshistorie (chronologisch)

Bei Widersprüchen gilt die höher nummerierte Quelle.

## Environment Variables
| Variable | Wo setzen | Wert |
|----------|-----------|------|
| `VITE_BACKEND_URL` | Vercel → Environment Variables | Railway-Backend-URL (z.B. `https://xxx.railway.app`) |
| `VITE_BACKEND_URL` | lokal `.env` | leer lassen (Vite-Proxy übernimmt) |
| `PORT` | Railway → automatisch | wird von Railway gesetzt |
| `DEFAULT_ADMIN_CODE` | Railway → Env-Var | Demo-Train Initial-Code `000815` |

- Lokal: `VITE_BACKEND_URL` nicht setzen → `window.location.origin` → Vite-Proxy → `localhost:3001`
- Produktion: `VITE_BACKEND_URL=https://xxx.railway.app` in Vercel setzen → direkter Socket.io-Connect

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

## Navigations-Tabs (Stand 16.04.2026)
| Tab | Route-Key | Beschreibung |
|-----|-----------|-------------|
| Planung | `planung` | Kalender-Grid mit Drag-Buchung |
| Kapazität | `kapazitaet` | SP-Berechnung pro Mitarbeiter/Team |
| Dashboard | `dashboard` | KPI-Karten, BarChart, Absenz-Tabelle, Lücken |
| PI Dashboard | `pidashboard` | SP-Vergleich Jira vs. App pro PI/Team/Iteration |
| Einstellungen | `settings` | Mitarbeiter, PI-Planung, Feiertage, Zielwerte, Farben, Team-Konfiguration, Globale Parameter |
| Admin | `admin` | Train-Verwaltung, Daten-Reset, Admin-Code ändern (Code-geschützt) |

## PI Dashboard Tab
**Pfad:** `src/components/pidashboard/`
**Hook:** `src/hooks/usePIDashboard.ts`

### Datenquelle SP in Jira
- **Server-seitig** in `AppData.piTeamTargets` (NICHT localStorage)
- Format: `PITeamTarget { piId, teamName, spJira }` — editierbar durch PO
- Synchronisiert via Socket.io, enthalten in Backup/Restore
- **Entscheidung:** decisions/log.md 07.04.2026 — localStorage-Ansatz ersetzt

### Farbcodierung Auslastung
- **Grün** (`< 85 %`): Kapazität gut ausgeschöpft
- **Orange** (`85–100 %`): Nah an der Kapazitätsgrenze
- **Rot** (`> 100 %`): Überlastet

## PI-Planung erweitert (Feature 29 v2, Stand 07.05.2026)
**Pfad:** `src/components/settings/PISettings.tsx` (Modal inline, kein separates File), `IterationEditor.tsx`, `ZeremonienEditor.tsx`
**Helpers:** `src/utils/pi-calculator.ts`, `src/utils/state-migration.ts`, `src/utils/ics-export.ts`, `src/utils/pi-xlsx.ts`, `src/utils/calendar-helpers.ts`
**Schema-Version:** 1.4 → 1.5 → **1.6** (`BACKUP_FORMAT_VERSION` und `SavedProjectState.version`)

### Neue Konzepte
- **Wochenbasierte PI-Generierung:** Modal nimmt Startdatum + `iterationWeeks` (1–6) + `iterationCount` (1–10), berechnet Enddatum + alle Iterationen automatisch via `calculateIterationDates()`.
- **PIBlockerWeek:** PI-interne Pause (`{ id, label, afterIterationId, weeks }`). Verschiebt nachfolgende Iterationen + PI-Enddatum. **NICHT verwechseln mit `Blocker`** (Change-Freeze, Wartungsfenster).
- **PIZeremonie + ZeremonieType:** 7 SAFe-Typen (PI_PLANNING, DRAFT_PLAN_REVIEW, FINAL_PLAN_REVIEW, PRIO_MEETING, SYSTEM_DEMO, FINAL_SYSTEM_DEMO, INSPECT_ADAPT). Default-Dauer/Zeit pro Typ in `pi-calculator.ts`. Rein kalendarisch, kein Kapazitäts-Abzug.
- **PIZeremonieRecurrence (Schema 1.6):** Outlook-Style Terminserien — `frequency: DAILY|WEEKLY|MONTHLY`, `interval` (1–99), `count` XOR `until`. Hard-Cap 1000 Instanzen pro Serie.
- **Start/Ende-Datum/Zeit (Schema 1.6):** mehrtägige Termine möglich (z.B. PI Planning 09:00 → Folgetag 17:00).
- **.ics-Export mit RRULE (Schema 1.6):** RFC 5545 konform, client-side Blob (kein Backend, kein npm-Paket). Filename `{PI-Name}_{Typ}_{StartDatum}.ics`. Bei Serien zusätzlich `RRULE`-Property — Outlook/Google/Apple zeigen Serie als einen Eintrag mit allen Wiederholungen.
- **Excel-Workbook .xlsx (Schema 1.6):** 4 Sheets, `xlsx`-Library (SheetJS). Sheet «Zeremonien» mit 14 Spalten inkl. `startDate`/`endDate`/`endTime` und 4 Recurrence-Spalten. Iter-Namen-basiertes Mapping. Import-Dialog mit «Anhängen» / «Überschreiben».

### Planungs-Kalender-Header (6 Zeilen seit F29)
1. Monat / 2. KW / 3. PI / 4. Iteration **oder Blocker-Woche** (gestreift via `.bg-blocker-stripe`) / 5. Zeremonien-Marker (`◆` Einzeltermin, `◈` Serien-Instanz, beide in `text-secondary-500/600`, Hover-Tooltip mit `Serie N/Total`) / 6. Tag

### Migration & Demo-Daten
- `migratePIs()` in `state-migration.ts` läuft 2 Stages in einem Pass:
  - 1.0/1.4 → 1.5: ergänzt fehlende Arrays (`blockerWeeks: []`, `zeremonien: []`); ARTFlow-Demo-PI «PI26-2» wird **einmalig** entfernt (gated via fehlende neue Felder; neu angelegte PIs gleichen Namens bleiben erhalten)
  - 1.5 → 1.6 (`migrateZeremonieToSchema16`): `date + startTime + durationMinutes` → `startDate + endDate + endTime` (idempotent)
- Wirkt sowohl auf `applyServerState()` (App.tsx) als auch auf Backup-Restore
- Schema 1.5 Felder (date, startTime, durationMinutes) bleiben REQUIRED für Backwards-Compat; Schema 1.6 Felder (startDate, endDate, endTime, recurrence) sind OPTIONAL und werden via Migration befüllt

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
- Entscheidung → `decisions/log.md` (chronologisch, neue Einträge am Ende)
- Feature abgeschlossen → PRD.md Status-Spalte aktualisieren

## Verbote
- Keine npm-Pakete ohne explizite Freigabe
- Kein `any` in TypeScript
- Keine direkten DOM-Manipulationen
- Kein localStorage für Server-kritische Daten
- Keine CDN-Fonts (Datenschutz Bund)

## Session-Checkliste (gemäss Context Engineering Guide)

### Session-Start
1. STATUS.md lesen — aktuellen Stand verstehen
2. AI.md laden — Techstack und Konventionen verstehen
3. Relevante Feature-Datei laden — heutigen Auftrag verstehen
4. Entscheiden: **PLAN-Session** oder **IMPL-Session** (nicht mischen!)
5. Zusammenfassung in 3–5 Sätzen — warten auf Bestätigung

### Session-Ende
1. STATUS.md aktualisieren (was getan, was offen)
2. PRD.md Status-Spalte aktualisieren (wenn Feature abgeschlossen)
3. Entscheidungen in decisions/log.md eintragen (chronologisch am Ende)
4. Feature-Datei aktualisieren (Checkboxen, Status)
5. Code committen oder sichern

### Recovery (bei Context Rot)
1. **Sofort stoppen** — nicht im gleichen Chat weitermachen
2. STATUS.md aktualisieren — eintragen wo abgebrochen
3. Neuen Chat öffnen
4. Start-Prompt verwenden (siehe unten)
5. Agent bestätigen lassen

## Start-Prompt (Vorlage)
```
Du bist mein AI-Entwicklungspartner für SAFe PI Capacity Planner.
Lies folgende Dateien in dieser Reihenfolge:
1. AI.md – verstehe den Techstack und die Konventionen
2. STATUS.md – verstehe den aktuellen Stand
3. features/[aktuelle-feature-datei].md – verstehe den heutigen Auftrag
Fasse nach dem Lesen in 3-5 Sätzen zusammen:
- Was der Projektstatus ist
- Was dein heutiger Auftrag ist
- Welche Einschränkungen/Konventionen gelten
Warte auf meine Bestätigung, bevor du mit der Arbeit beginnst.
```
