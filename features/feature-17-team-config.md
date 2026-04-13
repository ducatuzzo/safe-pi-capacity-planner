# Feature 17: Team-Konfiguration & Kapazitätsparameter

## Ziel
Team-spezifische Mindestbesetzung (Pikett, Betrieb) und globale SP-Parameter
konfigurierbar machen. Dashboard zeigt SP-Zielwert pro Team und PI mit
Auslastungshinweis. Lücken-Erkennung verwendet ab sofort die konfigurierten
Werte statt Hardcoding.

## Status
🔲 Geplant – noch nicht implementiert

## Abhängigkeiten
- Feature 03 (Mitarbeiterstamm) – Teamnamen werden aus Mitarbeiterstamm abgeleitet
- Feature 08 (SP-Berechnung) – spPerDay und hoursPerYear werden variabel
- Feature 10 (Dashboard) – Lücken-Erkennung mit neuen TeamConfig-Werten
- Feature PI-Dashboard-Tab – Zielwert-Block (SP Netto vs. SP Jira)

## Neue Interfaces (types.ts ergänzen)

```typescript
export interface GlobalCapacityConfig {
  spPerDay: number;      // Default: 1 (war hardcodiert in spCalc.ts)
  hoursPerYear: number;  // Default: 1600 (war hardcodiert in AI.md)
}

export interface TeamConfig {
  teamName: string;      // z.B. "PAF", "ACM", "NET", "CON"
  minPikett: number;     // Mindestanzahl Personen mit PIKETT täglich (inkl. WE + Feiertage)
  minBetrieb: number;    // Mindestanzahl Personen mit BETRIEB pro Arbeitstag (exkl. WE + Feiertage)
}

export interface PITeamTarget {
  piId: string;          // Referenz auf PIPlanning.id
  teamName: string;
  spJira: number;        // Manuell editierbar durch PO
  // spNetto wird berechnet, nicht gespeichert
}
```

## AppData (types.ts ergänzen)

Folgende Felder zu AppData hinzufügen:
```typescript
globalConfig: GlobalCapacityConfig;
teamConfigs: TeamConfig[];
piTeamTargets: PITeamTarget[];
```

## Seed-Daten (seedData.ts ergänzen)

```typescript
export const SEED_GLOBAL_CONFIG: GlobalCapacityConfig = {
  spPerDay: 1,
  hoursPerYear: 1600,
};

export const SEED_TEAM_CONFIGS: TeamConfig[] = [
  { teamName: 'PAF', minPikett: 1, minBetrieb: 2 },
  { teamName: 'ACM', minPikett: 1, minBetrieb: 2 },
  { teamName: 'NET', minPikett: 0, minBetrieb: 1 },
  { teamName: 'CON', minPikett: 0, minBetrieb: 1 },
];
```

## SP-Berechnung anpassen (spCalc.ts)

- Konstanten `SP_PER_DAY` und `HOURS_PER_YEAR` entfernen (waren hardcodiert)
- Alle Berechnungsfunktionen erhalten zusätzlichen Parameter `globalConfig: GlobalCapacityConfig`
- FTE-Reduktion: `hoursPerYear * fte / spPerDay` = Basis-SP
- WICHTIG: Rückwärtskompatibilität sicherstellen – Default-Werte falls globalConfig fehlt

## Lücken-Erkennung anpassen (Dashboard / gapDetection)

Bestehende hardcodierte Mindestwerte ersetzen durch teamConfigs:

```typescript
// Betrieb: NUR an Arbeitstagen (kein WE, kein gesetzlicher Feiertag)
const config = teamConfigs.find(t => t.teamName === team);
const isWorkday = !isWeekend(date) && !isFeiertag(date, feiertage);
if (isWorkday && betriebCount < (config?.minBetrieb ?? 1)) {
  // → Lücke melden
}

// Pikett: IMMER (auch WE + Feiertage)
if (pikettCount < (config?.minPikett ?? 1)) {
  // → Lücke melden
}
```

## Settings UI – Neue Subtabs

Bestehende Einstellungen-Tab-Struktur um zwei Subtabs erweitern:

```
Einstellungen
├── Mitarbeiter           (Feature 03, bestehend)
├── PI / Iterationen      (Feature 04, bestehend)
├── Feiertage / Blocker   (Feature 05, bestehend)
├── Farbeinstellungen     (Feature 16, bestehend)
├── Team-Konfiguration    ← NEU
└── Globale Parameter     ← NEU
```

### Subtab: Team-Konfiguration

**Komponente:** `src/components/settings/TeamConfigSettings.tsx`

Tabelle mit Spalten: Team | Min. Pikett | Min. Betrieb | Aktionen
- Teamnamen read-only (automatisch aus Mitarbeiterstamm abgeleitet, nicht manuell eingebbar)
- Inline-Edit: Klick auf Zahlenwert → Input-Feld (number, min 0, max 99)
- Speichern-Button pro Zeile
- CSV Export Button (oben rechts)
- CSV Import Button (oben rechts, mit Validierung)

