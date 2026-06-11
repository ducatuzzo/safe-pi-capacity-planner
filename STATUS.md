# STATUS.md – Stand: 10.06.2026

> Feature-Nummerierung folgt PRD.md (verbindlich). Dieses Dokument trackt nur den Implementierungsstatus.

## Stand: 2026-06-10

### Zuletzt erledigt (Session 10.06.2026 — Benutzerdokumentation v2.1 + AI.md/CLAUDE.md Sync)
- **Benutzerdokumentation v2.1** (NEU + .docx, 31.9 KB, 320 Blocks) erstellt:
  - F22 Custom Allocation Types (eigene Buchungstypen, Kategorien ABSENCE/OPERATIONAL/NONE, Color-Picker, Drag-Legende mit ★)
  - F27 Mobile Read-Only Responsive Design (Bottom-Tab-Bar, Schreib-Aktionen hidden, Banner)
  - Global Undo/Redo (Stack 5, Ctrl+Z/Y, Toolbar-Buttons ⟲/⟳)
  - Excel-Clipboard-Import (Structured/Raw, Vorschau-Dialog, Überschreiben vs. Nur-leere-füllen)
  - Versionshistorie-Eintrag v2.1 vom 10.06.2026
- **AI.md** synchronisiert (Stand 10.06.2026): AppData erweitert um `customAllocationTypes`, Schema-Version 1.6, vier neue Sektionen (F22, F27, Global Undo, Clipboard Import) mit Code-Pfaden, Hooks und Helper-Funktionen
- **CLAUDE.md** synchronisiert (Stand 10.06.2026): kompakte Quick-Reference für F22/F27/Undo/Clipboard mit Tastatur-Shortcuts und Datei-Pfaden
- **DokumentationSettings.tsx**: Download-Link v2.0 → v2.1 mit erweiterter Beschreibung
- v2.1.docx via `scripts/md-to-docx.js` regeneriert + nach `safe-pi-capacity-planner/public/docs/` kopiert für Vercel-Auslieferung
- TypeScript-Check grün

### Zuletzt erledigt (Session 10.06.2026 — F22 Custom Types + Global Undo/Redo + Excel Clipboard Import)
- **Feature 22: Custom Allocation Types** ✅ implementiert + deployed (Commit `ac0af87`)
  - Breaking Change: `Employee.allocations` von `Record<string, AllocationType>` zu `Record<string, string>`
  - Neues Interface `CustomAllocationType` mit `kuerzel`, `label`, `bg`, `text`, `category`, `team?`
  - `AllocationCategory`: `ABSENCE | BETRIEB | PIKETT | BETRIEB_PIKETT | NEUTRAL`
  - Zentrale Lookup-Funktionen in `src/utils/allocation-helpers.ts` (ersetzt alle hardcoded Type-Checks)
  - Settings → Buchungstypen: CRUD-UI mit Kürzel-Kollisionsprüfung gegen Built-in-Types
  - SP-Berechnung, Kalender, Dashboard, Backup/Restore alle auf Helper-basiert umgestellt
  - Backup-Schema-Version 1.7, Server-Migration für `customAllocationTypes`
  - Socket.io: `'customAllocationTypes'` als neuer `SettingsChangeType`
- **Global Undo/Redo** ✅ implementiert + deployed
  - `useGlobalUndo.ts` (NEU) ersetzt `usePlanungUndo.ts` (GELÖSCHT)
  - `AppSnapshot` deckt alle 10 State-Pieces ab, Stack-Limit 5
  - Ctrl+Z/Y für ALLE Settings-Änderungen, nicht nur Kalender-Drags
- **Excel Clipboard Import** ✅ implementiert + deployed
  - Ctrl+V oder Browser-Kontextmenü "Einfügen" für TSV-Daten aus Excel
  - Auto-Erkennung: Structured Mode (Datums-Header) vs. Raw Mode (nur Kürzel)
  - Rechtsklick auf Zelle setzt Einfügepunkt (blauer Rand) für gezieltes Paste
  - Vorschau-Dialog mit Buchungsanzahl, Warnungen, Raw-Modus-Info
  - `src/utils/clipboard-parser.ts` (NEU), `src/components/calendar/ClipboardImportDialog.tsx` (NEU)
