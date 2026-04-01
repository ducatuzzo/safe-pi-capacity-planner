# Feature 04: PI-Planung & Iterationen

## Ziel
Settings-Tab: PIs erfassen mit variablen Iterationen. CSV-Import der Quelldaten. Iterationen sind frei konfigurierbar in Länge und Anzahl (Standard: 4 pro PI, ~3 Wochen je Iteration).

## Akzeptanzkriterien
- [ ] Tabelle zeigt alle PIs (Name, Startdatum, Enddatum, Anzahl Iterationen)
- [ ] PI hinzufügen: Name, Startdatum, Enddatum
- [ ] Pro PI: Iterationen verwalten (aufklappbar oder eigene Sektion)
  - Iteration hinzufügen: Name, Startdatum, Enddatum
  - Iteration bearbeiten
  - Iteration löschen
- [ ] Validierung: Iterationen müssen innerhalb PI-Zeitraum liegen
- [ ] Validierung: Iterationen dürfen sich nicht überschneiden
- [ ] PI löschen (inkl. aller Iterationen, mit Bestätigung)
- [ ] Alle PIs löschen (mit Bestätigung)
- [ ] CSV-Import PIs (Quelldatei: pi_planung_(iterationen)_2026-03-25.csv)
- [ ] CSV-Export PIs
- [ ] Änderungen sofort im globalen State sichtbar

## CSV-Format PI (Semikolon, UTF-8 BOM)
```
name;startStr;endStr
PI25-4;2025-12-29;2026-03-11
PI26-1;2026-03-12;2026-06-03
PI26-2;2026-06-04;2026-08-26
PI26-3;2026-08-27;2026-11-18
PI26-4;2026-11-19;2027-02-10
```
Hinweis: Iterationen werden nach Import manuell oder automatisch aufgeteilt.

## Automatische Iterations-Aufteilung (optional)
Bei CSV-Import ohne Iterationen: PI-Zeitraum gleichmässig in 4 Iterationen aufteilen.
Benutzer kann danach manuell anpassen.

## Technische Details
- Komponente: `src/components/settings/PISettings.tsx`
- Unter-Komponente: `src/components/settings/IterationEditor.tsx`
- State: PIPlanning[] im globalen App-State
- ID-Generierung: `crypto.randomUUID()`
- Datumsformat: YYYY-MM-DD (ISO 8601, konsistent mit Quelldaten)
- CSV-Export: Dateiname `pi_planung_YYYY-MM-DD.csv`

## Abhängigkeiten
- Feature 02 (types.ts): PIPlanning, Iteration Interfaces

## Quelldaten zum Vorladen
```
PI25-4: 2025-12-29 – 2026-03-11
PI26-1: 2026-03-12 – 2026-06-03
PI26-2: 2026-06-04 – 2026-08-26
PI26-3: 2026-08-27 – 2026-11-18
PI26-4: 2026-11-19 – 2027-02-10
```

## Status
- [ ] Design: offen
- [ ] Implementierung: offen
- [ ] Tests: offen

## Session-Typ: IMPL
