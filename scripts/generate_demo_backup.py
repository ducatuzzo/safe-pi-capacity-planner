# -*- coding: utf-8 -*-
"""
Generate DEMO-Train backup based on PS-NET backup.

Adds:
- PI26-2 (04.06.2026 - 26.08.2026) and PI26-3 (27.08.2026 - 18.11.2026)
- New teams WAA (18) and AUT (23) with anonymized members
- Virtual ATM team (11 members from existing teams, dual records)
- Anonymizes all existing employee names

Constraints honored:
- Pikett: 1 consecutive week (Mon-Sun), >=14 days break afterwards, no gaps
- Betrieb: 1 consecutive week (Mon-Sun), no gaps
- Ferien: 20-25 working days per calendar year 2026 per employee, week blocks preferred
- All non-ATM employees rotate through Pikett AND Betrieb
- ATM records: no Pikett/Betrieb (virtual dev-only team)
"""
import json
import random
import uuid
import copy
from datetime import date, datetime, timedelta
from collections import defaultdict

random.seed(42)

INPUT = r"C:\Users\Davide\Documents\AI\Backups\safe-pi-backup_PS-NET-2026-04-30_13-42.json"
OUTPUT = r"C:\Users\Davide\Documents\AI\Backups\safe-pi-backup_DEMO-2026-04-30.json"

# ---------- Name pool ----------
FIRST_NAMES = [
    "Andrea", "Beat", "Carla", "Daniel", "Elena", "Fabian", "Gabi", "Hans",
    "Iris", "Jonas", "Karin", "Lukas", "Mara", "Nadine", "Oliver", "Patrick",
    "Reto", "Simon", "Tobias", "Ueli", "Valeria", "Werner", "Yvonne", "Zora",
    "Marc", "Nina", "Pia", "Thomas", "Christoph", "Heidi", "Ruedi", "Bea",
    "Bruno", "Esther", "Franz", "Gerda", "Heinz", "Ingrid", "Jolanda", "Klaus",
    "Linus", "Manfred", "Norbert", "Olga", "Peter", "Renate", "Sandra", "Tina",
    "Urs", "Vera", "Walter", "Xenia", "Yves", "Zita", "Adrian", "Bettina",
    "Christian", "Doris", "Edith", "Felix", "Greta", "Hugo", "Irene", "Joel",
    "Karl", "Lara", "Markus", "Niklaus", "Olivia", "Philipp", "Quirin", "Rolf",
    "Stefan", "Theres", "Ursula", "Vinzenz", "Wendelin", "Xandra", "Yannick", "Zoe",
    "Aldo", "Bea", "Cyrill", "Dora", "Erich", "Fanny", "Gerold", "Hilde",
    "Ivan", "Janine", "Kurt", "Lea", "Moritz", "Nora", "Otto", "Petra",
    "Rico", "Silvia", "Toni", "Ute", "Valentin", "Wanda", "Xeno", "Yann",
    "Zarah", "Aaron", "Bianca", "Cedric", "Damaris", "Erik", "Flavia", "Gerd",
]

LAST_NAMES = [
    "Aebi", "Brunner", "Cuerten", "Dietrich", "Eggenberger", "Furrer", "Graber",
    "Huber", "Iseli", "Jost", "Kuhn", "Luescher", "Mosimann", "Nyffeler",
    "Oettli", "Probst", "Rohner", "Studer", "Troesch", "Ulmann", "Voegeli",
    "Walthert", "Yoder", "Zaugg", "Aellig", "Berchtold", "Christen", "Duerrenmatt",
    "Eichenberger", "Frei", "Gerber", "Hofmann", "Imbach", "Jenny", "Knecht",
    "Luethi", "Meier", "Neuhaus", "Oppliger", "Pfister", "Quader", "Ruegsegger",
    "Stettler", "Tanner", "Ueltschi", "Vogt", "Wenger", "Zuercher", "Aerni",
    "Berger", "Cattaneo", "Disler", "Egger", "Fischer", "Gubler", "Hostettler",
    "Imhof", "Joss", "Kraehenbuehl", "Lehmann", "Mathys", "Niklaus", "Ogi",
    "Pulver", "Ruegg", "Schmid", "Trachsel", "Ueli", "Vontobel", "Walter",
    "Zehnder", "Affolter", "Buehler", "Caduff", "Diebold", "Etter", "Flueckiger",
    "Gnehm", "Heller", "Inderbitzin", "Kappeler", "Liechti", "Marti", "Niederer",
    "Oester", "Plattner", "Rieder", "Sutter", "Thommen", "Ulrich", "Vetter",
    "Weber", "Zimmermann", "Aregger", "Baumgartner", "Cina", "Dornbierer",
    "Estermann", "Forster", "Glauser", "Hauser", "Indermaur", "Jordi", "Kessler",
    "Loosli", "Maeder", "Notz", "Ott", "Peyer", "Roth", "Schaller", "Tschanz",
    "Ursprung", "Vontobel", "Wittwer", "Zollinger",
]


