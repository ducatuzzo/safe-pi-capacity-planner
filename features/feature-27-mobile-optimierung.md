# Feature 27 — Mobile-Optimierung (Responsive Read-Only)

> **Status:** geplant
> **PRD-Referenz:** Nr. 27
> **Geschätzter Aufwand:** 3–4 Tage (~20h)
> **Erstellt:** 10.06.2026
> **Aktualisiert:** 10.06.2026 — Scope auf Read-Only reduziert

## Ziel

Die App soll auf mobilen Geräten (iPhone 16, Samsung Galaxy S25 etc.) **lesbar** sein. Mobile-Nutzer können alle Daten einsehen (Kalender, Kapazität, Dashboards), aber **keine Änderungen** vornehmen. Bearbeitungen (Buchungen, Settings, Admin) bleiben Desktop-only.

Beim Aufruf der URL wird automatisch die passende Darstellung angezeigt — Desktop ab 768px Viewport-Breite, Mobile darunter. Kein App-Download, keine separate URL, rein CSS-basiert via Tailwind-Breakpoints.

## Nicht-Ziele

- Native App (iOS/Android)
- Offline-Fähigkeit (PWA/Service Worker)
- Bearbeitung auf Mobile (keine Buchungen, kein Drag & Drop, keine Settings-Änderungen)
- Admin-Zugang auf Mobile
- Touch-basiertes Drag & Drop
- PDF-Export auf Mobile

## Read-Only Konzept

### Was Mobile-Nutzer sehen und tun können

| Funktion | Mobile | Desktop |
|----------|--------|---------|
| Kalender anzeigen (Buchungen, Farbcodes) | Lesen | Lesen + Bearbeiten |
| Kapazitätstabelle einsehen | Lesen | Lesen |
| Dashboard (KPIs, Charts, Lücken) | Lesen | Lesen |
| PI Dashboard (SP-Vergleich) | Lesen | Lesen |
| Filter setzen (Team, PI, Iteration, Jahr) | Ja | Ja |
| Buchungen erstellen/ändern (Drag) | Nein | Ja |
| Einstellungen ändern | Nein | Ja |
| Admin-Bereich | Nein | Ja |
| PDF/PNG Export | Nein | Ja |
| Backup/Restore | Nein | Ja |

### Hinweis-Banner auf Mobile

Auf jeder Seite, die auf Desktop editierbar wäre, zeigt Mobile einen dezenten Banner:
> "Nur-Lese-Ansicht — Bearbeitung am Desktop"

Farbe: `bg-primary-50 text-primary-700 border-primary-200` (CD Bund konform, nicht alarmierend).

## Technischer Ansatz

### Device-Erkennung

**Rein CSS-basiert** via Tailwind-Breakpoints (`md:` = 768px). Keine JavaScript-Weiche, kein User-Agent-Sniffing. Viewport-Meta-Tag ist bereits vorhanden in `index.html`.

Einzige JS-Stelle: `useMediaQuery(768)` Hook für bedingtes Ausblenden von Interaktionselementen (Drag-Handler, Edit-Buttons) und Umschaltung auf mobile Kalender-Darstellung.

### Breakpoint-Strategie

| Breakpoint | Viewport | Zielgeräte |
|------------|----------|------------|
| Default (Mobile-first) | < 768px | iPhone 16 (393px), Galaxy S25 (412px) |
| `md:` | >= 768px | Tablets, kleine Laptops |
| `lg:` | >= 1024px | Desktop (Status quo) |

---

## Komponenten-Plan

### 1. Neuer Hook: `useMediaQuery.ts` — Basis

```ts
// ~10 Zeilen, kein npm-Paket
function useMediaQuery(minWidth: number): boolean
```

Liefert `true` wenn Viewport >= minWidth. Verwendet `window.matchMedia` mit Event-Listener. Wird in App.tsx als `isMobile` Prop durchgereicht oder via Context bereitgestellt.

**Geschätzter Aufwand:** 0.5h

### 2. Read-Only Banner — Basis

Neue Komponente `MobileReadOnlyBanner.tsx` (~15 Zeilen). Wird auf Mobile in Planung, Settings und Admin eingeblendet.

**Geschätzter Aufwand:** 0.5h

### 3. Header (`src/components/layout/Header.tsx`) — Klein

**Problem:** Logo + Titel + Tenant + Status-Indikator in einer Zeile, zu breit für 393px.

**Lösung:**
- Mobile: Logo verkleinern (`h-8` statt `h-14`), Untertitel "BIT" ausblenden (`hidden md:block`)
- Tenant-Name kompakter, Wechsel-Button ausblenden (`hidden md:flex`)
- Verbindungsindikator: nur Dot ohne Text (`hidden md:inline`)
- Padding reduzieren: `px-3 md:px-6`

