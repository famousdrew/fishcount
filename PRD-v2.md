# Columbia River FishCount v2 - Product Requirements Document

## Overview

**Product Name:** Columbia River FishCount
**Version:** 2.0
**Date:** March 28, 2026
**Target Users:** Recreational fishermen in the Portland, OR / Columbia River area

### What Changed from v1

v1 tried to build a comprehensive dashboard. The result was a page that shows a lot of data but doesn't do the one thing well: tell a fisherman whether to go fishing. v2 strips back to the core value proposition and fixes the technical foundation.

**Problems being solved:**

| Problem | Root Cause | v2 Fix |
|---------|-----------|--------|
| Scores are unreliable | Missing data gets free points; 12-point scale is confusing; PRD/code mismatch | Honest scoring: no data = no score for that factor. Simple 0-10 scale. |
| "Today" data is stale | DART publishes yesterday's counts; app presents them as current | Clearly label fish counts by their actual date. Today's forecast uses real-time conditions only (weather, tide, flow). |
| App is fragile | One API failure can break everything; no error boundaries | Each data source is independent with graceful degradation. Show what we have. |
| Too much cognitive load | Three sections competing for attention | Single-screen design: big verdict up top, supporting details below, historical data tucked away. |
| Chinook-only scoring | Hardcoded species ignores seasonal runs | Season-aware scoring that adapts to what's actually running |

---

## Architecture

### Core Principle: Separation of Real-Time vs Historical

The fundamental insight is that **fish counts are always delayed** (DART reports previous-day data) while **conditions are real-time**. v2 treats these as two distinct data streams:

1. **Real-time conditions** (weather, tide, flow, moon, sun) - used for today's go/no-go
2. **Fish passage trends** (DART) - used for trend context, not today's score

### Data Sources (unchanged)

| Data | Source | Station/Location | Cache TTL |
|------|--------|-----------------|-----------|
| Fish Counts | DART/CBR | Bonneville Dam (BON) | 2 hours |
| Water Flow + Temp | USGS | 14144700 (Vancouver, WA) | 15 min |
| Tides | NOAA CO-OPS | 9439040 (Astoria) | 1 hour |
| Water Temp (backup) | NOAA CO-OPS | 9440422 (Longview) | 30 min |
| Weather | NWS | 45.5152, -122.6784 (Portland) | 30 min |
| Sunrise/Sunset | sunrise-sunset.org | Same coords | 24 hours |
| Moon Phase | Algorithmic | N/A | N/A |

### Tech Stack (unchanged)

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Recharts for charts
- Railway deployment

### Data Fetching Strategy

```
fetchDashboardData()
  ├── fetchRealTimeConditions()    // parallel: USGS, NOAA, NWS, sun, moon
  ├── fetchFishCounts(7)           // DART: last 7 days
  └── combine + score
```

**Key changes:**
- All fetches wrapped in try/catch returning `null` on failure (no cascade failures)
- Sun data for historical days calculated algorithmically or batched, not fetched in a loop
- Each section of the UI renders independently based on available data

---

## Scoring System v2

### Philosophy

- **Honest scores**: if data is missing, that factor is excluded (not given a middle score)
- **Season-aware**: scoring adapts to what species are actually running
- **Transparent**: every score shows its breakdown so users can calibrate trust

### Scale: 0-10

Simpler, more intuitive than the old 0-12.