- **Neue Dateien (5):** `allocation-helpers.ts`, `clipboard-parser.ts`, `ClipboardImportDialog.tsx`, `CustomAllocationSettings.tsx`, `useGlobalUndo.ts`
- **Gelöschte Dateien (1):** `usePlanungUndo.ts`
- **Geänderte Dateien (16):** types.ts, constants.ts, sp-calculator.ts, state-migration.ts, App.tsx, useSocket.ts, tenant-manager.ts, CalendarCell.tsx, CalendarGrid.tsx, DashboardView.tsx, BackupRestoreSettings.tsx, FarbeinstellungenSettings.tsx, SettingsPage.tsx, package.json, package-lock.json
- TypeScript-Check + Vite-Build grün, Vercel Auto-Deploy via GitHub master

### Zuletzt erledigt (Session 10.06.2026 — Feature 27: Mobile Read-Only Responsive Design)
- **Feature 27: Mobile-Optimierung (Responsive Read-Only)** ✅ implementiert + deployed (Commit `a59cbc3`)
- **Scope:** Read-Only auf Mobile (< 768px), volle Interaktion auf Desktop. Keine neuen npm-Pakete.
- **Neue Dateien:** `src/hooks/useMediaQuery.ts` (Breakpoint-Hook), `src/components/layout/MobileReadOnlyBanner.tsx` (Nur-Lese-Hinweis)
- **Neue Feature-Spec:** `features/feature-27-mobile-optimierung.md`
- **Geänderte Dateien (10):** App.tsx (mobileActiveTab-Fallback, responsive Padding), Header.tsx (Logo/Titel/Tenant kompakter), TabNav.tsx (Bottom-Tab-Bar mit 4 Icons, Settings/Admin ausgeblendet), FilterBar.tsx (kollabierbar mit Badge), CalendarGrid.tsx (Drag-Handler deaktiviert, Undo-Toolbar/Paste-Origin/Clear-Button ausgeblendet, MobileReadOnlyBanner), DashboardView.tsx (Export-Buttons hidden), PIDashboardView.tsx (Export-Buttons hidden, Legende kompakter), KapazitaetView.tsx (min-w-[600px] für Horizontal-Scroll), TenantGate.tsx (max-w-[90vw] responsive), index.css (safe-area-bottom Utility)
- **Verifiziert:** 375px (Mobile) und 1280px (Desktop) im Browser — alle 4 Mobile-Tabs funktional, kein horizontaler Body-Overflow, keine Desktop-Regression
- TypeScript-Check + Build grün, Vercel Auto-Deploy via GitHub master

### Zuletzt erledigt (Session 05.06.2026 Abend — Prod-Recovery Demo-Train + PS-DCS, Doku-Sync)
- **Recovery-Workflow zweimal in Prod genutzt** (Railway): Demo-Train (Initial-Lockout) und PS-DCS (existierender 6-Ziffern-Hash gegen 8-Ziffern-Gate). Beide Resets erfolgreich via `POST /api/recovery/reset-admin-code`, neuer Code danach manuell gesetzt.
- **PS-DCS-Train anschliessend gelöscht** durch User (nicht mehr benötigt). Tenants jetzt: nur noch `default`.
- **Token-Hygiene verifiziert:** `ADMIN_RECOVERY_TOKEN` nach beiden Resets aus Railway entfernt + Service redeployed. Endpoint zurück auf HTTP 404 «Recovery deaktiviert». Beide verwendeten Tokens damit wertlos.
- **Railway-URL korrigiert:** tatsächliche Backend-URL ist `https://safe-pi-capacity-planner-production.up.railway.app` (verifiziert via Prod-JS-Bundle-Grep). Alter Platzhalter `safe-pi-planner-backend.railway.app` aus 4 Files entfernt: `AI.md`, `docs/pflichtenheft_v1.0.md`, `features/bug-04-persistenter-state.md`, `.env.example`. `.env.example` zeigt jetzt auch Default `00000815` statt `000815`.
- **Decisions-Log aktualisiert:** neuer Eintrag «2026-06-05: Admin-Code 6 → 8 Ziffern + Recovery-Endpoint (in Prod verifiziert)» mit Workflow-Doku, Tenant-IDs (lowercase: `default`, `ps-dcs`), Health-Check-Vorgehen.
- Commits gepushed: `519d022` (Doku-URL-Sync) + `abbcd37` (Decisions-Log).

