'use client';

import { DailyConditions } from '@/lib/types';
import { ScoreBadge } from './ScoreBadge';

interface HeroProps {
  conditions: DailyConditions | null;
  recommendation: string;
  lastUpdated: string;
}

export function Hero({ conditions, recommendation, lastUpdated }: HeroProps) {
  if (!conditions) {
    return (
      <section className="bg-gradient-to-b from-blue-50 to-white p-6 md:p-8 rounded-xl">
        <p className="text-gray-500">Loading current conditions...</p>
      </section>
    );
  }

  const { score, waterFlow, tide, sun, weather, fishCount } = conditions;

  // Get water temp from USGS or DART
  const waterTempF = waterFlow?.waterTempF ?? (fishCount.waterTempC ? (fishCount.waterTempC * 9) / 5 + 32 : null);

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white p-6 md:p-8 rounded-xl">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        Current Conditions
      </h2>

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Score badge - largest element */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm">
          <ScoreBadge status={score.status} size="lg" />
          <p className="mt-2 text-sm text-gray-500">
            {score.total}/{score.maxScore} points
          </p>
        </div>

        {/* Water temp */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm">
          <span className="text-3xl mb-1">🌡️</span>
          <span className="text-2xl font-bold text-blue-900">
            {waterTempF !== null ? `${Math.round(waterTempF)}°F` : '--'}
          </span>
          <span className="text-sm text-gray-500">Water Temp</span>
        </div>

        {/* Flow rate */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm">
          <span className="text-3xl mb-1">💧</span>
          <span className="text-2xl font-bold text-blue-900">
            {waterFlow ? `${(waterFlow.flowCfs / 1000).toFixed(0)}K` : '--'}
          </span>
          <span className="text-sm text-gray-500">CFS Flow</span>
        </div>
      </div>

      {/* Secondary info row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Tide */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <span className="text-xl">🌊</span>
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {tide?.status || '--'}
            </p>
            <p className="text-xs text-gray-500">Tide</p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <span className="text-xl">💨</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {weather ? `${weather.windSpeedMph} mph ${weather.windDirection}` : '--'}
            </p>
            <p className="text-xs text-gray-500">Wind</p>
          </div>
        </div>

        {/* Sunrise */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <span className="text-xl">🌅</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {sun?.sunrise || '--'}
            </p>
            <p className="text-xs text-gray-500">Sunrise</p>
          </div>
        </div>

        {/* Sunset */}
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <span className="text-xl">🌇</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {sun?.sunset || '--'}
            </p>
            <p className="text-xs text-gray-500">Sunset</p>
          </div>
        </div>
      </div>

      {/* Recommendation text */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-gray-700">{recommendation}</p>
        <p className="text-xs text-gray-400 mt-2">
          Last updated: {new Date(lastUpdated).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      </div>
    </section>
  );
}
