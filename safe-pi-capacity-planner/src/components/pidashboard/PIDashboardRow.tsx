// PI Dashboard – Tabellenzeile (Iteration oder PI-Total)

import { useRef, useState } from 'react';
import type { PIDashboardIterationRow } from '../../hooks/usePIDashboard';

// ─── Farbcodierung Auslastung ─────────────────────────────────────────────────

function auslastungColor(pct: number): string {
  if (pct > 100) return 'text-red-600 font-semibold';
  if (pct >= 85) return 'text-orange-500 font-semibold';
  return 'text-green-600 font-semibold';
}

function auslastungBadge(pct: number): string {
  if (pct > 100) return 'bg-red-100 text-red-700 border border-red-200';
  if (pct >= 85) return 'bg-orange-100 text-orange-700 border border-orange-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

// ─── Delta-Anzeige ────────────────────────────────────────────────────────────

function DeltaCell({ delta, spJira }: { delta: number; spJira: number }) {
  // Nur anzeigen wenn spJira erfasst wurde
  if (spJira === 0) return <span className="text-gray-300 text-xs">–</span>;

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-green-700 font-semibold">
        ✅ +{delta.toFixed(1)}
      </span>
    );
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs tabular-nums text-blue-700 font-semibold">
        ℹ️ 0.0
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-orange-600 font-semibold">
      ⚠️ {delta.toFixed(1)}
    </span>
  );
}

// ─── Inline-Edit für SP Jira ──────────────────────────────────────────────────

interface SpJiraEditProps {
  value: number;
  onChange: (v: number) => void;
}

function SpJiraEdit({ value, onChange }: SpJiraEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value === 0 ? '' : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const parsed = parseFloat(draft.replace(',', '.'));
    onChange(isNaN(parsed) || parsed < 0 ? 0 : Math.round(parsed * 10) / 10);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={0.5}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 text-right px-1 py-0.5 border border-bund-blau rounded text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-bund-blau"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      title="Klicken zum Bearbeiten"
      className="w-full text-right tabular-nums text-sm text-gray-800 hover:bg-blue-50 hover:text-bund-blau rounded px-1 py-0.5 transition-colors cursor-text"
    >
      {value > 0 ? value.toFixed(1) : <span className="text-gray-300">–</span>}
    </button>
  );
}

// ─── Iteration-Zeile ──────────────────────────────────────────────────────────

interface PIDashboardRowProps {
  row: PIDashboardIterationRow;
  isEven: boolean;
  onSpJiraChange: (iterationId: string, value: number) => void;
}

export function PIDashboardIterRow({ row, isEven, onSpJiraChange }: PIDashboardRowProps) {
  return (
    <tr className={isEven ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">{row.iterationName}</td>
      <td className="px-4 py-2 text-right tabular-nums text-sm text-gray-700">{row.betriebstage}</td>
      <td className="px-2 py-1 text-right">
        <SpJiraEdit
          value={row.spJira}
          onChange={v => onSpJiraChange(row.iterationId, v)}
        />
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-sm text-gray-700">
        {row.berechnetSP.toFixed(1)}
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-sm text-gray-700">
        {row.verfuegbarSP.toFixed(1)}
      </td>
      <td className="px-4 py-2 text-right">
        <DeltaCell delta={row.delta} spJira={row.spJira} />
      </td>
      <td className="px-4 py-2 text-right">
        <span className={`inline-block px-2 py-0.5 rounded text-xs tabular-nums ${auslastungBadge(row.auslastungJira)}`}>
          {row.auslastungJira.toFixed(1)} %
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <span className={`text-xs tabular-nums ${auslastungColor(row.auslastungApp)}`}>
          {row.auslastungApp.toFixed(1)} %
        </span>
      </td>
    </tr>
  );
}

// ─── PI-Total-Zeile ───────────────────────────────────────────────────────────

interface PIDashboardTotalRowProps {
  totalBetriebstage: number;
  totalSpJira: number;
  totalBerechnetSP: number;
  totalVerfuegbarSP: number;
  totalDelta: number;
  auslastungJiraTotal: number;
  auslastungAppTotal: number;
}

export function PIDashboardTotalRow({
  totalBetriebstage,
  totalSpJira,
  totalBerechnetSP,
  totalVerfuegbarSP,
  totalDelta,
  auslastungJiraTotal,
  auslastungAppTotal,
}: PIDashboardTotalRowProps) {
  return (
    <tr className="border-t-2 border-bund-blau bg-blue-50">
      <td className="px-4 py-2.5 text-sm font-bold text-bund-blau">PI Total</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-bund-blau">
        {totalBetriebstage}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-bund-blau">
        {totalSpJira > 0 ? totalSpJira.toFixed(1) : '–'}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-bund-blau">
        {totalBerechnetSP.toFixed(1)}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-bund-blau">
        {totalVerfuegbarSP.toFixed(1)}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-bold text-bund-blau">
        {totalSpJira > 0 ? (
          totalDelta > 0
            ? <span className="text-green-700">✅ +{totalDelta.toFixed(1)}</span>
            : totalDelta === 0
              ? <span className="text-blue-700">ℹ️ 0.0</span>
              : <span className="text-orange-600">⚠️ {totalDelta.toFixed(1)}</span>
        ) : '–'}
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tabular-nums ${auslastungBadge(auslastungJiraTotal)}`}>
          {auslastungJiraTotal.toFixed(1)} %
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className={`text-xs font-bold tabular-nums ${auslastungColor(auslastungAppTotal)}`}>
          {auslastungAppTotal.toFixed(1)} %
        </span>
      </td>
    </tr>
  );
}
