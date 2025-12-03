# Columbia River FishCount - Product Requirements Document

## Overview

**Product Name:** Columbia River FishCount
**Version:** 1.0 MVP
**Last Updated:** December 3, 2025
**Target Users:** Recreational fishermen in the Portland, OR / Columbia River area

### Vision Statement

A simple, glanceable web application that helps Columbia River fishermen make quick "go/no-go" fishing decisions by combining real-time fish passage counts from Bonneville Dam with weather, water conditions, and lunar data.

---

## Problem Statement

Fishermen near the Columbia River currently need to check multiple websites to assess fishing conditions:
- DART (fish counts)
- NOAA (tides)
- USGS (water flow)
- Weather services
- Moon phase calculators

This fragmented experience makes trip planning tedious and time-consuming, especially on mobile devices at 5 AM when deciding whether to head out.

---

## Solution

A unified dashboard that:
1. Aggregates all relevant fishing data in one place
2. Provides simple **green/yellow/red indicators** for quick decisions
3. Shows **5 days of historical data** for trend analysis
4. Works seamlessly on **mobile and desktop**

---

## Target Audience

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **Weekend Warrior** | Fishes 2-4x per month, needs quick morning decisions | Go/no-go indicator on mobile |
| **Dedicated Angler** | Fishes 10+ days/month, tracks patterns | Trend analysis, historical data |
| **Fishing Guide** | Professional, needs to advise clients | Shareable conditions report |

---

## Core Features (MVP)

### 1. Current Conditions Hero

**Priority: P0 (Must Have)**

A prominent section showing today's fishing outlook at a glance:

- **Fishing Score Badge**: Large visual indicator
  - 🟢 **GO** - Excellent conditions (score 5-6)
  - 🟡 **MAYBE** - Fair conditions (score 3-4)
  - 🔴 **SKIP** - Poor conditions (score 1-2)

- **Key Metrics Display**:
  - Water temperature (°F)
  - Water flow (CFS from USGS)
  - Tide status (incoming/outgoing/slack + next change time)
  - Sunrise/Sunset times (for planning morning/evening trips)

- **Text Recommendation**: 1-2 sentence summary
  - Example: "Excellent morning conditions for Chinook (1,247 yesterday). Incoming tide at 7:30 AM. Light winds from NW."

### 2. Daily Condition Cards (5 Days)

**Priority: P0 (Must Have)**

Display 5 cards showing the most recent days in **reverse chronological order** (today/yesterday first):

**Card Content:**
| Section | Data Points |
|---------|-------------|
| **Header** | Date, Day of week, Score (●●●●●○), GO/MAYBE/SKIP badge |
| **Fish Counts** | Chinook, Steelhead, Sockeye, Coho, Shad, Lamprey (6-item grid) |
| **Conditions** | Water temp, Flow (CFS), Tide status, Weather (temp + wind), Moon phase, Sunrise/Sunset |

