// Hauptkomponente: Horizontaler Kalender-Grid mit Mitarbeitern als Zeilen

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Employee, PIPlanning, Feiertag, Schulferien, Blocker, AppData, AllocationType, FilterState, FarbConfig } from '../../types';
import { BUCHUNGSTYP_LABEL } from '../../constants';
import {
  getDaysInRange,
  getDayMeta,
  toDateStr,
} from '../../utils/calendar-helpers';
import type { DayMeta } from '../../utils/calendar-helpers';
import CalendarHeader from './CalendarHeader';
import CalendarCell from './CalendarCell';

const BUCHUNGSTYPEN: AllocationType[] = [
  'FERIEN', 'ABWESEND', 'TEILZEIT', 'MILITAER', 'IPA', 'BETRIEB', 'BETRIEB_PIKETT', 'PIKETT',
];

interface CalendarGridProps {
  employees: Employee[];
  pis: PIPlanning[];
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  blocker: Blocker[];
  filterState: FilterState;
  farbConfig: FarbConfig;
  lockedRows?: Map<string, string>; // employeeId → lockerName (gesperrt durch anderen User)
  onAllocationChange: (employeeId: string, dateStr: string, type: AllocationType) => void;
  onClearAllocations: (employeeId?: string) => void;
  onRowLock?: (employeeId: string) => void;
  onRowUnlock?: (employeeId: string) => void;
}

