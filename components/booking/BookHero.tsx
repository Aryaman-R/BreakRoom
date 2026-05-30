"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

export function BookHero() {
  // One-shot confetti on page load (canvas-based, then unmounts).
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let cancelled = false;
    (async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;
      confetti({
        particleCount: 90,
        spread: 80,
        startVelocity: 38,
        ticks: 90,
        origin: { x: 0.5, y: 0.35 },
        colors: ["#ff4d9e", "#ff9f45", "#d7f25a", "#6EE7B7", "#A78BFA"],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      {/* Animated background mesh (CSS, on body) is already there.
          These extra blobs add depth on this hero specifically. */}
      <Blobs />
      <Decorations />

      <div className="container-page relative z-[2] py-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm uppercase tracking-[0.18em] text-ah-electric"
        >
          Book a party
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="mt-4 font-party leading-[1.02] text-ah-cream"
          style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
        >
          Let&#8217;s throw something
          <br />
          <span className="text-ah-electric">memorable.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 max-w-xl text-ah-cream/85 text-lg"
        >
          Birthdays, baby showers, team offsites, trivia nights, midnight book launches.
          If it&#8217;s a gathering, we know how to host it.
        </motion.p>
        <motion.a
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          href="#form"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-ah-cream text-ah-bg px-6 py-3 font-medium text-sm hover:bg-ah-electric transition-colors"
        >
          Skip to the form
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 5 L7 10 L11 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.a>
      </div>
    </section>
  );
}

function Blobs() {
  return (
    <>
      <div aria-hidden className="absolute -top-32 -left-20 w-[300px] h-[300px] sm:w-[520px] sm:h-[520px] rounded-full blur-3xl bg-ah-magenta/30" />
      <div aria-hidden className="absolute top-1/3 right-0 w-[280px] h-[280px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl bg-ah-tangerine/25" />
      <div aria-hidden className="absolute bottom-0 left-1/3 w-[260px] h-[260px] sm:w-[440px] sm:h-[440px] rounded-full blur-3xl bg-ah-violet/30" />
    </>
  );
}

function Decorations() {
  return (
    <>
      <Star    style={{ top: "12%", right: "8%",  ["--dur" as string]: "12s" }} />
      <Squiggle style={{ top: "60%", left: "6%",  ["--dur" as string]: "17s" }} />
      <Blob    style={{ top: "30%", right: "20%", ["--dur" as string]: "23s" }} />
    </>
  );
}

function Star({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      className="float-shape"
      style={style}
      width="56" height="56" viewBox="0 0 56 56" aria-hidden
    >
      <path
        d="M28 4 L33 22 L52 24 L37 36 L42 54 L28 44 L14 54 L19 36 L4 24 L23 22 Z"
        fill="#d7f25a"
      />
    </svg>
  );
}

function Squiggle({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      className="float-shape"
      style={{ ...style, ["--dx" as string]: "-12px", ["--dy" as string]: "10px" }}
      width="120" height="40" viewBox="0 0 120 40" aria-hidden
    >
      <path
        d="M4 20 q 12 -18 24 0 t 24 0 t 24 0 t 24 0 t 20 0"
        stroke="#6EE7B7" strokeWidth="4" fill="none" strokeLinecap="round"
      />
    </svg>
  );
}

function Blob({ style }: { style: React.CSSProperties }) {
  return (
    <svg
      className="float-shape"
      style={style}
      width="90" height="90" viewBox="0 0 100 100" aria-hidden
    >
      <path
        d="M50 8 C 70 8, 92 24, 90 50 C 88 70, 70 92, 50 92 C 28 92, 12 72, 14 48 C 16 24, 30 8, 50 8 Z"
        fill="#A78BFA"
      />
    </svg>
  );
}
