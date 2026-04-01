# Feature 12: PDF/PNG Export

## Ziel
Export der aktuellen Dashboard/Kalender-Ansicht als PDF oder PNG für Confluence. Exportiert was der User gerade sieht — mit aktivem Filter.

## Akzeptanzkriterien
- [ ] "Export" Button im Dashboard-Tab sichtbar
- [ ] PDF-Export: Aktuelle Dashboard-Ansicht als PDF (jsPDF + html2canvas)
- [ ] PNG-Export: Aktuelle Dashboard-Ansicht als Bild
- [ ] Dateiname: `safe-pi-planner_YYYY-MM-DD.pdf` / `.png`
- [ ] Export enthält: KPI-Karten, BarChart, Absenz-Tabelle, Lücken-Liste
- [ ] Export enthält aktiven Filter als Titel/Untertitel
- [ ] Bundeslogo oben links im Export
- [ ] Druckoptimiert: weisser Hintergrund, keine Scrollbars

## Technische Details
- Bibliotheken: `jsPDF` + `html2canvas` (bereits in package.json)
- Komponente: Export-Button in `DashboardView.tsx`
- Util: `src/utils/export-utils.ts`
  - `exportToPDF(elementId, filename)` 
  - `exportToPNG(elementId, filename)`
- Export-Container: `<div id="export-container">` um den exportierbaren Bereich
- html2canvas rendert den Container → jsPDF bettet das Bild ein
- Scale: 2x für hohe Auflösung

## Abhängigkeiten
- Feature 10: DashboardView.tsx

## Status
- [x] Design: erledigt
- [x] Implementierung: erledigt
- [x] Tests: manuell ok (TypeScript kompiliert fehlerfrei)

## Session-Typ: IMPL
