# Benutzerdokumentation SAFe PI Capacity Planner
**Version:** 1.3
**Stand:** 07.04.2026
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
| **PI Dashboard** | Vergleich Jira-SP vs. berechnete App-Kapazität pro PI und Team (inkl. Delta) |
| **Einstellungen** | Mitarbeiter, PI-Planung, Feiertage, Zielwerte, Team-Konfiguration, Globale Parameter, Farben verwalten |

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

### Lücken-Erkennung (Verhalten ab v1.3)

Die Mindestbesetzungswerte kommen aus der **Team-Konfiguration** (Einstellungen → Team-Konfiguration):

| Lückentyp | Prüfung |
|-----------|---------|
| **Pikett-Lücke** | Täglich – inkl. Wochenenden und gesetzliche Feiertage (7 Tage/Woche) |
| **Betrieb-Lücke** | Nur an Arbeitstagen (Mo–Fr, kein gesetzlicher Feiertag) |

PDF/PNG-Export: Buttons oben rechts

---

## 5. PI Dashboard-Tab

### Zweck
Direkter Vergleich zwischen in Jira committeten Story Points und der vom Planner berechneten Kapazität. Dient als Planungsübersicht für Chapter Leads / Scrum Masters.

### Aufbau
- Pro PI eine Sektion mit PI-Name und Datumsbereich
- Pro Team eine Tabelle mit farbigem Team-Header

### Spalten der Tabelle

| Spalte | Beschreibung |
|--------|-------------|
| Iteration | Name der Iteration |
| Betriebstage | Arbeitstage (Mo–Fr) ohne gesetzliche Feiertage |
| SP in Jira *(editierbar)* | Manuell erfasste Jira-Commitments des PO |
| Berechnet SP | Theoretische Kapazität (ohne tagsgenaue Buchungen) |
| Verfügbar SP Netto | Tagesgenaue Kapazität (inkl. FERIEN, ABWESEND etc.) |
| **Delta** *(neu v1.3)* | Verfügbar SP Netto − SP in Jira |
| Auslastung Jira % | SP in Jira ÷ Verfügbar SP Netto × 100 |
| Auslastung App % | Berechnet SP ÷ Verfügbar SP Netto × 100 |

**PI Total-Zeile:** Summen aller Iterationen (blau hervorgehoben)

### SP in Jira erfassen

1. Auf eine Zelle in der Spalte "SP in Jira" klicken
2. Eingabefeld erscheint – Zahl eingeben (Dezimalwerte mit Punkt oder Komma)
3. **Enter** oder Klick ausserhalb speichert den Wert
4. **Escape** bricht ab – Originalwert bleibt erhalten

> **Hinweis (ab v1.3):** Die SP-in-Jira-Werte werden im **Server-State** (AppData) gespeichert und mit allen verbundenen Benutzern synchronisiert. Sie sind im JSON-Backup enthalten und gehen bei einem Server-Neustart verloren, sofern kein Backup erstellt wurde.

### Delta-Spalte *(neu in v1.3)*

| Symbol | Delta | Bedeutung |
|--------|-------|-----------|
| ✅ +x.x | Positiv | Kapazitätspuffer vorhanden – mehr SP verfügbar als committed |
| ℹ️ 0.0 | Null | Exakt ausgelastet |
| ⚠️ −x.x | Negativ | Überbucht – Commitments übersteigen Kapazität. Rücksprache mit PO empfohlen |

> Die App weist nur hin. Über- oder Unterlastung bleibt Entscheidung des Teams und des PO.

### Farbcodierung Auslastung

| Farbe | Bereich | Bedeutung |
|-------|---------|-----------|
| Grün | < 85 % | Kapazität gut genutzt |
| Orange | 85 – 100 % | Nah an der Grenze – Achtung |
| Rot | > 100 % | Überlastet – Anpassung nötig |

---

## 6. Einstellungen

### Mitarbeiter
- CRUD: Hinzufügen, Bearbeiten, Löschen
- CSV-Import: Spalten `vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag`
- CSV-Export: aktuellen Stand herunterladen
- **Automatisch:** Neue Teams aus dem Mitarbeiterstamm werden sofort in der Team-Konfiguration mit Default-Werten angelegt

### PI-Planung & Iterationen
- PIs anlegen mit Start/Ende-Datum
- Iterationen pro PI mit Start/Ende-Datum
- CSV-Import/Export möglich

### Feiertage / Schulferien / Blocker
- Je eigene Liste im Settings-Tab
- CSV-Import/Export

### Team-Zielwerte *(Legacy)*
- Ältere Konfigurations-Ansicht (für Rückwärtskompatibilität erhalten)
- **Empfehlung:** Neue Installationen verwenden «Team-Konfiguration» und «Globale Parameter»

### Team-Konfiguration *(neu in v1.3)*

**Pfad:** Einstellungen → Team-Konfiguration