def make_unique_names(n: int, used: set) -> list:
    """Return n unique 'First Last' names not already in `used`."""
    out = []
    attempts = 0
    while len(out) < n and attempts < 20000:
        f = random.choice(FIRST_NAMES)
        l = random.choice(LAST_NAMES)
        full = f"{f} {l}"
        if full not in used:
            used.add(full)
            out.append((f, l))
        attempts += 1
    if len(out) < n:
        raise RuntimeError(f"Could not generate {n} unique names")
    return out


# ---------- Calendar helpers ----------
def parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def fmt(d: date) -> str:
    return d.strftime("%Y-%m-%d")


def daterange(start: date, end_inclusive: date):
    cur = start
    while cur <= end_inclusive:
        yield cur
        cur += timedelta(days=1)


def is_weekend(d: date) -> bool:
    return d.weekday() >= 5


def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


# ---------- Load source backup ----------
with open(INPUT, "r", encoding="utf-8") as f:
    src = json.load(f)

employees_src = src["data"]["employees"]
feiertage = src["data"]["feiertage"]
schulferien = src["data"]["schulferien"]
blocker = src["data"]["blocker"]
farbConfig = src["data"]["farbConfig"]
globalConfig = src["data"]["globalConfig"]
teamConfigs = src["data"]["teamConfigs"]
piTeamTargets_src = src["data"]["piTeamTargets"]
pis_src = src["data"]["pis"]

holidays_set = set()
for h in feiertage:
    s = parse_date(h["startStr"])
    e = parse_date(h["endStr"])
    for d in daterange(s, e):
        holidays_set.add(d)


def is_working_day(d: date) -> bool:
    return not is_weekend(d) and d not in holidays_set


# ---------- Anonymize existing employees ----------
used_names = set()
employees = []
for e in employees_src:
    new = copy.deepcopy(e)
    fn, ln = make_unique_names(1, used_names)[0]
    new["vorname"] = fn
    new["name"] = ln
    employees.append(new)


# ---------- Build new teams WAA & AUT ----------
def make_employee(team: str, type_: str, role_label: str = "iMA", fte_range=(0.8, 0.9),
                  betrieb_range=(10, 30), pauschal_range=(5, 15)):
    fte = round(random.uniform(*fte_range), 1)
    if fte > 0.95:
        fte = 0.9
    if fte < 0.75:
        fte = 0.8
    fn, ln = make_unique_names(1, used_names)[0]
    return {
        "id": str(uuid.uuid4()),
        "vorname": fn,
        "name": ln,
        "team": team,
        "type": type_,
        "fte": fte,
        "capacityPercent": 100,
        "betriebPercent": random.randint(*betrieb_range),
        "pauschalPercent": random.randint(*pauschal_range),
        "storyPointsPerDay": 1,
        "allocations": {},
    }


def make_role(team: str, role: str, fte_range=(0.8, 0.9), betrieb=10, pauschal=5):
    """Special role like PO/SM (tracked via type=iMA but flagged in allocations? Use vorname prefix)."""
    fn, ln = make_unique_names(1, used_names)[0]
    fte = round(random.uniform(*fte_range), 1)
    if fte > 0.95:
        fte = 0.9
    if fte < 0.75:
        fte = 0.8
    return {
        "id": str(uuid.uuid4()),
        "vorname": fn,
        "name": f"{ln} ({role})",
        "team": team,
        "type": "iMA",
        "fte": fte,
        "capacityPercent": 100,
        "betriebPercent": betrieb,
        "pauschalPercent": pauschal,
        "storyPointsPerDay": 1,
        "allocations": {},
    }