**Geschätzter Aufwand:** 0.5h

### 4. TabNav (`src/components/layout/TabNav.tsx`) — Mittel

**Problem:** 6 Tabs horizontal, passt nicht auf < 768px.

**Lösung — Bottom-Tab-Bar (4 Tabs):**
- Mobile: Fixed Bottom-Bar mit 4 Icons: Planung (Calendar), Kapazität (BarChart3), Dashboard (LayoutDashboard), PI Dashboard (TrendingUp)
- Settings und Admin werden **ausgeblendet** (nicht erreichbar auf Mobile, da Read-Only)
- Desktop: Bestehende Top-Tabs unverändert (`hidden md:flex` / `flex md:hidden`)
- Icons: Bestehende Lucide-Icons

**Geschätzter Aufwand:** 2h

### 5. FilterBar (`src/components/layout/FilterBar.tsx`) — Mittel

**Problem:** Alle Filter nebeneinander in einer Zeile, kein Wrapping auf Mobile.

**Lösung:**
- Mobile: Kollabierbare Filter hinter einem "Filter"-Button mit Badge (Anzahl aktive Filter)
- Ausgeklappt: Filter vertikal gestapelt, volle Breite
- Team-Buttons: 2x2 Grid statt horizontal
- Datum-Inputs: `w-full` statt inline
- Desktop: Unverändert (bereits `flex-wrap`)

**Geschätzter Aufwand:** 2h

### 6. CalendarGrid — Read-Only Mobile (`src/components/calendar/CalendarGrid.tsx`) — Mittel

**Problem:** Horizontale Tabelle mit 32px-Zellen + 160px Mitarbeiter-Spalte. Mouse-only Drag & Drop.

**Lösung — Vereinfachtes Read-Only Grid:**
- **Kein separates `CalendarMobileView.tsx` nötig** (da keine Tap-Buchung)
- Bestehendes Grid wird horizontal scrollbar gemacht (ist es schon via `overflow-auto`)
- Drag-Handler werden auf Mobile deaktiviert (`onMouseDown` etc. nur wenn `!isMobile`)
- Undo/Redo Toolbar wird ausgeblendet (`hidden md:flex`)
- Mitarbeiter-Spalte bleibt sticky (funktioniert bereits)
- Zellen-Tooltip bleibt (Touch = Hover auf Mobile)
- Read-Only-Banner oberhalb des Grids

**Geschätzter Aufwand:** 2h

### 7. KapazitaetView (`src/components/capacity/KapazitaetView.tsx`) — Klein

**Lösung:**
- `overflow-x-auto` Wrapper (falls nicht schon vorhanden)
- Sticky erste Spalte (Mitarbeiter-Name)
- Padding responsive: `px-3 md:px-6`

**Geschätzter Aufwand:** 1h

### 8. DashboardView (`src/components/dashboard/`) — Mittel

**Lösung:**
- KPI-Karten: `grid-cols-2` statt `grid-cols-4` auf Mobile
- BarChart (Recharts): Prüfen ob `ResponsiveContainer` korrekt skaliert
- Absenz-Tabelle: `overflow-x-auto`
- Lücken-Liste: Bereits vertikal, nur Padding

**Geschätzter Aufwand:** 2h

### 9. PIDashboardView (`src/components/pidashboard/`) — Klein

**Lösung:**
- `overflow-x-auto` mit sticky erster Spalte
- Farbcodierung funktioniert unverändert

**Geschätzter Aufwand:** 1h

### 10. Settings & Admin — Ausblenden

**Lösung:**
- Tab wird in Mobile-Navigation nicht angezeigt
- Falls jemand direkt die URL aufruft (unwahrscheinlich, da SPA): Redirect auf Planung-Tab oder Read-Only-Hinweis
- Kein Aufwand für responsive Settings-Formulare nötig

**Geschätzter Aufwand:** 0.5h

### 11. TenantGate (`src/components/tenant/TenantGate.tsx`) — Klein

**Problem:** Train-Auswahl-Dialog muss auch auf Mobile funktionieren (Einstiegspunkt).

**Lösung:**
- Card: `max-w-[90vw] md:max-w-sm`
- Buttons: `w-full`
- Tenant-Erstellung ausblenden auf Mobile (Read-Only)

**Geschätzter Aufwand:** 0.5h

### 12. App.tsx — Rahmen

**Lösung:**
- Padding responsive: `p-3 md:p-6`
- `isMobile` Prop/Context bereitstellen
- Settings/Admin Tab auf Mobile blockieren

**Geschätzter Aufwand:** 1h

---

## Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/hooks/useMediaQuery.ts` | Breakpoint-Hook (< 768px = Mobile) |
| `src/components/layout/MobileReadOnlyBanner.tsx` | Dezenter Hinweis "Nur-Lese-Ansicht" |

