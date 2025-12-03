'use client';

import { DayForecast } from '@/lib/types';
import { ForecastCard } from './ForecastCard';

interface HeroProps {
  forecast: DayForecast[];
  recommendation: string;
  lastUpdated: string;
  flowCfs: number | null;
}

export function Hero({ forecast, recommendation, lastUpdated, flowCfs }: HeroProps) {
  if (forecast.length === 0) {
    return (
      <section className="bg-gradient-to-b from-blue-50 to-white p-6 md:p-8 rounded-xl">
        <p className="text-gray-500">Loading forecast...</p>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white p-4 md:p-6 rounded-xl">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        3-Day Fishing Forecast
      </h2>

      {/* 3-Day Forecast Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
        {forecast.map((day, idx) => (
          <ForecastCard key={day.date} forecast={day} isToday={idx === 0} />
        ))}
      </div>

      {/* Flow rate banner */}
      {flowCfs && (
        <div className="flex items-center justify-center gap-2 bg-blue-50 rounded-lg py-2 px-4 mb-4">
          <span className="text-lg">💧</span>
          <span className="text-blue-900 font-medium">
            Columbia River Flow: {(flowCfs / 1000).toFixed(0)}K CFS
          </span>
        </div>
      )}

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
