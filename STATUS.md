# STATUS.md – Stand: 15.04.2026 (zuletzt aktualisiert: 15.04.2026)

## Projektstatus
✅ Features 01–21 abgeschlossen, Build grün. App produktionsbereit.
- Mandatenfähigkeit (Demo-Train, Admin-Code 000815) implementiert.
- Feature 20 (Mitarbeiterstamm-Filter) + Feature 21 (Settings-Scroll) implementiert, noch nicht deployed.

## Abgeschlossene Features
- Feature 01: Projektgerüst ✅
- Feature 02: Typen & Datenmodell ✅
- Feature 03: Mitarbeiterstamm (CRUD + CSV) ✅
- Feature 04: PI-Planung & Iterationen (CRUD + CSV + Validierung) ✅
- Feature 05: Feiertage / Schulferien / Blocker (CRUD + CSV) ✅
- Feature 06: Kalender-Komponente (Grid, Farbcodes, Sticky, Legende) ✅
- Feature 07: Drag-Buchung (Interpolation) ✅
- Feature 08: SP-Berechnung (pure functions, Kapazitäts-Tab, Seed-Daten) ✅
- Feature 09: Filter (Team, PI, Iteration, Jahr, Zeitraum – durchgehend) ✅
- Feature 10: Dashboard (KPI-Karten, BarChart, Absenz-Tabelle, Lücken) ✅
- Feature 11: Backup/Restore (JSON Export/Import, versioniert) ✅
- Feature 12: PDF/PNG Export (für Confluence) ✅
- Feature 13: CD Bund (Farben, Schrift, Logo) ✅
- Feature 14: Team-Zielwerte konfigurierbar (Settings, CSV Import/Export) ✅
- Feature 15: Multiuser (Socket.io State-Sync, Row-Locking, Verbindungsindikator) ✅
- Feature 16: Farbeinstellungen (Buchungstypen + Kalender, Color-Picker, CSV, Reset) ✅
- Feature 17: Team-Konfiguration & Kapazitätsparameter ✅
  - Subtab Team-Konfiguration (Min. Pikett, Min. Betrieb, SP/Tag, Std/Jahr, CSV) ✅
  - Subtab Globale Parameter (SP/Tag, Std/Jahr) ✅
  - Lücken-Erkennung mit konfigurierten Werten (nicht mehr hardcodiert) ✅
  - Betrieb-Lücke ignoriert WE + gesetzliche Feiertage ✅
  - Pikett-Lücke gilt 7 Tage/Woche ✅
  - PI Dashboard: SP Netto (berechnet) vs. SP Jira (editierbar PO), Delta ✅
  - piTeamTargets in AppData (Backup/Restore + Socket.io-fähig) ✅
