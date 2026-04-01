// Einzelne Kalender-Zelle: Farbcodierung nach Buchungstyp oder Tagestyp

import type { CSSProperties } from 'react';
import type { Employee, AllocationType, FarbConfig } from '../../types';
import type { DayMeta } from '../../utils/calendar-helpers';
import { toDateStr } from '../../utils/calendar-helpers';

// Legendenbuchstaben gemäss Legende (Screenshot 28.03.2026)
const ALLOCATION_LETTER: Record<AllocationType, string> = {
  NONE:           '',
  FERIEN:         'F',
  ABWESEND:       'A',
  TEILZEIT:       'T',
  MILITAER:       'M',
  IPA:            'I',
  BETRIEB:        'B',
  BETRIEB_PIKETT: 'BP',
  PIKETT:         'P',
};

// Pikett-Typen sind an Wochenenden und Feiertagen buchbar (7×24-Verfügbarkeit)
function isPikettType(type: AllocationType): boolean {
  return type === 'PIKETT' || type === 'BETRIEB_PIKETT';
}

// Inline-Style für Zellenfarbe abhängig von Buchung, Tagestyp und Farbkonfiguration
function getCellStyle(
  allocation: AllocationType,
  hasAllocation: boolean,
  dayMetaType: DayMeta['type'],
  isToday: boolean,
  farbConfig: FarbConfig,
): CSSProperties {
  if (hasAllocation) {
    return {
      backgroundColor: farbConfig.buchungstypen[allocation].bg,
      color: farbConfig.buchungstypen[allocation].text,
    };
  }
  if (isToday) {
    return {
      backgroundColor: '#FEF2F2',
      color: farbConfig.kalender.heute.text,
      fontWeight: farbConfig.kalender.heute.bold ? 'bold' : undefined,
    };
  }
  switch (dayMetaType) {
    case 'wochenende':
      return { backgroundColor: farbConfig.kalender.wochenende.bg, color: farbConfig.kalender.wochenende.text };
    case 'feiertag':
      return { backgroundColor: farbConfig.kalender.feiertag.bg, color: farbConfig.kalender.feiertag.text };
    case 'schulferien':
      return { backgroundColor: farbConfig.kalender.schulferien.bg, color: farbConfig.kalender.schulferien.text };
    default:
      return { backgroundColor: '#FFFFFF', color: '#1A1A1A' };
  }
}

interface CalendarCellProps {
  date: Date;
  employee: Employee;
  dayMeta: DayMeta;
  isToday: boolean;
  selectedType: AllocationType;
  dayIndex: number;
  farbConfig: FarbConfig;
  onMouseDown: (employeeId: string, dateStr: string, meta: DayMeta, currentAllocation: AllocationType, dayIndex: number) => void;
  onMouseEnter: (employeeId: string, dateStr: string, meta: DayMeta, dayIndex: number) => void;
}

export default function CalendarCell({
  date, employee, dayMeta, isToday, selectedType, dayIndex, farbConfig, onMouseDown, onMouseEnter,
}: CalendarCellProps) {
  const dateStr = toDateStr(date);

  // Nicht-Arbeitstage: Wochenende und Feiertag
  const isNonWorkday = dayMeta.type === 'wochenende' || dayMeta.type === 'feiertag';

  // Gespeicherte Buchung auslesen; an Nicht-Arbeitstagen nur Pikett-Typen anzeigen
  const storedAllocation = employee.allocations[dateStr];
  const allocation: AllocationType =
    storedAllocation && (!isNonWorkday || isPikettType(storedAllocation))
      ? storedAllocation
      : 'NONE';
  const hasAllocation = allocation !== 'NONE';

  // Buchbar: Arbeitstage immer; Nicht-Arbeitstage nur mit Pikett-Typen
  const isBookable = !isNonWorkday || isPikettType(selectedType);

  const cellStyle = getCellStyle(allocation, hasAllocation, dayMeta.type, isToday, farbConfig);
  const content = hasAllocation ? ALLOCATION_LETTER[allocation] : '';

  return (
    <td
      title={dayMeta.tooltip}
      className={[
        'border border-gray-200 text-center align-middle',
        'w-8 min-w-[32px] max-w-[32px] h-7',
        'text-[10px] select-none',
        isBookable ? 'cursor-pointer hover:opacity-75' : 'cursor-default',
      ].join(' ')}
      style={cellStyle}
      onMouseDown={isBookable ? (e) => {
        e.preventDefault(); // verhindert Textauswahl beim Drag
        onMouseDown(employee.id, dateStr, dayMeta, allocation, dayIndex);
      } : undefined}
      onMouseEnter={isBookable ? () => onMouseEnter(employee.id, dateStr, dayMeta, dayIndex) : undefined}
      onDragStart={e => e.preventDefault()}
    >
      {content}
    </td>
  );
}
