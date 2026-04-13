const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Footer, PageBreak, SimpleField
} = require('docx');
const fs = require('fs');

const BUND_BLAU = '003F7F';
const BUND_ROT = 'E63312';
const GRAU = 'F5F5F5';
const HELL_GRAU = 'D1D5DB';
const TEXT = '1A1A1A';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, bold = false, bg = null) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: 'Arial', size: 20 })] })]
  });
}

function headerCell(text, width) {
  return new TableCell({
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: BUND_BLAU }, bottom: { style: BorderStyle.SINGLE, size: 1, color: BUND_BLAU }, left: { style: BorderStyle.SINGLE, size: 1, color: BUND_BLAU }, right: { style: BorderStyle.SINGLE, size: 1, color: BUND_BLAU } },
    width: { size: width, type: WidthType.DXA },
    shading: { fill: BUND_BLAU, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })]
  });
}

function colorCell(buchstabe, bgHex, textHex, label, width1, width2, width3) {
  return new TableRow({ children: [
    new TableCell({
      borders,
      width: { size: width1, type: WidthType.DXA },
      shading: { fill: bgHex, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: buchstabe, bold: true, font: 'Arial', size: 20, color: textHex })] })]
    }),
    cell(label, width2),
    new TableCell({
      borders,
      width: { size: width3, type: WidthType.DXA },
      shading: { fill: bgHex, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: '#' + bgHex + ' / #' + textHex, font: 'Courier New', size: 18, color: TEXT })] })]
    }),
  ]});
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 32, color: BUND_BLAU })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BUND_BLAU, space: 1 } }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 26, color: BUND_BLAU })],
    spacing: { before: 300, after: 120 }
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 22, color: TEXT })],
    spacing: { before: 200, after: 80 }
  });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 20, color: TEXT })],
    spacing: { after: 120 }
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: TEXT })],
    spacing: { after: 60 }
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: TEXT })],
    spacing: { after: 60 }
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function infoBox(text) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: BUND_BLAU }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BUND_BLAU }, left: { style: BorderStyle.SINGLE, size: 12, color: BUND_BLAU }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      shading: { fill: 'EBF3FB', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 200, right: 100 },
      width: { size: 9026, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, color: TEXT })] })]
    })] })]
  });
}

