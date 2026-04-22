# IMPL-Session: Feature 23 – Swiss Design System CSS Alignment (BIT Skin)

Du bist mein AI-Entwicklungspartner für SAFe PI Capacity Planner.
Dies ist eine **IMPL-Session**. Du implementierst ausschliesslich was in der Feature-Spec steht — keine eigenen Erweiterungen, keine "während wir schon dabei sind"-Verbesserungen.

---

## Pflichtlektüre (in dieser Reihenfolge, vor jeder Codeänderung)

Lies folgende Dateien:

1. `AI.md` – Techstack, Konventionen, Verbote
2. `STATUS.md` – aktueller Stand, bekannte Risiken
3. `features/feature-23-swiss-ds-css-alignment.md` – dein heutiger Auftrag (vollständige Spec)

Fasse nach dem Lesen in **3–5 Sätzen** zusammen:
- Was Feature 23 tut und warum es nötig ist
- Welche 4 Schritte du heute implementierst
- Welche Dateien du anfasst und welche du nicht anfasst

**Warte auf meine Bestätigung, bevor du mit Schritt 0 beginnst.**

---

## Kontext (Zusammenfassung der Planungsarbeit)

Feature 13 (CD Bund) wurde zu früh als ✅ markiert. Es hat vier konkrete Lücken:

1. **Hardcoded Hex-Werte im JSX** — `KPICards.tsx` benutzt `text-[#003F7F]` und `text-[#0070C0]` direkt
2. **Kein CSS-Variable-System** — Tailwind hat statische Hex-Werte, kein Swiss DS Skin-Pattern
3. **`TEAM_COLORS` ist in mehreren Komponenten dupliziert** — kein single source of truth
4. **Schrift-Fallback ist Arial** — NotoSans (Swiss DS, Open Source, bereits im Repo vorhanden) ist der korrekte Fallback

Das Swiss Design System Repo liegt lokal unter:
`C:\Users\Davide\Documents\AI\safe-pi-planner\designsystem-main\`

Die Font-Dateien (NotoSans) liegen dort unter:
`designsystem-main/css/foundations/fonts/NotoSans-Regular.ttf` (und Bold, Italic, BoldItalic)

---

## Dein Auftrag: 4 Schritte

### Schritt 0 – Audit (kein Code, nur Analyse)

Führe diesen Grep-Befehl aus und zeige mir das vollständige Ergebnis:

```bash
cd safe-pi-capacity-planner
grep -rn '#[0-9A-Fa-f]\{3,6\}' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "constants.ts" | grep -v "types.ts"
```

Kategorisiere jeden Treffer:
- **A** — CD-Bund-Farbe, aber Tailwind-Klasse verfügbar → ersetzen
- **B** — Teamfarbe (dynamisch via Feature 16) → in TEAM_COLORS_HEX überführen, inline style behalten
- **C** — Recharts/Chart-interne Farbe → nicht ersetzen (Recharts kennt kein Tailwind)
- **D** — Unbekannte Herkunft, kein CD-Bund-Token → klären

Zeig mir die kategorisierte Liste. Warte auf meine Bestätigung bevor du weitermachst.

---

### Schritt 1 – NotoSans Font einbinden

**1a) Font-Dateien kopieren**

Kopiere diese 4 Dateien:
```
Von: designsystem-main/css/foundations/fonts/NotoSans-Regular.ttf
Von: designsystem-main/css/foundations/fonts/NotoSans-Bold.ttf
Von: designsystem-main/css/foundations/fonts/NotoSans-Italic.ttf
Von: designsystem-main/css/foundations/fonts/NotoSans-BoldItalic.ttf

Nach: safe-pi-capacity-planner/public/fonts/
```

Bestätige per `ls safe-pi-capacity-planner/public/fonts/` dass alle 4 Dateien vorhanden sind.

**1b) `src/index.css` erweitern**

Füge **vor** den bestehenden `@tailwind` Direktiven folgende `@font-face` Blöcke ein:

```css
/* NotoSans — Swiss Design System Fallback-Font (Open Source, selbst-gehostet) */
@font-face {
  font-family: 'NotoSans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSans-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'NotoSans';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/NotoSans-Bold.ttf') format('truetype');
}

