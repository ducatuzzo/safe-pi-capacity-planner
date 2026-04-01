# Benutzerdokumentation SAFe PI Capacity Planner
**Version:** 1.2
**Stand:** 01.04.2026
**Erstellt für:** BIT – Bundesamt für Informatik und Telekommunikation

---

## 1. Überblick

Der **SAFe PI Capacity Planner** ist eine Webanwendung zur Kapazitätsplanung für SAFe PI Planning. Er berechnet verfügbare Story Points (SP) pro Team und Iteration unter Berücksichtigung von Absenzen, Feiertagen, Schulferien, Betriebsaufgaben und FTE.

### Navigation (Tabs)

| Tab | Funktion |
|-----|---------|
| **Planung** | Kalender-Grid: Absenzen und Buchungen pro Mitarbeiter erfassen |
| **Kapazität** | SP-Berechnung pro Mitarbeiter und Team anzeigen |
| **Dashboard** | KPI-Übersicht: SP-Diagramm, Absenz-Tabelle, Pikett/Betrieb-Lücken |
| **PI Dashboard** | Vergleich Jira-SP vs. berechnete App-Kapazität pro PI und Team |
| **Einstellungen** | Mitarbeiter, PI-Planung, Feiertage, Zielwerte, Farben verwalten |

---

## 2. Filterleiste

Die Filterleiste erscheint bei den Tabs Planung, Kapazität, Dashboard und PI Dashboard.

| Filter | Funktion |
|--------|---------|
| **Team** | Schaltflächen ACM / CON / NET / PAF – mehrere gleichzeitig wählbar |
| **PI** | Dropdown – filtert auf ein bestimmtes PI |
| **Iteration** | Dropdown – filtert auf eine Iteration (erscheint nach PI-Auswahl) |
| **Jahr** | Dropdown – filtert auf ein Kalenderjahr |
| **Zeitraum** | Von/Bis-Datum frei wählbar |

---

## 3. Planung-Tab

### Buchungstypen
| Kürzel | Typ | Farbe | SP-Auswirkung |
|--------|-----|-------|---------------|
| F | Ferien/Frei | Orange | 0 SP |
| A | Abwesenheit | Dunkelgrau | 0 SP |
| T | Teilzeit | Hellgelb | 0.5 SP |
| M | Militär | Hellgrün | 0 SP |
| I | IPA | Lila | 0 SP |
| B | Betrieb | Hellblau | 0 SP |
| BP | Betrieb + Pikett | Violett | 0 SP |
| P | Pikett | Rosa | 0 SP |

### Drag-Buchung
1. Buchungstyp links in der Legende auswählen (Klick)
2. Auf erste Zelle klicken und gedrückt halten
3. Über die gewünschten Tage ziehen
4. Loslassen – alle Tage werden mit dem gewählten Typ gebucht
5. Rechtsklick auf gebuchte Zelle löscht die Buchung

---

## 4. Dashboard-Tab

Zeigt Planungsergebnis auf einen Blick:
- **KPI-Karten:** Gesamte SP, Mitarbeiter, Pikett-Lücken, Betrieb-Lücken
- **Balkendiagramm:** Verfügbare SP pro Team pro Iteration (Recharts)
- **Absenz-Tabelle:** Tage pro Typ pro Mitarbeiter mit Teamsummen
- **Lücken-Erkennung:** Pikett/Betrieb-Unterbesetzung nach Kalenderwoche

PDF/PNG-Export: Buttons oben rechts

---

## 5. PI Dashboard-Tab *(neu in v1.2)*

### Zweck
Direkter Vergleich zwischen in Jira committeten Story Points und der vom Planner berechneten Kapazität. Dient als Planungsübersicht für Chapter Leads / Scrum Masters.

### Bedienung

**Filterleiste:** Team-, PI-, Jahr-Filter wirken auf alle angezeigten Tabellen.

