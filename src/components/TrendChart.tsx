'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailyConditions } from '@/lib/types';

interface TrendChartProps {
  days: DailyConditions[];
}

const speciesConfig = {
  chinook: { color: '#DC2626', label: 'Chinook' },
  steelhead: { color: '#7C3AED', label: 'Steelhead' },
  sockeye: { color: '#F97316', label: 'Sockeye' },
  coho: { color: '#EC4899', label: 'Coho' },
  shad: { color: '#84CC16', label: 'Shad' },
  lamprey: { color: '#64748B', label: 'Lamprey' },
} as const;

type SpeciesKey = keyof typeof speciesConfig;

export function TrendChart({ days }: TrendChartProps) {
  const [visibleSpecies, setVisibleSpecies] = useState<Set<SpeciesKey>>(
    new Set(['chinook', 'steelhead'])
  );

  // Prepare chart data (reverse to show oldest first for left-to-right time flow)
  const chartData = [...days].reverse().map((day) => ({
    date: new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    chinook: day.fishCount.chinook,
    steelhead: day.fishCount.steelhead,
    sockeye: day.fishCount.sockeye,
    coho: day.fishCount.coho,
    shad: day.fishCount.shad,
    lamprey: day.fishCount.lamprey,
  }));

  const toggleSpecies = (species: SpeciesKey) => {
    setVisibleSpecies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(species)) {
        newSet.delete(species);
      } else {
        // Limit to 3 visible at once
        if (newSet.size >= 3) {
          const firstItem = newSet.values().next().value;
          if (firstItem) newSet.delete(firstItem);
        }
        newSet.add(species);
      }
      return newSet;
    });
  };

  return (
    <section className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        5-Day Fish Count Trends
      </h2>

      {/* Species toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(speciesConfig) as SpeciesKey[]).map((species) => {
          const config = speciesConfig[species];
          const isActive = visibleSpecies.has(species);

          return (
            <button
              key={species}
              onClick={() => toggleSpecies(species)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-colors
                ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-gray-600 border-gray-300 bg-white hover:border-gray-400'
                }
              `}
              style={{
                backgroundColor: isActive ? config.color : undefined,
                borderColor: isActive ? config.color : undefined,
              }}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Date</th>
              {(Object.keys(speciesConfig) as SpeciesKey[]).map((species) => (
                <th
                  key={species}
                  className="text-right py-2 px-2 font-medium"
                  style={{ color: speciesConfig[species].color }}
                >
                  {speciesConfig[species].label}
                </th>
              ))}
              <th className="text-right py-2 px-2 font-medium text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => {
              const total = row.chinook + row.steelhead + row.sockeye + row.coho + row.shad + row.lamprey;
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 text-gray-700">{row.date}</td>
                  {(Object.keys(speciesConfig) as SpeciesKey[]).map((species) => (
                    <td key={species} className="text-right py-2 px-2 tabular-nums">
                      {row[species].toLocaleString()}
                    </td>
                  ))}
                  <td className="text-right py-2 px-2 font-semibold tabular-nums text-gray-900">
                    {total.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="h-48 md:h-64 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#E5E7EB' }}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                speciesConfig[name as SpeciesKey]?.label || name,
              ]}
            />

            {(Object.keys(speciesConfig) as SpeciesKey[]).map((species) => {
              if (!visibleSpecies.has(species)) return null;

              const config = speciesConfig[species];
              return (
                <Line
                  key={species}
                  type="monotone"
                  dataKey={species}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: config.color }}
                  activeDot={{ r: 6, fill: config.color }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
