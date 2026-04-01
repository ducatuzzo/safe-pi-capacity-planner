# Feature 07: Drag-Buchung

## Ziel
Maus-Drag über Kalender-Zellen setzt Buchungen. Benutzer wählt Buchungstyp in der Legende, zieht dann über beliebig viele Zellen eines Mitarbeiters. Einzelklick setzt eine Zelle, Drag setzt einen Bereich. Rechtsklick oder Klick auf belegte Zelle löscht Buchung.

## Akzeptanzkriterien
- [ ] Buchungstyp wählbar via Legende (aktiv hervorgehoben)
- [ ] Einzelklick auf leere Zelle → setzt gewählten Buchungstyp
- [ ] Maus-Drag über mehrere Zellen einer Zeile → setzt Buchungstyp für alle Zellen
- [ ] Drag nur horizontal (innerhalb einer Mitarbeiter-Zeile)
- [ ] Klick auf bereits gebuchte Zelle → löscht Buchung (zurück auf NONE)
- [ ] Wochenenden und Feiertage sind nur mit Typ PIKETT oder BETRIEB_PIKETT buchbar (7×24-Verfügbarkeit); alle anderen Typen haben keinen Effekt
- [ ] Drag-Vorschau: Zellen werden während dem Ziehen visuell hervorgehoben
- [ ] Änderungen sofort im globalen State (Employee.allocations)
- [ ] Alle Buchungen einzeln löschbar
- [ ] "Alle Buchungen löschen" pro Mitarbeiter (Rechtsklick-Kontextmenü oder Button)
- [ ] "Alle Buchungen löschen" für alle Mitarbeiter (in Toolbar)

## Interaktionslogik
```
onMouseDown(employeeId, dateStr):
  → dragStart = { employeeId, dateStr }
  → isMouseDown = true
  → setAllocation(employeeId, dateStr, selectedType)

onMouseEnter(employeeId, dateStr):
  → wenn isMouseDown && employeeId == dragStart.employeeId:
    → setAllocation(employeeId, dateStr, selectedType)

onMouseUp():
  → isMouseDown = false
  → dragStart = null

onMouseDown / onMouseEnter auf Wochenende oder Feiertag:
  → wenn selectedType != PIKETT && selectedType != BETRIEB_PIKETT: kein Effekt
  → sonst: Buchung setzen wie normal

Klick auf gebuchte Zelle (gleicher Typ wie selectedType):
  → Buchung löschen (NONE)
```

## Technische Details
- Event-Handler in `CalendarCell.tsx` (onMouseDown, onMouseEnter, onMouseUp)
- Globaler mouseup-Listener auf `document` (verhindert "stuck drag" wenn Maus ausserhalb loslassen)
- State für Drag: useRef (kein Re-render während Drag)
- `selectedAllocationType` State in `CalendarGrid.tsx` oder App-Level
- Performance: Zellen-Updates via direktem State-Patch (nicht ganzes Array neu rendern)
- Kein Touch-Support in Phase 1

## Legende-Interaktion
- Legende zeigt alle AllocationType mit Farbe + Kurztext
- Aktiv gewählter Typ: fetter Rahmen + leichte Vergrösserung
- Default: FERIEN beim ersten Load

## Abhängigkeiten
- Feature 06: CalendarGrid.tsx, CalendarCell.tsx müssen vorhanden sein

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (27.03.2026)
- [ ] Tests: offen (nicht automatisiert)

## Session-Typ: IMPL
