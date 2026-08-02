"use client";

import Image from "next/image";
import Link from "next/link";
import { BUSINESS, HOURS_TABLE, formatDayHours } from "@/lib/business";
import { useCurrentYear } from "@/components/ui/useLiveClock";

export function Footer() {
  return (
    <footer className="relative z-[2] mt-32 border-t border-qh-line bg-qh-bg-elevated">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-qh-ink/10 overflow-hidden shrink-0">
              <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-8 w-auto" />
            </span>
            <p className="font-display italic text-2xl text-qh-ink">
              The Breakroom.
            </p>
          </div>
          <p className="mt-3 max-w-sm text-qh-ink-soft">
            {BUSINESS.tagline} Come hungry.
          </p>
          <p className="mt-6 text-sm text-qh-ink-soft">
            Follow along for specials and new drinks:
          </p>
          <div className="mt-2 flex gap-3 text-sm">
            <a
              className="text-qh-ink underline underline-offset-4 hover:text-qh-accent"
              href={BUSINESS.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              className="text-qh-ink underline underline-offset-4 hover:text-qh-accent"
              href={BUSINESS.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </div>
        </div>

        {/* h2, not h4 — the footer sits on pages whose last heading is an h2,
            and jumping straight to h4 broke the outline on five of seven. */}
        <div>
          <h2 className="font-display text-lg mb-3">Hours</h2>
          <dl className="text-sm font-mono">
            {HOURS_TABLE.map((d) => (
              <div key={d.label} className="flex justify-between gap-4 py-1">
                <dt className="text-qh-ink-soft">{d.label.slice(0, 3)}</dt>
                <dd className={d.open === null ? "text-qh-ink-soft" : "text-qh-ink"}>
                  {formatDayHours(d)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="font-display text-lg mb-3">Find us</h2>
          <address className="not-italic text-sm text-qh-ink-soft leading-7">
            {BUSINESS.address.street}<br />
            {BUSINESS.address.locality}, {BUSINESS.address.region}{" "}
            {BUSINESS.address.postalCode}<br />
            <a href={`tel:${BUSINESS.phone.e164}`} className="hover:text-qh-ink">
              {BUSINESS.phone.display}
            </a><br />
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-qh-ink">
              {BUSINESS.email}
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-qh-line">
        <div className="container-page py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-qh-ink-soft">
          <p>
            © <YearRange /> {BUSINESS.name}. All rights reserved.
          </p>
          <p>
            <Link href="/visit" className="hover:text-qh-ink">Contact</Link>
            <span className="mx-2">·</span>
            Made with care in Bothell, WA.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * The build year is baked into the HTML; the live year is filled in after
 * mount. Rendering the frozen year first keeps the server and client markup
 * identical, so there is no hydration mismatch — and the visible text is only
 * ever wrong for the few milliseconds before the effect runs, instead of for
 * the whole of January.
 */
function YearRange() {
  const live = useCurrentYear();
  // The static HTML carries the build year and the first client render carries
  // the real one; on Jan 1 those differ, hence suppressHydrationWarning. The
  // effect then settles it to the true current year on the very next paint.
  return <span suppressHydrationWarning>{live ?? new Date().getFullYear()}</span>;
}
