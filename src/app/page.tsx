import { fetchDashboardData } from '@/lib/api';
import { Hero, DailyCard, TrendChart } from '@/components';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const dashboardData = await fetchDashboardData();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white py-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">
            🐟 Columbia River FishCount
          </h1>
          <p className="text-blue-200 text-sm md:text-base">
            Bonneville Dam · Portland, OR Area
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Hero section */}
        <Hero
          conditions={dashboardData.currentConditions}
          recommendation={dashboardData.recommendation}
          lastUpdated={dashboardData.lastUpdated}
        />

        {/* Trend chart */}
        {dashboardData.historicalDays.length > 0 && (
          <TrendChart days={dashboardData.historicalDays} />
        )}

        {/* Daily cards */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Days
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.historicalDays.map((day) => (
              <DailyCard key={day.date} conditions={day} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-8 border-t border-gray-200">
          <p>
            Data sources:{' '}
            <a
              href="https://www.cbr.washington.edu/dart"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              DART/CBR
            </a>
            {' · '}
            <a
              href="https://waterdata.usgs.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              USGS
            </a>
            {' · '}
            <a
              href="https://tidesandcurrents.noaa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NOAA
            </a>
            {' · '}
            <a
              href="https://www.weather.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NWS
            </a>
          </p>
          <p className="mt-2">
            Built for the Columbia River fishing community
          </p>
        </footer>
      </main>
    </div>
  );
}
