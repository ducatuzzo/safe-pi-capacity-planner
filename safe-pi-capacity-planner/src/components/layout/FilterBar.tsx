// Globale Filterleiste – wirkt in allen Tabs gleichzeitig (Planung, Kapazität, Dashboard)

import { useMemo } from 'react';
import type { Employee, FilterState, PIPlanning } from '../../types';

interface FilterBarProps {
  employees: Employee[];
  pis: PIPlanning[];
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

export default function FilterBar({ employees, pis, filter, onFilterChange }: FilterBarProps) {
  const teams = useMemo(
    () => Array.from(new Set(employees.map(e => e.team))).sort(),
    [employees]
  );

  const years = useMemo(() => {
    const yearSet = new Set<number>();
    for (const pi of pis) {
      yearSet.add(new Date(pi.startStr).getUTCFullYear());
      yearSet.add(new Date(pi.endStr).getUTCFullYear());
    }
    return Array.from(yearSet).sort();
  }, [pis]);

  const availableIterations = useMemo(
    () => pis.find(p => p.id === filter.piId)?.iterationen ?? [],
    [pis, filter.piId]
  );

  const toggleTeam = (team: string) => {
    const newTeams = filter.teams.includes(team)
      ? filter.teams.filter(t => t !== team)
      : [...filter.teams, team];
    onFilterChange({ ...filter, teams: newTeams });
  };

  const handlePiChange = (piId: string) => {
    onFilterChange({ ...filter, piId: piId || null, iterationId: null });
  };

  const handleIterationChange = (iterationId: string) => {
    onFilterChange({ ...filter, iterationId: iterationId || null });
  };

  const handleYearChange = (year: string) => {
    onFilterChange({ ...filter, year: year ? parseInt(year) : null });
  };

  const handleReset = () => {
    onFilterChange({
      teams: [],
      piId: null,
      iterationId: null,
      year: null,
      dateFrom: null,
      dateTo: null,
    });
  };

  const hasActiveFilter =
    filter.teams.length > 0 ||
    filter.piId !== null ||
    filter.iterationId !== null ||
    filter.year !== null ||
    filter.dateFrom !== null ||
    filter.dateTo !== null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">

      {/* Team – Toggle-Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Team:</span>
        <div className="flex gap-1">
          {teams.map(team => (
            <button
              key={team}
              onClick={() => toggleTeam(team)}
              className={[
                'px-2 py-0.5 rounded text-xs border transition-colors',
                filter.teams.includes(team)
                  ? 'bg-bund-blau text-white border-bund-blau'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-bund-blau hover:text-bund-blau',
              ].join(' ')}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      {/* PI */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">PI:</label>
        <select
          value={filter.piId ?? ''}
          onChange={e => handlePiChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau"
        >
          <option value="">Alle PIs</option>
          {pis.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Iteration – nur aktiv wenn PI gewählt */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">Iteration:</label>
        <select
          value={filter.iterationId ?? ''}
          onChange={e => handleIterationChange(e.target.value)}
          disabled={!filter.piId}
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="">Alle Iterationen</option>
          {availableIterations.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      {/* Jahr */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500">Jahr:</label>
        <select
          value={filter.year ?? ''}
          onChange={e => handleYearChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau"
        >
          <option value="">Alle Jahre</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Zeitraum – überschreibt PI/Iteration wenn gesetzt */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Zeitraum:</label>
        <input
          type="date"
          value={filter.dateFrom ?? ''}
          onChange={e => onFilterChange({ ...filter, dateFrom: e.target.value || null })}
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau"
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="date"
          value={filter.dateTo ?? ''}
          onChange={e => onFilterChange({ ...filter, dateTo: e.target.value || null })}
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau"
        />
      </div>

      {/* Reset-Button – nur sichtbar wenn Filter aktiv */}
      {hasActiveFilter && (
        <button
          onClick={handleReset}
          className="ml-auto text-xs text-gray-500 hover:text-bund-rot border border-gray-300 hover:border-bund-rot rounded px-2 py-1 transition-colors whitespace-nowrap"
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
