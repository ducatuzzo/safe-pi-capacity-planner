// KPI-Karten: 4 Kennzahlen oben im Dashboard
import { Users, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';

interface KPICardsProps {
  totalSP: number;
  employeeCount: number;
  pikettGapsCount: number;
  betriebGapsCount: number;
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function KPICard({ label, value, icon, colorClass, bgClass }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
        <span className={colorClass}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800 tabular-nums">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function KPICards({ totalSP, employeeCount, pikettGapsCount, betriebGapsCount }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Verfügbare Story Points"
        value={totalSP.toFixed(1)}
        icon={<TrendingUp size={22} />}
        colorClass="text-[#003F7F]"
        bgClass="bg-blue-50"
      />
      <KPICard
        label="Mitarbeiter (gefiltert)"
        value={employeeCount}
        icon={<Users size={22} />}
        colorClass="text-[#0070C0]"
        bgClass="bg-sky-50"
      />
      <KPICard
        label="Pikett-Lücken (Tage)"
        value={pikettGapsCount}
        icon={<AlertTriangle size={22} />}
        colorClass={pikettGapsCount > 0 ? 'text-red-500' : 'text-green-600'}
        bgClass={pikettGapsCount > 0 ? 'bg-red-50' : 'bg-green-50'}
      />
      <KPICard
        label="Betrieb-Lücken (Tage)"
        value={betriebGapsCount}
        icon={<ShieldAlert size={22} />}
        colorClass={betriebGapsCount > 0 ? 'text-orange-500' : 'text-green-600'}
        bgClass={betriebGapsCount > 0 ? 'bg-orange-50' : 'bg-green-50'}
      />
    </div>
  );
}
