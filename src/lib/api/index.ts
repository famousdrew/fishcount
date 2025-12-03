import { format, addDays } from 'date-fns';
import { DailyConditions, DashboardData, DayForecast } from '../types';
import { fetchFishCounts } from './dart';
import { fetchWaterFlow } from './usgs';
import { fetchTideData, fetchTideForecast, fetchWaterTemp } from './noaa';
import { fetchWeather, fetchWeatherForecast } from './weather';
import { fetchSunData } from './sun';
import { getMoonPhase } from './moon';
import { calculateScore, generateRecommendation } from '../scoring';

export async function fetchDashboardData(): Promise<DashboardData> {
  // Fetch all data in parallel
  const [
    fishCounts,
    waterFlow,
    tide,
    weather,
    sunToday,
    waterTemp,
    weatherForecast,
    tideForecast,
  ] = await Promise.all([
    fetchFishCounts(5),
    fetchWaterFlow(),
    fetchTideData(),
    fetchWeather(),
    fetchSunData(),
    fetchWaterTemp(),
    fetchWeatherForecast(3),
    fetchTideForecast(3),
  ]);

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const moonToday = getMoonPhase(now);

  // Build 3-day forecast
  const forecast: DayForecast[] = [];
  for (let i = 0; i < 3; i++) {
    const forecastDate = addDays(now, i);
    const dateStr = format(forecastDate, 'yyyy-MM-dd');
    const isToday = i === 0;

    // Get day label
    let dayLabel: string;
    if (i === 0) dayLabel = 'Today';
    else if (i === 1) dayLabel = 'Tomorrow';
    else dayLabel = format(forecastDate, 'EEEE');

    // Get data for this day
    const dayWeather = isToday ? weather : (weatherForecast.get(dateStr) || null);
    const dayTide = isToday ? tide : (tideForecast.get(dateStr) || null);
    const daySun = isToday ? sunToday : await fetchSunData(forecastDate);
    const dayMoon = getMoonPhase(forecastDate);

    forecast.push({
      date: dateStr,
      dayLabel,
      weather: dayWeather,
      tide: dayTide,
      sun: daySun,
      moon: dayMoon,
      waterTempF: waterTemp?.tempF || null,
    });
  }

  // Build historical days from fish counts
  const historicalDays: DailyConditions[] = [];

  for (const fishCount of fishCounts) {
    const date = new Date(fishCount.date + 'T12:00:00');
    const dateStr = fishCount.date;
    const moon = getMoonPhase(date);

    // Get tide data for this historical day
    const dayTide = tideForecast.get(dateStr) || null;

    // Fetch sun data for this specific date
    const sunData = await fetchSunData(date);

    const dayConditions: DailyConditions = {
      date: fishCount.date,
      dayOfWeek: format(date, 'EEEE'),
      fishCount,
      waterFlow: null, // Historical water flow not available
      tide: dayTide,
      weather: null, // Historical weather not available
      sun: sunData,
      moon,
      score: calculateScore({
        fishCount,
        waterFlow: null,
        weather: null,
        tide: dayTide,
        moon,
      }),
    };

    historicalDays.push(dayConditions);
  }

  // Build current conditions with real-time data
  const latestFishCount = fishCounts[0] || null;
  const currentConditions: DailyConditions | null = latestFishCount
    ? {
        date: today,
        dayOfWeek: format(now, 'EEEE'),
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
    forecast,
    historicalDays,
    recommendation,
  };
}
