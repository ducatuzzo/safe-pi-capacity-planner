import { useState, useCallback, useRef } from 'react';
import type { ActiveTab, AllocationType, AppData, Employee, FarbConfig, FilterState, PIPlanning, Feiertag, Schulferien, Blocker, TeamZielwerte, FullAppState, SavedProjectState } from './types';
import Header from './components/layout/Header';
import TabNav from './components/layout/TabNav';
import FilterBar from './components/layout/FilterBar';
import SettingsPage from './components/settings/SettingsPage';
import CalendarGrid from './components/calendar/CalendarGrid';
import KapazitaetView from './components/capacity/KapazitaetView';
import DashboardView from './components/dashboard/DashboardView';
import PIDashboardView from './components/pidashboard/PIDashboardView';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER } from './data/seed';
import { DEFAULT_FARB_CONFIG } from './constants';
import { useSocket } from './hooks/useSocket';
import type { SettingsChangeType } from './hooks/useSocket';

const INITIAL_FILTER: FilterState = {
  teams: [],
  piId: null,
  iterationId: null,
  year: null,
  dateFrom: null,
  dateTo: null,
};

const INITIAL_TEAM_ZIELWERTE: TeamZielwerte[] = [
  { team: 'NET', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'ACM', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'CON', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'PAF', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
];

// Benutzername für Row-Locking: einmalig pro Session generiert
function getSessionUserName(): string {
  const key = 'pi-planner-username';
  const stored = sessionStorage.getItem(key);
  if (stored) return stored;
  const name = `Benutzer ${Math.floor(Math.random() * 900) + 100}`;
  sessionStorage.setItem(key, name);
  return name;
}

function applyAllocationToList(
  prev: Employee[],
  employeeId: string,
  dateStr: string,
  type: AllocationType,
): Employee[] {
  return prev.map(emp => {
    if (emp.id !== employeeId) return emp;
    const newAllocations = { ...emp.allocations };
    if (type === 'NONE') {
      delete newAllocations[dateStr];
    } else {
      newAllocations[dateStr] = type;
    }
    return { ...emp, allocations: newAllocations };
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('planung');
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [pis, setPis] = useState<PIPlanning[]>(SEED_PIS);
  const [feiertage, setFeiertage] = useState<Feiertag[]>(SEED_FEIERTAGE);
  const [schulferien, setSchulferien] = useState<Schulferien[]>(SEED_SCHULFERIEN);
  const [blocker, setBlocker] = useState<Blocker[]>(SEED_BLOCKER);
  const [teamZielwerte, setTeamZielwerte] = useState<TeamZielwerte[]>(INITIAL_TEAM_ZIELWERTE);
  const [farbConfig, setFarbConfig] = useState<FarbConfig>(DEFAULT_FARB_CONFIG);
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);
  const [lockedRows, setLockedRows] = useState<Map<string, string>>(new Map());

  const userName = useRef(getSessionUserName());

  // Server-State vollständig anwenden (bei state:full Event)
  const applyServerState = useCallback((state: SavedProjectState) => {
    setEmployees(state.employees);
    setPis(state.appData.pis as PIPlanning[]);
    setFeiertage(state.appData.feiertage);
    setSchulferien(state.appData.schulferien);
    setBlocker(state.appData.blocker);
    setTeamZielwerte(state.appData.teamZielwerte);
  }, []);

  // Remote-Buchungsänderung: nur State setzen, kein Emit (Loop-Verhinderung)
  const handleRemoteAllocationChange = useCallback(
    (employeeId: string, dateStr: string, type: AllocationType) => {
      setEmployees(prev => applyAllocationToList(prev, employeeId, dateStr, type));
    },
    [],
  );

  // Remote-Settings-Änderung: nur State setzen, kein Emit
  const handleRemoteSettingsChange = useCallback(
    (type: SettingsChangeType, data: unknown) => {
      switch (type) {
        case 'employees':    setEmployees(data as Employee[]); break;
        case 'pis':          setPis(data as PIPlanning[]); break;
        case 'feiertage':    setFeiertage(data as Feiertag[]); break;
        case 'schulferien':  setSchulferien(data as Schulferien[]); break;
        case 'blocker':      setBlocker(data as Blocker[]); break;
        case 'teamZielwerte': setTeamZielwerte(data as TeamZielwerte[]); break;
      }
    },
    [],
  );

  const handleLockChange = useCallback(
    (employeeId: string, locked: boolean, lockerName?: string) => {
      setLockedRows(prev => {
        const next = new Map(prev);
        if (locked && lockerName) {
          next.set(employeeId, lockerName);
        } else {
          next.delete(employeeId);
        }
        return next;
      });
    },
    [],
  );

  const { emitAllocationChange, emitSettingsChange, emitLock, emitUnlock, isConnected } =
    useSocket({
      onAllocationChange: handleRemoteAllocationChange,
      onSettingsChange: handleRemoteSettingsChange,
      onLockChange: handleLockChange,
      onStateLoad: applyServerState,
    });

  // Lokale Buchungsänderung: State aktualisieren + an Server senden
  const handleAllocationChange = useCallback(
    (employeeId: string, dateStr: string, type: AllocationType) => {
      setEmployees(prev => applyAllocationToList(prev, employeeId, dateStr, type));
      emitAllocationChange(employeeId, dateStr, type);
    },
    [emitAllocationChange],
  );

  // Buchungen löschen + broadcast
  const handleClearAllocations = useCallback((employeeId?: string) => {
    setEmployees(prev => {
      const updated = prev.map(emp => {
        if (employeeId !== undefined && emp.id !== employeeId) return emp;
        return { ...emp, allocations: {} };
      });
      emitSettingsChange('employees', updated);
      return updated;
    });
  }, [emitSettingsChange]);

  // Settings-Wrapper: State setzen + broadcasten
  const handleEmployeesChange = useCallback((data: Employee[]) => {
    setEmployees(data);
    emitSettingsChange('employees', data);
  }, [emitSettingsChange]);

  const handlePisChange = useCallback((data: PIPlanning[]) => {
    setPis(data);
    emitSettingsChange('pis', data);
  }, [emitSettingsChange]);

  const handleFeiertageChange = useCallback((data: Feiertag[]) => {
    setFeiertage(data);
    emitSettingsChange('feiertage', data);
  }, [emitSettingsChange]);

  const handleSchulferienChange = useCallback((data: Schulferien[]) => {
    setSchulferien(data);
    emitSettingsChange('schulferien', data);
  }, [emitSettingsChange]);

  const handleBlockerChange = useCallback((data: Blocker[]) => {
    setBlocker(data);
    emitSettingsChange('blocker', data);
  }, [emitSettingsChange]);

  const handleTeamZielwerteChange = useCallback((data: TeamZielwerte[]) => {
    setTeamZielwerte(data);
    emitSettingsChange('teamZielwerte', data);
  }, [emitSettingsChange]);

  const handleFarbConfigChange = useCallback((data: FarbConfig) => {
    setFarbConfig(data);
  }, []);

  // Backup-Restore: lokal setzen + Server via POST /api/state informieren
  const handleRestore = useCallback((state: FullAppState) => {
    setEmployees(state.employees);
    setPis(state.pis as PIPlanning[]);
    setFeiertage(state.feiertage);
    setSchulferien(state.schulferien);
    setBlocker(state.blocker);
    if (state.teamZielwerte) setTeamZielwerte(state.teamZielwerte as TeamZielwerte[]);
    if (state.farbConfig) setFarbConfig(state.farbConfig);

    const fullState: SavedProjectState = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear(),
      employees: state.employees,
      appData: {
        feiertage: state.feiertage,
        schulferien: state.schulferien,
        pis: state.pis,
        blocker: state.blocker,
        teamZielwerte: (state.teamZielwerte as TeamZielwerte[]) ?? INITIAL_TEAM_ZIELWERTE,
      },
    };
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullState),
    }).catch(err => console.error('[Restore] POST /api/state fehlgeschlagen:', err));
  }, []);

  // Row-Locking: beim Drag-Start sperren, beim Drag-Ende freigeben
  const handleRowLock = useCallback((employeeId: string) => {
    emitLock(employeeId, userName.current);
  }, [emitLock]);

  const handleRowUnlock = useCallback((employeeId: string) => {
    emitUnlock(employeeId);
  }, [emitUnlock]);

  const appData: AppData = { feiertage, schulferien, pis, blocker, teamZielwerte };
  const showFilterBar = activeTab === 'planung' || activeTab === 'kapazitaet' || activeTab === 'dashboard' || activeTab === 'pidashboard';

  return (
    <div className="min-h-screen flex flex-col bg-bund-bg">
      <Header isConnected={isConnected} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {showFilterBar && (
        <FilterBar
          employees={employees}
          pis={pis}
          filter={filterState}
          onFilterChange={setFilterState}
        />
      )}
      <main className="flex-1 p-6">
        {activeTab === 'planung' && (
          <CalendarGrid
            employees={employees}
            pis={pis}
            feiertage={feiertage}
            schulferien={schulferien}
            blocker={blocker}
            filterState={filterState}
            farbConfig={farbConfig}
            lockedRows={lockedRows}
            onAllocationChange={handleAllocationChange}
            onClearAllocations={handleClearAllocations}
            onRowLock={handleRowLock}
            onRowUnlock={handleRowUnlock}
          />
        )}
        {activeTab === 'kapazitaet' && (
          <KapazitaetView
            employees={employees}
            pis={pis}
            appData={appData}
            filterState={filterState}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView
            employees={employees}
            pis={pis}
            appData={appData}
            filterState={filterState}
          />
        )}
        {activeTab === 'pidashboard' && (
          <PIDashboardView
            employees={employees}
            pis={pis}
            appData={appData}
            filterState={filterState}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            employees={employees}
            onEmployeesChange={handleEmployeesChange}
            pis={pis}
            onPisChange={handlePisChange}
            feiertage={feiertage}
            onFeiertageChange={handleFeiertageChange}
            schulferien={schulferien}
            onSchulferienChange={handleSchulferienChange}
            blocker={blocker}
            onBlockerChange={handleBlockerChange}
            teamZielwerte={teamZielwerte}
            onTeamZielwerteChange={handleTeamZielwerteChange}
            farbConfig={farbConfig}
            onFarbConfigChange={handleFarbConfigChange}
            onRestore={handleRestore}
          />
        )}
      </main>
    </div>
  );
}
