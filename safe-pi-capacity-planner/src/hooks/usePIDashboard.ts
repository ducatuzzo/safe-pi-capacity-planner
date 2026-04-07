// Hook: PI Dashboard – Daten pro PI / Team / Iteration
// SP in Jira wird in AppData (piTeamTargets) persistiert, alle anderen Werte berechnet.

import { useMemo } from 'react';
import type { Employee, AppData, PIPlanning, FilterState, PITeamTarget } from '../types';
import { calculateSPForTeam } from '../utils/sp-calculator';
import { getWorkingDays } from '../utils/calendar-helpers';

// ─── Typen ────────────────────────────────────────────────────────────────────

export interface PIDashboardIterationRow {
  iterationId: string;
  iterationName: string;
  startStr: string;
  endStr: string;
  betriebstage: number;
  spJira: number;           // manuell (piTeamTargets in AppData)
  berechnetSP: number;      // theoretisch: Arbeitstage × SP-Rate (ohne tagsgenaue Buchungen)
  verfuegbarSP: number;     // netto: aus sp-calculator (mit Buchungen, FTE, Betrieb%, Pauschale%)
  delta: number;            // verfuegbarSP – spJira (positiv = Puffer, negativ = Überlastet)
  auslastungJira: number;   // spJira / verfuegbarSP × 100
  auslastungApp: number;    // berechnetSP / verfuegbarSP × 100
}

export interface PIDashboardTeamData {
  team: string;
  rows: PIDashboardIterationRow[];
  totalBetriebstage: number;
  totalSpJira: number;
  totalBerechnetSP: number;
  totalVerfuegbarSP: number;
  totalDelta: number;
  auslastungJiraTotal: number;
  auslastungAppTotal: number;
}

export interface PIDashboardPIData {
  pi: PIPlanning;
  teams: PIDashboardTeamData[];
}

// ─── Hilfsfunktion: piTeamTargets-Lookup ─────────────────────────────────────

function findSpJira(
  targets: PITeamTarget[],
  piId: string,
  iterationId: string,
  team: string,
): number {
  return targets.find(
    t => t.piId === piId && t.iterationId === iterationId && t.teamName === team,
  )?.spJira ?? 0;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePIDashboard(
  employees: Employee[],
  pis: PIPlanning[],
  appData: AppData,
  filterState: FilterState,
  onSetSpJira: (piId: string, iterationId: string, team: string, value: number) => void,
): {
  data: PIDashboardPIData[];
  setSpJira: (piId: string, iterationId: string, team: string, value: number) => void;
} {
  const piTeamTargets = appData.piTeamTargets;

  // Mitarbeiter nach Team-Filter einschränken
  const filteredEmployees = useMemo(
    () => filterState.teams.length > 0
      ? employees.filter(e => filterState.teams.includes(e.team))
      : employees,
    [employees, filterState.teams],
  );

  // PIs nach Filter einschränken
  const filteredPIs = useMemo(() => {
    if (filterState.piId) return pis.filter(p => p.id === filterState.piId);
    if (filterState.year) {
      const y = filterState.year;
      return pis.filter(p =>
        new Date(p.startStr).getUTCFullYear() === y ||
        new Date(p.endStr).getUTCFullYear() === y,
      );
    }
    return pis;
  }, [pis, filterState.piId, filterState.year]);

  // Alle Teams im gefilterten Mitarbeiter-Set
  const teams = useMemo(
    () => [...new Set(filteredEmployees.map(e => e.team))].sort(),
    [filteredEmployees],
  );

  // Hauptberechnung
  const data = useMemo<PIDashboardPIData[]>(() =>
    filteredPIs.map(pi => {
      const iterations = pi.iterationen.length > 0
        ? pi.iterationen
        : [{ id: pi.id, name: pi.name, startStr: pi.startStr, endStr: pi.endStr }];

      const teamDataList: PIDashboardTeamData[] = teams.map(team => {
        const teamEmps = filteredEmployees.filter(e => e.team === team);

        const rows: PIDashboardIterationRow[] = iterations.map(iter => {
          // Arbeitstage (ohne Wochenenden/Feiertage)
          const workDays = getWorkingDays(iter.startStr, iter.endStr, appData.feiertage);
          const betriebstage = workDays.length;

          // Theoretische SP: Arbeitstage × SP-Rate pro Mitarbeiter (ohne tagsgenaue Buchungen)
          const berechnetSP = Math.round(
            teamEmps.reduce((sum, emp) =>
              sum + betriebstage * emp.storyPointsPerDay * emp.fte
                * (1 - emp.betriebPercent / 100)
                * (1 - emp.pauschalPercent / 100),
              0) * 10,
          ) / 10;

          // Netto-SP aus sp-calculator (tagsgenaue Buchungen berücksichtigt)
          const teamResult = calculateSPForTeam(
            filteredEmployees, iter.startStr, iter.endStr, appData, team,
          );
          const verfuegbarSP = teamResult.totalAvailableSP;

          const spJira = findSpJira(piTeamTargets, pi.id, iter.id, team);
          const delta = Math.round((verfuegbarSP - spJira) * 10) / 10;

          const auslastungJira = verfuegbarSP > 0
            ? Math.round((spJira / verfuegbarSP) * 1000) / 10
            : 0;
          const auslastungApp = verfuegbarSP > 0
            ? Math.round((berechnetSP / verfuegbarSP) * 1000) / 10
            : 0;

          return {
            iterationId: iter.id,
            iterationName: iter.name,
            startStr: iter.startStr,
            endStr: iter.endStr,
            betriebstage,
            spJira,
            berechnetSP,
            verfuegbarSP,
            delta,
            auslastungJira,
            auslastungApp,
          };
        });

        const totalBetriebstage = rows.reduce((s, r) => s + r.betriebstage, 0);
        const totalSpJira = rows.reduce((s, r) => s + r.spJira, 0);
        const totalBerechnetSP = Math.round(rows.reduce((s, r) => s + r.berechnetSP, 0) * 10) / 10;
        const totalVerfuegbarSP = Math.round(rows.reduce((s, r) => s + r.verfuegbarSP, 0) * 10) / 10;
        const totalDelta = Math.round((totalVerfuegbarSP - totalSpJira) * 10) / 10;

        return {
          team,
          rows,
          totalBetriebstage,
          totalSpJira,
          totalBerechnetSP,
          totalVerfuegbarSP,
          totalDelta,
          auslastungJiraTotal: totalVerfuegbarSP > 0
            ? Math.round((totalSpJira / totalVerfuegbarSP) * 1000) / 10 : 0,
          auslastungAppTotal: totalVerfuegbarSP > 0
            ? Math.round((totalBerechnetSP / totalVerfuegbarSP) * 1000) / 10 : 0,
        };
      });

      return { pi, teams: teamDataList };
    }),
  [filteredPIs, teams, filteredEmployees, appData, piTeamTargets]);

  return { data, setSpJira: onSetSpJira };
}