Konfiguriert die Mindestbesetzung für Pikett und Betrieb pro Team.

| Spalte | Beschreibung |
|--------|-------------|
| Team | Aus Mitarbeiterstamm abgeleitet – read-only |
| Min. Pikett | Mindestanzahl Personen mit Pikett-Dienst täglich (inkl. WE + Feiertage) |
| Min. Betrieb | Mindestanzahl Personen mit Betrieb pro Arbeitstag (exkl. WE + Feiertage) |

**Bedienung:**
1. Zahlenwert direkt im Feld editieren
2. «Speichern» Button der Zeile klicken – wird sofort synchronisiert
3. CSV exportieren/importieren mit den Buttons oben rechts

**CSV-Format:**
```
teamName;minPikett;minBetrieb
PAF;1;2
ACM;1;2
NET;0;1
CON;0;1
```

**Validierung beim Import:**
- `teamName` darf nicht leer sein
- `minPikett` und `minBetrieb` müssen Ganzzahlen ≥ 0 sein
- Teams die nicht im Mitarbeiterstamm existieren: werden angelegt (Warnung erscheint)

### Globale Parameter *(neu in v1.3)*

**Pfad:** Einstellungen → Globale Parameter

| Parameter | Standard | Beschreibung |
|-----------|---------|-------------|
| SP pro Tag | 1.0 | Anzahl Story Points die ein Vollzeit-Mitarbeiter pro Arbeitstag leisten kann |
| Arbeitsstunden pro Jahr | 1600 | Referenzwert für FTE-Umrechnung |

> ⚠️ **Hinweis:** Änderungen wirken sofort auf alle SP-Berechnungen der gesamten App.

**Bedienung:**
1. Wert ändern
2. «Speichern» klicken → sofortige Wirkung auf alle Berechnungen
3. «Zurücksetzen» bricht ungespeicherte Änderungen ab

### Farbeinstellungen
- Farben aller Buchungstypen anpassen
- Color-Picker, CSV-Export/Import, Reset auf Standard

### Backup & Restore
- **Export:** Vollständiger JSON-Export – enthält ab v1.3 auch `globalConfig`, `teamConfigs` und `piTeamTargets`
- **Import:** JSON-Datei laden (überschreibt aktuelle Daten)
- **Rückwärtskompatibel:** Ältere Backups (ohne neue Felder) laden korrekt mit Default-Werten

---

## 7. Tipps & Häufige Fragen

**F: Die SP-in-Jira-Werte sind nach Server-Neustart weg.**
A: Ab v1.3 werden SP-in-Jira-Werte im Server-State gespeichert (nicht mehr im Browser-Cache). Bei Server-Neustart werden sie – wie alle anderen Daten – aus dem letzten JSON-Backup wiederhergestellt. Empfehlung: Regelmässig Backup erstellen.

**F: Sehen andere Benutzer meine SP-in-Jira-Eingaben?**
A: Ja, ab v1.3. Die Werte werden via Socket.io synchronisiert und sind für alle verbundenen Benutzer sofort sichtbar.

**F: Warum unterscheiden sich "Berechnet SP" und "Verfügbar SP Netto"?**
A: Berechnet SP ist theoretisch (keine Buchungen berücksichtigt). Verfügbar SP Netto ist tagesgenau und zieht Ferien, Abwesenheiten etc. ab.

**F: Was bedeutet das Delta im PI Dashboard?**
A: Delta = Verfügbar SP Netto − SP in Jira. Positiv = Puffer vorhanden (✅), Null = exakt ausgelastet (ℹ️), Negativ = Commitments übersteigen Kapazität (⚠️).

**F: Pikett-Lücken auch am Wochenende – ist das korrekt?**
A: Ja, ab v1.3. Pikett-Dienst gilt 7 Tage/Woche inkl. Wochenenden und Feiertagen. Betrieb-Lücken werden dagegen nur an Arbeitstagen gemeldet.

**F: Wie wirken Filter auf den PI Dashboard?**
A: Team-Filter blendet Teams aus, PI-Filter zeigt nur das gewählte PI, Jahr-Filter filtert PIs nach Jahr.

**F: Wie stelle ich Team-Konfiguration auf meine Teams ein?**
A: Einstellungen → Team-Konfiguration. Teams werden automatisch aus dem Mitarbeiterstamm abgeleitet. Werte direkt im Feld editieren und «Speichern» klicken.

---

## 8. Versionshistorie

| Version | Datum | Änderungen |
|---------|-------|-----------|
| 1.0 | März 2026 | Erstveröffentlichung |
| 1.1 | März 2026 | Farbeinstellungen, CD Bund |
| 1.2 | 01.04.2026 | PI Dashboard Tab |
| **1.3** | **07.04.2026** | **Team-Konfiguration, Globale Parameter, PI Dashboard Delta-Spalte, piTeamTargets synchronisiert, Pikett-Lücken 7x/Woche** |
