import { format, subDays } from 'date-fns';
import { DailyConditions, DashboardData } from '../types';
import { fetchFishCounts } from './dart';
import { fetchWaterFlow } from './usgs';
import { fetchTideData } from './noaa';
import { fetchWeather } from './weather';
import { fetchSunData } from './sun';
import { getMoonPhase } from './moon';
import { calculateScore, generateRecommendation } from '../scoring';

export async function fetchDashboardData(): Promise<DashboardData> {
  // Fetch all data in parallel
  const [fishCounts, waterFlow, tide, weather, sunToday] = await Promise.all([
    fetchFishCounts(5),
    fetchWaterFlow(),
    fetchTideData(),
    fetchWeather(),
    fetchSunData(),
  ]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const moonToday = getMoonPhase(new Date());

  // Build daily conditions for each day
  const historicalDays: DailyConditions[] = [];

  for (const fishCount of fishCounts) {
    const date = new Date(fishCount.date + 'T12:00:00');
    const moon = getMoonPhase(date);

    // Fetch sun data for this specific date
    const isToday = fishCount.date === today;
    const sunData = isToday ? sunToday : await fetchSunData(date);

    const dayConditions: DailyConditions = {
      date: fishCount.date,
      dayOfWeek: format(date, 'EEEE'),
      fishCount,
      waterFlow: null, // Historical water flow not available
      tide: null, // Historical tide not available
      weather: null, // Historical weather not available
      sun: sunData,
      moon,
      score: calculateScore({
        fishCount,
        waterFlow: null,
        weather: null,
        tide: null,
        moon,
      }),
    };

    historicalDays.push(dayConditions);
  }

  // Build current conditions with real-time data
  // Use the most recent fish count, but current environmental data
  const latestFishCount = fishCounts[0] || null;
  const currentConditions: DailyConditions | null = latestFishCount
    ? {
        date: today,
        dayOfWeek: format(new Date(), 'EEEE'),
        fishCount: latestFishCount,
        waterFlow,
        tide,
        weather,
        sun: sunToday,
        moon: moonToday,
        score: calculateScore({
          fishCount: latestFishCount,
          waterFlow,
          weather,
          tide,
          moon: moonToday,
        }),
      }
    : null;

  // Generate recommendation
  const recommendation = currentConditions
    ? generateRecommendation({
        score: currentConditions.score,
        fishCount: currentConditions.fishCount,
        tide: currentConditions.tide,
        weather: currentConditions.weather,
        sun: currentConditions.sun,
      })
    : 'Unable to load current conditions.';

  return {
    lastUpdated: new Date().toISOString(),
    currentConditions,
    historicalDays,
    recommendation,
  };
}
