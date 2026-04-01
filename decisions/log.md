# decisions/log.md – Entscheidungslog

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

## 2026-03-27: Port-Konfiguration
**Entscheidung:** Frontend auf 5173, Backend auf 3001.
**Grund:** Vite-Standard, kein Konflikt mit anderen lokalen Services bei BIT.

## 2026-03-28: FIX-02 – Farbcodes Buchungstypen
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
**Datei:** CalendarCell.tsx — ALLOCATION_LETTER Record + content = ALLOCATION_LETTER[allocation]

## 2026-03-27: Blocker vs. Feiertage – Semantik
**Entscheidung:** Blocker/Spezielle Perioden sind KEINE Absenzen.
**Grund:** Ein Freeze-Tag ist ein Arbeitstag – er blockiert Deployments, nicht die Kapazität.
SP-Berechnung: Blocker-Tage zählen als normale Arbeitstage (kein SP-Abzug).

## 2026-03-27: Datenfehler in mitarbeiterstamm.csv – Behandlung
**Entscheidung:** Ungültige Zeilen (betrieb% + pauschale% > kapazität%) werden beim Import NICHT stillschweigend korrigiert.
**Verhalten:** Import zeigt Warnung pro fehlerhafter Zeile, betroffene Mitarbeiter werden trotzdem importiert mit den Originalwerten, aber in der UI rot markiert.
**Grund:** Davide muss die korrekten Werte selbst entscheiden – automatisches Korrigieren würde falsche Daten erzeugen.
**Betroffene Zeilen:**
- Jonathan Cattaneo: betrieb=1% + pauschale=100% = 101%
- André Tellenbach: betrieb=1% + pauschale=100% = 101%

## 2026-03-28: Regel – Dokumentation immer nachführen
**Entscheidung:** Installationshandbuch und Benutzerdokumentation müssen bei jeder Änderung die den Benutzer oder die Installation betrifft nachgeführt werden.
**Was auslöst eine Aktualisierung:**
- Neue Features die der Benutzer bedienen muss → Benutzerdokumentation
- Änderungen an Infrastruktur, Ports, Abhängigkeiten, Startbefehlen → Installationshandbuch
- Neue Buchungstypen oder Farbcodes → beide Dokumente
- Änderungen an Einstellungen oder CSV-Formaten → Benutzerdokumentation
- Änderungen an Backup/Restore-Verhalten → beide Dokumente
**Wie:** Neue DOCX-Dokumente generieren und als neue Version ablegen.
**Ablageort:** C:\Users\Davide\Documents\AI\safe-pi-planner\docs\
**Dateinamen:** installationshandbuch_vX.Y.docx, benutzerdokumentation_vX.Y.docx

## 2026-03-28: Feature 15 – Multiuser abgeschlossen
**Entscheidung:** Socket.io State-Sync vollständig implementiert.
- Server ist Source of Truth (state-manager.ts, in-memory)
- REST GET /api/state für initialen Load
- Socket.io Events: allocation:change, settings:change, lock:row, unlock:row
- Verbindungsindikator im Header (grün/rot)
- Verifiziert: Header zeigte "Verbunden" bei laufendem Backend auf Port 3001

## 2026-03-28: FIX-04 – Logo ersetzt durch SVG
**Entscheidung:** bundeslogo.png ersetzt durch Logo_RGB_farbig_negativ.svg
**Grund:** SVG (weisser Text auf transparent) ist auf blauem Header deutlich besser lesbar als PNG.
**Quelle:** C:\Users\Davide\Documents\AI\Bundeslogo_SVG\Bundeslogo_SVG\Logo_RGB_farbig_negativ.svg
**Datei:** src/assets/bundeslogo.svg, Header.tsx Import angepasst

## 2026-03-28: FIX-05 – Header vergrössert
**Entscheidung:** Header-Grösse angepasst für bessere Lesbarkeit des Logos.
**Änderungen:**
- Logo: h-10 → h-14
- Trennlinie: h-8 → h-10
- Titel: text-lg → text-xl
- Untertitel: text-xs → text-sm
- Padding: py-3 → py-4
**Datei:** src/components/layout/Header.tsx
