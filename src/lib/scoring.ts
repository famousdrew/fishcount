import { FishCount, WaterFlow, WeatherData, TideData, MoonData, SunData, Score, ScoreFactor, ScoreStatus, SeasonInfo, TargetSpecies, FishTrend } from './types';

// --- Season detection ---

const SEASONS: { species: TargetSpecies; label: string; run?: string; startMonth: number; endMonth: number }[] = [
  { species: 'chinook', label: 'Spring Chinook', run: 'Spring', startMonth: 3, endMonth: 6 },
  { species: 'shad', label: 'Shad', startMonth: 5, endMonth: 7 },
  { species: 'steelhead', label: 'Summer Steelhead', run: 'Summer', startMonth: 6, endMonth: 10 },
  { species: 'chinook', label: 'Fall Chinook', run: 'Fall', startMonth: 8, endMonth: 11 },
  { species: 'coho', label: 'Coho', startMonth: 9, endMonth: 11 },
  { species: 'sockeye', label: 'Sockeye', startMonth: 6, endMonth: 8 },
  { species: 'steelhead', label: 'Winter Steelhead', run: 'Winter', startMonth: 12, endMonth: 3 },
];

export function getCurrentSeason(date: Date = new Date()): SeasonInfo {
  const month = date.getMonth() + 1;

  // Find matching seasons
  const active = SEASONS.filter(s => {
    if (s.startMonth <= s.endMonth) {
      return month >= s.startMonth && month <= s.endMonth;
    }
    // Wraps around year (e.g., Dec-Mar)
    return month >= s.startMonth || month <= s.endMonth;
  });

  if (active.length === 0) {
    return { species: 'chinook', label: 'Chinook' };
  }

  // Default to first match - caller can override with fish count data
  return { species: active[0].species, label: active[0].label, run: active[0].run };
}

// Pick best season based on what's actually running
export function getBestSeason(fishCounts: FishCount[], date: Date = new Date()): SeasonInfo {
  const month = date.getMonth() + 1;
  const active = SEASONS.filter(s => {
    if (s.startMonth <= s.endMonth) {
      return month >= s.startMonth && month <= s.endMonth;
    }
    return month >= s.startMonth || month <= s.endMonth;
  });

  if (active.length === 0 || fishCounts.length === 0) {
    return getCurrentSeason(date);
  }

  // Find which active-season species has the highest recent count
  const latest = fishCounts[0];
  let best = active[0];
  let bestCount = getSpeciesCount(latest, active[0].species);

  for (const season of active) {
    const count = getSpeciesCount(latest, season.species);
    if (count > bestCount) {
      bestCount = count;
      best = season;
    }
  }

  return { species: best.species, label: best.label, run: best.run };
}

function getSpeciesCount(fc: FishCount, species: TargetSpecies): number {
  switch (species) {
    case 'chinook': return fc.chinook;
    case 'steelhead': return fc.steelhead;
    case 'sockeye': return fc.sockeye;
    case 'coho': return fc.coho;
    case 'shad': return fc.shad;
  }
}

// --- Fish trend calculation ---

export function calculateFishTrends(fishCounts: FishCount[]): FishTrend[] {
  if (fishCounts.length < 2) return [];

  const latest = fishCounts[0];
  const previous = fishCounts.slice(1, 4); // up to 3 prior days

  const species: { key: string; label: string }[] = [
    { key: 'chinook', label: 'Chinook' },
    { key: 'steelhead', label: 'Steelhead' },
    { key: 'sockeye', label: 'Sockeye' },
    { key: 'coho', label: 'Coho' },
    { key: 'shad', label: 'Shad' },
    { key: 'lamprey', label: 'Lamprey' },
  ];

  return species.map(({ key, label }) => {
    const latestCount = getSpeciesCountGeneric(latest, key);
    const prevCounts = previous.map(fc => getSpeciesCountGeneric(fc, key));
    const previousAvg = prevCounts.length > 0
      ? prevCounts.reduce((a, b) => a + b, 0) / prevCounts.length
      : 0;

    let changePercent = 0;
    if (previousAvg > 0) {
      changePercent = Math.round(((latestCount - previousAvg) / previousAvg) * 100);
    } else if (latestCount > 0) {
      changePercent = 100;
    }

    let direction: FishTrend['direction'] = 'stable';
    if (changePercent > 10) direction = 'up';
    else if (changePercent < -10) direction = 'down';

    return { species: label, latestCount, previousAvg, direction, changePercent };
  });
}

function getSpeciesCountGeneric(fc: FishCount, key: string): number {
  switch (key) {
    case 'chinook': return fc.chinook;
    case 'steelhead': return fc.steelhead;
    case 'wildSteelhead': return fc.wildSteelhead;
    case 'sockeye': return fc.sockeye;
    case 'coho': return fc.coho;
    case 'shad': return fc.shad;
    case 'lamprey': return fc.lamprey;
    default: return 0;
  }
}

