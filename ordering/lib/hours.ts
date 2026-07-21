// Ordering-hours math. All wall-clock time is America/Los_Angeles, computed
// via Intl — the server's own clock (UTC on Vercel) is never read directly.

export type HoursSettings = {
  ordering_open_minutes: number;
  ordering_close_minutes: number;
  last_order_buffer_minutes: number;
};

const PACIFIC = "America/Los_Angeles";

/** Minutes since midnight in the cafe's timezone. */
export function pacificMinutesOfDay(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  // Some ICU builds render midnight as "24" with hour12:false.
  return (get("hour") % 24) * 60 + get("minute");
}

/** Last minute-of-day (exclusive) at which an order may be placed. */
export function lastOrderMinute(s: HoursSettings): number {
  return s.ordering_close_minutes - s.last_order_buffer_minutes;
}

export function isOrderingOpen(s: HoursSettings, date: Date = new Date()): boolean {
  const now = pacificMinutesOfDay(date);
  return now >= s.ordering_open_minutes && now < lastOrderMinute(s);
}

/** 570 → "9:30 AM" */
export function formatMinutes(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
