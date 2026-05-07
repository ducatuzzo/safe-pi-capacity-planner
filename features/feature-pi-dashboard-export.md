# Feature: PI Dashboard PDF/PNG-Export

## Ziel
Export des PI Dashboard-Tabs als PDF oder PNG mit Bundeslogo-Header und aktivem Filter-Label. Dient dazu, den Planungsstand für Confluence-Seiten oder Statusberichte zu dokumentieren.

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (09.04.2026, Benutzerdokumentation v1.4)
- [ ] Tests: offen (nicht automatisiert)

## Vorgänger / Abhängigkeit
- Feature 12 (Dashboard PDF/PNG-Export): gleiche Bibliotheken, gleiche Util-Funktionen, andere Quell-Komponente
- Feature: PI Dashboard Tab — PIDashboardView.tsx als Export-Container

## Akzeptanzkriterien

### Export-Buttons
- [x] «PDF»- und «PNG»-Buttons oben rechts im PI Dashboard-Tab sichtbar
- [x] Buttons während Export deaktiviert (Label: «Exportiere…»)
- [x] Bei Fehler: rote Fehlermeldung unter den Buttons

### Inhalt des Exports
- [x] Kopfbereich: Bundeslogo links, Titel «SAFe PI Capacity Planner – PI Dashboard» rechts
- [x] Aktives Filter-Label (z.B. «Team: ACM | PI: PI26-1» oder «Alle Daten»)
- [x] Auslastungslegende (grün/orange/rot mit Grenzwerten)
- [x] Alle sichtbaren PI-Sektionen mit allen Team-Tabellen
- [x] Druckoptimiert: weisser Hintergrund, keine Scrollbars

### Dateiname
- [x] PDF: `safe-pi-dashboard_YYYY-MM-DD.pdf`
- [x] PNG: `safe-pi-dashboard_YYYY-MM-DD.png`

## Technische Details

### Bibliotheken
| Library | Zweck |
|---------|-------|
| `jsPDF` | PDF-Generierung |
| `html2canvas` | DOM-Element zu Canvas rendern |

Beide bereits in `package.json` (dependencies), keine neuen Pakete.

### Komponenten und Dateien
| Datei | Änderung |
|-------|---------|
| `src/components/pidashboard/PIDashboardView.tsx` | Export-Buttons + Export-Container-ID |
| `src/utils/export-utils.ts` | Wiederverwendung von `exportToPDF()` / `exportToPNG()` aus Feature 12 |

### Export-Container
```tsx
<div id="pi-dashboard-export-container">
  {/* Header mit Logo + Titel + Filter-Label */}
  {/* Auslastungslegende */}
  {/* PI-Sektionen */}
</div>
```

### Export-Logik (identisch zu Feature 12)
```typescript
// Scale 2x für hohe Auflösung
const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
// PDF: canvas als Bild in jsPDF einbetten
// PNG: canvas.toBlob() → Download
```

### Unterschied zu Feature 12 (Dashboard-Export)
| Aspekt | Dashboard-Export (F12) | PI Dashboard-Export |
|--------|----------------------|---------------------|
| Container | `#export-container` | `#pi-dashboard-export-container` |
| Dateiname | `safe-pi-planner_*.pdf` | `safe-pi-dashboard_*.pdf` |
| Inhalt | KPI-Karten, BarChart, Absenz-Tabelle | PI-Tabellen mit Jira-Vergleich |

## Nicht in Scope
- Kein direkter Confluence-Upload (manueller Upload durch Benutzer)
- Kein separates Drucklayout via CSS `@media print`
