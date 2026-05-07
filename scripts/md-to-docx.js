// scripts/md-to-docx.js — Konvertiert Markdown nach DOCX (BIT-Stil)
// Aufruf:  node scripts/md-to-docx.js <input.md> <output.docx>
//
// Unterstützt: H1-H4, Listen (-, *, 1.), Tabellen (| ... |), Blockquotes (>),
//              Inline **bold**, *italic*, `code`, [link](url),
//              Code-Blocks (```), Horizontale Linien (---).
// Kein perfektes Word, aber funktional und CD-Bund-konform.

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat,
} = require('docx');

const BUND_BLAU = '003F7F';
const HELL_GRAU = 'F5F5F5';
const TEXT = '1A1A1A';
const FONT = 'Arial';

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const TABLE_WIDTH_DXA = 9360; // Letter mit 1" Margins

// ─── Inline-Parser (bold/italic/code/link → TextRun[]) ───────────────────────
function parseInline(text) {
  const runs = [];
  // Tokenize: erkennt **bold**, *italic*, `code`, [text](url) oder normalen Text
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, m.index), font: FONT, size: 22, color: TEXT }));
    }
    if (m[2] !== undefined) {        // **bold**
      runs.push(new TextRun({ text: m[2], bold: true, font: FONT, size: 22, color: TEXT }));
    } else if (m[3] !== undefined) { // `code`
      runs.push(new TextRun({ text: m[3], font: 'Courier New', size: 20, color: BUND_BLAU }));
    } else if (m[4] !== undefined) { // *italic*
      runs.push(new TextRun({ text: m[4], italics: true, font: FONT, size: 22, color: TEXT }));
    } else if (m[5] !== undefined) { // [text](url) → wir zeigen Text + URL in Klammern
      runs.push(new TextRun({ text: m[5], font: FONT, size: 22, color: BUND_BLAU, underline: {} }));
      runs.push(new TextRun({ text: ` (${m[6]})`, font: FONT, size: 18, color: '666666' }));
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), font: FONT, size: 22, color: TEXT }));
  }
  return runs;
}

// ─── Heading ─────────────────────────────────────────────────────────────────
function heading(level, text) {
  const sizes = { 1: 36, 2: 30, 3: 26, 4: 22 };
  const colors = { 1: BUND_BLAU, 2: BUND_BLAU, 3: BUND_BLAU, 4: TEXT };
  const headingLevels = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  };
  return new Paragraph({
    heading: headingLevels[level],
    spacing: { before: level === 1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: FONT, size: sizes[level], color: colors[level] })],
  });
}

// ─── Tabellen-Builder ────────────────────────────────────────────────────────
function buildCell(text, width, isHeader) {
  const shading = isHeader ? { fill: BUND_BLAU, type: ShadingType.CLEAR } : undefined;
  const color = isHeader ? 'FFFFFF' : TEXT;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: isHeader
        ? [new TextRun({ text: text.trim(), bold: true, font: FONT, size: 20, color })]
        : parseInline(text.trim()),
    })],
  });
}

function buildTable(rows) {
  // rows: array of arrays of strings; rows[0] = header
  const colCount = rows[0].length;
  const colWidth = Math.floor(TABLE_WIDTH_DXA / colCount);
  const columnWidths = Array(colCount).fill(colWidth);
  // Korrigiere letzte Spalte um Rundungsfehler
  columnWidths[colCount - 1] = TABLE_WIDTH_DXA - colWidth * (colCount - 1);

  return new Table({
    width: { size: TABLE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths,
    rows: rows.map((cells, rowIdx) => new TableRow({
      children: cells.map((c, colIdx) => buildCell(c, columnWidths[colIdx], rowIdx === 0)),
    })),
  });
}

// ─── Code-Block ──────────────────────────────────────────────────────────────
function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: HELL_GRAU, type: ShadingType.CLEAR },
    children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: TEXT })],
  }));
}

// ─── Markdown-Parser ─────────────────────────────────────────────────────────
function mdToBlocks(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code-Block
    if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      blocks.push(...codeBlock(codeLines));
      continue;
    }

    // Horizontale Linie
    if (/^---+\s*$/.test(line)) {
      blocks.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BUND_BLAU, space: 1 } },
        children: [new TextRun('')],
      }));
      i++;
      continue;
    }

    // Tabelle (Zeile beginnt mit | und nächste Zeile ist |---|...)
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s\-|:]+\|$/.test(lines[i + 1])) {
      const tableRows = [];
      // Header
      tableRows.push(line.split('|').slice(1, -1));
      i += 2; // Skip header + separator
      while (i < lines.length && lines[i].startsWith('|')) {
        tableRows.push(lines[i].split('|').slice(1, -1));
        i++;
      }
      blocks.push(buildTable(tableRows));
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      blocks.push(heading(hMatch[1].length, hMatch[2].trim()));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: BUND_BLAU, space: 12 } },
        children: parseInline(quoteLines.join(' ')),
      }));
      continue;
    }

    // Unsortierte Liste
    if (/^[-*]\s+/.test(line)) {
      blocks.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: parseInline(line.replace(/^[-*]\s+/, '')),
      }));
      i++;
      continue;
    }

    // Sortierte Liste
    if (/^\d+\.\s+/.test(line)) {
      blocks.push(new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: parseInline(line.replace(/^\d+\.\s+/, '')),
      }));
      i++;
      continue;
    }

    // Leere Zeile → kleiner Spacer
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Normaler Paragraph
    blocks.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      children: parseInline(line),
    }));
    i++;
  }

  return blocks;
}

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node md-to-docx.js <input.md> <output.docx>');
    process.exit(1);
  }

  const md = fs.readFileSync(inputPath, 'utf8');
  const blocks = mdToBlocks(md);

  const doc = new Document({
    creator: 'BIT SAFe PI Capacity Planner',
    title: path.basename(inputPath, '.md'),
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: TEXT } } },
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: 'numbers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: blocks,
    }],
  });

  Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ ${outputPath} erstellt (${(buffer.length / 1024).toFixed(1)} KB, ${blocks.length} Blocks)`);
  });
}

main();