| Range | Verdict | Color |
|-------|---------|-------|
| 8-10 | **GO** | Green (#10B981) |
| 5-7 | **MAYBE** | Amber (#F59E0B) |
| 0-4 | **SKIP** | Red (#EF4444) |

If fewer than 3 factors have data, show "INSUFFICIENT DATA" instead of a misleading score.

### Scoring Factors

Each factor scores 0-10 independently, then the final score is a weighted average.

| Factor | Weight | What it Measures | Data Source |
|--------|--------|-----------------|-------------|
| **Fish Passage Trend** | 30% | Are fish counts increasing, stable, or declining over the last 3-5 days? | DART |
| **Water Temperature** | 20% | Is water temp in the target range for the active species? | USGS (primary), NOAA (backup) |
| **Tide** | 15% | Incoming tide is best for bank fishing on the Columbia | NOAA |
| **Wind** | 15% | Calm conditions are better for boat and bank fishing | NWS |
| **Flow Rate** | 10% | Is the Columbia running at a fishable level? | USGS |
| **Moon Phase** | 10% | New/full moons correlate with better fishing | Algorithmic |

### Season-Aware Species Targeting

Instead of hardcoding Chinook thresholds, the scoring system should know which species are in season:

| Season | Primary Species | Date Range (approximate) |
|--------|----------------|-------------------------|
| Spring Chinook | Chinook (Spring run) | March - June |
| Summer Steelhead | Steelhead | June - October |
| Fall Chinook | Chinook (Fall run) | August - November |
| Coho | Coho | September - November |
| Winter Steelhead | Steelhead (Wild) | December - March |
| Shad | Shad | May - July |

The Fish Passage Trend factor should evaluate counts for the species currently in season, not just Chinook year-round. When multiple species overlap, use the one with the highest recent counts.

### Fish Passage Trend Scoring (detailed)

Rather than raw count thresholds (>200 = good), compare recent counts to:
- **3-day moving direction**: are counts going up or down?
- **Season norms**: is this count good or bad for this time of year and species?

| Trend | Score |
|-------|-------|
| Counts increasing, above seasonal average | 9-10 |
| Counts stable, above seasonal average | 7-8 |
| Counts increasing, below seasonal average | 5-6 |
| Counts stable or declining, near average | 3-4 |
| Counts declining, below average | 0-2 |

For the MVP, seasonal averages can be hardcoded lookup tables based on historical DART data. They don't need to be perfect - directional accuracy matters more than precision.

### Water Temperature Scoring (detailed)

Temperature ranges vary by target species:

| Species | Optimal (10 pts) | Good (6 pts) | Fair (3 pts) | Poor (0 pts) |
|---------|------------------|--------------|--------------|---------------|
| Chinook | 50-58°F | 45-65°F | 40-70°F | <40 or >70°F |
| Steelhead | 48-55°F | 42-60°F | 38-65°F | <38 or >65°F |
| Coho | 48-56°F | 44-62°F | 40-68°F | <40 or >68°F |

### Tide Scoring

| Status | Score |
|--------|-------|
| Incoming (first 2 hours) | 10 |
| Incoming (later) | 8 |
| Slack (before incoming) | 6 |
| Outgoing (first 2 hours) | 4 |
| Outgoing (later) | 2 |
| Slack (before outgoing) | 3 |

### Wind Scoring

| Speed | Score |
|-------|-------|
| 0-5 mph | 10 |
| 5-8 mph | 8 |
| 8-12 mph | 5 |
| 12-18 mph | 2 |
| 18+ mph | 0 |

### Flow Rate Scoring

| CFS (Columbia at Vancouver) | Score |
|------------------------------|-------|
| 100K-180K | 10 |
| 80K-100K or 180K-220K | 7 |
| 60K-80K or 220K-280K | 4 |
| <60K or >280K | 1 |

### Moon Phase Scoring

| Phase | Score |
|-------|-------|
| New Moon (+/- 1 day) | 10 |
| Full Moon (+/- 1 day) | 9 |
| First/Last Quarter (+/- 1 day) | 6 |
| Waxing/Waning Crescent | 4 |
| Waxing/Waning Gibbous | 3 |

---

## UI Design

### Design Principles

1. **Data density over whitespace.** Every pixel earns its place. No decorative padding, no hero sections with one number floating in space. If you can fit two useful things where one was, do it.
2. **Mobile-first, mobile-primary.** This is a phone app that happens to have a URL. Design for a 375px screen held in one hand at 5 AM.
3. **Scannable hierarchy.** The verdict is instant. Details are one tap away, not one scroll away.
4. **Dark/muted UI.** Dark backgrounds with high-contrast data. Easier on eyes at dawn, looks better with colored status indicators, and feels more like an instrument panel than a marketing page.

### Color System

```
Background:       #0F172A (slate-900)
Card surface:     #1E293B (slate-800)
Card border:      #334155 (slate-700)
Primary text:     #F1F5F9 (slate-100)
Secondary text:   #94A3B8 (slate-400)
Muted text:       #64748B (slate-500)

Status - GO:      #10B981 (emerald-500)
Status - MAYBE:   #F59E0B (amber-500)
Status - SKIP:    #EF4444 (red-500)

Accent:           #38BDF8 (sky-400) — links, active states
```

### Layout

```
┌─────────────────────────────────┐
│ FishCount  ·  Bonneville Dam    │ 12px header, one line
├─────────────────────────────────┤
│ GO 8.2  Spring Chinook ↑23%    │ verdict bar: status + headline stat
│ Incoming tide 7:30a · 4mph W   │ one-line context string
├────────┬────────┬───────────────┤
│ 52°F   │ 142K   │ 🌑 New       │ conditions: 3x2 tight grid
│ water  │ flow   │ moon         │ no icons except moon emoji
├────────┼────────┼───────────────┤
│ 4 mph  │ Incmg  │ 6:12a        │ values are large, labels are
│ wind   │ tide   │ sunrise      │ small muted text below
├────────┴────────┴───────────────┤
│ Chinook  1,247 ↑  Sthd  35 ↓  │ fish counts: inline, compact
│ Coho     0        Shad  0     │ counts from Mar 27
├─────────────────────────────────┤
│ ▁▂▃▅▇ 7-day trend  [details ▸] │ mini sparkline + tap for more
└─────────────────────────────────┘
```

Everything above fits in a single mobile viewport (~600px). No scrolling for the core info.

### Section Details

**Verdict Bar**
- Left: score badge (GO/MAYBE/SKIP) with numeric score, colored background pill
- Right: one headline stat — the most important thing (e.g., "Spring Chinook ↑23%")
- Second line: 2-3 key facts as a comma/dot-separated string, not individual components
- No paragraph text. No "Excellent conditions for fishing today." Just data.

**Conditions Grid**
- 3 columns, 2 rows. Tight gutters (8px).
- Value is the star: large font (20-24px), bold, white
- Label below in small muted text (11px)
- Each cell has a subtle left-border color (green/amber/red) indicating that factor's individual score
- No card shadows, no rounded corners excess. Flat cells with 1px borders.

**Fish Counts Row**
- Compact tabular layout: species name, count, trend arrow
- 2 columns to fit 4-6 species
- Date of counts shown as muted text ("counts from Mar 27")
- Zero counts shown as "–" not "0" (less visual noise)

**Sparkline + Details**
- Tiny inline sparkline (32px tall) showing 7-day primary species trend
- Tapping "details" expands to:
  - Full 7-day chart (Recharts, dark themed)
  - Score breakdown (each factor, weight, score, one-line reason)
  - Daily historical data in table format

### Expanded Detail View

When user taps "details", the page extends below the fold:

**Score Breakdown Table**
```
Factor          Wt    Score
Fish Trend      30%   8/10   Chinook ↑23% vs 3d avg
Water Temp      20%   7/10   52°F (optimal: 50-58)
Tide            15%   9/10   Incoming @ 7:30a
Wind            15%   8/10   4 mph W
Flow            10%   7/10   142K CFS
Moon            10%   9/10   New moon
```
Simple table. No cards, no fancy layout. Just the data.

**7-Day Chart**
- Dark background, colored lines per species
- Species colors adjusted for dark background (brighter saturations)
- Toggleable species, max 3 visible
- Compact: 200px height on mobile

**Historical Daily Data**
- Dense table/list format, not cards
- One row per day: date, primary species count, score, key condition
- Tappable to expand full detail for that day

### Typography

- **Font**: Inter or system sans-serif
- **Verdict score**: 28px bold
- **Condition values**: 22px bold
- **Condition labels**: 11px uppercase, muted
- **Fish counts**: 16px tabular nums
- **Body/detail text**: 13px
- No font size below 11px

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (<640px) | Default layout as shown above |
| Tablet/Desktop (640px+) | Centered column, max-width 480px. Same layout, not wider. |

This is not a dashboard that fills a 27" monitor. It's a phone-shaped instrument panel. On desktop it sits centered in a narrow column. Wider layouts would just add whitespace — the thing we're avoiding.

---

## Error Handling

### Per-Source Degradation

Each data source should fail independently:

| Source Down | Impact | Fallback Display |
|-------------|--------|-----------------|
| DART | No fish counts or trend | "Fish counts unavailable" + score excludes trend factor |
| USGS | No flow or water temp | Show NOAA water temp if available; exclude flow/temp from score |
| NOAA | No tides | Exclude tide from score; show "Tide data unavailable" |
| NWS | No weather/wind | Exclude wind from score |
| Sunrise API | No sunrise/sunset | Calculate from coordinates (simple algorithm) |

### Score with Missing Data

- Calculate weighted average using only available factors
- Normalize to 0-10 scale regardless of how many factors are present
- If fewer than 3 factors have data: show "INSUFFICIENT DATA" instead of a score
- Always show which factors are included/excluded

### UI Error States

- Never show a blank page. Always show whatever data is available.
- Stale data (>2 hours old): show with a "Data may be stale" indicator
- Failed fetch: show the specific tile as "unavailable" with a muted style

---

## Implementation Plan

### Phase 1: Scoring Engine Rewrite
- New scoring module with weighted averages
- Season-aware species detection
- Fish passage trend calculation (3-day direction)
- Unit tests for scoring with various data combinations

### Phase 2: Data Layer Hardening
- Independent try/catch for each data source
- Proper null handling throughout
- Remove sequential sun fetches (calculate or batch)
- Type the "partial data" states properly

### Phase 3: UI Rebuild
- New single-screen layout
- Verdict section with score
- Conditions strip with color-coded tiles
- Fish passage summary with trend indicators
- Collapsible detail sections

### Phase 4: Polish
- Loading states
- Stale data indicators
- Mobile testing and optimization
- Accessibility review

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Time to verdict | < 1 second after page load | Performance monitoring |
| Above-fold completeness | Verdict + conditions visible without scrolling on iPhone SE | Manual testing |
| Score accuracy | Users agree with GO/SKIP >70% of the time | Future: feedback button |
| Uptime during fishing hours (4 AM - 10 AM) | 99% | Railway monitoring |

---

## Future: Fish Counts Page (v2)

Fishermen love seeing the dam counts. The main dashboard keeps it compact, but a dedicated `/counts` page gives people the detail they want.

**Page content:**
- **7-14 day fish count history** in a full-width chart (dark themed, one line per species)
- **Daily counts table** below the chart: one row per day, all species columns
- Species toggles (same as current TrendChart but with more room to breathe)
- Tap a row to see that day's full breakdown (counts + conditions)
- Link from main dashboard sparkline ("details" tap) navigates here

**Data:**
- Fetch up to 14 days from DART (extend the current 5-day fetch)
- Same caching strategy (2 hours)

**Design:**
- Same dark theme as main dashboard
- Chart gets more vertical space here (300px mobile, 400px desktop)
- Table uses tabular numbers, alternating row shading for readability
- Back link to main dashboard at top

This is a separate page, not a modal or drawer. It's a place people might bookmark directly.

---

## Out of Scope (Future)

- User accounts / saved preferences
- Push notifications ("conditions are GO tomorrow")
- Multiple locations (other dams, tributaries)
- Historical year-over-year comparisons
- Fishing log / catch tracking
- Barometric pressure (would be nice but no free reliable API)
- Specific fishing spot recommendations

---

*This PRD supersedes PRD.md (v1). The original is preserved for reference.*
