# PRD.md – Product Requirements Document: SAFe PI Capacity Planner

> **Führendes Dokument** für die Feature-Liste. Nummerierung ist verbindlich für STATUS.md, AI.md und features/.
> Zuletzt synchronisiert: 06.05.2026

## Ziel
Eine Fullstack-Webanwendung, die Teams bei BIT ermöglicht, ihre verfügbaren Story Points pro SAFe PI und Iteration zu berechnen. Jeder Mitarbeiter trägt seine Absenzen via Maus-Drag über einen Kalender ein. Das System berechnet automatisch die Kapazität unter Berücksichtigung von Feiertagen, Schulferien, FTE, Betriebsanteilen und Pauschalen. Das Dashboard zeigt Engpässe (Pikett-Lücken, Betrieb-Unterbesetzung) sofort an.

## Features (priorisiert, Nummerierung = verbindlich)

### Phase 1 — MVP (abgeschlossen)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 01 | Projektgerüst (React/Vite/Express/TS) | ✅ | feature-01-geruest.md |
| 02 | Typen & Datenmodell | ✅ | feature-02-typen.md |
| 03 | Mitarbeiterstamm (CRUD + CSV) | ✅ | feature-03-mitarbeiter.md |
| 04 | PI-Planung & Iterationen (CRUD + CSV + Validierung) | ✅ | feature-04-pi-planung.md |
| 05 | Feiertage / Schulferien / Blocker (CRUD + CSV) | ✅ | feature-05-kalender-daten.md |
| 06 | Kalender-Komponente (Grid, Farbcodes, Sticky, Legende) | ✅ | feature-06-kalender.md |
| 07 | Drag-Buchung (Interpolation) | ✅ | feature-07-drag-buchung.md |
| 08 | SP-Berechnung (pure functions, Kapazitäts-Tab, Seed-Daten) | ✅ | feature-08-sp-berechnung.md |
| 09 | Filter (Team, PI, Iteration, Jahr, Zeitraum) | ✅ | feature-09-filter.md |
| 10 | Dashboard (KPI-Karten, BarChart, Absenz-Tabelle, Lücken) | ✅ | feature-10-dashboard.md |
| 11 | Backup/Restore (JSON Export/Import, versioniert) | ✅ | — (kein Feature-File, nachzuholen) |
| 12 | PDF/PNG Export (für Confluence) | ✅ | feature-12-export.md |
| 13 | Corporate Design Bund (Farben, Schrift, Logo) | ✅ | feature-13-cd-bund.md |

### Phase 2 — Erweiterungen (abgeschlossen)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 14 | Team-Zielwerte konfigurierbar (Settings, CSV) | ✅ | — (Teil von phase-2-planung.md, archiviert) |
| 15 | Multiuser (Socket.io State-Sync, Row-Locking, Verbindungsindikator) | ✅ | feature-15-multiuser.md |
| 16 | Farbeinstellungen (Buchungstypen + Kalender, Color-Picker, CSV, Reset) | ✅ | feature-16-farbeinstellungen.md |
| 17 | Team-Konfiguration & Kapazitätsparameter (Pikett/Betrieb pro Team, Globale SP/Tag, PI Dashboard SP Netto vs. Jira) | ✅ | feature-17-team-config.md |

### Phase 3 — Mandatenfähigkeit (abgeschlossen)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 18 | Tenant-Model (Multi-Train, State-Isolation, Migration) | ✅ | feature-18-tenant-model.md |
| 19 | Admin-Bereich (Code-Isolation, OTP-Style, Rate-Limiting, Train-CRUD) | ✅ | feature-19-admin-bereich.md |

### Phase 4 — UX-Verfeinerung (implementiert, nicht deployed)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 20 | Mitarbeiterstamm-Filter (Textsuche, Team-Dropdown, Typ-Filter) | ✅ impl / ⏳ deploy | feature-20-mitarbeiter-filter.md |
| 21 | Settings-Scroll-to-Section (Sidebar-Klick → smooth scroll) | ✅ impl / ⏳ deploy | feature-21-settings-scroll.md |

