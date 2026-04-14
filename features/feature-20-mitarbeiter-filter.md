# Feature 20: Mitarbeiterstamm-Filter

## Session-Typ: IMPL (klein)

## Auftrag
Baue eine Filterleiste in `src/components/settings/MitarbeiterSettings.tsx` direkt zwischen der Toolbar (Überschrift + Buttons) und der Tabelle ein. Der Mitarbeiterstamm wächst — ohne Filter ist die Seite unbenutzbar.

## Akzeptanzkriterien
- [ ] Textsuche-Feld: filtert case-insensitive nach Vorname UND Name (Teilstring-Match)
- [ ] Team-Filter: Dropdown mit Checkboxen, Mehrfachauswahl, "Alle Teams" als Default — Teams dynamisch aus `employees[]` ableiten, sortiert
- [ ] Typ-Filter: Einzelauswahl — "Alle" | "iMA" | "eMA"
- [ ] Ergebnis-Zähler unter der Tabelle: `{gefiltert} von {total} Mitarbeiter`
- [ ] "Filter zurücksetzen"-Link (nur sichtbar wenn mindestens ein Filter aktiv)
- [ ] Filter sofort wirksam (onChange), kein "Anwenden"-Button
- [ ] CSV-Export exportiert IMMER ALLE Mitarbeiter (nicht gefilterte!) — sonst Datenverlust
- [ ] "Alle löschen"-Button löscht IMMER ALLE Mitarbeiter — Warnung muss das klarstellen

## Technische Vorgaben

### Filter-State (lokal in der Komponente)
```typescript
interface MitarbeiterFilter {
  suchtext: string;
  teams: string[];          // leer = alle Teams
  typ: '' | 'iMA' | 'eMA'; // '' = alle
}
```

### Gefilterter Datensatz
```typescript
const gefilterteMitarbeiter = useMemo(() => {
  return employees.filter(ma => {
    const suche = filter.suchtext.toLowerCase();
    const nameMatch = !suche || 
      ma.vorname.toLowerCase().includes(suche) || 
      ma.name.toLowerCase().includes(suche);
    const teamMatch = filter.teams.length === 0 || filter.teams.includes(ma.team);
    const typMatch = !filter.typ || ma.type === filter.typ;
    return nameMatch && teamMatch && typMatch;
  });
}, [employees, filter]);
```

### Team-Dropdown
- Custom-Dropdown (kein natives `<select multiple>` — UX ist miserabel)
- Checkbox pro Team, Toggle-All
- Zeigt ausgewählte Teams als Zähler: "3 Teams" oder "Alle Teams"
- Schliesst bei Klick ausserhalb (useRef + useEffect clickOutside)

### Layout der Filterleiste
```
[🔍 Suche nach Name...] [Team ▾] [Typ ▾] [✕ Filter zurücksetzen]
```
- Flex-Row, `gap-3`, konsistent mit bestehendem Tailwind-Design
- Unter der bestehenden Toolbar, über der Tabelle
- `mb-4` Abstand zur Tabelle

### Zähler
- Bestehende Zeile `{employees.length} Mitarbeiter` ersetzen durch:
  - Wenn Filter aktiv: `{gefilterteMitarbeiter.length} von {employees.length} Mitarbeiter`
  - Wenn kein Filter: `{employees.length} Mitarbeiter`

## Dateien die geändert werden
| Datei | Änderung |
|-------|----------|
| `src/components/settings/MitarbeiterSettings.tsx` | Filter-State, Filterleiste-UI, gefilterte Liste, Zähler |

## Dateien die NICHT geändert werden
- `types.ts` — kein neues globales Interface nötig
- Backend — rein Frontend-Feature
- Kein neuer Socket.io-Event

## Konventionen (CLAUDE.md)
- Deutsch: UI-Labels, Kommentare
- Englisch: Variablen, Funktionen, Typen
- Kein `any`, keine inline styles, nur Tailwind
- Kein neues npm-Paket
