// 6-zeiliger Kalender-Header: Monat / KW / PI / Iteration+Blocker / Zeremonien / Tag+Wochentag
// Schema 1.6 (Etappe 4): Zeremonien-Marker mit Serien-Expansion + occurrence/total im Tooltip

import { useMemo } from 'react';
import type { PIPlanning, Blocker, FarbConfig } from '../../types';
import {
  groupByMonth,
  groupByKW,
  groupByPI,
  groupByIterationOrBlocker,
  buildZeremonienIndex,
  toDateStr,
  getWeekdayLabel,
} from '../../utils/calendar-helpers';
import { ZEREMONIE_LABELS } from '../../utils/pi-calculator';

interface CalendarHeaderProps {
  days: Date[];
  pis: PIPlanning[];
  todayStr: string;
  blockers: Blocker[];
  farbConfig: FarbConfig;
}

// Sticky top-Offsets für jede Header-Zeile (Zeilenhöhe: h-7 = 28px)
// Feature 29: 6 Zeilen statt 5 — neue Zeremonien-Zeile zwischen Iter und Tag
const TOP = ['top-0', 'top-7', 'top-14', 'top-[84px]', 'top-[112px]', 'top-[140px]'] as const;

const TH = 'border border-gray-200 text-center px-1 whitespace-nowrap text-[11px] font-medium sticky z-20';

export default function CalendarHeader({ days, pis, todayStr, blockers, farbConfig }: CalendarHeaderProps) {
  const monthSpans = groupByMonth(days);
  const kwSpans = groupByKW(days);
  const piSpans = groupByPI(days, pis);
  const iterSpans = groupByIterationOrBlocker(days, pis);
  // Feature 29 v2: Zeremonien einmal pro Render expandieren + indexieren (Performance)
  const zeremonienIdx = useMemo(() => buildZeremonienIndex(pis), [pis]);

  return (
    <thead>
      {/* Zeile 1: Monat */}
      <tr>
        {/* Mitarbeiter-Ecke: sticky links + oben, überspannt alle 6 Header-Zeilen */}
        <th
          rowSpan={6}
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

      {/* Zeile 4: Iterations-Name (Feature 29: Blocker-Wochen erscheinen als gestreifte Spans) */}
      <tr>
        {iterSpans.map((span, i) => {
          const istBlocker = span.variant === 'blocker';
          const klassen = istBlocker
            ? 'bg-blocker-stripe text-gray-700 italic'
            : span.label
              ? 'bg-indigo-50 text-indigo-700'
              : 'bg-gray-50 text-gray-300';
          return (
            <th
              key={i}
              colSpan={span.span}
              title={istBlocker ? `Blocker-Woche: ${span.label}` : undefined}
              className={`${TH} ${TOP[3]} h-7 ${klassen}`}
            >
              {istBlocker ? `❄ ${span.label}` : span.label}
            </th>
          );
        })}
      </tr>

      {/* Zeile 5: Zeremonien-Marker (Feature 29 v2 — Schema 1.6 mit Serien-Expansion) */}
      <tr>
        {days.map(day => {
          const ds = toDateStr(day);
          const treffer = zeremonienIdx.get(ds) ?? [];
          if (treffer.length === 0) {
            return (
              <th
                key={ds}
                className={`${TH} ${TOP[4]} bg-white h-7 w-8 min-w-[32px] max-w-[32px] p-0`}
              />
            );
          }
          const tooltip = treffer
            .map(({ pi, zeremonie, instance }) => {
              const serie = instance.total > 1
                ? ` · Serie ${instance.occurrence}/${instance.total}`
                : '';
              const zeit = instance.startDate === instance.endDate
                ? `${instance.startTime}–${instance.endTime}`
                : `${instance.startDate} ${instance.startTime} → ${instance.endDate} ${instance.endTime}`;
              return (
                `${ZEREMONIE_LABELS[zeremonie.type]} (${pi.name})${serie}\n` +
                `${zeremonie.title}\n` +
                zeit +
                (zeremonie.location ? `\nOrt: ${zeremonie.location}` : '')
              );
            })
            .join('\n\n');
          // Erkennt: ist mind. eine der Treffer eine Serien-Instanz?
          const hatSerie = treffer.some(t => t.instance.total > 1);
          return (
            <th
              key={ds}
              title={tooltip}
              className={`${TH} ${TOP[4]} bg-white h-7 w-8 min-w-[32px] max-w-[32px] p-0`}
            >
              <span
                className={`text-sm leading-none cursor-help ${hatSerie ? 'text-secondary-600' : 'text-secondary-500'}`}
              >
                {hatSerie ? '◈' : '◆'}
              </span>
              {treffer.length > 1 && (
                <span className="absolute text-[8px] text-secondary-700 leading-none">{treffer.length}</span>
              )}
            </th>
          );
        })}
      </tr>

      {/* Zeile 6: Tagesdatum (DD) + Wochentag (Mo/Di/...) */}
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
                TOP[5],
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
