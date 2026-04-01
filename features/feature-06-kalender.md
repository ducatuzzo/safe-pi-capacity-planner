# Feature 06: Kalender-Komponente

## Ziel
Hauptansicht "Planung": Horizontaler Kalender mit Mitarbeitern als Zeilen und Tagen als Spalten. Zeigt Absenzen farbcodiert, Feiertage, Schulferien, Blocker, PI-Zeitspannen, KW und Heute-Markierung. Noch keine Drag-Buchung (kommt Feature 07).

## Akzeptanzkriterien
- [ ] Kalender-Grid: Zeilen = Mitarbeiter, Spalten = Tage
- [ ] Header Zeile 1: Monat (colspan über alle Tage des Monats)
- [ ] Header Zeile 2: KW (colspan über alle Tage der Woche)
- [ ] Header Zeile 3: PI-Name (colspan über PI-Zeitraum)
- [ ] Header Zeile 4: Iterations-Name (colspan über Iterations-Zeitraum)
- [ ] Header Zeile 5: Tagesdatum (DD) + Wochentag (Mo/Di/...)
- [ ] Wochenenden: ausgegraut (#F3F4F6), nicht buchbar
- [ ] Feiertage: grau (#D1D5DB) mit Tooltip (Name)
- [ ] Schulferien: hellgrau (#E5E7EB) mit Tooltip (Name)
- [ ] Blocker/Freeze: hellblau (#BFDBFE) + ❄️ Symbol mit Tooltip
- [ ] Heute: Spalte fett + rot (#E63312) hervorgehoben
- [ ] Allokationen farbcodiert (gem. Farbcodes in AI.md)
- [ ] Mitarbeiter-Spalte links fixiert (sticky) beim horizontalen Scrollen
- [ ] Header fixiert (sticky) beim vertikalen Scrollen
- [ ] Filterbar nach Team (zeigt nur Mitarbeiter des gewählten Teams)
- [ ] Filterbar nach PI / Iteration (zeigt nur den gewählten Zeitraum)

## Technische Details
- Komponente: `src/components/calendar/CalendarGrid.tsx`
- Unter-Komponente: `src/components/calendar/CalendarCell.tsx`
- Unter-Komponente: `src/components/calendar/CalendarHeader.tsx`
- Helper: `src/utils/calendar-helpers.ts`
  - `getWorkingDays(start, end, feiertage)`: gibt Arbeitstage zurück
  - `getDayMeta(date, appData)`: gibt Typ des Tages zurück (Feiertag, Schulferien, Blocker, Wochenende, Normal)
  - `getISOWeek(date)`: KW-Nummer
- Keine virtualisierung in Phase 1 (max ~20 MA, ~90 Tage = ~1800 Zellen, vertretbar)
- Datumslogik: alles UTC (new Date(dateStr + 'T00:00:00Z'))

## Farbcodes Zellen
| Zustand | Hintergrund | Text | Besonderheit |
|---------|-------------|------|--------------|
| Normal/leer | #FFFFFF | #1A1A1A | – |
| Wochenende | #F3F4F6 | #9CA3AF | nicht klickbar |
| Feiertag | #D1D5DB | #6B7280 | Tooltip |
| Schulferien | #E5E7EB | #6B7280 | Tooltip |
| Blocker | #BFDBFE | #1E40AF | ❄️ + Tooltip |
| Heute (Spalte) | – | #E63312 fett | Spalten-Highlight |
| FERIEN | #60A5FA | #FFFFFF | – |
| ABWESEND | #FB923C | #FFFFFF | – |
| TEILZEIT | #FDE68A | #1A1A1A | – |
| MILITAER | #84CC16 | #FFFFFF | – |
| IPA | #A78BFA | #FFFFFF | – |
| BETRIEB | #F87171 | #FFFFFF | – |
| BETRIEB_PIKETT | #DC2626 | #FFFFFF | – |
| PIKETT | #F9A8D4 | #1A1A1A | – |

## Legende
- Legende unterhalb des Kalenders (alle Buchungstypen mit Farbe + Label)
- Aktuell gewählter Buchungstyp hervorgehoben (für Feature 07)

## Abhängigkeiten
- Feature 02: types.ts
- Feature 03: employees[] im State
- Feature 04: pis[] mit iterationen[]
- Feature 05: feiertage[], schulferien[], blocker[]

## Status
- [x] Design: abgeschlossen (27.03.2026)
- [x] Implementierung: abgeschlossen (27.03.2026)
- [ ] Tests: offen (nicht automatisiert)

## Session-Typ: IMPL
## Hinweis: Komplexestes Feature – eigene Session, nicht mit Feature 07 kombinieren
