// Curated NOAA tide stations along the Columbia River, ordered mouth → Bonneville.
// River miles are approximate.
export interface TideStation {
  id: string;
  name: string;
  riverMile: number;
  state: 'OR' | 'WA';
}

export const TIDE_STATIONS: TideStation[] = [
  { id: '9439040', name: 'Astoria',       riverMile: 14,  state: 'OR' },
  { id: '9439099', name: 'Wauna',         riverMile: 41,  state: 'OR' },
  { id: '9440422', name: 'Longview',      riverMile: 66,  state: 'WA' },
  { id: '9439201', name: 'St. Helens',    riverMile: 86,  state: 'OR' },
  { id: '9440083', name: 'Vancouver',     riverMile: 106, state: 'WA' },
  { id: '9440047', name: 'Washougal',     riverMile: 121, state: 'WA' },
  { id: '9440079', name: 'Beacon Rock',   riverMile: 141, state: 'WA' },
];

export const DEFAULT_STATION_ID = '9439040';
export const TIDE_STATION_COOKIE = 'tide_station';

export function getStation(id: string | undefined): TideStation {
  return TIDE_STATIONS.find(s => s.id === id) ?? TIDE_STATIONS[0];
}
