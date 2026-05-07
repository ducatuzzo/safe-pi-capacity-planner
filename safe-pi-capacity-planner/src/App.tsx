import { useState, useCallback, useRef } from 'react';
import type { ActiveTab, AllocationType, AppData, Employee, FarbConfig, FilterState, PIPlanning, Feiertag, Schulferien, Blocker, FullAppState, SavedProjectState, GlobalCapacityConfig, TeamConfig, PITeamTarget } from './types';
import Header from './components/layout/Header';
import TabNav from './components/layout/TabNav';
import FilterBar from './components/layout/FilterBar';
import SettingsPage from './components/settings/SettingsPage';
import CalendarGrid from './components/calendar/CalendarGrid';
import KapazitaetView from './components/capacity/KapazitaetView';
import DashboardView from './components/dashboard/DashboardView';
import PIDashboardView from './components/pidashboard/PIDashboardView';
import AdminView from './components/admin/AdminView';
import TenantGate from './components/tenant/TenantGate';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER, SEED_GLOBAL_CONFIG, SEED_TEAM_CONFIGS } from './data/seed';
import { DEFAULT_FARB_CONFIG } from './constants';
import { useSocket } from './hooks/useSocket';
import type { SettingsChangeType } from './hooks/useSocket';
import { useTenant } from './hooks/useTenant';
import { migratePIs } from './utils/state-migration';

const INITIAL_FILTER: FilterState = {
  teams: [],
  piId: null,
  iterationId: null,
  year: null,
  dateFrom: null,
  dateTo: null,
};

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
  const { tenantId, tenantName, clearTenant } = useTenant();

  // Tenant-Gate: Falls kein Tenant ausgewählt, Auswahl-Screen zeigen
  if (!tenantId) return <TenantGate />;

  return <AppInner tenantId={tenantId} tenantName={tenantName} clearTenant={clearTenant} />;
}

interface AppInnerProps {
  tenantId: string;
  tenantName: string;
  clearTenant: () => void;
}

