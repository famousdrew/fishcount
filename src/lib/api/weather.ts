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
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  icon: string;
}

interface NwsForecastResponse {
  properties: {
    periods: NwsForecastPeriod[];
  };
}

export async function fetchWeather(): Promise<WeatherData | null> {
  try {
    // First, get the forecast URL for our coordinates
    const pointsResponse = await fetch(
      `${NWS_API_URL}/points/${LATITUDE},${LONGITUDE}`,
      {
        headers: {
          'User-Agent': 'FishCount (fishcount@example.com)',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!pointsResponse.ok) {
      throw new Error(`NWS points API error: ${pointsResponse.status}`);
    }

    const pointsData: NwsPointsResponse = await pointsResponse.json();
    const forecastUrl = pointsData.properties.forecastHourly;

    // Fetch the hourly forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: {
        'User-Agent': 'FishCount (fishcount@example.com)',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!forecastResponse.ok) {
      throw new Error(`NWS forecast API error: ${forecastResponse.status}`);
    }

    const forecastData: NwsForecastResponse = await forecastResponse.json();
    return parseWeatherData(forecastData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function parseWeatherData(data: NwsForecastResponse): WeatherData | null {
  const currentPeriod = data.properties.periods[0];
  if (!currentPeriod) {
    return null;
  }

  // Parse wind speed (format: "10 mph" or "5 to 10 mph")
  let windSpeedMph = 0;
  const windMatch = currentPeriod.windSpeed.match(/(\d+)/);
  if (windMatch) {
    windSpeedMph = parseInt(windMatch[1], 10);
  }

  // Convert temperature if needed
  let tempF = currentPeriod.temperature;
  if (currentPeriod.temperatureUnit === 'C') {
    tempF = (currentPeriod.temperature * 9) / 5 + 32;
  }

  return {
    tempF,
    windSpeedMph,
    windDirection: currentPeriod.windDirection,
    conditions: currentPeriod.shortForecast,
    icon: currentPeriod.icon,
  };
}
