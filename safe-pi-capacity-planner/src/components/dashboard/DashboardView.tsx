// Dashboard: Kapazitäts-Übersicht mit KPIs, Diagramm, Absenz-Tabelle, Lücken-Erkennung
import { useMemo, useState } from 'react';
import { Download, FileImage } from 'lucide-react';
import type { Employee, AppData, PIPlanning, FilterState, Iteration, IterationSPResult } from '../../types';
import { calculateSPForIteration, calculateSPForTeam } from '../../utils/sp-calculator';
import { getDaysInRange, toDateStr } from '../../utils/calendar-helpers';
import { exportToPDF, exportToPNG } from '../../utils/export-utils';
import bundeslogo from '../../assets/bundeslogo.png';
import KPICards from './KPICards';
import SPBarChart from './SPBarChart';
import AbsenzTabelle from './AbsenzTabelle';
import type { AbsenzRow } from './AbsenzTabelle';
import LueckenListe from './LueckenListe';

interface DashboardViewProps {
  employees: Employee[];
  pis: PIPlanning[];
  appData: AppData;
  filterState: FilterState;
}

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

/** Iterationen für das Balkendiagramm aus dem aktiven Filter ableiten */
function getChartIterations(pis: PIPlanning[], filterState: FilterState): Iteration[] {
  if (filterState.dateFrom && filterState.dateTo) {
    return [{
      id: 'zeitraum',
      name: `${filterState.dateFrom} – ${filterState.dateTo}`,
      startStr: filterState.dateFrom,
      endStr: filterState.dateTo,
    }];
  }
  if (filterState.iterationId) {
    for (const pi of pis) {
      const iter = pi.iterationen.find(i => i.id === filterState.iterationId);
      if (iter) return [iter];
    }
  }
  if (filterState.piId) {
    const pi = pis.find(p => p.id === filterState.piId);
    if (pi && pi.iterationen.length > 0) return pi.iterationen;
    if (pi) return [{ id: pi.id, name: pi.name, startStr: pi.startStr, endStr: pi.endStr }];
  }
  if (filterState.year) {
    const yearStart = `${filterState.year}-01-01`;
    const yearEnd = `${filterState.year}-12-31`;
    const iters: Iteration[] = [];
    for (const pi of pis) {
      for (const iter of pi.iterationen) {
        if (iter.endStr >= yearStart && iter.startStr <= yearEnd) {
          iters.push(iter);
        }
      }
    }
    if (iters.length > 0) return iters;
  }
  // Default: Iterationen des ersten PI
  if (pis.length > 0 && pis[0].iterationen.length > 0) return pis[0].iterationen;
  if (pis.length > 0) return [{ id: pis[0].id, name: pis[0].name, startStr: pis[0].startStr, endStr: pis[0].endStr }];
  return [];
}

/** Gesamtperiode (Start/End) aus den Chart-Iterationen ableiten */
function getOverallPeriod(chartIterations: Iteration[]): { startStr: string; endStr: string } | null {
  if (chartIterations.length === 0) return null;
  const start = chartIterations.reduce((min, i) => i.startStr < min ? i.startStr : min, chartIterations[0].startStr);
  const end = chartIterations.reduce((max, i) => i.endStr > max ? i.endStr : max, chartIterations[0].endStr);
  return { startStr: start, endStr: end };
}

/** Absenz-Tage pro Buchungstyp pro Mitarbeiter im Zeitraum zählen */
function computeAbsenzRows(
  employees: Employee[],
  startStr: string,
  endStr: string,
  appData: AppData
): AbsenzRow[] {
  const feiertage = appData.feiertage;
  return employees.map(emp => {
    let ferienDays = 0;
    let abwesendDays = 0;
    let militaerDays = 0;
    let ipaDays = 0;
    let betriebDays = 0;
    let pikettDays = 0;

    for (const day of getDaysInRange(startStr, endStr)) {
      const ds = toDateStr(day);
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue;
      if (feiertage.some(f => ds >= f.startStr && ds <= f.endStr)) continue;

      const alloc = emp.allocations[ds];
      if (!alloc || alloc === 'NONE') continue;

      switch (alloc) {
        case 'FERIEN':         ferienDays++;   break;
        case 'ABWESEND':       abwesendDays++; break;
        case 'MILITAER':       militaerDays++; break;
        case 'IPA':            ipaDays++;      break;
        case 'BETRIEB':        betriebDays++;  break;
        case 'BETRIEB_PIKETT': betriebDays++; pikettDays++; break;
        case 'PIKETT':         pikettDays++;   break;
      }
    }

    return {
      employeeId: emp.id,
      employeeName: `${emp.vorname} ${emp.name}`,
      team: emp.team,
      ferienDays,
      abwesendDays,
      militaerDays,
      ipaDays,
      betriebDays,
      pikettDays,
    };
  });
}

