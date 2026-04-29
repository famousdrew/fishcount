'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { TIDE_STATIONS, TIDE_STATION_COOKIE } from '@/lib/stations';

export async function setTideStation(stationId: string) {
  if (!TIDE_STATIONS.some(s => s.id === stationId)) return;
  const c = await cookies();
  c.set(TIDE_STATION_COOKIE, stationId, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  });
  revalidatePath('/');
}
