/**
 * Reusable embedded Google Form, wrapped in a branded "card" so the
 * (necessarily light) Google iframe sits intentionally inside the page theme
 * instead of reading as a bare white box.
 *
 * Two variants:
 *   - "after-hours" (default): for the dark /book page — cream card on a neon ring.
 *   - "quiet-hours": for the light /visit page — elevated card, forest-green chrome.
 *
 * Note: the form's *interior* is cross-origin and can't be styled from here.
 * For the tightest match, also theme the form in Google Forms
 * (Customize theme → header image + colors) toward a light/cream palette.
 *
 * To get a form's src: Google Forms → Send → "< >" (embed) → copy the src URL
 * (keep ?embedded=true). Tune `height` so there is no inner scrollbar —
 * Google iframes don't auto-resize.
 */

// The cafe's signature neon sweep — same palette as the Book button + jump bar.
const BRAND_GRADIENT =
  "linear-gradient(135deg, #ff4d9e 0%, #ff9f45 28%, #d7f25a 52%, #6ee7b7 76%, #a78bfa 100%)";

interface GoogleFormEmbedProps {
  /** The Google Form embed URL (…/viewform?embedded=true). */
  src: string;
  /** Accessible iframe title. */
  title: string;
  /** Text shown in the card's header strip. */
  label?: string;
  /** Fixed iframe height in px (Google iframes don't auto-resize). */
  height?: number;
  /** Page theme the card sits in. */
  variant?: "after-hours" | "quiet-hours";
}

export function GoogleFormEmbed({
  src,
  title,
  label = "The Breakroom",
  height = 1400,
  variant = "after-hours",
}: GoogleFormEmbedProps) {
  const dark = variant === "after-hours";

  const cardBg = dark ? "bg-ah-cream" : "bg-qh-bg-elevated";
  const headerBorder = dark ? "border-ah-bg/10" : "border-qh-line";
  const headerText = dark ? "text-ah-bg" : "text-qh-ink";
  const avatarBg = dark ? "bg-ah-bg" : "bg-qh-ink";
  const shadow = dark
    ? "shadow-[0_28px_70px_-28px_rgba(0,0,0,0.65)]"
    : "shadow-lifted";
  const fallbackText = dark ? "text-ah-cream/55" : "text-qh-ink-soft";
  const fallbackLink = dark ? "text-ah-electric" : "text-qh-accent";

  return (
    <div>
      {/* Neon gradient ring */}
      <div
        className={`rounded-[28px] p-[2px] ${shadow}`}
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        {/* Card surface */}
        <div className={`overflow-hidden rounded-[26px] ${cardBg}`}>
          {/* Branded chrome strip so the embed feels like a designed object */}
          <div
            className={`flex items-center gap-2.5 border-b ${headerBorder} px-5 py-3.5`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${avatarBg} text-sm`}
            >
              ☕
            </span>
            <span className={`font-display text-base font-medium ${headerText}`}>
              {label}
            </span>
            <span
              className="ml-auto flex items-center gap-1.5"
              aria-hidden="true"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff4d9e" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff9f45" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#d7f25a" }} />
            </span>
          </div>

          <iframe
            src={src}
            title={title}
            loading="lazy"
            className={`block w-full ${cardBg}`}
            style={{ height }}
          >
            Loading the form…
          </iframe>
        </div>
      </div>

      <p className={`mt-4 text-center text-sm ${fallbackText}`}>
        Trouble seeing the form?{" "}
        <a
          href={src.replace("?embedded=true", "")}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium ${fallbackLink} underline-offset-4 hover:underline`}
        >
          Open it in a new tab ↗
        </a>
      </p>
    </div>
  );
}
