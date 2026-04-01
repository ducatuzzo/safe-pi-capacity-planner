# Feature 05: Feiertage, Schulferien & Blocker

## Ziel
Settings-Tab: Drei separate Konfigurationsbereiche für Feiertage, Schulferien und Blocker/Spezielle Perioden. CSV-Import aus Quelldateien. Alle drei beeinflussen die Kalenderdarstellung.

## Akzeptanzkriterien

### Feiertage
- [ ] Tabelle: Name, Startdatum, Enddatum
- [ ] CRUD (hinzufügen, bearbeiten, löschen einzeln + alle)
- [ ] CSV-Import (Quelldatei: gesetzliche_feiertage_2026-03-25.csv)
- [ ] CSV-Export

### Schulferien
- [ ] Tabelle: Name, Startdatum, Enddatum
- [ ] CRUD (hinzufügen, bearbeiten, löschen einzeln + alle)
- [ ] CSV-Import (Quelldatei: schulferien_2026-03-25.csv)
- [ ] CSV-Export

### Blocker & Spezielle Perioden
- [ ] Tabelle: Name, Startdatum, Enddatum
- [ ] CRUD (hinzufügen, bearbeiten, löschen einzeln + alle)
- [ ] CSV-Import (Quelldatei: blocker___spezielle_perioden_2026-03-25.csv)
- [ ] CSV-Export
- [ ] Hinweis in UI: "Blocker-Tage zählen als Arbeitstage (kein SP-Abzug)"

### Gemeinsam
- [ ] Alle drei Bereiche im selben Settings-Tab als eigene Sektionen
- [ ] CSV-Format: Semikolon, UTF-8 BOM, Header: name;startStr;endStr
- [ ] Validierung: Enddatum >= Startdatum
- [ ] Alle Fehlermeldungen auf Deutsch

## Kalender-Einfluss (für Feature 06 relevant)
| Typ | Farbe | Symbol |
|-----|-------|--------|
| Feiertag | #D1D5DB (Grau) | – |
| Schulferien | #E5E7EB (Hellgrau) | – |
| Blocker/Freeze | #BFDBFE (Hellblau) | ❄️ |

## Technische Details
- Komponente: `src/components/settings/KalenderDatenSettings.tsx`
- Wiederverwendbare Unter-Komponente: `DateRangeTable.tsx` (für alle drei Listen)
- State: AppData.feiertage, AppData.schulferien, AppData.blocker

## Quelldaten
- gesetzliche_feiertage_2026-03-25.csv (14 Einträge, 2025–2026)
- schulferien_2026-03-25.csv (9 Einträge, 2025–2026)
- blocker___spezielle_perioden_2026-03-25.csv (1 Eintrag: End of Year Freeze)

## Abhängigkeiten
- Feature 02 (types.ts): DateRangeDefinition Interface

## Status
- [ ] Design: offen
- [ ] Implementierung: offen
- [ ] Tests: offen

## Session-Typ: IMPL
