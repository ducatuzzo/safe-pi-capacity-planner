# decisions/log.md – Entscheidungslog

> Einträge chronologisch, neue Einträge am Ende. Dieses Dokument ist die verbindliche Referenz für alle Architektur- und Designentscheidungen.

## 2026-03-27: Neuaufbau statt Refactoring
**Entscheidung:** Bestehende App (download_safe-pi-capacity-planner) wird nicht refactored, sondern neu aufgebaut.
**Grund:** Strukturelle Mängel – keine Iterationen pro PI, unvollständige SP-Berechnung, kein CD Bund, Gemini-generierter Code ohne klare Architektur.

## 2026-03-27: Context Engineering vor Code
**Entscheidung:** Vollständige AI.md, PRD.md, STATUS.md und Feature-Dateien bevor eine Zeile Code geschrieben wird.
**Grund:** Gemäss Context Engineering Guide – verhindert Context Rot bei langen Sessions.

## 2026-03-27: JSON als Backup-Format
**Entscheidung:** Backup/Restore verwendet versioniertes JSON (nicht CSV).
**Grund:** JSON erhält die komplette Datenstruktur inkl. Iterationen und Allokationen.
**Für Konfigurationsdaten** (Feiertage, Schulferien, Mitarbeiter): weiterhin CSV-Import/Export.

## 2026-03-27: Iterationen als eigenes Objekt
**Entscheidung:** Iterationen werden als eigenes Interface in PIPlanning eingebettet.
**Grund:** Ein PI ohne seine Iterationen ist unvollständig. Atomare Speicherung verhindert inkonsistente Zustände.

## 2026-03-27: Keine externe Datenbank
**Entscheidung:** Alle Daten werden im Frontend-State gehalten und per JSON-File gesichert.
**Grund:** Einfacheres Deployment (nur npm, kein DB-Setup).
**Risiko:** Kein Locking bei konkurrierenden Schreibzugriffen. Akzeptiert für aktuelle Nutzerzahl.

## 2026-03-27: Port-Konfiguration
**Entscheidung:** Frontend auf 5173, Backend auf 3001.
**Grund:** Vite-Standard, kein Konflikt mit anderen lokalen Services bei BIT.

## 2026-03-27: Blocker vs. Feiertage – Semantik
**Entscheidung:** Blocker/Spezielle Perioden sind KEINE Absenzen.
**Grund:** Ein Freeze-Tag ist ein Arbeitstag – er blockiert Deployments, nicht die Kapazität.
SP-Berechnung: Blocker-Tage zählen als normale Arbeitstage (kein SP-Abzug).

## 2026-03-27: Datenfehler in mitarbeiterstamm.csv – Behandlung
**Entscheidung:** Ungültige Zeilen werden beim Import NICHT stillschweigend korrigiert.
**Verhalten:** Import zeigt Warnung pro fehlerhafter Zeile, betroffene Mitarbeiter werden trotzdem importiert mit Originalwerten, aber in der UI rot markiert.

## 2026-03-28: FIX-02 – Farbcodes Buchungstypen korrigiert
**Entscheidung:** Farbcodes gemäss Legende (Screenshot 28.03.2026) korrigiert.
| Typ | Alt | Neu |
|-----|-----|-----|
| FERIEN | #60A5FA Hellblau | #FB923C Orange |
| ABWESEND | #FB923C Orange | #6B7280 Dunkelgrau |
| BETRIEB | #F87171 Rot | #60A5FA Hellblau |
| BETRIEB_PIKETT | #DC2626 Dunkelrot | #7C3AED Violett |
**Datei:** constants.ts

## 2026-03-28: FIX-03 – Legendenbuchstaben in Kalender-Zellen
**Entscheidung:** Gebuchte Zellen zeigen Buchstaben gemäss Legende: F/A/T/M/I/B/BP/P.
**Grund:** Bessere Lesbarkeit bei kleinen Zellen (32px), Farbe allein reicht nicht.

## 2026-03-28: FIX-04 – Logo ersetzt durch SVG
**Entscheidung:** bundeslogo.png ersetzt durch Logo_RGB_farbig_negativ.svg
**Grund:** SVG (weisser Text auf transparent) ist auf blauem Header deutlich besser lesbar.

## 2026-03-28: FIX-05 – Header vergrössert
**Änderungen:** Logo h-10→h-14, Titel text-lg→text-xl, Padding py-3→py-4

## 2026-03-28: Feature 15 – Multiuser abgeschlossen
**Entscheidung:** Socket.io State-Sync vollständig implementiert.
- Server ist Source of Truth (state-manager.ts, in-memory)
- REST GET /api/state für initialen Load
- Socket.io Events: allocation:change, settings:change, lock:row, unlock:row
- Verbindungsindikator im Header (grün/rot)

