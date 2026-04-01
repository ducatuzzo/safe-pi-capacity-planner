// 5-zeiliger Kalender-Header: Monat / KW / PI / Iteration / Tag+Wochentag

import type { PIPlanning, Blocker, FarbConfig } from '../../types';
import {
  groupByMonth,
  groupByKW,
  groupByPI,
  groupByIteration,
  toDateStr,
  getWeekdayLabel,
} from '../../utils/calendar-helpers';

interface CalendarHeaderProps {
  days: Date[];
  pis: PIPlanning[];
  todayStr: string;
  blockers: Blocker[];
  farbConfig: FarbConfig;
}

// Sticky top-Offsets für jede Header-Zeile (Zeilenhöhe: h-7 = 28px)
const TOP = ['top-0', 'top-7', 'top-14', 'top-[84px]', 'top-[112px]'] as const;

const TH = 'border border-gray-200 text-center px-1 whitespace-nowrap text-[11px] font-medium sticky z-20';

export default function CalendarHeader({ days, pis, todayStr, blockers, farbConfig }: CalendarHeaderProps) {
  const monthSpans = groupByMonth(days);
  const kwSpans = groupByKW(days);
  const piSpans = groupByPI(days, pis);
  const iterSpans = groupByIteration(days, pis);

  return (
    <thead>
      {/* Zeile 1: Monat */}
      <tr>
        {/* Mitarbeiter-Ecke: sticky links + oben, überspannt alle 5 Header-Zeilen */}
        <th
          rowSpan={5}
          className="sticky left-0 top-0 z-30 bg-gray-100 border border-gray-300 text-left pl-3 text-xs font-semibold text-gray-600 min-w-[160px] w-[160px]"
        >
          Mitarbeiter
        </th>
        {monthSpans.map((span, i) => (
          <th
            key={i}
            colSpan={span.span}
            className={`${TH} ${TOP[0]} bg-bund-blau text-white h-7`}
          >
            {span.label}
          </th>
        ))}
      </tr>

      {/* Zeile 2: Kalenderwoche */}
      <tr>
        {kwSpans.map((span, i) => (
          <th
            key={i}
            colSpan={span.span}
            className={`${TH} ${TOP[1]} bg-gray-100 text-gray-600 h-7`}
          >
            {span.label}
          </th>
        ))}
      </tr>

      {/* Zeile 3: PI-Name */}
      <tr>
        {piSpans.map((span, i) => (
          <th
            key={i}
            colSpan={span.span}
            className={`${TH} ${TOP[2]} h-7 ${
              span.label
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-50 text-gray-300'
            }`}
          >
            {span.label}
          </th>
        ))}
      </tr>

      {/* Zeile 4: Iterations-Name */}
      <tr>
        {iterSpans.map((span, i) => (
          <th
            key={i}
            colSpan={span.span}
            className={`${TH} ${TOP[3]} h-7 ${
              span.label
                ? 'bg-indigo-50 text-indigo-700'
                : 'bg-gray-50 text-gray-300'
            }`}
          >
            {span.label}
          </th>
        ))}
      </tr>

      {/* Zeile 5: Tagesdatum (DD) + Wochentag (Mo/Di/...) */}
      <tr>
        {days.map(day => {
          const ds = toDateStr(day);
          const isToday = ds === todayStr;
          const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
          const blocker = blockers.find(b => ds >= b.startStr && ds <= b.endStr);

          const cellStyle = isToday
            ? { backgroundColor: '#FEF2F2', color: farbConfig.kalender.heute.text }
            : blocker
            ? { backgroundColor: farbConfig.kalender.blocker.bg, color: farbConfig.kalender.blocker.text }
            : isWeekend
            ? { backgroundColor: farbConfig.kalender.wochenende.bg, color: farbConfig.kalender.wochenende.text }
            : { backgroundColor: '#F9FAFB', color: '#4B5563' };

          return (
            <th
              key={ds}
              title={blocker?.name}
              className={[
                TH,
                TOP[4],
                'h-7 w-8 min-w-[32px] max-w-[32px] p-0',
                isToday ? 'font-bold' : 'font-normal',
              ].join(' ')}
              style={cellStyle}
            >
              {blocker && <div className="leading-none text-[9px]">❄️</div>}
              <div className="leading-none">{day.getUTCDate()}</div>
              <div className="leading-none text-[9px]">{getWeekdayLabel(day)}</div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