# WAA: 1 PO, 1 SM, 13 iMA, 3 eMA = 18
waa_members = []
waa_members.append(make_role("WAA", "PO", betrieb=10, pauschal=5))
waa_members.append(make_role("WAA", "SM", betrieb=10, pauschal=5))
for _ in range(13):
    waa_members.append(make_employee("WAA", "iMA"))
for _ in range(3):
    waa_members.append(make_employee("WAA", "eMA"))

# AUT: 1 PO, 1 SM, 6 iMA, 15 eMA = 23
aut_members = []
aut_members.append(make_role("AUT", "PO", betrieb=10, pauschal=5))
aut_members.append(make_role("AUT", "SM", betrieb=10, pauschal=5))
for _ in range(6):
    aut_members.append(make_employee("AUT", "iMA"))
for _ in range(15):
    aut_members.append(make_employee("AUT", "eMA"))

employees.extend(waa_members)
employees.extend(aut_members)


# ---------- Build virtual ATM team ----------
# 3 iMA from AUT
# 1 iMA + 2 eMA from ACM
# 3 iMA from CON
# 2 iMA from PAF
ATM_FRACTION = 0.30  # 30% of FTE goes to ATM


def pick_for_atm(team: str, type_: str, count: int) -> list:
    pool = [e for e in employees if e["team"] == team and e["type"] == type_
            and "(PO)" not in e["name"] and "(SM)" not in e["name"]]
    random.shuffle(pool)
    return pool[:count]


atm_source = []
atm_source += pick_for_atm("AUT", "iMA", 3)
atm_source += pick_for_atm("ACM", "iMA", 1)
atm_source += pick_for_atm("ACM", "eMA", 2)
atm_source += pick_for_atm("CON", "iMA", 3)
atm_source += pick_for_atm("PAF", "iMA", 2)

atm_members = []
for home_emp in atm_source:
    # Reduce home capacity
    new_home_cap = max(50, home_emp["capacityPercent"] - int(ATM_FRACTION * 100))
    home_emp["capacityPercent"] = new_home_cap
    # ATM mirror record
    atm_rec = {
        "id": str(uuid.uuid4()),
        "vorname": home_emp["vorname"],
        "name": home_emp["name"],
        "team": "ATM",
        "type": home_emp["type"],
        "fte": home_emp["fte"],
        "capacityPercent": int(ATM_FRACTION * 100),
        "betriebPercent": 0,
        "pauschalPercent": 0,
        "storyPointsPerDay": 1,
        "allocations": {},
    }
    atm_members.append(atm_rec)
employees.extend(atm_members)


# ---------- Two new PIs ----------
def make_pi(name: str, start: date, end: date, iter_starts: list) -> dict:
    """iter_starts: list of (start_date, end_date, iter_name) tuples."""
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "startStr": fmt(start),
        "endStr": fmt(end),
        "iterationen": [
            {
                "id": str(uuid.uuid4()),
                "name": iname,
                "startStr": fmt(istart),
                "endStr": fmt(iend),
            }
            for (istart, iend, iname) in iter_starts
        ],
    }


# PI26-2: 2026-06-04 (Thu) -> 2026-08-26 (Wed). 12 weeks total. Pattern from PI26-1.
pi262 = make_pi(
    "PI26-2",
    date(2026, 6, 4),
    date(2026, 8, 26),
    [
        (date(2026, 6, 4), date(2026, 6, 24), "Iteration 1"),
        (date(2026, 6, 25), date(2026, 7, 15), "Iteration 2"),
        (date(2026, 7, 16), date(2026, 8, 5), "Iteration 3"),
        (date(2026, 8, 20), date(2026, 8, 26), "Iteration 4 (IP)"),
    ],
)
# PI26-3: 2026-08-27 -> 2026-11-18. 12 weeks.
pi263 = make_pi(
    "PI26-3",
    date(2026, 8, 27),
    date(2026, 11, 18),
    [
        (date(2026, 8, 27), date(2026, 9, 16), "Iteration 1"),
        (date(2026, 9, 17), date(2026, 10, 7), "Iteration 2"),
        (date(2026, 10, 8), date(2026, 10, 28), "Iteration 3"),
        (date(2026, 11, 12), date(2026, 11, 18), "Iteration 4 (IP)"),
    ],
)
pis = pis_src + [pi262, pi263]

