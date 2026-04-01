import bundeslogo from '../../assets/bundeslogo.svg';

interface HeaderProps {
  isConnected: boolean;
}

export default function Header({ isConnected }: HeaderProps) {
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
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            title={isConnected ? 'Verbunden' : 'Getrennt – Änderungen werden nicht synchronisiert'}
          />
          <span className="text-xs text-white/70">
            {isConnected ? 'Verbunden' : 'Getrennt'}
          </span>
        </div>
      </div>
    </header>
  );
}