### Zuletzt erledigt (Session 05.06.2026 PM — Admin-Code auf 8 Ziffern + Recovery-Endpoint)
- **Schema-Wechsel 6 → 8 Ziffern:** User wollte längeren Code. `AdminGate.tsx` jetzt 8 OTP-Felder (`CODE_LENGTH = 8`). `AdminView.tsx` Validierung und alle Inputs auf 8 Ziffern. `server/tenant-manager.ts` Default `00000815`.
- **Lockout-Recovery 2:** PIN `08052026` (vor PM-Fix) hat erneut ausgesperrt. `data/tenants.json` gelöscht (Backup `.bak2`), Server-Restart, neuer Default `00000815` verifiziert via `PATCH /api/tenants/default` → HTTP 200.
- **Recovery-Endpoint** `POST /api/recovery/reset-admin-code`: gated durch Env-Var `ADMIN_RECOVERY_TOKEN` (≥16 Zeichen), timing-safe Vergleich, Rate-Limit 5/5 Min/IP. Setzt Tenant-Hash auf bcrypt von `DEFAULT_ADMIN_CODE`. Löst Railway-Lockouts ohne Shell-Zugriff. 4 Tests grün (deaktiviert / falscher Token / fehlende Felder / Erfolg + nachträglicher Login).

### Zuletzt erledigt (Session 05.06.2026 — Admin-Code Hardening + Undo/Redo + Löschen-Konsolidierung)
- **Lockout behoben:** Admin-PIN auf Demo-Train hatte 8 Ziffern (`08052026`), Login-Gate akzeptiert aber nur 6 → Aussperrung. `data/tenants.json` zurückgesetzt; Server hat Demo-Train neu mit `000815` initialisiert (`state_default.json` unverändert). Backup als `tenants.json.bak`.
- **Bug-Fix Admin-Code-Wechsel:** `AdminView.tsx` validiert jetzt exakt 6 numerische Ziffern (statt «mindestens 6 Zeichen»). Inputs: `maxLength={6}`, `inputMode="numeric"`, `pattern="\d{6}"`, Input-Filter entfernt nicht-Ziffern. Gleicher Fix beim Anlegen neuer Trains. Aussperren physisch unmöglich.
- **Undo/Redo in Planung (3 Schritte):** Neuer Hook `src/hooks/usePlanungUndo.ts`. Snapshot von `Employee[]` bei jedem Drag-MouseDown. Toolbar-Buttons «Rückgängig»/«Wiederherstellen» in `CalendarGrid.tsx`. Tastatur `Ctrl+Z`/`Ctrl+Y`/`Ctrl+Shift+Z`. Restore broadcastet via `emitSettingsChange('employees', …)`. Input-Felder werden ignoriert.
- **«Alles löschen» konsolidiert:** Entfernt aus `MitarbeiterSettings.tsx` und `DateRangeTable.tsx` (Feiertage/Schulferien/Blocker). Globale Lösch-Aktionen nur noch im Admin → Gefährliche Aktionen. Verwaiste `Trash`-Imports bereinigt.
- TypeScript-Check `tsc --noEmit` grün.

