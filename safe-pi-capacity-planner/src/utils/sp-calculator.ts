// SP-Berechnungslogik – pure functions, keine Seiteneffekte

import type {
  Employee,
  AppData,
  AllocationType,
  PIPlanning,
  Iteration,
  EmployeeSPResult,
  TeamSPResult,
  IterationSPResult,
  TeamConfig,
} from '../types';
import { getDaysInRange, toDateStr } from './calendar-helpers';

// ─── Konstanten ───────────────────────────────────────────────────────────────

const ABSENCE_TYPES = new Set<AllocationType>(['FERIEN', 'ABWESEND', 'MILITAER', 'IPA']);
const BETRIEB_TYPES = new Set<AllocationType>(['BETRIEB', 'BETRIEB_PIKETT']);
const PIKETT_TYPES = new Set<AllocationType>(['PIKETT', 'BETRIEB_PIKETT']);

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  return dow === 0 || dow === 6;
}

function isHoliday(dateStr: string, appData: AppData): boolean {
  return appData.feiertage.some(f => dateStr >= f.startStr && dateStr <= f.endStr);
}

function getSpRaw(allocation: AllocationType, spPerDay: number): number {
  if (allocation === 'NONE') return spPerDay;
  if (allocation === 'TEILZEIT') return spPerDay * 0.5;
  return 0;
}

/**
 * Liefert Pikett/Betrieb-Mindestwerte für ein Team.
 * Einzige Quelle: teamConfigs (TeamConfig mit minPikett/minBetrieb).
 * Kein Fallback mehr auf das deprecated TeamZielwerte.
 */
function getTeamMinimums(
  teamName: string,
  teamConfigs: TeamConfig[],
): { pikettMin: number; betriebMin: number } {
  const config = teamConfigs.find(t => t.teamName === teamName);
  return {
    pikettMin: config?.minPikett ?? 0,
    betriebMin: config?.minBetrieb ?? 0,
  };
}

// ─── Kern-Berechnungen ────────────────────────────────────────────────────────

/** SP-Berechnung für einen Mitarbeiter in einem Zeitraum */
export function calculateSPForEmployee(
  employee: Employee,
  startStr: string,
  endStr: string,
  appData: AppData,
): EmployeeSPResult {
  const days = getDaysInRange(startStr, endStr);
  let totalSP = 0;
  let workDays = 0;
  let absenceDays = 0;
  let betriebDays = 0;
  let pikettDays = 0;
  let teilzeitDays = 0;

  for (const day of days) {
    const ds = toDateStr(day);
    if (isWeekend(ds) || isHoliday(ds, appData)) continue;
    workDays++;

    const allocation: AllocationType = employee.allocations[ds] ?? 'NONE';

    if (ABSENCE_TYPES.has(allocation)) absenceDays++;
    if (BETRIEB_TYPES.has(allocation)) betriebDays++;
    if (PIKETT_TYPES.has(allocation)) pikettDays++;
    if (allocation === 'TEILZEIT') teilzeitDays++;

    const spRaw = getSpRaw(allocation, employee.storyPointsPerDay);
    const spNetto =
      spRaw *
      employee.fte *
      (1 - employee.betriebPercent / 100) *
      (1 - employee.pauschalPercent / 100);
    totalSP += spNetto;
  }

  return {
    employeeId: employee.id,
    employeeName: `${employee.vorname} ${employee.name}`,
    team: employee.team,
    availableSP: Math.round(totalSP * 10) / 10,
    workDays,
    absenceDays,
    betriebDays,
    pikettDays,
    teilzeitDays,
  };
}

/** SP-Berechnung für ein Team in einem Zeitraum, inkl. Pikett/Betrieb-Lücken */
export function calculateSPForTeam(
  employees: Employee[],
  startStr: string,
  endStr: string,
  appData: AppData,
  teamName: string,
): TeamSPResult {
  const teamEmployees = employees.filter(e => e.team === teamName);
  const employeeResults = teamEmployees.map(emp =>
    calculateSPForEmployee(emp, startStr, endStr, appData),
  );

  const totalAvailableSP =
    Math.round(employeeResults.reduce((sum, r) => sum + r.availableSP, 0) * 10) / 10;

  const { pikettMin, betriebMin } = getTeamMinimums(teamName, appData.teamConfigs ?? []);

  const pikettGaps: string[] = [];
  const betriebGaps: string[] = [];

  const days = getDaysInRange(startStr, endStr);
  for (const day of days) {
    const ds = toDateStr(day);
    const isWorkday = !isWeekend(ds) && !isHoliday(ds, appData);

    if (pikettMin > 0) {
      const pikettCount = teamEmployees.filter(emp =>
        PIKETT_TYPES.has(emp.allocations[ds] ?? 'NONE'),
      ).length;
      if (pikettCount < pikettMin) pikettGaps.push(ds);
    }

    if (isWorkday && betriebMin > 0) {
      const betriebCount = teamEmployees.filter(emp =>
        BETRIEB_TYPES.has(emp.allocations[ds] ?? 'NONE'),
      ).length;
      if (betriebCount < betriebMin) betriebGaps.push(ds);
    }
  }

  return {
    team: teamName,
    totalAvailableSP,
    employees: employeeResults,
    pikettGaps,
    betriebGaps,
  };
}

/** SP-Berechnung für alle Teams in einer Iteration */
export function calculateSPForIteration(
  employees: Employee[],
  iteration: Iteration,
  appData: AppData,
): IterationSPResult {
  const teamNames = [...new Set(employees.map(e => e.team))].sort();
  const teams = teamNames.map(name =>
    calculateSPForTeam(employees, iteration.startStr, iteration.endStr, appData, name),
  );
  const totalSP = Math.round(teams.reduce((sum, t) => sum + t.totalAvailableSP, 0) * 10) / 10;

  return {
    iterationName: iteration.name,
    startStr: iteration.startStr,
    endStr: iteration.endStr,
    teams,
    totalSP,
  };
}

/** SP-Berechnung für alle Iterationen eines PI */
export function calculateSPForPI(
  employees: Employee[],
  pi: PIPlanning,
  appData: AppData,
): IterationSPResult[] {
  return pi.iterationen.map(iter => calculateSPForIteration(employees, iter, appData));
}
