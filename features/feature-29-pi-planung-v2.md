# Feature 29 — PI-Planung: Wochenbasierte Generierung + Zeremonien + Blocker-Wochen

## Status
`IMPL DONE` — implementiert am 06.05.2026, ⏳ deploy ausstehend (zusammen mit F22 + F23)

### Implementierungs-Status (Schritt-für-Schritt)
- [x] Schritt 1 — Schema 1.4 → 1.5 + types + pi-calculator + state-migration
- [x] Schritt 2 — PI-Erstellen Modal wochenbasiert + Auto-Berechnung Enddatum + Iter.-Wo. Spalte
- [x] Schritt 3 — IterationEditor mit Blocker-Wochen Inline-Anzeige + CRUD + Re-Berechnung
- [x] Schritt 4 — ZeremonienEditor (CRUD + Modal mit 7 Typen, Default-Dauer/Zeit)
- [x] Schritt 5 — .ics Export client-side (RFC 5545, kein npm-Paket)
- [x] Schritt 6 — Planungs-Kalender: Blocker-Spans (gestreift) + Zeremonien-Marker (◆ Hover-Tooltip)

### Im Browser verifiziert
- PI-Erstellung: Auto-Berechnung Enddatum live, Montag-Warnung bei Nicht-Montag
- Blocker-Add: I2–I5 verschoben +7 Tage, PI-Enddatum +7 Tage; Delete: exakt zurück
- Zeremonien: 7 Typen, Defaults greifen, Validierung Datum-im-PI-Zeitraum
- ICS-File: korrektes Format, Sonderzeichen-Escaping, Line-Folding bei >75 Oktette
- Kalender-Header: 6 Zeilen (Monat/KW/PI/Iter+Blocker/Zeremonien/Tag), Tooltip korrekt

---

## Kontext & Motivation

ARTFlow (base44.app) wird abgelöst. Die PI-Planungs-Logik des RTE wird vollständig in den
SAFe PI Capacity Planner integriert. Bestehende Demo-Daten (PI26-2) werden gelöscht.

**Drei neue Konzepte:**
1. **Wochenbasierte PI-Generierung** — Startdatum + Wochen pro Iteration → automatische Datumsgenerierung
2. **Blocker-Wochen** — PI-lokale Pausen die alle nachfolgenden Iterationen nach hinten schieben
3. **Zeremonien** — kalendarische SAFe-Events pro PI, exportierbar als .ics

**Abgrenzung zu bestehenden Features:**
- `Blocker/Freeze` (Change-Management, IT-Wartungsfenster) → **unberührt, komplett unabhängig**
- Kapazitäts-Logik (SP, Buchungstypen) → **unberührt**
- Blocker-Wochen = rein planungsrelevant, SP leer, Buchungstypen (Pikett etc.) weiterhin buchbar

---

## 1. Datenmodell

### 1.1 Erweitertes PI-Objekt

```typescript
interface PIPlan {
  id: string;
  name: string;                      // "PI26-2"
  startDate: string;                 // ISO: "2026-04-28"
  iterationWeeks: number;            // Wochen pro Iteration, z.B. 3
  iterations: PIIteration[];         // auto-generiert oder manuell
  blockerWeeks: PIBlockerWeek[];     // NEU
  zeremonien: PIZeremonie[];         // NEU
}

interface PIIteration {
  id: string;
  name: string;                      // "I1", "I2" etc. — auto oder editierbar
  startDate: string;                 // ISO
  endDate: string;                   // ISO — berechnet aus startDate + iterationWeeks
}

// NEU
interface PIBlockerWeek {
  id: string;
  label: string;                     // z.B. "Weihnachten", "Sommerpause"
  afterIterationId: string;          // Blocker sitzt NACH dieser Iteration
  weeks: number;                     // Dauer der Blocker-Woche(n), Default 1
}

// NEU
interface PIZeremonie {
  id: string;
  type: ZeremonieType;
  title: string;                     // editierbar, Default = Typ-Label
  date: string;                      // ISO: "2026-05-08"
  startTime: string;                 // "14:00"
  durationMinutes: number;           // Default je nach Typ
  location: string;                  // optional, Freitext / Teams-Link
  description: string;               // optional, erscheint im .ics Body
  iterationId?: string;              // optional: Zuordnung zu Iteration
}

type ZeremonieType =
  | 'PI_PLANNING'
  | 'DRAFT_PLAN_REVIEW'
  | 'FINAL_PLAN_REVIEW'
  | 'PRIO_MEETING'
  | 'SYSTEM_DEMO'
  | 'FINAL_SYSTEM_DEMO'
  | 'INSPECT_ADAPT';
```

### 1.2 Schema-Version
`1.4 → 1.5` — Backup/Restore (Feature 11) schliesst `blockerWeeks[]` und `zeremonien[]` automatisch ein.

### 1.3 Datums-Berechnungslogik

