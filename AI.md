# AI.md – Technischer Kompass: SAFe PI Capacity Planner

## Projekt
- **Name:** SAFe PI Capacity Planner (BIT)
- **Beschreibung:** Fullstack-Webanwendung zur Kapazitätsplanung für SAFe PI Planning in der Bundesverwaltung. Berechnet verfügbare Story Points pro Team und Iteration, berücksichtigt Absenzen, Feiertage, Schulferien und Betriebsaufgaben. Corporate Design Bund.
- **Zielbenutzer:** IT-Manager / Scrum Master / Chapter Leads bei BIT, Schweizer Bundesverwaltung
- **Deployment:** Lokal per npm, Zugriff via Browser (localhost), später multiuser-fähig

## Techstack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express 5, TypeScript, tsx
- **Echtzeit:** Socket.io (für spätere Multiuser-Unterstützung)
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

## Mitarbeiterstamm (25 Personen, Stand 27.03.2026)
Quelldatei: `C:\Users\Davide\Documents\AI\mitarbeiterstamm.csv`
Format: `vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag`

**Bekannte Datenfehler im CSV (beim Import abfangen + Warnung anzeigen):**
- Jonathan Cattaneo (ACM): betriebProzent=1 + pauschalProzent=100 → Summe 101% → ungültig
- André Tellenbach (CON): betriebProzent=1 + pauschalProzent=100 → Summe 101% → ungültig
- Samuel Weber (CON): trailing Leerzeichen im Namen → trimmen
- Andreas Dänzer (PAF): trailing Leerzeichen im Namen → trimmen

**Validierungsregel:** betriebProzent + pauschalProzent MUSS <= kapazitaetProzent sein

## Datenmodell (Kern)
- **Employee:** id, firstName, lastName, team, type (iMA|eMA), fte, capacityPercent, betriebPercent, pauschalPercent, storyPointsPerDay, allocations (Record<YYYY-MM-DD, AllocationType>)
- **AllocationType:** NONE|FERIEN|ABWESEND|TEILZEIT|MILITAER|IPA|BETRIEB|BETRIEB_PIKETT|PIKETT
- **PI (PIPlanning):** id, name (z.B. PI26-1), startStr, endStr, iterationen (Array von Iteration)
- **Feiertag / Schulferien / Blocker:** id, name, startStr, endStr
- **AppData:** feiertage, schulferien, pis (mit Iterationen), blocker, teamTargets[]

## Story Point Berechnung
- 1 Arbeitstag = 1 SP (default, konfigurierbar pro Mitarbeiter)
- Teilzeit (T) = 0.5 SP
- Ferien/Abwesend/Militär/IPA/Betrieb/Pikett = 0 SP
- Betrieb-Anteil wird vom verfügbaren SP abgezogen (betriebPercent)
- Pauschale wird ebenfalls abgezogen (pauschalPercent)
- FTE-Faktor: bei 80% FTE → 0.8 * Basis-SP
- Standardstunden/Jahr: 1600h (= 200 Tage à 8h bei 100% FTE)
- Wochenenden und gesetzliche Feiertage zählen nicht
- **Blocker-Tage zählen als normale Arbeitstage (kein SP-Abzug)**

## Header-Konfiguration (Stand 28.03.2026)
- Logo: `src/assets/bundeslogo.svg` (Logo_RGB_farbig_negativ, weiss auf transparent)
- Logo-Höhe: `h-14` (56px)
- Titel: `text-xl font-semibold`
- Untertitel: `text-sm text-white/70`
- Padding: `px-6 py-4`
- Verbindungsindikator: grüner/roter Punkt + Text rechts im Header

## Quelldateien (produktive Importdaten)
| Datei | Inhalt |
|-------|--------|
| `C:\Users\Davide\Documents\AI\mitarbeiterstamm.csv` | 25 Mitarbeiter, 4 Teams |
| `C:\Users\Davide\Documents\AI\gesetzliche_feiertage.csv` | 14 Feiertage 2025–2026 |
| `C:\Users\Davide\Documents\AI\schulferien.csv` | 9 Schulferienperioden 2025–2026 |
| `C:\Users\Davide\Documents\AI\pi_planung_iterationen.csv` | 5 PIs (PI25-4 bis PI26-4) |
| `C:\Users\Davide\Documents\AI\blocker_spezielle_perioden.csv` | End of Year Freeze (aktuell gültige Datei) |

## Bekannte Performance-Probleme (zu beheben)
### Bug: Drag-Buchung überspringt Tage (träge Mouse-Over)
**Symptom:** Wenn der User schnell mit der Maus über Kalender-Zellen fährt, werden Zellen übersprungen und nicht markiert.
**Ursache:** React onMouseEnter-Events feuern nicht schnell genug bei schnellen Mausbewegungen (bekanntes Browser-Verhalten).
**Fix-Strategie:** 
- Statt onMouseEnter auf jeder Zelle: `onMouseMove` auf dem Container-Element (CalendarGrid)
- Position der Maus via `event.clientX/Y` + `document.elementFromPoint()` oder `getBoundingClientRect()` auflösen
- Alternativ: Drag-Range via Start- und End-Index berechnen und alle Zellen dazwischen setzen (interpolation)
- Empfohlen: Range-Interpolation — beim MouseEnter Start+End merken, alle Zellen zwischen Start und aktueller Position setzen

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
| Feiertag | Grau | #D1D5DB |
| Schulferien | Hellgrau | #E5E7EB |
| Blocker/Freeze | Hellblau + ❄️ | #BFDBFE |
| Heute | Fett + Rot | #E63312 |

## Dokumentationspflicht (IMMER einhalten)
Bei jeder Änderung die folgende Bereiche betrifft, müssen die DOCX-Dokumente nachgeführt werden:

| Trigger | Dokument |
|---------|----------|
| Neues Feature das der User bedienen muss | Benutzerdokumentation |
| Änderung an Infrastruktur, Ports, Abhängigkeiten, Startbefehl | Installationshandbuch |
| Neue Buchungstypen oder Farbcodes | Beide |
| Änderungen an Einstellungen oder CSV-Formaten | Benutzerdokumentation |
| Änderungen an Backup/Restore | Beide |

**Ablageort:** `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
**Format:** `installationshandbuch_vX.Y.docx`, `benutzerdokumentation_vX.Y.docx`
**Generierung:** Node.js Scripts in `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`

## Verbote
- Keine direkten DB-Abfragen (kein SQL, kein ORM) – alles JSON-basiert
- Keine externen Fonts via CDN (Datenschutz Bund)
- Keine print()-Statements in Produktionscode
- Kein localStorage für kritische Daten (nur für UI-Preferences)
- Keine Bibliotheken ohne explizite Freigabe im package.json
