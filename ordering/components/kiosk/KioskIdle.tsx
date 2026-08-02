"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  countdownSeconds,
  KIOSK_IDLE_MS,
  KIOSK_IDLE_WARN_MS,
} from "@/lib/kiosk";
import { useKiosk } from "./KioskProvider";

// Idle reset — the single most important kiosk behaviour.
//
// Someone builds half an order, gets called away, and walks off. Without
// this, the next customer walks up to a stranger's cart, adds to it, and
// pays for both. So: a minute untouched puts up a warning, fifteen seconds
// later the session is wiped back to the attract screen.
//
// The warning deliberately does NOT dismiss itself on activity. A shared
// screen picks up stray taps — a bag brushing past, someone reading over
// your shoulder — and treating those as "the customer is still here" is how
// an abandoned cart survives forever. Only the explicit button counts.

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

export function KioskIdle() {
  const { kiosk, attractVisible, endSession } = useKiosk();

  // Armed on every route, with no exceptions — this is the backstop, and a
  // backstop with a hole in it isn't one. An earlier version stood down on
  // /order/* because the confirmation screen runs its own countdown, which
  // left exactly one way to strand a kiosk forever: reach /order/<bad-id>,
  // get the "order not found" screen, and have nothing left that could ever
  // reset it.
  //
  // The two timers don't fight, because the confirmation's is much shorter
  // (25s vs 60s) and every tap that extends it also resets this one. So this
  // only ever fires on that screen if the screen is already stuck — which is
  // precisely when it should.
  //
  // It stands down for the attract screen only while that screen is actually
  // *mounted*, not merely intended. `attract` is a bare intent flag, but only
  // OrderApp renders KioskAttract — so on any other route `attract` could be
  // true with nothing covering the screen, and this disarmed itself against a
  // fully interactive page. endSession() sets attract before navigating home,
  // so a navigation that was slow, interrupted, or failed outright left the
  // kiosk on a live page with no idle timer and no attract screen: stuck
  // until someone power-cycled it. Keying on what is painted closes that.
  const armed = kiosk && !attractVisible;

  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(KIOSK_IDLE_WARN_MS);

  // Countdown deadline lives in a ref so the ticking interval never has to
  // be torn down and rebuilt.
  const deadline = useRef(0);

  const dismiss = useCallback(() => setWarning(false), []);

  // Phase 1 — waiting for the customer to go quiet.
  useEffect(() => {
    if (!armed || warning) return;
    let timer = window.setTimeout(() => setWarning(true), KIOSK_IDLE_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWarning(true), KIOSK_IDLE_MS);
    };
    ACTIVITY_EVENTS.forEach((type) =>
      window.addEventListener(type, bump, { capture: true, passive: true })
    );
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, bump, { capture: true })
      );
    };
  }, [armed, warning]);

  // Phase 2 — counting down to the wipe.
  useEffect(() => {
    if (!warning) return;
    deadline.current = Date.now() + KIOSK_IDLE_WARN_MS;
    setRemaining(KIOSK_IDLE_WARN_MS);
    const tick = window.setInterval(() => {
      const left = deadline.current - Date.now();
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(tick);
        setWarning(false);
        endSession();
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [warning, endSession]);

  // A session that ends by any other route (staff exit, order placed, "start
  // over") must not leave a stale warning behind it.
  useEffect(() => {
    if (!armed) setWarning(false);
  }, [armed]);

  if (!armed || !warning) return null;

  const seconds = countdownSeconds(remaining);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-qh-ink/70 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="kiosk-idle-title"
    >
      <div className="card w-full max-w-md px-8 py-8 text-center">
        <h2 id="kiosk-idle-title" className="font-display text-3xl">
          Still ordering?
        </h2>
        <p className="mt-3 text-qh-ink-soft">
          We&#8217;ll clear this screen for the next customer in{" "}
          <span className="font-mono text-qh-ink">{seconds}</span>{" "}
          {seconds === 1 ? "second" : "seconds"}.
        </p>
        <button className="btn btn-accent btn-lg mt-6 w-full" onClick={dismiss}>
          I&#8217;m still here
        </button>
        <button
          className="btn btn-quiet btn-md mt-3 w-full"
          onClick={() => {
            setWarning(false);
            endSession();
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
