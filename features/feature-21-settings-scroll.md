# Feature 21: Settings-Navigation Scroll-to-Section

## Session-Typ: FIX (klein)

## Problem
Klick auf "Feiertage", "Schulferien" oder "Blocker / Freeze" in der Settings-Sidebar navigiert den Inhalt NICHT zur entsprechenden Sektion. Man muss manuell scrollen.

**Root Cause:** Alle drei Views (`feiertage`, `schulferien`, `blocker`) rendern `KalenderDatenSettings.tsx` als einen Langblock. Der `aktiveView`-State wechselt, aber es gibt kein `scrollIntoView`.

## Akzeptanzkriterien
- [ ] Klick auf "Feiertage" in Sidebar → Content scrollt zum Feiertage-Abschnitt
- [ ] Klick auf "Schulferien" in Sidebar → Content scrollt zum Schulferien-Abschnitt
- [ ] Klick auf "Blocker / Freeze" in Sidebar → Content scrollt zum Blocker-Abschnitt
- [ ] Scroll: `smooth`, kein harter Sprung
- [ ] Beim Tab-Wechsel zu Settings mit vorgewählter Kalender-View: ebenfalls korrekt scrollen

## Technische Lösung

### 1. KalenderDatenSettings.tsx — neue Prop + Refs + useEffect
```typescript
// Neue Prop
interface Props {
  // ... bestehende Props ...
  scrollToSection?: 'feiertage' | 'schulferien' | 'blocker';
}

// Refs für Abschnitte
const feiertageRef = useRef<HTMLDivElement>(null);
const schulferienRef = useRef<HTMLDivElement>(null);
const blockerRef = useRef<HTMLDivElement>(null);

// useEffect: scrollt bei Änderung
useEffect(() => {
  const refMap = {
    feiertage: feiertageRef,
    schulferien: schulferienRef,
    blocker: blockerRef,
  };
  const target = scrollToSection ? refMap[scrollToSection] : null;
  if (target?.current) {
    target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [scrollToSection]);
```

### 2. KalenderDatenSettings.tsx — Refs an Wrapper binden
```tsx
<div ref={feiertageRef}>
  <DateRangeTable titel="Gesetzliche Feiertage" ... />
</div>

<div ref={schulferienRef} className="border-t border-gray-200 pt-8">
  <DateRangeTable titel="Schulferien" ... />
</div>

<div ref={blockerRef} className="border-t border-gray-200 pt-8">
  <DateRangeTable titel="Blocker & Spezielle Perioden" ... />
</div>
```

### 3. SettingsPage.tsx — Prop durchreichen
```tsx
{isKalenderView && (
  <KalenderDatenSettings
    feiertage={feiertage}
    onFeiertageChange={onFeiertageChange}
    schulferien={schulferien}
    onSchulferienChange={onSchulferienChange}
    blocker={blocker}
    onBlockerChange={onBlockerChange}
    scrollToSection={aktiveView as 'feiertage' | 'schulferien' | 'blocker'}
  />
)}
```

## Dateien die geändert werden
| Datei | Änderung |
|-------|----------|
| `src/components/settings/KalenderDatenSettings.tsx` | Neue Prop, useRef × 3, useEffect, Refs an Wrapper |
| `src/components/settings/SettingsPage.tsx` | `scrollToSection`-Prop durchreichen |

## Dateien die NICHT geändert werden
- `types.ts` — SettingsView-Union bleibt unverändert
- Backend — rein Frontend-Feature
- Keine neuen Abhängigkeiten

## Konventionen (CLAUDE.md)
- Deutsch: UI-Labels, Kommentare
- Englisch: Variablen, Funktionen, Typen
- Kein `any`, keine inline styles, nur Tailwind
