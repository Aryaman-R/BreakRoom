"use client";

import { useKiosk } from "./KioskProvider";

// The screen a kiosk shows when nobody is using it.
//
// It does two jobs. It tells a passer-by that the screen is for them — a
// kiosk parked on a menu looks like signage, not something you can touch —
// and it guarantees the previous customer's session is visibly over before
// the next one walks up. Every reset path ends here.
//
// Rendered by OrderApp rather than the layout so it can speak for the
// kitchen: outside ordering hours it says so instead of inviting an order
// that would be rejected at checkout.

export function KioskAttract({
  open,
  hoursCopy,
}: {
  open: boolean;
  hoursCopy: string;
}) {
  const { beginSession } = useKiosk();

  return (
    <div className="fixed inset-0 z-[80] bg-qh-bg">
      <button
        type="button"
        onClick={beginSession}
        className="flex h-full w-full flex-col items-center justify-center gap-6 px-8 text-center"
      >
        <span className="text-sm uppercase tracking-[0.32em] text-qh-accent">
          The Breakroom · Bothell
        </span>

        {open ? (
          <>
            <span className="font-display text-[clamp(3rem,9vw,6rem)] leading-[0.95] tracking-tighter2">
              Order here.
            </span>
            <span className="max-w-xl text-lg text-qh-ink-soft">
              Build your order on screen, then pay at the register when you
              pick it up. No app, no fees.
            </span>
            <span className="mt-4 inline-flex animate-kiosk-pulse items-center gap-3 rounded-full bg-qh-ink px-10 py-5 text-lg font-medium text-qh-bg">
              Tap anywhere to start
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tighter2">
              We&#8217;re closed right now.
            </span>
            <span className="max-w-xl text-lg text-qh-ink-soft">
              Kiosk ordering runs {hoursCopy}. Come see us then — or ask at the
              counter and we&#8217;ll take care of you.
            </span>
            <span className="mt-4 text-base text-qh-ink-soft underline underline-offset-4">
              Tap to browse the menu
            </span>
          </>
        )}
      </button>
    </div>
  );
}