@font-face {
  font-family: 'NotoSans';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSans-Italic.ttf') format('truetype');
}

@font-face {
  font-family: 'NotoSans';
  font-style: italic;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/NotoSans-BoldItalic.ttf') format('truetype');
}
```

---

### Schritt 2 – CSS-Variablen BIT-Skin + Tailwind-Config umbauen

**2a) `src/index.css` — BIT-Skin Variablen hinzufügen**

Füge nach den `@font-face`-Blöcken und vor `@tailwind base` folgendes ein:

```css
/* ============================================================
   BIT SKIN — Swiss Design System Architektur
   Primär: Bundesblau-Skala  |  Sekundär: Bundesrot-Skala
   ============================================================ */
:root {
  /* --- Bundesblau (primary) — Anker: primary-700 = #003F7F --- */
  --color-primary-50:  #e6eef7;
  --color-primary-100: #ccddf0;
  --color-primary-200: #99bbe1;
  --color-primary-300: #6699d1;
  --color-primary-400: #3377c2;
  --color-primary-500: #1a5fa3;
  --color-primary-600: #004fa0;
  --color-primary-700: #003F7F;   /* Bundesblau — CD Bund Primärfarbe */
  --color-primary-800: #003066;
  --color-primary-900: #00214d;

  /* --- Bundesrot (secondary) — Anker: secondary-500 = #E63312 --- */
  --color-secondary-50:  #fdf0ee;
  --color-secondary-100: #fad9d4;
  --color-secondary-200: #f5b3aa;
  --color-secondary-300: #ef8d7f;
  --color-secondary-400: #ea6755;
  --color-secondary-500: #E63312;  /* Bundesrot — CD Bund Sekundärfarbe */
  --color-secondary-600: #c22a0f;
  --color-secondary-700: #9e220c;
  --color-secondary-800: #7a1a09;
  --color-secondary-900: #561206;
}
```

**2b) `tailwind.config.js` — Primary/Secondary via CSS-Variablen**

Ersetze den bestehenden Inhalt der `colors`-Sektion wie folgt (Buchungstypen-Sektion vollständig erhalten):

```javascript
colors: {
  // === BIT Skin: Swiss DS CSS-Variable-Architektur ===
  primary: {
    50:  'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    200: 'var(--color-primary-200)',
    300: 'var(--color-primary-300)',
    400: 'var(--color-primary-400)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)',  // = Bundesblau #003F7F
    800: 'var(--color-primary-800)',
    900: 'var(--color-primary-900)',
  },
  secondary: {
    50:  'var(--color-secondary-50)',
    100: 'var(--color-secondary-100)',
    200: 'var(--color-secondary-200)',
    300: 'var(--color-secondary-300)',
    400: 'var(--color-secondary-400)',
    500: 'var(--color-secondary-500)',  // = Bundesrot #E63312
    600: 'var(--color-secondary-600)',
    700: 'var(--color-secondary-700)',
    800: 'var(--color-secondary-800)',
    900: 'var(--color-secondary-900)',
  },

  // === Rückwärtskompatible Aliase (NICHT LÖSCHEN — noch in Gebrauch) ===
  'bund-blau':  '#003F7F',   // Alias für primary-700
  'bund-rot':   '#E63312',   // Alias für secondary-500
  'bund-bg':    '#F5F5F5',
  'bund-text':  '#1A1A1A',

  // === Teamfarben (als named tokens für statische Verwendung) ===
  'team-net': '#003F7F',
  'team-acm': '#0070C0',
  'team-con': '#00B050',
  'team-paf': '#FF6600',

  // === Buchungstypen (Feature 16 — NICHT ÄNDERN) ===
  buchung: {
    ferien:        '#FB923C',
    abwesend:      '#6B7280',
    teilzeit:      '#FDE68A',
    militaer:      '#84CC16',
    ipa:           '#A78BFA',
    betrieb:       '#60A5FA',
    betriebPikett: '#7C3AED',
    pikett:        '#F9A8D4',
    feiertag:      '#D1D5DB',
    schulferien:   '#E5E7EB',
    blocker:       '#BFDBFE',
  },
},
fontFamily: {
  sans: ['Frutiger', 'NotoSans', 'Arial', 'sans-serif'],
},
```

---

### Schritt 3 – Hardcoded Hex-Fixes in Komponenten

**3a) `src/components/dashboard/KPICards.tsx` reparieren**

Zeile 42: `colorClass="text-[#003F7F]"` → `colorClass="text-primary-700"`
Zeile 48: `colorClass="text-[#0070C0]"` → `colorClass="text-primary-500"`

> Begründung: `#0070C0` war ein willkürliches Blau ohne semantische Bedeutung. `primary-500` ist das mittlere Bundesblau — konsequenter als ein fremdes "Microsoft-Blau".

