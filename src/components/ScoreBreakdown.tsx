'use client';

import { useState } from 'react';
import { Score } from '@/lib/types';

interface ScoreBreakdownProps {
  score: Score;
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-slate-400 hover:text-slate-300 transition-colors"
      >
        <span className="text-sm uppercase tracking-wide">Score Breakdown</span>
        <span className="text-sm">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <table className="w-full text-base">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-left py-1 font-medium">Factor</th>
                <th className="text-right py-1 font-medium w-12">Wt</th>
                <th className="text-right py-1 font-medium w-16">Score</th>
                <th className="text-left py-1 pl-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {score.factors.map((factor) => (
                <tr key={factor.name} className={`border-t border-slate-700/50 ${!factor.available ? 'opacity-40' : ''}`}>
                  <td className="text-slate-300 py-2">{factor.name}</td>
                  <td className="text-slate-500 text-right py-2 tabular-nums">{Math.round(factor.weight * 100)}%</td>
                  <td className="text-right py-2 tabular-nums">
                    {factor.available ? (
                      <span className={getScoreColor(factor.score)}>{factor.score}/10</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="text-slate-400 py-2 pl-3 text-sm truncate max-w-[160px]">{factor.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 5) return 'text-amber-400';
  return 'text-red-400';
}
