# Benutzerdokumentation SAFe PI Capacity Planner
**Version:** 1.4
**Stand:** 09.04.2026
**Erstellt für:** BIT – Bundesamt für Informatik und Telekommunikation

---

## 1. Überblick

Der **SAFe PI Capacity Planner** ist eine Webanwendung zur Kapazitätsplanung für SAFe PI Planning. Er berechnet verfügbare Story Points (SP) pro Team und Iteration unter Berücksichtigung von Absenzen, Feiertagen, Schulferien, Betriebsaufgaben und FTE.

### Navigation (Tabs)

| Tab | Funktion |
|-----|---------|
| **Planung** | Kalender-Grid: Absenzen und Buchungen pro Mitarbeiter erfassen |
| **Kapazität** | SP-Berechnung pro Mitarbeiter und Team anzeigen |
| **Dashboard** | KPI-Übersicht: SP-Diagramm, Absenz-Tabelle, Pikett/Betrieb-Lücken, PDF/PNG-Export |
| **PI Dashboard** | Vergleich Jira-SP vs. berechnete App-Kapazität pro PI und Team (inkl. Delta), PDF/PNG-Export |
| **Einstellungen** | Mitarbeiter, PI-Planung, Feiertage, Team-Konfiguration, Globale Parameter, Farben verwalten |

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

### Lücken-Erkennung

Die Mindestbesetzungswerte kommen aus der **Team-Konfiguration** (Einstellungen → Team-Konfiguration):

| Lückentyp | Prüfung |
|-----------|---------|
| **Pikett-Lücke** | Täglich – inkl. Wochenenden und gesetzliche Feiertage (7 Tage/Woche) |
| **Betrieb-Lücke** | Nur an Arbeitstagen (Mo–Fr, kein gesetzlicher Feiertag) |

### PDF/PNG-Export

Oben rechts im Dashboard-Tab befinden sich zwei Export-Buttons:

| Button | Funktion |
|--------|---------|
| **PDF** | Exportiert den sichtbaren Dashboard-Inhalt als PDF-Datei |
| **PNG** | Exportiert den sichtbaren Dashboard-Inhalt als PNG-Bild |

**Dateiname:** `safe-pi-planner_YYYY-MM-DD.pdf` / `.png`

Der Export enthält einen Kopfbereich mit Bundeslogo, Titel und aktivem Filter-Label. Während des Exports sind die Buttons deaktiviert und zeigen «Exportiere…».

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
| **Delta** | Verfügbar SP Netto − SP in Jira |
| Auslastung Jira % | SP in Jira ÷ Verfügbar SP Netto × 100 |
| Auslastung App % | Berechnet SP ÷ Verfügbar SP Netto × 100 |

**PI Total-Zeile:** Summen aller Iterationen (blau hervorgehoben)

### SP in Jira erfassen

1. Auf eine Zelle in der Spalte "SP in Jira" klicken
2. Eingabefeld erscheint – Zahl eingeben (Dezimalwerte mit Punkt oder Komma)
3. **Enter** oder Klick ausserhalb speichert den Wert
4. **Escape** bricht ab – Originalwert bleibt erhalten

> **Hinweis:** Die SP-in-Jira-Werte werden im **Server-State** (AppData) gespeichert und mit allen verbundenen Benutzern synchronisiert. Sie sind im JSON-Backup enthalten.

### Delta-Spalte

| Symbol | Delta | Bedeutung |
|--------|-------|-----------|
| ✅ +x.x | Positiv | Kapazitätspuffer vorhanden |
| ℹ️ 0.0 | Null | Exakt ausgelastet |
| ⚠️ −x.x | Negativ | Überbucht – Rücksprache mit PO empfohlen |

### Farbcodierung Auslastung

| Farbe | Bereich | Bedeutung |
|-------|---------|-----------|
| Grün | < 85 % | Kapazität gut genutzt |
| Orange | 85 – 100 % | Nah an der Grenze – Achtung |
| Rot | > 100 % | Überlastet – Anpassung nötig |

### PDF/PNG-Export *(neu in v1.4)*

Oben rechts im PI Dashboard-Tab befinden sich zwei Export-Buttons:

| Button | Funktion |
|--------|---------|
| **PDF** | Exportiert den gesamten PI Dashboard-Inhalt als PDF-Datei |
| **PNG** | Exportiert den gesamten PI Dashboard-Inhalt als PNG-Bild |

**Dateiname:** `safe-pi-dashboard_YYYY-MM-DD.pdf` / `.png`

Der Export enthält:
- Kopfbereich mit Bundeslogo links und Titel «SAFe PI Capacity Planner – PI Dashboard» rechts
- Aktives Filter-Label (z.B. «Team: ACM | PI: PI26-1» oder «Alle Daten»)
- Auslastungslegende
- Alle sichtbaren PI-Sektionen mit allen Team-Tabellen

Während des Exports sind die Buttons deaktiviert («Exportiere…»). Bei Fehler erscheint eine rote Meldung.

> **Tipp:** Filter vor dem Export setzen um nur das gewünschte PI oder Team im Dokument zu haben.

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

### Team-Konfiguration

**Pfad:** Einstellungen → Team-Konfiguration

