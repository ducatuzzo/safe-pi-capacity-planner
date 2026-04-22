# Feature 23 – Swiss Design System CSS Alignment (BIT Skin)

> **Status:** 🔲 Geplant
> **Phase:** 4b – CD Bund Vertiefung
> **Erstellt:** 22.04.2026
> **Aktualisiert:** 22.04.2026 (nach Analyse des Swiss DS Repos `designsystem-main`)
> **Abhängigkeiten:** Feature 13 (CD Bund, ✅ deployed) — dieses Feature korrigiert und vervollständigt es

---

## Befunde aus der Swiss DS Analyse

Repo: `C:\Users\Davide\Documents\AI\safe-pi-planner\designsystem-main`

### Befund 1 – Schrift ist NotoSans, nicht Frutiger
Das Swiss DS benutzt `NotoSans` (frei, Open-Source). Die Font-Dateien liegen direkt im Repo:
```
css/foundations/fonts/
  NotoSans-Regular.ttf
  NotoSans-Bold.ttf
  NotoSans-Italic.ttf
  NotoSans-BoldItalic.ttf
```
Frutiger wird im Swiss DS nirgends erwähnt. Das Swiss DS hat die Frutiger-Abhängigkeit bewusst durch NotoSans ersetzt — aus Lizenz- und Verfügbarkeitsgründen.

**Konsequenz für unsere App:**
- `Frutiger` bleibt als erste Wahl (auf BIT-Geräten systemweit installiert)
- `NotoSans` ersetzen `Arial` als offizieller Fallback (Swiss DS sanktioniert)
- Font-Dateien aus dem Swiss DS Repo direkt verwenden (keine CDN, datenschutzkonform)
- `font-family: Frutiger, 'NotoSans', Arial, sans-serif`

### Befund 2 – Kein Bundesblau im Swiss DS, stattdessen: Skin-System
Das Swiss DS definiert **keine fixen Markenfarben**. Es definiert ein CSS-Variablen-Schema:
```css
--color-primary-50  bis  --color-primary-900
--color-secondary-50  bis  --color-secondary-900
```
Diese werden via "Skins" befüllt:
| Skin | Primary-500 | Secondary-500 | Verwendung |
|------|------------|---------------|------------|
| `default` | #e53940 (Bundesrot) | #46596b (Blaugrau) | Öffentliche Bundeswebsites |
| `intranet` | #3b82f6 (Tailwind Blue) | #234dc2 (Dunkelblau) | Intranet-Anwendungen |
| `freebrand` | #7c9f7c (Grün) | #6a7f69 (Dunkelgrün) | Partnerorganisationen |

**Kein BIT-Skin existiert.** Wir müssen einen erstellen.

### Befund 3 – Die Tailwind Config des Swiss DS ist instructive
```javascript
// Aus app/tailwind.config.js des Swiss DS
colors: {
  primary: {
    50: 'var(--color-primary-50)',
    // ...bis 900
  },
  secondary: {
    50: 'var(--color-secondary-50)',
    // ...bis 900
  },
  text: { /* Grau-Skala für Fliesstext */ },
}
fontFamily: {
  regular: ['Font-Regular', 'Hind', 'Fallback-font', 'Sans-Serif'],
  bold:    ['Font-Bold',    'Hind', 'Fallback-font'],
  italic:  ['Font-Italic',  'Hind', 'Fallback-font'],
}
fontWeight: { normal: 400, bold: 400 } // Fettschrift via font-family, nicht font-weight!
borderRadius: { DEFAULT: '0.1875rem', sm: '0.125rem', lg: '0.3125rem' ... }
boxShadow: { /* definierte Schatten-Skala */ }
```

**Wichtig:** Im Swiss DS wird "Fett" nicht über `font-weight: 700` gelöst, sondern über eine separate `font-family` (Font-Bold). Das ist ein anderes Paradigma als Standard-Tailwind.

### Befund 4 – Hardcoded Hex-Werte in unserer App (bekannte Lücken)
| Datei | Problem | Kategorie |
|-------|---------|-----------|
| `KPICards.tsx:42` | `text-[#003F7F]` | A — Ersetzen durch `text-bund-blau` |
| `KPICards.tsx:48` | `text-[#0070C0]` | D — Kein CD-Bund-Token; Icon-Farbe unklar |
| `SPBarChart.tsx:16` | `TEAM_COLORS` Record | B — Teamfarben, bewusst dynamisch |
| `constants.ts` | Prüfung ausstehend | ? |

