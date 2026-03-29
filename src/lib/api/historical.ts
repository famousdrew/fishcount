import { HistoricalDay, TideEvent } from '../types';
import { shortDayName, nowPacific } from '../timezone';
import { fetchFishCounts } from './dart';
import { fetchDailyFlow } from './usgs';
import { getMoonPhase } from './moon';

const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const ASTORIA_STATION = '9439040';

// Fetch all historical data for the counts page
export async function fetchHistoricalData(days: number = 14): Promise<HistoricalDay[]> {
  const [fishCounts, dailyFlow, tideHistory] = await Promise.all([
    fetchFishCounts(days).catch(() => []),
    fetchDailyFlow(days).catch(() => new Map<string, number>()),
    fetchTideHistory(days).catch(() => new Map<string, TideEvent[]>()),
  ]);

  return fishCounts.map(fc => {
    const date = new Date(fc.date + 'T12:00:00');
    const waterTempF = fc.waterTempC !== null ? (fc.waterTempC * 9) / 5 + 32 : null;

    return {
      date: fc.date,
      dayOfWeek: shortDayName(fc.date),
      fishCount: fc,
      flowCfs: dailyFlow.get(fc.date) ?? null,
      waterTempF,
      tideEvents: tideHistory.get(fc.date) ?? [],
      moon: getMoonPhase(date),
    };
  });
}

// Fetch tide high/low events for a date range
async function fetchTideHistory(days: number): Promise<Map<string, TideEvent[]>> {
  const result = new Map<string, TideEvent[]>();
  const now = nowPacific();
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const params = new URLSearchParams({
    station: ASTORIA_STATION,
    product: 'predictions',
    datum: 'MLLW',
    units: 'english',
    time_zone: 'lst_ldt',
    application: 'fishcount',
    format: 'json',
    begin_date: fmt(start),
    end_date: fmt(now),
    interval: 'hilo',
  });

  const response = await fetch(`${NOAA_API_URL}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) return result;

  const data = await response.json();
  const predictions = data.predictions || [];

  for (const pred of predictions) {
    // pred.t = "2026-03-26 07:26"
    const [date, time] = pred.t.split(' ');
    if (!result.has(date)) result.set(date, []);
    result.get(date)!.push({
      time: time.slice(0, 5), // "07:26"
      type: pred.type as 'H' | 'L',
      level: parseFloat(pred.v),
    });
  }

  return result;
}
