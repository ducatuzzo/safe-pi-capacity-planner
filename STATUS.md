# STATUS.md – Stand: 22.04.2026

> Feature-Nummerierung folgt PRD.md (verbindlich). Dieses Dokument trackt nur den Implementierungsstatus.

## Projektstatus
✅ Features 01–21 abgeschlossen, Build grün, **auf Vercel deployed** (Commit `1ee0095`).
✅ Feature 23 (Swiss DS CSS Alignment / BIT Skin) implementiert, Build grün, ⏳ deploy ausstehend.
- Mandatenfähigkeit aktiv (Demo-Train, Admin-Code 000815).

## Abgeschlossene Features

### Phase 1 — MVP
| Nr. | Feature | Status |
|-----|---------|--------|
| 01 | Projektgerüst | ✅ deployed |
| 02 | Typen & Datenmodell | ✅ deployed |
| 03 | Mitarbeiterstamm (CRUD + CSV) | ✅ deployed |
| 04 | PI-Planung & Iterationen | ✅ deployed |
| 05 | Feiertage / Schulferien / Blocker | ✅ deployed |
| 06 | Kalender-Komponente | ✅ deployed |
| 07 | Drag-Buchung | ✅ deployed |
| 08 | SP-Berechnung | ✅ deployed |
| 09 | Filter | ✅ deployed |
| 10 | Dashboard | ✅ deployed |
| 11 | Backup/Restore | ✅ deployed |
| 12 | PDF/PNG Export | ✅ deployed |
| 13 | Corporate Design Bund | ✅ deployed |

### Phase 2 — Erweiterungen
| Nr. | Feature | Status |
|-----|---------|--------|
| 14 | Team-Zielwerte | ✅ deployed |
| 15 | Multiuser (Socket.io) | ✅ deployed |
| 16 | Farbeinstellungen | ✅ deployed |
| 17 | Team-Konfiguration & Kapazitätsparameter | ✅ deployed |

### Phase 3 — Mandatenfähigkeit
| Nr. | Feature | Status |
|-----|---------|--------|
| 18 | Tenant-Model | ✅ deployed |
| 19 | Admin-Bereich | ✅ deployed |

### Phase 4 — UX-Verfeinerung
| Nr. | Feature | Status |
|-----|---------|--------|
| 20 | Mitarbeiterstamm-Filter | ✅ deployed |
| 21 | Settings-Scroll-to-Section | ✅ deployed |

### Phase 4b — CD Bund Vertiefung
| Nr. | Feature | Status |
|-----|---------|--------|
| 23 | Swiss Design System CSS Alignment (BIT Skin) | ✅ impl / ⏳ deploy |

### Eigenständige Features
| Feature | Status |
|---------|--------|
| PI Dashboard Tab | ✅ deployed |
| PI Dashboard PDF/PNG-Export | ✅ deployed |
| Dokumentation-Download (.docx) | ✅ deployed |

## Behobene Bugs & Fixes
- BUG-01: Drag-Interpolation ✅
- BUG-02: CalendarHeader crash ohne Iterationen ✅
- BUG-03: SEED_BLOCKER fehlte in App.tsx ✅
- BUG-04: Persistenter Server-State (JSON-File, Railway-Ready) ✅
- BUG-05: app.options Wildcard-Route entfernt ✅
- FIX-01 bis FIX-16: siehe decisions/log.md für Details

## Dokumentation
| Dokument | Datei | Stand |
|----------|-------|-------|
| Installationshandbuch | docs/installationshandbuch_v1.0.md | ✅ |
| Benutzerdokumentation | docs/benutzerdokumentation_v1.7.md | ✅ 14.04.2026 |
| Deployment-Handbuch | docs/deployment_handbuch_v1.0.md | ✅ |
| CLAUDE.md | CLAUDE.md | ✅ 16.04.2026 |

## Zuletzt erledigt (Session 22.04.2026)
- Feature 23 (Swiss DS CSS Alignment / BIT Skin) implementiert
- NotoSans Font als Frutiger-Fallback eingebunden (4 TTF-Dateien selbst-gehostet)
- BIT-Skin CSS-Variablen-Schema (`--color-primary-*` / `--color-secondary-*`) eingeführt
- Tailwind-Config auf `var(--color-*)` umgestellt, `bund-*`-Aliase erhalten (Option A)
- 11 hardcoded Hex-Treffer im JSX auf `text-primary-700` / `bg-primary-700` ersetzt
- TEAM_COLORS in `constants.ts` als single source of truth (`TEAM_COLORS_HEX`)
- AbsenzTabelle: 6 hardcoded `text-[#…]` auf `text-buchung-*` Tokens migriert (1:1, kein optischer Unterschied)
- PRD.md Phase 6+ Roadmap-Features renumbered (23→24, 24→25, 25→26, 26→27, 27→28, 28→29)

## Zuletzt erledigt (Session 16.04.2026)
- Dokumenten-Synchronisation: PRD.md, STATUS.md, CLAUDE.md, decisions/log.md
- Nummern-Drift bereinigt
- Veraltete Referenzen (localStorage für piTeamTargets) korrigiert
- phase-2-planung.md archiviert

## Aktuell in Arbeit
- Feature 22: Custom Allocation Types — Datenmodell-Review ausstehend

## Abgebrochene Sessions
- **Paket 7 IMPL am 2026-04-24 abgebrochen – Architektur-Spec fehlt.** Kein Dokument mit dem Bezeichner "Paket 7" in features/, prompts/ oder anderen Verzeichnissen gefunden. Projekt nutzt Feature-basierte Nummerierung (01–23), kein Paket-Schema. Vor Implementierung muss eine Architektur-Spec erstellt werden (features/paket-7-settings.md oder äquivalent).

## Nächste Schritte (priorisiert)
1. Feature 22: Custom Allocation Types — Datenmodell-Review vor Implementierung
2. Recovery-Protokoll für Feature 22 schreiben (Breaking Change: allocations-Typ)

## Bekannte Risiken
- **JSON-Persistenz ohne Locking:** Bei gleichzeitigen Schreibzugriffen via Socket.io kann ein Race Condition auftreten. Für aktuelle Nutzerzahl (< 10 gleichzeitig) akzeptiert.
- **Kein Unit-Test-Coverage:** SP-Berechnungsfunktionen (pure functions) sind ungetestet. Vor Feature 22 kritisch.
- **Backup-Schema nicht versioniert:** Datenmodell-Erweiterung (Custom Types) erfordert Schema-Migration für bestehende Backups.

## Vercel Deployment
- Status: ✅ Live (Stand: 18.04.2026, Features 01–21, Commit `1ee0095`)
- URL: https://safe-pi-capacity-planner.vercel.app
- GitHub: ducatuzzo/safe-pi-capacity-planner (Branch: master)
- Root Directory: `safe-pi-capacity-planner`
- Build Command: `npx vite build`
- Output Directory: `dist`

## Projektpfad
- Context Engineering: `C:\Users\Davide\Documents\AI\safe-pi-planner\`
- App-Code: `C:\Users\Davide\Documents\AI\safe-pi-planner\safe-pi-capacity-planner\`
- Dokumentation: `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