---

## Problem-Statement (neu gefasst)

Unsere App tut folgendes:
1. Definiert Farben statisch als Hex in `tailwind.config.js` → **Kein Skin-System, nicht erweiterbar**
2. Hat vereinzelte hardcoded Hex-Werte im JSX → **Inkonsistenz**
3. Hat `Frutiger, Arial` als Font → **Arial als Fallback ist suboptimal wenn NotoSans verfügbar ist**
4. Hat kein CSS-Variable-System → **Keine Konformität mit Swiss DS Architektur**
5. Hat `fontWeight: 700` für bold → **Widerspricht Swiss DS Paradigma** (aber akzeptabel für interne App)

---

## Scope (aktualisiert)

### ✅ In Scope
1. **NotoSans Font einbinden** (aus Swiss DS Repo, selbst-gehostet)
2. **CSS-Variable-Schema einführen** (nach Swiss DS Muster, BIT-Skin)
3. **Tailwind Config auf CSS-Variablen umstellen** (für primary/secondary)
4. **BIT-Skin definieren:** Bundesblau-Skala als `--color-primary-*`, Bundesrot als `--color-secondary-*`
5. **Hardcoded Hex-Fixes** im JSX (Kategorie A + D)
6. **TEAM_COLORS_HEX in constants.ts** als single source of truth
7. **Box-Shadow + Border-Radius** aus Swiss DS übernehmen (optional, nach Absprache)

### ❌ Nicht in Scope
- Keine Vue-Komponenten portieren (Swiss DS ist Vue/Nuxt)
- Keine `font-family`-Trennung von Regular/Bold (Swiss DS-Paradigma ist zu komplex für bestehende Codebasis)
- Keine Responsive-Breakpoints aus Swiss DS (andere Skala als unsere App braucht)
- Keine WCAG-Korrekturen
- Kein neues npm-Package

---

## Implementierungsplan (4 Schritte)

### Schritt 0 – Audit: Alle Hardcoded-Farben finden

Vor jeder Codeänderung folgenden Grep ausführen:
```bash
cd safe-pi-capacity-planner
grep -rn '#[0-9A-Fa-f]\{3,6\}' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Ergebnis kategorisieren (A/B/C/D wie oben). Erst danach weitermachen.

---

### Schritt 1 – NotoSans Font einbinden

**1a) Font-Dateien kopieren**
```
Von: designsystem-main/css/foundations/fonts/*.ttf
Nach: safe-pi-capacity-planner/public/fonts/
```
4 Dateien: NotoSans-Regular.ttf, NotoSans-Bold.ttf, NotoSans-Italic.ttf, NotoSans-BoldItalic.ttf

**1b) index.css ergänzen**
```css
/* NotoSans — Swiss DS Fallback-Font (Open Source, selbst-gehostet) */
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
```

**1c) tailwind.config.js fontFamily anpassen**
```javascript
fontFamily: {
  sans: ['Frutiger', 'NotoSans', 'Arial', 'sans-serif'],
},
```

---

### Schritt 2 – BIT-Skin CSS-Variablen (Hauptarbeit)

Dies ist der Kern des Features. Wir erstellen einen BIT-Skin nach Swiss DS Muster.

**Bundesblau-Skala** (primary): `#003F7F` ist der Anker bei primary-700 (dunkel, wie im CD-Manual).
Die gesamte Skala wird durch HSL-Interpolation abgeleitet:

```css
/* index.css — BIT Skin (Swiss DS Architektur) */

/* ------- FARB-FOUNDATION: Swiss DS Farbskala (unveränderlich) ------- */
:root {
  /* Grau-Skala (Swiss DS text-* entsprechend) */
  --color-text-50:  #f9fafb;
  --color-text-100: #f3f4f6;
  --color-text-200: #e5e7eb;
  --color-text-300: #d1d5db;
  --color-text-400: #9ca3af;
  --color-text-500: #6b7280;
  --color-text-600: #4b5563;
  --color-text-700: #374151;
  --color-text-800: #1f2937;
  --color-text-900: #111827;
}

/* ------- BIT SKIN: Primär = Bundesblau, Sekundär = Bundesrot ------- */
:root {
  /* Bundesblau-Skala — abgeleitet von #003F7F */
  --color-primary-50:  #e6eef7;
  --color-primary-100: #ccddf0;
  --color-primary-200: #99bbe1;
  --color-primary-300: #6699d1;
  --color-primary-400: #3377c2;
  --color-primary-500: #1a5fa3;   /* Mittelblau */
  --color-primary-600: #004fa0;   /* leicht heller als Bundesblau */
  --color-primary-700: #003F7F;   /* Bundesblau — Anker */
  --color-primary-800: #003066;   /* dunkler */
  --color-primary-900: #00214d;   /* sehr dunkel */

  /* Bundesrot-Skala — abgeleitet von #E63312 */
  --color-secondary-50:  #fdf0ee;
  --color-secondary-100: #fad9d4;
  --color-secondary-200: #f5b3aa;
  --color-secondary-300: #ef8d7f;
  --color-secondary-400: #ea6755;
  --color-secondary-500: #E63312;  /* Bundesrot — Anker */
  --color-secondary-600: #c22a0f;
  --color-secondary-700: #9e220c;
  --color-secondary-800: #7a1a09;
  --color-secondary-900: #561206;
}
```

