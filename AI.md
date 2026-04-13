# AI.md – Technischer Kompass: SAFe PI Capacity Planner

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
- Primärfarbe: #003F7F (Bundesblau)
- Sekundärfarbe: #E63312 (Bundesrot)
- Hintergrund: #F5F5F5
- Text: #1A1A1A
- Schrift: Frutiger (Fallback: Arial, sans-serif)
- Logos aus: C:\Users\Davide\Documents\AI\Bundeslogo_PNG\ und Bundeslogo_SVG\
- Referenz: C:\Users\Davide\Documents\AI\CD-Bund-Manual_deutsch.pdf
- Schneeflocke-Symbol für Change-Freeze-Tage: ❄️ (Unicode U+2744)

## Konventionen
- **Sprache:** Deutsch (UI und Kommentare), Englisch (Variablen, Funktionen, Typen)
- **Variablennamen:** camelCase (TS), UPPER_SNAKE_CASE für Konstanten
- **Dateinamen:** kebab-case für Komponenten, PascalCase für React-Komponenten
- **Fehlerbehandlung:** immer try/catch mit Console-Logging, UI-Fehlermeldung auf Deutsch
- **Keine direkten DOM-Manipulationen** – nur React-State
- **Keine inline styles** – nur Tailwind-Klassen
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
- **PI (PIPlanning):** id, name (z.B. PI26-1), startStr, endStr, iterationen (Array von Iteration)
- **Feiertag / Schulferien / Blocker:** id, name, startStr, endStr

### Neue Interfaces (Feature 17)
- **GlobalCapacityConfig:** spPerDay (default 1), hoursPerYear (default 1600)
- **TeamConfig:** teamName, minPikett (Personen täglich, inkl. WE+Feiertage), minBetrieb (Personen pro Arbeitstag, exkl. WE+Feiertage)
- **PITeamTarget:** piId, teamName, spJira (editierbar PO) — spNetto wird berechnet, nicht gespeichert

### AppData (vollständig)
```typescript
interface AppData {
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  pis: PIPlanning[];
  blocker: Blocker[];
  teamTargets: TeamTarget[];
  globalConfig: GlobalCapacityConfig;
  teamConfigs: TeamConfig[];
  piTeamTargets: PITeamTarget[];
}
```

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

## Lücken-Erkennungs-Logik (präzisiert, Feature 17)

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

## Header-Konfiguration (Stand 28.03.2026)
- Logo: `src/assets/bundeslogo.svg` (Logo_RGB_farbig_negativ, weiss auf transparent)
- Logo-Höhe: `h-14` (56px)
- Titel: `text-xl font-semibold`
- Untertitel: `text-sm text-white/70`
- Padding: `px-6 py-4`
- Verbindungsindikator: grüner/roter Punkt + Text rechts im Header

## Navigations-Tabs (Stand 01.04.2026)
| Tab | Key | Beschreibung |
|-----|-----|-------------|
| Planung | `planung` | Kalender-Grid mit Drag-Buchung |
| Kapazität | `kapazitaet` | SP-Berechnung pro Mitarbeiter/Team |
| Dashboard | `dashboard` | KPI-Karten, BarChart, Absenz-Tabelle, Lücken |
| PI Dashboard | `pidashboard` | SP-Vergleich Jira vs. App pro PI/Team/Iteration |
| Einstellungen | `settings` | Mitarbeiter, PI-Planung, Feiertage, Farbeinstellungen, Team-Konfiguration (F17), Globale Parameter (F17) |

## PI Dashboard Tab
- **Komponenten:** `src/components/pidashboard/` (PIDashboardView, PIDashboardTable, PIDashboardRow)
- **Hook:** `src/hooks/usePIDashboard.ts`
- **SP in Jira:** Manuell editierbar, im Server-State gespeichert (piTeamTargets)
- **Farbcodierung:** grün <85%, orange 85–100%, rot >100% Auslastung

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
| Änderungen an Backup/Restore | Beide |
| Neues Datenmodell (neue Interfaces in AppData) | AI.md + Benutzerdokumentation |

**Ablageort:** `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
**Format:** `installationshandbuch_vX.Y.md`, `benutzerdokumentation_vX.Y.md`

## Verbote
- Keine direkten DB-Abfragen (kein SQL, kein ORM) – alles JSON-basiert
- Keine externen Fonts via CDN (Datenschutz Bund)
- Keine print()-Statements in Produktionscode
- Kein localStorage für kritische Daten (nur für UI-Preferences erlaubt)
- Keine Bibliotheken ohne explizite Freigabe im package.json
