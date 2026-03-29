'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalDay, TideEvent } from '@/lib/types';

interface CountsViewProps {
  days: HistoricalDay[];
}

const speciesConfig = {
  chinook: { color: '#F87171', label: 'Chinook' },
  steelhead: { color: '#A78BFA', label: 'Steelhead' },
  sockeye: { color: '#FB923C', label: 'Sockeye' },
  coho: { color: '#F472B6', label: 'Coho' },
  shad: { color: '#A3E635', label: 'Shad' },
  lamprey: { color: '#94A3B8', label: 'Lamprey' },
} as const;

type SpeciesKey = keyof typeof speciesConfig;

export function CountsView({ days }: CountsViewProps) {
  const [visibleSpecies, setVisibleSpecies] = useState<Set<SpeciesKey>>(() => {
    const latest = days[0];
    if (!latest) return new Set(['chinook', 'steelhead']);
    const counts: [SpeciesKey, number][] = [
      ['chinook', latest.fishCount.chinook],
      ['steelhead', latest.fishCount.steelhead],
      ['sockeye', latest.fishCount.sockeye],
      ['coho', latest.fishCount.coho],
      ['shad', latest.fishCount.shad],
      ['lamprey', latest.fishCount.lamprey],
    ];
    counts.sort((a, b) => b[1] - a[1]);
    return new Set(counts.slice(0, 2).map(c => c[0]));
  });

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Chart data: oldest to newest
  const chartData = [...days].reverse().map(d => ({
    date: formatShortDate(d.date),
    fullDate: d.date,
    chinook: d.fishCount.chinook,
    steelhead: d.fishCount.steelhead,
    sockeye: d.fishCount.sockeye,
    coho: d.fishCount.coho,
    shad: d.fishCount.shad,
    lamprey: d.fishCount.lamprey,
    flowK: d.flowCfs ? Math.round(d.flowCfs / 1000) : null,
    waterTempF: d.waterTempF ? Math.round(d.waterTempF) : null,
  }));

  const toggleSpecies = (species: SpeciesKey) => {
    setVisibleSpecies(prev => {
      const next = new Set(prev);
      if (next.has(species)) {
        next.delete(species);
      } else {
        if (next.size >= 3) {
          const first = next.values().next().value;
          if (first) next.delete(first);
        }
        next.add(species);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Species toggles */}
      <div className="flex flex-wrap gap-1.5 px-3 py-3">
        {(Object.keys(speciesConfig) as SpeciesKey[]).map(species => {
          const config = speciesConfig[species];
          const isActive = visibleSpecies.has(species);
          return (
            <button
              key={species}
              onClick={() => toggleSpecies(species)}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors
                ${isActive
                  ? 'border-transparent'
                  : 'text-slate-500 border-slate-700 hover:border-slate-600'
                }`}
              style={{
                backgroundColor: isActive ? config.color + '22' : undefined,
                borderColor: isActive ? config.color + '66' : undefined,
                color: isActive ? config.color : undefined,
              }}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-[220px] md:h-[300px] px-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                speciesConfig[name as SpeciesKey]?.label || name,
              ]}
              labelStyle={{ color: '#94A3B8' }}
            />
            {(Object.keys(speciesConfig) as SpeciesKey[]).map(species => {
              if (!visibleSpecies.has(species)) return null;
              return (
                <Line
                  key={species}
                  type="monotone"
                  dataKey={species}
                  stroke={speciesConfig[species].color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: speciesConfig[species].color }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily detail rows */}
      <div className="mt-1">
        <div className="px-3 py-1.5">
          <span className="text-slate-500 text-[11px] uppercase tracking-wide">Daily Breakdown</span>
        </div>

        {days.map(day => {
          const isExpanded = expandedDay === day.date;
          return (
            <DayRow
              key={day.date}
              day={day}
              isExpanded={isExpanded}
              onToggle={() => setExpandedDay(isExpanded ? null : day.date)}
              visibleSpecies={visibleSpecies}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Day Row Component ---

function DayRow({ day, isExpanded, onToggle, visibleSpecies }: {
  day: HistoricalDay;
  isExpanded: boolean;
  onToggle: () => void;
  visibleSpecies: Set<SpeciesKey>;
}) {
  const fc = day.fishCount;

  // Find the top species to show in the summary line
  const topSpecies = (Object.keys(speciesConfig) as SpeciesKey[])
    .map(k => ({ key: k, count: getCount(fc, k), label: speciesConfig[k].label }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const tempF = day.waterTempF !== null ? Math.round(day.waterTempF) : null;
  const flowK = day.flowCfs !== null ? Math.round(day.flowCfs / 1000) : null;

  return (
    <div className={`border-t border-slate-800 ${isExpanded ? 'bg-slate-800/40' : ''}`}>
      {/* Summary row - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        {/* Date */}
        <div className="w-16 shrink-0">
          <div className="text-slate-300 text-sm font-medium">{day.dayOfWeek}</div>
          <div className="text-slate-500 text-xs">{formatMediumDate(day.date)}</div>
        </div>

        {/* Top species counts */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {topSpecies.length > 0 ? (
            topSpecies.map(s => (
              <span key={s.key} className="text-sm tabular-nums">
                <span className="text-slate-500">{s.label.slice(0, 4)}</span>{' '}
                <span className="text-slate-200 font-medium">{s.count.toLocaleString()}</span>
              </span>
            ))
          ) : (
            <span className="text-slate-600 text-sm">No fish counted</span>
          )}
        </div>

        {/* Conditions mini */}
        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
          {tempF !== null && <span>{tempF}°</span>}
          {flowK !== null && <span>{flowK}K</span>}
          <span>{day.moon.emoji}</span>
        </div>

        {/* Expand indicator */}
        <span className="text-slate-600 text-xs">{isExpanded ? '▾' : '▸'}</span>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* All species counts */}
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wide mb-1">Fish Counts</div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {(Object.keys(speciesConfig) as SpeciesKey[]).map(key => {
                const count = getCount(fc, key);
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{speciesConfig[key].label}</span>
                    <span className="text-slate-100 text-sm tabular-nums font-medium">
                      {count > 0 ? count.toLocaleString() : '–'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wide mb-1">Conditions</div>
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Water" value={tempF !== null ? `${tempF}°F` : '–'} />
              <MiniStat label="Flow" value={flowK !== null ? `${flowK}K CFS` : '–'} />
              <MiniStat label="Moon" value={`${day.moon.emoji} ${day.moon.phase.split(' ')[0]}`} />
            </div>
          </div>

          {/* Tide schedule */}
          {day.tideEvents.length > 0 && (
            <div>
              <div className="text-slate-500 text-[11px] uppercase tracking-wide mb-1">Tides (Astoria)</div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {day.tideEvents.map((te, i) => (
                  <TideChip key={i} event={te} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded px-2 py-1.5">
      <div className="text-slate-100 text-sm font-medium">{value}</div>
      <div className="text-slate-500 text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  );
}

function TideChip({ event }: { event: TideEvent }) {
  const isHigh = event.type === 'H';
  return (
    <span className="text-xs">
      <span className={isHigh ? 'text-sky-400' : 'text-slate-400'}>
        {isHigh ? 'H' : 'L'}
      </span>
      <span className="text-slate-300"> {formatTideTime(event.time)}</span>
      <span className="text-slate-500"> {event.level.toFixed(1)}ft</span>
    </span>
  );
}

// --- Helpers ---

function getCount(fc: HistoricalDay['fishCount'], key: SpeciesKey): number {
  return fc[key as keyof typeof fc] as number || 0;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMediumDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTideTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'p' : 'a';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${mStr}${ampm}`;
}
