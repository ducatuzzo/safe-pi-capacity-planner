import { Shield, Calendar, BarChart3, LayoutDashboard, TrendingUp, Settings } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface TabNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'planung', label: 'Planung', icon: <Calendar className="w-3.5 h-3.5 md:w-0 md:h-0 md:hidden" /> },
  { id: 'kapazitaet', label: 'Kapazität', icon: <BarChart3 className="w-3.5 h-3.5 md:w-0 md:h-0 md:hidden" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5 md:w-0 md:h-0 md:hidden" /> },
  { id: 'pidashboard', label: 'PI Dashboard', icon: <TrendingUp className="w-3.5 h-3.5 md:w-0 md:h-0 md:hidden" /> },
  { id: 'settings', label: 'Einstellungen', icon: <Settings className="w-3.5 h-3.5" /> },
  { id: 'admin', label: 'Admin', icon: <Shield className="w-3.5 h-3.5" /> },
];

const MOBILE_TABS = TABS.filter(t => t.id !== 'settings' && t.id !== 'admin');

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <>
      {/* Desktop: Top tab bar */}
      <nav className="hidden md:block bg-white border-b border-gray-200">
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
              {tab.id === 'admin' && tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile: Fixed bottom tab bar (read-only tabs only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={[
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-bund-blau'
                  : 'text-gray-400',
              ].join(' ')}
            >
              {tab.icon}
              <span className="truncate max-w-full px-0.5">
                {tab.id === 'pidashboard' ? 'PI' : tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