## 2026-03-28: Regel – Dokumentation immer nachführen
**Entscheidung:** Installationshandbuch und Benutzerdokumentation müssen bei jeder relevanten Änderung nachgeführt werden.
**Ablageort:** `docs/`

## 2026-04-01: PI Dashboard Tab – zwei SP-Spalten
**Entscheidung:** Zwei verschiedene SP-Berechnungen nebeneinander:
1. **Berechnet SP** (theoretisch): Betriebstage × SP-Rate ohne tagsgenaue Buchungen
2. **Verfügbar SP Netto** (tagesgenau): aus sp-calculator.ts mit allen Buchungen
**Auslastung Jira %** vergleicht Jira-Commitments gegen tagesgenaue Kapazität.

## 2026-04-07: Feature 17 – SP/Tag global statt pro Team
**Entscheidung:** SP/Tag und Std/Jahr sind globale Parameter (GlobalCapacityConfig), nicht pro Team konfigurierbar.
**Grund:** Organisationsweiter Standard ist einheitlich; individuelle Abweichungen werden über FTE-Faktor und Employee.storyPointsPerDay abgebildet.

## 2026-04-07: Feature 17 – Betrieb-Lücke ignoriert WE + gesetzliche Feiertage
**Entscheidung:** Betrieb-Lücken-Erkennung prüft nur Arbeitstage (kein Wochenende, kein gesetzlicher Feiertag).
**Grund:** Betriebsaufgaben fallen am Wochenende und an Feiertagen nicht an.
**Pikett:** gilt 7 Tage/Woche, auch Feiertage – immer prüfen.

## 2026-04-07: Feature 17 – piTeamTargets in AppData (nicht localStorage)
**Entscheidung:** SP-Jira-Werte (PO-Eingabe) werden in AppData.piTeamTargets gespeichert, nicht in localStorage.
**Grund:** Konsistenz mit Backup/Restore und Multiuser-State-Sync via Socket.io.
**Migration:** Bestehende localStorage-Werte beim ersten Load in AppData überführen, localStorage dann leeren.
**Ersetzt:** Frühere Entscheidung (PI Dashboard Tab) die localStorage vorsah.

## 2026-04-10: Feature 18 – Tenant-Model (Mandatenfähigkeit Phase 1)
**Entscheidung:** Multi-Train-Architektur über Tenant-Isolation im Backend.
**Architektur:**
- Backend: `server/tenant-manager.ts` verwaltet `state_{tenantId}.json` pro Train
- `tenants.json` als Registry aller Trains
- REST `/api/tenants/*` + Socket.io Room-Isolation pro Tenant
- Frontend: `TenantGate` (Splash/Train-Auswahl), `useTenant` Hook
- Header zeigt Train-Name + "Train wechseln"-Button
**Rückwärtskompatibilität:** Legacy `/api/state` → Default-Tenant. Migration `state.json` → `state_default.json`.
**Grund:** BIT hat mehrere Trains (PS-NET, PS-INT etc.) die unabhängig planen müssen.

## 2026-04-12: Feature 19 – Admin-Bereich mit Code-Isolation
**Entscheidung:** Admin-Funktionen hinter 6-stelligem OTP-Style Code mit 15min Session-Cache.
**Funktionen:** Reset, Tenant-Verwaltung (CRUD), Code-Änderung.
**Rate-Limiting:** max. 3 Fehlversuche → 60s Sperre.
**Grund:** Einfacher Schutz ohne vollständige Authentifizierung. Ausreichend für internen Pilotbetrieb.
**Risiko:** Kein echtes 2FA. Phase 6+ plant TOTP (Feature 23) und aGov OIDC (Feature 24).

## 2026-04-14: Feature 20 – Mitarbeiterstamm-Filter
**Entscheidung:** Filter-UI direkt in MitarbeiterSettings integriert (kein separater Filter-Tab).
**Funktionen:** Textsuche (Vorname/Name), Team-Multi-Dropdown mit Click-Outside, Typ-Filter (iMA/eMA).
**Wichtig:** CSV-Export + "Alle löschen" operieren auf vollständigem Datensatz (kein Datenverlust durch aktiven Filter).

## 2026-04-14: Feature 21 – Settings-Scroll-to-Section
**Entscheidung:** Sidebar-Klick auf Feiertage/Schulferien/Blocker → smooth scroll zur Sektion.
**Implementierung:** Refs + useEffect + scrollToSection-Prop in KalenderDatenSettings.

