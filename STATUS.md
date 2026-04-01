# STATUS.md – Stand: 01.04.2026

## Projektstatus
✅ Alle Features abgeschlossen. App produktionsbereit.

## Abgeschlossene Features (vollständig)
- Feature 01: Projektgerüst ✅
- Feature 02: Typen & Datenmodell ✅
- Feature 03: Mitarbeiterstamm (CRUD + CSV) ✅
- Feature 04: PI-Planung & Iterationen (CRUD + CSV + Validierung) ✅
- Feature 05: Feiertage / Schulferien / Blocker (CRUD + CSV) ✅
- Feature 06: Kalender-Komponente (Grid, Farbcodes, Sticky, Legende) ✅
- Feature 07: Drag-Buchung (Interpolation) ✅
- Feature 08: SP-Berechnung (pure functions, Kapazitäts-Tab, Seed-Daten) ✅
- Feature 09: Filter (Team, PI, Iteration, Jahr, Zeitraum – durchgehend) ✅
- Feature 10: Dashboard (KPI-Karten, BarChart, Absenz-Tabelle, Lücken) ✅
- Feature 11: Backup/Restore (JSON Export/Import, versioniert) ✅
- Feature 12: PDF/PNG Export (für Confluence) ✅
- Feature 13: CD Bund (Farben, Schrift, Logo) ✅
- Feature 14: Team-Zielwerte konfigurierbar (Settings, CSV Import/Export) ✅
- Feature 15: Multiuser (Socket.io State-Sync, Row-Locking, Verbindungsindikator) ✅
- Feature 16: Farbeinstellungen (Buchungstypen + Kalender, Color-Picker, CSV, Reset) ✅
- Feature PI-Dashboard-Tab: PI Dashboard Tab (Jira-SP vs. App-SP, Farbcodierung, localStorage) ✅

## Behobene Bugs & Fixes
- BUG-01: Drag-Interpolation ✅
- BUG-02: CalendarHeader crash ohne Iterationen ✅
- BUG-03: SEED_BLOCKER fehlte in App.tsx ✅
- FIX-01: Blocker ❄️ im Datums-Header ✅
- FIX-02: Farbcodes Buchungstypen korrigiert ✅
- FIX-03: Legendenbuchstaben in Kalender-Zellen (F/A/T/M/I/B/BP/P) ✅
- FIX-04: Logo ersetzt durch Logo_RGB_farbig_negativ.svg ✅
- FIX-05: Header vergrössert (Logo h-14, Titel text-xl, Padding py-4) ✅

## Dokumentation (muss bei Änderungen nachgeführt werden)
- Installationshandbuch: docs/installationshandbuch_v1.0.md ✅
- Benutzerdokumentation: docs/benutzerdokumentation_v1.2.md ✅ (PI Dashboard Tab ergänzt)
- Deployment-Handbuch: docs/deployment_handbuch_v1.0.md ✅
- CLAUDE.md: Technischer Kompass für Claude Sessions ✅ (neu 01.04.2026)

## Offene Punkte (optional / zukünftig)
- Persistenter Server-State via JSON-File (statt in-memory)
- Confluence REST API Export
- Mobile-Optimierung

## Projektpfad
- Context Engineering: `C:\Users\Davide\Documents\AI\safe-pi-planner\`
- App-Code: `C:\Users\Davide\Documents\AI\safe-pi-planner\safe-pi-capacity-planner\`
- Dokumentation: `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
- Starten: `npm run dev` im App-Code Verzeichnis
