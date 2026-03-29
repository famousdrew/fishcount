'use client';

import { Score } from '@/lib/types';

interface VerdictBarProps {
  score: Score;
  headlineStat: string;
  contextLine: string;
  lastUpdated: string;
}

const statusConfig = {
  go: { label: 'GO', bg: 'bg-emerald-500' },
  maybe: { label: 'MAYBE', bg: 'bg-amber-500' },
  skip: { label: 'SKIP', bg: 'bg-red-500' },
  insufficient: { label: '—', bg: 'bg-slate-600' },
};

export function VerdictBar({ score, headlineStat, contextLine, lastUpdated }: VerdictBarProps) {
  const config = statusConfig[score.status];

  const updatedTime = new Date(lastUpdated).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles',
  });

  return (
    <div className="px-3 py-3">
      {/* Verdict line */}
      <div className="flex items-center gap-3 mb-1">
        <span className={`${config.bg} text-white font-bold text-xl px-3 py-0.5 rounded`}>
          {score.status === 'insufficient' ? '?' : config.label}
        </span>
        {score.status !== 'insufficient' && (
          <span className="text-slate-300 font-bold text-xl tabular-nums">{score.total.toFixed(1)}</span>
        )}
        <span className="text-slate-100 font-medium text-base truncate">{headlineStat}</span>
      </div>

      {/* Context line */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm truncate">{contextLine}</p>
        <p className="text-slate-600 text-sm whitespace-nowrap ml-2">{updatedTime}</p>
      </div>
    </div>
  );
}
