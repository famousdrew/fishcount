import { WaterFlow } from '../types';

// USGS Station: Columbia River at Vancouver, WA
// Note: Station 14128870 (below Bonneville Dam) returns no data
const USGS_STATION = '14144700';
const USGS_API_URL = 'https://waterservices.usgs.gov/nwis/iv/';
const USGS_DAILY_API_URL = 'https://waterservices.usgs.gov/nwis/dv/';

// Parameter codes:
// 00060 = Discharge (cubic feet per second)
// 00010 = Temperature, water (degrees Celsius)

interface UsgsResponse {
  value: {
    timeSeries: {
      variable: {
        variableCode: { value: string }[];
      };
      values: {
        value: {
          value: string;
          dateTime: string;
        }[];
      }[];
    }[];
  };
}

export async function fetchWaterFlow(): Promise<WaterFlow | null> {
  const params = new URLSearchParams({
    format: 'json',
    sites: USGS_STATION,
    parameterCd: '00060,00010',
    siteStatus: 'active',
  });

  try {
    const response = await fetch(`${USGS_API_URL}?${params}`, {
      next: { revalidate: 900 }, // Cache for 15 minutes
    });

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const data: UsgsResponse = await response.json();
    return parseUsgsResponse(data);
  } catch (error) {
    console.error('Error fetching USGS data:', error);
    return null;
  }
}

// Fetch historical daily flow values
export async function fetchDailyFlow(days: number = 14): Promise<Map<string, number>> {
  const { nowPacific } = await import('../timezone');
  const result = new Map<string, number>();
  const now = nowPacific();
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const params = new URLSearchParams({
    format: 'json',
    sites: USGS_STATION,
    parameterCd: '00060',
    startDT: fmt(start),
    endDT: fmt(now),
  });

  try {
    const response = await fetch(`${USGS_DAILY_API_URL}?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return result;

    const data: UsgsResponse = await response.json();

    for (const series of data.value.timeSeries) {
      const paramCode = series.variable.variableCode[0]?.value;
      if (paramCode !== '00060') continue;

      for (const val of series.values[0]?.value || []) {
        const date = val.dateTime.split('T')[0];
        const flow = parseFloat(val.value);
        if (!isNaN(flow) && flow > 0) {
          result.set(date, flow);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching USGS daily flow:', error);
  }

  return result;
}

function parseUsgsResponse(data: UsgsResponse): WaterFlow | null {
  let flowCfs = 0;
  let waterTempC: number | null = null;
  let timestamp = new Date().toISOString();

  for (const series of data.value.timeSeries) {
    const paramCode = series.variable.variableCode[0]?.value;
    const latestValue = series.values[0]?.value[0];

    if (!latestValue) continue;

    if (paramCode === '00060') {
      // Discharge in CFS
      flowCfs = parseFloat(latestValue.value) || 0;
      timestamp = latestValue.dateTime;
    } else if (paramCode === '00010') {
      // Temperature in Celsius
      waterTempC = parseFloat(latestValue.value);
    }
  }

  if (flowCfs === 0) {
    return null;
  }

  // Convert Celsius to Fahrenheit if we have temp
  const waterTempF = waterTempC !== null ? (waterTempC * 9) / 5 + 32 : null;

  return {
    flowCfs,
    waterTempF,
    timestamp,
  };
}