> ⚠️ **Wichtig:** Die Zwischenwerte (50–400, 600–900) sind interpoliert. Sie müssen visuell geprüft werden. Wenn sie unharmonisch wirken, können sie mit einem Color-Scale-Tool (z.B. `uicolors.app`) kalibriert werden.

---

### Schritt 3 – Tailwind Config auf CSS-Variablen umstellen

```javascript
// tailwind.config.js (nach Feature 23)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // === BIT Skin: Swiss DS Architektur ===
        // Primär: Bundesblau-Skala (via CSS-Variablen)
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

        // Sekundär: Bundesrot-Skala (via CSS-Variablen)
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

        // === Rückwärtskompatible Aliase (nicht löschen! noch in Gebrauch) ===
        // Nach vollständiger Migration können diese entfernt werden.
        'bund-blau':  '#003F7F',   // = primary-700
        'bund-rot':   '#E63312',   // = secondary-500
        'bund-bg':    '#F5F5F5',
        'bund-text':  '#1A1A1A',

        // === Teamfarben (Feature 16, nicht via CSS-Vars weil dynamisch) ===
        // Als named tokens in Tailwind (für statische Verwendung)
        'team-net': '#003F7F',
        'team-acm': '#0070C0',
        'team-con': '#00B050',
        'team-paf': '#FF6600',

        // === Buchungstypen (Feature 16 — NICHT hier ändern) ===
        buchung: {
          ferien:       '#FB923C',
          abwesend:     '#6B7280',
          teilzeit:     '#FDE68A',
          militaer:     '#84CC16',
          ipa:          '#A78BFA',
          betrieb:      '#60A5FA',
          betriebPikett:'#7C3AED',
          pikett:       '#F9A8D4',
          feiertag:     '#D1D5DB',
          schulferien:  '#E5E7EB',
          blocker:      '#BFDBFE',
        },
      },
      fontFamily: {
        sans: ['Frutiger', 'NotoSans', 'Arial', 'sans-serif'],
      },
      // Swiss DS Box-Shadow Skala (optional übernehmen)
      boxShadow: {
        sm:  '0px 1px 2px 0px rgba(0,0,0,0.05)',
        DEFAULT: '0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 5px 0px rgba(0,0,0,0.08)',
        md:  '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 10px -1px rgba(0,0,0,0.08)',
        lg:  '0px 2px 6px -1px rgba(0,0,0,0.06), 0px 5px 20px -3px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
```

**Migrationsregel:** Solange `bund-blau` noch verwendet wird, bleibt der Alias. Erst nach vollständiger Migration auf `primary-700` den Alias entfernen.

---

### Schritt 4 – Hardcoded Hex-Fixes + TEAM_COLORS Konstante

**4a) constants.ts anpassen**

```typescript
// src/constants.ts — single source of truth für Teamfarben
export const TEAM_COLORS_HEX: Record<string, string> = {
  NET: '#003F7F',  // = primary-700 (Bundesblau)
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
};

export const TEAM_COLORS_FALLBACK = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];
```

**4b) KPICards.tsx reparieren**

```tsx
// VORHER (falsch):
colorClass="text-[#003F7F]"   // Icon SP
colorClass="text-[#0070C0]"   // Icon Mitarbeiter

// NACHHER (korrekt):
colorClass="text-primary-700"  // Bundesblau via CSS-Var
colorClass="text-primary-500"  // Mittelblau (kein willkürlicher fremder Hex)
```

**4c) SPBarChart.tsx und PIDashboardRow.tsx**
```tsx
// Import statt lokaler Definition:
import { TEAM_COLORS_HEX, TEAM_COLORS_FALLBACK } from '../../constants';
```