**3b) Alle weiteren Kategorie-A-Treffer aus Schritt 0 abarbeiten**

Jeden Fund aus Schritt-0-Audit der Kategorie A Schritt für Schritt ersetzen. Nach jeder Datei kurz bestätigen.

---

### Schritt 4 – TEAM_COLORS in constants.ts konsolidieren

**4a) `src/constants.ts` erweitern**

Füge nach dem bestehenden `FARBEN`-Block folgendes hinzu:

```typescript
// Teamfarben — single source of truth (Swiss DS: Teamfarben sind app-spezifisch, nicht im CD-Bund definiert)
// Konsistent mit AI.md und Feature 16 (FarbConfig überschreibt diese Werte zur Laufzeit)
export const TEAM_COLORS_HEX: Record<string, string> = {
  NET: '#003F7F',  // Identisch mit FARBEN.BUND_BLAU / primary-700
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
} as const;

export const TEAM_COLORS_FALLBACK = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'] as const;
```

**4b) `src/components/dashboard/SPBarChart.tsx` anpassen**

Ersetze die lokale `TEAM_COLORS`-Definition durch den Import aus constants:

```typescript
// LÖSCHEN:
const TEAM_COLORS: Record<string, string> = {
  NET: '#003F7F',
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
};
const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

// ERSETZEN DURCH:
import { TEAM_COLORS_HEX, TEAM_COLORS_FALLBACK } from '../../constants';
```

Passe `getTeamColor` an:
```typescript
function getTeamColor(team: string, index: number): string {
  return TEAM_COLORS_HEX[team] ?? TEAM_COLORS_FALLBACK[index % TEAM_COLORS_FALLBACK.length];
}
```

**4c) Grep auf verbleibende duplizierte TEAM_COLORS-Definitionen**

```bash
grep -rn 'TEAM_COLORS' src/ --include="*.tsx" --include="*.ts"
```

Falls andere Komponenten (PIDashboardRow.tsx etc.) ebenfalls lokale Definitionen haben → gleiche Migration durchführen.

---

## Abnahme-Check (vor Session-Ende)

Führe folgende Checks aus und zeige mir die Ergebnisse:

```bash
# 1. Keine hardcoded Hex-Farben mehr im JSX (dynamische inline styles sind Ausnahme)
grep -rn 'text-\[#' src/ --include="*.tsx"
grep -rn 'bg-\[#' src/ --include="*.tsx"

# 2. Keine duplizierten TEAM_COLORS-Definitionen mehr
grep -rn 'TEAM_COLORS.*Record\|NET.*0070\|ACM.*003F' src/ --include="*.tsx" --include="*.ts"

# 3. Font-Dateien vorhanden
ls safe-pi-capacity-planner/public/fonts/

# 4. Build ist grün
cd safe-pi-capacity-planner && npx vite build
```

**Erwartetes Ergebnis:**
- Grep 1+2: 0 Treffer (oder nur berechtigte Ausnahmen mit Kommentar)
- Grep 3: 4 Dateien sichtbar
- Build: keine Fehler, keine TypeScript-Errors

---

## Session-Ende (Pflicht)

Nach erfolgreichem Abnahme-Check führe folgende Dokumentations-Updates durch:

### STATUS.md aktualisieren
- Feature 23 in Phase 4b hinzufügen: `| 23 | Swiss Design System CSS Alignment (BIT Skin) | ✅ deployed |`
- "Zuletzt erledigt" Eintrag mit heutigem Datum