// --- Scoring engine ---

interface ScoringInputs {
  fishCounts: FishCount[];
  waterFlow: WaterFlow | null;
  waterTempF: number | null; // combined from USGS/NOAA
  weather: WeatherData | null;
  tide: TideData | null;
  moon: MoonData;
  season: SeasonInfo;
}

export function calculateScore(inputs: ScoringInputs): Score {
  const factors: ScoreFactor[] = [
    scoreFishTrend(inputs.fishCounts, inputs.season),
    scoreWaterTemp(inputs.waterTempF, inputs.season.species),
    scoreTide(inputs.tide),
    scoreWind(inputs.weather),
    scoreFlowRate(inputs.waterFlow),
    scoreMoon(inputs.moon),
  ];

  const availableFactors = factors.filter(f => f.available);
  const availableWeight = availableFactors.reduce((sum, f) => sum + f.weight, 0);

  // Not enough data?
  if (availableFactors.length < 3) {
    return {
      total: 0,
      status: 'insufficient',
      factors,
      availableWeight,
    };
  }

  // Weighted average normalized to 0-10
  const weightedSum = availableFactors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const total = Math.round((weightedSum / availableWeight) * 10) / 10;

  let status: ScoreStatus;
  if (total >= 8) status = 'go';
  else if (total >= 5) status = 'maybe';
  else status = 'skip';

  return { total, status, factors, availableWeight };
}

// --- Individual factor scoring ---

function scoreFishTrend(fishCounts: FishCount[], season: SeasonInfo): ScoreFactor {
  const base = { name: 'Fish Trend', weight: 0.30, maxScore: 10 as const };

  if (fishCounts.length < 2) {
    return { ...base, score: 0, reason: 'Not enough data', available: false };
  }

  const latest = fishCounts[0];
  const previous = fishCounts.slice(1, 4);
  const latestCount = getSpeciesCount(latest, season.species);
  const prevCounts = previous.map(fc => getSpeciesCount(fc, season.species));
  const prevAvg = prevCounts.reduce((a, b) => a + b, 0) / prevCounts.length;

  const changePercent = prevAvg > 0
    ? ((latestCount - prevAvg) / prevAvg) * 100
    : (latestCount > 0 ? 100 : 0);

  const trending = changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable';

  // Score based on trend + absolute count
  // Thresholds vary by species but we keep it simple: any significant count + uptrend is good
  let score: number;
  if (latestCount === 0) {
    score = 0;
  } else if (trending === 'up' && latestCount > 100) {
    score = latestCount > 500 ? 10 : 8;
  } else if (trending === 'stable' && latestCount > 100) {
    score = latestCount > 500 ? 8 : 7;
  } else if (trending === 'up') {
    score = 6;
  } else if (trending === 'stable') {
    score = 4;
  } else if (latestCount > 100) {
    score = 4;
  } else {
    score = 2;
  }

  const arrow = trending === 'up' ? '↑' : trending === 'down' ? '↓' : '→';
  const pct = Math.abs(Math.round(changePercent));
  const reason = `${season.label}: ${latestCount.toLocaleString()} ${arrow}${pct}%`;

  return { ...base, score, reason, available: true };
}

function scoreWaterTemp(tempF: number | null, species: TargetSpecies): ScoreFactor {
  const base = { name: 'Water Temp', weight: 0.20, maxScore: 10 as const };

  if (tempF === null) {
    return { ...base, score: 0, reason: 'No data', available: false };
  }

  // Species-specific optimal ranges
  const ranges: Record<TargetSpecies, { optimal: [number, number]; good: [number, number] }> = {
    chinook:   { optimal: [50, 58], good: [45, 65] },
    steelhead: { optimal: [48, 55], good: [42, 60] },
    coho:      { optimal: [48, 56], good: [44, 62] },
    sockeye:   { optimal: [48, 56], good: [44, 62] },
    shad:      { optimal: [55, 65], good: [50, 70] },
  };

  const range = ranges[species] || ranges.chinook;
  const temp = Math.round(tempF);

  let score: number;
  if (tempF >= range.optimal[0] && tempF <= range.optimal[1]) {
    score = 10;
  } else if (tempF >= range.good[0] && tempF <= range.good[1]) {
    score = 6;
  } else {
    // How far outside good range?
    const dist = Math.min(
      Math.abs(tempF - range.good[0]),
      Math.abs(tempF - range.good[1])
    );
    score = Math.max(0, 3 - Math.floor(dist / 5));
  }

  const rangeLabel = score >= 8 ? 'optimal' : score >= 5 ? 'good' : 'outside range';
  return { ...base, score, reason: `${temp}°F (${rangeLabel}: ${range.optimal[0]}-${range.optimal[1]})`, available: true };
}