**Visual Design:**
- Cards use a 2-column grid for fish counts
- Conditions displayed as icon + label + value
- Card background: Sandy beige (#F5F3EF)
- Hover state: Subtle shadow increase
- Mobile: Full-width stacked cards
- Desktop: 3-column grid

### 3. Trend Chart

**Priority: P0 (Must Have)**

Multi-line chart showing fish count trends over the 5-day period:

- **Default View**: Chinook + Steelhead lines (most popular species)
- **Toggle Controls**: Enable/disable each species line
- **Interaction**: Hover for tooltip with exact counts
- **Styling**: Species-specific colors with subtle area fill

**Chart Specifications:**
- Height: 350px desktop, 250px mobile
- X-axis: Dates
- Y-axis: Fish count (auto-scaled)
- Max 3 species visible simultaneously

### 4. Scoring Algorithm

**Priority: P0 (Must Have)**

Simple rule-based scoring (0-6 points total):

| Factor | Good (+1) | Excellent (+2) |
|--------|-----------|----------------|
| **Chinook Count** | >200 | >500 |
| **Wind Speed** | <10 mph | <5 mph |
| **Tide** | Any movement | Incoming |
| **Moon Phase** | Quarter | New/Full |
| **Water Temp** | 50-65°F | 55-60°F |
| **Flow Rate** | Within normal range | Optimal range |

**Score Interpretation:**
- 5-6: GO (Green)
- 3-4: MAYBE (Yellow)
- 1-2: SKIP (Red)

---

## Data Sources

### Primary Sources

| Data | Source | Endpoint | Update Frequency |
|------|--------|----------|------------------|
| **Fish Counts** | DART/CBR Washington | `cbr.washington.edu/dart/cs/php/lib/file_wrapper.php?type=csv` | Daily |
| **Water Flow** | USGS | `waterservices.usgs.gov/nwis/iv/?site=14128870` | 15 minutes |
| **Tides** | NOAA CO-OPS | `api.tidesandcurrents.noaa.gov/api/prod/datagetter` | Real-time |
| **Weather** | NWS | `api.weather.gov/points/{lat},{lon}` | Hourly |
| **Moon Phase** | Calculated | Algorithmic (based on date) | N/A |
| **Sunrise/Sunset** | Sunrise-Sunset API | `api.sunrise-sunset.org/json` | Daily |

### Specific Stations

- **Fish Counts**: Bonneville Dam (BON)
- **Water Flow**: USGS 14128870 (Columbia River Below Bonneville Dam)
- **Tides**: NOAA Station 9439040 (Astoria) or 9439221 (Portland)
- **Weather**: Portland, OR (45.5152, -122.6784)

---

## Technical Architecture

### Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ | SSR for SEO, React ecosystem, easy deployment |
| **Styling** | Tailwind CSS | Rapid development, responsive by default |
| **Charts** | Recharts or uPlot | React integration, lightweight |
| **Deployment** | Railway | Existing account, simple deploys, good free tier |
| **Data Fetching** | Server Components + ISR | Cache API responses, reduce load on external APIs |

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  External   │────▶│   Next.js   │────▶│   Client    │
│   APIs      │     │   Server    │     │   Browser   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
   Raw Data          Aggregated &         Rendered
                      Cached Data          Dashboard
```

### Caching Strategy

- **Fish Counts**: Cache for 4 hours (data updates daily)
- **Weather**: Cache for 30 minutes
- **Tides**: Cache for 1 hour (predictions stable)
- **Water Flow**: Cache for 15 minutes
- **Client-side**: SessionStorage for current session

---

## UI/UX Design

### Color Palette

**Primary Colors:**
```
River Blue:     #2563EB (headers, primary actions)
Deep Water:     #1E40AF (important text)
Seafoam:        #06B6D4 (accents)
Sandy Beige:    #F5F3EF (card backgrounds)
Slate Gray:     #475569 (secondary text)
```

**Status Colors:**
```
GO:     #10B981 (green)
MAYBE:  #F59E0B (amber)
SKIP:   #EF4444 (red)
```

**Species Colors (for charts):**
```
Chinook:    #DC2626 (red)
Steelhead:  #7C3AED (purple)
Sockeye:    #F97316 (orange)
Coho:       #EC4899 (pink)
Shad:       #84CC16 (lime)
Lamprey:    #64748B (slate)
```

### Typography

- **Font**: Inter (system fallback)
- **Hero Heading**: 32px bold
- **Section Heading**: 24px semi-bold
- **Data Display**: 28px bold (counts)
- **Body**: 14px regular
- **Labels**: 12px uppercase

### Responsive Breakpoints

| Breakpoint | Cards Layout | Hero Layout |
|------------|--------------|-------------|
| Mobile (<768px) | 1 column | Stacked |
| Tablet (768-1023px) | 2 columns | 2 columns |
| Desktop (1024px+) | 3 columns | 3 columns |

---

## MVP Scope

### In Scope (v1.0)

- [x] Current conditions hero with GO/MAYBE/SKIP indicator
- [x] 5 daily condition cards with fish counts + conditions
- [x] 5-day trend chart for fish counts
- [x] Simple scoring algorithm
- [x] Mobile-responsive design
- [x] Data from DART, USGS, NOAA, NWS

### Out of Scope (Future)

- [ ] User accounts / personalization
- [ ] Push notifications / alerts
- [ ] Historical comparisons (year-over-year)
- [ ] Multiple dam locations
- [ ] Fishing log / catch tracking
- [ ] Social sharing / community features
- [ ] Weather forecast (future days)
- [ ] Barometric pressure data

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | <2 seconds | Lighthouse |
| **Mobile Usability** | 100% score | Lighthouse |
| **Data Freshness** | <4 hours old | Timestamp display |
| **User Return Rate** | >50% weekly | Analytics |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DART website changes | Data unavailable | Monitor HTML structure, alert on failures |
| API rate limits | Service degradation | Aggressive caching, ISR |
| External API downtime | Missing data | Show cached data with "stale" indicator |
| Inaccurate scoring | User distrust | Clear "how it works" explanation, user feedback loop |

---

## Timeline (Suggested)

| Phase | Deliverables |
|-------|--------------|
| **Phase 1** | Data integration - fetch from all 4 sources |
| **Phase 2** | Core UI - hero, cards, basic styling |
| **Phase 3** | Chart implementation |
| **Phase 4** | Scoring algorithm + indicators |
| **Phase 5** | Polish, responsive testing, deployment |

---

## Appendix

### A. DART CSV Format

```
Project,Date,Chinook Run,Chinook,Jack Chinook,Steelhead,Wild Steelhead,Sockeye,Coho,Jack Coho,Shad,Lamprey (daytime),Bull Trout,Chum,Pink,Lamprey Nighttime,LPS 24-hour,TempC
Bonneville,2025-12-02,Fall,1247,89,35,18,0,0,0,0,134,0,0,0,389,224,16.4
```

### B. API Endpoints Reference

**USGS Water Flow:**
```
https://waterservices.usgs.gov/nwis/iv/?format=json&sites=14128870&parameterCd=00060,00010
```

**NOAA Tides:**
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=9439040&product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&application=fishcount&format=json
```

**NWS Weather:**
```
https://api.weather.gov/points/45.5152,-122.6784
→ Returns forecast URL to fetch
```

**Sunrise/Sunset:**
```
https://api.sunrise-sunset.org/json?lat=45.5152&lng=-122.6784&formatted=0
→ Returns sunrise, sunset, dawn, dusk times in UTC
```

### C. Moon Phase Calculation

Use astronomical algorithm based on date:
- New Moon: 0-1 days from new moon
- First Quarter: 6-8 days
- Full Moon: 13-15 days
- Last Quarter: 20-22 days

---

*Document prepared for Columbia River FishCount MVP development.*
