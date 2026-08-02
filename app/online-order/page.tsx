import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_AHEAD_URL } from "@/lib/business";

/**
 * A forwarding stub, not a destination.
 *
 * This page used to say "Coming soon." and carry an interest form for a
 * feature that has since shipped — while the nav linked to the working
 * order-ahead app. It was fully indexable, so search results for "the
 * breakroom online order" could land a customer on a page telling them online
 * ordering did not exist.
 *
 * `output: "export"` means there is no server and therefore no 3xx redirect,
 * so the forward is done three ways: a <meta http-equiv="refresh"> for anyone
 * with JS disabled, a client-side replace() for everyone else, and a plain
 * link for both. robots: noindex keeps it from competing with the real app in
 * search, and app/robots.ts disallows the path as well.
 */
export const metadata: Metadata = {
  title: "Order Ahead",
  description: `Order ahead from The Breakroom at ${ORDER_AHEAD_URL}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: ORDER_AHEAD_URL },
};

export default function OnlineOrderPage() {
  return (
    <div className="container-page py-24 max-w-2xl text-center">
      <meta httpEquiv="refresh" content={`0; url=${ORDER_AHEAD_URL}`} />
      {/* Runs before paint on a normal client navigation. Kept inline (rather
          than in an effect) so it fires even if hydration is slow. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `location.replace(${JSON.stringify(ORDER_AHEAD_URL)});`,
        }}
      />

      <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
        Online Order
      </p>
      <h1 className="mt-3 font-display tracking-tighter2">
        Online ordering has moved.
      </h1>
      <p className="mt-5 text-qh-ink-soft text-lg">
        Order ahead for pickup is live — you should be redirected in a moment.
      </p>

      <Link
        href={ORDER_AHEAD_URL}
        className="mt-8 inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-medium bg-qh-accent text-white hover:bg-qh-accent/90 transition-colors"
      >
        Order ahead now ↗
      </Link>

      <p className="mt-6 text-sm text-qh-ink-soft">
        Not redirecting?{" "}
        <a
          href={ORDER_AHEAD_URL}
          className="text-qh-accent underline underline-offset-2"
        >
          {ORDER_AHEAD_URL.replace(/^https?:\/\//, "")}
        </a>
        <span className="mx-2 text-qh-line">·</span>
        <Link href="/visit" className="text-qh-accent underline underline-offset-2">
          Visit us instead
        </Link>
      </p>
    </div>
  );
}
