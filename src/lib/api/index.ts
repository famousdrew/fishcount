import { addDays } from 'date-fns';
import { DashboardData, ForecastDay, TideEvent } from '../types';
import { nowPacific, todayPacific, dayName } from '../timezone';
import { fetchFishCounts } from './dart';
import { fetchWaterFlow } from './usgs';
import { fetchTideData, fetchWaterTemp, fetchTideEventsForecast } from './noaa';
import { fetchWeather, fetchWeatherForecast } from './weather';
import { fetchSunData } from './sun';
import { getMoonPhase } from './moon';
import { calculateScore, calculateFishTrends, getBestSeason, generateHeadlineStat, generateContextLine } from '../scoring';

// Each source fetches independently — one failure doesn't take down the others
async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Data fetch failed:`, error);
    return fallback;
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const now = nowPacific();
  console.log(`[FishCount] Pacific time: ${now.toString()}, UTC: ${new Date().toISOString()}`);

  // All fetches in parallel, each independently guarded
  const [fishCounts, waterFlow, tide, weather, sunToday, waterTemp, weatherForecast, tideEventsForecast] = await Promise.all([
    safeFetch(() => fetchFishCounts(7), []),
    safeFetch(() => fetchWaterFlow(), null),
    safeFetch(() => fetchTideData(), null),
    safeFetch(() => fetchWeather(), null),
    safeFetch(() => fetchSunData(), null),
    safeFetch(() => fetchWaterTemp(), null),
    safeFetch(() => fetchWeatherForecast(3), new Map()),
    safeFetch(() => fetchTideEventsForecast(3), new Map()),
  ]);

  const moon = getMoonPhase(now);

  // Determine water temp: prefer USGS, fall back to NOAA, then DART
  let waterTempF: number | null = waterFlow?.waterTempF ?? null;
  if (waterTempF === null && waterTemp) {
    waterTempF = waterTemp.tempF;
  }
  if (waterTempF === null && fishCounts.length > 0 && fishCounts[0].waterTempC !== null) {
    waterTempF = (fishCounts[0].waterTempC * 9) / 5 + 32;
  }

  // Season + trends
  const season = getBestSeason(fishCounts, now);
  const fishTrends = calculateFishTrends(fishCounts);

  // Score using real-time conditions + fish trends
  const score = calculateScore({
    fishCounts,
    waterFlow,
    waterTempF,
    weather,
    tide,
    moon,
    season,
  });

  // Build 3-day forecast
  const forecast = await buildForecast(now, weather, sunToday, weatherForecast, tideEventsForecast);

  // Build headline pieces
  const headlineStat = generateHeadlineStat(fishTrends, season);
  const contextLine = generateContextLine({ tide, weather, sun: sunToday });

  return {
    lastUpdated: new Date().toISOString(),
    score,
    waterFlow,
    waterTempF,
    tide,
    weather,
    sun: sunToday,
    moon,
    fishCounts,
    fishTrends,
    primarySpecies: season,
    forecast,
    headlineStat,
    contextLine,
  };
}

async function buildForecast(
  now: Date,
  todayWeather: import('../types').WeatherData | null,
  todaySun: import('../types').SunData | null,
  weatherForecast: Map<string, import('../types').WeatherData>,
  tideEventsForecast: Map<string, TideEvent[]>,
): Promise<ForecastDay[]> {
  const days: ForecastDay[] = [];

  for (let i = 0; i < 3; i++) {
    const date = addDays(now, i);
    const dateStr = formatDateStr(date);
    const isToday = i === 0;

    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = dayName(dateStr);

    const dayWeather = isToday ? todayWeather : (weatherForecast.get(dateStr) ?? null);
    const sun = isToday ? todaySun : await safeFetch(() => fetchSunData(date), null);
    const tideEvents = tideEventsForecast.get(dateStr) ?? [];

    days.push({
      date: dateStr,
      label,
      weather: dayWeather,
      nightWeather: null,
      tideEvents,
      sun,
      moon: getMoonPhase(date),
    });
  }

  return days;
}

// Format Date to yyyy-MM-dd without depending on timezone-unaware format()
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
