import type { ActiveTab } from '../../types';

interface TabNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'planung', label: 'Planung' },
  { id: 'kapazitaet', label: 'Kapazität' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Einstellungen' },
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
              'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-bund-blau text-bund-blau'
                : 'border-transparent text-gray-500 hover:text-bund-blau hover:border-gray-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
