import { Shield } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface TabNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string; icon?: React.ReactNode }[] = [
  { id: 'planung', label: 'Planung' },
  { id: 'kapazitaet', label: 'Kapazität' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pidashboard', label: 'PI Dashboard' },
  { id: 'settings', label: 'Einstellungen' },
  { id: 'admin', label: 'Admin', icon: <Shield className="w-3.5 h-3.5" /> },
];

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={[
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === tab.id
                ? 'border-bund-blau text-bund-blau'
                : 'border-transparent text-gray-500 hover:text-bund-blau hover:border-gray-300',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
