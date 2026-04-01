# PRD.md – Product Requirements Document: SAFe PI Capacity Planner

## Ziel
Eine Fullstack-Webanwendung, die Teams bei BIT ermöglicht, ihre verfügbaren Story Points pro SAFe PI und Iteration zu berechnen. Jeder Mitarbeiter trägt seine Absenzen via Maus-Drag über einen Kalender ein. Das System berechnet automatisch die Kapazität unter Berücksichtigung von Feiertagen, Schulferien, FTE, Betriebsanteilen und Pauschalen. Das Dashboard zeigt Engpässe (Pikett-Lücken, Betrieb-Unterbesetzung) sofort an.

## Features (priorisiert)

### MUSS HABEN (MVP)

1. **Kalenderansicht mit Maus-Drag-Buchung**
   - Kalender zeigt Datum, Wochentag, KW, PI-Zeitspanne
   - Maus über Zellen ziehen → Buchungstyp wird gesetzt (gem. gewählter Legende)
   - Feiertage, Schulferien, Blocker automatisch eingefärbt
   - Change-Freeze: Schneeflocke ❄️ + Hellblau
   - Heute: fett + rot hervorgehoben
   - Wochenenden ausgegraut, nicht buchbar
   - Skalierbar (Zoom/Scroll bei vielen Mitarbeitern)

2. **Mitarbeiterstamm (Settings)**
   - Felder: Vorname, Name, Team, Typ (iMA/eMA), FTE, Kapazität %, Betrieb %, Pauschale %
   - CRUD (erstellen, bearbeiten, löschen einzeln + gesamthaft)
   - CSV-Import / CSV-Export

3. **PI-Planung (Settings)**
   - PI-Bezeichnung (z.B. PI26-1), Startdatum, Enddatum
   - 4 Iterationen pro PI, variabel konfigurierbar (Länge anpassbar)
   - CSV-Import / CSV-Export
   - Quelldaten: pi_planung_(iterationen)_2026-03-25.csv

4. **Feiertage (Settings)**
   - Name, Startdatum, Enddatum
   - CSV-Import / CSV-Export
   - Quelldaten: gesetzliche_feiertage_2026-03-25.csv

5. **Schulferien (Settings)**
   - Name, Startdatum, Enddatum
   - CSV-Import / CSV-Export
   - Quelldaten: schulferien_2026-03-25.csv

6. **Blocker & Spezielle Perioden (Settings)**
   - Name, Startdatum, Enddatum
   - Beispiele: End of Year Freeze (2025-12-24 bis 2026-01-02)
   - Darstellung: ❄️ Schneeflocke-Symbol + Hellblau (#BFDBFE)
   - CSV-Import / CSV-Export
   - Quelldaten: blocker___spezielle_perioden_2026-03-25.csv

7. **Zielwerte pro Team (Settings)**
   - Min. Personen Pikett (P)
   - Min. Personen Betrieb (B)
   - Story Points pro Tag (default: 1)
   - Standardstunden pro Jahr (default: 1600)

8. **SP-Berechnung**
   - Pro Mitarbeiter, Team, Iteration, PI
   - Abzüge: Betrieb %, Pauschale %, Absenzen, Feiertage, Wochenenden
   - Teilzeit = 0.5 SP pro Tag
   - Blocker-Tage zählen als Arbeitstage (Freeze ≠ Absenz)

9. **Backup & Restore**
   - Gesamtexport als JSON (versioniert mit Zeitstempel)
   - Wiederherstellung aus JSON-File
   - Format: SavedProjectState (version, timestamp, year, employees, appData)

10. **Filter (durchgehend)**
    - Team, Iteration(en), Zeitraum, Jahr
    - Filter gelten in allen Ansichten gleichzeitig

### MUSS HABEN (Phase 2)

11. **Dashboard-Ansicht**
    - Planungsergebnis auf einen Blick
    - Kapazitäten pro PI oder Iteration (Balkendiagramm)
    - Absenz-Übersicht
    - Pikett-Lücken und Betrieb-Unterbesetzung hervorheben
    - Alle Filter durchgehend aktiv

12. **Export**
    - PDF-Export für Confluence
    - Bild-Export (PNG) für Confluence
    - Exportiert die aktuelle gefilterte Ansicht

13. **CSV/TXT Import/Export**
    - Jede Konfigurationskategorie einzeln importier-/exportierbar
    - Format: CSV mit Semikolon-Trenner (Schweizer Standard)

### NICE TO HAVE (Phase 3)

14. **Multiuser-Fähigkeit**
    - Socket.io bereits integriert
    - Mehrere Browser-Sessions gleichzeitig
    - Einfaches Locking (wer bearbeitet gerade?)

15. **Confluence-Integration**
    - Direktexport via Confluence REST API

## Out of Scope
- Mobile App
- SSO / Active Directory Integration (Phase 3+)
- SAP-Integration
- Automatische Feiertagsberechnung (wird manuell gepflegt)

## Erfolgskriterien
- [ ] Kapazitätsplanung für ein vollständiges PI (4 Iterationen, ~12 Wochen) in unter 30 Minuten abgeschlossen
- [ ] Story Point Berechnung stimmt mit manueller Excel-Rechnung überein
- [ ] Pikett-Lücken werden im Dashboard rot markiert
- [ ] Backup lässt sich vollständig wiederherstellen
- [ ] CD Bund eingehalten (Farben, Schrift, Logo)

## Quelldateien
- `C:\Users\Davide\Documents\AI\gesetzliche_feiertage_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\schulferien_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\pi_planung_(iterationen)_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\blocker___spezielle_perioden_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\CD-Bund-Manual_deutsch.pdf`
- `C:\Users\Davide\Documents\AI\Bundeslogo_PNG\` (Logos)