### Phase 4b — CD Bund Vertiefung (implementiert, nicht deployed)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 23 | Swiss Design System CSS Alignment (BIT Skin: NotoSans, CSS-Vars, primary/secondary) | ✅ impl / ⏳ deploy | feature-23-swiss-ds-css-alignment.md |

### Phase 5 — Custom Types (geplant)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 22 | Custom Allocation Types (individuelle Buchungstypen pro Team, Kategorie-Zuordnung) | 🔲 geplant | feature-22-custom-allocation-types.md |

### Phase 5b — PI-Planung Vertiefung

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 29 | PI-Planung wochenbasiert + Zeremonien + Blocker-Wochen (.ics Export) | ✅ impl / ⏳ deploy | feature-29-pi-planung-v2.md |

### Phase 6+ — nach Pilotbetrieb (Roadmap)

| Nr. | Feature | Status | Feature-Datei |
|-----|---------|--------|---------------|
| 24 | TOTP 2FA (Google/MS Authenticator) | 🔲 Roadmap | — |
| 25 | aGov OIDC-Integration | 🔲 Roadmap | — |
| 26 | Jira REST API Integration (ersetzt manuelle SP-Eingabe) | 🔲 Roadmap | — |
| 27 | Mobile-Optimierung | 🔲 Roadmap | — |
| 28 | Audit-Log (Admin-Aktionen) | 🔲 Roadmap | — |
| 30 | Rollen (Admin, Planer, Read-Only) | 🔲 Roadmap | — |

### Eigenständige Features (ohne Phasen-Zuordnung)

| Feature | Status | Feature-Datei |
|---------|--------|---------------|
| PI Dashboard Tab (Jira-SP vs. App-SP, Farbcodierung) | ✅ | feature-pi-dashboard-tab.md |
| PI Dashboard PDF/PNG-Export (Bundeslogo-Header) | ✅ | — |
| Dokumentation-Download in Einstellungen (.docx) | ✅ | — |

## Out of Scope
- Mobile App (bis Phase 6+)
- SSO / Active Directory Integration (Phase 6+)
- SAP-Integration
- Automatische Feiertagsberechnung (wird manuell gepflegt)

## Erfolgskriterien

### MVP (Phase 1) — alle erfüllt ✅
- [x] Kapazitätsplanung für ein vollständiges PI in unter 30 Minuten
- [x] Story Point Berechnung stimmt mit manueller Excel-Rechnung überein
- [x] Pikett-Lücken werden im Dashboard rot markiert
- [x] Backup lässt sich vollständig wiederherstellen
- [x] CD Bund eingehalten (Farben, Schrift, Logo)

### Phase 2 — alle erfüllt ✅
- [x] Mindestbesetzungs-Parameter pro Team konfigurierbar (Feature 17)
- [x] SP/Tag und Std/Jahr global konfigurierbar (Feature 17)
- [x] Multiuser State-Sync funktional (Feature 15)
- [x] piTeamTargets server-seitig in AppData (nicht localStorage)

### Phase 3 — alle erfüllt ✅
- [x] Mehrere Trains (Tenants) isoliert verwaltbar (Feature 18)
- [x] Admin-Bereich mit Code-Schutz (Feature 19)

### Phase 5 — offen
- [ ] Custom Allocation Types mit Kategorie-Zuordnung (Feature 22)
- [ ] SP-Berechnung berücksichtigt Custom-Type-Kategorien korrekt

## Quelldateien
| Datei | Inhalt |
|-------|--------|
| `mitarbeiterstamm.csv` | Demo-Mitarbeiter, 4 Teams |
| `gesetzliche_feiertage.csv` | Feiertage |
| `schulferien.csv` | Schulferienperioden |
| `pi_planung_iterationen.csv` | PI-Planung |
| `blocker_spezielle_perioden.csv` | Blocker |
| `CD-Bund-Manual_deutsch.pdf` | Corporate Design Referenz |
| Ablage: `C:\Users\Davide\Documents\AI\` |  |