```
Iteration 1: startDate = PI.startDate
             endDate   = startDate + (iterationWeeks * 7) - 1 Tag

Iteration 2: startDate = Iteration1.endDate + 1 Tag
             (falls zwischen I1 und I2 ein Blocker: + blockerWeek.weeks * 7)

Iteration N: analog, jeder Blocker nach Iteration X verschiebt alle X+1..N
```

**Regel:** Blocker-Wochen verlängern das PI-Enddatum. Sie verschieben keine Zeremonien
automatisch — der RTE passt Zeremonien-Daten manuell an.

---

## 2. UI — Einstellungen > PI-Planung

### 2.1 PI-Liste (Tabelle, heute vorhanden — minimal erweitert)

```
Name | Start | Ende | Iter. | Iter.-Wo. | Aktionen
PI26-2 | 2026-04-28 | 2026-09-25 | 5 | 3 Wo. | ✏️ 🗑️
```

Neu: Spalte **Iter.-Wo.** zeigt die Wochen pro Iteration an.

### 2.2 "+ Neu" Dialog (Modal — ersetzt bisherigen simplen Dialog)

```
┌─────────────────────────────────────────┐
│  Neues PI erstellen                     │
│                                         │
│  PI-Name          [PI26-2        ]      │
│  Startdatum       [28.04.2026    ]      │
│  Wochen/Iteration [3             ]      │
│  Anzahl Iter.     [5             ]      │
│                                         │
│  → Enddatum wird automatisch berechnet  │
│    und angezeigt: 25.09.2026            │
│                                         │
│  [Abbrechen]              [Erstellen]   │
└─────────────────────────────────────────┘
```

**Validierung:**
- PI-Name: Pflichtfeld, unique pro Train
- Startdatum: Pflichtfeld, muss Montag sein (Warnung wenn nicht, kein Hard-Block)
- Wochen/Iteration: 1–6, Pflichtfeld
- Anzahl Iter.: 1–10, Pflichtfeld

### 2.3 Aufgeklappte PI-Zeile — drei Sektionen

```
▼ PI26-2  2026-04-28 → 2026-09-25  5 Iter.  3 Wo.  ✏️ 🗑️

  ▼ ITERATIONEN                                [+ Iteration manuell]
  ┌──────────────────────────────────────────────────────┐
  │  I1  2026-04-28 → 2026-05-16   3 Wo.   ✏️ 🗑️        │
  │  ── BLOCKER: Weihnachten  1 Wo.  [nach I1] ──  🗑️   │
  │  I2  2026-05-26 → 2026-06-13   3 Wo.   ✏️ 🗑️        │
  │  I3  2026-06-16 → 2026-07-04   3 Wo.   ✏️ 🗑️        │
  │  I4  2026-07-07 → 2026-07-25   3 Wo.   ✏️ 🗑️        │
  │  I5  2026-07-28 → 2026-08-15   3 Wo.   ✏️ 🗑️        │
  └──────────────────────────────────────────────────────┘

  ▼ ZEREMONIEN                                 [+ Zeremonie]
  ┌────────────────────────────────────────────────────────────┐
  │  Typ              Datum        Zeit   Dauer  Iter.   .ics  │
  │  PI Planning      2026-04-28   09:00  2T     I1      [↓]  │
  │  System Demo      2026-05-14   14:00  2h     I1      [↓]  │
  │  Inspect & Adapt  2026-08-14   09:00  4h     I5      [↓]  │
  └────────────────────────────────────────────────────────────┘
```

### 2.4 Blocker-Woche hinzufügen

Button **[+ Blocker]** unterhalb der Iterations-Liste:

```
┌─────────────────────────────────────┐
│  Blocker-Woche einfügen             │
│                                     │
│  Nach Iteration  [I1 ▾]            │
│  Bezeichnung     [Weihnachten  ]    │
│  Dauer (Wochen)  [1            ]    │
│                                     │
│  [Abbrechen]          [Einfügen]    │
└─────────────────────────────────────┘
```

**Effekt:** Alle Iterationen nach dem Einfügepunkt werden automatisch neu berechnet.
PI-Enddatum verlängert sich entsprechend.

### 2.5 Zeremonie hinzufügen — Modal

```
┌──────────────────────────────────────┐
│  Zeremonie hinzufügen                │
│                                      │
│  Typ          [System Demo      ▾]  │
│  Titel        [System Demo PI26-2]  │
│  Datum        [14.05.2026        ]  │
│  Startzeit    [14:00             ]  │
│  Dauer (Min)  [120               ]  │
│  Ort/Link     [Teams-Link...     ]  │
│  Beschreibung [optional...       ]  │
│  Iteration    [I1               ▾]  │
│                                      │
│  [Abbrechen]            [Speichern] │
└──────────────────────────────────────┘
```

**Validierung:**
- Datum muss innerhalb PI Start–Ende liegen
- Datum, Startzeit, Dauer: Pflichtfelder
- Typ: Pflichtfeld

**Standard-Dauern (pre-filled):**

