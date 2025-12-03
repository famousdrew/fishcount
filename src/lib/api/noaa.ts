import { TideData } from '../types';

// NOAA Station: Astoria (near mouth of Columbia River)
const NOAA_STATION = '9439040';
const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface NoaaPrediction {
  t: string; // Time
  v: string; // Value (water level)
  type?: string; // H for high, L for low (in hi_lo product)
}

interface NoaaResponse {
  predictions?: NoaaPrediction[];
  data?: NoaaPrediction[];
  error?: { message: string };
}

export async function fetchTideData(): Promise<TideData | null> {
  const now = new Date();
  const startDate = formatNoaaDate(now);

  const endDate = new Date(now);
  endDate.setHours(endDate.getHours() + 24);
  const endDateStr = formatNoaaDate(endDate);

  try {
    // Fetch tide predictions
    const predictionsParams = new URLSearchParams({
      station: NOAA_STATION,
      product: 'predictions',
      datum: 'MLLW',
      units: 'english',
      time_zone: 'lst_ldt',
      application: 'fishcount',
      format: 'json',
      begin_date: startDate,
      end_date: endDateStr,
      interval: '60', // Hourly predictions
    });

    // Fetch high/low times
    const hiLoParams = new URLSearchParams({
      station: NOAA_STATION,
      product: 'predictions',
      datum: 'MLLW',
      units: 'english',
      time_zone: 'lst_ldt',
      application: 'fishcount',
      format: 'json',
      begin_date: startDate,
      end_date: endDateStr,
      interval: 'hilo',
    });

    const [predictionsRes, hiLoRes] = await Promise.all([
      fetch(`${NOAA_API_URL}?${predictionsParams}`, { next: { revalidate: 3600 } }),
      fetch(`${NOAA_API_URL}?${hiLoParams}`, { next: { revalidate: 3600 } }),
    ]);

    if (!predictionsRes.ok || !hiLoRes.ok) {
      throw new Error('NOAA API error');
    }

    const predictionsData: NoaaResponse = await predictionsRes.json();
    const hiLoData: NoaaResponse = await hiLoRes.json();

    return parseTideData(predictionsData, hiLoData, now);
  } catch (error) {
    console.error('Error fetching NOAA tide data:', error);
    return null;
  }
}

function formatNoaaDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseTideData(
  predictionsData: NoaaResponse,
  hiLoData: NoaaResponse,
  now: Date
): TideData | null {
  const predictions = predictionsData.predictions || [];
  const hiLoPredictions = hiLoData.predictions || [];

  if (predictions.length === 0) {
    return null;
  }

  // Find current level (closest prediction to now)
  const nowStr = now.toISOString();
  let currentLevel = 0;
  let closestPrediction: NoaaPrediction | null = null;

  for (const pred of predictions) {
    if (!closestPrediction) {
      closestPrediction = pred;
    }
    // Just take the first one as it should be closest to start time
    currentLevel = parseFloat(pred.v) || 0;
    break;
  }

  // Determine tide status based on upcoming high/low
  let status: TideData['status'] = 'slack';
  let nextHighTime: string | null = null;
  let nextLowTime: string | null = null;

  for (const pred of hiLoPredictions) {
    const predTime = new Date(pred.t.replace(' ', 'T'));
    if (predTime <= now) continue;

    if (pred.type === 'H' && !nextHighTime) {
      nextHighTime = pred.t;
    } else if (pred.type === 'L' && !nextLowTime) {
      nextLowTime = pred.t;
    }

    if (nextHighTime && nextLowTime) break;
  }

  // If next high comes before next low, tide is incoming
  if (nextHighTime && nextLowTime) {
    const highTime = new Date(nextHighTime.replace(' ', 'T'));
    const lowTime = new Date(nextLowTime.replace(' ', 'T'));
    status = highTime < lowTime ? 'incoming' : 'outgoing';
  } else if (nextHighTime) {
    status = 'incoming';
  } else if (nextLowTime) {
    status = 'outgoing';
  }

  return {
    currentLevel,
    status,
    nextHighTime,
    nextLowTime,
  };
}
