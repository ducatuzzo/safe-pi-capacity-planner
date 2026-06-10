// Einzelne Kalender-Zelle: Farbcodierung nach Buchungstyp oder Tagestyp

import type { CSSProperties } from 'react';
import type { Employee, FarbConfig, CustomAllocationType } from '../../types';
import type { DayMeta } from '../../utils/calendar-helpers';
import { toDateStr } from '../../utils/calendar-helpers';
import { getAllocationLetter, getAllocationColors, isPikettType as isPikettTypeHelper } from '../../utils/allocation-helpers';

function getCellStyle(
  allocation: string,
  hasAllocation: boolean,
  dayMetaType: DayMeta['type'],
  isToday: boolean,
  farbConfig: FarbConfig,
  customTypes: CustomAllocationType[],
): CSSProperties {
  if (hasAllocation) {
    const colors = getAllocationColors(allocation, farbConfig, customTypes);
    return { backgroundColor: colors.bg, color: colors.text };
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
  selectedType: string;
  dayIndex: number;
  farbConfig: FarbConfig;
  customTypes: CustomAllocationType[];
  isPasteOrigin?: boolean;
  onMouseDown: (employeeId: string, dateStr: string, meta: DayMeta, currentAllocation: string, dayIndex: number) => void;
  onMouseEnter: (employeeId: string, dateStr: string, meta: DayMeta, dayIndex: number) => void;
  onContextMenu?: (dayIndex: number) => void;
}

export default function CalendarCell({
  date, employee, dayMeta, isToday, selectedType, dayIndex, farbConfig, customTypes, isPasteOrigin, onMouseDown, onMouseEnter, onContextMenu,
}: CalendarCellProps) {
  const dateStr = toDateStr(date);

  const isNonWorkday = dayMeta.type === 'wochenende' || dayMeta.type === 'feiertag';

  const storedAllocation = employee.allocations[dateStr];
  const allocation: string =
    storedAllocation && (!isNonWorkday || isPikettTypeHelper(storedAllocation, customTypes))
      ? storedAllocation
      : 'NONE';
  const hasAllocation = allocation !== 'NONE';

  const isBookable = !isNonWorkday || isPikettTypeHelper(selectedType, customTypes);

  const cellStyle = getCellStyle(allocation, hasAllocation, dayMeta.type, isToday, farbConfig, customTypes);
  const content = hasAllocation ? getAllocationLetter(allocation, customTypes) : '';

  return (
    <td
      title={dayMeta.tooltip}
      className={[
        'border text-center align-middle',
        'w-8 min-w-[32px] max-w-[32px] h-7',
        'text-[10px] select-none',
        isPasteOrigin ? 'border-2 border-blue-500' : 'border border-gray-200',
        isBookable ? 'cursor-pointer hover:opacity-75' : 'cursor-default',
      ].join(' ')}
      style={cellStyle}
      onMouseDown={isBookable ? (e) => {
        e.preventDefault();
        onMouseDown(employee.id, dateStr, dayMeta, allocation, dayIndex);
      } : undefined}
      onMouseEnter={isBookable ? () => onMouseEnter(employee.id, dateStr, dayMeta, dayIndex) : undefined}
      onContextMenu={() => onContextMenu?.(dayIndex)}
      onDragStart={e => e.preventDefault()}
    >
      {content}
    </td>
  );
}
