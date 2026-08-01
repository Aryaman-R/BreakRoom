"use client";

import { useEffect, useState } from "react";
import { countdownSeconds, KIOSK_DONE_MS } from "@/lib/kiosk";
import { formatCents } from "@/lib/money";
import type { PublicOrder } from "@/lib/types";
import { useKiosk } from "./KioskProvider";

// What a kiosk shows after an order goes in.
//
// The web gets a live status tracker, because that page belongs to the
// customer — it's in their pocket and they can watch it. A kiosk screen
// belongs to the cafe and the next person in line, so it does the opposite:
// it says one thing, enormously, for long enough to memorise, and then hands
// itself back. The number is the only thing that matters, because staff will
// call it out and the customer pays at the register.
//
// The countdown is visible on purpose. A screen that resets without warning
// feels broken; a screen that says "clearing in 12" reads as a system doing
// its job, and gives anyone still reading a way to buy more time. That's a
// restart, not a pause: an unattended kiosk must always find its way back to
// the attract screen, so there is no way to stop the clock for good.

export function KioskOrderDone({
  order,
  numberHint,
}: {
  order: PublicOrder | null;
  /** From ?n= — lets the number paint before the fetch lands. */
  numberHint: number | null;
}) {
  const { endSession } = useKiosk();
  const [remaining, setRemaining] = useState(KIOSK_DONE_MS);
  const [extensions, setExtensions] = useState(0);

  useEffect(() => {
    const deadline = Date.now() + KIOSK_DONE_MS;
    setRemaining(KIOSK_DONE_MS);
    const tick = window.setInterval(() => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(tick);
        endSession();
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [endSession, extensions]);

  const orderNumber = order?.order_number ?? numberHint;
  const seconds = countdownSeconds(remaining);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 py-10 text-center">
      <p className="text-sm uppercase tracking-[0.32em] text-qh-accent">
        Order placed
      </p>

      {orderNumber != null ? (
        <>
          <p className="mt-6 text-lg text-qh-ink-soft">Your order number is</p>
          <p className="font-display text-[clamp(6rem,22vw,14rem)] leading-[0.85] tracking-tighter2">
            #{orderNumber}
          </p>
        </>
      ) : (
        <p className="mt-6 font-display text-[clamp(2.5rem,8vw,5rem)] leading-tight tracking-tighter2">
          You&#8217;re all set.
        </p>
      )}

      <p className="mt-6 max-w-xl text-xl text-qh-ink-soft">
        {order?.walk_in === false ? (
          <>
            We&#8217;ll text you when it&#8217;s ready.{" "}
            <span className="font-medium text-qh-ink">
              Pay at the register when you pick it up.
            </span>
          </>
        ) : (
          <>
            Listen for your number at the counter.{" "}
            <span className="font-medium text-qh-ink">
              Pay at the register when you pick it up.
            </span>
          </>
        )}
      </p>

      {order ? (
        <p className="mt-4 font-mono text-lg">
          {formatCents(order.total_cents)} plus tax
        </p>
      ) : null}

      <button className="btn btn-accent btn-lg mt-10 w-full max-w-sm" onClick={endSession}>
        Start a new order
      </button>

      <button
        className="mt-4 text-sm text-qh-ink-soft underline underline-offset-4"
        onClick={() => setExtensions((n) => n + 1)}
      >
        This screen clears in {seconds}s — tap for more time
      </button>
    </main>
  );
}
