"use client";

import { useCallback, useRef, useState } from "react";
import {
  KIOSK_EXIT_MAX_ATTEMPTS,
  KIOSK_EXIT_TAPS,
  kioskExitPin,
  NO_TAPS,
  registerTap,
  tapsUnlock,
  type TapState,
} from "@/lib/kiosk";
import { useKiosk } from "./KioskProvider";

// The way out of kiosk mode.
//
// Chromium runs the hardware with --kiosk: no URL bar, no tabs, no keyboard.
// So ?kiosk=off — the only exit that existed before — is unreachable on the
// very device that needs it. Instead: five taps in the top-left corner open a
// PIN pad.
//
// The PIN is checked here on the device, on purpose. Staff most need to get
// out when something is broken, and "something is broken" usually means the
// network. A server round-trip would lock them out exactly when it matters.
// See lib/kiosk.ts for why that is an acceptable trade: this gates a
// localStorage flag on a screen you must already be standing in front of,
// and /staff and /admin keep their own real Supabase auth behind it.

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function KioskExit() {
  const { kiosk, exitKiosk } = useKiosk();
  const taps = useRef<TapState>(NO_TAPS);

  const [pad, setPad] = useState(false);
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const closePad = useCallback(() => {
    setPad(false);
    setEntry("");
    setWrong(0);
    taps.current = NO_TAPS;
  }, []);

  const onHotspot = useCallback(() => {
    taps.current = registerTap(taps.current, Date.now());
    if (tapsUnlock(taps.current)) {
      taps.current = NO_TAPS;
      setEntry("");
      setWrong(0);
      setPad(true);
    }
  }, []);

  const submit = useCallback(
    (candidate: string) => {
      if (candidate === kioskExitPin()) {
        exitKiosk();
        setPad(false);
        setEntry("");
        setWrong(0);
        setDone(true);
        return;
      }
      setEntry("");
      setWrong((n) => {
        const next = n + 1;
        // Out of attempts: fold the pad away. Getting it back means finding
        // the corner and tapping five times again.
        if (next >= KIOSK_EXIT_MAX_ATTEMPTS) closePad();
        return next;
      });
    },
    [closePad, exitKiosk]
  );

  const pressDigit = useCallback(
    (digit: string) => {
      const next = (entry + digit).slice(0, 12);
      // Auto-submit once the entry is as long as the configured PIN, so
      // there's no "OK" key to hunt for on a pad you use twice a year.
      if (next.length >= kioskExitPin().length) submit(next);
      else setEntry(next);
    },
    [entry, submit]
  );

  // The confirmation panel outlives kiosk mode itself, so it renders even
  // once `kiosk` has gone false.
  if (done) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-qh-ink/70 px-6">
        <div className="card w-full max-w-sm px-6 py-6 text-center">
          <h2 className="font-display text-2xl">Kiosk mode is off</h2>
          <p className="mt-2 text-sm text-qh-ink-soft">
            This device is back to the normal site. Open{" "}
            <span className="font-mono">?kiosk=on</span> to switch it back.
          </p>
          <div className="mt-5 grid gap-2">
            <a className="btn btn-primary btn-md" href="/staff">
              Staff screen
            </a>
            <a className="btn btn-quiet btn-md" href="/admin">
              Admin
            </a>
            <button className="btn btn-quiet btn-md" onClick={() => setDone(false)}>
              Stay on ordering
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!kiosk) return null;

  return (
    <>
      {/* Invisible corner target. Sits above every overlay so staff can get
          out from the attract screen or mid-order, and is hidden from
          assistive tech because it is staff plumbing, not content. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onHotspot}
        className="fixed left-0 top-0 z-[90] h-20 w-20 cursor-default opacity-0"
      />

      {pad ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-qh-ink/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Staff exit"
        >
          <div className="card w-full max-w-xs px-6 py-6">
            <h2 className="text-center font-display text-2xl">Staff exit</h2>
            <p className="mt-1 text-center text-sm text-qh-ink-soft">
              Enter the PIN to leave kiosk mode.
            </p>

            <div
              className="mt-4 flex h-12 items-center justify-center gap-3"
              aria-live="polite"
              aria-label={`${entry.length} digits entered`}
            >
              {entry.length === 0 ? (
                <span className="text-sm text-qh-ink-soft">— — — —</span>
              ) : (
                Array.from({ length: entry.length }, (_, i) => (
                  <span key={i} className="h-3 w-3 rounded-full bg-qh-ink" />
                ))
              )}
            </div>

            {wrong > 0 ? (
              <p role="alert" className="text-center text-sm text-[#a4283d]">
                Wrong PIN — {KIOSK_EXIT_MAX_ATTEMPTS - wrong} left
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {PAD_KEYS.map((d) => (
                <button
                  key={d}
                  className="btn btn-quiet h-14 text-xl"
                  onClick={() => pressDigit(d)}
                >
                  {d}
                </button>
              ))}
              <button className="btn btn-quiet h-14 text-sm" onClick={closePad}>
                Cancel
              </button>
              <button className="btn btn-quiet h-14 text-xl" onClick={() => pressDigit("0")}>
                0
              </button>
              <button
                className="btn btn-quiet h-14 text-xl"
                aria-label="Backspace"
                onClick={() => setEntry((p) => p.slice(0, -1))}
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
