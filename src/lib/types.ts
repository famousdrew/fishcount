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
  // Estimated current rate of change in ft/hr, signed (+ rising, - falling).
  // Sine-approximated from surrounding H/L bracket.
  currentRateFtPerHr: number | null;
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
export type MoonPhase = 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';

export interface MoonData {
  phase: MoonPhase;
  illumination: number;
  emoji: string;
}

// Scoring v2
export type ScoreStatus = 'go' | 'maybe' | 'skip' | 'insufficient';

export interface ScoreFactor {
  name: string;
  weight: number;
  score: number;       // 0-10
  maxScore: 10;
  reason: string;
  available: boolean;  // false if data was missing
}

export interface Score {
  total: number;       // 0-10 weighted average
  status: ScoreStatus;
  factors: ScoreFactor[];
  availableWeight: number; // sum of weights for available factors
}

// Species season info
export type TargetSpecies = 'chinook' | 'steelhead' | 'sockeye' | 'coho' | 'shad';

export interface SeasonInfo {
  species: TargetSpecies;
  label: string;         // e.g. "Spring Chinook"
  run?: string;          // e.g. "Spring", "Fall"
}

// Fish trend data
export interface FishTrend {
  species: string;
  latestCount: number;
  previousAvg: number;  // 3-day avg before latest
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
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

// Historical day with conditions (for /counts page)
export interface HistoricalDay {
  date: string;
  dayOfWeek: string;
  fishCount: FishCount;
  flowCfs: number | null;
  waterTempF: number | null;
  tideEvents: TideEvent[];
  moon: MoonData;
}

export interface TideEvent {
  time: string;   // "07:26"
  type: 'H' | 'L';
  level: number;  // feet
}

// Forecast day (today/tomorrow/etc)
export interface ForecastDay {
  date: string;
  label: string;          // "Today", "Tomorrow", "Monday"
  weather: WeatherData | null;
  nightWeather: WeatherData | null;
  tideEvents: TideEvent[];
  sun: SunData | null;
  moon: MoonData;
}

// Full dashboard data
export interface DashboardData {
  lastUpdated: string;
  score: Score;
  // Real-time conditions
  waterFlow: WaterFlow | null;
  waterTempF: number | null;
  tide: TideData | null;
  weather: WeatherData | null;
  sun: SunData | null;
  moon: MoonData;
  // Fish data
  fishCounts: FishCount[];
  fishTrends: FishTrend[];
  primarySpecies: SeasonInfo;
  // Forecast
  forecast: ForecastDay[];
  // Headline pieces
  headlineStat: string;
  contextLine: string;
}
