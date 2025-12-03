import { TideData, WaterTempData } from '../types';

// NOAA Stations
const ASTORIA_STATION = '9439040'; // Tides
const LONGVIEW_STATION = '9440422'; // Water temperature
const NOAA_API_URL = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

interface NoaaPrediction {
  t: string; // Time
  v: string; // Value (water level)
  type?: string; // H for high, L for low
}

interface NoaaResponse {
  predictions?: NoaaPrediction[];
  data?: { t: string; v: string }[];
  error?: { message: string };
}

// Fetch current water temperature from Longview station
export async function fetchWaterTemp(): Promise<WaterTempData | null> {
  const today = new Date();
  const dateStr = formatNoaaDate(today);

  try {
    const params = new URLSearchParams({
      station: LONGVIEW_STATION,
      product: 'water_temperature',
      units: 'english',
      time_zone: 'lst_ldt',
      application: 'fishcount',
      format: 'json',
      begin_date: dateStr,
      end_date: dateStr,
    });

    const response = await fetch(`${NOAA_API_URL}?${params}`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error('NOAA water temp API error');
    }

    const data: NoaaResponse = await response.json();

    if (data.error || !data.data || data.data.length === 0) {
      return null;
    }

    // Get the most recent valid reading
    for (let i = data.data.length - 1; i >= 0; i--) {
      const reading = data.data[i];
      if (reading.v && reading.v.trim() !== '') {
        return {
          tempF: parseFloat(reading.v),
          timestamp: reading.t,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching water temperature:', error);
    return null;
  }
}

// Fetch tide data for a specific date
export async function fetchTideData(date?: Date): Promise<TideData | null> {
  const targetDate = date || new Date();
  const startDate = formatNoaaDate(targetDate);

  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = formatNoaaDate(endDate);

  try {
    // Fetch high/low predictions
    const hiLoParams = new URLSearchParams({
      station: ASTORIA_STATION,
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

    const hiLoRes = await fetch(`${NOAA_API_URL}?${hiLoParams}`, {
      next: { revalidate: 3600 },
    });

    if (!hiLoRes.ok) {
      throw new Error('NOAA API error');
    }

    const hiLoData: NoaaResponse = await hiLoRes.json();

    return parseTideData(hiLoData, targetDate);
  } catch (error) {
    console.error('Error fetching NOAA tide data:', error);
    return null;
  }
}

// Fetch tide predictions for multiple days
export async function fetchTideForecast(days: number = 3): Promise<Map<string, TideData>> {
  const result = new Map<string, TideData>();
  const now = new Date();

  const startDate = formatNoaaDate(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  const endDateStr = formatNoaaDate(endDate);

  try {
    const hiLoParams = new URLSearchParams({
      station: ASTORIA_STATION,
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

    const hiLoRes = await fetch(`${NOAA_API_URL}?${hiLoParams}`, {
      next: { revalidate: 3600 },
    });

    if (!hiLoRes.ok) {
      throw new Error('NOAA API error');
    }

    const hiLoData: NoaaResponse = await hiLoRes.json();
    const predictions = hiLoData.predictions || [];

    // Group by date
    const dateMap = new Map<string, NoaaPrediction[]>();
    for (const pred of predictions) {
      const date = pred.t.split(' ')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(pred);
    }

    // Build tide data for each date
    for (const [date, preds] of dateMap) {
      const tideData = parseDayTides(preds, date);
      if (tideData) {
        result.set(date, tideData);
      }
    }
  } catch (error) {
    console.error('Error fetching tide forecast:', error);
  }

  return result;
}

function formatNoaaDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseTideData(hiLoData: NoaaResponse, targetDate: Date): TideData | null {
  const hiLoPredictions = hiLoData.predictions || [];

  if (hiLoPredictions.length === 0) {
    return null;
  }

  const now = targetDate;
  let status: TideData['status'] = 'slack';
  let nextHighTime: string | null = null;
  let nextLowTime: string | null = null;
  let nextHighLevel: number | null = null;
  let nextLowLevel: number | null = null;
  let currentLevel = 0;

  for (const pred of hiLoPredictions) {
    const predTime = new Date(pred.t.replace(' ', 'T'));
    if (predTime <= now) {
      currentLevel = parseFloat(pred.v) || 0;
      continue;
    }

    if (pred.type === 'H' && !nextHighTime) {
      nextHighTime = pred.t;
      nextHighLevel = parseFloat(pred.v) || null;
    } else if (pred.type === 'L' && !nextLowTime) {
      nextLowTime = pred.t;
      nextLowLevel = parseFloat(pred.v) || null;
    }

    if (nextHighTime && nextLowTime) break;
  }

  // Determine tide direction
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
    nextHighLevel,
    nextLowLevel,
  };
}

function parseDayTides(predictions: NoaaPrediction[], dateStr: string): TideData | null {
  if (predictions.length === 0) return null;

  // Find the highest daytime high tide (between 6 AM and 6 PM)
  let bestHigh: NoaaPrediction | null = null;
  let bestLow: NoaaPrediction | null = null;

  for (const pred of predictions) {
    const hour = parseInt(pred.t.split(' ')[1]?.split(':')[0] || '0', 10);
    const isDaytime = hour >= 6 && hour <= 18;

    if (pred.type === 'H') {
      if (!bestHigh || (isDaytime && parseFloat(pred.v) > parseFloat(bestHigh.v))) {
        bestHigh = pred;
      }
    } else if (pred.type === 'L') {
      if (!bestLow || (isDaytime && parseFloat(pred.v) < parseFloat(bestLow.v))) {
        bestLow = pred;
      }
    }
  }

  // Default to first high/low if no daytime ones found
  if (!bestHigh) bestHigh = predictions.find(p => p.type === 'H') || null;
  if (!bestLow) bestLow = predictions.find(p => p.type === 'L') || null;

  // Determine if incoming or outgoing based on first tide of the day
  const firstTide = predictions[0];
  const status: TideData['status'] = firstTide?.type === 'H' ? 'outgoing' : 'incoming';

  return {
    currentLevel: parseFloat(predictions[0]?.v || '0'),
    status,
    nextHighTime: bestHigh?.t || null,
    nextLowTime: bestLow?.t || null,
    nextHighLevel: bestHigh ? parseFloat(bestHigh.v) : null,
    nextLowLevel: bestLow ? parseFloat(bestLow.v) : null,
  };
}
