import React, { useMemo } from 'react';
import type { Employee, AppData, PIPlanning, IterationSPResult, FilterState } from '../../types';
import { calculateSPForIteration } from '../../utils/sp-calculator';

interface Props {
  employees: Employee[];
  pis: PIPlanning[];
  appData: AppData;
  filterState: FilterState;
}

export default function KapazitaetView({ employees, pis, appData, filterState }: Props) {
  // SP-Berechnung: Zeitraum und gefilterte Mitarbeiter aus globalem FilterState ableiten
  const result: IterationSPResult | null = useMemo(() => {
    // Mitarbeiter nach Team-Filter einschränken
    const filteredEmployees = filterState.teams.length > 0
      ? employees.filter(e => filterState.teams.includes(e.team))
      : employees;

    if (filteredEmployees.length === 0 || pis.length === 0) return null;

    // Zeitraum-Priorität: Zeitraum > Iteration > PI > Jahr > erster PI (Default)
    if (filterState.dateFrom && filterState.dateTo) {
      return calculateSPForIteration(filteredEmployees, {
        id: 'zeitraum', name: `${filterState.dateFrom} – ${filterState.dateTo}`,
        startStr: filterState.dateFrom, endStr: filterState.dateTo,
      }, appData);
    }
    if (filterState.iterationId) {
      for (const pi of pis) {
        const iter = pi.iterationen.find(i => i.id === filterState.iterationId);
        if (iter) return calculateSPForIteration(filteredEmployees, iter, appData);
      }
    }
    if (filterState.piId) {
      const pi = pis.find(p => p.id === filterState.piId);
      if (pi) return calculateSPForIteration(filteredEmployees, {
        id: pi.id, name: `${pi.name} (Gesamt)`,
        startStr: pi.startStr, endStr: pi.endStr,
      }, appData);
    }
    if (filterState.year) {
      return calculateSPForIteration(filteredEmployees, {
        id: `year-${filterState.year}`, name: `Jahr ${filterState.year}`,
        startStr: `${filterState.year}-01-01`, endStr: `${filterState.year}-12-31`,
      }, appData);
    }
    // Default: erster PI
    const pi = pis[0];
    return calculateSPForIteration(filteredEmployees, {
      id: pi.id, name: `${pi.name} (Gesamt)`,
      startStr: pi.startStr, endStr: pi.endStr,
    }, appData);
  }, [employees, pis, filterState, appData]);

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

  return (
    <div className="space-y-4">
      {/* Zeitraum-Info */}
      {result && (
        <div className="text-xs text-gray-400">
          {result.startStr} – {result.endStr}
        </div>
      )}

      {/* Ergebnistabelle */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bund-blau text-white text-left">
                <th className="px-4 py-2.5 font-medium">Mitarbeiter</th>
                <th className="px-4 py-2.5 font-medium">Team</th>
                <th className="text-right px-4 py-2.5 font-medium">Arbeitstage</th>
                <th className="text-right px-4 py-2.5 font-medium">Absenzen</th>
                <th className="text-right px-4 py-2.5 font-medium">Teilzeit</th>
                <th className="text-right px-4 py-2.5 font-medium">Betrieb</th>
                <th className="text-right px-4 py-2.5 font-medium">SP verfügbar</th>
              </tr>
            </thead>
            <tbody>
              {result.teams.map(teamResult => (
                <React.Fragment key={teamResult.team}>
                  {/* Mitarbeiter-Zeilen */}
                  {teamResult.employees.map((emp, idx) => (
                    <tr
                      key={emp.employeeId}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-2 text-gray-800">{emp.employeeName}</td>
                      <td className="px-4 py-2 text-gray-500">{emp.team}</td>
                      <td className="text-right px-4 py-2 text-gray-700 tabular-nums">{emp.workDays}</td>
                      <td className="text-right px-4 py-2 text-gray-700 tabular-nums">{emp.absenceDays}</td>
                      <td className="text-right px-4 py-2 text-gray-700 tabular-nums">{emp.teilzeitDays}</td>
                      <td className="text-right px-4 py-2 text-gray-700 tabular-nums">{emp.betriebDays}</td>
                      <td className="text-right px-4 py-2 font-semibold tabular-nums text-bund-blau">
                        {emp.availableSP.toFixed(1)}
                      </td>
                    </tr>
                  ))}

                  {/* Team-Summenzeile */}
                  <tr className="border-t border-blue-100 bg-blue-50 text-bund-blau">
                    <td className="px-4 py-2 font-semibold" colSpan={2}>
                      Team {teamResult.team} – Gesamt
                    </td>
                    <td className="text-right px-4 py-2 font-semibold tabular-nums">
                      {teamResult.employees.reduce((s, e) => s + e.workDays, 0)}
                    </td>
                    <td className="text-right px-4 py-2 font-semibold tabular-nums">
                      {teamResult.employees.reduce((s, e) => s + e.absenceDays, 0)}
                    </td>
                    <td className="text-right px-4 py-2 font-semibold tabular-nums">
                      {teamResult.employees.reduce((s, e) => s + e.teilzeitDays, 0)}
                    </td>
                    <td className="text-right px-4 py-2 font-semibold tabular-nums">
                      {teamResult.employees.reduce((s, e) => s + e.betriebDays, 0)}
                    </td>
                    <td className="text-right px-4 py-2 font-bold text-base tabular-nums">
                      {teamResult.totalAvailableSP.toFixed(1)}
                    </td>
                  </tr>

                  {/* Pikett-Lücken */}
                  {teamResult.pikettGaps.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-1.5 bg-red-50 border-t border-red-100">
                        <span className="text-red-600 font-medium text-xs">
                          Pikett-Lücken ({teamResult.pikettGaps.length} Tage):
                        </span>
                        <span className="text-red-500 text-xs ml-2">
                          {teamResult.pikettGaps.slice(0, 10).join(', ')}
                          {teamResult.pikettGaps.length > 10 &&
                            ` … +${teamResult.pikettGaps.length - 10} weitere`}
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* Betrieb-Unterbesetzung */}
                  {teamResult.betriebGaps.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-1.5 bg-orange-50 border-t border-orange-100">
                        <span className="text-orange-600 font-medium text-xs">
                          Betrieb-Unterbesetzung ({teamResult.betriebGaps.length} Tage):
                        </span>
                        <span className="text-orange-500 text-xs ml-2">
                          {teamResult.betriebGaps.slice(0, 10).join(', ')}
                          {teamResult.betriebGaps.length > 10 &&
                            ` … +${teamResult.betriebGaps.length - 10} weitere`}
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            {/* Gesamt-Fusszeile */}
            <tfoot>
              <tr className="bg-bund-blau text-white">
                <td className="px-4 py-3 font-bold" colSpan={6}>Gesamt {result.iterationName}</td>
                <td className="text-right px-4 py-3 font-bold text-base tabular-nums">
                  {result.totalSP.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
