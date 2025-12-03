// Fish count data from DART
export interface FishCount {
  date: string;
  chinook: number;
  jackChinook: number;
  steelhead: number;
  wildSteelhead: number;
  sockeye: number;
  coho: number;
  jackCoho: number;
  shad: number;
  lamprey: number;
  waterTempC: number | null;
  chinookRun: 'Spring' | 'Summer' | 'Fall' | null;
}

// Water flow data from USGS
export interface WaterFlow {
  flowCfs: number;
  waterTempF: number | null;
  timestamp: string;
}

// Tide data from NOAA
export interface TideData {
  currentLevel: number;
  status: 'incoming' | 'outgoing' | 'slack';
  nextHighTime: string | null;
  nextLowTime: string | null;
  nextHighLevel: number | null;
  nextLowLevel: number | null;
}

// Water temperature from NOAA
export interface WaterTempData {
  tempF: number;
  timestamp: string;
}

// Weather data from NWS
export interface WeatherData {
  tempF: number;
  windSpeedMph: number;
  windDirection: string;
  conditions: string;
  icon: string;
}

// Sunrise/sunset data
export interface SunData {
  sunrise: string;
  sunset: string;
  dawn: string;
  dusk: string;
  dayLengthHours: number;
}

// Moon phase data
export interface MoonData {
  phase: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  illumination: number;
  emoji: string;
}

// Scoring result
export type ScoreStatus = 'go' | 'maybe' | 'skip';

export interface Score {
  total: number;
  maxScore: number;
  status: ScoreStatus;
  factors: {
    name: string;
    points: number;
    maxPoints: number;
    reason: string;
  }[];
}

// Combined daily data
export interface DailyConditions {
  date: string;
  dayOfWeek: string;
  fishCount: FishCount;
  waterFlow: WaterFlow | null;
  tide: TideData | null;
  weather: WeatherData | null;
  sun: SunData | null;
  moon: MoonData;
  score: Score;
}

// Forecast for a single day (Today, Tomorrow, etc.)
export interface DayForecast {
  date: string;
  dayLabel: string; // "Today", "Tomorrow", "Thursday"
  weather: WeatherData | null;
  tide: TideData | null;
  sun: SunData | null;
  moon: MoonData;
  waterTempF: number | null;
}

// Full dashboard data
export interface DashboardData {
  lastUpdated: string;
  currentConditions: DailyConditions | null;
  forecast: DayForecast[]; // 3-day forecast
  historicalDays: DailyConditions[];
  recommendation: string;
}
