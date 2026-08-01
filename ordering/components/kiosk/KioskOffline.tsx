"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useKiosk } from "./KioskProvider";

// "Please order at the counter."
//
// A phone that loses signal mid-order is an annoyance the customer already
// understands. A kiosk that loses the network is a screen inviting people to
// build an order it cannot place — and they only find out at the last step,
// after typing everything in. So the kiosk watches its own connectivity and
// takes itself out of service the moment it can't do its job.
//
// navigator.onLine alone isn't enough: it reports "online" for a device
// happily connected to a router whose uplink is down, which is the common
// failure in a cafe. It's used as a fast negative signal only; the positive
// signal is a real round-trip to /api/health.

const PROBE_MS = 20_000;
const PROBE_TIMEOUT_MS = 6_000;
/** Consecutive failures before going out of service — one blip isn't an outage. */
const FAILURES_BEFORE_DOWN = 2;

export function KioskOffline() {
  const { kiosk } = useKiosk();
  const pathname = usePathname();
  const [down, setDown] = useState(false);
  const [checking, setChecking] = useState(false);
  const failures = useRef(0);

  const probe = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(String(res.status));
      failures.current = 0;
      setDown(false);
    } catch {
      failures.current += 1;
      if (failures.current >= FAILURES_BEFORE_DOWN) setDown(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!kiosk) return;
    // The browser saying "offline" is always true, so trust it immediately.
    const goOffline = () => {
      failures.current = FAILURES_BEFORE_DOWN;
      setDown(true);
    };
    const goOnline = () => {
      failures.current = 0;
      probe();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    if (!navigator.onLine) goOffline();
    const timer = window.setInterval(probe, PROBE_MS);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      window.clearInterval(timer);
    };
  }, [kiosk, probe]);

  // An order that's already placed still needs its number on screen, and the
  // confirmation renders from data the customer already has. Never cover it.
  if (!kiosk || !down || pathname.startsWith("/order/")) return null;

  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center gap-6 bg-qh-bg px-8 text-center">
      <span className="text-sm uppercase tracking-[0.32em] text-qh-accent">
        The Breakroom · Bothell
      </span>
      <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tighter2">
        Please order at the counter.
      </h2>
      <p className="max-w-xl text-lg text-qh-ink-soft">
        This screen can&#8217;t reach our system right now. Sorry about that —
        our team at the register will take your order and it&#8217;ll be just
        as fast.
      </p>
      <button className="btn btn-quiet btn-md mt-2" onClick={probe} disabled={checking}>
        {checking ? "Checking…" : "Try again"}
      </button>
    </div>
  );
}
