import Link from 'next/link';
import { fetchHistoricalData } from '@/lib/api/historical';
import { CountsView } from './CountsView';

export const revalidate = 3600; // 1 hour

export default async function CountsPage() {
  const historicalDays = await fetchHistoricalData(14);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <header className="px-3 py-2 flex items-center gap-3 border-b border-slate-800">
          <Link href="/" className="text-sky-400 text-sm hover:text-sky-300 transition-colors">
            ← Back
          </Link>
          <h1 className="text-sm font-semibold text-slate-200">Fish Counts · Bonneville Dam</h1>
        </header>

        {historicalDays.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-slate-500">No fish count data available</p>
          </div>
        ) : (
          <CountsView days={historicalDays} />
        )}

        {/* Footer */}
        <footer className="px-3 py-4 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-xs">
            Data:{' '}
            <a href="https://www.cbr.washington.edu/dart" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">DART</a>
            {' · '}
            <a href="https://waterdata.usgs.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">USGS</a>
            {' · '}
            <a href="https://tidesandcurrents.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-sky-500/60 hover:text-sky-400">NOAA</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
