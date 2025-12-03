'use client';

import { DayForecast } from '@/lib/types';

interface ForecastCardProps {
  forecast: DayForecast;
  isToday?: boolean;
}

export function ForecastCard({ forecast, isToday = false }: ForecastCardProps) {
  const { dayLabel, weather, tide, sun, moon, waterTempF } = forecast;

  // Format tide display
  const tideDisplay = tide
    ? `${tide.status === 'incoming' ? 'Incoming' : 'Outgoing'} ${tide.nextHighLevel?.toFixed(1) || tide.nextLowLevel?.toFixed(1) || ''}\'`
    : '--';

  return (
    <div
      className={`
        bg-white rounded-xl p-4 shadow-sm border-2
        ${isToday ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'}
      `}
    >
      {/* Day label */}
      <div className="text-center mb-3">
        <h3 className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {dayLabel}
        </h3>
        {isToday && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Now
          </span>
        )}
      </div>

      {/* Weather icon and temp */}
      <div className="text-center mb-3">
        <div className="text-3xl mb-1">
          {weather?.conditions?.toLowerCase().includes('rain') ? '🌧️' :
           weather?.conditions?.toLowerCase().includes('cloud') ? '☁️' :
           weather?.conditions?.toLowerCase().includes('sun') || weather?.conditions?.toLowerCase().includes('clear') ? '☀️' :
           '🌤️'}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {weather ? `${weather.tempF}°` : '--'}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {weather?.conditions || '--'}
        </div>
      </div>

      {/* Details grid */}
      <div className="space-y-2 text-sm">
        {/* Water temp */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">🌡️ Water</span>
          <span className="font-medium">
            {waterTempF ? `${Math.round(waterTempF)}°F` : '--'}
          </span>
        </div>

        {/* Wind */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">💨 Wind</span>
          <span className="font-medium">
            {weather ? `${weather.windSpeedMph} mph ${weather.windDirection}` : '--'}
          </span>
        </div>

        {/* Tide */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">🌊 Tide</span>
          <span className="font-medium">{tideDisplay}</span>
        </div>

        {/* Sunrise */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">🌅</span>
          <span className="font-medium">{sun?.sunrise || '--'}</span>
        </div>

        {/* Moon */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{moon.emoji}</span>
          <span className="font-medium text-xs">{moon.phase.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}
