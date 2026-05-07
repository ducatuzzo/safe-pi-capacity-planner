# Feature: Dokumentation-Download (.docx)

## Ziel
Benutzer können die Benutzerdokumentation direkt aus der App herunterladen — als .docx-Datei, die lokal geöffnet und weitergegeben werden kann. Spart den Schritt, die Dokumentation separat zu suchen oder zu verteilen.

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (deployed)
- [ ] Tests: offen (nicht automatisiert)

## Akzeptanzkriterien
- [x] Download-Button in Tab «Einstellungen» sichtbar (eigene Sektion «Dokumentation»)
- [x] Klick auf Button startet sofortigen Download der .docx-Datei
- [x] Datei: `benutzerdokumentation_vX.Y.docx` (aktuelle Version)
- [x] .docx-Datei entspricht inhaltlich der aktuellen `docs/benutzerdokumentation_vX.Y.md`
- [x] Keine Server-Anfrage nötig — Datei wird statisch aus `public/docs/` ausgeliefert

## Technische Details

### Ansatz: Statische Datei in `public/docs/`
Die .docx-Datei wird einmalig aus der Markdown-Quelle generiert und in `public/docs/` abgelegt. Vite kopiert `public/` 1:1 in `dist/` → die Datei ist unter `/docs/benutzerdokumentation_v1.7.docx` erreichbar.

```
safe-pi-capacity-planner/
└── public/
    └── docs/
        └── benutzerdokumentation_v1.7.docx   ← statische Datei
```

### Download-Komponente (`src/components/settings/`)
```tsx
<a
  href="/docs/benutzerdokumentation_v1.7.docx"
  download="SAFe_PI_Planner_Benutzerdokumentation.docx"
>
  <Button>Benutzerdokumentation herunterladen (.docx)</Button>
</a>
```

### Generierung der .docx-Datei (Off-App, Entwicklerprozess)
Die .docx-Datei wird **nicht zur Laufzeit generiert**, sondern bei jeder Dokumentations-Aktualisierung manuell:

```bash
cd safe-pi-planner/docs/
node install_handbuch.js   # generiert .docx aus Markdown-Vorlage
# Ausgabe: benutzerdokumentation_vX.Y.docx
# Kopieren nach: safe-pi-capacity-planner/public/docs/
```

Abhängigkeiten des Generators (`docs/package.json`):
- `docx` — Word-Dokument-Generierung
- `docs/node_modules/` ist in `docs/.gitignore` erfasst (nicht committen)

### Wo der Button erscheint
Tab «Einstellungen» → letzte Sektion «Dokumentation» (nach Backup & Restore).

## Abhängigkeiten
- Keine Runtime-Abhängigkeit (statische Datei)
- Entwickler-Abhängigkeit: `docx`-Paket in `docs/` (separates node_modules, nicht Teil des App-Builds)

## Update-Prozess bei Dokumentationsänderungen
1. `docs/benutzerdokumentation_vX.Y.md` aktualisieren (Versionsnummer erhöhen)
2. `node docs/install_handbuch.js` ausführen → neue .docx generieren
3. Neue .docx nach `safe-pi-capacity-planner/public/docs/` kopieren
4. Alte Version löschen (oder versioniert behalten)
5. Download-Link in der Settings-Komponente auf neue Version zeigen lassen

## Nicht in Scope
- Keine automatische Synchronisation zwischen Markdown und .docx
- Kein in-app Viewer
- Kein PDF-Format (nur .docx)
