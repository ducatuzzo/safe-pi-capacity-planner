import { ArrowLeftRight } from 'lucide-react';
import bundeslogo from '../../assets/bundeslogo.svg';

interface HeaderProps {
  isConnected: boolean;
  tenantName: string;
  onSwitchTenant: () => void;
}

export default function Header({ isConnected, tenantName, onSwitchTenant }: HeaderProps) {
  return (
    <header className="bg-bund-blau text-white shadow-md">
      <div className="flex items-center gap-4 px-6 py-4">
        <img
          src={bundeslogo}
          alt="Schweizerische Eidgenossenschaft"
          className="h-14 w-auto"
        />
        <div className="h-10 w-px bg-white/40" />
        <div>
          <h1 className="text-xl font-semibold leading-tight tracking-wide">
            SAFe PI Capacity Planner
          </h1>
          <p className="text-sm text-white/70">
            Bundesamt für Informatik und Telekommunikation BIT
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* Train-Name und Wechseln-Button */}
          {tenantName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90 font-medium">{tenantName}</span>
              <button
                onClick={onSwitchTenant}
                title="Train wechseln"
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>wechseln</span>
              </button>
            </div>
          )}
          <div className="w-px h-5 bg-white/30" />
          {/* Verbindungsindikator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
              title={isConnected ? 'Verbunden' : 'Getrennt – Änderungen werden nicht synchronisiert'}
            />
            <span className="text-xs text-white/70">
              {isConnected ? 'Verbunden' : 'Getrennt'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
