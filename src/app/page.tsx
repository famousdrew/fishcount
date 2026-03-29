import { fetchDashboardData } from '@/lib/api';
import { VerdictBar, ConditionsGrid, FishCountsRow, ScoreBreakdown } from '@/components';

export const revalidate = 900; // 15 min — conditions (flow, tide, wind) change throughout the day

export default async function Home() {
  const data = await fetchDashboardData();

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <header className="px-3 py-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-200">FishCount</h1>
            <span className="text-slate-600 text-sm">·</span>
            <span className="text-slate-500 text-sm">Bonneville Dam</span>
          </div>
        </header>

        {/* Verdict */}
        <VerdictBar
          score={data.score}
          headlineStat={data.headlineStat}
          contextLine={data.contextLine}
          lastUpdated={data.lastUpdated}
        />

        {/* Conditions */}
        <ConditionsGrid
          waterTempF={data.waterTempF}
          waterFlow={data.waterFlow}
          tide={data.tide}
          weather={data.weather}
          sun={data.sun}
          moon={data.moon}
          score={data.score}
        />

        {/* Fish counts */}
        <FishCountsRow
          fishCounts={data.fishCounts}
          fishTrends={data.fishTrends}
        />

        {/* Score breakdown */}
        <ScoreBreakdown score={data.score} />

        {/* Footer */}
        <footer className="px-3 py-4 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-xs">
            Data:{' '}
            <a href="https://www.cbr.washington.edu/dart" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">DART</a>
            {' · '}
            <a href="https://waterdata.usgs.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">USGS</a>
            {' · '}
            <a href="https://tidesandcurrents.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">NOAA</a>
            {' · '}
            <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">NWS</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
