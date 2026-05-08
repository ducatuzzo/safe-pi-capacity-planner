# Benutzerdokumentation SAFe PI Capacity Planner
**Version:** 2.0
**Stand:** 07.05.2026
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
| **Admin** | Geschützter Bereich: Train-Verwaltung, Daten-Reset, Admin-Code ändern |

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

> **Hinweis BP:** Eine BP-Buchung zählt gleichzeitig für die Pikett-Abdeckung (7×24) **und** die Betrieb-Abdeckung (Arbeitstage). An Tagen mit ausreichend BP-Buchungen entstehen weder Pikett-Lücken noch Betrieb-Unterbesetzungen.

### Drag-Buchung
1. Buchungstyp links in der Legende auswählen (Klick)
2. Auf erste Zelle klicken und gedrückt halten
3. Über die gewünschten Tage ziehen
4. Loslassen – alle Tage werden mit dem gewählten Typ gebucht
5. Nochmals auf eine gebuchte Zelle klicken löscht die Buchung (Toggle)

### Buchungen löschen
- **Einzelner Mitarbeiter:** Mauszeiger über Mitarbeiter-Zeile → ✕-Button erscheint rechts im Namen-Feld → Klick löscht alle Buchungen dieser Person im sichtbaren Zeitraum
- **Alle Buchungen aller Mitarbeiter löschen:** Ausschliesslich im **Admin-Bereich** verfügbar (Tab Admin → Gefährliche Aktionen)

### Kalender-Header (Feature 29)

Der Kalender hat **6 Header-Zeilen** über dem Mitarbeiter-Raster:

| Zeile | Inhalt |
|---|---|
| 1 | Monat (z.B. «Apr 2026») |
| 2 | Kalenderwoche (z.B. «KW 18») |
| 3 | PI-Name (z.B. «PI26-2») |
| 4 | Iteration (I1, I2…) **oder** Blocker-Woche (gestreifter Balken mit ❄ Label, z.B. «❄ Weihnachten») |
| 5 | Zeremonien-Marker — `◆` für Einzeltermine, `◈` für Serien-Instanzen (Hover-Tooltip mit Titel, Zeit-Range, Serien-Position N/Total, Ort) |
| 6 | Tagesdatum + Wochentag (Mo/Di/...) |

**Blocker-Woche**: Eine PI-interne Pause (z.B. Weihnachts­ferien). Erscheint zwischen zwei Iterationen als gestreifter Balken. Iterationen verschieben sich automatisch um die Blocker-Dauer nach hinten — kein SP-Abzug, normale Buchungstypen (Pikett, Betrieb) bleiben buchbar.