function scoreTide(tide: TideData | null): ScoreFactor {
  const base = { name: 'Tide', weight: 0.15, maxScore: 10 as const };

  if (!tide) {
    return { ...base, score: 0, reason: 'No data', available: false };
  }

  let score: number;
  let reason: string;

  if (tide.status === 'incoming') {
    score = 9;
    const timeStr = tide.nextHighTime ? formatTideTime(tide.nextHighTime) : '';
    reason = `Incoming${timeStr ? ' → high ' + timeStr : ''}`;
  } else if (tide.status === 'outgoing') {
    score = 4;
    const timeStr = tide.nextLowTime ? formatTideTime(tide.nextLowTime) : '';
    reason = `Outgoing${timeStr ? ' → low ' + timeStr : ''}`;
  } else {
    score = 5;
    reason = 'Slack';
  }

  return { ...base, score, reason, available: true };
}

function formatTideTime(timeStr: string): string {
  try {
    // NOAA format: "2026-03-28 07:30"
    const parts = timeStr.split(' ');
    if (parts.length < 2) return '';
    const [h, m] = parts[1].split(':').map(Number);
    const ampm = h >= 12 ? 'p' : 'a';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
  } catch {
    return '';
  }
}

function scoreWind(weather: WeatherData | null): ScoreFactor {
  const base = { name: 'Wind', weight: 0.15, maxScore: 10 as const };

  if (!weather) {
    return { ...base, score: 0, reason: 'No data', available: false };
  }

  const wind = weather.windSpeedMph;
  let score: number;

  if (wind <= 5) score = 10;
  else if (wind <= 8) score = 8;
  else if (wind <= 12) score = 5;
  else if (wind <= 18) score = 2;
  else score = 0;

  return { ...base, score, reason: `${wind} mph ${weather.windDirection}`, available: true };
}

function scoreFlowRate(waterFlow: WaterFlow | null): ScoreFactor {
  const base = { name: 'Flow', weight: 0.10, maxScore: 10 as const };

  if (!waterFlow) {
    return { ...base, score: 0, reason: 'No data', available: false };
  }

  const flow = waterFlow.flowCfs;
  const flowK = Math.round(flow / 1000);
  let score: number;

  if (flow >= 100000 && flow <= 180000) score = 10;
  else if (flow >= 80000 && flow <= 220000) score = 7;
  else if (flow >= 60000 && flow <= 280000) score = 4;
  else score = 1;

  return { ...base, score, reason: `${flowK}K CFS`, available: true };
}

function scoreMoon(moon: MoonData): ScoreFactor {
  const base = { name: 'Moon', weight: 0.10, maxScore: 10 as const };

  let score: number;
  switch (moon.phase) {
    case 'New Moon': score = 10; break;
    case 'Full Moon': score = 9; break;
    case 'First Quarter':
    case 'Last Quarter': score = 6; break;
    case 'Waxing Crescent':
    case 'Waning Crescent': score = 4; break;
    default: score = 3; break;
  }

  return { ...base, score, reason: `${moon.emoji} ${moon.phase}`, available: true };
}

// --- Headline generation ---

export function generateHeadlineStat(trends: FishTrend[], season: SeasonInfo): string {
  const speciesTrend = trends.find(t => t.species.toLowerCase().includes(season.species));
  if (!speciesTrend || speciesTrend.latestCount === 0) {
    // Fall back to any species with counts
    const withCounts = trends.filter(t => t.latestCount > 0).sort((a, b) => b.latestCount - a.latestCount);
    if (withCounts.length === 0) return 'No fish counts available';
    const t = withCounts[0];
    const arrow = t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→';
    return `${t.species}: ${t.latestCount.toLocaleString()} ${arrow}${Math.abs(t.changePercent)}%`;
  }

  const arrow = speciesTrend.direction === 'up' ? '↑' : speciesTrend.direction === 'down' ? '↓' : '→';
  return `${season.label}: ${speciesTrend.latestCount.toLocaleString()} ${arrow}${Math.abs(speciesTrend.changePercent)}%`;
}

export function generateContextLine(inputs: {
  tide: TideData | null;
  weather: WeatherData | null;
  sun: SunData | null;
}): string {
  const parts: string[] = [];

  if (inputs.tide) {
    const status = inputs.tide.status.charAt(0).toUpperCase() + inputs.tide.status.slice(1);
    if (inputs.tide.status === 'incoming' && inputs.tide.nextHighTime) {
      parts.push(`Incoming tide ${formatTideTime(inputs.tide.nextHighTime)}`);
    } else if (inputs.tide.status === 'outgoing' && inputs.tide.nextLowTime) {
      parts.push(`Outgoing tide ${formatTideTime(inputs.tide.nextLowTime)}`);
    } else {
      parts.push(`${status} tide`);
    }
  }

  if (inputs.weather) {
    parts.push(`${inputs.weather.windSpeedMph}mph ${inputs.weather.windDirection}`);
  }

  if (inputs.sun) {
    parts.push(`Sunrise ${inputs.sun.sunrise}`);
  }

  return parts.join(' · ');
}