## Bestehende Dateien (Änderungen)

| Datei | Art der Änderung |
|-------|------------------|
| `src/App.tsx` | Padding responsive, `isMobile` Gate für Tabs |
| `src/components/layout/Header.tsx` | Responsive Klassen |
| `src/components/layout/TabNav.tsx` | Bottom-Tab-Bar (4 Tabs), Icons |
| `src/components/layout/FilterBar.tsx` | Kollabierbare Filter |
| `src/components/calendar/CalendarGrid.tsx` | Drag-Handler deaktivieren, Undo-Toolbar ausblenden |
| `src/components/capacity/KapazitaetView.tsx` | `overflow-x-auto` |
| `src/components/dashboard/DashboardView.tsx` | Grid-Cols responsive |
| `src/components/dashboard/KPICards.tsx` | 2-Spalten Grid Mobile |
| `src/components/pidashboard/PIDashboardTable.tsx` | `overflow-x-auto` |
| `src/components/tenant/TenantGate.tsx` | Card-Breite responsive |

## Keine neuen npm-Pakete nötig

- Tailwind-Breakpoints: bereits eingebaut
- Lucide-Icons: bereits im Projekt
- `useMediaQuery`: ~10 Zeilen Custom-Hook

## Teststrategie

### Geräte-Simulation (Chrome DevTools)

| Gerät | Viewport | Zu prüfen |
|-------|----------|-----------|
| iPhone 16 | 393 x 852 | Alle 4 Mobile-Tabs lesbar |
| Samsung Galaxy S25 | 412 x 915 | Alle 4 Mobile-Tabs lesbar |
| iPad (Tablet) | 768 x 1024 | Breakpoint-Übergang, Desktop-Modus |
| Desktop | 1440 x 900 | Keine Regression |

### Akzeptanzkriterien

- [ ] 4 Tabs (Planung, Kapazität, Dashboard, PI Dashboard) sind auf iPhone 16 erreichbar und lesbar
- [ ] Settings und Admin sind auf Mobile nicht erreichbar
- [ ] Kalender zeigt Buchungen korrekt an (Farbcodes, Legende)
- [ ] Kalender ist horizontal scrollbar, keine Buchungs-Interaktion
- [ ] Read-Only-Banner erscheint auf Planung-Tab (Mobile)
- [ ] Filter sind auf Mobile bedienbar (kollabiert/expandiert)
- [ ] KPI-Dashboard Karten sind 2-spaltig und vollständig sichtbar
- [ ] Tabellen scrollen horizontal ohne Layout-Bruch
- [ ] TenantGate (Train-Auswahl) funktioniert auf Mobile
- [ ] Desktop-Ansicht ist unverändert (keine Regression)
- [ ] Kein horizontaler Overflow auf Body-Ebene

## Implementierungsreihenfolge

| Phase | Komponenten | Aufwand |
|-------|-------------|---------|
| **Phase A** | `useMediaQuery`, `MobileReadOnlyBanner`, App.tsx, Header, TabNav (Bottom-Bar) | 5h |
| **Phase B** | FilterBar (kollabierbar), TenantGate | 2.5h |
| **Phase C** | CalendarGrid (Drag deaktivieren, responsive Scroll) | 2h |
| **Phase D** | Dashboard, KPICards, PI Dashboard, KapazitaetView | 4h |
| **Phase E** | Settings/Admin Gate, Gesamt-QA auf 4 Viewports | 2h |
| **Gesamt** | | **~16h (2.5–3 Tage)** |

## Vorteile des Read-Only Ansatzes

1. **~55% weniger Aufwand** gegenüber Stufe B (20h statt 36h)
2. **Keine CalendarMobileView nötig** — kein Tap-Buchungs-UI, kein Touch-Event-Handling
3. **Keine Settings-Formulare responsive machen** — komplett ausgeblendet
4. **Geringeres Regressionsrisiko** — Drag & Drop Code bleibt unverändert
5. **Sinnvoll für den Use-Case:** Mobile-Nutzer wollen typischerweise den Stand checken (Kapazität, Lücken, Auslastung), nicht Buchungen am Handy machen

## Risiken

1. **Recharts auf < 393px:** Achsenbeschriftungen könnten abgeschnitten werden — muss getestet werden.
2. **Kalender-Grid Scroll auf Touch:** `overflow-auto` funktioniert auf iOS Safari manchmal hakelig — ggf. `-webkit-overflow-scrolling: touch` nötig.
3. **Bottom-Tab-Bar überlappt Content:** Braucht `pb-16` (Padding-Bottom) auf dem Main-Content, damit nichts verdeckt wird.