export default function CalendarGrid({
  employees, pis, feiertage, schulferien, blocker, filterState, farbConfig,
  lockedRows, onAllocationChange, onClearAllocations, onRowLock, onRowUnlock,
}: CalendarGridProps) {

  // Drag-Buchungs-State
  const [selectedType, setSelectedType] = useState<AllocationType>('FERIEN');
  const isDragging = useRef(false);
  const dragEmployeeId = useRef<string | null>(null);
  const dragIsDeleting = useRef(false); // true = Drag löscht Buchungen
  const dragLastIndex = useRef<number>(-1); // letzter verarbeiteter Tages-Index (für Range-Interpolation)
  const onRowUnlockRef = useRef(onRowUnlock);
  useEffect(() => { onRowUnlockRef.current = onRowUnlock; });

  // Globaler mouseup-Listener: verhindert "stuck drag" bei Maus ausserhalb
  useEffect(() => {
    const handleMouseUp = () => {
      if (dragEmployeeId.current) onRowUnlockRef.current?.(dragEmployeeId.current);
      isDragging.current = false;
      dragEmployeeId.current = null;
      dragIsDeleting.current = false;
      dragLastIndex.current = -1;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const isNonWorkday = (meta: DayMeta) =>
    meta.type === 'wochenende' || meta.type === 'feiertag';
  const isPikettType = (type: AllocationType) =>
    type === 'PIKETT' || type === 'BETRIEB_PIKETT';

  // Maus gedrückt: Drag starten, erste Zelle buchen oder löschen (Toggle)
  const handleCellMouseDown = (
    employeeId: string,
    dateStr: string,
    meta: DayMeta,
    currentAllocation: AllocationType,
    dayIndex: number,
  ) => {
    if (isNonWorkday(meta) && !isPikettType(selectedType)) return;
    if (lockedRows?.has(employeeId)) return; // Zeile durch anderen User gesperrt
    isDragging.current = true;
    dragEmployeeId.current = employeeId;
    dragLastIndex.current = dayIndex;
    onRowLock?.(employeeId);
    // Toggle: gleicher Typ bereits gesetzt → löschen; sonst setzen
    const newType = currentAllocation === selectedType ? 'NONE' : selectedType;
    dragIsDeleting.current = newType === 'NONE';
    onAllocationChange(employeeId, dateStr, newType);
  };

  // Maus betritt Zelle während Drag: Range-Interpolation — alle Zellen zwischen
  // letztem und aktuellem Index setzen (verhindert übersprungene Zellen bei schneller Mausbewegung)
  const handleCellMouseEnter = (
    employeeId: string,
    _dateStr: string,
    _meta: DayMeta,
    dayIndex: number,
  ) => {
    if (!isDragging.current || dragEmployeeId.current !== employeeId) return;
    const type = dragIsDeleting.current ? 'NONE' : selectedType;
    const start = Math.min(dragLastIndex.current, dayIndex);
    const end = Math.max(dragLastIndex.current, dayIndex);
    for (let i = start; i <= end; i++) {
      const cellMeta = dayMetas[i];
      if (isNonWorkday(cellMeta) && !isPikettType(selectedType)) continue;
      onAllocationChange(employeeId, toDateStr(visibleDays[i]), type);
    }
    dragLastIndex.current = dayIndex;
  };

  const appData: AppData = useMemo(() => ({
    feiertage,
    schulferien,
    pis,
    blocker,
    teamZielwerte: [],
    globalConfig: { spPerDay: 1, hoursPerYear: 1600 },
    teamConfigs: [],
    piTeamTargets: [],
  }), [feiertage, schulferien, pis, blocker]);

  const visibleDays = useMemo((): Date[] => {
    // Zeitraum hat Vorrang vor allen anderen Filtern
    if (filterState.dateFrom && filterState.dateTo) {
      return getDaysInRange(filterState.dateFrom, filterState.dateTo);
    }
    if (filterState.iterationId) {
      for (const pi of pis) {
        const iter = pi.iterationen.find(i => i.id === filterState.iterationId);
        if (iter) return getDaysInRange(iter.startStr, iter.endStr);
      }
    }
    if (filterState.piId) {
      const pi = pis.find(p => p.id === filterState.piId);
      if (pi) return getDaysInRange(pi.startStr, pi.endStr);
    }
    if (filterState.year) {
      return getDaysInRange(`${filterState.year}-01-01`, `${filterState.year}-12-31`);
    }
    if (pis.length === 0) {
      const year = new Date().getUTCFullYear();
      return getDaysInRange(`${year}-01-01`, `${year}-12-31`);
    }
    const sorted = [...pis].sort((a, b) => a.startStr.localeCompare(b.startStr));
    const latestEnd = sorted.reduce((max, p) => (p.endStr > max ? p.endStr : max), sorted[0].endStr);
    return getDaysInRange(sorted[0].startStr, latestEnd);
  }, [pis, filterState]);

  const visibleEmployees = useMemo(
    () => filterState.teams.length > 0
      ? employees.filter(e => filterState.teams.includes(e.team))
      : employees,
    [employees, filterState.teams]
  );

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  const dayMetas = useMemo(
    () => visibleDays.map(d => getDayMeta(d, appData)),
    [visibleDays, appData]
  );

  const isTodayArray = useMemo(
    () => visibleDays.map(d => toDateStr(d) === todayStr),
    [visibleDays, todayStr]
  );

  if (pis.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Keine PIs definiert. Bitte zuerst unter Einstellungen → PI-Planung erfassen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: Statistik + Aktionen */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">
          {visibleDays.length} Tage · {visibleEmployees.length} Mitarbeiter
        </span>
      </div>

      {/* Kalender-Tabelle */}
      <div className="overflow-auto max-h-[calc(100vh-300px)] border border-gray-200 rounded shadow-sm">
        <table className="border-collapse text-xs">
          <CalendarHeader days={visibleDays} pis={pis} todayStr={todayStr} blockers={blocker} farbConfig={farbConfig} />
          <tbody>
            {visibleEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleDays.length + 1}
                  className="px-3 py-8 text-center text-gray-400"
                >
                  {employees.length === 0
                    ? 'Keine Mitarbeiter erfasst. Bitte unter Einstellungen → Mitarbeiter anlegen.'
                    : 'Keine Mitarbeiter für die gewählten Filter.'}
                </td>
              </tr>
            ) : (
              visibleEmployees.map(emp => {
                const lockerName = lockedRows?.get(emp.id);
                const isLocked = !!lockerName;
                return (
                <tr key={emp.id} className={`group${isLocked ? ' opacity-50' : ''}`}>
                  {/* Mitarbeiter-Name mit Löschen-Button (erscheint bei Hover) */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border border-gray-200 px-2 h-7 whitespace-nowrap min-w-[160px] w-[160px] align-middle">
                    <div className="flex items-center justify-between gap-1">
                      <span>
                        <span className="font-medium text-gray-800">{emp.vorname} {emp.name}</span>
                        <span className="ml-1 text-gray-400 text-[10px]">{emp.team}</span>
                        {isLocked && (
                          <span
                            className="ml-1 text-[10px] text-amber-600"
                            title={`Gesperrt von ${lockerName}`}
                          >
                            🔒
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => onClearAllocations(emp.id)}
                        title="Alle Buchungen dieses Mitarbeiters löschen"
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 text-[10px] leading-none transition-opacity flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                  {visibleDays.map((day, i) => (
                    <CalendarCell
                      key={toDateStr(day)}
                      date={day}
                      employee={emp}
                      dayMeta={dayMetas[i]}
                      isToday={isTodayArray[i]}
                      selectedType={selectedType}
                      dayIndex={i}
                      farbConfig={farbConfig}
                      onMouseDown={handleCellMouseDown}
                      onMouseEnter={handleCellMouseEnter}
                    />
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legende mit klickbaren Buchungstypen */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 p-3 bg-white border border-gray-200 rounded text-xs text-gray-700">
        <span className="font-medium text-gray-600 self-center">Buchungstyp:</span>

        {/* Klickbare Buchungstypen */}
        {BUCHUNGSTYPEN.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={[
              'flex items-center gap-1 px-2 py-0.5 rounded border transition-all',
              selectedType === type
                ? 'border-bund-blau ring-2 ring-bund-blau font-bold scale-105'
                : 'border-transparent hover:border-gray-300',
            ].join(' ')}
            title={
              type === 'PIKETT' || type === 'BETRIEB_PIKETT'
                ? 'Auch Wochenenden und Feiertage buchbar (7×24)'
                : undefined
            }
          >
            <span
              className="inline-block w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: farbConfig.buchungstypen[type].bg }}
            />
            {BUCHUNGSTYP_LABEL[type]}
            {(type === 'PIKETT' || type === 'BETRIEB_PIKETT') && (
              <span className="text-gray-400 ml-0.5">7×24</span>
            )}
          </button>
        ))}

        {/* Trennlinie */}
        <span className="border-l border-gray-200 mx-1 self-stretch" />

        {/* Kalender-Info (nicht buchbar, nur Legende) */}
        <span className="font-medium text-gray-600 self-center">Kalender:</span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-4 rounded-sm"
            style={{ backgroundColor: farbConfig.kalender.feiertag.bg }}
          />
          Feiertag
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-4 rounded-sm"
            style={{ backgroundColor: farbConfig.kalender.schulferien.bg }}
          />
          Schulferien
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-4 rounded-sm text-center text-[10px] leading-4"
            style={{ backgroundColor: farbConfig.kalender.blocker.bg }}
          >❄️</span>
          Blocker (Header)
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-4 rounded-sm"
            style={{ backgroundColor: farbConfig.kalender.wochenende.bg }}
          />
          Wochenende
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-4 rounded-sm border"
            style={{ backgroundColor: '#FEF2F2', borderColor: farbConfig.kalender.heute.text }}
          />
          <span style={{ color: farbConfig.kalender.heute.text, fontWeight: farbConfig.kalender.heute.bold ? 'bold' : 'normal' }}>
            Heute
          </span>
        </span>
      </div>
    </div>
  );
}
