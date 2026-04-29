'use client';

import { WaterFlow, TideData, WeatherData, SunData, MoonData, Score } from '@/lib/types';
import { TideStation } from '@/lib/stations';
import { TideStationPicker } from './TideStationPicker';

interface ConditionsGridProps {
  waterTempF: number | null;
  waterFlow: WaterFlow | null;
  tide: TideData | null;
  weather: WeatherData | null;
  sun: SunData | null;
  moon: MoonData;
  score: Score;
  tideStation: TideStation;
}

function getFactorColor(factorName: string, score: Score): string {
  const factor = score.factors.find(f => f.name === factorName);
  if (!factor || !factor.available) return 'border-slate-700';
  if (factor.score >= 8) return 'border-emerald-500';
  if (factor.score >= 5) return 'border-amber-500';
  return 'border-red-500';
}

export function ConditionsGrid({ waterTempF, waterFlow, tide, weather, sun, moon, score, tideStation }: ConditionsGridProps) {
  const tideDisplay = tide
    ? tide.status === 'incoming' ? 'Incmg' : tide.status === 'outgoing' ? 'Outgng' : 'Slack'
    : '—';

  const tideTime = tide?.status === 'incoming' && tide.nextHighTime
    ? formatShortTime(tide.nextHighTime)
    : tide?.status === 'outgoing' && tide.nextLowTime
      ? formatShortTime(tide.nextLowTime)
      : '';

  const tideRate = tide?.currentRateFtPerHr != null
    ? `${Math.abs(tide.currentRateFtPerHr).toFixed(1)}ft/hr`
    : '';

  return (
    <div className="grid grid-cols-3 border-t border-slate-700">
      <Cell
        value={waterTempF !== null ? `${Math.round(waterTempF)}°F` : '—'}
        label="water"
        borderColor={getFactorColor('Water Temp', score)}
      />
      <Cell
        value={waterFlow ? `${Math.round(waterFlow.flowCfs / 1000)}K` : '—'}
        label="flow"
        borderColor={getFactorColor('Flow', score)}
      />
      <Cell
        value={`${moon.emoji} ${moon.phase.split(' ')[0]}`}
        label="moon"
        borderColor={getFactorColor('Moon', score)}
      />
      <Cell
        value={weather ? `${weather.windSpeedMph} mph` : '—'}
        label="wind"
        borderColor={getFactorColor('Wind', score)}
      />
      <TideCell
        value={tideDisplay}
        sublabel={[tideRate, tideTime].filter(Boolean).join(' · ')}
        borderColor={getFactorColor('Tide', score)}
        station={tideStation}
      />
      <Cell
        value={sun?.sunrise || '—'}
        label="sunrise"
        borderColor="border-slate-700"
      />
    </div>
  );
}

function Cell({ value, sublabel, label, borderColor }: {
  value: string;
  sublabel?: string;
  label: string;
  borderColor: string;
}) {
  return (
    <div className={`border-b border-r border-slate-700 border-l-2 ${borderColor} px-3 py-2.5`}>
      <div className="text-slate-100 font-bold text-xl leading-tight">{value}</div>
      {sublabel && <div className="text-slate-500 text-sm">{sublabel}</div>}
      <div className="text-slate-500 text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}

function TideCell({ value, sublabel, borderColor, station }: {
  value: string;
  sublabel?: string;
  borderColor: string;
  station: TideStation;
}) {
  return (
    <div className={`border-b border-r border-slate-700 border-l-2 ${borderColor} px-3 py-2.5 relative`}>
      <div className="text-slate-100 font-bold text-xl leading-tight">{value}</div>
      {sublabel && <div className="text-slate-500 text-sm">{sublabel}</div>}
      <div className="text-slate-500 text-xs uppercase tracking-wide">tide</div>
      <div className="mt-0.5">
        <TideStationPicker current={station} />
      </div>
    </div>
  );
}

function formatShortTime(timeStr: string): string {
  try {
    const parts = timeStr.split(' ');
    if (parts.length < 2) return '';
    const [h, m] = parts[1].split(':').map(Number);
    const ampm = h >= 12 ? 'p' : 'a';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
  } catch {
    return '';
  }
}
