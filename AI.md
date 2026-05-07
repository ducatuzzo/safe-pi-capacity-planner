# AI.md – Technischer Kompass: SAFe PI Capacity Planner

> Zuletzt synchronisiert: 06.05.2026
> Führend für: Architektur, Datenmodell, Konventionen.
> Feature-Liste: siehe PRD.md. Status: siehe STATUS.md.

## Projekt
- **Name:** SAFe PI Capacity Planner (BIT)
- **Beschreibung:** Fullstack-Webanwendung zur Kapazitätsplanung für SAFe PI Planning in der Bundesverwaltung. Berechnet verfügbare Story Points pro Team und Iteration, berücksichtigt Absenzen, Feiertage, Schulferien und Betriebsaufgaben. Corporate Design Bund.
- **Zielbenutzer:** IT-Manager / Scrum Master / Chapter Leads bei BIT, Schweizer Bundesverwaltung
- **Frontend:** https://safe-pi-capacity-planner.vercel.app (Vercel, Auto-Deploy via GitHub master)
- **Backend:** https://safe-pi-planner-backend.railway.app (Railway, Node.js + Socket.io, Platzhalter — nach Railway-Setup ersetzen)
- **Vercel Root Directory:** `safe-pi-capacity-planner` (Unterordner! nicht `./` — kritisch für Build)
- **Vercel Build Command:** `npx vite build` (vite in devDependencies, daher npx)
- **Lokal:** `npm run dev` im Verzeichnis `safe-pi-capacity-planner/`

## Techstack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express 5, TypeScript, tsx
- **Echtzeit:** Socket.io (für Multiuser-Unterstützung)
- **State:** React useState/useReducer (kein Redux)
- **Charts:** Recharts
- **Export:** jsPDF, html2canvas
- **Icons:** Lucide React
- **Linting:** ESLint mit TypeScript-Plugin
- **Package Manager:** npm