/** Lesbarer Filter-Label für den Export-Kopf */
function buildFilterLabel(filterState: FilterState, pis: PIPlanning[]): string {
  const parts: string[] = [];
  if (filterState.teams.length > 0) parts.push(`Team: ${filterState.teams.join(', ')}`);
  if (filterState.piId) {
    const pi = pis.find(p => p.id === filterState.piId);
    if (pi) parts.push(`PI: ${pi.name}`);
  }
  if (filterState.iterationId) {
    for (const pi of pis) {
      const iter = pi.iterationen.find(i => i.id === filterState.iterationId);
      if (iter) { parts.push(`Iteration: ${iter.name}`); break; }
    }
  }
  if (filterState.year) parts.push(`Jahr: ${filterState.year}`);
  if (filterState.dateFrom && filterState.dateTo) parts.push(`${filterState.dateFrom} – ${filterState.dateTo}`);
  return parts.length > 0 ? parts.join(' | ') : 'Alle Daten';
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

export default function DashboardView({ employees, pis, appData, filterState }: DashboardViewProps) {
  const [exportLoading, setExportLoading] = useState<'pdf' | 'png' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (pis.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Keine PIs definiert. Bitte zuerst PI-Planung unter Einstellungen erfassen.</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Keine Mitarbeiter erfasst. Bitte zuerst Mitarbeiter unter Einstellungen erfassen.</p>
      </div>
    );
  }

  // Mitarbeiter nach Team-Filter einschränken
  const filteredEmployees = useMemo(
    () => filterState.teams.length > 0
      ? employees.filter(e => filterState.teams.includes(e.team))
      : employees,
    [employees, filterState.teams]
  );

  // Chart-Iterationen und Gesamtperiode bestimmen
  const chartIterations = useMemo(
    () => getChartIterations(pis, filterState),
    [pis, filterState]
  );

  const overallPeriod = useMemo(
    () => getOverallPeriod(chartIterations),
    [chartIterations]
  );

  // SP-Ergebnis pro Iteration (für Balkendiagramm)
  const iterationResults: IterationSPResult[] = useMemo(
    () => chartIterations.map(iter => calculateSPForIteration(filteredEmployees, iter, appData)),
    [filteredEmployees, chartIterations, appData]
  );

  // SP-Ergebnis für Gesamtperiode (für Lücken-Erkennung und KPIs)
  const overallTeamResults = useMemo(() => {
    if (!overallPeriod) return [];
    const teamNames = [...new Set(filteredEmployees.map(e => e.team))].sort();
    return teamNames.map(team =>
      calculateSPForTeam(filteredEmployees, overallPeriod.startStr, overallPeriod.endStr, appData, team)
    );
  }, [filteredEmployees, overallPeriod, appData]);

  // KPI-Werte
  const totalSP = useMemo(
    () => Math.round(overallTeamResults.reduce((s, t) => s + t.totalAvailableSP, 0) * 10) / 10,
    [overallTeamResults]
  );
  const totalPikettGaps = useMemo(
    () => overallTeamResults.reduce((s, t) => s + t.pikettGaps.length, 0),
    [overallTeamResults]
  );
  const totalBetriebGaps = useMemo(
    () => overallTeamResults.reduce((s, t) => s + t.betriebGaps.length, 0),
    [overallTeamResults]
  );

  // Absenz-Tabellendaten
  const absenzRows: AbsenzRow[] = useMemo(() => {
    if (!overallPeriod) return [];
    return computeAbsenzRows(filteredEmployees, overallPeriod.startStr, overallPeriod.endStr, appData);
  }, [filteredEmployees, overallPeriod, appData]);

  // Filter-Label für Export
  const filterLabel = useMemo(() => buildFilterLabel(filterState, pis), [filterState, pis]);
  const today = new Date().toISOString().split('T')[0];

  async function handleExportPDF() {
    setExportError(null);
    setExportLoading('pdf');
    try {
      await exportToPDF('export-container', `safe-pi-planner_${today}.pdf`);
    } catch (e) {
      console.error('PDF-Export fehlgeschlagen:', e);
      setExportError('PDF-Export fehlgeschlagen.');
    } finally {
      setExportLoading(null);
    }
  }

  async function handleExportPNG() {
    setExportError(null);
    setExportLoading('png');
    try {
      await exportToPNG('export-container', `safe-pi-planner_${today}.png`);
    } catch (e) {
      console.error('PNG-Export fehlgeschlagen:', e);
      setExportError('PNG-Export fehlgeschlagen.');
    } finally {
      setExportLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Export-Buttons */}
      <div className="flex items-center justify-end gap-2">
        {exportError && (
          <span className="text-xs text-red-600 mr-2">{exportError}</span>
        )}
        <button
          onClick={handleExportPDF}
          disabled={exportLoading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003F7F] text-white text-sm rounded hover:bg-[#002D5C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={15} />
          {exportLoading === 'pdf' ? 'Exportiere…' : 'PDF'}
        </button>
        <button
          onClick={handleExportPNG}
          disabled={exportLoading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003F7F] text-white text-sm rounded hover:bg-[#002D5C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileImage size={15} />
          {exportLoading === 'png' ? 'Exportiere…' : 'PNG'}
        </button>
      </div>

      {/* Export-Container: dieser Bereich wird als PDF/PNG exportiert */}
      <div id="export-container" className="space-y-6 bg-white p-4 rounded-lg">
        {/* Export-Kopfzeile: Logo + Filter-Info */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <img src={bundeslogo} alt="Schweizerische Eidgenossenschaft" className="h-10" />
          <div className="text-right">
            <div className="text-sm font-semibold text-[#003F7F]">SAFe PI Capacity Planner</div>
            <div className="text-xs text-gray-500">{filterLabel}</div>
          </div>
        </div>

        {/* Zeitraum-Info */}
        {overallPeriod && (
          <div className="text-xs text-gray-400">
            Zeitraum: {overallPeriod.startStr} – {overallPeriod.endStr}
            {chartIterations.length > 1 && ` (${chartIterations.length} Iterationen)`}
          </div>
        )}

        {/* KPI-Karten */}
        <KPICards
          totalSP={totalSP}
          employeeCount={filteredEmployees.length}
          pikettGapsCount={totalPikettGaps}
          betriebGapsCount={totalBetriebGaps}
        />

        {/* Balkendiagramm */}
        <SPBarChart
          iterationResults={iterationResults}
          filteredTeams={filterState.teams}
        />

        {/* Absenz-Tabelle & Lücken nebeneinander (ab lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LueckenListe teamResults={overallTeamResults} />
          <AbsenzTabelle rows={absenzRows} />
        </div>
      </div>
    </div>
  );
}
