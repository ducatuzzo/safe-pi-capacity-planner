# Feature 03: Mitarbeiterstamm

## Ziel
Settings-Tab: Mitarbeiter erfassen, bearbeiten, löschen. CSV-Import und -Export. Daten landen im globalen App-State und werden für SP-Berechnung und Kalender verwendet.

## Akzeptanzkriterien
- [ ] Tabelle zeigt alle Mitarbeiter (Vorname, Name, Team, Typ, FTE, Kapa%, Betrieb%, Pauschale%)
- [ ] "Neu"-Button öffnet Formular (Inline oder Modal)
- [ ] Formular-Felder:
  - Vorname (Text, required)
  - Name (Text, required)
  - Team (Text, required)
  - Typ: iMA / eMA (Select, required)
  - FTE: 0.0–1.0 (Number, default 1.0)
  - Kapazität %: 0–100 (Number, default 100)
  - Betrieb %: 0–100 (Number, default 0)
  - Pauschale %: 0–100 (Number, default 0)
  - Story Points/Tag: (Number, default 1)
- [ ] Validierung: Betrieb% + Pauschale% darf nicht > Kapazität% sein
- [ ] Bearbeiten (Stift-Icon pro Zeile)
- [ ] Löschen einzeln (Papierkorb-Icon pro Zeile, Bestätigung)
- [ ] Alle löschen (Button mit Bestätigung)
- [ ] CSV-Export (Semikolon-getrennt, UTF-8 mit BOM)
- [ ] CSV-Import (Datei-Upload, Fehlerbehandlung bei falschem Format)
- [ ] Änderungen sofort im globalen State sichtbar

## CSV-Format (Semikolon, UTF-8 BOM)
```
vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag
Max;Muster;Team A;iMA;1.0;100;20;10;1
Anna;Beispiel;Team B;eMA;0.8;80;15;5;1
```

## Technische Details
- Komponente: `src/components/settings/MitarbeiterSettings.tsx`
- State-Management: Props + Callback nach oben (kein Redux)
- ID-Generierung: `crypto.randomUUID()`
- CSV-Export: Blob + URL.createObjectURL, Dateiname `mitarbeiter_YYYY-MM-DD.csv`
- CSV-Import: FileReader API, Zeilen parsen, validieren, in State mergen
- Alle Fehlermeldungen auf Deutsch

## Abhängigkeiten
- Feature 02 (types.ts) muss abgeschlossen sein
- Employee Interface aus types.ts

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen
- [ ] Tests: offen (nicht automatisiert)

## Session-Typ: IMPL
