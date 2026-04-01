# Feature 10: Dashboard

## Ziel
Übersichts-Tab "Kapazität" (oder eigener Dashboard-Tab) mit Planungsergebnis auf einen Blick. Zeigt SP-Kapazitäten pro Team/Iteration als Diagramm, Absenz-Übersicht, Pikett-Lücken und Betrieb-Unterbesetzung. Alle aktiven Filter wirken durchgehend.

## Akzeptanzkriterien

### Kapazitäts-Diagramm
- [ ] Balkendiagramm: Verfügbare SP pro Team pro Iteration (Recharts BarChart)
- [ ] X-Achse: Iterationen (oder PIs je nach Filter)
- [ ] Y-Achse: Story Points
- [ ] Jedes Team = eigene Farbe (NET, ACM, CON, PAF)
- [ ] Tooltip bei Hover: Team, Iteration, SP-Wert
- [ ] Filter (Team/PI/Iteration) wirkt auf Diagramm

### Absenz-Übersicht
- [ ] Tabelle: Mitarbeiter | Team | Ferientage | Abwesend | Militär | IPA | Betrieb | Pikett
- [ ] Summenzeile pro Team
- [ ] Zeitraum gemäss aktivem Filter

### Lücken-Erkennung
- [ ] Pikett-Lücken: Tage wo < pikettMin Personen Pikett haben → rot markiert
- [ ] Betrieb-Unterbesetzung: Tage wo < betriebMin Personen Betrieb haben → orange markiert
- [ ] Anzeige als kompakte Liste: "KW 12: Pikett-Lücke (0/2 Personen)"
- [ ] Wenn keine Lücken: grünes Checkmark "Keine Lücken im gewählten Zeitraum"

### KPI-Karten (oben)
- [ ] Karte: Gesamte verfügbare SP (gefilterter Zeitraum)
- [ ] Karte: Anzahl Mitarbeiter (gefiltert)
- [ ] Karte: Anzahl Pikett-Lücken
- [ ] Karte: Anzahl Betrieb-Lücken

## Technische Details
- Komponente: `src/components/dashboard/DashboardView.tsx`
- Unter-Komponenten:
  - `KPICards.tsx` – 4 Kennzahl-Karten oben
  - `SPBarChart.tsx` – Recharts BarChart
  - `AbsenzTabelle.tsx` – Absenz-Übersicht
  - `LueckenListe.tsx` – Pikett/Betrieb Lücken
- Recharts bereits in package.json vorhanden
- Teamfarben (konsistent mit Kalender-Legende):
  - NET: #003F7F (Bundesblau)
  - ACM: #0070C0 (Hellblau)
  - CON: #00B050 (Grün)
  - PAF: #FF6600 (Orange)
- Alle Berechnungen via sp-calculator.ts (bereits vorhanden, nicht neu schreiben)
- Filter-State aus App.tsx (Props)

## Abhängigkeiten
- Feature 08: sp-calculator.ts (calculateSPForIteration, calculateSPForPI)
- Feature 09: FilterState (aktive Filter)
- Feature 04: pis[] mit iterationen[]
- Feature 07: allocations[] der Mitarbeiter

## Status
- [ ] Design: offen
- [ ] Implementierung: offen
- [ ] Tests: offen

## Session-Typ: IMPL