## Corporate Design Bund
- Primärfarbe: #003F7F (Bundesblau) = `--color-primary-700` = `bg-primary-700` / `text-primary-700`
- Sekundärfarbe: #E63312 (Bundesrot) = `--color-secondary-500` = `bg-secondary-500` / `text-secondary-500`
- Hintergrund: #F5F5F5 (`bg-bund-bg`)
- Text: #1A1A1A (`text-bund-text`)
- Schrift: Frutiger (systemweit auf BIT-Geräten installiert) → NotoSans (Swiss DS Fallback, selbst-gehostet in `public/fonts/`) → Arial
- Swiss DS Architektur (Feature 23): CSS Custom Properties in `src/index.css` (`--color-primary-50…900`, `--color-secondary-50…900`), Tailwind referenziert via `var(--color-*)`. Anker: `primary-700 = #003F7F`, `secondary-500 = #E63312`.
- Rückwärtskompatible Tailwind-Aliase: `bund-blau` (= primary-700), `bund-rot` (= secondary-500), `bund-bg`, `bund-text` — nicht löschen, in Bestandscode in Gebrauch.
- Teamfarben: `TEAM_COLORS_HEX` in `src/constants.ts` (single source of truth, Feature 23). `FarbConfig` (Feature 16) kann zur Laufzeit überschreiben.
- Logos aus: `C:\Users\Davide\Documents\AI\Bundeslogo_PNG\` und `Bundeslogo_SVG\`
- Referenz: `C:\Users\Davide\Documents\AI\CD-Bund-Manual_deutsch.pdf`
- Swiss DS Repo (Skin-Muster, nicht zur Übernahme): `C:\Users\Davide\Documents\AI\safe-pi-planner\designsystem-main\`
- Schneeflocke-Symbol für Change-Freeze-Tage: ❄️ (Unicode U+2744)

## Konventionen
- **Sprache:** Deutsch (UI und Kommentare), Englisch (Variablen, Funktionen, Typen)
- **Variablennamen:** camelCase (TS), UPPER_SNAKE_CASE für Konstanten
- **Dateinamen:** kebab-case für Komponenten, PascalCase für React-Komponenten
- **Fehlerbehandlung:** immer try/catch mit Console-Logging, UI-Fehlermeldung auf Deutsch
- **Keine direkten DOM-Manipulationen** – nur React-State
- **Keine inline styles** – nur Tailwind-Klassen (Ausnahme: dynamische Hex-Farben aus FarbConfig/CustomAllocationType)
- **Typen:** alle Interfaces in types.ts, keine any

## Teams (produktive Daten)
| Team | Beschreibung |
|------|-------------|
| NET  | Netzwerk |
| ACM  | Application Configuration Management |
| CON  | Consulting |
| PAF  | Platform & Foundation |

## Mitarbeiterstamm (Demo-Daten)
Quelldatei: `C:\Users\Davide\Documents\AI\mitarbeiterstamm.csv`
Format: `vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag`

**Bekannte Datenfehler im CSV (beim Import abfangen + Warnung anzeigen):**
- MA-ACM-01 (ACM): betriebProzent=1 + pauschalProzent=100 → Summe 101% → ungültig
- MA-CON-01 (CON): betriebProzent=1 + pauschalProzent=100 → Summe 101% → ungültig
- MA-CON-02 (CON): trailing Leerzeichen im Namen → trimmen
- MA-PAF-01 (PAF): trailing Leerzeichen im Namen → trimmen

**Validierungsregel:** betriebProzent + pauschalProzent MUSS <= kapazitaetProzent sein

## Datenmodell (Kern)

### Bestehende Interfaces
- **Employee:** id, firstName, lastName, team, type (iMA|eMA), fte, capacityPercent, betriebPercent, pauschalPercent, storyPointsPerDay, allocations (Record<YYYY-MM-DD, AllocationType>)
- **AllocationType:** NONE|FERIEN|ABWESEND|TEILZEIT|MILITAER|IPA|BETRIEB|BETRIEB_PIKETT|PIKETT
- **PI (PIPlanning):** id, name (z.B. PI26-1), startStr, endStr, iterationen (Array von Iteration), iterationWeeks?, blockerWeeks?, zeremonien? *(Feature 29)*
- **Feiertag / Schulferien / Blocker:** id, name, startStr, endStr

### Feature 29 – PI-Planung erweitert (Schema 1.5)
- **PIBlockerWeek:** id, label, afterIterationId, weeks — PI-interne Pause; verschiebt nachfolgende Iterationen automatisch nach hinten. Kein SP-Abzug. Nicht zu verwechseln mit `Blocker` (Change-Freeze).
- **PIZeremonie:** id, type (`ZeremonieType`), title, date, startTime (HH:mm), durationMinutes, location, description, iterationId? — rein kalendarisch, kein Kapazitäts-Abzug.
- **ZeremonieType:** `PI_PLANNING | DRAFT_PLAN_REVIEW | FINAL_PLAN_REVIEW | PRIO_MEETING | SYSTEM_DEMO | FINAL_SYSTEM_DEMO | INSPECT_ADAPT`
- **PIPlanning erweitert:** optional `iterationWeeks?: number` (1–6, für Auto-Berechnung), `blockerWeeks?: PIBlockerWeek[]`, `zeremonien?: PIZeremonie[]`. Additiv, alle bestehenden PIs ohne diese Felder bleiben gültig.
- **Berechnungslogik:** `calculateIterationDates({startDate, iterationWeeks, iterations, blockerWeeks})` in `src/utils/pi-calculator.ts` — pure function. Iteration-IDs werden bei Re-Berechnung beibehalten (Allocations + Zeremonie-Referenzen bleiben gültig).
- **Schema-Migration 1.4 → 1.5:** `migratePIs()` in `src/utils/state-migration.ts` ergänzt fehlende Arrays mit Defaults `[]` und entfernt einmalig das ARTFlow-Demo-PI «PI26-2» (gated via fehlende `blockerWeeks`/`zeremonien`-Felder; neu angelegte PIs gleichen Namens bleiben erhalten). Wird sowohl bei `applyServerState()` (App.tsx) als auch beim Backup-Restore (`BackupRestoreSettings.tsx`) angewendet.
- **ICS-Export:** `src/utils/ics-export.ts` — `generateIcs(pi, zeremonie)` und `downloadIcs(pi, zeremonie)`. RFC 5545 konform mit floating local time (kein TZ-Suffix), Sonderzeichen-Escaping, Line-Folding bei >75 Oktette. Filename: `{PI-Name}_{Zeremonien-Typ}_{Datum}.ics`. Kein npm-Paket.
- **Backup-Format-Version:** `BACKUP_FORMAT_VERSION` 1.0 → 1.5 (in `BackupRestoreSettings.tsx`). Akzeptiert beide Versionen beim Import; ältere werden auto-migriert. `SavedProjectState.version` (App.tsx) ebenfalls auf `'1.5'` gesetzt.

#### Export/Import-Matrix für PI-Felder
| Feld | JSON-Backup | CSV (PISettings) | Notiz |
|---|---|---|---|
| `name`, `startStr`, `endStr` | ✅ | ✅ | unverändert |
| `iterationen[]` | ✅ vollständig | 🟡 nur indirekt — beim CSV-Import gleichmässig in 4 Teile geteilt | bestehende Logik |
| `iterationWeeks` (F29) | ✅ | ✅ ab v1.8 (4. Spalte, optional, abwärtskompatibel) | neue Spalte |
| `blockerWeeks[]` (F29) | ✅ | ❌ — nur via JSON | komplexe Struktur |
| `zeremonien[]` (F29) | ✅ | ❌ — nur via JSON | komplexe Struktur |

### Feature 17 – Konfiguration
- **GlobalCapacityConfig:** spPerDay (default 1), hoursPerYear (default 1600)
- **TeamConfig:** teamName, minPikett (Personen täglich, inkl. WE+Feiertage), minBetrieb (Personen pro Arbeitstag, exkl. WE+Feiertage)
- **PITeamTarget:** piId, teamName, spJira (editierbar PO) — spNetto wird berechnet, nicht gespeichert

### Feature 18 – Tenant-Architektur (Mandatenfähigkeit)
- **Tenant:** id, name, createdAt, adminCodeHash
- **TenantRegistry:** `tenants.json` im Backend (Liste aller Trains)
- **State-Isolation:** `state_{tenantId}.json` pro Train (statt zentralem `state.json`)
- **TenantManager:** `server/tenant-manager.ts` — verwaltet Registry, State-Dateien, Migration
- **Socket.io-Rooms:** jeder Tenant hat eigenen Room (Isolation der State-Events)
- **REST-Endpunkte:** `/api/tenants` (List/Create), `/api/tenants/:id` (Get/Update/Delete), `/api/tenants/:id/reset`, `/api/state?tenantId=...`
- **Frontend:** `TenantGate` (Splash/Train-Auswahl vor App-Mount), `useTenant` Hook, Header zeigt Train-Name + "Train wechseln"
- **Rückwärtskompatibilität:** Legacy `/api/state` ohne tenantId → Default-Tenant. Migration: `state.json` → `state_default.json` beim ersten Start.

### Feature 19 – Admin-Bereich
- Admin-Gate: 6-stelliger Code (sessionStorage-Cache 15min)
- Rate-Limiting: 3 Fehlversuche → 60s Sperre (server-seitig)
- Admin-Funktionen: Tenant-Reset, Tenant-CRUD, Code-Änderung

### AppData (vollständig, Stand 06.05.2026)
```typescript
interface AppData {
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  pis: PIPlanning[];          // PIPlanning erweitert um optionale F29-Felder (s.o.)
  blocker: Blocker[];          // = Change-Freeze (UNABHÄNGIG von PIBlockerWeek!)
  teamTargets: TeamTarget[];
  globalConfig: GlobalCapacityConfig;
  teamConfigs: TeamConfig[];
  piTeamTargets: PITeamTarget[];
  // Feature 22 (geplant):
  // customAllocationTypes?: CustomAllocationType[];
}
```

**Schema-Version Backup/State:** `1.5` (Feature 29). Migration von 1.0/1.4 ist additiv — bestehende Daten bleiben unverändert, neue Felder werden mit `[]` defaultet.

## Story Point Berechnung
- 1 Arbeitstag = `globalConfig.spPerDay` SP (konfigurierbar, default 1)
- Teilzeit (T) = 0.5 × spPerDay SP
- Ferien/Abwesend/Militär/IPA/Betrieb/Pikett = 0 SP
- Betrieb-Anteil wird vom verfügbaren SP abgezogen (betriebPercent)
- Pauschale wird ebenfalls abgezogen (pauschalPercent)
- FTE-Faktor: bei 80% FTE → 0.8 × Basis-SP
- Arbeitsstunden/Jahr: `globalConfig.hoursPerYear` (konfigurierbar, default 1600)
- FTE-Reduktion: `hoursPerYear × fte` = effektive Jahresstunden
- Wochenenden und gesetzliche Feiertage zählen nicht
- **Blocker-Tage zählen als normale Arbeitstage (kein SP-Abzug)**

## Lücken-Erkennungs-Logik (Feature 17)

### Betrieb-Lücke
```
WENN anzahl_BETRIEB_Buchungen_an_tag < teamConfig.minBetrieb
UND tag ist Arbeitstag (kein Wochenende, kein gesetzlicher Feiertag)
→ Lücke melden (rot im Dashboard)
```

### Pikett-Lücke
```
WENN anzahl_PIKETT_Buchungen_an_tag < teamConfig.minPikett
UND tag liegt innerhalb PI-Zeitraum
→ Lücke melden (gilt auch WE + Feiertage)
```

Wichtig: Pikett greift im Störungsfall auch an Feiertagen und Wochenenden.
Betrieb ist nur an Arbeitstagen nötig (kein Betrieb an Weihnachten = keine Lücke).

## Header-Konfiguration (Stand 16.04.2026)
- Logo: `src/assets/bundeslogo.svg` (Logo_RGB_farbig_negativ, weiss auf transparent)
- Logo-Höhe: `h-14` (56px)
- Titel: `text-xl font-semibold`
- Untertitel: `text-sm text-white/70`
- Padding: `px-6 py-4`
- Verbindungsindikator: grüner/roter Punkt + Text rechts im Header
- Train-Name + "Train wechseln"-Button (Feature 18)

## Navigations-Tabs (Stand 16.04.2026)
| Tab | Key | Beschreibung |
|-----|-----|-------------|
| Planung | `planung` | Kalender-Grid mit Drag-Buchung |
| Kapazität | `kapazitaet` | SP-Berechnung pro Mitarbeiter/Team |
| Dashboard | `dashboard` | KPI-Karten, BarChart, Absenz-Tabelle, Lücken |
| PI Dashboard | `pidashboard` | SP-Vergleich Jira vs. App pro PI/Team/Iteration |
| Einstellungen | `settings` | Mitarbeiter, PI-Planung, Feiertage, Schulferien, Blocker, Zielwerte, Farben, Team-Konfiguration (F17), Globale Parameter (F17), Dokumentation |
| Admin | `admin` | Train-Verwaltung (CRUD), Daten-Reset, Admin-Code ändern (Code-geschützt, Feature 19) |

## PI Dashboard Tab
- **Komponenten:** `src/components/pidashboard/` (PIDashboardView, PIDashboardTable, PIDashboardRow)
- **Hook:** `src/hooks/usePIDashboard.ts`
- **SP in Jira:** Server-State in `AppData.piTeamTargets` (NICHT localStorage — siehe decisions/log.md 07.04.2026)
- **Farbcodierung Auslastung:** grün <85%, orange 85–100%, rot >100%

## Planungs-Kalender (Stand 06.05.2026, Feature 29)
- **Komponenten:** `src/components/calendar/CalendarGrid.tsx`, `CalendarHeader.tsx`, `CalendarCell.tsx`
- **Helpers:** `src/utils/calendar-helpers.ts` — `groupByMonth/KW/PI`, `groupByIterationOrBlocker` (Feature 29), `getZeremonienByDate` (Feature 29), `HeaderSpan { label, span, variant?: 'normal'|'blocker' }`
- **Header-Zeilen (6 statt 5 seit Feature 29):**
  1. Monat
  2. Kalenderwoche (KW)
  3. PI-Name
  4. Iteration **oder** Blocker-Woche (variant='blocker' rendert mit `.bg-blocker-stripe` Utility — gestreifter Hintergrund + ❄ Label)
  5. Zeremonien-Marker (◆ in `text-secondary-500` mit Hover-`title`-Attribut, Mehrfach-Treffer mit kleiner Anzahl als Suffix)
  6. Tag (DD + Wochentag) — enthält weiterhin Snowflake ❄️ für Change-Freeze (`Blocker`)
- **TOP-Offsets in Sticky-Layout:** `top-0`, `top-7`, `top-14`, `top-[84px]`, `top-[112px]`, `top-[140px]` (jede Zeile h-7 = 28px). Mitarbeiter-Ecke `rowSpan={6}`.
- **Utility-Klasse:** `.bg-blocker-stripe` in `src/index.css` — 45° Schraffur für Blocker-Wochen-Spans (kein Tailwind-Inline-Style).

## Quelldateien (Demo-Importdaten)
| Datei | Inhalt |
|-------|--------|
| `C:\Users\Davide\Documents\AI\mitarbeiterstamm.csv` | Demo-Mitarbeiter, 4 Teams |
| `C:\Users\Davide\Documents\AI\gesetzliche_feiertage.csv` | Feiertage |
| `C:\Users\Davide\Documents\AI\schulferien.csv` | Schulferienperioden |
| `C:\Users\Davide\Documents\AI\pi_planung_iterationen.csv` | PI-Planung |
| `C:\Users\Davide\Documents\AI\blocker_spezielle_perioden.csv` | Blocker |

## Farbcodes Buchungstypen (gemäss Legende 28.03.2026)
| Typ | Label | Farbe | Hex |
|-----|-------|-------|-----|
| FERIEN | Ferien/Frei | Orange | #FB923C |
| ABWESEND | Abwesenheit (Arbeitspensum, Sonstiges) | Dunkelgrau | #6B7280 |
| TEILZEIT | Teilzeit (Halber Tag abwesend) | Hellgelb | #FDE68A |
| MILITAER | Militär | Hellgrün | #84CC16 |
| IPA | IPA | Lila | #A78BFA |
| BETRIEB | Betrieb | Hellblau | #60A5FA |
| BETRIEB_PIKETT | Betrieb und Pikett | Violett | #7C3AED |
| PIKETT | Pikett | Rosa | #F9A8D4 |
| Feiertag | — | Grau | #D1D5DB |
| Schulferien | — | Hellgrau | #E5E7EB |
| Blocker/Freeze | — | Hellblau + ❄️ | #BFDBFE |
| Heute | — | Fett + Rot | #E63312 |

## Dokumentationspflicht (IMMER einhalten)
Bei jeder Änderung die folgende Bereiche betrifft, müssen die Markdown-Dokumente nachgeführt werden:

| Trigger | Dokument |
|---------|----------|
| Neues Feature das der User bedienen muss | Benutzerdokumentation |
| Änderung an Infrastruktur, Ports, Abhängigkeiten, Startbefehl | Installationshandbuch |
| Neue Buchungstypen oder Farbcodes | Beide |
| Änderungen an Einstellungen oder CSV-Formaten | Benutzerdokumentation |
| Änderungen an Backup/Restore | Beide + AI.md (Schema-Version) |
| Neues Datenmodell (neue Interfaces in AppData) | AI.md + Benutzerdokumentation |
| Feature abgeschlossen | PRD.md Status-Spalte + STATUS.md + decisions/log.md |
| Architektur-Entscheidung | decisions/log.md (chronologisch am Ende) |

**Ablageort:** `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
**Format:** `installationshandbuch_vX.Y.md`, `benutzerdokumentation_vX.Y.md`

## Verbote
- Keine direkten DB-Abfragen (kein SQL, kein ORM) – alles JSON-basiert
- Keine externen Fonts via CDN (Datenschutz Bund)
- Keine print()-Statements in Produktionscode
- **Kein localStorage für Server-kritische Daten** (nur UI-Preferences wie Filter-Toggle-State erlaubt)
- Keine Bibliotheken ohne explizite Freigabe im package.json
- Kein `any` in TypeScript
- Keine Direkt-Mutation von `Employee.allocations` ohne Helper (Feature 22 vorbereitend)
