/**
 * Schema.org JSON-LD for the cafe.
 *
 * A local cafe lives or dies on the local pack — the map results Google shows
 * for "coffee near me". Without structured data, Google has to guess the
 * address, hours, and phone from prose, and it usually guesses wrong. Every
 * value here reads from lib/business.ts so the markup cannot drift from what
 * the page displays.
 */

import {
  BUSINESS,
  HOURS,
  SITE_URL,
  TIMEZONE,
  formatMinutes,
} from "./business";

/** "09:30" — schema.org wants 24-hour HH:MM. */
function toIsoTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: SITE_URL,
    telephone: BUSINESS.phone.e164,
    email: BUSINESS.email,
    image: `${SITE_URL}/photos/lounge-wide.jpg`,
    logo: `${SITE_URL}/logo.png`,
    priceRange: "$$",
    servesCuisine: ["Coffee", "Bubble Tea", "Sandwiches", "Asian-American"],
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lon,
    },
    openingHoursSpecification: HOURS.filter((d) => d.open !== null).map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${d.schemaDay}`,
      opens: toIsoTime(d.open as number),
      closes: toIsoTime(d.close as number),
    })),
    sameAs: [BUSINESS.social.instagram, BUSINESS.social.facebook],
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: false,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BUSINESS.name,
    publisher: { "@id": `${SITE_URL}/#business` },
  };
}

/**
 * Human-readable summary, used in the /visit copy so the page and the markup
 * are generated from the same numbers.
 */
export function hoursSentence(): string {
  const open = HOURS.filter((d) => d.open !== null);
  if (!open.length) return "Currently closed.";
  const first = open[0];
  return `${first.label}–${open[open.length - 1].label}, ${formatMinutes(
    first.open as number
  )} to ${formatMinutes(first.close as number)} (${TIMEZONE.split("/")[1].replace("_", " ")} time).`;
}
