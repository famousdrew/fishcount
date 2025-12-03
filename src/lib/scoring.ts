import { FishCount, WaterFlow, WeatherData, TideData, MoonData, Score, ScoreStatus } from './types';

interface ScoringInputs {
  fishCount: FishCount;
  waterFlow: WaterFlow | null;
  weather: WeatherData | null;
  tide: TideData | null;
  moon: MoonData;
}

interface ScoringFactor {
  name: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export function calculateScore(inputs: ScoringInputs): Score {
  const factors: ScoringFactor[] = [];

  // 1. Chinook count (0-2 points)
  factors.push(scoreChinookCount(inputs.fishCount));

  // 2. Wind speed (0-2 points)
  factors.push(scoreWind(inputs.weather));

  // 3. Tide status (0-2 points)
  factors.push(scoreTide(inputs.tide));

  // 4. Moon phase (0-2 points)
  factors.push(scoreMoon(inputs.moon));

  // 5. Water temperature (0-2 points)
  factors.push(scoreWaterTemp(inputs.fishCount, inputs.waterFlow));

  // 6. Flow rate (0-2 points)
  factors.push(scoreFlowRate(inputs.waterFlow));

  const total = factors.reduce((sum, f) => sum + f.points, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.maxPoints, 0);

  let status: ScoreStatus;
  if (total >= 8) {
    status = 'go';
  } else if (total >= 5) {
    status = 'maybe';
  } else {
    status = 'skip';
  }

  return {
    total,
    maxScore,
    status,
    factors,
  };
}

function scoreChinookCount(fishCount: FishCount): ScoringFactor {
  const count = fishCount.chinook;

  if (count >= 500) {
    return {
      name: 'Chinook Count',
      points: 2,
      maxPoints: 2,
      reason: `Excellent: ${count.toLocaleString()} fish`,
    };
  } else if (count >= 200) {
    return {
      name: 'Chinook Count',
      points: 1,
      maxPoints: 2,
      reason: `Good: ${count.toLocaleString()} fish`,
    };
  } else {
    return {
      name: 'Chinook Count',
      points: 0,
      maxPoints: 2,
      reason: `Low: ${count.toLocaleString()} fish`,
    };
  }
}

function scoreWind(weather: WeatherData | null): ScoringFactor {
  if (!weather) {
    return {
      name: 'Wind',
      points: 1,
      maxPoints: 2,
      reason: 'Data unavailable',
    };
  }

  const wind = weather.windSpeedMph;

  if (wind <= 5) {
    return {
      name: 'Wind',
      points: 2,
      maxPoints: 2,
      reason: `Excellent: ${wind} mph`,
    };
  } else if (wind <= 10) {
    return {
      name: 'Wind',
      points: 1,
      maxPoints: 2,
      reason: `Moderate: ${wind} mph`,
    };
  } else {
    return {
      name: 'Wind',
      points: 0,
      maxPoints: 2,
      reason: `High: ${wind} mph`,
    };
  }
}

function scoreTide(tide: TideData | null): ScoringFactor {
  if (!tide) {
    return {
      name: 'Tide',
      points: 1,
      maxPoints: 2,
      reason: 'Data unavailable',
    };
  }

  if (tide.status === 'incoming') {
    return {
      name: 'Tide',
      points: 2,
      maxPoints: 2,
      reason: 'Incoming tide',
    };
  } else if (tide.status === 'outgoing') {
    return {
      name: 'Tide',
      points: 1,
      maxPoints: 2,
      reason: 'Outgoing tide',
    };
  } else {
    return {
      name: 'Tide',
      points: 0,
      maxPoints: 2,
      reason: 'Slack tide',
    };
  }
}

function scoreMoon(moon: MoonData): ScoringFactor {
  const phase = moon.phase;

  if (phase === 'New Moon' || phase === 'Full Moon') {
    return {
      name: 'Moon Phase',
      points: 2,
      maxPoints: 2,
      reason: `${moon.emoji} ${phase}`,
    };
  } else if (phase === 'First Quarter' || phase === 'Last Quarter') {
    return {
      name: 'Moon Phase',
      points: 1,
      maxPoints: 2,
      reason: `${moon.emoji} ${phase}`,
    };
  } else {
    return {
      name: 'Moon Phase',
      points: 0,
      maxPoints: 2,
      reason: `${moon.emoji} ${phase}`,
    };
  }
}

function scoreWaterTemp(fishCount: FishCount, waterFlow: WaterFlow | null): ScoringFactor {
  // Try USGS temp first, fall back to DART temp
  let tempF: number | null = waterFlow?.waterTempF ?? null;

  if (tempF === null && fishCount.waterTempC !== null) {
    tempF = (fishCount.waterTempC * 9) / 5 + 32;
  }

  if (tempF === null) {
    return {
      name: 'Water Temp',
      points: 1,
      maxPoints: 2,
      reason: 'Data unavailable',
    };
  }

  if (tempF >= 55 && tempF <= 60) {
    return {
      name: 'Water Temp',
      points: 2,
      maxPoints: 2,
      reason: `Optimal: ${Math.round(tempF)}°F`,
    };
  } else if (tempF >= 50 && tempF <= 65) {
    return {
      name: 'Water Temp',
      points: 1,
      maxPoints: 2,
      reason: `Good: ${Math.round(tempF)}°F`,
    };
  } else {
    return {
      name: 'Water Temp',
      points: 0,
      maxPoints: 2,
      reason: `Outside range: ${Math.round(tempF)}°F`,
    };
  }
}

function scoreFlowRate(waterFlow: WaterFlow | null): ScoringFactor {
  if (!waterFlow) {
    return {
      name: 'Flow Rate',
      points: 1,
      maxPoints: 2,
      reason: 'Data unavailable',
    };
  }

  const flow = waterFlow.flowCfs;

  // Typical Columbia River flow ranges at Bonneville:
  // Low: < 100,000 CFS
  // Normal: 100,000 - 200,000 CFS
  // High: > 200,000 CFS

  if (flow >= 100000 && flow <= 200000) {
    return {
      name: 'Flow Rate',
      points: 2,
      maxPoints: 2,
      reason: `Optimal: ${(flow / 1000).toFixed(0)}K CFS`,
    };
  } else if (flow >= 80000 && flow <= 250000) {
    return {
      name: 'Flow Rate',
      points: 1,
      maxPoints: 2,
      reason: `Moderate: ${(flow / 1000).toFixed(0)}K CFS`,
    };
  } else {
    return {
      name: 'Flow Rate',
      points: 0,
      maxPoints: 2,
      reason: `Extreme: ${(flow / 1000).toFixed(0)}K CFS`,
    };
  }
}

export function generateRecommendation(conditions: {
  score: Score;
  fishCount: FishCount;
  tide: TideData | null;
  weather: WeatherData | null;
  sun: { sunrise: string } | null;
}): string {
  const { score, fishCount, tide, weather, sun } = conditions;

  const parts: string[] = [];

  // Status intro
  if (score.status === 'go') {
    parts.push('Excellent conditions for fishing today.');
  } else if (score.status === 'maybe') {
    parts.push('Fair conditions - worth a trip if you can.');
  } else {
    parts.push('Challenging conditions today.');
  }

  // Fish count highlight
  if (fishCount.chinook > 0) {
    const runType = fishCount.chinookRun ? `${fishCount.chinookRun} ` : '';
    parts.push(`${runType}Chinook count: ${fishCount.chinook.toLocaleString()}.`);
  }

  // Tide info
  if (tide) {
    const tideStatus = tide.status.charAt(0).toUpperCase() + tide.status.slice(1);
    parts.push(`${tideStatus} tide.`);
  }

  // Wind warning
  if (weather && weather.windSpeedMph > 10) {
    parts.push(`Watch for wind: ${weather.windSpeedMph} mph ${weather.windDirection}.`);
  }

  // Sunrise suggestion
  if (sun && score.status !== 'skip') {
    parts.push(`Sunrise at ${sun.sunrise}.`);
  }

  return parts.join(' ');
}
