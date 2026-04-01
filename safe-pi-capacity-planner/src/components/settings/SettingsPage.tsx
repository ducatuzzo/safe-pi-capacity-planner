import { useState } from 'react';
import { Users, Calendar, Sun, GraduationCap, ShieldAlert, Target, Download, Palette } from 'lucide-react';
import type { Employee, PIPlanning, Feiertag, Schulferien, Blocker, FarbConfig, SettingsView, FullAppState, TeamZielwerte } from '../../types';
import MitarbeiterSettings from './MitarbeiterSettings';
import PISettings from './PISettings';
import KalenderDatenSettings from './KalenderDatenSettings';
import BackupRestoreSettings from './BackupRestoreSettings';
import TeamZielwerteSettings from './TeamZielwerteSettings';
import FarbeinstellungenSettings from './FarbeinstellungenSettings';

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
  farbConfig: FarbConfig;
  onFarbConfigChange: (config: FarbConfig) => void;
  onRestore: (state: FullAppState) => void;
}

const NAV_EINTRAEGE: { view: SettingsView; label: string; icon: React.ReactNode; verfuegbar: boolean }[] = [
  { view: 'mitarbeiter', label: 'Mitarbeiter', icon: <Users size={16} />, verfuegbar: true },
  { view: 'pi-planung', label: 'PI-Planung', icon: <Calendar size={16} />, verfuegbar: true },
  { view: 'feiertage', label: 'Feiertage', icon: <Sun size={16} />, verfuegbar: true },
  { view: 'schulferien', label: 'Schulferien', icon: <GraduationCap size={16} />, verfuegbar: true },
  { view: 'blocker', label: 'Blocker / Freeze', icon: <ShieldAlert size={16} />, verfuegbar: true },
  { view: 'zielwerte', label: 'Team-Zielwerte', icon: <Target size={16} />, verfuegbar: true },
  { view: 'farben', label: 'Farbeinstellungen', icon: <Palette size={16} />, verfuegbar: true },
  { view: 'backup', label: 'Backup / Restore', icon: <Download size={16} />, verfuegbar: true },
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
  farbConfig,
  onFarbConfigChange,
  onRestore,
}: Props) {
  const [aktiveView, setAktiveView] = useState<SettingsView>('mitarbeiter');

  const isKalenderView = aktiveView === 'feiertage' || aktiveView === 'schulferien' || aktiveView === 'blocker';

  const appState: FullAppState = { employees, pis, feiertage, schulferien, blocker, teamZielwerte, farbConfig };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <nav className="w-52 flex-shrink-0">
        <ul className="space-y-1">
          {NAV_EINTRAEGE.map(eintrag => (
            <li key={eintrag.view}>
              <button
                onClick={() => eintrag.verfuegbar && setAktiveView(eintrag.view)}
                disabled={!eintrag.verfuegbar}
                className={[
                  'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors',
                  eintrag.verfuegbar
                    ? aktiveView === eintrag.view
                      ? 'bg-bund-blau text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed',
                ].join(' ')}
              >
                {eintrag.icon}
                {eintrag.label}
                {!eintrag.verfuegbar && <span className="ml-auto text-xs text-gray-300">bald</span>}
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
        {aktiveView === 'backup' && (
          <BackupRestoreSettings appState={appState} onRestore={onRestore} />
        )}
        {aktiveView === 'zielwerte' && (
          <TeamZielwerteSettings zielwerte={teamZielwerte} onChange={onTeamZielwerteChange} />
        )}
        {aktiveView === 'farben' && (
          <FarbeinstellungenSettings farbConfig={farbConfig} onChange={onFarbConfigChange} />
        )}
      </div>
    </div>
  );
}
