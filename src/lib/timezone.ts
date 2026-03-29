// All dates/times in this app should be in Pacific time
export const TZ = 'America/Los_Angeles';

// Get the current date/time as if we're in Pacific timezone
// Returns a Date object adjusted so getFullYear/getMonth/getDate/etc return Pacific values
export function nowPacific(): Date {
  const now = new Date();
  // Format in Pacific to get the local date string, then parse back
  const pacificStr = now.toLocaleString('en-US', { timeZone: TZ });
  return new Date(pacificStr);
}

// Get today's date string in Pacific time (yyyy-MM-dd)
export function todayPacific(): string {
  const now = new Date();
  const parts = now.toLocaleDateString('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // parts = "03/28/2026"
  const [m, d, y] = parts.split('/');
  return `${y}-${m}-${d}`;
}

// Format a date string (yyyy-MM-dd) to a day name in Pacific time
export function dayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: TZ });
}

// Format a date string to short day name
export function shortDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
}