**Aufbau:**
- Pro PI eine Sektion mit PI-Name und Datumsbereich
- Pro Team eine Tabelle mit farbigem Team-Header

**Spalten der Tabelle:**

| Spalte | Beschreibung |
|--------|-------------|
| Iteration | Name der Iteration |
| Betriebstage | Arbeitstage (Mo–Fr) ohne gesetzliche Feiertage |
| SP in Jira *(editierbar)* | Manuell erfasste Jira-Commitments |
| Berechnet SP | Theoretische Kapazität (ohne tagsgenaue Buchungen) |
| Verfügbar SP Netto | Tagesgenaue Kapazität (inkl. FERIEN, ABWESEND etc.) |
| Auslastung Jira % | SP in Jira ÷ Verfügbar SP Netto × 100 |
| Auslastung App % | Berechnet SP ÷ Verfügbar SP Netto × 100 |

**PI Total-Zeile:** Summen aller Iterationen (blau hervorgehoben)

### SP in Jira erfassen

1. Auf eine Zelle in der Spalte "SP in Jira" klicken
2. Eingabefeld erscheint – Zahl eingeben (Dezimalwerte mit Punkt oder Komma)
3. **Enter** oder Klick ausserhalb speichert den Wert
4. **Escape** bricht ab – Originalwert bleibt erhalten

> **Hinweis:** Die SP-in-Jira-Werte werden **lokal im Browser** gespeichert (localStorage).
> Sie sind gerätespezifisch und werden nicht mit anderen Benutzern synchronisiert.

### Farbcodierung Auslastung

| Farbe | Bereich | Bedeutung |
|-------|---------|-----------|
| Grün | < 85 % | Kapazität gut genutzt |
| Orange | 85 – 100 % | Nah an der Grenze – Achtung |
| Rot | > 100 % | Überlastet – Anpassung nötig |

### Screenshot-Platzhalter
`[Screenshot: PI Dashboard Tab mit drei Teams und farbiger Auslastungsanzeige]`

---

## 6. Einstellungen

### Mitarbeiter
- CRUD: Hinzufügen, Bearbeiten, Löschen
- CSV-Import: Spalten `vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag`
- CSV-Export: aktuellen Stand herunterladen

### PI-Planung & Iterationen
- PIs anlegen mit Start/Ende-Datum
- Iterationen pro PI mit Start/Ende-Datum
- CSV-Import/Export möglich

### Feiertage / Schulferien / Blocker
- Je eigene Liste im Settings-Tab
- CSV-Import/Export

### Team-Zielwerte
- Mindestanzahl Personen Pikett/Betrieb pro Team
- Beeinflusst Lücken-Erkennung im Dashboard

### Farbeinstellungen
- Farben aller Buchungstypen anpassen
- Color-Picker, CSV-Export/Import, Reset auf Standard

### Backup & Restore
- **Export:** Vollständiger JSON-Export (Mitarbeiter + Buchungen + Einstellungen)
- **Import:** JSON-Datei laden (überschreibt aktuelle Daten)
- Format: `safe-pi-planner-backup-YYYY-MM-DD.json`

---

## 7. Tipps & Häufige Fragen

**F: Die SP-in-Jira-Werte sind nach Browser-Neustart weg.**
A: Das passiert bei gelöschtem Browser-Cache. Werte werden in localStorage gespeichert – bei Browser-Cache-Löschung gehen sie verloren. Für persistente Speicherung: Backup der App-Daten (JSON-Export) erstellen.

**F: Warum unterscheiden sich "Berechnet SP" und "Verfügbar SP Netto"?**
A: Berechnet SP ist theoretisch (keine Buchungen berücksichtigt). Verfügbar SP Netto ist tagesgenau und zieht Ferien, Abwesenheiten etc. ab.

**F: Wie wirken Filter auf den PI Dashboard?**
A: Team-Filter blendet Teams aus, PI-Filter zeigt nur das gewählte PI, Jahr-Filter filtert PIs nach Jahr.
