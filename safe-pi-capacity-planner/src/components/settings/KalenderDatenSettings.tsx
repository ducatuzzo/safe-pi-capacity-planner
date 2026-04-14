import { useEffect, useRef } from 'react';
import type { Feiertag, Schulferien, Blocker } from '../../types';
import DateRangeTable from './DateRangeTable';

interface Props {
  feiertage: Feiertag[];
  onFeiertageChange: (items: Feiertag[]) => void;
  schulferien: Schulferien[];
  onSchulferienChange: (items: Schulferien[]) => void;
  blocker: Blocker[];
  onBlockerChange: (items: Blocker[]) => void;
  scrollToSection?: 'feiertage' | 'schulferien' | 'blocker';
}

export default function KalenderDatenSettings({
  feiertage,
  onFeiertageChange,
  schulferien,
  onSchulferienChange,
  blocker,
  onBlockerChange,
  scrollToSection,
}: Props) {
  const feiertageRef = useRef<HTMLDivElement>(null);
  const schulferienRef = useRef<HTMLDivElement>(null);
  const blockerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToSection) return;
    const refMap = {
      feiertage: feiertageRef,
      schulferien: schulferienRef,
      blocker: blockerRef,
    };
    const target = refMap[scrollToSection];
    if (target?.current) {
      target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToSection]);

  return (
    <div className="space-y-10">
      <div ref={feiertageRef}>
        <DateRangeTable
          titel="Gesetzliche Feiertage"
          eintraege={feiertage}
          onChange={items => onFeiertageChange(items as Feiertag[])}
          csvDateiname="feiertage"
        />
      </div>

      <div ref={schulferienRef} className="border-t border-gray-200 pt-8">
        <DateRangeTable
          titel="Schulferien"
          eintraege={schulferien}
          onChange={items => onSchulferienChange(items as Schulferien[])}
          csvDateiname="schulferien"
        />
      </div>

      <div ref={blockerRef} className="border-t border-gray-200 pt-8">
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
