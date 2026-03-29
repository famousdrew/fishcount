'use client';

import Link from 'next/link';
import { FishCount, FishTrend } from '@/lib/types';

interface FishCountsProps {
  fishCounts: FishCount[];
  fishTrends: FishTrend[];
}

export function FishCountsRow({ fishCounts, fishTrends }: FishCountsProps) {
  if (fishCounts.length === 0) {
    return (
      <div className="border-t border-slate-700 px-3 py-3">
        <p className="text-slate-500 text-base">Fish counts unavailable</p>
      </div>
    );
  }

  const latest = fishCounts[0];
  const dateLabel = formatCountDate(latest.date);

  // Show species with counts first, sorted by count descending
  const species = fishTrends
    .filter(t => t.latestCount > 0)
    .sort((a, b) => b.latestCount - a.latestCount);

  // Add zero-count species
  const zeroSpecies = fishTrends.filter(t => t.latestCount === 0);

  return (
    <div className="border-t border-slate-700 px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-500 text-xs uppercase tracking-wide">
          Counts from {dateLabel}
        </span>
        <Link
          href="/counts"
          className="text-sky-400 text-sm hover:text-sky-300 transition-colors"
        >
          details ▸
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {species.map(t => (
          <CountItem key={t.species} trend={t} />
        ))}
        {zeroSpecies.map(t => (
          <CountItem key={t.species} trend={t} />
        ))}
      </div>
    </div>
  );
}

function CountItem({ trend }: { trend: FishTrend }) {
  const arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '';
  const arrowColor = trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : '';

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-400 text-base">{trend.species}</span>
      <span className="text-slate-100 text-base tabular-nums font-medium">
        {trend.latestCount > 0 ? trend.latestCount.toLocaleString() : '–'}
        {arrow && <span className={`ml-1 ${arrowColor}`}>{arrow}</span>}
      </span>
    </div>
  );
}

function formatCountDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