# ---------- Generate Pikett / Betrieb rotations for new PI range ----------
NEW_RANGE_START = date(2026, 6, 4)
NEW_RANGE_END = date(2026, 11, 18)

# Build week list (Mon-Sun) overlapping the range
weeks = []
first_monday = monday_of(NEW_RANGE_START)
cur = first_monday
while cur <= NEW_RANGE_END:
    week_end = cur + timedelta(days=6)
    weeks.append((cur, week_end))
    cur += timedelta(days=7)


def assign_rotation(team: str, kind: str, members: list):
    """
    Assign weekly rotation for `kind` ('PIKETT' or 'BETRIEB') to members of `team`.
    For each week in the new PI range, pick exactly ONE member to be on duty Mon-Sun.
    Pikett: same person not within 14 days after their last Pikett day.
    Both: same person max 1 consecutive week (rotate every week).
    """
    # Track each member's last duty end-date for this kind
    last_end = {m["id"]: None for m in members}
    # Track count for load-balance
    counts = {m["id"]: 0 for m in members}

    # Initialize last_end from existing allocations (so existing data is respected)
    for m in members:
        last = None
        for ds, code in m["allocations"].items():
            if code == kind:
                d = parse_date(ds)
                if last is None or d > last:
                    last = d
        last_end[m["id"]] = last

    for (wk_start, wk_end) in weeks:
        # Skip weeks completely outside new range
        if wk_end < NEW_RANGE_START or wk_start > NEW_RANGE_END:
            continue

        # Check: any member already booked this week for this kind in existing data?
        already_covered = False
        for m in members:
            for d in daterange(wk_start, wk_end):
                if m["allocations"].get(fmt(d)) == kind:
                    already_covered = True
                    break
            if already_covered:
                break
        if already_covered:
            continue

        # Find candidates respecting constraints
        candidates = []
        for m in members:
            le = last_end[m["id"]]
            if kind == "PIKETT":
                if le is not None and (wk_start - le).days < 15:
                    # Need >=14 days break: le + 14 < wk_start => wk_start - le > 14 => >= 15
                    continue
            else:  # BETRIEB: max 1 consecutive week
                if le is not None and (wk_start - le).days < 8:
                    continue

            # Also: not on any other duty/vacation that week already
            conflict = False
            for d in daterange(wk_start, wk_end):
                code = m["allocations"].get(fmt(d))
                if code in ("FERIEN", "ABWESEND", "MILITAER", "IPA", "PIKETT", "BETRIEB"):
                    conflict = True
                    break
            if conflict:
                continue
            candidates.append(m)

        if not candidates:
            # Relax for this week: drop conflict-with-other-duty filter (just need someone for kind constraint)
            for m in members:
                le = last_end[m["id"]]
                if kind == "PIKETT":
                    if le is not None and (wk_start - le).days < 15:
                        continue
                else:
                    if le is not None and (wk_start - le).days < 8:
                        continue
                # check conflict only with same kind already booked anywhere this week
                same_kind_conflict = False
                for d in daterange(wk_start, wk_end):
                    if m["allocations"].get(fmt(d)) in ("PIKETT", "BETRIEB"):
                        same_kind_conflict = True
                        break
                if same_kind_conflict:
                    continue
                candidates.append(m)

        if not candidates:
            print(f"  WARN: {team} {kind} no candidate for week {fmt(wk_start)}")
            continue

        # Prefer least-used (rotation fairness)
        candidates.sort(key=lambda m: (counts[m["id"]], random.random()))
        chosen = candidates[0]
        for d in daterange(wk_start, wk_end):
            chosen["allocations"][fmt(d)] = kind
        last_end[chosen["id"]] = wk_end
        counts[chosen["id"]] += 1


