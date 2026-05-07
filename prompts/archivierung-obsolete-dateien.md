# Auftrag: Projekt-Archivierung — Obsolete Dateien verschieben

## Kontext
Du arbeitest im Projekt-Verzeichnis:
`C:\Users\Davide\Documents\AI\safe-pi-planner\`

Das Archiv-Verzeichnis existiert bereits:
`C:\Users\Davide\Documents\AI\safe-pi-planner\Archiv\`

Eine manuelle Archivierungs-Session wurde durch ein Nutzungslimit unterbrochen.
Einige Dateien wurden bereits als Archiv-Stubs angelegt.
Deine Aufgabe: den Rest erledigen — Originaldateien löschen wo Archiv-Stub bereits existiert,
und die DOCX/Binärdateien verschieben die noch nicht erledigt wurden.

---

## Was bereits erledigt ist (Archiv-Stubs vorhanden, Original noch löschen)

Die folgenden Textdateien wurden bereits als Stubs ins Archiv geschrieben.
Lösche jetzt die **Originaldateien** aus ihren Quellverzeichnissen:

### Projektwurzel löschen:
- `lastenheft_generator.js`
- `LASTENHEFT_GENERIEREN.bat`

### features/ löschen:
- `features/phase-2-planung.md`
- `features/feature-preparation-for-phase-5.md`

### prompts/ löschen (danach prüfen ob leer → Verzeichnis ebenfalls löschen, ausser archivierung-obsolete-dateien.md):
- `prompts/impl-feature-23-swiss-ds.md`

### docs/ löschen:
- `docs/benutzerdokumentation_v1.2.md`
- `docs/benutzerdokumentation_v1.3.md`
- `docs/.~lock.deployment_handbuch_v1.0.docx#`
- `docs/DOWNLOAD_ANLEITUNG.md`

---

## Was noch zu erledigen ist (Binärdateien verschieben + Original löschen)

Die folgenden DOCX/HTML-Binärdateien müssen physisch verschoben werden
(shutil.copy2 → os.remove):

### Projektwurzel → Archiv:
- `lastenheft_safe_pi_capacity_planner.docx`               → `Archiv/lastenheft_safe_pi_capacity_planner_v1.docx`
- `lastenheft_safe_pi_capacity_planner.html`               → `Archiv/lastenheft_safe_pi_capacity_planner_v1.html`
- `Consolidate project and analyze latest architecture.docx` → `Archiv/Consolidate_project_analyze_architecture.docx`
- `safe-pi-produktdarstellung.docx`                        → löschen (0 Bytes, leere Hülle)
- `feature_specs_safe_pi_planner_v1_1.docx`                → `Archiv/feature_specs_safe_pi_planner_v1_1.docx`
- `feature_specs_safe_pi_planner_v1_2.docx`                → `Archiv/feature_specs_safe_pi_planner_v1_2.docx`

### docs/ → Archiv:
- `docs/benutzerdokumentation_v1.0.docx`    → `Archiv/benutzerdokumentation_v1.0.docx`
- `docs/benutzerdokumentation_v1.2.docx`    → `Archiv/benutzerdokumentation_v1.2.docx`
- `docs/benutzerdokumentation_v1.3.docx`    → `Archiv/benutzerdokumentation_v1.3.docx`
- `docs/benutzerdokumentation_v1.4.docx`    → `Archiv/benutzerdokumentation_v1.4.docx`
- `docs/deployment_handbuch_v1.0.docx`      → `Archiv/deployment_handbuch_v1.0.docx`
- `docs/installationshandbuch_v1.0.docx`    → `Archiv/installationshandbuch_v1.0.docx`
- `docs/safe-pi-produktdarstellung.docx`    → löschen (0 Bytes, leere Hülle)
- `docs/safe-pi-produktdarstellung_2.docx`  → `Archiv/safe-pi-produktdarstellung_2.docx`

### docs/ Textdateien noch nicht erledigt → Archiv:
- `docs/benutzerdokumentation_v1.4.md`      → `Archiv/benutzerdokumentation_v1.4.md`
- `docs/benutzerdokumentation_v1.5.md`      → `Archiv/benutzerdokumentation_v1.5.md`
- `docs/benutzerdokumentation_v1.6.md`      → `Archiv/benutzerdokumentation_v1.6.md`

---

## Empfohlenes Python-Script für Binärdateien

