/**
 * Single source of truth for the cafe's name, address, phone, hours, and links.
 *
 * Before this file existed the same facts were retyped in the footer, the
 * /visit table, the homepage, and the Beans assistant — and they had drifted
 * apart: the footer advertised "Every day", /visit said the weekend was
 * closed, the homepage showed a hard-coded "Open now", and Beans told people
 * we were open Saturday and Sunday. The phone number was worse: the visible
 * digits and the tel: link were two different numbers.
 *
 * Anything user-facing that states a fact about the business must read it from
 * here. If you find yourself typing an address, a phone number, or an opening
 * time into a component, put it here instead.
 */

/** IANA zone the cafe actually lives in. Hours below are always in this zone. */
export const TIMEZONE = "America/Los_Angeles";

export const BUSINESS = {
  name: "The Breakroom",
  legalName: "The Breakroom",
  tagline: "Coffee and boba by day, comfort food and gatherings by night.",
  description:
    "A Bothell café for specialty coffee, bubble tea, and Asian-American comfort food — dine in by day, private events and catering by night.",

  address: {
    street: "18916 N Creek Pkwy #101",
    locality: "Bothell",
    region: "WA",
    postalCode: "98011",
    country: "US",
  },

  /** Display form and dial form are derived from one value so they cannot disagree. */
  phone: {
    display: "(425) 419-4231",
    /** E.164, for tel: hrefs and structured data. */
    e164: "+14254194231",
  },

  email: "thebreakroombothell@gmail.com",

  geo: { lat: 47.7763, lon: -122.2017 },

  social: {
    instagram: "https://www.instagram.com/thebreakroombothell",
    facebook: "https://www.facebook.com/people/The-Breakroom/61560259126301/",
  },
} as const;

/** Full one-line postal address, e.g. for maps links and JSON-LD. */
export const FULL_ADDRESS = `${BUSINESS.address.street}, ${BUSINESS.address.locality}, ${BUSINESS.address.region} ${BUSINESS.address.postalCode}`;

export const MAP_URL = `https://www.openstreetmap.org/?mlat=${BUSINESS.geo.lat}&mlon=${BUSINESS.geo.lon}&zoom=17`;

/* ------------------------------------------------------------------ hours */

/** Minutes past local midnight. 9.5 * 60 = 570. */
export interface DayHours {
  /** 0 = Sunday, to match Date#getDay and Intl weekday ordering. */
  day: number;
  label: string;
  /** Schema.org day token, for openingHoursSpecification. */
  schemaDay: string;
  /** null on days the cafe is closed. */
  open: number | null;
  close: number | null;
}

const OPEN_MIN = 9 * 60 + 30; // 9:30 AM
const CLOSE_MIN = 15 * 60 + 30; // 3:30 PM

/** Mon–Fri 9:30 AM – 3:30 PM. Closed Saturday and Sunday. */
export const HOURS: DayHours[] = [
  { day: 0, label: "Sunday", schemaDay: "Sunday", open: null, close: null },
  { day: 1, label: "Monday", schemaDay: "Monday", open: OPEN_MIN, close: CLOSE_MIN },
  { day: 2, label: "Tuesday", schemaDay: "Tuesday", open: OPEN_MIN, close: CLOSE_MIN },
  { day: 3, label: "Wednesday", schemaDay: "Wednesday", open: OPEN_MIN, close: CLOSE_MIN },
  { day: 4, label: "Thursday", schemaDay: "Thursday", open: OPEN_MIN, close: CLOSE_MIN },
  { day: 5, label: "Friday", schemaDay: "Friday", open: OPEN_MIN, close: CLOSE_MIN },
  { day: 6, label: "Saturday", schemaDay: "Saturday", open: null, close: null },
];

/** Monday-first ordering, which is how an opening-hours table is normally read. */
export const HOURS_TABLE: DayHours[] = [...HOURS.slice(1), HOURS[0]];

export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** "9:30 AM – 3:30 PM", or "Closed". */
export function formatDayHours(d: DayHours): string {
  if (d.open === null || d.close === null) return "Closed";
  return `${formatMinutes(d.open)} – ${formatMinutes(d.close)}`;
}

