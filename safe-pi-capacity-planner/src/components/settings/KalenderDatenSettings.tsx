import type { Feiertag, Schulferien, Blocker } from '../../types';
import DateRangeTable from './DateRangeTable';

interface Props {
  feiertage: Feiertag[];
  onFeiertageChange: (items: Feiertag[]) => void;
  schulferien: Schulferien[];
  onSchulferienChange: (items: Schulferien[]) => void;
  blocker: Blocker[];
  onBlockerChange: (items: Blocker[]) => void;
}

export default function KalenderDatenSettings({
  feiertage,
  onFeiertageChange,
  schulferien,
  onSchulferienChange,
  blocker,
  onBlockerChange,
}: Props) {
  return (
    <div className="space-y-10">
      <DateRangeTable
        titel="Gesetzliche Feiertage"
        eintraege={feiertage}
        onChange={items => onFeiertageChange(items as Feiertag[])}
        csvDateiname="feiertage"
      />

      <div className="border-t border-gray-200 pt-8">
        <DateRangeTable
          titel="Schulferien"
          eintraege={schulferien}
          onChange={items => onSchulferienChange(items as Schulferien[])}
          csvDateiname="schulferien"
        />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <DateRangeTable
          titel="Blocker & Spezielle Perioden"
          eintraege={blocker}
          onChange={items => onBlockerChange(items as Blocker[])}
          csvDateiname="blocker"
          hinweis="Hinweis: Blocker-Tage zählen als Arbeitstage (kein SP-Abzug)."
        />
      </div>
    </div>
  );
}