- Feature 18: Tenant-Model (Mandatenfähigkeit Phase 1) ✅
  - Backend: server/tenant-manager.ts, state_{tenantId}.json, tenants.json Registry
  - Backend: REST /api/tenants/* + Socket.io Room-Isolation pro Tenant
  - Frontend: TenantGate (Splash/Train-Auswahl), useTenant Hook
  - Frontend: Header zeigt Train-Name, "Train wechseln"-Button
  - Rückwärtskompatibilität: Legacy /api/state → Default-Tenant ✅
  - Migration: state.json → state_default.json beim ersten Start ✅
- Feature 19: Admin-Bereich mit Code-Isolation (Mandatenfähigkeit Phase 2) ✅
  - Frontend: AdminGate (6-stelliger OTP-Style Code-Dialog, 15min Cache)
  - Frontend: AdminView (Reset, Tenant-Verwaltung, Code-Änderung)
  - Backend: /api/tenants/:id/reset, PATCH /api/tenants/:id ✅
  - Rate-Limiting: max. 3 Fehlversuche, dann 60s gesperrt ✅
- Feature 20: Mitarbeiterstamm-Filter ✅
  - Textsuche (Vorname/Name), Team-Multi-Dropdown mit Click-Outside, Typ-Filter (iMA/eMA)
  - Zähler: "{gefiltert} von {total} Mitarbeiter", Reset-Link
  - CSV-Export + "Alle löschen" operieren auf vollständigem Datensatz (kein Datenverlust)
- Feature 21: Settings-Scroll-to-Section ✅
  - Klick auf Feiertage/Schulferien/Blocker in Sidebar → smooth scroll zur Sektion
  - KalenderDatenSettings: Refs + useEffect + scrollToSection-Prop
- Feature PI-Dashboard-Tab: PI Dashboard Tab (Jira-SP vs. App-SP, Farbcodierung) ✅
- Feature PI-Dashboard-Export: PDF/PNG-Export im PI Dashboard Tab (Bundeslogo-Header) ✅
- Feature Dokumentation-Download: Handbücher als .docx in Einstellungen → Dokumentation ✅

## Behobene Bugs & Fixes
- BUG-01: Drag-Interpolation ✅
- BUG-02: CalendarHeader crash ohne Iterationen ✅
- BUG-03: SEED_BLOCKER fehlte in App.tsx ✅
- BUG-04: Persistenter Server-State (JSON-File, Railway-Ready) ✅
- BUG-05: app.options Wildcard-Route entfernt — CORS-Middleware deckt ab ✅
- FIX-01: Blocker ❄️ im Datums-Header ✅
- FIX-02: Farbcodes Buchungstypen korrigiert ✅
- FIX-03: Legendenbuchstaben in Kalender-Zellen (F/A/T/M/I/B/BP/P) ✅
- FIX-04: Logo ersetzt durch Logo_RGB_farbig_negativ.svg ✅
- FIX-05: Header vergrössert (Logo h-14, Titel text-xl, Padding py-4) ✅
- FIX-06: globalConfig/teamConfigs/piTeamTargets nicht persistiert (state-manager) ✅
- FIX-07: TeamZielwerte + TeamConfig zusammengeführt (eine Seite, kein Duplikat) ✅
- FIX-08: Backup-Validierung blockierte Backups ohne teamZielwerte-Feld ✅
- FIX-09: piTeamTargets fehlte im Backup-Export ✅
- FIX-10: Echte Namen aus AI.md entfernt → MA-ACM-01 etc. ✅
- FIX-11: «Alle Buchungen löschen»-Button aus Planungs-Tab entfernt ✅
- FIX-12: AdminGate «Abbrechen»-Button ohne Funktion ✅
- FIX-13: AdminGate «Abbrechen» löschte sessionStorage-Code unzuverlässig ✅
- FIX-14: Train-Wechsel liess Admin-Code-Cache aktiv ✅
- FIX-15: AdminGate als fixed Modal blockierte UI nach Tab-Wechsel ✅
- FIX-16: Train löschen fehlte — DELETE-Endpoint + UI ✅ **getestet ✅**

## Dokumentation (muss bei Änderungen nachgeführt werden)
- Installationshandbuch: docs/installationshandbuch_v1.0.md ✅
- Benutzerdokumentation: docs/benutzerdokumentation_v1.7.md ✅ (Stand 14.04.2026)
- Deployment-Handbuch: docs/deployment_handbuch_v1.0.md ✅
- CLAUDE.md: Technischer Kompass für Claude Sessions ✅

## Offene Punkte (Roadmap)

### Nächste Features (priorisiert)
- Feature 22: Custom Allocation Types — individuelle Buchungstypen pro Team (Kürzel, Bezeichnung, Farbe)
- Feature 23: Kategorie-Zuordnung — Custom-Buchungstypen einer SP-Berechnungskategorie zuordnen (Betrieb/Pikett/Abzug/neutral)

### Phase 3+ (nach Pilotbetrieb)
- Feature 24: TOTP 2FA (Google/MS Authenticator)
- Feature 25: aGov OIDC-Integration — separates Projekt, BIT-interne Abklärung nötig
- Jira REST API Integration (ersetzt manuelle SP-Eingabe im PI Dashboard)
- Mobile-Optimierung
- Audit-Log (Admin-Aktionen)
- Rollen (Admin, Planer, Read-Only)

## Vercel Deployment
- Status: ✅ Live
- URL: https://safe-pi-capacity-planner.vercel.app
- GitHub: ducatuzzo/safe-pi-capacity-planner (Branch: master)
- Root Directory in Vercel: `safe-pi-capacity-planner`
- Build Command: `npx vite build`
- Output Directory: `dist`
- Auto-Deploy bei Push auf master-Branch
- Letztes erfolgreiches Deploy: 14.04.2026

## Projektpfad
- Context Engineering: `C:\Users\Davide\Documents\AI\safe-pi-planner\`
- App-Code: `C:\Users\Davide\Documents\AI\safe-pi-planner\safe-pi-capacity-planner\`
- Dokumentation: `C:\Users\Davide\Documents\AI\safe-pi-planner\docs\`
- Starten: `npm run dev` im App-Code Verzeichnis
