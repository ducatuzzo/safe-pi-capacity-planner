# Feature 08: Story Point Berechnung

## Ziel
Kernlogik für die Kapazitätsberechnung. Pure functions in `utils/sp-calculator.ts` — keine Seiteneffekte, vollständig testbar. Ergebnis wird im Kapazitäts-Tab und Dashboard angezeigt.

## Akzeptanzkriterien
- [ ] `getDayMeta(dateStr, appData)` liefert Tages-Typ korrekt
- [ ] `calculateSPForEmployee(employee, startStr, endStr, appData)` korrekt
- [ ] `calculateSPForTeam(employees, startStr, endStr, appData, targets)` korrekt
- [ ] `calculateSPForIteration(employees, iteration, appData, targets)` korrekt
- [ ] `calculateSPForPI(employees, pi, appData, targets)` korrekt
- [ ] Wochenenden zählen nicht
- [ ] Feiertage zählen nicht
- [ ] Blocker zählen als normale Arbeitstage (kein SP-Abzug)
- [ ] AllocationType-Abzüge korrekt (siehe Formel)
- [ ] FTE-Faktor korrekt angewendet
- [ ] Betrieb% und Pauschale% korrekt abgezogen
- [ ] Pikett-Lücken erkannt (< pikettMin Personen an einem Tag)
- [ ] Betrieb-Unterbesetzung erkannt (< betriebMin Personen an einem Tag)
- [ ] Kapazitäts-Tab zeigt Ergebnisse pro Mitarbeiter + Team-Summe
- [ ] Ergebnisse aktualisieren sich live bei Änderungen im Kalender

## Berechnungsformel
```
Für jeden Arbeitstag im Zeitraum:
  → überspringen wenn: Wochenende ODER Feiertag

  allocation = employee.allocations[dateStr] ?? NONE

  sp_tag = stichtagSP(allocation, employee.storyPointsPerDay)
    NONE        → storyPointsPerDay (default 1.0)
    TEILZEIT    → storyPointsPerDay * 0.5
    alle anderen → 0.0

  sp_tag_netto = sp_tag
    * employee.fte
    * (1 - employee.betriebPercent / 100)
    * (1 - employee.pauschalPercent / 100)

SP_total = Summe aller sp_tag_netto im Zeitraum
SP_total gerundet auf 1 Dezimalstelle
```

## Output-Typen
```typescript
interface EmployeeSPResult {
  employeeId: string;
  employeeName: string;
  team: string;
  availableSP: number;
  workDays: number;        // Arbeitstage ohne Wochenenden/Feiertage
  absenceDays: number;     // Tage mit FERIEN/ABWESEND/MILITAER/IPA
  betriebDays: number;     // Tage mit BETRIEB/BETRIEB_PIKETT
  pikettDays: number;      // Tage mit PIKETT/BETRIEB_PIKETT
  teilzeitDays: number;    // Tage mit TEILZEIT
}

interface TeamSPResult {
  team: string;
  totalAvailableSP: number;
  employees: EmployeeSPResult[];
  pikettGaps: string[];    // Datums-Strings wo < pikettMin Personen
  betriebGaps: string[];   // Datums-Strings wo < betriebMin Personen
}

interface IterationSPResult {
  iterationName: string;
  startStr: string;
  endStr: string;
  teams: TeamSPResult[];
  totalSP: number;
}
```

## Kapazitäts-Tab
- Tabelle: Mitarbeiter | Team | Arbeitstage | Absenzen | SP verfügbar
- Gruppenzeile pro Team mit Summe
- Filter: PI / Iteration (zeigt Ergebnis für gewählten Zeitraum)
- Pikett-Lücken rot markiert
- Betrieb-Unterbesetzung orange markiert

## Technische Details
- Datei: `src/utils/sp-calculator.ts`
- Alle Datums-Vergleiche: YYYY-MM-DD String-Vergleich (kein Date-Objekt nötig)
- Wochenende-Check: `new Date(dateStr + 'T12:00:00Z').getUTCDay()` → 0=So, 6=Sa
- Feiertag-Check: appData.feiertage nach Datum durchsuchen
- Schulferien beeinflussen SP nicht (nur Kalender-Darstellung)

## Abhängigkeiten
- Feature 02: types.ts (Employee, PIPlanning, AppData, AllocationType)
- Feature 06/07: allocations im Employee-State gefüllt

## Status
- [ ] Design: offen
- [ ] Implementierung: offen
- [ ] Tests: offen

## Session-Typ: IMPL
