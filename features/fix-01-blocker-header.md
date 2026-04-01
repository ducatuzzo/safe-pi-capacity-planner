# FIX-01: Blocker/Freeze Schneeflocke im Datums-Header

## Ziel
Schneeflocke ❄️ wird im Kalender-Header (Datumszeile) angezeigt, nicht in den Mitarbeiter-Zellen. Optisch wie "Heute" — Hervorhebung auf Spaltenebene, nicht auf Zellenebene.

## Akzeptanzkriterien
- [ ] Schneeflocke ❄️ erscheint im Datumsfeld des Headers (Zeile mit DD + Wochentag)
- [ ] Hintergrund der Datumsspalte: #BFDBFE (Hellblau) — nur im Header
- [ ] Mitarbeiter-Zellen bei Blocker-Tagen: KEIN spezielles Styling (buchbar wie normale Arbeitstage)
- [ ] Darstellung verzieht das Grid nicht (kein Zeilenumbruch, kein Overflow)
- [ ] Schneeflocke nur wenn Tag innerhalb eines Blocker-Zeitraums liegt
- [ ] Tooltip im Header: Blocker-Name (z.B. "End of Year Freeze")
- [ ] Konsistent mit "Heute"-Markierung (Spalten-Highlight statt Zellen-Highlight)

## Technische Details
- Datei: `src/components/calendar/CalendarHeader.tsx`
- Datumszeile: die unterste Header-Zeile mit DD + Wochentag
- Prüfung: `isDayInAnyBlocker(dateStr, appData.blocker)` — Helper bereits in calendar-helpers.ts oder neu anlegen
- Styling Datums-Header-Zelle bei Blocker:
  - Hintergrund: `bg-blue-100` (#BFDBFE)
  - Inhalt: `❄️` + DD + Wochentag (z.B. "❄️ 24 Mi")
  - Schrift: normal (nicht fett/rot wie Heute)
- Mitarbeiter-Zellen: Blocker-Farbe aus den Zellen ENTFERNEN falls noch vorhanden

## Abgrenzung
- Blocker-Tage sind Arbeitstage → keine SP-Abzüge, buchbar
- Nur visueller Hinweis im Header dass an diesem Tag ein Freeze aktiv ist

## Status
- [x] Implementierung: abgeschlossen
- [ ] Visuell verifiziert: offen

## Session-Typ: IMPL (klein, max 15 Minuten)
