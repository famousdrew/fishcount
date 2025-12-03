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

  // Build daily conditions for each day
  const historicalDays: DailyConditions[] = [];

  for (const fishCount of fishCounts) {
    const date = new Date(fishCount.date + 'T12:00:00');
    const moon = getMoonPhase(date);

    // For historical days, we use the fish count data but current conditions for demo
    // In production, you'd want historical weather/tide data too
    const isToday = fishCount.date === format(new Date(), 'yyyy-MM-dd');
    const isYesterday = fishCount.date === format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Fetch sun data for this specific date
    const sunData = isToday ? sunToday : await fetchSunData(date);

    const dayConditions: DailyConditions = {
      date: fishCount.date,
      dayOfWeek: format(date, 'EEEE'),
      fishCount,
      waterFlow: isToday || isYesterday ? waterFlow : null,
      tide: isToday ? tide : null,
      weather: isToday ? weather : null,
      sun: sunData,
      moon,
      score: calculateScore({
        fishCount,
        waterFlow: isToday || isYesterday ? waterFlow : null,
        weather: isToday ? weather : null,
        tide: isToday ? tide : null,
        moon,
      }),
    };

    historicalDays.push(dayConditions);
  }

  // Current conditions is the most recent day (first in the sorted list)
  const currentConditions = historicalDays[0] || null;

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