# ---------- Vacation top-up to 20-25 working days in 2026 ----------
def count_2026_ferien_workdays(emp) -> int:
    n = 0
    for ds, code in emp["allocations"].items():
        if code != "FERIEN":
            continue
        d = parse_date(ds)
        if d.year == 2026 and is_working_day(d):
            n += 1
    return n


VACATION_TARGET_MIN = 20
VACATION_TARGET_MAX = 25

# Candidate week-blocks (Mon-Fri) within 2026 PI range when employee is free
# We'll only top up in the new PI range to leave existing PI26-1 untouched

work_blocks = []  # list of (week_monday, list_of_workdays)
mon = monday_of(NEW_RANGE_START)
while mon <= NEW_RANGE_END:
    days = []
    for offset in range(5):  # Mon-Fri
        d = mon + timedelta(days=offset)
        if NEW_RANGE_START <= d <= NEW_RANGE_END and is_working_day(d):
            days.append(d)
    if days:
        work_blocks.append((mon, days))
    mon += timedelta(days=7)


def add_vacation(emp, target_min=20, target_max=25):
    blocks_shuffled = work_blocks.copy()
    random.shuffle(blocks_shuffled)

    for (wk_mon, days) in blocks_shuffled:
        have = count_2026_ferien_workdays(emp)
        if have >= target_min:
            break
        if have + len(days) > target_max:
            continue  # would overshoot 25
        conflict = False
        for d in days:
            if emp["allocations"].get(fmt(d)):
                conflict = True
                break
        if conflict:
            continue
        for d in days:
            emp["allocations"][fmt(d)] = "FERIEN"


def is_long_term_absent(emp) -> bool:
    """True if employee has >=30 days of ABWESEND/TEILZEIT/IPA/MILITAER in 2026."""
    n = 0
    for ds, code in emp["allocations"].items():
        if code in ("ABWESEND", "TEILZEIT", "IPA", "MILITAER"):
            d = parse_date(ds)
            if d.year == 2026 and is_working_day(d):
                n += 1
    return n >= 30


print("=== Generating vacation (vor Pikett/Betrieb) ===")
for emp in employees:
    if emp["team"] == "ATM":
        continue  # ATM mirrored later
    if is_long_term_absent(emp):
        continue  # Already heavily absent — no vacation top-up needed
    add_vacation(emp, VACATION_TARGET_MIN, VACATION_TARGET_MAX)


print("=== Generating Pikett & Betrieb rotations ===")
for team_name in ["ACM", "CON", "PAF", "WAA", "AUT"]:
    members = [e for e in employees if e["team"] == team_name]
    print(f"-- {team_name}: {len(members)} members")
    assign_rotation(team_name, "BETRIEB", members)
    assign_rotation(team_name, "PIKETT", members)


# ---------- Day-by-day gap fill (boundary weeks like PI26-1 -> PI26-2 transition) ----------
def fill_gaps_per_team(team: str, kind: str):
    """For each workday in new PI range that lacks 'kind' coverage, assign a single available member."""
    members = [e for e in employees if e["team"] == team]
    cur = NEW_RANGE_START
    while cur <= NEW_RANGE_END:
        if not is_working_day(cur):
            cur += timedelta(days=1)
            continue
        ds = fmt(cur)
        covered = any(m["allocations"].get(ds) == kind for m in members)
        if covered:
            cur += timedelta(days=1)
            continue
        # Find a candidate: not on any allocation today, satisfies gap rule
        candidates = []
        for m in members:
            if m["allocations"].get(ds):
                continue
            # Check Pikett 14-day rule (calendar days)
            if kind == "PIKETT":
                last_pikett = None
                for ds2, c2 in m["allocations"].items():
                    if c2 == "PIKETT":
                        d2 = parse_date(ds2)
                        if d2 < cur and (last_pikett is None or d2 > last_pikett):
                            last_pikett = d2
                if last_pikett and (cur - last_pikett).days < 15:
                    continue
            else:  # BETRIEB: max 1 consecutive week (7 days)
                # Check no Betrieb in past 6 days for this person
                conflict = False
                for back in range(1, 7):
                    if m["allocations"].get(fmt(cur - timedelta(days=back))) == "BETRIEB":
                        # OK if it's a continuation but won't exceed 7. Count consecutive.
                        pass
                # Simpler: count consecutive Betrieb days ending today-1
                run_len = 0
                back = 1
                while m["allocations"].get(fmt(cur - timedelta(days=back))) == "BETRIEB":
                    run_len += 1
                    back += 1
                if run_len >= 7:
                    continue
            candidates.append(m)
        if not candidates:
            print(f"  WARN: {team} {kind} kein Kandidat fuer Tag {ds}")
            cur += timedelta(days=1)
            continue
        # Prefer person with LEAST current count of this kind
        kind_count = lambda m: sum(1 for c in m["allocations"].values() if c == kind)
        candidates.sort(key=lambda m: (kind_count(m), random.random()))
        chosen = candidates[0]
        chosen["allocations"][ds] = kind
        cur += timedelta(days=1)