function sp() {
  return new Paragraph({ spacing: { after: 120 } });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: BUND_BLAU }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: BUND_BLAU }, paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, font: 'Arial', color: TEXT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'SAFe PI Capacity Planner \u2013 Benutzerdokumentation | BIT | Version 1.3 | April 2026    ', font: 'Arial', size: 16, color: '666666' }),
            new TextRun({ children: [new SimpleField('PAGE')], font: 'Arial', size: 16, color: '666666' })
          ],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: HELL_GRAU, space: 1 } }
        })]
      })
    },
    children: [
      // Titelseite
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Schweizerische Eidgenossenschaft', font: 'Arial', size: 20, color: '666666' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Bundesamt f\u00fcr Informatik und Telekommunikation BIT', font: 'Arial', size: 20, color: '666666' })] }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BUND_BLAU, space: 4 } },
        children: [new TextRun({ text: 'SAFe PI Capacity Planner', font: 'Arial', size: 56, bold: true, color: BUND_BLAU })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Benutzerdokumentation', font: 'Arial', size: 36, color: TEXT })] }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Version 1.3 | April 2026', font: 'Arial', size: 22, color: '666666' })] }),
      new Paragraph({ spacing: { before: 2000 } }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [headerCell('Dokument', 2000), headerCell('', 7026)] }),
          new TableRow({ children: [cell('Titel', 2000, true, GRAU), cell('SAFe PI Capacity Planner \u2013 Benutzerdokumentation', 7026)] }),
          new TableRow({ children: [cell('Zielgruppe', 2000, true, GRAU), cell('Team-Mitglieder, Scrum Master, Chapter Leads, PI Planning Teilnehmer', 7026)] }),
          new TableRow({ children: [cell('Version', 2000, true, GRAU), cell('1.3', 7026)] }),
          new TableRow({ children: [cell('Datum', 2000, true, GRAU), cell('April 2026', 7026)] }),
        ]
      }),
      pageBreak(),

      // 1. Einführung
      h1('1. Einf\u00fchrung'),
      h2('1.1 Was ist der SAFe PI Capacity Planner?'),
      p('Der SAFe PI Capacity Planner ist eine Webanwendung des Bundesamts f\u00fcr Informatik und Telekommunikation (BIT) f\u00fcr die Kapazit\u00e4tsplanung im Rahmen von SAFe PI Planning. Die Applikation erm\u00f6glicht es Teams, ihre verf\u00fcgbare Kapazit\u00e4t in Story Points pro Iteration und PI zu berechnen.'),
      p('Die Applikation l\u00e4uft lokal im Browser und ist unter http://localhost:5173 erreichbar (nach dem Start durch die IT).'),

      h2('1.2 Hauptfunktionen im \u00dcberblick'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          new TableRow({ children: [headerCell('Funktion', 2500), headerCell('Beschreibung', 6526)] }),
          new TableRow({ children: [cell('Planung', 2500), cell('Kalenderansicht mit Maus-Buchung von Absenzen pro Mitarbeiter', 6526)] }),
          new TableRow({ children: [cell('Kapazit\u00e4t', 2500), cell('Automatische Berechnung verf\u00fcgbarer Story Points pro Team und Iteration', 6526)] }),
          new TableRow({ children: [cell('Dashboard', 2500), cell('Planungsergebnis, Engp\u00e4sse und Lücken auf einen Blick', 6526)] }),
          new TableRow({ children: [cell('Einstellungen', 2500), cell('Mitarbeiterstamm, PI-Planung, Feiertage, Schulferien, Blocker, Zielwerte', 6526)] }),
          new TableRow({ children: [cell('Backup/Restore', 2500), cell('Vollst\u00e4ndige Datensicherung und Wiederherstellung als JSON', 6526)] }),
          new TableRow({ children: [cell('Export', 2500), cell('PDF und PNG Export f\u00fcr Confluence', 6526)] }),
        ]
      }),

      h2('1.3 Navigation'),
      p('Die Applikation ist in vier Hauptbereiche unterteilt, die \u00fcber die Tabs oben navigierbar sind:'),
      bullet('Planung: Kalenderansicht mit Absenzbuchung'),
      bullet('Kapazit\u00e4t: Story-Point-Berechnung in Tabellenform'),
      bullet('Dashboard: Visuelle Auswertung und Lücken-Erkennung'),
      bullet('Einstellungen: Alle Konfigurations-Bereiche'),
      p('Die Filterleiste oberhalb der Tabs wirkt durchgehend in allen Bereichen.'),

      pageBreak(),

      // 2. Filterleiste
      h1('2. Filterleiste'),
      p('Die Filterleiste ist immer sichtbar und filtert die Ansicht in allen Tabs gleichzeitig. Alle Filter sind optional \u2013 ohne Auswahl werden alle Daten angezeigt.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [headerCell('Filter', 2000), headerCell('Beschreibung', 7026)] }),
          new TableRow({ children: [cell('Team', 2000), cell('Zeigt nur Mitarbeiter des gew\u00e4hlten Teams (Mehrfachauswahl m\u00f6glich)', 7026)] }),
          new TableRow({ children: [cell('PI', 2000), cell('Schr\u00e4nkt den Zeitraum auf das gew\u00e4hlte PI ein', 7026)] }),
          new TableRow({ children: [cell('Iteration', 2000), cell('Zeigt nur die gew\u00e4hlte Iteration (abh\u00e4ngig vom gew\u00e4hlten PI)', 7026)] }),
          new TableRow({ children: [cell('Jahr', 2000), cell('Filtert nach Kalenderjahr', 7026)] }),
          new TableRow({ children: [cell('Zeitraum', 2000), cell('Freies Von/Bis-Datum \u00fcberschreibt PI/Iterations-Filter', 7026)] }),
          new TableRow({ children: [cell('Zur\u00fccksetzen', 2000), cell('Setzt alle Filter zur\u00fcck auf "Alle"', 7026)] }),
        ]
      }),

      pageBreak(),

      // 3. Planung
      h1('3. Planung \u2013 Kalenderansicht'),

      h2('3.1 Kalender lesen'),
      p('Der Kalender zeigt alle Mitarbeiter als Zeilen und die Tage als Spalten. Der Header zeigt von oben nach unten: Monat, Kalenderwoche (KW), PI-Bezeichnung, Iterations-Bezeichnung, Tagesdatum mit Wochentag.'),
      p('Farbliche Hervorhebungen im Header:'),
      bullet('Roter, fetter Text: Heutiger Tag'),
      bullet('Hellblaue Spalte mit \u2744\ufe0f: Change-Freeze / Blocker-Tag'),
      bullet('Graue Spalte: Wochenende (nicht buchbar)'),
      bullet('Hellgraue Spalte: Feiertag (nicht buchbar f\u00fcr normale Buchungen)'),

      h2('3.2 Buchungstyp w\u00e4hlen'),
      p('Unterhalb des Kalenders befindet sich die Legende. Klicken Sie auf einen Buchungstyp, um ihn zu aktivieren (aktiver Typ ist umrahmt). Der aktive Typ wird beim n\u00e4chsten Klick/Drag auf den Kalender gesetzt.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [800, 4000, 4226],
        rows: [
          new TableRow({ children: [headerCell('Kürzel', 800), headerCell('Bezeichnung', 4000), headerCell('Farbe / Bedeutung', 4226)] }),
          colorCell('F', 'FB923C', 'FFFFFF', 'Ferien/Frei', 800, 4000, 4226),
          colorCell('A', '6B7280', 'FFFFFF', 'Abwesenheit (Arbeitspensum, Sonstiges)', 800, 4000, 4226),
          colorCell('T', 'FDE68A', '1A1A1A', 'Teilzeit (Halber Tag abwesend) = 0.5 SP', 800, 4000, 4226),
          colorCell('M', '84CC16', 'FFFFFF', 'Milit\u00e4r / Zivildienst', 800, 4000, 4226),
          colorCell('I', 'A78BFA', 'FFFFFF', 'IPA (Individuelle Praktische Arbeit)', 800, 4000, 4226),
          colorCell('B', '60A5FA', 'FFFFFF', 'Betrieb (z\u00e4hlt als Arbeitstag, wird separat ausgewiesen)', 800, 4000, 4226),
          colorCell('BP', '7C3AED', 'FFFFFF', 'Betrieb und Pikett', 800, 4000, 4226),
          colorCell('P', 'F9A8D4', '1A1A1A', 'Pikett', 800, 4000, 4226),
        ]
      }),

      h2('3.3 Buchungen setzen'),
      h3('Einzelklick'),
      p('Klicken Sie auf eine leere Zelle, um den aktiven Buchungstyp zu setzen. Die Zelle f\u00e4rbt sich sofort in der entsprechenden Farbe und zeigt den K\u00fcrzel-Buchstaben.'),
      h3('Drag (mehrere Tage)'),
      p('Halten Sie die Maustaste gedr\u00fcckt und ziehen Sie horizontal \u00fcber mehrere Tage einer Mitarbeiter-Zeile. Alle Zellen zwischen Start und Ende werden mit dem aktiven Buchungstyp bef\u00fcllt. Das Ziehen funktioniert nur horizontal (innerhalb einer Mitarbeiter-Zeile).'),
      h3('Buchung l\u00f6schen'),
      p('Klicken Sie auf eine bereits gebuchte Zelle mit gleichem aktiven Buchungstyp \u2013 die Buchung wird gel\u00f6scht. Alternativ: W\u00e4hlen Sie in der Toolbar "Alle Buchungen l\u00f6schen" f\u00fcr einen Mitarbeiter oder alle.'),

      infoBox('Tipp: Wochenenden und offizielle Feiertage sind nicht buchbar f\u00fcr normale Absenzen. Pikett und Betrieb+Pikett k\u00f6nnen auch an Wochenenden/Feiertagen gebucht werden (7x24-Verf\u00fcgbarkeit).'),

      pageBreak(),

      // 4. Kapazität
      h1('4. Kapazit\u00e4t \u2013 Story Point Berechnung'),

      h2('4.1 Berechnungslogik'),
      p('Die Kapazit\u00e4tsberechnung erfolgt automatisch basierend auf den Buchungen im Kalender. F\u00fcr jeden Mitarbeiter und Arbeitstag im gew\u00e4hlten Zeitraum gilt:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Buchungstyp', 3000), headerCell('SP-Faktor', 3000), headerCell('Erl\u00e4uterung', 3026)] }),
          new TableRow({ children: [cell('Kein Eintrag', 3000), cell('1.0', 3000), cell('Voller Arbeitstag', 3026)] }),
          new TableRow({ children: [cell('Teilzeit (T)', 3000), cell('0.5', 3000), cell('Halber Tag', 3026)] }),
          new TableRow({ children: [cell('Ferien, Abwesend, Milit\u00e4r, IPA', 3000), cell('0.0', 3000), cell('Kein Beitrag zur Kapazit\u00e4t', 3026)] }),
          new TableRow({ children: [cell('Betrieb, Pikett, Betrieb+Pikett', 3000), cell('1.0 (brutto)', 3000), cell('Z\u00e4hlt als Arbeitstag, Betrieb-% wird separat abgezogen', 3026)] }),
          new TableRow({ children: [cell('Feiertag / Wochenende', 3000), cell('\u2013', 3000), cell('Nicht gez\u00e4hlt', 3026)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Zus\u00e4tzliche Abz\u00fcge pro Mitarbeiter (konfigurierbar in Einstellungen \u2192 Mitarbeiter):'),
      bullet('FTE-Faktor: z.B. 80% FTE = 0.8 * Basis-SP'),
      bullet('Betrieb %: Anteil f\u00fcr Betriebsaufgaben (wird vom Netto abgezogen)'),
      bullet('Pauschale %: Anteil f\u00fcr administrative T\u00e4tigkeiten (wird vom Netto abgezogen)'),

      h2('4.2 Kapazit\u00e4ts-Tabelle lesen'),
      p('Die Tabelle zeigt pro Mitarbeiter: Arbeitstage, Abwesenheitstage aufgeschl\u00fcsselt nach Typ, und die verf\u00fcgbaren Story Points. Team-Summenzeilen fassen die Werte zusammen.'),
      p('Farbliche Markierungen in der Tabelle:'),
      bullet('Rot: Pikett-Lücke (weniger als die Zielanzahl Personen im Pikett-Dienst)'),
      bullet('Orange: Betrieb-Unterbesetzung (weniger als Zielanzahl Personen im Betrieb)'),

      pageBreak(),

      // 5. Dashboard
      h1('5. Dashboard'),

      h2('5.1 KPI-Karten'),
      p('Die vier Karten oben zeigen auf einen Blick:'),
      bullet('Gesamt-SP: Alle verf\u00fcgbaren Story Points im gew\u00e4hlten Zeitraum'),
      bullet('Mitarbeiter: Anzahl geplanter Personen (gefiltert)'),
      bullet('Pikett-Lücken: Anzahl Tage mit Unterbesetzung im Pikett'),
      bullet('Betrieb-Lücken: Anzahl Tage mit Unterbesetzung im Betrieb'),

      h2('5.2 Kapazit\u00e4ts-Diagramm'),
      p('Das Balkendiagramm zeigt die verf\u00fcgbaren Story Points pro Team und Iteration. Jedes Team hat eine eigene Farbe. Mit dem Mauszeiger \u00fcber einem Balken erscheint ein Tooltip mit den genauen Werten.'),

      h2('5.3 Absenz-\u00dcbersicht'),
      p('Die Tabelle zeigt pro Mitarbeiter die Anzahl Tage je Absenztyp im gew\u00e4hlten Zeitraum. Team-Summenzeilen aggregieren die Werte.'),

      h2('5.4 L\u00fccken-Anzeige'),
      p('Die L\u00fcckenliste zeigt alle Wochen, in denen die Mindestbesetzung f\u00fcr Pikett oder Betrieb nicht erreicht ist. Die Werte werden gegen die konfigurierten Zielwerte (Einstellungen \u2192 Team-Zielwerte) gepr\u00fcft.'),
      bullet('Rote Eintr\u00e4ge: Pikett-Lücke'),
      bullet('Orange Eintr\u00e4ge: Betrieb-Unterbesetzung'),
      bullet('Gr\u00fcnes Checkmark: Keine L\u00fccken im gew\u00e4hlten Zeitraum'),

      h2('5.5 Export f\u00fcr Confluence'),
      p('Klicken Sie im Dashboard auf "Als PDF exportieren" oder "Als PNG exportieren", um die aktuelle Ansicht (mit aktivem Filter) zu exportieren. Die Datei wird automatisch heruntergeladen und kann direkt in Confluence eingef\u00fcgt werden.'),

      pageBreak(),

      // 6. Einstellungen
      h1('6. Einstellungen'),

      h2('6.1 Mitarbeiter'),
      p('Verwalten Sie den Mitarbeiterstamm f\u00fcr alle Teams. Felder:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          new TableRow({ children: [headerCell('Feld', 2500), headerCell('Beschreibung', 6526)] }),
          new TableRow({ children: [cell('Vorname / Name', 2500), cell('Vollst\u00e4ndiger Name des Mitarbeiters', 6526)] }),
          new TableRow({ children: [cell('Team', 2500), cell('Teamzugeh\u00f6rigkeit (NET, ACM, CON, PAF)', 6526)] }),
          new TableRow({ children: [cell('Typ', 2500), cell('iMA = interne Mitarbeitende, eMA = externe Mitarbeitende', 6526)] }),
          new TableRow({ children: [cell('FTE', 2500), cell('Besch\u00e4ftigungsgrad als Dezimalzahl (1.0 = 100%, 0.8 = 80%)', 6526)] }),
          new TableRow({ children: [cell('Kapazit\u00e4t %', 2500), cell('Prozentualer Anteil der Arbeitszeit der dem Team zur Verf\u00fcgung steht', 6526)] }),
          new TableRow({ children: [cell('Betrieb %', 2500), cell('Prozentualer Anteil f\u00fcr Betriebsaufgaben (wird von SP abgezogen)', 6526)] }),
          new TableRow({ children: [cell('Pauschale %', 2500), cell('Prozentualer Anteil f\u00fcr admin./sonstige T\u00e4tigkeiten (wird von SP abgezogen)', 6526)] }),
          new TableRow({ children: [cell('SP/Tag', 2500), cell('Story Points pro Arbeitstag (Standard: 1)', 6526)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('Validierung: Betrieb % + Pauschale % darf nicht gr\u00f6sser als Kapazit\u00e4t % sein. Die App zeigt eine Warnung wenn dieser Wert \u00fcberschritten wird.'),
      new Paragraph({ spacing: { after: 120 } }),
      p('CSV-Import: Klicken Sie "CSV importieren" und w\u00e4hlen Sie eine Datei im Format: vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag'),

      h2('6.2 PI-Planung'),
      p('Definieren Sie die Program Increments (PIs) und deren Iterationen. Jedes PI hat:'),
      bullet('Bezeichnung (z.B. PI26-1)'),
      bullet('Startdatum und Enddatum'),
      bullet('Bis zu n Iterationen (variabel konfigurierbar, Standard: 4)'),
      p('Bei CSV-Import ohne Iterationen wird das PI-Intervall automatisch in 4 gleiche Iterationen aufgeteilt. Diese k\u00f6nnen anschliessend manuell angepasst werden (Aufklappen \u2192 \u203a Symbol).'),

      h2('6.3 Feiertage, Schulferien, Blocker'),
      p('Drei separate Listen f\u00fcr kalenderrelevante Perioden:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          new TableRow({ children: [headerCell('Kategorie', 2500), headerCell('Bedeutung', 6526)] }),
          new TableRow({ children: [cell('Gesetzliche Feiertage', 2500), cell('Nicht buchbar, werden grau im Kalender angezeigt, kein SP-Beitrag', 6526)] }),
          new TableRow({ children: [cell('Schulferien', 2500), cell('Nur visueller Hinweis (hellgrau), kein Einfluss auf SP-Berechnung', 6526)] }),
          new TableRow({ children: [cell('Blocker / Change Freeze', 2500), cell('Visueller Hinweis mit \u2744\ufe0f Symbol (hellblau), z\u00e4hlen als Arbeitstage', 6526)] }),
        ]
      }),

      h2('6.4 Team-Zielwerte (Legacy)'),
      p('Urspr\u00fcngliche Konfigurations-Ansicht. F\u00fcr neue Installationen werden die Subtabs 6.5 und 6.6 empfohlen. F\u00fcr Kompatibilit\u00e4t mit \u00e4lteren Backups weiterhin verf\u00fcgbar.'),

      h2('6.5 Team-Konfiguration \u2013 neu in v1.3'),
      p('Konfiguriert die Mindestbesetzung f\u00fcr Pikett und Betrieb pro Team. Teamnamen werden automatisch aus dem Mitarbeiterstamm abgeleitet.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          new TableRow({ children: [headerCell('Spalte', 2500), headerCell('Beschreibung', 6526)] }),
          new TableRow({ children: [cell('Team', 2500), cell('Automatisch aus Mitarbeiterstamm \u2013 read-only', 6526)] }),
          new TableRow({ children: [cell('Min. Pikett', 2500), cell('Mindestanzahl Personen t\u00e4glich (inkl. WE + Feiertage)', 6526)] }),
          new TableRow({ children: [cell('Min. Betrieb', 2500), cell('Mindestanzahl Personen nur an Arbeitstagen (kein WE, kein Feiertag)', 6526)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Bedienung: Wert direkt im Feld \u00e4ndern \u2192 Speichern-Button klicken. CSV-Export/Import \u00fcber die Buttons oben rechts (Semikolon-getrennt).'),
      infoBox('CSV-Format: teamName;minPikett;minBetrieb\nBeispiel: PAF;1;2 | ACM;1;2 | NET;0;1 | CON;0;1'),

      h2('6.6 Globale Parameter \u2013 neu in v1.3'),
      p('Globale SP-Standardwerte f\u00fcr alle Berechnungen:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 2000, 4026],
        rows: [
          new TableRow({ children: [headerCell('Parameter', 3000), headerCell('Standard', 2000), headerCell('Beschreibung', 4026)] }),
          new TableRow({ children: [cell('SP pro Tag', 3000), cell('1.0', 2000), cell('Story Points pro Arbeitstag bei 100% FTE', 4026)] }),
          new TableRow({ children: [cell('Arbeitsstunden pro Jahr', 3000), cell('1600', 2000), cell('Referenzwert f\u00fcr FTE-Umrechnung', 4026)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('\u26a0\ufe0f Hinweis: \u00c4nderungen an Globalen Parametern wirken sofort auf alle SP-Berechnungen der gesamten App.'),

      h2('6.7 Farbeinstellungen'),
      p('Passen Sie die Farben der Buchungstypen und Kalenderelemente an Ihre Bed\u00fcrfnisse an. F\u00fcr jeden Typ k\u00f6nnen Sie Hintergrundfarbe und Schriftfarbe separat w\u00e4hlen. Eine Vorschau zeigt das Ergebnis sofort. Mit "Auf Standard zur\u00fccksetzen" stellen Sie die Originalfarben wieder her.'),

      pageBreak(),

      // 7. Backup und Restore
      h1('7. Backup und Restore'),

      h2('7.1 Backup erstellen'),
      numbered('Navigieren Sie zu Einstellungen \u2192 Backup/Restore'),
      numbered('Klicken Sie auf "Backup exportieren"'),
      numbered('W\u00e4hlen Sie einen Speicherort auf Ihrem Computer'),
      numbered('Die Datei wird als JSON gespeichert (z.B. safe-pi-backup-2026-03-28.json)'),
      p('Das Backup enth\u00e4lt: alle Mitarbeiter mit Buchungen, PI-Planung, Feiertage, Schulferien, Blocker, Team-Zielwerte und Farbkonfiguration.'),
      infoBox('Empfehlung: Erstellen Sie vor jedem PI Planning ein Backup. Speichern Sie Backups auf einem Netzlaufwerk oder in einem gemeinsamen Ordner.'),

      h2('7.2 Backup wiederherstellen'),
      numbered('Navigieren Sie zu Einstellungen \u2192 Backup/Restore'),
      numbered('Klicken Sie auf "Backup importieren"'),
      numbered('W\u00e4hlen Sie die JSON-Backup-Datei'),
      numbered('Best\u00e4tigen Sie die Wiederherstellung'),
      p('Achtung: Die Wiederherstellung \u00fcberschreibt alle aktuellen Daten.'),

      pageBreak(),

      // 8. Multiuser
      h1('8. Mehrbenutzer-Betrieb'),
      p('Der SAFe PI Capacity Planner unterst\u00fctzt den gleichzeitigen Zugriff mehrerer Benutzer. \u00c4nderungen eines Benutzers werden in Echtzeit bei allen anderen sichtbar.'),

      h2('8.1 Verbindungsstatus'),
      p('Der Header zeigt rechts den Verbindungsstatus:'),
      bullet('Gr\u00fcner Punkt "Verbunden": \u00c4nderungen werden synchronisiert'),
      bullet('Roter Punkt "Getrennt": Keine Verbindung zum Server. \u00c4nderungen werden lokal gespeichert, aber nicht synchronisiert.'),

      h2('8.2 Gleichzeitiges Bearbeiten'),
      p('Wenn ein Benutzer eine Zeile bearbeitet (Drag-Buchung), wird diese Zeile f\u00fcr andere Benutzer gesperrt angezeigt. Nach dem Loslassen der Maus wird die Zeile automatisch freigegeben.'),
      infoBox('Wichtig: Bei einem Verbindungsunterbruch verbindet sich die Applikation automatisch wieder. Der aktuelle Stand wird vom Server nachgeladen.'),

      pageBreak(),

      // 9. PI Dashboard Tab (neu v1.2)
      h1('9. PI Dashboard Tab'),
      p('Der PI Dashboard Tab (neu ab Version 1.2) erm\u00f6glicht einen direkten Vergleich zwischen den in Jira committeten Story Points und der vom Planner berechneten Kapazit\u00e4t \u2013 pro Team und Iteration.'),

      h2('9.1 Aufbau'),
      p('Pro PI erscheint eine Sektion mit PI-Name und Datumsbereich. Innerhalb jeder Sektion wird pro Team eine Tabelle mit farbigem Team-Header angezeigt.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2800, 6226],
        rows: [
          new TableRow({ children: [headerCell('Spalte', 2800), headerCell('Beschreibung', 6226)] }),
          new TableRow({ children: [cell('Iteration', 2800), cell('Name der Iteration innerhalb des PI', 6226)] }),
          new TableRow({ children: [cell('Betriebstage', 2800), cell('Arbeitstage (Mo\u2013Fr) ohne gesetzliche Feiertage', 6226)] }),
          new TableRow({ children: [cell('SP in Jira \u2013 editierbar', 2800), cell('Manuell erfasste Jira-Commitments des PO (Klick zum Bearbeiten)', 6226)] }),
          new TableRow({ children: [cell('Berechnet SP', 2800), cell('Theoretische Kapazit\u00e4t: Betriebstage \u00d7 SP-Rate \u00d7 FTE \u00d7 (1\u2212Betrieb%) \u00d7 (1\u2212Pauschale%)', 6226)] }),
          new TableRow({ children: [cell('Verf\u00fcgbar SP Netto', 2800), cell('Tagesgenaue Kapazit\u00e4t aus dem Planner (inkl. FERIEN, ABWESEND etc.)', 6226)] }),
          new TableRow({ children: [cell('Delta (neu v1.3)', 2800), cell('Verf\u00fcgbar SP Netto \u2212 SP in Jira: \u2705 Puffer | \u2139\ufe0f Exakt | \u26a0\ufe0f \u00dcberbucht', 6226)] }),
          new TableRow({ children: [cell('Auslastung Jira %', 2800), cell('SP in Jira \u00f7 Verf\u00fcgbar SP Netto \u00d7 100', 6226)] }),
          new TableRow({ children: [cell('Auslastung App %', 2800), cell('Berechnet SP \u00f7 Verf\u00fcgbar SP Netto \u00d7 100', 6226)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Die letzte Zeile jeder Team-Tabelle zeigt die PI Total-Summe (blau hervorgehoben).'),

      h2('9.2 SP in Jira erfassen'),
      numbered('Auf eine Zelle in der Spalte \u201eSP in Jira\u201c klicken'),
      numbered('Zahl eingeben (Dezimalwerte mit Punkt oder Komma m\u00f6glich)'),
      numbered('Enter oder Klick ausserhalb speichert den Wert automatisch'),
      numbered('Escape bricht ab \u2013 Originalwert bleibt erhalten'),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('Hinweis (ab v1.3): Die SP-in-Jira-Werte werden im Server-State gespeichert und mit allen verbundenen Benutzern synchronisiert. Sie sind im JSON-Backup enthalten (Feld piTeamTargets).'),

      h2('9.2b Delta-Spalte (neu in v1.3)'),
      p('Die Delta-Spalte zeigt die Differenz zwischen verf\u00fcgbarer Kapazit\u00e4t und den Jira-Commitments:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1200, 2000, 5826],
        rows: [
          new TableRow({ children: [headerCell('Symbol', 1200), headerCell('Delta', 2000), headerCell('Bedeutung', 5826)] }),
          new TableRow({ children: [cell('\u2705 +x.x', 1200), cell('Positiv', 2000), cell('Kapazit\u00e4tspuffer vorhanden \u2013 mehr SP verf\u00fcgbar als committed', 5826)] }),
          new TableRow({ children: [cell('\u2139\ufe0f 0.0', 1200), cell('Null', 2000), cell('Exakt ausgelastet', 5826)] }),
          new TableRow({ children: [cell('\u26a0\ufe0f \u2212x.x', 1200), cell('Negativ', 2000), cell('\u00dcberbucht \u2013 Commitments \u00fcbersteigen Kapazit\u00e4t. R\u00fccksprache mit PO empfohlen.', 5826)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('Hinweis: Die App weist nur auf Delta-Situationen hin. Ob Commitments angepasst werden, bleibt Entscheidung des Teams und des Product Owners.'),

      h2('9.3 Farbcodierung Auslastung'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1500, 2500, 5026],
        rows: [
          new TableRow({ children: [headerCell('Farbe', 1500), headerCell('Bereich', 2500), headerCell('Bedeutung', 5026)] }),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1500, type: WidthType.DXA }, shading: { fill: 'DCFCE7', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Gr\u00fcn', font: 'Arial', size: 20, color: '166534' })] })] }),
            cell('< 85 %', 2500),
            cell('Kapazit\u00e4t gut genutzt \u2013 kein Handlungsbedarf', 5026),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1500, type: WidthType.DXA }, shading: { fill: 'FFEDD5', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Orange', font: 'Arial', size: 20, color: 'C2410C' })] })] }),
            cell('85\u2013100 %', 2500),
            cell('Nah an der Grenze \u2013 Achtung, Puffer pr\u00fcfen', 5026),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 1500, type: WidthType.DXA }, shading: { fill: 'FEE2E2', type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Rot', font: 'Arial', size: 20, color: 'DC2626' })] })] }),
            cell('> 100 %', 2500),
            cell('\u00dcberlastet \u2013 Commitments \u00fcbersteigen Kapazit\u00e4t, Anpassung n\u00f6tig', 5026),
          ]}),
        ]
      }),

      h2('9.4 Filterleiste'),
      p('Die Filterleiste wirkt direkt auf den PI Dashboard Tab:'),
      bullet('Team-Filter: Zeigt nur die gew\u00e4hlten Teams an'),
      bullet('PI-Filter: Zeigt nur das gew\u00e4hlte PI'),
      bullet('Jahr-Filter: Filtert PIs nach Kalenderjahr'),
      bullet('Zeitraum: Freier Von/Bis-Datumsbereich'),

      pageBreak(),

      // 10. Häufige Fragen
      h1('10. H\u00e4ufig gestellte Fragen (FAQ)'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [4000, 5026],
        rows: [
          new TableRow({ children: [headerCell('Frage', 4000), headerCell('Antwort', 5026)] }),
          new TableRow({ children: [cell('Warum ist eine Zelle ausgegraut?', 4000), cell('Wochenenden und gesetzliche Feiertage sind nicht buchbar.', 5026)] }),
          new TableRow({ children: [cell('Warum \u00e4ndert sich meine Buchung nicht?', 4000), cell('Pr\u00fcfen Sie ob der richtige Buchungstyp in der Legende aktiv ist.', 5026)] }),
          new TableRow({ children: [cell('Warum stimmen die SP nicht?', 4000), cell('Pr\u00fcfen Sie FTE, Betrieb% und Pauschale% in den Mitarbeiter-Einstellungen.', 5026)] }),
          new TableRow({ children: [cell('Wie l\u00f6sche ich alle Buchungen?', 4000), cell('Toolbar im Planung-Tab: "Alle Buchungen l\u00f6schen" (Papierkorb-Symbol).', 5026)] }),
          new TableRow({ children: [cell('Meine Daten sind nach dem Neustart weg', 4000), cell('Bitte regelm\u00e4ssig Backups erstellen. Daten werden in-memory gehalten.', 5026)] }),
          new TableRow({ children: [cell('Kann ich meine Farben zur\u00fccksetzen?', 4000), cell('Einstellungen \u2192 Farbeinstellungen \u2192 "Auf Standard zur\u00fccksetzen".', 5026)] }),
          new TableRow({ children: [cell('Wie exportiere ich f\u00fcr Confluence?', 4000), cell('Dashboard \u2192 "Als PDF exportieren" oder "Als PNG exportieren".', 5026)] }),
          new TableRow({ children: [cell('Was bedeutet die \u2744\ufe0f-Markierung?', 4000), cell('Change Freeze / Blocker-Tag. Diese Tage z\u00e4hlen als Arbeitstage (kein SP-Abzug), aber Deployments sind gesperrt.', 5026)] }),
          new TableRow({ children: [cell('SP in Jira sind nach Server-Neustart weg', 4000), cell('Ab v1.3 liegen die Werte im Server-State. Bei Server-Neustart JSON-Backup importieren (Einstellungen \u2192 Backup/Restore).', 5026)] }),
          new TableRow({ children: [cell('Warum unterscheiden sich Berechnet SP und Verf\u00fcgbar SP Netto?', 4000), cell('Berechnet SP ist theoretisch (keine Absenzen ber\u00fccksichtigt). Verf\u00fcgbar SP Netto zieht Ferien, Abwesenheiten etc. tagesgenau ab.', 5026)] }),
          new TableRow({ children: [cell('Sehen andere Benutzer meine SP-in-Jira-Werte?', 4000), cell('Ja, ab v1.3. Die Werte werden via Socket.io synchronisiert und sind f\u00fcr alle verbundenen Benutzer sofort sichtbar.', 5026)] }),
          new TableRow({ children: [cell('Was bedeutet das Delta im PI Dashboard?', 4000), cell('Delta = Verf\u00fcgbar SP Netto \u2212 SP in Jira. Positiv = Puffer (\u2705), Null = exakt (\u2139\ufe0f), Negativ = \u00fcberbucht (\u26a0\ufe0f).', 5026)] }),
          new TableRow({ children: [cell('Wie stelle ich Min. Pikett / Betrieb ein?', 4000), cell('Einstellungen \u2192 Team-Konfiguration. Werte direkt im Feld \u00e4ndern und Speichern klicken. CSV-Import/Export verf\u00fcgbar.', 5026)] }),
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('./benutzerdokumentation_v1.3.docx', buffer);
  console.log('benutzerdokumentation_v1.3.docx erstellt');
});
