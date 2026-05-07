const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Farben ────────────────────────────────────────────────────────────────
const BUND_BLAU  = "003F7F";
const BUND_ROT   = "E63312";
const GRAU_HELL  = "F5F5F5";
const GRAU_MED   = "D5D5D5";
const WEISS      = "FFFFFF";
const SCHWARZ    = "1A1A1A";
const BLAU_HELL  = "E8EFF7";

// ─── Hilfsfunktionen ───────────────────────────────────────────────────────
const border1 = { style: BorderStyle.SINGLE, size: 1, color: GRAU_MED };
const allBorders = { top: border1, bottom: border1, left: border1, right: border1 };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, color: BUND_BLAU, font: "Arial" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: BUND_BLAU, font: "Arial" })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: SCHWARZ, font: "Arial" })],
  });
}
function p(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: SCHWARZ, font: "Arial" })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: SCHWARZ, font: "Arial" })],
  });
}
function spacer(pts = 160) {
  return new Paragraph({ spacing: { before: pts, after: 0 }, children: [new TextRun("")] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BUND_BLAU, space: 1 } },
    children: [new TextRun("")],
  });
}

// ARCHIVIERT: Dieses Script generierte Lastenheft v1.0
// Abgeloest durch lastenheft_v2 (April 2026)
// Behalten fuer historische Referenz