### Subtab: Globale Parameter

**Komponente:** `src/components/settings/GlobalConfigSettings.tsx`

Felder:
- SP pro Tag: [number input, min 0.1, step 0.5, default 1]
- Arbeitsstunden pro Jahr: [number input, min 800, max 2200, step 100, default 1600]
- Speichern-Button
- Hinweistext: "⚠️ Änderungen wirken sofort auf alle SP-Berechnungen der gesamten App"

## PI Dashboard – Zielwert-Block pro Team

Bestehende PIDashboardTable.tsx erweitern oder neue Komponente `TeamTargetCard.tsx`:

Pro sichtbarem Team + PI anzeigen:
- **SP Netto verfügbar** (berechnet aus sp-calculator.ts, read-only, grau)
- **SP in Jira** (number input, editierbar, PO-Eingabe, gespeichert in piTeamTargets)
- **Delta** = SP Netto – SP Jira:
  - Positiv (>0): grün + ✅ "Kapazitätspuffer vorhanden"
  - Null (=0): blau + ℹ️ "Exakt ausgelastet"
  - Negativ (<0): orange + ⚠️ "Überbucht – Rücksprache mit PO empfohlen"

Hinweis: Über- oder Unterlastung bleibt Entscheidung des Teams; die App weist nur hin.

## CSV Format (Import/Export)

**Dateiname:** `team_config.csv`
**Trennzeichen:** Semikolon (Schweizer Standard)

```
teamName;minPikett;minBetrieb
PAF;1;2
ACM;1;2
NET;0;1
CON;0;1
```

**Validierung beim Import:**
- teamName darf nicht leer sein
- minPikett und minBetrieb müssen >= 0 sein (Integer)
- Unbekannte Teams: werden angelegt (kein Fehler, kein Abbruch)
- Fehlende Pflichtfelder → Import abbrechen mit Fehlermeldung auf Deutsch
- Warnung wenn importierte Teams nicht im Mitarbeiterstamm vorhanden sind

## Backup/Restore (Feature 11)

JSON-Backup muss die neuen Felder einschliessen:
- `globalConfig` in AppData-Snapshot
- `teamConfigs` in AppData-Snapshot
- `piTeamTargets` in AppData-Snapshot

Rückwärtskompatibilität: Alte Backups ohne diese Felder laden mit Default-Werten (kein Fehler).

## Akzeptanzkriterien

- [ ] Subtab "Team-Konfiguration" in Settings sichtbar und bedienbar
- [ ] Subtab "Globale Parameter" in Settings sichtbar und bedienbar
- [ ] Teamnamen werden automatisch aus Mitarbeiterstamm abgeleitet (keine manuelle Eingabe)
- [ ] Inline-Edit für Min. Pikett und Min. Betrieb pro Team funktioniert
- [ ] CSV Export für team_config.csv funktioniert (Semikolon-getrennt)
- [ ] CSV Import für team_config.csv funktioniert mit Validierung und Fehlermeldungen
- [ ] SP/Tag und Std/Jahr sind editierbar und wirken sofort auf alle Berechnungen
- [ ] Lücken-Erkennung verwendet teamConfigs statt hardcodierte Werte
- [ ] Betrieb-Lücke wird an Wochenenden und gesetzlichen Feiertagen NICHT gemeldet
- [ ] Pikett-Lücke gilt auch an Wochenenden und Feiertagen
- [ ] PI Dashboard zeigt pro Team+PI: SP Netto (berechnet), SP Jira (editierbar), Delta
- [ ] Delta-Farbe korrekt: grün / blau / orange
- [ ] Backup/Restore schliesst globalConfig, teamConfigs, piTeamTargets ein
- [ ] Alte Backups (ohne neue Felder) laden ohne Fehler mit Default-Werten

## Dokumentation nachführen

| Dokument | Was ergänzen |
|----------|-------------|
| Benutzerdokumentation | Neues Kapitel "Team-Konfiguration verwalten" (Settings-Subtabs, CSV-Format) |
| Benutzerdokumentation | Neues Kapitel "Globale Parameter" |
| Benutzerdokumentation | PI Dashboard: Abschnitt Zielwert (SP Netto, SP Jira, Delta) |
| Installationshandbuch | Kein Änderungsbedarf (keine Infrastruktur-Änderung) |

## Offene Fragen / Risiken

- **Teams dynamisch:** Wenn neue Teams via Mitarbeiterstamm-Import entstehen, muss TeamConfig automatisch mit Default-Werten angelegt werden.
- **piTeamTargets:** Aktuell liegt SP-Jira im localStorage (PI Dashboard). Entscheidung: Neu in AppData (Server-State via Socket.io) oder weiterhin localStorage? → Empfehlung: In AppData für Konsistenz mit Backup/Restore.
