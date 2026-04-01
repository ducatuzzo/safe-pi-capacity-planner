# Feature 09: Filter

## Ziel
Durchgehende Filterleiste die in allen drei Tabs (Planung, Kapazität, Dashboard) gleichzeitig wirkt. Filter werden im globalen State gehalten — Wechsel zwischen Tabs verliert die Filterauswahl nicht.

## Akzeptanzkriterien
- [ ] Filterleiste sichtbar in allen drei Tabs (Planung / Kapazität / Dashboard)
- [ ] Filter: **Team** (Dropdown, Mehrfachauswahl, "Alle Teams" als Default)
- [ ] Filter: **PI** (Dropdown, Einzelauswahl, zeigt PI-Namen, "Alle PIs" als Default)
- [ ] Filter: **Iteration** (Dropdown, abhängig vom gewählten PI, "Alle Iterationen" als Default)
- [ ] Filter: **Jahr** (Dropdown, aus PI-Daten abgeleitet, "Alle Jahre" als Default)
- [ ] Filter: **Zeitraum** (Datumsbereich, von/bis, optional)
- [ ] "Filter zurücksetzen" Button
- [ ] Filter-State global (nicht pro Tab) — Tab-Wechsel behält Filter
- [ ] Planung-Tab: zeigt nur gefilterte Mitarbeiter / gefilterten Zeitraum
- [ ] Kapazität-Tab: berechnet SP nur für gefilterten Zeitraum / gefilterte Teams
- [ ] Alle Filter sofort wirksam (kein "Anwenden"-Button nötig)

## Technische Details
- Filter-State in `App.tsx` als eigenes Interface:
```typescript
interface FilterState {
  teams: string[];          // leer = alle Teams
  piId: string | null;      // null = alle PIs
  iterationId: string | null;
  year: number | null;
  dateFrom: string | null;  // YYYY-MM-DD
  dateTo: string | null;    // YYYY-MM-DD
}
```
- Komponente: `src/components/layout/FilterBar.tsx`
- FilterBar wird in App.tsx über den Tab-Content gerendert (immer sichtbar)
- Iteration-Dropdown deaktiviert wenn kein PI gewählt
- Jahr wird aus pis[] abgeleitet (unique Jahre aus startStr/endStr)
- Zeitraum-Filter überschreibt PI/Iteration-Filter wenn gesetzt

## Abhängigkeiten
- Feature 03: employees[] (für Team-Filter)
- Feature 04: pis[] mit iterationen[] (für PI/Iterations-Filter)
- Feature 06/07: CalendarGrid muss filtered employees + dateRange akzeptieren
- Feature 08: KapazitaetView muss filtered employees + dateRange akzeptieren

## Status
- [ ] Design: offen
- [ ] Implementierung: offen
- [ ] Tests: offen

## Session-Typ: IMPL