| Typ | Default Dauer |
|---|---|
| PI Planning | 960 Min (2 Tage) |
| Draft Plan Review | 60 Min |
| Final Plan Review | 60 Min |
| Prio-Meeting | 120 Min |
| System Demo | 120 Min |
| Final System Demo | 120 Min |
| Inspect & Adapt | 240 Min |

---

## 3. .ics Export

### Filename-Schema
```
{PI-Name}_{Zeremonien-Typ}_{Datum}.ics
Beispiel: PI26-2_System-Demo_2026-05-14.ics
```

### ICS-Inhalt (RFC 5545, client-side Blob — kein Backend)
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BIT SAFe PI Capacity Planner//DE
BEGIN:VEVENT
UID:{uuid}@safe-pi-capacity-planner.vercel.app
DTSTAMP:{now in UTC}
DTSTART:{date}T{startTime}00
DTEND:{date}T{endTime}00
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location}
END:VEVENT
END:VCALENDAR
```

**Export-Trigger:** `[↓]` Icon pro Zeremonien-Zeile → direkter Browser-Download.

---

## 4. Planungs-Kalender (Seite "Planung")

### Bestehende Darstellung (heute)
PI-Phasen als Balken über dem Mitarbeiter-Raster: `IP0 | PI26-2 | I1`

### Neu
Blocker-Wochen erscheinen als **grau schraffierter Balken** im KW-Raster, beschriftet mit
dem Blocker-Label (z.B. "Weihnachten"). Visueller Marker — keine Kapazitäts-Logik.

Zeremonien erscheinen als **kleine farbige Rauten/Icons** über dem KW-Raster auf dem
jeweiligen Datum. Hover zeigt Tooltip: Titel, Zeit, Ort.

**Kapazitäts-Verhalten in Blocker-Wochen:**
- SP-Planung: leer (keine Features einplanen)
- Buchungstypen (Pikett, Betrieb etc.): normal buchbar
- Keine automatische Kapazitäts-Reduktion

---

## 5. Berechtigungen

| Aktion | Admin | User |
|---|---|---|
| PI erstellen / bearbeiten / löschen | ✅ | ❌ |
| Blocker-Woche hinzufügen / löschen | ✅ | ❌ |
| Zeremonie erstellen / bearbeiten / löschen | ✅ | ❌ |
| Zeremonien anzeigen | ✅ | ✅ |
| .ics Export | ✅ | ✅ |
| Planungs-Kalender Blocker/Zeremonien sehen | ✅ | ✅ |

---

## 6. Backend / State

- Alle neuen Felder im bestehenden PI-Objekt — **kein neuer API-Endpoint**
- Schema-Version `1.4 → 1.5`
- Socket.io Broadcast bei allen Mutationen (wie bestehende Settings)
- Backup/Restore schliesst `blockerWeeks[]` und `zeremonien[]` automatisch ein

---

## 7. Was dieses Feature NICHT macht

- ❌ Drag & Drop für Blocker-Wochen
- ❌ Automatische Verschiebung von Zeremonien bei Blocker-Einfügung
- ❌ Direkte Outlook/Exchange API Integration
- ❌ Kapazitäts-Abzug bei Zeremonien oder Blocker-Wochen
- ❌ Änderung an Blocker/Freeze (Change-Management)
- ❌ Wochenraster innerhalb Iterationen (Wo.1, Wo.2...)

---

## 8. Implementierungs-Reihenfolge

| Schritt | Was | Aufwand |
|---|---|---|
| 1 | Schema 1.5 + Typen + Berechnungslogik (sp-calculator oder pi-calculator) | S |
| 2 | PI erstellen Modal — neue Felder + Auto-Berechnung | S |
| 3 | Iterations-Anzeige mit Blocker-Wochen (Read + CRUD) | M |
| 4 | Zeremonien-Sektion (Read + CRUD + Modal) | M |
| 5 | .ics Export (client-side) | S |
| 6 | Planungs-Kalender: Blocker-Balken + Zeremonien-Marker | M |
| **Total** | | **L** |

---

## 9. Offene Punkte — keine, Feature ist definiert

Alle Fragen aus der Analyse-Phase sind geklärt:
- ✅ Blocker/Freeze unberührt
- ✅ Blocker-Wochen verschieben nachfolgende Iterationen (Variante A)
- ✅ Zeremonien rein kalendarisch, kein Kapazitäts-Abzug
- ✅ IP0/IP4 obsolet, alle Iterationen gleich behandelt
- ✅ .ics Export: ein File pro Zeremonie
- ✅ Nur Admin pflegt, alle User sehen
- ✅ Bestehende Demo-Daten werden vor IMPL gelöscht

---

## Abhängigkeiten

- Feature 11 (Backup/Restore): Schema 1.4 → 1.5
- Feature 22 (Custom Allocation Types): muss deployed sein vor IMPL Start
- Planungs-Kalender Rendering (bestehende KW-Logik wird erweitert, nicht ersetzt)

---

*Erstellt: 2026-05-06 | Version: 1.0 READY*
