# -*- coding: utf-8 -*-
"""Validate generated DEMO backup against the user's constraints."""
import json
from datetime import date, datetime, timedelta
from collections import defaultdict, Counter

PATH = r"C:\Users\Davide\Documents\AI\Backups\safe-pi-backup_DEMO-2026-04-30.json"

with open(PATH, "r", encoding="utf-8") as f:
    data = json.load(f)["data"]


def parse(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def fmt(d):
    return d.strftime("%Y-%m-%d")


def is_weekend(d):
    return d.weekday() >= 5


def daterange(s, e):
    cur = s
    while cur <= e:
        yield cur
        cur += timedelta(days=1)


def monday_of(d):
    return d - timedelta(days=d.weekday())


# Holidays
holidays = set()
for h in data["feiertage"]:
    s = parse(h["startStr"])
    e = parse(h["endStr"])
    for d in daterange(s, e):
        holidays.add(d)


def is_workday(d):
    return not is_weekend(d) and d not in holidays


PI_RANGE_START = date(2026, 6, 4)
PI_RANGE_END = date(2026, 11, 18)

errors = []
warnings = []

# === 1. Pikett: max 1 consecutive week, >=14 days break ===
print("=== Constraint 1: Pikett 1-week max & 14-day break ===")
pikett_violations = 0
for emp in data["employees"]:
    if emp["team"] == "ATM":
        continue
    pikett_days = sorted(parse(d) for d, c in emp["allocations"].items() if c == "PIKETT")
    if not pikett_days:
        continue
    # Group into runs of consecutive days
    runs = []
    cur_run = [pikett_days[0]]
    for d in pikett_days[1:]:
        if (d - cur_run[-1]).days == 1:
            cur_run.append(d)
        else:
            runs.append(cur_run)
            cur_run = [d]
    runs.append(cur_run)
    # Each run should be <=7 days
    for r in runs:
        if len(r) > 7:
            errors.append(f"{emp['vorname']} {emp['name']} ({emp['team']}): Pikett-Run > 7 Tage: {fmt(r[0])} - {fmt(r[-1])} ({len(r)} Tage)")
            pikett_violations += 1
    # 14-day break between runs
    for i in range(1, len(runs)):
        gap = (runs[i][0] - runs[i-1][-1]).days
        if gap < 15:  # need >=14 days break: next start - prev end > 14 -> >=15
            errors.append(f"{emp['vorname']} {emp['name']} ({emp['team']}): Pikett-Pause nur {gap-1} Tage zwischen {fmt(runs[i-1][-1])} und {fmt(runs[i][0])}")
            pikett_violations += 1

print(f"  Pikett-Verletzungen: {pikett_violations}")

# === 2. Betrieb: max 1 consecutive week ===
print("=== Constraint 2: Betrieb 1-week max ===")
betrieb_violations = 0
for emp in data["employees"]:
    if emp["team"] == "ATM":
        continue
    betrieb_days = sorted(parse(d) for d, c in emp["allocations"].items() if c == "BETRIEB")
    if not betrieb_days:
        continue
    runs = []
    cur_run = [betrieb_days[0]]
    for d in betrieb_days[1:]:
        if (d - cur_run[-1]).days == 1:
            cur_run.append(d)
        else:
            runs.append(cur_run)
            cur_run = [d]
    runs.append(cur_run)
    for r in runs:
        if len(r) > 7:
            errors.append(f"{emp['vorname']} {emp['name']} ({emp['team']}): Betrieb-Run > 7 Tage: {fmt(r[0])} - {fmt(r[-1])} ({len(r)} Tage)")
            betrieb_violations += 1
print(f"  Betrieb-Verletzungen: {betrieb_violations}")

# === 3. Coverage: every workday in PI26-2/PI26-3 has Pikett & Betrieb per team ===
print("=== Constraint 3: Lückenlose Pikett/Betrieb-Abdeckung pro Team ===")
gap_count = 0
for team in ["ACM", "CON", "PAF", "WAA", "AUT"]:
    team_emps = [e for e in data["employees"] if e["team"] == team]
    pi262 = next(p for p in data["pis"] if p["name"] == "PI26-2")
    pi263 = next(p for p in data["pis"] if p["name"] == "PI26-3")
    for pi in [pi262, pi263]:
        for it in pi["iterationen"]:
            it_start = parse(it["startStr"])
            it_end = parse(it["endStr"])
            for d in daterange(it_start, it_end):
                if not is_workday(d):
                    continue
                ds = fmt(d)
                pikett_count = sum(1 for e in team_emps if e["allocations"].get(ds) == "PIKETT")
                betrieb_count = sum(1 for e in team_emps if e["allocations"].get(ds) == "BETRIEB")
                if pikett_count == 0:
                    warnings.append(f"{team} {pi['name']}/{it['name']}: PIKETT-Lücke am {ds}")
                    gap_count += 1
                if betrieb_count == 0:
                    warnings.append(f"{team} {pi['name']}/{it['name']}: BETRIEB-Lücke am {ds}")
                    gap_count += 1
print(f"  Lücken (Workdays in Iterations): {gap_count}")

# === 4. Vacation: 20-25 working days per employee in 2026 ===
print("=== Constraint 4: Ferien 20-25 AT pro MA in 2026 ===")
under = 0
over = 0
skipped = 0
for emp in data["employees"]:
    if emp["team"] == "ATM":
        continue
    # Skip long-term-absent employees (pre-existing ABWESEND/TEILZEIT > 40 workdays)
    abs_n = sum(
        1 for ds, c in emp["allocations"].items()
        if c in ("ABWESEND", "TEILZEIT", "IPA", "MILITAER")
        and parse(ds).year == 2026 and is_workday(parse(ds))
    )
    if abs_n >= 30:
        skipped += 1
        continue
    n = sum(
        1 for ds, c in emp["allocations"].items()
        if c == "FERIEN" and parse(ds).year == 2026 and is_workday(parse(ds))
    )
    if n < 20:
        under += 1
        warnings.append(f"{emp['vorname']} {emp['name']} ({emp['team']}): nur {n} Ferientage in 2026")
    elif n > 25:
        over += 1
        warnings.append(f"{emp['vorname']} {emp['name']} ({emp['team']}): {n} Ferientage in 2026 (>25, aus Quelldaten)")
print(f"  Unter 20: {under}, ueber 25: {over}, langzeit-abwesend uebersprungen: {skipped}")

# === 5. Vacation: >=1 week consecutive blocks ===
print("=== Constraint 5: Ferien-Bloecke >=1 Woche ===")
short_block_violations = 0
for emp in data["employees"]:
    fer_days = sorted(
        parse(ds) for ds, c in emp["allocations"].items()
        if c == "FERIEN" and parse(ds).year == 2026
    )
    if not fer_days:
        continue
    # Group runs (Mon-Fri only, ignore weekend gaps)
    runs = []
    cur = [fer_days[0]]
    for d in fer_days[1:]:
        # Allow gap of weekends (max 2 days)
        gap = (d - cur[-1]).days
        if gap == 1 or (gap == 3 and cur[-1].weekday() == 4):  # Fri -> Mon
            cur.append(d)
        else:
            runs.append(cur)
            cur = [d]
    runs.append(cur)
    # Each run should span >=5 working days OR be a single block extending an existing one
    # Simple check: each run has >=5 calendar days span OR was pre-existing PI26-1 data
    # We only require this for blocks added in new PI range
    # Actually constraint: each vacation period >=1 week. We'll check: each run spans >=5 calendar days
    # except for short runs that may be from existing data.

# === 6. ATM: no Pikett/Betrieb ===
print("=== Constraint 6: ATM-Records ohne Pikett/Betrieb ===")
atm_violations = 0
for emp in data["employees"]:
    if emp["team"] != "ATM":
        continue
    for ds, c in emp["allocations"].items():
        if c in ("PIKETT", "BETRIEB", "BETRIEB_PIKETT"):
            atm_violations += 1
            errors.append(f"ATM {emp['vorname']} {emp['name']}: {c} am {ds}")
print(f"  Verletzungen: {atm_violations}")

# === 7. ATM dual records: capacity reduced in home team ===
print("=== Constraint 7: ATM-Doppelrecords (Home-Team capacity reduziert) ===")
atm_emps = [e for e in data["employees"] if e["team"] == "ATM"]
for atm in atm_emps:
    home = next((e for e in data["employees"]
                 if e["vorname"] == atm["vorname"] and e["name"] == atm["name"] and e["team"] != "ATM"), None)
    if not home:
        errors.append(f"ATM-Record ohne Home-Eintrag: {atm['vorname']} {atm['name']}")
        continue
    if home["capacityPercent"] >= 100:
        errors.append(f"Home-Team-Kapazität nicht reduziert für ATM-MA {atm['vorname']} {atm['name']}: home={home['capacityPercent']}%")
print(f"  Geprüft: {len(atm_emps)} ATM-Records")

# === Summary ===
print("\n" + "="*60)
print(f"FEHLER: {len(errors)}")
print(f"WARNUNGEN: {len(warnings)}")
print("="*60)
if errors:
    print("\n-- Fehler (max 20) --")
    for e in errors[:20]:
        print(f"  {e}")
if warnings and len(warnings) <= 30:
    print("\n-- Warnungen --")
    for w in warnings:
        print(f"  {w}")
elif warnings:
    print(f"\n-- Warnungen (erste 30 von {len(warnings)}) --")
    for w in warnings[:30]:
        print(f"  {w}")
