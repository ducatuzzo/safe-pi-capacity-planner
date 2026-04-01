# Feature: PI Dashboard Tab

## Ziel
Neuer Tab "PI Dashboard" der einen direkten Vergleich zwischen Jira-committierten Story Points und der berechneten App-Kapazität pro Team und Iteration ermöglicht. Dient als Planungsübersicht für Chapter Leads / Scrum Masters.

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (01.04.2026)
- [ ] Tests: offen (nicht automatisiert)

## Akzeptanzkriterien

### Navigation
- [x] Neuer Tab "PI Dashboard" zwischen "Dashboard" und "Einstellungen"
- [x] FilterBar (Team, PI, Jahr, Zeitraum) wirkt auf PI Dashboard

### Tabelle pro Team / PI
- [x] Pro PI eine Sektion mit PI-Name und Datumsbereich
- [x] Pro Team eine eigene Tabelle mit farbigem Team-Header (NET/ACM/CON/PAF Teamfarben)
- [x] Spalten: Iteration | Betriebstage | SP in Jira | Berechnet SP | Verfügbar SP Netto | Auslastung Jira % | Auslastung App %
- [x] PI Total-Zeile (Summen aller Iterationen)

### SP in Jira – manuelle Eingabe
- [x] Klick auf Zelle öffnet Inline-Input (Zahl, 0.5-Schritte)
- [x] Enter oder Blur speichert den Wert
- [x] Escape bricht ab (Originalwert bleibt)
- [x] Persistenz via localStorage (Key: `pi-dashboard-sp-jira-v1`)
- [x] Wert 0 oder leer wird als "–" angezeigt

### Berechnungen
- [x] **Betriebstage:** Arbeitstage (Mo–Fr) ohne gesetzliche Feiertage
- [x] **Berechnet SP:** Theoretisch – Betriebstage × Summe(emp.storyPointsPerDay × fte × (1−betriebPercent%) × (1−pauschalPercent%))
- [x] **Verfügbar SP Netto:** Aus sp-calculator.ts – berücksichtigt tagsgenaue Buchungen (FERIEN, ABWESEND, MILITAER, IPA, TEILZEIT)
- [x] **Auslastung Jira %:** spJira / verfuegbarSP × 100
- [x] **Auslastung App %:** berechnetSP / verfuegbarSP × 100

### Farbcodierung Auslastung
- [x] < 85 %: grün (gut)
- [x] 85–100 %: orange (Achtung)
- [x] > 100 %: rot (Überlastet)
- [x] Gilt für Iteration-Zeilen UND PI Total-Zeile

### Legende
- [x] Farblegende mit Grenzwerten oben
- [x] Hinweis auf editierbare SP-in-Jira-Zellen

## Technische Details

### Komponenten
| Datei | Beschreibung |
|-------|-------------|
| `src/hooks/usePIDashboard.ts` | Daten-Hook: Berechnung, localStorage, Filter |
| `src/components/pidashboard/PIDashboardView.tsx` | Hauptansicht: Sektionen pro PI |
| `src/components/pidashboard/PIDashboardTable.tsx` | Tabelle pro Team innerhalb eines PI |
| `src/components/pidashboard/PIDashboardRow.tsx` | Iteration-Zeile + PI-Total-Zeile + SpJiraEdit |

### Geänderte Dateien
| Datei | Änderung |
|-------|---------|
| `src/types.ts` | `ActiveTab` erweitert um `'pidashboard'` |
| `src/components/layout/TabNav.tsx` | Neuer Tab-Eintrag "PI Dashboard" |
| `src/App.tsx` | Import + Rendering + showFilterBar |

### Abhängigkeiten
- `sp-calculator.ts` – `calculateSPForTeam()` für Verfügbar SP Netto
- `calendar-helpers.ts` – `getWorkingDays()` für Betriebstage
- Kein neues npm-Paket

### localStorage-Schema
```json
{
  "pi-dashboard-sp-jira-v1": {
    "${piId}::${iterationId}::${team}": 42.5
  }
}
```

## Nicht in Scope
- Kein Server-Sync der SP-Jira-Werte (lokale Planung)
- Kein CSV-Export der Tabelle (Phase 2)
- Keine Jira-API-Integration (Phase 2)
