'use client';

import { useState } from 'react';
import { ForecastDay, TideEvent } from '@/lib/types';

interface ForecastProps {
  forecast: ForecastDay[];
}

export function Forecast({ forecast }: ForecastProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (forecast.length === 0) return null;

  const selected = forecast[selectedIdx];

  return (
    <div className="border-t border-slate-700">
      {/* Day tabs */}
      <div className="flex border-b border-slate-700">
        {forecast.map((day, i) => (
          <button
            key={day.date}
            onClick={() => setSelectedIdx(i)}
            className={`flex-1 py-2.5 text-center text-base font-medium transition-colors
              ${i === selectedIdx
                ? 'text-slate-100 bg-slate-800 border-b-2 border-sky-400'
                : 'text-slate-500 hover:text-slate-400'
              }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Selected day detail */}
      <div className="px-3 py-3">
        {/* Weather row */}
        {selected.weather ? (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getWeatherEmoji(selected.weather.conditions)}</span>
              <div>
                <span className="text-slate-100 text-2xl font-bold">{selected.weather.tempF}°F</span>
                <span className="text-slate-400 text-base ml-2">{selected.weather.conditions}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-200 text-base font-medium">
                {selected.weather.windSpeedMph} mph {selected.weather.windDirection}
              </div>
              <div className="text-slate-500 text-sm">wind</div>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-base mb-3">Weather data unavailable</div>
        )}

        {/* Conditions mini grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MiniStat
            label="sunrise"
            value={selected.sun?.sunrise ?? '–'}
          />
          <MiniStat
            label="sunset"
            value={selected.sun?.sunset ?? '–'}
          />
          <MiniStat
            label="moon"
            value={`${selected.moon.emoji} ${selected.moon.phase.split(' ')[0]}`}
          />
        </div>

        {/* Tide schedule */}
        {selected.tideEvents.length > 0 && (
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide mb-1.5">
              Tides · Astoria
            </div>
            <div className="flex gap-3 flex-wrap">
              {selected.tideEvents.map((te, i) => (
                <TideChip key={i} event={te} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded px-2.5 py-2">
      <div className="text-slate-100 text-base font-medium truncate">{value}</div>
      <div className="text-slate-500 text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}

function TideChip({ event }: { event: TideEvent }) {
  const isHigh = event.type === 'H';
  return (
    <div className={`flex items-center gap-1.5 text-base ${isHigh ? 'text-sky-400' : 'text-slate-400'}`}>
      <span className="font-medium">{isHigh ? 'H' : 'L'}</span>
      <span className="text-slate-300">{formatTideTime(event.time)}</span>
      <span className="text-slate-500 text-sm">{event.level.toFixed(1)}ft</span>
    </div>
  );
}

function formatTideTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'p' : 'a';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${mStr}${ampm}`;
}

function getWeatherEmoji(conditions: string): string {
  const c = conditions.toLowerCase();
  if (c.includes('rain') || c.includes('shower')) return '🌧';
  if (c.includes('snow')) return '🌨';
  if (c.includes('thunder')) return '⛈';
  if (c.includes('fog') || c.includes('mist')) return '🌫';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('partly')) return '⛅';
  if (c.includes('sun') || c.includes('clear')) return '☀️';
  return '🌤';
}