**Zeremonien-Marker**: `◆`-Symbol für Einzeltermine, `◈`-Symbol für Serien-Instanzen (z.B. wöchentliche System-Demo). Mehrere Zeremonien pro Tag werden mit einer kleinen Zahl angezeigt. Mauszeiger über das Symbol zeigt Details inkl. Serien-Position (z.B. „Serie 3/5"). Mehrtägige Termine erscheinen unter jedem Tag im Bereich.

> **Wichtig — Abgrenzung zum «Blocker / Freeze»:** Die hier sichtbaren PI-Blocker-Wochen sind reines Planungsinstrument (Pause innerhalb eines PIs). Davon unabhängig gibt es weiterhin den **Blocker / Freeze** (Change-Management, IT-Wartungsfenster) mit dem ❄️-Schneeflocken-Symbol direkt in der Tag-Zelle. Beide Konzepte existieren parallel.

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

> **BP zählt für beide:** Eine BP-Buchung schliesst sowohl Pikett- als auch Betrieb-Lücken an diesem Tag.

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

### PDF/PNG-Export

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

### PI-Planung & Iterationen (Feature 29 erweitert)

**Pfad:** Einstellungen → PI-Planung

#### Neues PI erstellen — wochenbasiert

Klicke auf «Neu»:

| Feld | Beschreibung |
|---|---|
| PI-Name * | z.B. `PI26-2` (eindeutig pro Train) |
| Startdatum * | Hinweis erscheint, wenn kein Montag |
| Wochen/Iteration * | Länge einer Iteration in Wochen (1–6) |
| Anzahl Iter. * | Anzahl Iterationen im PI (1–10) |

→ Das **Enddatum** wird automatisch berechnet und live angezeigt: `Startdatum + (Wochen/Iteration × Anzahl Iter.) − 1 Tag`.

Beispiel: Start `27.04.2026` (Mo), 3 Wo./Iter., 5 Iter. → Enddatum `09.08.2026`.

Beim Klick auf «Erstellen» werden alle Iterationen automatisch generiert (I1, I2, …, In) mit jeweils gleicher Länge und lückenlos aneinander.

#### PI bearbeiten

Beim Bearbeiten eines bestehenden PI bleiben Start, Ende und alle Iterationen wie bisher manuell editierbar. Die `Wochen/Iteration` kann geändert werden, **Iterationen werden aber nicht automatisch neu berechnet** — bestehende Iter-Daten und damit verknüpfte Buchungen/Zeremonien werden nicht überschrieben.

#### Timeline (Iterationen + Blocker + Zeremonien) — neu in v2.0

Klick auf den Pfeil ▶ links der PI-Zeile blendet die **vereinte Timeline** ein: Iterationen, Blocker-Wochen und Zeremonien erscheinen **chronologisch sortiert in EINER Tabelle** (statt früher zwei getrennten Bereichen).

**Drei Hinzufügen-Buttons in der Toolbar:**

| Button | Wirkung |
|---|---|
| **+ Iteration** (blau) | Neue Iteration manuell anlegen (Modal mit Name + Start/Ende) |
| **+ Blocker** (grau) | Blocker-Woche nach einer Iteration einschieben — verschiebt alle nachfolgenden Iterationen automatisch |
| **+ Zeremonie** (rot) | Zeremonie hinzufügen — Einzeltermin oder Outlook-Style Serie |

**Tabellen-Spalten:**

| Spalte | Beschreibung |
|---|---|
| Typ-Icon | `I` für Iteration · `⊘` (Calendar-Off) für Blocker · `◆` für Einzelzeremonie · `◈` für Serien-Zeremonie |
| Name / Titel | Iter-Name (I1, I2…) · `BLOCKER: <label>` · Zeremonie-Titel + Typ-Label |
| Start | `YYYY-MM-DD` (bei Zeremonie zusätzlich `HH:MM`) |
| Ende | `YYYY-MM-DD` (bei Zeremonie zusätzlich `HH:MM`) |
| Detail | Iter: «Iteration» · Blocker: `N Wochen · nach IX` · Zeremonie: Serien-Info `↻ Wöchentlich × 5`, Iter-Zuordnung `→ I1`, Ort |
| Aktionen | ⬇ (.ics-Download, nur Zeremonien) · ✏ (Bearbeiten) · 🗑 (Löschen) |

**Sortier-Reihenfolge bei gleichem Datum:** Iteration → Zeremonie → Blocker. So erscheint z.B. eine Zeremonie *innerhalb* einer Iteration unmittelbar danach in der Liste; eine Blocker-Woche *zwischen* zwei Iterationen erscheint nach der Vorgänger-Iteration.

**Beispiel-Timeline für PI26-2:**

```
I  | I1                    | 2026-04-27        | 2026-05-17        | Iteration
◆  | PI Planning · PI Planning | 2026-04-27 09:00 | 2026-04-28 17:00 | → I1, Bern
⊘  | BLOCKER: Pfingsten    | 2026-05-18        | 2026-05-24        | 1 Woche · nach I1
I  | I2                    | 2026-05-25        | 2026-06-14        | Iteration
◈  | System Demo · System Demo | 2026-05-15 14:00 | 2026-05-15 16:00 | ↻ Wöchentlich × 5
…
```

**Iteration-Modal:**
- Name *, Startdatum *, Enddatum *
- Validierung: Iter-Daten innerhalb PI-Zeitraum, keine Überschneidung mit anderen Iter

**Blocker-Modal:**
- Nach Iteration *, Bezeichnung *, Dauer (Wochen) * (1–12)
- Beim Einfügen werden alle Folge-Iterationen automatisch verschoben (`Dauer × 7` Tage)
- Beim Löschen kehren die Iter-Daten zurück
- **Voraussetzung:** PI muss `iterationWeeks` gesetzt haben (alle ab v1.8 / Schema 1.5 neu erstellten PIs)

**Zeremonie-Modal (Schema 1.6, Outlook-Style Serien):**

- **Typ** (7 SAFe-Typen): PI Planning / Draft Plan Review / Final Plan Review / Prio-Meeting / System Demo / Final System Demo / Inspect & Adapt
- **Titel**: Default = Typ-Label, frei editierbar
- **Start-Datum**, **Start-Zeit**, **Ende-Datum**, **Ende-Zeit**: mehrtägige Termine möglich (z.B. PI Planning Tag 1 09:00 → Tag 2 17:00)
- **Terminserie** (Checkbox): bei Aktivierung erscheinen die Serien-Felder:
  - **Häufigkeit**: Täglich / Wöchentlich / Monatlich
  - **Intervall (alle N)**: 1–99 (z.B. `2` bei wöchentlich = alle 2 Wochen)
  - **Endet** (Radio-Auswahl, exklusiv):
    - `nach [N] Wiederholungen` — feste Anzahl
    - `am [Datum]` — bis zum angegebenen Datum
- **Ort / Link**, **Beschreibung**, **Iteration** (optional)

**Defaults pro Typ** (werden bei Typ-Wechsel automatisch übernommen, wenn der Titel noch dem Default-Label entspricht):

| Typ | Start-Zeit | Default-Dauer | Default-Ende |
|---|---|---|---|
| PI Planning | 09:00 | 960 Min | nächster Tag 01:00 |
| Draft Plan Review | 14:00 | 60 Min | gleicher Tag 15:00 |
| Final Plan Review | 14:00 | 60 Min | gleicher Tag 15:00 |
| Prio-Meeting | 10:00 | 120 Min | gleicher Tag 12:00 |
| System Demo | 14:00 | 120 Min | gleicher Tag 16:00 |
| Final System Demo | 14:00 | 120 Min | gleicher Tag 16:00 |
| Inspect & Adapt | 09:00 | 240 Min | gleicher Tag 13:00 |

> Bei PI Planning werden 16 Stunden über zwei Arbeitstage verteilt — bitte Ende-Datum/Zeit nach Bedarf anpassen.

**.ics-Export (RFC 5545 v2):**
- Klick auf das Download-Icon ⬇ in der Zeremonie-Zeile
- Dateiname-Schema: `{PI-Name}_{Zeremonien-Typ}_{Start-Datum}.ics`
- DTSTART/DTEND aus Start- und Ende-Datum/Zeit (floating local time, Empfänger-Kalender interpretiert als lokale Zeit)
- Bei Serien: zusätzliche `RRULE`-Property — Outlook/Google/Apple zeigen einen Eintrag mit allen Wiederholungen
- Beispiel: `RRULE:FREQ=WEEKLY;COUNT=5` oder `RRULE:FREQ=DAILY;UNTIL=20260630T235959`
- Sonderzeichen in Titel/Beschreibung/Ort werden korrekt escaped (`,`, `;`, Newlines)

> **Konzept-Hinweise:**
> - Blocker-Wochen verbrauchen **keine Kapazität** (kein SP-Abzug). Pikett/Betrieb sind weiterhin buchbar.
> - Zeremonien sind ebenfalls rein kalendarisch — sie blockieren keine Buchungen.
> - Im Planungs-Kalender erscheinen Blocker als gestreifter Balken in der Iter-Zeile, Zeremonien als `◆`/`◈`-Marker (siehe «Kalender-Header»).
> - **Abgrenzung:** Der hier sichtbare PI-Blocker ist nicht zu verwechseln mit dem System-Tab «Blocker / Freeze» (Change-Management, IT-Wartungsfenster). Beide existieren parallel.

#### Excel-Workbook Export/Import (.xlsx) — einziger Bulk-Pfad

Für den **Release Train Engineer** ist der Excel-Workbook-Workflow der primäre Bulk-Import/-Export-Weg. Alle PI-Daten (Iterationen, Blocker-Wochen, Zeremonien) liegen in einer einzigen Datei mit 4 Sheets. Der frühere CSV-Pfad wurde mit v2.0 entfernt — Excel deckt alle Anwendungsfälle ab.

**Toolbar-Buttons:** «Excel Export» (grün) und «Excel Import» (grün) im PI-Planung-Toolbar.

**Workbook-Struktur (4 Sheets):**

| Sheet | Spalten | Inhalt |
|---|---|---|
| **PIs** | `name`, `startStr`, `endStr`, `iterationWeeks` | ein Datensatz pro PI |
| **Iterationen** | `piName`, `iterName`, `startStr`, `endStr` | mehrere Zeilen pro PI (Iterationen-Detail) |
| **Blocker-Wochen** | `piName`, `afterIterName`, `label`, `weeks` | optional, mehrere pro PI |
| **Zeremonien** | `piName`, `type`, `title`, `startDate`, `startTime`, `endDate`, `endTime`, `recurrenceFreq`, `recurrenceInterval`, `recurrenceCount`, `recurrenceUntil`, `location`, `description`, `iterName` | optional, mehrere pro PI — Schema 1.6 mit Start/Ende-Felder + Serien |

**Iter-Namen-basiertes Mapping:** Querverweise (Blocker → afterIterName, Zeremonie → iterName) nutzen die **Namen** der Iterationen, nicht IDs. Das ist stabiler bei manueller Excel-Bearbeitung — der RTE kann Iterationen umordnen oder umbenennen, ohne IDs jagen zu müssen.

**Beim Import:** nach Datei-Wahl erscheint ein Dialog mit:
- Anzahl der gelesenen PIs
- ggf. Hinweise (z.B. ungültiger iterName, Zeremonie-Datum ausserhalb PI-Zeitraum)
- Aktion: **Anhängen** oder **Überschreiben**

| Aktion | Verhalten |
|---|---|
| **Anhängen** | Importierte PIs werden ergänzt. Bricht ab, wenn ein PI-Name bereits existiert (Duplikat-Schutz). |
| **Überschreiben** | PIs gleichen Namens werden ersetzt. Andere bestehende PIs bleiben unangetastet. Iterationen, Blocker und Zeremonien des überschriebenen PIs gehen verloren. |

**Validierungen beim Import:**
- Sheet «PIs» muss vorhanden sein
- PI-Name eindeutig im Sheet
- Datumsformat YYYY-MM-DD, Zeit-Format HH:MM
- `iterationWeeks` 1–6 (wenn gesetzt), `weeks` (Blocker) 1–12
- `type` (Zeremonien) aus erlaubter Liste (`PI_PLANNING`, `DRAFT_PLAN_REVIEW`, …)
- Querverweis-Integrität: `piName` muss im Sheet «PIs» existieren, `afterIterName`/`iterName` muss im jeweiligen PI vorkommen
- Zeremonien: `endDate >= startDate`; bei gleichem Datum `endTime > startTime`
- Serien (alle optional, wenn `recurrenceFreq` leer → kein Serie):
  - `recurrenceFreq` muss `DAILY`, `WEEKLY` oder `MONTHLY` sein
  - `recurrenceInterval` 1–99 (Default 1)
  - `recurrenceCount` XOR `recurrenceUntil` (exklusiv, eine erforderlich)
  - `recurrenceCount` 1–999, `recurrenceUntil` ≥ `startDate`

**Backward-Compat alter Excel-Files:**
Excel-Dateien, die noch Schema 1.5 verwenden (`date`, `durationMinutes` statt `startDate`/`endDate`/`endTime`), bleiben weiterhin importierbar — die Felder werden automatisch in Schema 1.6 umgerechnet.

**Round-Trip-Sicherheit Excel:**
- Excel-Export → Excel-Import (Modus «Überschreiben»): vollständig — alle 4 Entity-Typen und ihre Querverweise erhalten
- Iterationen behalten ihre Namen (I1, I2, …), bekommen aber neue UUIDs (alte Allocations bleiben erhalten, weil Allocations am Mitarbeiter pro Datum hängen, nicht an Iter-IDs)
- Zeremonien werden anhand des `iterName` neu mit der Iteration verknüpft

**Ein vollständiges Backup aller App-Daten** (inklusive Mitarbeiter, Buchungen, Feiertage, etc.) erfolgt weiterhin via JSON-Backup (Einstellungen → Backup & Restore). Excel-Workbook ist auf PI-Planung fokussiert.

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
- **Export:** Vollständiger JSON-Export – enthält alle Daten inkl. `teamConfigs`, `globalConfig`, `piTeamTargets` sowie pro PI `iterationWeeks`, `blockerWeeks`, `zeremonien`. Zeremonien transportieren Start/Ende-Datum/Zeit + Serien-Konfiguration (Schema 1.6).
- **Import:** JSON-Datei laden (überschreibt aktuelle Daten nach Bestätigung)
- **Schema-Versionierung:** `BACKUP_FORMAT_VERSION = 1.6` (Feature 29 v2). Akzeptiert werden Backups der Versionen `1.0`, `1.5` und `1.6`:
  - `1.0` → `1.5`: leere Arrays `blockerWeeks: []` und `zeremonien: []` werden ergänzt; ARTFlow-Demo-PI «PI26-2» wird einmalig entfernt
  - `1.5` → `1.6`: Zeremonien-Felder `startDate`/`endDate`/`endTime` werden aus `date + startTime + durationMinutes` berechnet (idempotent)
  - Migration ist additiv und semantisch verlustfrei
- **Rückwärtskompatibel:** Ältere Backups laden korrekt mit Default-Werten

---

## 7. Admin-Bereich

**Zugang:** Tab «Admin» → 6-stelliger Admin-Code eingeben → Bestätigen

Der Admin-Bereich ist durch einen OTP-Style Code-Dialog geschützt. Der eingegebene Code wird für 15 Minuten im Browser zwischengespeichert (kein erneuter Login nötig bei Tab-Wechsel innerhalb dieser Zeit).

### Zugang und Navigation

| Aktion | Beschreibung |
|--------|-------------|
| **Bestätigen** | Code prüfen – bei Erfolg wird der Admin-Bereich geöffnet |
| **Abbrechen** | sessionStorage-Code sofort löschen, Dialog schliessen und zurück zum Planung-Tab navigieren |

> **Hinweis:** «Abbrechen» löscht den zwischengespeicherten Code sofort. Beim nächsten Öffnen des Admin-Tabs erscheint immer das leere Code-Eingabeformular — kein Auto-Login. Beim Train-Wechsel wird der Admin-Code-Cache ebenfalls automatisch geleert.

### Aktueller Train

Zeigt ID, Name und Erstellungsdatum des aktiven Trains. Der Train-Name kann direkt umbenannt werden:
1. «Umbenennen» klicken
2. Neuen Namen eingeben
3. «Speichern» – Änderung wird sofort synchronisiert

### Alle Trains

Übersicht aller registrierten Trains mit folgenden Aktionen pro Zeile:

| Aktion | Verfügbarkeit | Beschreibung |
|--------|-------------|-------------|
| **Wechseln** | Alle ausser aktivem Train | Zu diesem Train wechseln |
| **Löschen** | Alle ausser `default` und aktivem Train | Train unwiderruflich löschen |

#### Neuen Train anlegen
Über «Neuen Train anlegen» oben rechts:
- Train-ID (Kleinbuchstaben, z.B. `ps-net`)
- Train-Name (Anzeigename)
- Admin-Code (min. 6 Zeichen)

#### Train löschen
1. «Löschen»-Button (Mülleimer-Icon) in der Zeile des gewünschten Trains klicken
2. Inline-Bestätigungsformular erscheint direkt unter der Zeile
3. Admin-Code des **aktuellen Trains** eingeben
4. «Bestätigen» klicken
5. Train wird aus der Registry entfernt und seine State-Datei gelöscht

> ⚠️ **Achtung:** Das Löschen eines Trains ist **nicht rückgängig zu machen**. Alle Planungsdaten dieses Trains gehen verloren. Vorher ein Backup des Trains erstellen (als dessen Admin einloggen → Einstellungen → Backup & Restore).

> **Schutz:** Der `default`-Train und der aktuell aktive Train können nicht gelöscht werden. Der «Löschen»-Button erscheint nur bei Trains, die weder `default` noch aktiv sind.

### Gefährliche Aktionen

> ⚠️ Diese Aktionen sind **nicht rückgängig zu machen**. Vor der Ausführung ein Backup erstellen (Einstellungen → Backup & Restore).

#### Alle Daten löschen
Setzt den gesamten Planungsstand (Mitarbeiter, Buchungen, PI-Planung) auf den Ausgangszustand zurück.

1. «LÖSCHEN» in das Bestätigungsfeld eingeben
2. «Alle Daten löschen» klicken
3. Admin-Code erneut eingeben zur finalen Bestätigung
4. Seite wird nach erfolgreichem Reset neu geladen

#### Alle PIs löschen — neu in v2.0

Entfernt alle erfassten PIs (inkl. Iterationen, Blocker-Wochen, Zeremonien) dieses Trains. Mitarbeiter, Buchungen, Feiertage und Konfiguration bleiben erhalten.

1. «LÖSCHEN» in das Bestätigungsfeld eingeben
2. «Alle PIs löschen» klicken
3. PIs werden sofort entfernt — Erfolgsmeldung erscheint

> Diese Aktion ist nicht rückgängig zu machen. Vorher Backup erstellen oder Excel-Export ziehen.
> Im Demo-Train: nach «Alle PIs löschen» + Browser-Refresh greift der Demo-Daten-Fallback nur, wenn ALLE Stamm-Daten leer sind (Mitarbeiter, Feiertage etc.). Sonst bleiben die PIs leer wie gewünscht.

#### Admin-Code ändern
1. «Code ändern» klicken
2. Neuen Code zweimal eingeben (min. 6 Zeichen)
3. «Weiter» – aktuellen Code zur Bestätigung eingeben
4. Bei Erfolg: Code ist sofort aktiv, sessionStorage wird geleert

---

## 8. Tipps & Häufige Fragen

**F: Wo finde ich den PDF-Export für das PI Dashboard?**
A: Tab «PI Dashboard» → oben rechts «PDF» oder «PNG» Button. Der Export enthält alle sichtbaren Tabellen mit Bundeslogo-Header.

**F: Wie lösche ich alle Buchungen aller Mitarbeiter?**
A: Tab «Admin» → Admin-Code eingeben → «Alle Daten löschen». Alternativ: Im Planung-Tab kann der ✕-Hover-Button pro Mitarbeiter dessen Buchungen einzeln löschen.

**F: Wie lösche ich einen Train komplett?**
A: Tab «Admin» → Admin-Code eingeben → Sektion «Alle Trains» → «Löschen»-Button beim gewünschten Train → Admin-Code bestätigen. Der `default`-Train und der aktuell aktive Train sind geschützt und können nicht gelöscht werden.

**F: Wie lösche ich nur die PIs (nicht alles)?**
A: Tab «Admin» → Admin-Code eingeben → Sektion «Gefährliche Aktionen» → «Alle PIs löschen» (neu in v2.0). Tippt «LÖSCHEN» zur Bestätigung. Mitarbeiter, Buchungen und Konfiguration bleiben erhalten.

**F: Wo sind die Demo-Daten? / Sie verschwinden nach Browser-Refresh.**
A: Der Demo-Train wird beim ersten Laden automatisch mit einem Demo-PI (PI26-2 mit 5 Iterationen, 2 Blocker-Wochen, 3 Zeremonien inkl. Wöchentlicher Serie) und 5 Schweizer Feiertagen 2026 geseedet. Die Daten werden direkt auf den Server gespeichert und überleben den Browser-Refresh. Nur wenn der gesamte Demo-Train-State leer ist (Mitarbeiter + PIs + Feiertage + Schulferien + Blocker), greift der Fallback erneut.

**F: Wie importiere/exportiere ich PIs in Bulk?**
A: Tab Einstellungen → PI-Planung → Excel-Export/Import (.xlsx). Eine Datei mit 4 Sheets transportiert alle PI-Daten. Der frühere CSV-Pfad wurde mit v2.0 entfernt — Excel deckt alle Anwendungsfälle ab.

**F: Die SP-in-Jira-Werte sind nach Server-Neustart weg.**
A: SP-in-Jira-Werte werden im Server-State gespeichert. Bei Server-Neustart werden sie aus dem letzten JSON-Backup wiederhergestellt. Empfehlung: Regelmässig Backup erstellen (Einstellungen → Backup & Restore).

**F: Sehen andere Benutzer meine SP-in-Jira-Eingaben?**
A: Ja. Die Werte werden via Socket.io synchronisiert und sind für alle verbundenen Benutzer sofort sichtbar.

**F: Warum unterscheiden sich "Berechnet SP" und "Verfügbar SP Netto"?**
A: Berechnet SP ist theoretisch (keine Buchungen berücksichtigt). Verfügbar SP Netto ist tagesgenau und zieht Ferien, Abwesenheiten etc. ab.

**F: Pikett-Lücken auch am Wochenende – ist das korrekt?**
A: Ja. Pikett-Dienst gilt 7 Tage/Woche inkl. Wochenenden und Feiertagen. Betrieb-Lücken werden nur an Arbeitstagen gemeldet.

**F: Zählt BP (Betrieb + Pikett) für beide Lückentypen?**
A: Ja. BP zählt gleichzeitig für Pikett-Abdeckung (7×24) und Betrieb-Abdeckung (Arbeitstage). An Tagen mit ausreichend BP gibt es weder Pikett- noch Betrieb-Lücken.

**F: Wie stelle ich die Mindestbesetzung pro Team ein?**
A: Einstellungen → Team-Konfiguration. Teams werden automatisch aus dem Mitarbeiterstamm abgeleitet. Werte direkt im Feld editieren und «Speichern» klicken.

**F: Was ist der Unterschied zwischen «Team-Konfiguration» und «Globale Parameter»?**
A: Team-Konfiguration gilt pro Team (Pikett/Betrieb/SP/Std). Globale Parameter sind App-weite Standardwerte als Referenz.

---

## 9. Versionshistorie

| Version | Datum | Änderungen |
|---------|-------|-----------|
| 1.0 | März 2026 | Erstveröffentlichung |
| 1.1 | März 2026 | Farbeinstellungen, CD Bund |
| 1.2 | 01.04.2026 | PI Dashboard Tab |
| 1.3 | 07.04.2026 | Team-Konfiguration, Globale Parameter, PI Dashboard Delta-Spalte, piTeamTargets synchronisiert, Pikett-Lücken 7×/Woche |
| 1.4 | 09.04.2026 | PDF/PNG-Export im PI Dashboard Tab (Bundeslogo-Header, Filter-Label); Team-Zielwerte in Team-Konfiguration zusammengeführt (eine Seite); Backup-Validierung: teamZielwerte optional |
| 1.5 | 14.04.2026 | «Alle Buchungen löschen» aus Planungs-Tab entfernt; «Abbrechen» im Admin-Gate navigiert zurück zu Planung-Tab; Admin-Bereich vollständig dokumentiert; BP-Abdeckung verifiziert |
| 1.6 | 14.04.2026 | FIX-13: Admin-Gate sessionStorage zuverlässig geleert; FIX-14: Train-Wechsel löscht Admin-Code-Cache; FIX-15: AdminGate inline (kein Modal-Overlay auf Admin-Tab) |
| 1.7 | 14.04.2026 | FIX-16: Train löschen – neuer «Löschen»-Button in Train-Liste mit Inline-Bestätigung und Admin-Code; default-Train und aktiver Train geschützt; Backend DELETE-Endpoint + deleteTenant() — getestet ✅ |
| 1.8 | 06.05.2026 | Feature 29: PI-Planung wochenbasiert (Auto-Berechnung Enddatum aus Startdatum + Wochen/Iteration + Anzahl Iter.); Blocker-Wochen mit automatischer Verschiebung der Folge-Iterationen; SAFe-Zeremonien (7 Typen mit Default-Dauer/Zeit) inkl. .ics-Export (RFC 5545); Kalender-Header von 5 auf 6 Zeilen erweitert (neue Zeremonien-Marker-Zeile, Blocker-Wochen als gestreifte Spans in der Iter-Zeile); Backup-Schema 1.4 → 1.5 mit automatischer Migration; Iter.-Wo. Spalte in PI-Tabelle. CSV-Export PIs um `iterationWeeks` erweitert (4. Spalte, abwärtskompatibel). Excel-Workbook Export/Import (.xlsx) mit 4 Sheets (PIs, Iterationen, Blocker-Wochen, Zeremonien) — RTE-freundlicher Vollexport mit Iter-Namen-basiertem Mapping; Import-Dialog mit Modi «Anhängen» und «Überschreiben». |
| 1.9 | 07.05.2026 | Feature 29 v2 (Schema 1.6): Zeremonien mit getrennten Start- und Ende-Datum/Zeit-Feldern (mehrtägige Termine möglich, z.B. PI Planning Tag 1 09:00 → Tag 2 17:00); Outlook-Style Terminserien (täglich/wöchentlich/monatlich, mit Anzahl Wiederholungen XOR Enddatum, Intervall 1–99); ICS-Export mit RRULE (RFC 5545 §3.8.5.3) — Outlook/Google/Apple zeigen Serie als einen Eintrag; Kalender-Marker für Serien-Instanzen mit `◈`-Symbol (statt `◆` für Einzeltermine), Tooltip mit Serien-Position N/Total; Excel-Workbook Sheet «Zeremonien» um 7 Spalten erweitert (`startDate`, `startTime`, `endDate`, `endTime`, `recurrenceFreq`, `recurrenceInterval`, `recurrenceCount`, `recurrenceUntil`); Backup-Schema 1.5 → 1.6 mit automatischer Migration (durationMinutes → endDate/endTime); abwärtskompatibel zu 1.0/1.5-Backups und 1.5-Excel-Files. |
| **2.0** | **07.05.2026** | **UI-Reorganisation der PI-Planung: Iterationen, Blocker-Wochen und Zeremonien werden in EINER vereinten Timeline-Tabelle chronologisch angezeigt (statt zwei getrennten Bereichen). Drei Hinzufügen-Buttons in der Toolbar (+Iteration / +Blocker / +Zeremonie) mit drei separaten Modals; Sortierung nach Datum mit Typ-Suffix (Iter < Zeremonie < Blocker). CSV-Import/Export aus PI-Planung entfernt — Excel-Workbook (.xlsx) ersetzt CSV vollständig. Neue Admin-Aktion «Alle PIs löschen» (verschoben aus PI-Toolbar): selektives Löschen aller PIs ohne andere Daten anzutasten. Demo-Daten für Demo-Train: bei komplett leerem Server-State werden DEMO_PIS (PI26-2 mit Iter/Blocker/Zeremonien inkl. Serie) und Schweizer Feiertage 2026 automatisch geseedet — direkt auf den Server gepusht, überlebt Browser-Refresh. .gitignore-Bugfix für `src/data/`. ZeremonienEditor.tsx als Komponente nicht mehr verwendet (Code in IterationEditor migriert).** |
