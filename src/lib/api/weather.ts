import { WeatherData } from '../types';

// Portland, OR coordinates
const LATITUDE = 45.5152;
const LONGITUDE = -122.6784;
const NWS_API_URL = 'https://api.weather.gov';

interface NwsPointsResponse {
  properties: {
    forecastHourly: string;
    forecast: string;
  };
}

interface NwsForecastPeriod {
  name: string;
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  icon: string;
  isDaytime: boolean;
}

interface NwsForecastResponse {
  properties: {
    periods: NwsForecastPeriod[];
  };
}

// Fetch current weather (hourly)
export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    const pointsResponse = await fetch(
      `${NWS_API_URL}/points/${LATITUDE},${LONGITUDE}`,
      {
        headers: { 'User-Agent': 'FishCount (fishcount@example.com)' },
        next: { revalidate: 3600 },
      }
    );

    if (!pointsResponse.ok) {
      throw new Error(`NWS points API error: ${pointsResponse.status}`);
    }

    const pointsData: NwsPointsResponse = await pointsResponse.json();
    const forecastUrl = pointsData.properties.forecastHourly;

    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'FishCount (fishcount@example.com)' },
      next: { revalidate: 1800 },
    });

    if (!forecastResponse.ok) {
      throw new Error(`NWS forecast API error: ${forecastResponse.status}`);
    }

    const forecastData: NwsForecastResponse = await forecastResponse.json();
    return parseWeatherPeriod(forecastData.properties.periods[0]);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Fetch multi-day forecast (returns weather for next 3 days)
export async function fetchWeatherForecast(days: number = 3): Promise<Map<string, WeatherData>> {
  const result = new Map<string, WeatherData>();

  try {
    const pointsResponse = await fetch(
      `${NWS_API_URL}/points/${LATITUDE},${LONGITUDE}`,
      {
        headers: { 'User-Agent': 'FishCount (fishcount@example.com)' },
        next: { revalidate: 3600 },
      }
    );

    if (!pointsResponse.ok) {
      throw new Error(`NWS points API error: ${pointsResponse.status}`);
    }

    const pointsData: NwsPointsResponse = await pointsResponse.json();

    // Use the daily forecast (not hourly) for multi-day
    const forecastUrl = pointsData.properties.forecast;

    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'FishCount (fishcount@example.com)' },
      next: { revalidate: 1800 },
    });

    if (!forecastResponse.ok) {
      throw new Error(`NWS forecast API error: ${forecastResponse.status}`);
    }

    const forecastData: NwsForecastResponse = await forecastResponse.json();

    // Group by date, prefer daytime forecasts
    const dateMap = new Map<string, NwsForecastPeriod>();

    for (const period of forecastData.properties.periods) {
      const date = period.startTime.split('T')[0];
      // Prefer daytime periods
      if (!dateMap.has(date) || period.isDaytime) {
        dateMap.set(date, period);
      }
    }

    // Get the first N days
    let count = 0;
    for (const [date, period] of dateMap) {
      if (count >= days) break;
      const weather = parseWeatherPeriod(period);
      if (weather) {
        result.set(date, weather);
      }
      count++;
    }
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
  }

  return result;
}

function parseWeatherPeriod(period: NwsForecastPeriod | undefined): WeatherData | null {
  if (!period) return null;

  let windSpeedMph = 0;
  const windMatch = period.windSpeed.match(/(\d+)/);
  if (windMatch) {
    windSpeedMph = parseInt(windMatch[1], 10);
  }

  let tempF = period.temperature;
  if (period.temperatureUnit === 'C') {
    tempF = (period.temperature * 9) / 5 + 32;
  }

  return {
    tempF,
    windSpeedMph,
    windDirection: period.windDirection,
    conditions: period.shortForecast,
    icon: period.icon,
  };
}
