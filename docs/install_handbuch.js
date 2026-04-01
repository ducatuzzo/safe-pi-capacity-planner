const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Footer, PageBreak, Tab,
  SimpleField
} = require('docx');
const fs = require('fs');

const BUND_BLAU = '003F7F';
const BUND_ROT = 'E63312';
const GRAU = 'F5F5F5';
const HELL_GRAU = 'D1D5DB';
const TEXT = '1A1A1A';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: BUND_BLAU };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

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
    borders: headerBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: BUND_BLAU, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: 'Arial', size: 20 })] })]
  });
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
            new TextRun({ text: 'SAFe PI Capacity Planner \u2013 Installationshandbuch | BIT | Version 1.0 | 2026    ', font: 'Arial', size: 16, color: '666666' }),
            new TextRun({ children: [new SimpleField('PAGE')], font: 'Arial', size: 16, color: '666666' })
          ],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: HELL_GRAU, space: 1 } }
        })]
      })
    },
    children: [
      // Titelseite
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Schweizerische Eidgenossenschaft', font: 'Arial', size: 20, color: '666666' })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Bundesamt f\u00fcr Informatik und Telekommunikation BIT', font: 'Arial', size: 20, color: '666666' })]
      }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BUND_BLAU, space: 4 } },
        children: [new TextRun({ text: 'SAFe PI Capacity Planner', font: 'Arial', size: 56, bold: true, color: BUND_BLAU })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Installationshandbuch', font: 'Arial', size: 36, bold: false, color: TEXT })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Version 1.0 | M\u00e4rz 2026', font: 'Arial', size: 22, color: '666666' })]
      }),
      new Paragraph({ spacing: { before: 2000 } }),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [headerCell('Dokument', 2000), headerCell('', 7026)] }),
          new TableRow({ children: [cell('Titel', 2000, true, GRAU), cell('SAFe PI Capacity Planner \u2013 Installationshandbuch', 7026)] }),
          new TableRow({ children: [cell('Version', 2000, true, GRAU), cell('1.0', 7026)] }),
          new TableRow({ children: [cell('Datum', 2000, true, GRAU), cell('M\u00e4rz 2026', 7026)] }),
          new TableRow({ children: [cell('Autor', 2000, true, GRAU), cell('BIT / PS-NET Chapter', 7026)] }),
          new TableRow({ children: [cell('Klassifizierung', 2000, true, GRAU), cell('Intern', 7026)] }),
        ]
      }),
      pageBreak(),

      // 1. Zweck
      h1('1. Zweck dieses Dokuments'),
      p('Dieses Installationshandbuch beschreibt die Voraussetzungen, Schritte und Konfigurationsoptionen f\u00fcr die lokale Installation des SAFe PI Capacity Planners. Die Applikation wird als lokaler Fullstack-Webserver betrieben und ist \u00fcber einen Webbrowser erreichbar.'),
      p('Der SAFe PI Capacity Planner dient der Kapazit\u00e4tsplanung im Rahmen von SAFe PI Planning. Teams erfassen Absenzen und das System berechnet automatisch verf\u00fcgbare Story Points pro Team und Iteration.'),

      // 2. Infrastruktur
      h1('2. Minimalanforderungen an die Infrastruktur'),

      h2('2.1 Hardware'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [headerCell('Komponente', 3000), headerCell('Anforderung', 6026)] }),
          new TableRow({ children: [cell('Prozessor', 3000), cell('2-Core CPU, 1.5 GHz oder h\u00f6her', 6026)] }),
          new TableRow({ children: [cell('Arbeitsspeicher', 3000), cell('4 GB RAM (8 GB empfohlen)', 6026)] }),
          new TableRow({ children: [cell('Festplatte', 3000), cell('500 MB freier Speicherplatz', 6026)] }),
          new TableRow({ children: [cell('Netzwerk', 3000), cell('Lokal (localhost) oder LAN f\u00fcr Multiuser-Betrieb', 6026)] }),
        ]
      }),

      h2('2.2 Betriebssystem'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [headerCell('Betriebssystem', 3000), headerCell('Unterst\u00fctzte Versionen', 6026)] }),
          new TableRow({ children: [cell('Windows', 3000), cell('Windows 10 (64-bit) oder h\u00f6her', 6026)] }),
          new TableRow({ children: [cell('macOS', 3000), cell('macOS 11 Big Sur oder h\u00f6her', 6026)] }),
          new TableRow({ children: [cell('Linux', 3000), cell('Ubuntu 20.04 LTS oder vergleichbar (experimentell)', 6026)] }),
        ]
      }),

      h2('2.3 Software-Voraussetzungen'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Software', 3000), headerCell('Mindestversion', 3000), headerCell('Download', 3026)] }),
          new TableRow({ children: [cell('Node.js', 3000), cell('v18.0.0 LTS oder h\u00f6her', 3000), cell('https://nodejs.org', 3026)] }),
          new TableRow({ children: [cell('npm', 3000), cell('v9.0.0 oder h\u00f6her (mit Node.js)', 3000), cell('Im Node.js-Installer enthalten', 3026)] }),
          new TableRow({ children: [cell('Git', 3000), cell('v2.30.0 oder h\u00f6her', 3000), cell('https://git-scm.com', 3026)] }),
          new TableRow({ children: [cell('Webbrowser', 3000), cell('Chrome 90+, Edge 90+, Firefox 88+', 3000), cell('Vorinstalliert', 3026)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('Hinweis: Node.js v25.x wird unterst\u00fctzt, empfohlen wird jedoch die LTS-Version (v22.x) f\u00fcr maximale Stabilit\u00e4t.'),

      h2('2.4 Netzwerk-Anforderungen (Multiuser-Betrieb)'),
      p('F\u00fcr den Einzelplatz-Betrieb (localhost) sind keine speziellen Netzwerk-Konfigurationen erforderlich. F\u00fcr den Multiuser-Betrieb im LAN:'),
      bullet('Port 3001 (Backend/API) muss im lokalen Netzwerk erreichbar sein'),
      bullet('Port 5173 (Frontend, Entwicklungsmodus) oder der konfigurierte Produktions-Port'),
      bullet('Firewall-Regeln m\u00fcssen eingehende Verbindungen auf diesen Ports erlauben'),
      bullet('Keine Internetverbindung erforderlich \u2013 die Applikation l\u00e4uft vollst\u00e4ndig lokal'),

      pageBreak(),

      // 3. Installation
      h1('3. Installationsschritte'),

      h2('3.1 \u00dcbersicht'),
      p('Die Installation besteht aus vier Schritten: Voraussetzungen pr\u00fcfen, Applikationsdateien bereitstellen, Abh\u00e4ngigkeiten installieren, Applikation starten.'),

      h2('3.2 Schritt 1: Voraussetzungen pr\u00fcfen'),
      p('\u00d6ffnen Sie eine Eingabeaufforderung (Windows: CMD oder PowerShell, macOS/Linux: Terminal) und f\u00fchren Sie folgende Befehle aus:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [headerCell('Befehl', 3000), headerCell('Erwartete Ausgabe', 6026)] }),
          new TableRow({ children: [cell('node --version', 3000), cell('v18.0.0 oder h\u00f6her (z.B. v22.14.0)', 6026)] }),
          new TableRow({ children: [cell('npm --version', 3000), cell('9.0.0 oder h\u00f6her', 6026)] }),
          new TableRow({ children: [cell('git --version', 3000), cell('git version 2.30.0 oder h\u00f6her', 6026)] }),
        ]
      }),

      h2('3.3 Schritt 2: Applikationsdateien bereitstellen'),
      p('Kopieren Sie den Applikationsordner safe-pi-capacity-planner an den gew\u00fcnschten Installationsort auf Ihrem Computer, zum Beispiel:'),
      bullet('Windows: C:\\Programme\\safe-pi-capacity-planner\\'),
      bullet('macOS: /Applications/safe-pi-capacity-planner/'),
      p('Der Ordner enth\u00e4lt folgende wichtige Dateien und Verzeichnisse:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [headerCell('Datei/Ordner', 3000), headerCell('Beschreibung', 6026)] }),
          new TableRow({ children: [cell('src/', 3000), cell('Quellcode des Frontends (React/TypeScript)', 6026)] }),
          new TableRow({ children: [cell('server.ts', 3000), cell('Backend-Server (Express + Socket.io)', 6026)] }),
          new TableRow({ children: [cell('package.json', 3000), cell('Abh\u00e4ngigkeiten und Start-Skripte', 6026)] }),
          new TableRow({ children: [cell('vite.config.ts', 3000), cell('Frontend-Build-Konfiguration', 6026)] }),
        ]
      }),

      h2('3.4 Schritt 3: Abh\u00e4ngigkeiten installieren'),
      p('Navigieren Sie im Terminal in den Installationsordner und f\u00fchren Sie aus:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 200, right: 100 },
          width: { size: 9026, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'cd C:\\Programme\\safe-pi-capacity-planner', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: 'npm install', font: 'Courier New', size: 18, color: '00FF00' })] }),
          ]
        })] })]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('npm l\u00e4dt alle ben\u00f6tigten Abh\u00e4ngigkeiten herunter (ca. 150-200 MB). Eine Internetverbindung ist f\u00fcr diesen Schritt erforderlich.'),
      infoBox('Hinweis: Dieser Schritt muss nur einmal durchgef\u00fchrt werden. Bei sp\u00e4teren Starts ist kein npm install mehr n\u00f6tig.'),

      h2('3.5 Schritt 4: Applikation starten'),
      p('Starten Sie Frontend und Backend gemeinsam mit einem einzigen Befehl:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 200, right: 100 },
          width: { size: 9026, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: 'npm run dev', font: 'Courier New', size: 18, color: '00FF00' })] })]
        })] })]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('Die Applikation ist erfolgreich gestartet, wenn die Konsole folgendes anzeigt:'),
      bullet('VITE v6.x.x  ready in XXX ms'),
      bullet('Local: http://localhost:5173/'),
      bullet('[Server] L\u00e4uft auf http://localhost:3001'),
      p('\u00d6ffnen Sie einen Webbrowser und navigieren Sie zu: http://localhost:5173'),

      pageBreak(),

      // 4. Konfiguration
      h1('4. Konfiguration'),

      h2('4.1 Port-Konfiguration'),
      p('Die Standard-Ports k\u00f6nnen bei Bedarf angepasst werden:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2000, 5026],
        rows: [
          new TableRow({ children: [headerCell('Dienst', 2000), headerCell('Standard-Port', 2000), headerCell('Konfigurationsdatei', 5026)] }),
          new TableRow({ children: [cell('Frontend (Vite)', 2000), cell('5173', 2000), cell('vite.config.ts \u2192 server.port', 5026)] }),
          new TableRow({ children: [cell('Backend (Express)', 2000), cell('3001', 2000), cell('server.ts \u2192 const PORT', 5026)] }),
        ]
      }),

      h2('4.2 Importdaten vorbereiten'),
      p('Beim ersten Start sind die Stammdaten bereits als Seed-Daten geladen. F\u00fcr die Aktualisierung stehen CSV-Importfunktionen in den Einstellungen zur Verf\u00fcgung:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Kategorie', 3000), headerCell('CSV-Dateiname', 3000), headerCell('Einstellungen-Tab', 3026)] }),
          new TableRow({ children: [cell('Mitarbeiterstamm', 3000), cell('mitarbeiterstamm.csv', 3000), cell('Einstellungen \u2192 Mitarbeiter', 3026)] }),
          new TableRow({ children: [cell('PI-Planung', 3000), cell('pi_planung_iterationen.csv', 3000), cell('Einstellungen \u2192 PI-Planung', 3026)] }),
          new TableRow({ children: [cell('Gesetzl. Feiertage', 3000), cell('gesetzliche_feiertage.csv', 3000), cell('Einstellungen \u2192 Feiertage', 3026)] }),
          new TableRow({ children: [cell('Schulferien', 3000), cell('schulferien.csv', 3000), cell('Einstellungen \u2192 Schulferien', 3026)] }),
          new TableRow({ children: [cell('Blocker', 3000), cell('blocker_spezielle_perioden.csv', 3000), cell('Einstellungen \u2192 Blocker', 3026)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      p('CSV-Format: Semikolon-getrennt (;), UTF-8 mit BOM-Kodierung, Header-Zeile erforderlich.'),

      pageBreak(),

      // 5. Betrieb
      h1('5. Betrieb'),

      h2('5.1 Normaler Start und Stopp'),
      h3('Start'),
      p('Terminal im Installationsordner \u00f6ffnen und ausf\u00fchren: npm run dev'),
      p('Browser-URL: http://localhost:5173'),
      h3('Stopp'),
      p('Im Terminal die Tastenkombination Ctrl+C (Windows/Linux) oder Cmd+C (macOS) dr\u00fccken.'),

      h2('5.2 Multiuser-Betrieb'),
      p('F\u00fcr den gleichzeitigen Zugriff mehrerer Benutzer im LAN:'),
      numbered('Server auf einem dedizierten Computer starten'),
      numbered('npm run dev auf dem Server-Computer ausf\u00fchren'),
      numbered('IP-Adresse des Servers ermitteln (Windows: ipconfig, macOS/Linux: ifconfig)'),
      numbered('Andere Benutzer navigieren zu: http://[SERVER-IP]:5173'),
      infoBox('Wichtig: Die Applikation speichert Daten in-memory auf dem Server. Bei einem Neustart des Servers gehen nicht gesicherte Daten verloren. Regelm\u00e4ssige Backups \u00fcber Einstellungen \u2192 Backup/Restore sind empfohlen.'),

      h2('5.3 Backup und Daten-Persistenz'),
      p('Die Applikation enth\u00e4lt eine integrierte Backup/Restore-Funktion:'),
      bullet('Backup exportieren: Einstellungen \u2192 Backup/Restore \u2192 "Backup exportieren"'),
      bullet('Speicherort: Beliebiger lokaler Ordner (empfohlen: regelm\u00e4ssige Sicherung auf Netzlaufwerk)'),
      bullet('Backup wiederherstellen: Einstellungen \u2192 Backup/Restore \u2192 "Backup importieren"'),
      bullet('Format: JSON-Datei mit Zeitstempel (z.B. safe-pi-backup-2026-03-28.json)'),

      pageBreak(),

      // 6. Fehlerbehebung
      h1('6. Fehlerbehebung'),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Problem', 3000), headerCell('Ursache', 3000), headerCell('L\u00f6sung', 3026)] }),
          new TableRow({ children: [cell('npm run dev startet nicht', 3000), cell('Node.js nicht installiert oder falsche Version', 3000), cell('Node.js v18+ installieren, node --version pr\u00fcfen', 3026)] }),
          new TableRow({ children: [cell('Port bereits belegt', 3000), cell('Anderer Prozess nutzt Port 5173 oder 3001', 3000), cell('Prozess beenden oder Port in vite.config.ts / server.ts \u00e4ndern', 3026)] }),
          new TableRow({ children: [cell('Leere Seite im Browser', 3000), cell('Frontend gestartet, Backend nicht', 3000), cell('Konsole pr\u00fcfen: "[Server] L\u00e4uft auf ..." muss erscheinen', 3026)] }),
          new TableRow({ children: [cell('"Getrennt" im Header', 3000), cell('Backend auf Port 3001 nicht erreichbar', 3000), cell('npm run dev neu starten, beide Prozesse m\u00fcssen laufen', 3026)] }),
          new TableRow({ children: [cell('Git nicht gefunden (Windows)', 3000), cell('Git nicht installiert oder nicht im PATH', 3000), cell('Git for Windows installieren, neues Terminal \u00f6ffnen', 3026)] }),
          new TableRow({ children: [cell('CSV-Import schl\u00e4gt fehl', 3000), cell('Falsches Trennzeichen oder Encoding', 3000), cell('Semikolon (;) als Trennzeichen, UTF-8 mit BOM speichern', 3026)] }),
        ]
      }),

      pageBreak(),

      // 7. Supportkontakt
      h1('7. Supportkontakt'),
      p('Bei technischen Fragen zur Installation wenden Sie sich an:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [headerCell('Kontakt', 3000), headerCell('', 6026)] }),
          new TableRow({ children: [cell('Organisationseinheit', 3000), cell('BIT / PS-NET Chapter', 6026)] }),
          new TableRow({ children: [cell('Verantwortlich', 3000), cell('Head of Chapter PS-NET', 6026)] }),
          new TableRow({ children: [cell('Interne Dokumentation', 3000), cell('Confluence \u2013 BIT PS-NET Bereich', 6026)] }),
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('./installationshandbuch_v1.0.docx', buffer);
  console.log('installationshandbuch_v1.0.docx erstellt');
});