```python
import shutil, os

BASE = r'C:\Users\Davide\Documents\AI\safe-pi-planner'
ARCH = os.path.join(BASE, 'Archiv')

moves = [
    # (Quelle, Ziel) — Ziel=None bedeutet löschen
    (r'lastenheft_safe_pi_capacity_planner.docx',               r'lastenheft_safe_pi_capacity_planner_v1.docx'),
    (r'lastenheft_safe_pi_capacity_planner.html',               r'lastenheft_safe_pi_capacity_planner_v1.html'),
    (r'Consolidate project and analyze latest architecture.docx', r'Consolidate_project_analyze_architecture.docx'),
    (r'safe-pi-produktdarstellung.docx',                        None),  # 0 Bytes → löschen
    (r'feature_specs_safe_pi_planner_v1_1.docx',                r'feature_specs_safe_pi_planner_v1_1.docx'),
    (r'feature_specs_safe_pi_planner_v1_2.docx',                r'feature_specs_safe_pi_planner_v1_2.docx'),
]
docs_moves = [
    (r'docs\benutzerdokumentation_v1.0.docx',   r'benutzerdokumentation_v1.0.docx'),
    (r'docs\benutzerdokumentation_v1.2.docx',   r'benutzerdokumentation_v1.2.docx'),
    (r'docs\benutzerdokumentation_v1.3.docx',   r'benutzerdokumentation_v1.3.docx'),
    (r'docs\benutzerdokumentation_v1.4.docx',   r'benutzerdokumentation_v1.4.docx'),
    (r'docs\deployment_handbuch_v1.0.docx',     r'deployment_handbuch_v1.0.docx'),
    (r'docs\installationshandbuch_v1.0.docx',   r'installationshandbuch_v1.0.docx'),
    (r'docs\safe-pi-produktdarstellung.docx',   None),  # 0 Bytes → löschen
    (r'docs\safe-pi-produktdarstellung_2.docx', r'safe-pi-produktdarstellung_2.docx'),
    (r'docs\benutzerdokumentation_v1.4.md',     r'benutzerdokumentation_v1.4.md'),
    (r'docs\benutzerdokumentation_v1.5.md',     r'benutzerdokumentation_v1.5.md'),
    (r'docs\benutzerdokumentation_v1.6.md',     r'benutzerdokumentation_v1.6.md'),
]

all_moves = [(os.path.join(BASE, s), os.path.join(ARCH, d) if d else None)
             for s, d in moves + docs_moves]

for src, dst in all_moves:
    if not os.path.exists(src):
        print(f'SKIP (nicht vorhanden): {src}')
        continue
    if dst is None:
        os.remove(src)
        print(f'GELÖSCHT: {src}')
    else:
        shutil.copy2(src, dst)
        os.remove(src)
        print(f'VERSCHOBEN: {os.path.basename(src)} → Archiv/')
```

---

## Was NICHT angerührt werden darf

**Projektwurzel:**
- `AI.md`, `CLAUDE.md`, `PRD.md`, `STATUS.md`
- `package.json`, `package-lock.json`, `node_modules/`
- `lastenheft_safe_pi_capacity_planner_v2.docx`
- `lastenheft_safe_pi_capacity_planner_v2.html`

**docs/ (aktiv behalten):**
- `benutzerdokumentation_v1.7.md`
- `pflichtenheft_v1.0.md`
- `deployment_handbuch_v1.0.md`
- `installationshandbuch_v1.0.md`
- `safe-kapa-planner-publish.docx`
- `feature_14_team_zielwerte_spec.docx`
- `benutzer_doku.js`, `deployment_handbuch.js`, `install_handbuch.js`
- `package.json`, `package-lock.json`, `node_modules/`
- `.gitignore`

**features/ (alle aktiven Feature-Specs behalten):**
- Alle `feature-01` bis `feature-23` + `feature-pi-dashboard-tab.md`
- `bug-04-persistenter-state.md`, `fix-01-blocker-header.md`

**Nie anfassen:**
- `safe-pi-capacity-planner/` (App-Code)
- `designsystem-main/`, `.git/`, `.claude/`, `decisions/log.md`

---

## Abschlussprüfung

```
dir C:\Users\Davide\Documents\AI\safe-pi-planner\ /b
dir C:\Users\Davide\Documents\AI\safe-pi-planner\Archiv\ /b
dir C:\Users\Davide\Documents\AI\safe-pi-planner\docs\ /b
dir C:\Users\Davide\Documents\AI\safe-pi-planner\features\ /b
```

**Erwartete Projektwurzel (nur noch):**
AI.md, CLAUDE.md, PRD.md, STATUS.md, package.json, package-lock.json,
lastenheft_safe_pi_capacity_planner_v2.docx, lastenheft_safe_pi_capacity_planner_v2.html,
Verzeichnisse: Archiv/, decisions/, designsystem-main/, docs/, features/, node_modules/,
prompts/ (nur noch archivierung-obsolete-dateien.md), safe-pi-capacity-planner/
