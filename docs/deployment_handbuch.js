const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Footer, PageBreak, SimpleField
} = require('docx');
const fs = require('fs');

const BUND_BLAU = '003F7F';
const GRAU = 'F5F5F5';
const HELL_GRAU = 'D1D5DB';
const TEXT = '1A1A1A';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, width, bold = false, bg = null) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
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

function infoBox(text, color = 'EBF3FB', borderColor = BUND_BLAU) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: borderColor }, bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor }, left: { style: BorderStyle.SINGLE, size: 12, color: borderColor }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      shading: { fill: color, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 200, right: 100 },
      width: { size: 9026, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, color: TEXT })] })]
    })] })]
  });
}

function warningBox(text) {
  return infoBox(text, 'FEF3CD', 'F59E0B');
}

function codeBlock(lines) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      borders,
      shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 100 },
      width: { size: 9026, type: WidthType.DXA },
      children: lines.map(l => new Paragraph({ children: [new TextRun({ text: l, font: 'Courier New', size: 18, color: '00FF00' })] }))
    })] })]
  });
}

function sp() { return new Paragraph({ spacing: { after: 120 } }); }

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
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'SAFe PI Capacity Planner \u2013 Deployment-Handbuch | BIT | Version 1.0 | 2026    ', font: 'Arial', size: 16, color: '666666' }),
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
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Deployment-Handbuch', font: 'Arial', size: 36, color: TEXT })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lokaler Client & Server im BIT-Netzwerk', font: 'Arial', size: 24, color: '666666' })] }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Version 1.0 | M\u00e4rz 2026', font: 'Arial', size: 22, color: '666666' })] }),
      new Paragraph({ spacing: { before: 1500 } }),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [headerCell('Dokument', 2000), headerCell('', 7026)] }),
          new TableRow({ children: [cell('Titel', 2000, true, GRAU), cell('SAFe PI Capacity Planner \u2013 Deployment-Handbuch', 7026)] }),
          new TableRow({ children: [cell('Zielgruppe', 2000, true, GRAU), cell('IT-Administratoren, Chapter Leads, technisch versierte Benutzer', 7026)] }),
          new TableRow({ children: [cell('Version', 2000, true, GRAU), cell('1.0', 7026)] }),
          new TableRow({ children: [cell('Datum', 2000, true, GRAU), cell('M\u00e4rz 2026', 7026)] }),
          new TableRow({ children: [cell('Abh\u00e4ngigkeit', 2000, true, GRAU), cell('Installationshandbuch v1.0 (Voraussetzungen und Erstinstallation)', 7026)] }),
        ]
      }),
      pageBreak(),

      // 1. Übersicht
      h1('1. Deployment-Szenarien im \u00dcberblick'),
      p('Dieses Dokument beschreibt zwei Deployment-Szenarien f\u00fcr den SAFe PI Capacity Planner:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [1500, 2500, 2500, 2526],
        rows: [
          new TableRow({ children: [headerCell('Szenario', 1500), headerCell('Beschreibung', 2500), headerCell('Benutzer', 2500), headerCell('Empfohlen f\u00fcr', 2526)] }),
          new TableRow({ children: [cell('Option A', 1500, true), cell('Lokaler Client \u2013 Einzelplatz', 2500), cell('1 Person (localhost)', 2500), cell('Pers\u00f6nliche Nutzung, Testen, Onboarding neuer Teammitglieder', 2526)] }),
          new TableRow({ children: [cell('Option B', 1500, true), cell('Server im LAN \u2013 Entwicklungsmodus', 2500), cell('Mehrere Personen gleichzeitig', 2500), cell('Team-Nutzung im BIT-internen Netzwerk (empfohlen)', 2526)] }),
        ]
      }),
      sp(),
      infoBox('Empfehlung: F\u00fcr den Produktiveinsatz im Team empfehlen wir Option B (Server im LAN). Option A eignet sich f\u00fcr Einzelpersonen oder als Backup-L\u00f6sung.'),
      pageBreak(),

      // 2. Option A
      h1('2. Option A: Lokaler Client (Einzelplatz)'),

      h2('2.1 Voraussetzungen'),
      p('Folgende Software muss auf dem Ziel-Computer installiert sein (Details siehe Installationshandbuch v1.0):'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Software', 3000), headerCell('Mindestversion', 3000), headerCell('Pr\u00fcfbefehl', 3026)] }),
          new TableRow({ children: [cell('Node.js', 3000), cell('v18.0.0 LTS', 3000), cell('node --version', 3026)] }),
          new TableRow({ children: [cell('npm', 3000), cell('v9.0.0', 3000), cell('npm --version', 3026)] }),
          new TableRow({ children: [cell('Git', 3000), cell('v2.30.0', 3000), cell('git --version', 3026)] }),
          new TableRow({ children: [cell('Webbrowser', 3000), cell('Chrome/Edge/Firefox aktuell', 3000), cell('\u2013', 3026)] }),
        ]
      }),

      h2('2.2 Applikation bereitstellen'),
      p('W\u00e4hlen Sie eine der folgenden Methoden um die Applikationsdateien auf den Ziel-Computer zu \u00fcbertragen:'),

      h3('Methode 1: ZIP-Archiv (einfachste Methode)'),
      numbered('Den Ordner safe-pi-capacity-planner als ZIP komprimieren'),
      numbered('ZIP per E-Mail, USB-Stick oder Netzlaufwerk auf den Ziel-Computer \u00fcbertragen'),
      numbered('ZIP entpacken z.B. nach C:\\Programme\\safe-pi-capacity-planner\\'),

      h3('Methode 2: Netzlaufwerk'),
      numbered('Ordner safe-pi-capacity-planner auf ein gemeinsam genutztes Netzlaufwerk kopieren'),
      numbered('Auf dem Ziel-Computer das Netzlaufwerk einbinden'),
      numbered('Ordner vom Netzlaufwerk auf die lokale Festplatte kopieren (NICHT direkt vom Netzlaufwerk starten)'),
      sp(),
      warningBox('Wichtig: Die Applikation muss auf der lokalen Festplatte liegen. Das Starten direkt vom Netzlaufwerk f\u00fchrt zu Leistungsproblemen und kann Fehler verursachen.'),

      h3('Methode 3: Git (f\u00fcr technisch versierte Benutzer)'),
      p('Falls die Applikation in einem Git-Repository verwaltet wird:'),
      codeBlock([
        'git clone [REPOSITORY-URL] safe-pi-capacity-planner',
        'cd safe-pi-capacity-planner',
      ]),

      h2('2.3 Installation und Start'),
      numbered('Terminal (CMD/PowerShell) im Applikationsordner \u00f6ffnen'),
      numbered('Abh\u00e4ngigkeiten installieren (nur beim ersten Mal):'),
      codeBlock(['npm install']),
      sp(),
      numbered('Applikation starten:'),
      codeBlock(['npm run dev']),
      sp(),
      numbered('Browser \u00f6ffnen und navigieren zu:'),
      codeBlock(['http://localhost:5173']),
      sp(),
      infoBox('Der npm install Schritt dauert 2-5 Minuten und ben\u00f6tigt eine Internetverbindung. Er muss nur einmal ausgef\u00fchrt werden. Danach gen\u00fcgt npm run dev f\u00fcr jeden Start.'),

      h2('2.4 Erste Daten laden'),
      p('Beim ersten Start sind Seed-Daten (BIT PS-NET Mitarbeiterstamm) vorgeladen. Falls Sie eigene Daten verwenden m\u00f6chten:'),
      bullet('Backup importieren: Einstellungen \u2192 Backup/Restore \u2192 "Backup importieren" (JSON-Datei)'),
      bullet('CSV importieren: Einstellungen \u2192 jeweilige Kategorie \u2192 "CSV importieren"'),

      h2('2.5 Applikation beenden'),
      p('Im Terminal die Tastenkombination dr\u00fccken:'),
      bullet('Windows/Linux: Ctrl + C'),
      bullet('macOS: Cmd + C'),
      p('Danach "J" best\u00e4tigen oder nochmals Ctrl+C dr\u00fccken.'),

      pageBreak(),

      // 3. Option B
      h1('3. Option B: Server im BIT-Netzwerk (Multiuser)'),

      h2('3.1 Architektur'),
      p('Beim Server-Deployment l\u00e4uft die Applikation auf einem dedizierten Computer im BIT-Netzwerk. Alle anderen Benutzer greifen via Browser \u00fcber die IP-Adresse des Servers zu. Keine Installation auf den Client-Computern erforderlich.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [4513, 4513],
        rows: [
          new TableRow({ children: [headerCell('Server-Computer (1x)', 4513), headerCell('Client-Computer (beliebig viele)', 4513)] }),
          new TableRow({ children: [cell('Node.js, npm, Git installiert', 4513), cell('Nur Webbrowser ben\u00f6tigt', 4513)] }),
          new TableRow({ children: [cell('Applikation l\u00e4uft via npm run dev', 4513), cell('Zugriff via http://[SERVER-IP]:5173', 4513)] }),
          new TableRow({ children: [cell('Ports 5173 und 3001 offen', 4513), cell('Keine Installation notwendig', 4513)] }),
          new TableRow({ children: [cell('Muss dauerhaft laufen (solange Zugriff gew\u00fcnscht)', 4513), cell('Einfach Browser \u00f6ffnen und URL eingeben', 4513)] }),
        ]
      }),

      h2('3.2 Server-Computer vorbereiten'),
      p('Auf dem dedizierten Server-Computer (Windows oder macOS):'),

      h3('Schritt 1: Voraussetzungen installieren'),
      p('Installieren Sie auf dem Server-Computer:'),
      numbered('Node.js v18+ von https://nodejs.org (LTS-Version w\u00e4hlen)'),
      numbered('Git von https://git-scm.com'),
      numbered('Pr\u00fcfen Sie die Installation im Terminal:'),
      codeBlock(['node --version', 'git --version']),

      h3('Schritt 2: Applikation bereitstellen'),
      p('Kopieren Sie den Ordner safe-pi-capacity-planner auf den Server-Computer (gleiche Methoden wie Option A, Abschnitt 2.2).'),
      numbered('Applikationsordner auf Server kopieren (z.B. nach C:\\Services\\safe-pi-capacity-planner\\)'),
      numbered('Terminal auf dem Server-Computer \u00f6ffnen'),
      numbered('In den Applikationsordner navigieren und Abh\u00e4ngigkeiten installieren:'),
      codeBlock(['cd C:\\Services\\safe-pi-capacity-planner', 'npm install']),

      h3('Schritt 3: Netzwerk-Konfiguration'),
      p('Damit andere Computer im Netzwerk auf die Applikation zugreifen k\u00f6nnen, m\u00fcssen die Ports freigegeben werden.'),

      p('Windows Firewall-Regel einrichten (als Administrator ausf\u00fchren):'),
      codeBlock([
        'netsh advfirewall firewall add rule name="SAFe PI Planner Frontend" dir=in action=allow protocol=TCP localport=5173',
        'netsh advfirewall firewall add rule name="SAFe PI Planner Backend" dir=in action=allow protocol=TCP localport=3001',
      ]),
      sp(),
      infoBox('Falls Sie keine Administrator-Rechte haben, wenden Sie sich an den BIT IT-Support f\u00fcr die Firewall-Freigabe der Ports 5173 und 3001.'),

      h3('Schritt 4: Applikation f\u00fcr Netzwerk-Zugriff konfigurieren'),
      p('Standardm\u00e4ssig h\u00f6rt Vite nur auf localhost. F\u00fcr den Netzwerk-Zugriff muss die Konfiguration angepasst werden.'),
      p('Datei vite.config.ts im Applikationsordner \u00f6ffnen und den server-Abschnitt anpassen:'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 100 },
          width: { size: 9026, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'server: {', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '  host: true,   // <-- diese Zeile hinzuf\u00fcgen', font: 'Courier New', size: 18, color: 'FFFF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '  port: 5173,', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '}', font: 'Courier New', size: 18, color: '00FF00' })] }),
          ]
        })] })]
      }),
      sp(),
      p('Ebenfalls in server.ts den CORS-Ursprung anpassen (die fixe localhost:5173 Einschr\u00e4nkung entfernen):'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
        rows: [new TableRow({ children: [new TableCell({
          borders,
          shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 100 },
          width: { size: 9026, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: 'const io = new SocketIOServer(httpServer, {', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '  cors: {', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '    origin: "*",   // <-- f\u00fcr LAN-Betrieb anpassen', font: 'Courier New', size: 18, color: 'FFFF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '    methods: ["GET", "POST"],', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '  },', font: 'Courier New', size: 18, color: '00FF00' })] }),
            new Paragraph({ children: [new TextRun({ text: '});', font: 'Courier New', size: 18, color: '00FF00' })] }),
          ]
        })] })]
      }),
      sp(),
      warningBox('Sicherheitshinweis: origin: "*" erlaubt Zugriff von allen Netzwerk-Adressen. F\u00fcr h\u00f6here Sicherheit k\u00f6nnen Sie den Zugriff auf das BIT-interne Netzwerk einschr\u00e4nken, z.B. origin: "http://10.x.x.*".'),

      h2('3.3 Applikation auf dem Server starten'),
      h3('Manueller Start'),
      p('Terminal auf dem Server-Computer \u00f6ffnen und ausf\u00fchren:'),
      codeBlock(['cd C:\\Services\\safe-pi-capacity-planner', 'npm run dev']),
      sp(),
      p('IP-Adresse des Servers ermitteln:'),
      codeBlock(['ipconfig   (Windows)', 'ifconfig   (macOS/Linux)']),
      sp(),
      p('Den Wert unter "IPv4-Adresse" notieren, z.B. 10.20.30.40'),

      h3('Automatischer Start beim Hochfahren (Windows)'),
      p('F\u00fcr einen automatischen Start ohne manuelles Eingreifen kann ein Windows-Task erstellt werden:'),
      numbered('Windows-Aufgabenplanung \u00f6ffnen (Taskplaner)'),
      numbered('"Aufgabe erstellen" w\u00e4hlen'),
      numbered('Trigger: "Beim Start des Computers"'),
      numbered('Aktion: Programm starten'),
      numbered('Programm: cmd.exe'),
      numbered('Argumente: /c "cd /d C:\\Services\\safe-pi-capacity-planner && npm run dev"'),
      numbered('"Mit h\u00f6chsten Privilegien ausf\u00fchren" aktivieren'),
      sp(),
      infoBox('Alternativ kann pm2 (Process Manager) verwendet werden: npm install -g pm2 \u2192 pm2 start "npm run dev" --name safe-pi-planner \u2192 pm2 startup'),

      h2('3.4 Auf die Applikation zugreifen (Client-Computer)'),
      p('Auf jedem Client-Computer gen\u00fcgt ein aktueller Webbrowser. Keine Installation erforderlich.'),
      numbered('Webbrowser \u00f6ffnen (Chrome, Edge, Firefox)'),
      numbered('URL eingeben: http://[SERVER-IP]:5173'),
      numbered('Beispiel: http://10.20.30.40:5173'),
      sp(),
      p('Der Header zeigt einen gr\u00fcnen Punkt "Verbunden" wenn die Verbindung zum Server erfolgreich ist. \u00c4nderungen eines Benutzers sind sofort bei allen anderen sichtbar.'),

      h2('3.5 Backup-Strategie im Server-Betrieb'),
      p('Die Applikation speichert Daten im Arbeitsspeicher des Servers (in-memory). Bei einem Neustart des Servers gehen nicht gesicherte Daten verloren.'),
      p('Empfohlene Backup-Strategie:'),
      bullet('T\u00e4glich: Backup via Einstellungen \u2192 Backup/Restore \u2192 "Backup exportieren" auf einem Netzlaufwerk speichern'),
      bullet('Vor jedem PI Planning: Vollst\u00e4ndiges Backup erstellen'),
      bullet('Nach gr\u00f6sseren \u00c4nderungen: Backup erstellen'),
      bullet('Backup-Dateien mit Datum im Dateinamen versehen: safe-pi-backup-YYYY-MM-DD.json'),
      sp(),
      warningBox('Achtung: Wenn der Server-Computer neu gestartet wird (z.B. Windows-Update), m\u00fcssen die Daten aus dem letzten Backup wiederhergestellt werden. Regelm\u00e4ssige Backups sind zwingend.'),

      pageBreak(),

      // 4. Vergleich
      h1('4. Vergleich der Deployment-Optionen'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 3013, 3013],
        rows: [
          new TableRow({ children: [headerCell('Kriterium', 3000), headerCell('Option A (Lokal)', 3013), headerCell('Option B (Server)', 3013)] }),
          new TableRow({ children: [cell('Installationsaufwand', 3000), cell('Mittel (auf jedem Client)', 3000), cell('Einmalig (nur Server)', 3013)] }),
          new TableRow({ children: [cell('Anzahl Benutzer', 3000), cell('1 (Einzelplatz)', 3000), cell('Beliebig viele', 3013)] }),
          new TableRow({ children: [cell('Echtzeit-Sync', 3000), cell('Nein', 3000), cell('Ja (Socket.io)', 3013)] }),
          new TableRow({ children: [cell('Datensicherheit', 3000), cell('Lokal auf Client', 3000), cell('Zentral auf Server', 3013)] }),
          new TableRow({ children: [cell('Verf\u00fcgbarkeit', 3000), cell('Nur wenn Client l\u00e4uft', 3000), cell('Solange Server l\u00e4uft', 3013)] }),
          new TableRow({ children: [cell('Netzwerk-Anforderungen', 3000), cell('Keine', 3000), cell('Ports 5173 + 3001 offen', 3013)] }),
          new TableRow({ children: [cell('Empfohlen f\u00fcr', 3000), cell('Testen, Einzelpersonen', 3000), cell('Team-Planung im BIT', 3013)] }),
        ]
      }),

      pageBreak(),

      // 4.x PI Dashboard – Server-State (ab v1.3)
      h2('4.x Hinweis: PI Dashboard Tab \u2013 SP-in-Jira-Persistenz (ab v1.3)'),
      p('Ab App-Version 1.3 werden die manuell erfassten \u201eSP in Jira\u201c-Werte im Server-State (AppData) gespeichert und via Socket.io synchronisiert. Sie sind Teil des JSON-Backups.'),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2500, 6526],
        rows: [
          new TableRow({ children: [headerCell('Eigenschaft', 2500), headerCell('Details', 6526)] }),
          new TableRow({ children: [cell('Speicherort', 2500), cell('Server-State (AppData.piTeamTargets), JSON-File auf Backend', 6526)] }),
          new TableRow({ children: [cell('Scope', 2500), cell('Alle verbundenen Benutzer sehen dieselben Werte (synchronisiert)', 6526)] }),
          new TableRow({ children: [cell('Verlust', 2500), cell('Nur bei Server-Neustart ohne vorheriges Backup', 6526)] }),
          new TableRow({ children: [cell('Backup', 2500), cell('Im JSON-Backup enthalten (Feld piTeamTargets) \u2013 bei Restore wiederhergestellt', 6526)] }),
        ]
      }),
      new Paragraph({ spacing: { after: 120 } }),
      infoBox('Wichtig: Alle App-Daten inkl. SP-in-Jira-Werte werden \u00fcber den Server synchronisiert. Regelm\u00e4ssige JSON-Backups (Einstellungen \u2192 Backup/Restore) sch\u00fctzen vor Datenverlust bei Server-Neustart.'),

      pageBreak(),

      // 5. Fehlerbehebung
      h1('5. Fehlerbehebung Deployment'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 3000, 3026],
        rows: [
          new TableRow({ children: [headerCell('Problem', 3000), headerCell('Ursache', 3000), headerCell('L\u00f6sung', 3026)] }),
          new TableRow({ children: [cell('Client kann Server nicht erreichen', 3000), cell('Firewall blockiert Port 5173 oder 3001', 3000), cell('Firewall-Regeln auf Server pr\u00fcfen (Abschnitt 3.2, Schritt 3)', 3026)] }),
          new TableRow({ children: [cell('Header zeigt "Getrennt"', 3000), cell('Backend-Port 3001 nicht erreichbar', 3000), cell('Beide Prozesse m\u00fcssen laufen: Frontend (5173) UND Backend (3001)', 3026)] }),
          new TableRow({ children: [cell('\u00c4nderungen nicht synchronisiert', 3000), cell('CORS-Fehler (falscher Origin)', 3000), cell('server.ts: origin auf "*" oder korrekte IP setzen', 3026)] }),
          new TableRow({ children: [cell('Seite l\u00e4dt, aber leer', 3000), cell('Vite l\u00e4uft nur auf localhost', 3000), cell('vite.config.ts: host: true hinzuf\u00fcgen (Abschnitt 3.2, Schritt 4)', 3026)] }),
          new TableRow({ children: [cell('Verbindung bricht regelm\u00e4ssig ab', 3000), cell('Netzwerk-Timeout oder Proxy', 3000), cell('Netzwerk-Stabilit\u00e4t pr\u00fcfen, ggf. IT-Support kontaktieren', 3026)] }),
          new TableRow({ children: [cell('Daten nach Server-Neustart weg', 3000), cell('In-memory State gel\u00f6scht', 3000), cell('Backup aus Einstellungen wiederherstellen', 3026)] }),
          new TableRow({ children: [cell('npm install schl\u00e4gt fehl', 3000), cell('Keine Internetverbindung oder Proxy', 3000), cell('Internetverbindung pr\u00fcfen, ggf. npm-Proxy-Konfiguration', 3026)] }),
          new TableRow({ children: [cell('Port bereits belegt', 3000), cell('Anderer Prozess nutzt Port 5173/3001', 3000), cell('netstat -ano | findstr :5173 (Windows) um Prozess zu finden', 3026)] }),
        ]
      }),

      pageBreak(),

      // 6. Checkliste
      h1('6. Deployment-Checklisten'),

      h2('6.1 Checkliste Option A (Lokal)'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [800, 8226],
        rows: [
          new TableRow({ children: [headerCell('', 800), headerCell('Schritt', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Node.js v18+ auf Ziel-Computer installiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Git auf Ziel-Computer installiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Applikationsordner auf lokale Festplatte kopiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('npm install im Applikationsordner ausgef\u00fchrt (Internetverbindung)', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('npm run dev startet ohne Fehler', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('http://localhost:5173 im Browser \u00f6ffnet die Applikation', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Header zeigt gr\u00fcnen Punkt "Verbunden"', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Backup aus vorheriger Installation importiert (falls vorhanden)', 8226)] }),
        ]
      }),

      h2('6.2 Checkliste Option B (Server)'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [800, 8226],
        rows: [
          new TableRow({ children: [headerCell('', 800), headerCell('Schritt', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Node.js v18+ auf Server-Computer installiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Git auf Server-Computer installiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Applikationsordner auf Server-Festplatte kopiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('npm install auf Server ausgef\u00fchrt', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('vite.config.ts: host: true hinzugef\u00fcgt', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('server.ts: CORS origin angepasst', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Firewall-Regeln f\u00fcr Port 5173 und 3001 eingerichtet', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('npm run dev auf Server gestartet', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('IP-Adresse des Servers notiert', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Von einem Client-Computer: http://[SERVER-IP]:5173 \u00f6ffnet die Applikation', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Header zeigt gr\u00fcnen Punkt "Verbunden" auf allen Clients', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('\u00c4nderung auf Client A erscheint auf Client B (Echtzeit-Sync)', 8226)] }),
          new TableRow({ children: [cell('\u2610', 800), cell('Backup-Strategie definiert und erster Backup erstellt', 8226)] }),
        ]
      }),

      pageBreak(),

      // 7. Kontakt
      h1('7. Supportkontakt'),
      new Table({
        width: { size: 9026, type: WidthType.DXA }, columnWidths: [3000, 6026],
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
  fs.writeFileSync('./deployment_handbuch_v1.0.docx', buffer);
  console.log('deployment_handbuch_v1.0.docx erstellt');
});
