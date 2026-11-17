// Wall-clock helpers. No timezone maths on purpose: see src/lib/types.ts.

export function isDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// "11:30" to 690. Null when it is not a time.
export function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (m === null) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// 690 to "11:30am".
export function formatClock(minutes: number): string {
  const day = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(day / 60);
  const m = day % 60;
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

// 690 to "11:30", for a time input.
export function toClockInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} hr` : `${h} hr ${rest} min`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function weekdayOf(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

// "2026-11-21" to "Saturday 21 November".
export function formatDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function addDays(day: string, count: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}

// The next Saturday on or after the given day: most open homes are then.
export function nextSaturday(day: string): string {
  return addDays(day, (6 - weekdayOf(day) + 7) % 7);
}

// Today's date in Melbourne, where the homes are.
export function todayInMelbourne(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}

// "2026-11-21T11:00:00" (with or without an offset or seconds) to its
// day and minutes, read as written. Null when it does not parse.
export function splitLocalDateTime(value: string): { date: string; minutes: number } | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (m === null) return null;
  const date = m[1] ?? "";
  if (!isDay(date)) return null;
  const minutes = Number(m[2]) * 60 + Number(m[3]);
  if (minutes >= 1440) return null;
  return { date, minutes };
}

// The short form for a figure in a small tile: "43 min", "1h 43m".
export function formatDurationShort(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest === 0 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 60)}h ${rest}m`;
}
