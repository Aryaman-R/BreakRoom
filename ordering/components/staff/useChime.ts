"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browsers refuse to start audio without a user gesture, so the staff screen
// shows an "enable sound" button once; after that tap we can chime freely.
// The chime itself is synthesized (two-tone) — no audio file to host.

const CHIME_INTERVAL_MS = 10_000;

export function useChime(active: boolean) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const chime = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }, []);

  const enable = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    void ctxRef.current.resume();
    setEnabled(true);
    chime(); // immediate feedback that sound works
  }, [chime]);

  useEffect(() => {
    if (!enabled || !active) return;
    chime();
    const t = setInterval(chime, CHIME_INTERVAL_MS);
    return () => clearInterval(t);
  }, [enabled, active, chime]);

  return { enabled, enable };
}