print("=== Filling boundary gaps ===")
for team_name in ["ACM", "CON", "PAF", "WAA", "AUT"]:
    fill_gaps_per_team(team_name, "BETRIEB")
    fill_gaps_per_team(team_name, "PIKETT")


# ---------- Mirror vacation onto ATM records ----------
print("=== Mirroring FERIEN to ATM records ===")
for emp in employees:
    if emp["team"] != "ATM":
        continue
    home = next((e for e in employees if e["vorname"] == emp["vorname"]
                 and e["name"] == emp["name"] and e["team"] != "ATM"), None)
    if home:
        for ds, code in home["allocations"].items():
            if code == "FERIEN":
                emp["allocations"][ds] = "FERIEN"


# ---------- piTeamTargets for new PIs ----------
# Generate plausible SP-Jira targets for all teams across all iterations
piTeamTargets = list(piTeamTargets_src)

base_sp = {
    "ACM": 140,
    "CON": 60,
    "PAF": 80,
    "WAA": 90,
    "AUT": 110,
    "ATM": 25,
}

for pi in [pi262, pi263]:
    for it in pi["iterationen"]:
        is_ip = "IP" in it["name"]
        for team, base in base_sp.items():
            sp = round(base * (0.3 if is_ip else random.uniform(0.85, 1.05)), 1)
            piTeamTargets.append({
                "piId": pi["id"],
                "iterationId": it["id"],
                "teamName": team,
                "spJira": sp,
            })


# ---------- teamConfigs: add WAA, AUT, ATM ----------
existing_team_names = {tc["teamName"] for tc in teamConfigs}
for new_team in ["WAA", "AUT"]:
    if new_team not in existing_team_names:
        teamConfigs.append({
            "teamName": new_team,
            "minPikett": 1,
            "minBetrieb": 1,
            "storyPointsPerDay": 1,
            "hoursPerYear": 1600,
        })
if "ATM" not in existing_team_names:
    teamConfigs.append({
        "teamName": "ATM",
        "minPikett": 0,
        "minBetrieb": 0,
        "storyPointsPerDay": 1,
        "hoursPerYear": 1600,
    })


# ---------- Sort employee allocations chronologically (cosmetic) ----------
for e in employees:
    e["allocations"] = dict(sorted(e["allocations"].items()))


# ---------- Compose output ----------
out = {
    "version": "1.0",
    "exportedAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "appVersion": "1.0.0",
    "data": {
        "employees": employees,
        "pis": pis,
        "feiertage": feiertage,
        "schulferien": schulferien,
        "blocker": blocker,
        "farbConfig": farbConfig,
        "globalConfig": globalConfig,
        "teamConfigs": teamConfigs,
        "piTeamTargets": piTeamTargets,
    },
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"\n=== Wrote {OUTPUT} ===")
print(f"Total employees: {len(employees)}")
from collections import Counter
team_counts = Counter(e["team"] for e in employees)
for t in sorted(team_counts):
    print(f"  {t}: {team_counts[t]}")
print(f"PIs: {[p['name'] for p in pis]}")
print(f"piTeamTargets entries: {len(piTeamTargets)}")
