# Columbia River FishCount

A real-time fishing conditions dashboard for the Columbia River near Portland, OR. Displays fish passage counts from Bonneville Dam combined with weather, water flow, tides, and moon phase data.

## Features

- **Fish Count Data**: Daily counts from DART (Chinook, Steelhead, Sockeye, Coho, Shad, Lamprey)
- **5-Day Historical View**: Cards showing recent fishing conditions
- **Trend Charts**: Interactive visualization of fish count patterns
- **Fishing Score**: Simple GO/MAYBE/SKIP recommendation based on conditions
- **Environmental Data**: Water temperature, flow rate, tide status, wind, sunrise/sunset, moon phase

## Data Sources

- [DART/CBR](https://www.cbr.washington.edu/dart) - Fish passage counts
- [USGS](https://waterdata.usgs.gov/) - Water flow data
- [NOAA Tides & Currents](https://tidesandcurrents.noaa.gov/) - Tide predictions
- [National Weather Service](https://www.weather.gov/) - Weather forecasts
- [Sunrise-Sunset API](https://sunrise-sunset.org/api) - Sun times

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Railway

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment

This app is configured for Railway deployment. Connect your GitHub repo to Railway and it will auto-deploy.

## License

MIT - Built for the Columbia River fishing community.