/**
 * Short human summary of the week, collapsing equal runs of days.
 * With the current schedule this yields "Mon–Fri 9:30 AM – 3:30 PM".
 */
export function hoursSummary(): string {
  const openDays = HOURS_TABLE.filter((d) => d.open !== null);
  if (openDays.length === 0) return "Closed";
  const first = openDays[0];
  const last = openDays[openDays.length - 1];
  const range =
    openDays.length === 1
      ? first.label.slice(0, 3)
      : `${first.label.slice(0, 3)}–${last.label.slice(0, 3)}`;
  return `${range} ${formatDayHours(first)}`;
}

/* -------------------------------------------------- open/closed, in-zone */

/**
 * The cafe's local weekday and minute-of-day for a given instant.
 *
 * A visitor in Tokyo must still see Bothell's clock, and a static export has
 * no server to ask, so this converts explicitly through the cafe's timezone
 * rather than trusting the browser's.
 */
export function localNow(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  // Intl can emit "24" for midnight under hour12:false; normalise it.
  const hour = Number(get("hour")) % 24;
  return {
    day: dayMap[get("weekday")] ?? 0,
    minutes: hour * 60 + Number(get("minute")),
  };
}

export interface OpenState {
  isOpen: boolean;
  /** The day the cafe is open next (or today, if open now). */
  next: DayHours | null;
  /** Human phrase: "Open until 3:30 PM", "Opens Monday 9:30 AM", … */
  label: string;
}

export function openState(now: Date = new Date()): OpenState {
  const { day, minutes } = localNow(now);
  const today = HOURS[day];

  if (today.open !== null && today.close !== null) {
    if (minutes >= today.open && minutes < today.close) {
      return { isOpen: true, next: today, label: `Open until ${formatMinutes(today.close)}` };
    }
    if (minutes < today.open) {
      return { isOpen: false, next: today, label: `Opens today ${formatMinutes(today.open)}` };
    }
  }

  // Walk forward to the next day that has hours.
  for (let i = 1; i <= 7; i++) {
    const d = HOURS[(day + i) % 7];
    if (d.open !== null) {
      const when = i === 1 ? "tomorrow" : d.label;
      return { isOpen: false, next: d, label: `Opens ${when} ${formatMinutes(d.open)}` };
    }
  }
  return { isOpen: false, next: null, label: "Closed" };
}

/* -------------------------------------------------------------- ordering */

/**
 * The cafe's own order-ahead app. Production defaults to the ordering
 * subdomain; `next dev` points at the local ordering server. Override both
 * with NEXT_PUBLIC_ORDER_URL (e.g. to aim a preview build at a *.vercel.app).
 *
 * Inlined at build time — with output: "export" there is no runtime to
 * re-resolve it, so the build environment must set it.
 */
export const ORDER_AHEAD_URL =
  process.env.NEXT_PUBLIC_ORDER_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3100"
    : "https://order.breakroombothell.com");

/**
 * DoorDash storefront. `pickup=true` so the customer lands on pickup rather
 * than delivery — they came from the cafe's own site, so they are local and
 * should not be shown delivery fees by default.
 */
export const DOORDASH_URL =
  "https://www.doordash.com/store/the-breakroom-bothell-45695059/111526546/?cursor=eyJzZWFyY2hfaXRlbV9jYXJvdXNlbF9jdXJzb3IiOnsicXVlcnkiOiJUaGUgQnJlYWtyb29tIiwiaXRlbV9pZHMiOltdLCJzZWFyY2hfdGVybSI6InRoZSBicmVha3Jvb20iLCJ2ZXJ0aWNhbF9pZCI6LTk5OSwidmVydGljYWxfbmFtZSI6ImFsbCIsInF1ZXJ5X2ludGVudCI6IlNUT1JFX1JYIn0sInN0b3JlX3ByaW1hcnlfdmVydGljYWxfaWRzIjpbMSwxMTAwMzcsMTEwMDQ1LDExMDA1MiwxMTAwNTUsMTEwMDYyLDRdfQ==&pickup=true";

/** Canonical origin. Must be set at build time or link previews break. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://breakroombothell.com";