---

## Abnahmekriterien

- [ ] `grep -rn 'text-\[#' src/` → 0 Treffer (keine hardcoded Text-Farben im JSX)
- [ ] `grep -rn 'bg-\[#' src/` → 0 Treffer (Ausnahme: dynamische inline styles aus Feature 16)
- [ ] `public/fonts/NotoSans-*.ttf` existiert (4 Dateien)
- [ ] `index.css` enthält `@font-face` für NotoSans
- [ ] `index.css` enthält `--color-primary-*` und `--color-secondary-*` Variablen
- [ ] `tailwind.config.js` hat `primary` und `secondary` via `var(--color-*)`
- [ ] `constants.ts` hat `TEAM_COLORS_HEX` exportiert
- [ ] `SPBarChart.tsx` importiert `TEAM_COLORS_HEX` aus constants (keine lokale Kopie)
- [ ] `KPICards.tsx` hat keine hardcoded Hex-Werte mehr
- [ ] Build ist grün: `npx vite build` ohne Fehler
- [ ] Visueller Smoke-Test: Header ist Bundesblau, Buttons funktionieren, Charts rendern

---

## Offene Entscheidung: primary-700 vs. bund-blau

Nach der Migration gibt es zwei Optionen:

**Option A – Aliase beibehalten (Empfehlung für jetzt)**
`bund-blau`, `bund-rot` etc. bleiben in tailwind.config.js als Aliase für Rückwärtskompatibilität. Keine Massenumbenennung im Code.

**Option B – Vollständige Migration auf primary/secondary**
Alle `text-bund-blau` werden zu `text-primary-700`. Aufwändiger, aber swiss-DS-konform.

> **Empfehlung:** Option A für dieses Feature. Option B als separates Refactoring wenn Feature 22 (Custom Types) abgeschlossen ist.

---

## Was dieses Feature bringt (Zusammenfassung)

| Vorher | Nachher |
|--------|---------|
| Frutiger → Arial (Fallback) | Frutiger → NotoSans → Arial |
| Farben: statische Hex in tailwind.config | Farben: CSS-Vars + Tailwind-Aliase |
| Keine Swiss DS Architektur-Konformität | BIT-Skin nach Swiss DS Muster |
| 2 hardcoded Hex-Werte im JSX | Alle Farben über Tailwind-Klassen |
| TEAM_COLORS in mehreren Dateien dupliziert | Single source of truth in constants.ts |

---

## Risiken (aktualisiert)

| Risiko | W'keit | Impact | Mitigation |
|--------|--------|--------|------------|
| CSS-Variable Interpolation bricht PurgeCSS | Niedrig | Mittel | CSS-Vars werden nicht von Tailwind weggepurged; nur wenn nicht in content-Dateien referenziert |
| NotoSans TTF + Frutiger Konflikt | Sehr niedrig | Niedrig | `font-display: swap` verhindert Textflackern |
| Blauskala-Zwischenwerte wirken unharmonisch | Mittel | Niedrig | Visueller Check genügt; ggf. mit uicolors.app kalibrieren |
| Migration von `bund-blau` → `primary-700` nicht vollständig | Niedrig | Niedrig | Option A lässt Aliase stehen → kein Breaking Change |
| `TEAM_COLORS_HEX` Import fehlt in einer Chart-Komponente | Niedrig | Mittel | Grep nach verbleibenden lokalen TEAM_COLORS-Definitionen nach Commit |

---

## Dokumentationspflicht nach Abschluss

- `decisions/log.md` → "Swiss DS Skin-Entscheidung: BIT-Skin mit Bundesblau als primary-700"
- `AI.md` → Abschnitt Corporate Design Bund: CSS-Variable-Schema dokumentieren
- `STATUS.md` → Feature 23 auf ✅ setzen
- `PRD.md` → Feature 23 eintragen (Roadmap-Features schieben auf 24+)

---

## Aufwand (realistisch)

| Schritt | Zeit |
|---------|------|
| Schritt 0: Grep-Audit | 15 min |
| Schritt 1: NotoSans einbinden | 20 min |
| Schritt 2: CSS-Variablen definieren + visuell kalibrieren | 45 min |
| Schritt 3: tailwind.config.js umbauen | 20 min |
| Schritt 4: Hardcoded-Fixes + constants.ts | 30 min |
| Build-Test + Smoke-Test | 15 min |
| Dokumentation | 20 min |
| **Total** | **~2.5h** |
