/**
 * Google Maps embed.
 *
 * Production: set NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY in .env and the iframe
 * uses the official Maps Embed API. Restrict the key by HTTP referrer in the
 * Google Cloud console.
 *
 * Dev / no-key: falls back to the legacy keyless `?output=embed` URL so the
 * page renders without configuration.
 *
 * Address is centralized so the rest of the site can read it from one place.
 */

const ADDRESS = "18916 N Creek Pkwy #101, Bothell, WA 98011";

function buildEmbedUrl(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const q = encodeURIComponent(ADDRESS);
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=16`;
  }
  return `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
}

export function MapEmbed() {
  const src = buildEmbedUrl();
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    ADDRESS
  )}`;

  return (
    <figure className="rounded-2xl overflow-hidden border border-qh-line shadow-soft bg-qh-bg-elevated">
      <iframe
        src={src}
        title={`Map showing The Breakroom at ${ADDRESS}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="w-full aspect-[4/3] block border-0"
      />
      <figcaption className="px-4 py-3 flex items-center justify-between gap-4 text-xs text-qh-ink-soft border-t border-qh-line">
        <span className="font-mono">{ADDRESS}</span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-qh-accent underline underline-offset-2 hover:text-qh-ink"
        >
          Directions ↗
        </a>
      </figcaption>
    </figure>
  );
}