Konfiguriert Mindestbesetzung und Kapazitätsparameter pro Team. Einzige aktive Quelle der Wahrheit für Pikett/Betrieb-Lücken und SP-Berechnungen.

| Spalte | Beschreibung |
|--------|-------------|
| Team | Aus Mitarbeiterstamm abgeleitet – read-only |
| Min. Pikett | Mindestanzahl Personen mit Pikett täglich (inkl. WE + Feiertage) |
| Min. Betrieb | Mindestanzahl Personen mit Betrieb pro Arbeitstag (exkl. WE + Feiertage) |
| SP / Tag | Story Points pro Tag für dieses Team (Standard: 1) |
| Std / Jahr | Arbeitsstunden pro Jahr (Standard: 1600) |

**Bedienung:**
1. Zahlenwert direkt im Feld editieren
2. «Speichern» Button der Zeile klicken – wird sofort synchronisiert
3. CSV exportieren/importieren mit den Buttons oben

**CSV-Format:**
```
teamName;minPikett;minBetrieb;storyPointsPerDay;hoursPerYear
PAF;1;2;1;1600
ACM;1;2;1;1600
NET;0;1;1;1600
CON;0;1;1;1600
```

### Globale Parameter

**Pfad:** Einstellungen → Globale Parameter

| Parameter | Standard | Beschreibung |
|-----------|---------|-------------|
| SP pro Tag | 1.0 | Anzahl Story Points die ein Vollzeit-Mitarbeiter pro Arbeitstag leisten kann |
| Arbeitsstunden pro Jahr | 1600 | Referenzwert für FTE-Umrechnung |

> ⚠️ **Hinweis:** Änderungen wirken sofort auf alle SP-Berechnungen der gesamten App.

### Farbeinstellungen
- Farben aller Buchungstypen anpassen
- Color-Picker, CSV-Export/Import, Reset auf Standard

### Backup & Restore
- **Export:** Vollständiger JSON-Export – enthält alle Daten inkl. `teamConfigs`, `globalConfig` und `piTeamTargets`
- **Import:** JSON-Datei laden (überschreibt aktuelle Daten nach Bestätigung)
- **Rückwärtskompatibel:** Ältere Backups laden korrekt mit Default-Werten

---

## 7. Tipps & Häufige Fragen

**F: Wo finde ich den PDF-Export für das PI Dashboard?**
A: Tab «PI Dashboard» → oben rechts «PDF» oder «PNG» Button. Der Export enthält alle sichtbaren Tabellen mit Bundeslogo-Header.

**F: Die SP-in-Jira-Werte sind nach Server-Neustart weg.**
A: SP-in-Jira-Werte werden im Server-State gespeichert. Bei Server-Neustart werden sie aus dem letzten JSON-Backup wiederhergestellt. Empfehlung: Regelmässig Backup erstellen (Einstellungen → Backup & Restore).

**F: Sehen andere Benutzer meine SP-in-Jira-Eingaben?**
A: Ja. Die Werte werden via Socket.io synchronisiert und sind für alle verbundenen Benutzer sofort sichtbar.

**F: Warum unterscheiden sich "Berechnet SP" und "Verfügbar SP Netto"?**
A: Berechnet SP ist theoretisch (keine Buchungen berücksichtigt). Verfügbar SP Netto ist tagesgenau und zieht Ferien, Abwesenheiten etc. ab.

**F: Pikett-Lücken auch am Wochenende – ist das korrekt?**
A: Ja. Pikett-Dienst gilt 7 Tage/Woche inkl. Wochenenden und Feiertagen. Betrieb-Lücken werden nur an Arbeitstagen gemeldet.

**F: Wie stelle ich die Mindestbesetzung pro Team ein?**
A: Einstellungen → Team-Konfiguration. Teams werden automatisch aus dem Mitarbeiterstamm abgeleitet. Werte direkt im Feld editieren und «Speichern» klicken.

**F: Was ist der Unterschied zwischen «Team-Konfiguration» und «Globale Parameter»?**
A: Team-Konfiguration gilt pro Team (Pikett/Betrieb/SP/Std). Globale Parameter sind App-weite Standardwerte als Referenz.

---

## 8. Versionshistorie

| Version | Datum | Änderungen |
|---------|-------|-----------|
| 1.0 | März 2026 | Erstveröffentlichung |
| 1.1 | März 2026 | Farbeinstellungen, CD Bund |
| 1.2 | 01.04.2026 | PI Dashboard Tab |
| 1.3 | 07.04.2026 | Team-Konfiguration, Globale Parameter, PI Dashboard Delta-Spalte, piTeamTargets synchronisiert, Pikett-Lücken 7×/Woche |
| **1.4** | **09.04.2026** | **PDF/PNG-Export im PI Dashboard Tab (Bundeslogo-Header, Filter-Label); Team-Zielwerte in Team-Konfiguration zusammengeführt (eine Seite); Backup-Validierung: teamZielwerte optional** |
| **1.5** | **14.04.2026** | **FIX-11: «Alle Buchungen löschen»-Button aus Planungs-Tab entfernt (Admin-Bereich behalten); FIX-12: «Abbrechen» im Admin-Gate navigiert zurück zu Planung-Tab; BP-Buchung zählt korrekt für Pikett- und Betrieb-Abdeckung (Verifikation)** |
