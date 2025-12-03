import { FishCount } from '../types';

const DART_CSV_URL = 'https://www.cbr.washington.edu/dart/cs/php/rpt/adult_daily.php';

interface DartQueryParams {
  year: number;
  proj: string;
  startDate: string;
  endDate: string;
}

function buildDartUrl(params: DartQueryParams): string {
  const { year, proj, startDate, endDate } = params;
  return `${DART_CSV_URL}?outputFormat=csv&year=${year}&proj=${proj}&startdate=${startDate}&enddate=${endDate}`;
}

function parseNumber(value: string): number {
  const num = parseInt(value, 10);
  return isNaN(num) || num < 0 ? 0 : num;
}

function parseTemp(value: string): number | null {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseChinookRun(value: string): FishCount['chinookRun'] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'spring') return 'Spring';
  if (normalized === 'summer') return 'Summer';
  if (normalized === 'fall') return 'Fall';
  return null;
}

export async function fetchFishCounts(days: number = 5): Promise<FishCount[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days - 1); // Extra day buffer

  const year = now.getFullYear();
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

  const url = buildDartUrl({
    year,
    proj: 'BON',
    startDate: formatDate(startDate),
    endDate: formatDate(now),
  });

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`DART API error: ${response.status}`);
    }

    const csvText = await response.text();
    return parseDartCsv(csvText, days);
  } catch (error) {
    console.error('Error fetching DART data:', error);
    return [];
  }
}

function parseDartCsv(csvText: string, days: number): FishCount[] {
  const lines = csvText.trim().split('\n');

  // Find header line (skip any comment lines)
  let headerIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('project') && lines[i].toLowerCase().includes('date')) {
      headerIndex = i;
      break;
    }
  }

  const headers = lines[headerIndex].split(',').map(h => h.trim().toLowerCase());
  const dataLines = lines.slice(headerIndex + 1);

  // Map column indices - DART uses abbreviated column names
  const colIndex = {
    date: headers.findIndex(h => h === 'date'),
    chinookRun: headers.findIndex(h => h.includes('chinook run')),
    chinook: headers.findIndex(h => h === 'chin'),
    jackChinook: headers.findIndex(h => h === 'jchin'),
    steelhead: headers.findIndex(h => h === 'stlhd'),
    wildSteelhead: headers.findIndex(h => h === 'wstlhd'),
    sockeye: headers.findIndex(h => h === 'sock'),
    coho: headers.findIndex(h => h === 'coho'),
    jackCoho: headers.findIndex(h => h === 'jcoho'),
    shad: headers.findIndex(h => h === 'shad'),
    lamprey: headers.findIndex(h => h === 'lmpryday'),
    tempC: headers.findIndex(h => h === 'tempc'),
  };

  const fishCounts: FishCount[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const cols = line.split(',').map(c => c.trim());

    const dateStr = cols[colIndex.date];
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

    fishCounts.push({
      date: dateStr,
      chinookRun: parseChinookRun(cols[colIndex.chinookRun] || ''),
      chinook: parseNumber(cols[colIndex.chinook] || '0'),
      jackChinook: parseNumber(cols[colIndex.jackChinook] || '0'),
      steelhead: parseNumber(cols[colIndex.steelhead] || '0'),
      wildSteelhead: parseNumber(cols[colIndex.wildSteelhead] || '0'),
      sockeye: parseNumber(cols[colIndex.sockeye] || '0'),
      coho: parseNumber(cols[colIndex.coho] || '0'),
      jackCoho: parseNumber(cols[colIndex.jackCoho] || '0'),
      shad: parseNumber(cols[colIndex.shad] || '0'),
      lamprey: parseNumber(cols[colIndex.lamprey] || '0'),
      waterTempC: parseTemp(cols[colIndex.tempC] || ''),
    });
  }

  // Sort by date descending and return the most recent days
  return fishCounts
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}