## 2026-04-16: Dokumenten-Synchronisation
**Entscheidung:** PRD.md wird als führendes Dokument für Feature-Nummerierung und -Liste definiert.
**Hierarchie:** PRD.md > STATUS.md > AI.md > CLAUDE.md > features/ > decisions/log.md
**Grund:** Nummern-Drift zwischen PRD.md, STATUS.md und Feature-Dateien verursachte inkonsistente Agent-Kontexte.
**Massnahme:** Einmalige Synchronisation aller Dokumente auf einheitliche Nummerierung (durchgeführt 16.04.2026).

## 2026-04-22: Feature 23 – Swiss DS CSS Alignment (BIT Skin)
**Entscheidung:** BIT-Skin nach Swiss DS CSS-Variable-Architektur eingeführt.

**Begründung:**
- Swiss Design System (`designsystem-main`) definiert keine fixen Bundesfarben — es ist ein Skin-System mit CSS Custom Properties (`--color-primary-*`, `--color-secondary-*`).
- Für BIT wird Bundesblau (`#003F7F`) als `--color-primary-700` und Bundesrot (`#E63312`) als `--color-secondary-500` definiert. Übrige Skala (50–900) per HSL-Interpolation.
- NotoSans (Open Source, Swiss DS Repo) ersetzt Arial als Frutiger-Fallback. Frutiger bleibt erste Wahl (auf BIT-Geräten systemseitig installiert). 4 TTF-Dateien selbst-gehostet unter `public/fonts/`.
- Rückwärtskompatible Aliase (`bund-blau`, `bund-rot`, `bund-bg`, `bund-text`) bleiben in `tailwind.config.js` erhalten (Option A — keine Massenumbenennung im Code).

**Option 2 für `buchung.*` Tokens:** Die bestehende `tailwind.config.js` hatte für `buchung.ferien`, `buchung.abwesend`, `buchung.betrieb`, `buchung.betriebPikett` andere Hex-Werte als `BUCHUNGSTYP_FARBEN` in `constants.ts` (vermutlich Pre-FIX-02-Zustand). Beibehalten ohne Änderung, weil:
- Verbot "Feature 16 nicht anfassen" (FarbConfig-Domäne)
- AbsenzTabelle.tsx referenziert exakt diese aktuellen Werte (also intern konsistent)
- Vereinheitlichung mit `BUCHUNGSTYP_FARBEN` würde optische Regressionen erzeugen

**Geänderte Dateien:**
- `safe-pi-capacity-planner/src/index.css` (4× `@font-face` NotoSans + `:root` BIT-Skin Variablen)
- `safe-pi-capacity-planner/tailwind.config.js` (primary/secondary via CSS-Vars, Aliase erhalten, fontFamily NotoSans)
- `safe-pi-capacity-planner/src/constants.ts` (`TEAM_COLORS_HEX` + `TEAM_COLORS_FALLBACK` exportiert)
- `safe-pi-capacity-planner/src/components/dashboard/KPICards.tsx` (2× Hex → primary)
- `safe-pi-capacity-planner/src/components/dashboard/SPBarChart.tsx` (Import statt lokaler TEAM_COLORS)
- `safe-pi-capacity-planner/src/components/dashboard/DashboardView.tsx` (3× Hex → primary)
- `safe-pi-capacity-planner/src/components/dashboard/AbsenzTabelle.tsx` (6× `text-[#…]` → `text-buchung-*`)
- `safe-pi-capacity-planner/src/components/pidashboard/PIDashboardView.tsx` (3× Hex → primary)
- `safe-pi-capacity-planner/src/components/pidashboard/PIDashboardTable.tsx` (Import statt lokaler TEAM_COLORS)
- `safe-pi-capacity-planner/src/components/settings/MitarbeiterSettings.tsx` (3× hover-Hex → hover:bg-primary-800)
- `safe-pi-capacity-planner/public/fonts/` (neu, 4 TTF aus `designsystem-main/css/foundations/fonts/`)

**Alternativ geprüft & verworfen:**
- Web-Component-Integration aus Swiss DS (Vue/Nuxt, nicht React → massives Regressionsrisiko)
- Default-Skin-Farben des Swiss DS (Rot-Primär für öffentliche Sites, nicht für BIT-Intranet-App)
- Vereinheitlichung der `buchung.*` Tailwind-Tokens mit `BUCHUNGSTYP_FARBEN` (würde optische Regressionen erzeugen, Feature-16-Domäne)
- Migration aller `bund-blau` → `primary-700` im Bestandscode (Option B, separater Refactor wenn überhaupt)

**Folge-Renumbering in PRD.md:**
- Phase 6+ Roadmap-Features 23–28 wurden auf 24–29 verschoben (TOTP 2FA, aGov OIDC, Jira REST, Mobile, Audit-Log, Rollen).
- Historische Referenz im Eintrag 2026-04-12 (Feature 19) auf "Feature 23" für TOTP bleibt als Zeitdokument unverändert; gilt jetzt als Feature 24.
