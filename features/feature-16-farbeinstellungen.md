# Feature 16: Farbeinstellungen in Settings

## Ziel
Alle Buchungstyp-Farben, Kalenderfarben und Schriftfarben des SAFe PI Capacity Planners sind in den Einstellungen konfigurierbar. Änderungen wirken sofort auf Kalender, Legende und Dashboard.

## Akzeptanzkriterien
- [x] Settings-Tab: neuer Bereich "Farbeinstellungen"
- [x] Tabelle Buchungstyp-Farben: Typ | Hintergrundfarbe | Schriftfarbe | Vorschau
  - F – Ferien/Frei
  - A – Abwesenheit
  - T – Teilzeit
  - M – Militär
  - I – IPA
  - B – Betrieb
  - BP – Betrieb und Pikett
  - P – Pikett
- [x] Tabelle Kalenderfarben: Typ | Hintergrundfarbe | Schriftfarbe | Vorschau
  - Feiertag
  - Schulferien
  - Blocker/Freeze
  - Wochenende
  - Heute (Schriftfarbe + fett)
- [x] Farbwahl via nativen `<input type="color">` Picker
- [x] Vorschau-Zelle zeigt Buchstabe (F/A/T...) mit gewählten Farben
- [x] "Auf Standard zurücksetzen" Button pro Zeile + gesamthaft
- [x] Änderungen sofort wirksam (live preview im Kalender)
- [x] Farbwerte im globalen State gespeichert und im Backup enthalten
- [x] CSV Export/Import der Farbkonfiguration

## Technische Details
- Komponente: `src/components/settings/FarbeinstellungenSettings.tsx`
- State: `farbConfig: FarbConfig` in App.tsx
- Interface FarbConfig in types.ts:
```typescript
interface BuchungsFarbe {
  bg: string;   // hex z.B. '#FB923C'
  text: string; // hex z.B. '#FFFFFF'
}
interface FarbConfig {
  buchungstypen: Record<AllocationType, BuchungsFarbe>;
  kalender: {
    feiertag: BuchungsFarbe;
    schulferien: BuchungsFarbe;
    blocker: BuchungsFarbe;
    wochenende: BuchungsFarbe;
    heute: { text: string; bold: boolean };
  };
}
```
- CalendarCell.tsx und CalendarHeader.tsx lesen Farben aus FarbConfig statt aus constants.ts
- Default-Werte: aktuelle Werte aus constants.ts (BUCHUNGSTYP_FARBEN, KALENDER_FARBEN)
- CSS: inline styles für dynamische Farben (Tailwind JIT kann keine dynamischen Hex-Werte)

## Abhängigkeiten
- Feature 07: CalendarCell.tsx
- Feature 11: Backup muss FarbConfig einschliessen

## Status
- [x] Design: abgeschlossen (28.03.2026)
- [x] Implementierung: abgeschlossen (28.03.2026)

## Session-Typ: IMPL (mittel)