function AppInner({ tenantId, tenantName, clearTenant }: AppInnerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('planung');
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [pis, setPis] = useState<PIPlanning[]>(SEED_PIS);
  const [feiertage, setFeiertage] = useState<Feiertag[]>(SEED_FEIERTAGE);
  const [schulferien, setSchulferien] = useState<Schulferien[]>(SEED_SCHULFERIEN);
  const [blocker, setBlocker] = useState<Blocker[]>(SEED_BLOCKER);
  const [globalConfig, setGlobalConfig] = useState<GlobalCapacityConfig>(SEED_GLOBAL_CONFIG);
  const [teamConfigs, setTeamConfigs] = useState<TeamConfig[]>(SEED_TEAM_CONFIGS);
  const [piTeamTargets, setPiTeamTargets] = useState<PITeamTarget[]>([]);
  const [farbConfig, setFarbConfig] = useState<FarbConfig>(DEFAULT_FARB_CONFIG);
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);
  const [lockedRows, setLockedRows] = useState<Map<string, string>>(new Map());

  const userName = useRef(getSessionUserName());

  const applyServerState = useCallback((state: SavedProjectState) => {
    setEmployees(state.employees);
    // Schema-Migration auf 1.5 (Feature 29): blockerWeeks/zeremonien defaulten, Demo-PI26-2 entfernen
    setPis(migratePIs(state.appData.pis as PIPlanning[]));
    setFeiertage(state.appData.feiertage);
    setSchulferien(state.appData.schulferien);
    setBlocker(state.appData.blocker);
    setGlobalConfig(state.appData.globalConfig ?? SEED_GLOBAL_CONFIG);
    setTeamConfigs(state.appData.teamConfigs ?? SEED_TEAM_CONFIGS);
    setPiTeamTargets(state.appData.piTeamTargets ?? []);
  }, []);

  const handleRemoteAllocationChange = useCallback(
    (employeeId: string, dateStr: string, type: AllocationType) => {
      setEmployees(prev => applyAllocationToList(prev, employeeId, dateStr, type));
    },
    [],
  );

  const handleRemoteSettingsChange = useCallback(
    (type: SettingsChangeType, data: unknown) => {
      switch (type) {
        case 'employees':     setEmployees(data as Employee[]); break;
        case 'pis':           setPis(data as PIPlanning[]); break;
        case 'feiertage':     setFeiertage(data as Feiertag[]); break;
        case 'schulferien':   setSchulferien(data as Schulferien[]); break;
        case 'blocker':       setBlocker(data as Blocker[]); break;
        case 'globalConfig':  setGlobalConfig(data as GlobalCapacityConfig); break;
        case 'teamConfigs':   setTeamConfigs(data as TeamConfig[]); break;
        case 'piTeamTargets': setPiTeamTargets(data as PITeamTarget[]); break;
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
      tenantId,
      onAllocationChange: handleRemoteAllocationChange,
      onSettingsChange: handleRemoteSettingsChange,
      onLockChange: handleLockChange,
      onStateLoad: applyServerState,
    });

  const handleAllocationChange = useCallback(
    (employeeId: string, dateStr: string, type: AllocationType) => {
      setEmployees(prev => applyAllocationToList(prev, employeeId, dateStr, type));
      emitAllocationChange(employeeId, dateStr, type);
    },
    [emitAllocationChange],
  );

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

  const handleEmployeesChange = useCallback((data: Employee[]) => {
    setEmployees(data);
    emitSettingsChange('employees', data);
    setTeamConfigs(prev => {
      const newTeams = [...new Set(data.map(e => e.team))].filter(
        t => t && !prev.some(c => c.teamName === t),
      );
      if (newTeams.length === 0) return prev;
      const updated = [
        ...prev,
        ...newTeams.map(t => ({
          teamName: t,
          minPikett: 0,
          minBetrieb: 1,
          storyPointsPerDay: 1,
          hoursPerYear: 1600,
        })),
      ];
      emitSettingsChange('teamConfigs', updated);
      return updated;
    });
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

  const handleGlobalConfigChange = useCallback((data: GlobalCapacityConfig) => {
    setGlobalConfig(data);
    emitSettingsChange('globalConfig', data);
  }, [emitSettingsChange]);

  const handleTeamConfigsChange = useCallback((data: TeamConfig[]) => {
    setTeamConfigs(data);
    emitSettingsChange('teamConfigs', data);
  }, [emitSettingsChange]);

  const handlePiTeamTargetsChange = useCallback((data: PITeamTarget[]) => {
    setPiTeamTargets(data);
    emitSettingsChange('piTeamTargets', data);
  }, [emitSettingsChange]);

  const handleFarbConfigChange = useCallback((data: FarbConfig) => {
    setFarbConfig(data);
  }, []);

  const handleRestore = useCallback((state: FullAppState) => {
    setEmployees(state.employees);
    setPis(state.pis as PIPlanning[]);
    setFeiertage(state.feiertage);
    setSchulferien(state.schulferien);
    setBlocker(state.blocker);
    if (state.farbConfig) setFarbConfig(state.farbConfig);

    const restoredGlobalConfig = state.globalConfig ?? SEED_GLOBAL_CONFIG;
    const restoredPiTeamTargets = state.piTeamTargets ?? [];

    // Migration: alte teamZielwerte → neue teamConfigs falls nötig
    let restoredTeamConfigs = state.teamConfigs ?? [];
    if (restoredTeamConfigs.length === 0 && state.teamZielwerte && state.teamZielwerte.length > 0) {
      restoredTeamConfigs = state.teamZielwerte.map(z => ({
        teamName: z.team,
        minPikett: z.minPersonenPikett,
        minBetrieb: z.minPersonenBetrieb,
        storyPointsPerDay: z.storyPointsPerDay,
        hoursPerYear: z.standardstundenProJahr,
      }));
    }

    setGlobalConfig(restoredGlobalConfig);
    setTeamConfigs(restoredTeamConfigs);
    setPiTeamTargets(restoredPiTeamTargets);

    const fullState: SavedProjectState = {
      version: '1.6',
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear(),
      employees: state.employees,
      appData: {
        feiertage: state.feiertage,
        schulferien: state.schulferien,
        pis: state.pis,
        blocker: state.blocker,
        teamZielwerte: [],
        globalConfig: restoredGlobalConfig,
        teamConfigs: restoredTeamConfigs,
        piTeamTargets: restoredPiTeamTargets,
      },
    };
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
    fetch(`${backendUrl}/api/tenants/${tenantId}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullState),
    }).catch(err => console.error('[Restore] POST /api/tenants state fehlgeschlagen:', err));
  }, []);

  const handleRowLock = useCallback((employeeId: string) => {
    emitLock(employeeId, userName.current);
  }, [emitLock]);

  const handleRowUnlock = useCallback((employeeId: string) => {
    emitUnlock(employeeId);
  }, [emitUnlock]);

  const appData: AppData = {
    feiertage,
    schulferien,
    pis,
    blocker,
    teamZielwerte: [],   // deprecated – leer, nicht mehr aktiv genutzt
    globalConfig,
    teamConfigs,
    piTeamTargets,
  };

  const showFilterBar =
    activeTab === 'planung' ||
    activeTab === 'kapazitaet' ||
    activeTab === 'dashboard' ||
    activeTab === 'pidashboard';

  return (
    <div className="min-h-screen flex flex-col bg-bund-bg">
      <Header isConnected={isConnected} tenantName={tenantName} onSwitchTenant={clearTenant} />
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
            onPiTeamTargetsChange={handlePiTeamTargetsChange}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView tenantId={tenantId} tenantName={tenantName} onCancel={() => setActiveTab('planung')} />
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
            globalConfig={globalConfig}
            onGlobalConfigChange={handleGlobalConfigChange}
            teamConfigs={teamConfigs}
            onTeamConfigsChange={handleTeamConfigsChange}
            piTeamTargets={piTeamTargets}
            farbConfig={farbConfig}
            onFarbConfigChange={handleFarbConfigChange}
            onRestore={handleRestore}
          />
        )}
      </main>
    </div>
  );
}