### PRD.md aktualisieren
- Phase 4b Abschnitt erstellen mit Feature 23
- Bestehende Roadmap-Features (ehemals 23–28) auf 24–29 verschieben

### decisions/log.md Eintrag erstellen
Falls `decisions/log.md` nicht existiert, zuerst `decisions/` Verzeichnis und Datei anlegen.

Eintrag hinzufügen:
```markdown
## 22.04.2026 — Feature 23: Swiss DS CSS Alignment

**Entscheidung:** BIT-Skin nach Swiss DS CSS-Variable-Architektur eingeführt.

**Begründung:**
- Swiss Design System (swiss/designsystem) definiert keine fixen Bundesfarben.
  Es ist ein Skin-System mit CSS Custom Properties (--color-primary-*, --color-secondary-*).
- Für BIT wird Bundesblau (#003F7F) als primary-700 und Bundesrot (#E63312) als secondary-500 definiert.
- NotoSans (Open Source, Swiss DS Repo) ersetzt Arial als Frutiger-Fallback.
  Frutiger bleibt erste Wahl (auf BIT-Geräten systemseitig installiert).
- Rückwärtskompatible Aliase (bund-blau, bund-rot) bleiben erhalten.

**Alternativ geprüft:**
- Web-Component-Integration aus Swiss DS: Verworfen (Vue/Nuxt, nicht React; massives Regressionsrisiko)
- Default-Skin-Farben des Swiss DS: Verworfen (Rot-Primär für öffentliche Sites, nicht für BIT-Intranet-App)

**Betroffene Dateien:**
- safe-pi-capacity-planner/src/index.css
- safe-pi-capacity-planner/tailwind.config.js
- safe-pi-capacity-planner/src/constants.ts
- safe-pi-capacity-planner/src/components/dashboard/KPICards.tsx
- safe-pi-capacity-planner/src/components/dashboard/SPBarChart.tsx
- safe-pi-capacity-planner/public/fonts/ (neu)
```

### AI.md aktualisieren
Im Abschnitt "Corporate Design Bund" folgende Zeilen ergänzen:
```markdown
- Swiss DS Architektur: CSS Custom Properties (--color-primary-700 = Bundesblau, --color-secondary-500 = Bundesrot)
- Schrift: Frutiger (systemweit BIT) → NotoSans (Swiss DS Fallback, selbst-gehostet) → Arial
- TEAM_COLORS_HEX: definiert in src/constants.ts (single source of truth)
- BIT Skin: skins/default.postcss des Swiss DS als Muster, nicht als Übernahme
```

---

## Verbote (aus CLAUDE.md + für diese Session)

- ❌ Keine Änderungen an `src/types.ts` — Feature 23 hat kein neues Datenmodell
- ❌ Keine Änderungen an Backend-Dateien — rein Frontend/CSS
- ❌ Keine neuen npm-Pakete (NotoSans ist als TTF-Datei direkt eingebunden)
- ❌ Keine Änderungen an `BUCHUNGSTYP_FARBEN` in constants.ts — Feature 16 zuständig
- ❌ Keine Migration von `bund-blau` auf `primary-700` im bestehenden Code — Option A: Aliase bleiben
- ❌ Keine Änderungen an der FarbConfig-Logik (Feature 16) — nicht anfassen
- ❌ Kein `any` in TypeScript
- ❌ Keine inline styles hinzufügen — nur Tailwind-Klassen
- ❌ Nicht eigenmächtig Scope erweitern ("solange wir schon dabei sind...")

---

## Wenn etwas unklar ist

Stoppe und frage, statt eigenständig zu interpretieren. Insbesondere:
- Falls der Grep-Audit in Schritt 0 unerwartete Treffer zeigt → zuerst kategorisieren, dann bestätigen lassen
- Falls der Build nach tailwind.config.js-Umbau fehlschlägt → Fehler zeigen, nicht eigenmächtig debuggen
- Falls eine Komponente `TEAM_COLORS` mit anderem Format benutzt → zeigen, nicht eigenmächtig migriern
