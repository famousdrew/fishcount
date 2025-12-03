import { SunData } from '../types';

// Portland, OR coordinates
const LATITUDE = 45.5152;
const LONGITUDE = -122.6784;
const SUNRISE_API_URL = 'https://api.sunrise-sunset.org/json';

interface SunriseApiResponse {
  status: string;
  results: {
    sunrise: string;
    sunset: string;
    civil_twilight_begin: string;
    civil_twilight_end: string;
    day_length: number;
  };
}

export async function fetchSunData(date?: Date): Promise<SunData | null> {
  const targetDate = date || new Date();
  const dateStr = formatDate(targetDate);

  try {
    const params = new URLSearchParams({
      lat: LATITUDE.toString(),
      lng: LONGITUDE.toString(),
      date: dateStr,
      formatted: '0', // Get ISO format
    });

    const response = await fetch(`${SUNRISE_API_URL}?${params}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`Sunrise API error: ${response.status}`);
    }

    const data: SunriseApiResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Sunrise API status: ${data.status}`);
    }

    return parseSunData(data);
  } catch (error) {
    console.error('Error fetching sun data:', error);
    return null;
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSunData(data: SunriseApiResponse): SunData {
  const results = data.results;

  // Convert UTC times to local time strings
  const sunrise = new Date(results.sunrise);
  const sunset = new Date(results.sunset);
  const dawn = new Date(results.civil_twilight_begin);
  const dusk = new Date(results.civil_twilight_end);

  return {
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset),
    dawn: formatTime(dawn),
    dusk: formatTime(dusk),
    dayLengthHours: results.day_length / 3600,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles',
  });
}