### Zuletzt erledigt (Session 07.05.2026 — UI-Reorganisation v2.0)
- **PI-Planung Timeline-View:** Iterationen + Blocker + Zeremonien chronologisch in EINER Tabelle (statt zwei getrennten Bereichen). 3 Modals (Iter / Blocker / Zeremonie) im `IterationEditor.tsx` (komplett neu). `ZeremonienEditor.tsx` als Legacy nicht mehr von PISettings importiert.
- **CSV-Pfad entfernt** aus `PISettings.tsx` (Excel-Workbook ist alleiniger Bulk-Pfad)
- **«Alle PIs löschen»** verschoben zu `AdminView.tsx` (neue Sektion in «Gefährliche Aktionen»)
- **Demo-Daten** für Demo-Train (`src/data/seed-demo.ts` NEU) mit Server-Persistenz via POST in `applyServerState` — überlebt Browser-Refresh
- `.gitignore`-Bugfix für `src/data/`
- **Benutzerdokumentation v2.0** (NEU + .docx) + AI.md + CLAUDE.md + decisions/log.md aktualisiert
- TypeScript-Check `tsc --noEmit` grün — alle Commits gepusht (`416df81`, `9a5c801` und Doku-Commit)

### Zuletzt erledigt (Session 06.05.2026 — Feature 29 v1 + v2)
- **Feature 29: PI-Planung wochenbasiert + Zeremonien + Blocker-Wochen** ✅ implementiert
- **Feature 29: PI-Planung wochenbasiert + Zeremonien + Blocker-Wochen** ✅ implementiert
  - Schritt 1 ✅ types.ts erweitert (PIBlockerWeek, PIZeremonie, ZeremonieType), pi-calculator.ts (calculateIterationDates, ZEREMONIE_DEFAULTS), state-migration.ts (Schema 1.4 → 1.5)
  - Schritt 2 ✅ PI-Erstellung Modal: wochenbasiert, Auto-Berechnung Enddatum, Iter.-Wo. Spalte
  - Schritt 3 ✅ IterationEditor: Blocker-Wochen Inline-Anzeige + CRUD + automatische Re-Berechnung
  - Schritt 4 ✅ ZeremonienEditor (NEU): CRUD-Tabelle + Modal mit 7 Typen, Default-Dauer/Zeit pro Typ
  - Schritt 5 ✅ ics-export.ts (NEU): RFC 5545 konforme Generierung, client-side Download
  - Schritt 6 ✅ Planungs-Kalender: Blocker-Balken (gestreift) + Zeremonien-Marker (◆) mit Tooltip
- Build grün, TypeScript-Check `tsc --noEmit` ohne Fehler
- Browser-Verifikation in jedem Schritt durchgeführt

### Entscheidungen für Feature 29 (06.05.2026)
- Nummern-Konflikt: PRD.md „Rollen" 29 → 30 verschoben, Feature 29 = PI-Planung wochenbasiert
- Naming additiv: bestehendes `PIPlanning`/`PiDefinition` bleibt, neue Felder als optional ergänzt
- Backup-Format: `BACKUP_FORMAT_VERSION` 1.0 → 1.5 (Schema-Bump, Migration mit leeren Arrays)
- Demo-PI26-2 Löschung: nur einmalig beim ersten Migrationspass (gated via fehlende blockerWeeks/zeremonien-Felder), neu angelegte PI26-2 bleiben erhalten
- Spec-Datei-Name bleibt `feature-29-pi-planung-v2.md`
- 6. Header-Zeile (vorher 5) für Zeremonien-Marker, Blocker als variant='blocker' Span in Iter-Zeile (additiv, kein neues groupBy)
- ICS: floating local time (kein TZ-Suffix) → Empfänger-Kalender interpretiert als lokal

### Bekannte Abhängigkeiten
- ✅ Feature 22 (Custom Allocation Types) deployed — F29-Abhängigkeit erfüllt
- Blocker/Freeze (Change-Management) bleibt vollständig unberührt
- Demo-Daten PI26-2: Migrations-Skript greift automatisch beim ersten State-Load nach Deploy

---

