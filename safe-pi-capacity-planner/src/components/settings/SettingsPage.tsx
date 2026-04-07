import { useState } from 'react';
import { Users, Calendar, Sun, GraduationCap, ShieldAlert, Target, Download, Palette, Settings, SlidersHorizontal } from 'lucide-react';
import type { Employee, PIPlanning, Feiertag, Schulferien, Blocker, FarbConfig, SettingsView, FullAppState, TeamZielwerte, GlobalCapacityConfig, TeamConfig } from '../../types';
import MitarbeiterSettings from './MitarbeiterSettings';
import PISettings from './PISettings';
import KalenderDatenSettings from './KalenderDatenSettings';
import BackupRestoreSettings from './BackupRestoreSettings';
import TeamZielwerteSettings from './TeamZielwerteSettings';
import FarbeinstellungenSettings from './FarbeinstellungenSettings';
import TeamConfigSettings from './TeamConfigSettings';
import GlobalConfigSettings from './GlobalConfigSettings';

interface Props {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  pis: PIPlanning[];
  onPisChange: (pis: PIPlanning[]) => void;
  feiertage: Feiertag[];
  onFeiertageChange: (items: Feiertag[]) => void;
  schulferien: Schulferien[];
  onSchulferienChange: (items: Schulferien[]) => void;
  blocker: Blocker[];
  onBlockerChange: (items: Blocker[]) => void;
  teamZielwerte: TeamZielwerte[];
  onTeamZielwerteChange: (items: TeamZielwerte[]) => void;
  globalConfig: GlobalCapacityConfig;
  onGlobalConfigChange: (config: GlobalCapacityConfig) => void;
  teamConfigs: TeamConfig[];
  onTeamConfigsChange: (configs: TeamConfig[]) => void;
  farbConfig: FarbConfig;
  onFarbConfigChange: (config: FarbConfig) => void;
  onRestore: (state: FullAppState) => void;
}

const NAV_EINTRAEGE: { view: SettingsView; label: string; icon: React.ReactNode }[] = [
  { view: 'mitarbeiter', label: 'Mitarbeiter', icon: <Users size={16} /> },
  { view: 'pi-planung', label: 'PI-Planung', icon: <Calendar size={16} /> },
  { view: 'feiertage', label: 'Feiertage', icon: <Sun size={16} /> },
  { view: 'schulferien', label: 'Schulferien', icon: <GraduationCap size={16} /> },
  { view: 'blocker', label: 'Blocker / Freeze', icon: <ShieldAlert size={16} /> },
  { view: 'zielwerte', label: 'Team-Zielwerte', icon: <Target size={16} /> },
  { view: 'team-konfiguration', label: 'Team-Konfiguration', icon: <Settings size={16} /> },
  { view: 'globale-parameter', label: 'Globale Parameter', icon: <SlidersHorizontal size={16} /> },
  { view: 'farben', label: 'Farbeinstellungen', icon: <Palette size={16} /> },
  { view: 'backup', label: 'Backup / Restore', icon: <Download size={16} /> },
];

export default function SettingsPage({
  employees,
  onEmployeesChange,
  pis,
  onPisChange,
  feiertage,
  onFeiertageChange,
  schulferien,
  onSchulferienChange,
  blocker,
  onBlockerChange,
  teamZielwerte,
  onTeamZielwerteChange,
  globalConfig,
  onGlobalConfigChange,
  teamConfigs,
  onTeamConfigsChange,
  farbConfig,
  onFarbConfigChange,
  onRestore,
}: Props) {
  const [aktiveView, setAktiveView] = useState<SettingsView>('mitarbeiter');

  const isKalenderView = aktiveView === 'feiertage' || aktiveView === 'schulferien' || aktiveView === 'blocker';

  const appState: FullAppState = {
    employees, pis, feiertage, schulferien, blocker, teamZielwerte, farbConfig,
    globalConfig, teamConfigs,
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <nav className="w-52 flex-shrink-0">
        <ul className="space-y-1">
          {NAV_EINTRAEGE.map(eintrag => (
            <li key={eintrag.view}>
              <button
                onClick={() => setAktiveView(eintrag.view)}
                className={[
                  'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors',
                  aktiveView === eintrag.view
                    ? 'bg-bund-blau text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {eintrag.icon}
                {eintrag.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Inhalt */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
        {aktiveView === 'mitarbeiter' && (
          <MitarbeiterSettings employees={employees} onChange={onEmployeesChange} />
        )}
        {aktiveView === 'pi-planung' && (
          <PISettings pis={pis} onChange={onPisChange} />
        )}
        {isKalenderView && (
          <KalenderDatenSettings
            feiertage={feiertage}
            onFeiertageChange={onFeiertageChange}
            schulferien={schulferien}
            onSchulferienChange={onSchulferienChange}
            blocker={blocker}
            onBlockerChange={onBlockerChange}
          />
        )}
        {aktiveView === 'zielwerte' && (
          <TeamZielwerteSettings zielwerte={teamZielwerte} onChange={onTeamZielwerteChange} />
        )}
        {aktiveView === 'team-konfiguration' && (
          <TeamConfigSettings
            employees={employees}
            teamConfigs={teamConfigs}
            onChange={onTeamConfigsChange}
          />
        )}
        {aktiveView === 'globale-parameter' && (
          <GlobalConfigSettings config={globalConfig} onChange={onGlobalConfigChange} />
        )}
        {aktiveView === 'farben' && (
          <FarbeinstellungenSettings farbConfig={farbConfig} onChange={onFarbConfigChange} />
        )}
        {aktiveView === 'backup' && (
          <BackupRestoreSettings appState={appState} onRestore={onRestore} />
        )}
      </div>
    </div>
  );
}
