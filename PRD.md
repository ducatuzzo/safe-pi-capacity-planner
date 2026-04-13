# PRD.md – Product Requirements Document: SAFe PI Capacity Planner

## Ziel
Eine Fullstack-Webanwendung, die Teams bei BIT ermöglicht, ihre verfügbaren Story Points pro SAFe PI und Iteration zu berechnen. Jeder Mitarbeiter trägt seine Absenzen via Maus-Drag über einen Kalender ein. Das System berechnet automatisch die Kapazität unter Berücksichtigung von Feiertagen, Schulferien, FTE, Betriebsanteilen und Pauschalen. Das Dashboard zeigt Engpässe (Pikett-Lücken, Betrieb-Unterbesetzung) sofort an.

## Features (priorisiert)

### ABGESCHLOSSEN (MVP)

1. **Kalenderansicht mit Maus-Drag-Buchung** ✅
   - Kalender zeigt Datum, Wochentag, KW, PI-Zeitspanne
   - Maus über Zellen ziehen → Buchungstyp wird gesetzt (gem. gewählter Legende)
   - Feiertage, Schulferien, Blocker automatisch eingefärbt
   - Change-Freeze: Schneeflocke ❄️ + Hellblau
   - Heute: fett + rot hervorgehoben
   - Wochenenden ausgegraut, nicht buchbar

2. **Mitarbeiterstamm (Settings)** ✅
   - Felder: Vorname, Name, Team, Typ (iMA/eMA), FTE, Kapazität %, Betrieb %, Pauschale %
   - CRUD (erstellen, bearbeiten, löschen einzeln + gesamthaft)
   - CSV-Import / CSV-Export

3. **PI-Planung (Settings)** ✅
   - PI-Bezeichnung (z.B. PI26-1), Startdatum, Enddatum
   - 4 Iterationen pro PI, variabel konfigurierbar (Länge anpassbar)
   - CSV-Import / CSV-Export

4. **Feiertage (Settings)** ✅
   - Name, Startdatum, Enddatum
   - CSV-Import / CSV-Export

5. **Schulferien (Settings)** ✅
   - Name, Startdatum, Enddatum
   - CSV-Import / CSV-Export

6. **Blocker & Spezielle Perioden (Settings)** ✅
   - Name, Startdatum, Enddatum
   - Darstellung: ❄️ Schneeflocke-Symbol + Hellblau (#BFDBFE)
   - CSV-Import / CSV-Export

7. **SP-Berechnung** ✅
   - Pro Mitarbeiter, Team, Iteration, PI
   - Abzüge: Betrieb %, Pauschale %, Absenzen, Feiertage, Wochenenden
   - Teilzeit = 0.5 SP pro Tag
   - Blocker-Tage zählen als Arbeitstage (Freeze ≠ Absenz)

8. **Dashboard-Ansicht** ✅
   - KPI-Karten, BarChart, Absenz-Tabelle
   - Pikett-Lücken und Betrieb-Unterbesetzung (aktuell teilweise hardcodiert → Feature 17)

9. **PI Dashboard Tab** ✅
   - SP-Vergleich: Berechnet vs. Netto vs. Jira
   - Auslastung % pro Team/Iteration/PI
   - SP in Jira editierbar (localStorage)
   - Farbcodierung: grün <85%, orange 85–100%, rot >100%

10. **Backup & Restore** ✅
    - Gesamtexport als JSON (versioniert mit Zeitstempel)
    - Wiederherstellung aus JSON-File

11. **Filter (durchgehend)** ✅
    - Team, Iteration(en), Zeitraum, Jahr
    - Filter gelten in allen Ansichten gleichzeitig

12. **Export** ✅
    - PDF-Export für Confluence
    - Bild-Export (PNG) für Confluence

13. **Multiuser** ✅
    - Socket.io State-Sync
    - Row-Locking
    - Verbindungsindikator im Header

14. **Farbeinstellungen** ✅
    - Color-Picker pro Buchungstyp
    - CSV Import/Export
    - Reset auf Standardwerte

15. **Corporate Design Bund** ✅
    - Bundesblau #003F7F, Bundesrot #E63312
    - Frutiger-Schrift (Fallback Arial)
    - Bundeslogo SVG

### GEPLANT (Phase 2)

16. **Team-Konfiguration & Kapazitätsparameter** 🔲
    - Min. Personen Pikett pro Tag (gilt inkl. WE + Feiertage)
    - Min. Personen Betrieb pro Arbeitstag (exkl. WE + gesetzliche Feiertage)
    - Konfiguration pro Team (Settings-Subtab)
    - Globale Parameter: SP/Tag (default 1, variabel), Std/Jahr (default 1600)
    - Lücken-Erkennung verwendet konfigurierte Werte (nicht mehr hardcodiert)
    - CSV Import/Export für Team-Konfiguration
    - PI Dashboard: SP Netto (berechnet) vs. SP Jira (editierbar PO), Delta mit Farbhinweis
    - Backup/Restore eingeschlossen
    - Spec: features/feature-17-team-config.md

### NICE TO HAVE (Phase 3)

17. **Jira REST API Integration**
    - Ersetzt manuelle SP-Eingabe im PI Dashboard
    - Liest committete Story Points direkt aus Jira

18. **Confluence-Integration**
    - Direktexport via Confluence REST API

## Out of Scope
- Mobile App
- SSO / Active Directory Integration (Phase 3+)
- SAP-Integration
- Automatische Feiertagsberechnung (wird manuell gepflegt)

## Erfolgskriterien
- [x] Kapazitätsplanung für ein vollständiges PI in unter 30 Minuten abgeschlossen
- [x] Story Point Berechnung stimmt mit manueller Excel-Rechnung überein
- [x] Pikett-Lücken werden im Dashboard rot markiert
- [x] Backup lässt sich vollständig wiederherstellen
- [x] CD Bund eingehalten (Farben, Schrift, Logo)
- [ ] Mindestbesetzungs-Parameter pro Team konfigurierbar (Feature 17)
- [ ] SP/Tag und Std/Jahr global konfigurierbar (Feature 17)

## Quelldateien
- `C:\Users\Davide\Documents\AI\mitarbeiterstamm.csv`
- `C:\Users\Davide\Documents\AI\gesetzliche_feiertage_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\schulferien_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\pi_planung_(iterationen)_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\blocker___spezielle_perioden_2026-03-25.csv`
- `C:\Users\Davide\Documents\AI\CD-Bund-Manual_deutsch.pdf`
- `C:\Users\Davide\Documents\AI\Bundeslogo_PNG\` (Logos)