## Projektstatus
✅ Features 01–21 abgeschlossen, Build grün, **auf Vercel deployed** (Commit `1ee0095`).
✅ Feature 22 (Custom Allocation Types) + Global Undo/Redo + Excel Clipboard Import deployed (Commit `ac0af87`).
✅ Feature 23 (Swiss DS CSS Alignment / BIT Skin) implementiert, Build grün, ⏳ deploy ausstehend.
✅ Feature 27 (Mobile Read-Only Responsive Design) implementiert + deployed (Commit `a59cbc3`).
- Mandatenfähigkeit aktiv (Demo-Train, Admin-Code-Default `00000815`, 8 Ziffern).

## Abgeschlossene Features

### Phase 1 — MVP
| Nr. | Feature | Status |
|-----|---------|--------|
| 01 | Projektgerüst | ✅ deployed |
| 02 | Typen & Datenmodell | ✅ deployed |
| 03 | Mitarbeiterstamm (CRUD + CSV) | ✅ deployed |
| 04 | PI-Planung & Iterationen | ✅ deployed |
| 05 | Feiertage / Schulferien / Blocker | ✅ deployed |
| 06 | Kalender-Komponente | ✅ deployed |
| 07 | Drag-Buchung | ✅ deployed |
| 08 | SP-Berechnung | ✅ deployed |
| 09 | Filter | ✅ deployed |
| 10 | Dashboard | ✅ deployed |
| 11 | Backup/Restore | ✅ deployed |
| 12 | PDF/PNG Export | ✅ deployed |
| 13 | Corporate Design Bund | ✅ deployed |

### Phase 2 — Erweiterungen
| Nr. | Feature | Status |
|-----|---------|--------|
| 14 | Team-Zielwerte | ✅ deployed |
| 15 | Multiuser (Socket.io) | ✅ deployed |
| 16 | Farbeinstellungen | ✅ deployed |
| 17 | Team-Konfiguration & Kapazitätsparameter | ✅ deployed |

### Phase 3 — Mandatenfähigkeit
| Nr. | Feature | Status |
|-----|---------|--------|
| 18 | Tenant-Model | ✅ deployed |
| 19 | Admin-Bereich | ✅ deployed |

### Phase 4 — UX-Verfeinerung
| Nr. | Feature | Status |
|-----|---------|--------|
| 20 | Mitarbeiterstamm-Filter | ✅ deployed |
| 21 | Settings-Scroll-to-Section | ✅ deployed |

### Phase 4b — CD Bund Vertiefung
| Nr. | Feature | Status |
|-----|---------|--------|
| 23 | Swiss Design System CSS Alignment (BIT Skin) | ✅ impl / ⏳ deploy |

### Phase 5b — PI-Planung Vertiefung
| Nr. | Feature | Status |
|-----|---------|--------|
| 29 | PI-Planung wochenbasiert + Zeremonien + Blocker-Wochen (.ics) | ✅ deployed (v2.0 UI-Reorganisation 07.05.2026) |

### Eigenständige Features
| Feature | Status |
|---------|--------|
| PI Dashboard Tab | ✅ deployed |
| PI Dashboard PDF/PNG-Export | ✅ deployed |
| Dokumentation-Download (.docx) | ✅ deployed |

## Behobene Bugs & Fixes
- BUG-01: Drag-Interpolation ✅
- BUG-02: CalendarHeader crash ohne Iterationen ✅
- BUG-03: SEED_BLOCKER fehlte in App.tsx ✅
- BUG-04: Persistenter Server-State (JSON-File, Railway-Ready) ✅
- BUG-05: app.options Wildcard-Route entfernt ✅
- FIX-01 bis FIX-16: siehe decisions/log.md für Details

## Dokumentation
| Dokument | Datei | Stand |
|----------|-------|-------|
| Installationshandbuch | docs/installationshandbuch_v1.0.md | ✅ |
| Benutzerdokumentation | docs/benutzerdokumentation_v2.1.md | ✅ 10.06.2026 (F22 + F27 + Undo/Redo + Clipboard) |
| Deployment-Handbuch | docs/deployment_handbuch_v1.0.md | ✅ |
| CLAUDE.md | CLAUDE.md | ✅ 16.04.2026 |

