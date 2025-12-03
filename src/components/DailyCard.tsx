'use client';

import { DailyConditions } from '@/lib/types';
import { ScoreBadge } from './ScoreBadge';
import { ScoreDots } from './ScoreDots';

interface DailyCardProps {
  conditions: DailyConditions;
}

export function DailyCard({ conditions }: DailyCardProps) {
  const { date, dayOfWeek, fishCount, waterFlow, tide, weather, sun, moon, score } = conditions;

  // Format date nicely
  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Get water temp
  const waterTempF = waterFlow?.waterTempF ?? (fishCount.waterTempC ? (fishCount.waterTempC * 9) / 5 + 32 : null);

  return (
    <article className="bg-stone-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-blue-900">{dayOfWeek}, {formattedDate}</p>
          <ScoreDots score={score.total} maxScore={score.maxScore} />
        </div>
        <ScoreBadge status={score.status} size="sm" />
      </div>

      {/* Fish counts grid */}
      <div className="p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Fish Counts
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <FishCountItem label="Chinook" count={fishCount.chinook} highlight />
          <FishCountItem label="Steelhead" count={fishCount.steelhead} highlight />
          <FishCountItem label="Sockeye" count={fishCount.sockeye} />
          <FishCountItem label="Coho" count={fishCount.coho} />
          <FishCountItem label="Shad" count={fishCount.shad} />
          <FishCountItem label="Lamprey" count={fishCount.lamprey} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mx-4" />

      {/* Conditions */}
      <div className="p-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Conditions
        </h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <ConditionItem
            icon="🌡️"
            label="Water"
            value={waterTempF !== null ? `${Math.round(waterTempF)}°F` : '--'}
          />
          <ConditionItem
            icon="💧"
            label="Flow"
            value={waterFlow ? `${(waterFlow.flowCfs / 1000).toFixed(0)}K CFS` : '--'}
          />
          <ConditionItem
            icon="🌊"
            label="Tide"
            value={tide?.status ? tide.status.charAt(0).toUpperCase() + tide.status.slice(1) : '--'}
          />
          <ConditionItem
            icon="💨"
            label="Wind"
            value={weather ? `${weather.windSpeedMph} mph` : '--'}
          />
          <ConditionItem
            icon={moon.emoji}
            label="Moon"
            value={moon.phase.split(' ')[0]}
          />
          <ConditionItem
            icon="🌅"
            label="Sunrise"
            value={sun?.sunrise || '--'}
          />
        </div>
      </div>
    </article>
  );
}

function FishCountItem({
  label,
  count,
  highlight = false,
}: {
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg border ${highlight ? 'border-blue-200 bg-white' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-blue-900' : 'text-gray-700'}`}>
        {count.toLocaleString()}
      </p>
    </div>
  );
}

function ConditionItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div>
        <span className="text-gray-500">{label}:</span>{' '}
        <span className="font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );
}
