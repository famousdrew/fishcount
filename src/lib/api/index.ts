import { DashboardData } from '../types';
import { fetchFishCounts } from './dart';
import { fetchWaterFlow } from './usgs';
import { fetchTideData, fetchWaterTemp } from './noaa';
import { fetchWeather } from './weather';
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
  // All fetches in parallel, each independently guarded
  const [fishCounts, waterFlow, tide, weather, sunToday, waterTemp] = await Promise.all([
    safeFetch(() => fetchFishCounts(7), []),
    safeFetch(() => fetchWaterFlow(), null),
    safeFetch(() => fetchTideData(), null),
    safeFetch(() => fetchWeather(), null),
    safeFetch(() => fetchSunData(), null),
    safeFetch(() => fetchWaterTemp(), null),
  ]);

  const moon = getMoonPhase();

  // Determine water temp: prefer USGS, fall back to NOAA, then DART
  let waterTempF: number | null = waterFlow?.waterTempF ?? null;
  if (waterTempF === null && waterTemp) {
    waterTempF = waterTemp.tempF;
  }
  if (waterTempF === null && fishCounts.length > 0 && fishCounts[0].waterTempC !== null) {
    waterTempF = (fishCounts[0].waterTempC * 9) / 5 + 32;
  }

  // Season + trends
  const season = getBestSeason(fishCounts);
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
    headlineStat,
    contextLine,
  };
}