## Zuletzt erledigt (Session 22.04.2026)
- Feature 23 (Swiss DS CSS Alignment / BIT Skin) implementiert
- NotoSans Font als Frutiger-Fallback eingebunden (4 TTF-Dateien selbst-gehostet)
- BIT-Skin CSS-Variablen-Schema (`--color-primary-*` / `--color-secondary-*`) eingeführt
- Tailwind-Config auf `var(--color-*)` umgestellt, `bund-*`-Aliase erhalten (Option A)
- 11 hardcoded Hex-Treffer im JSX auf `text-primary-700` / `bg-primary-700` ersetzt
- TEAM_COLORS in `constants.ts` als single source of truth (`TEAM_COLORS_HEX`)
- AbsenzTabelle: 6 hardcoded `text-[#…]` auf `text-buchung-*` Tokens migriert (1:1, kein optischer Unterschied)
- PRD.md Phase 6+ Roadmap-Features renumbered (23→24, 24→25, 25→26, 26→27, 27→28, 28→29)

## Zuletzt erledigt (Session 16.04.2026)
- Dokumenten-Synchronisation: PRD.md, STATUS.md, CLAUDE.md, decisions/log.md
- Nummern-Drift bereinigt
- Veraltete Referenzen (localStorage für piTeamTargets) korrigiert
- phase-2-planung.md archiviert

### Phase 6 — Mobile & UX
| Nr. | Feature | Status |
|-----|---------|--------|
| 27 | Mobile-Optimierung (Responsive Read-Only) | ✅ deployed (Commit `a59cbc3`, 10.06.2026) |

### Phase 5 — Custom Types + Productivity
| Nr. | Feature | Status |
|-----|---------|--------|
| 22 | Custom Allocation Types | ✅ deployed (Commit `ac0af87`, 10.06.2026) |
| — | Global Undo/Redo (alle Settings, Stack 5) | ✅ deployed (Commit `ac0af87`, 10.06.2026) |
| — | Excel Clipboard Import (Raw + Structured) | ✅ deployed (Commit `ac0af87`, 10.06.2026) |

## Aktuell in Arbeit
- Keine offenen Features

## Abgebrochene Sessions
- **Paket 7 IMPL am 2026-04-24 abgebrochen – Architektur-Spec fehlt.** Kein Dokument mit dem Bezeichner "Paket 7" in features/, prompts/ oder anderen Verzeichnissen gefunden. Projekt nutzt Feature-basierte Nummerierung (01–23), kein Paket-Schema. Vor Implementierung muss eine Architektur-Spec erstellt werden (features/paket-7-settings.md oder äquivalent).

## Nächste Schritte (priorisiert)
1. Feature 29 + F23: Vercel-Deploy verifizieren (sollten mit `ac0af87` deployed sein)
2. ~~Benutzerdokumentation aktualisieren (Custom Types, Undo/Redo, Clipboard Import)~~ ✅ erledigt (v2.1)

## Bekannte Risiken
- **JSON-Persistenz ohne Locking:** Bei gleichzeitigen Schreibzugriffen via Socket.io kann ein Race Condition auftreten. Für aktuelle Nutzerzahl (< 10 gleichzeitig) akzeptiert.
- **Kein Unit-Test-Coverage:** SP-Berechnungsfunktionen (pure functions) sind ungetestet.

## Vercel Deployment
- Status: ✅ Live (Stand: 18.04.2026, Features 01–21, Commit `1ee0095`)
- URL: https://safe-pi-capacity-planner.vercel.app
- GitHub: ducatuzzo/safe-pi-capacity-planner (Branch: master)
- Root Directory: `safe-pi-capacity-planner`
- Build Command: `npx vite build`
- Output Directory: `dist`

## Projektpfad
- Context Engineering: `C:\Users\Davide\Documents\AI\safe-pi-planner\`
- App-Code: `C:\Users\Davide\Documents\AI\safe-pi-planner\safe-pi-capacity-planner\`
- Dokumentation: `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
