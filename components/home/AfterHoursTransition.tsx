"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookPartyButton } from "@/components/BookPartyButton";

/**
 * The visual bridge from Quiet Hours → After Hours.
 * Background interpolates between the two palettes as the section scrolls into
 * view. The headline & subhead recolor along with it.
 */
export function AfterHoursTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bg = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 1],
    ["#eaf1dc", "#244430", "#16271b", "#16271b"]
  );
  const ink = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    ["#20271e", "#eff6e2", "#eff6e2"]
  );

  return (
    <motion.section
      ref={ref}
      style={{ backgroundColor: bg, color: ink }}
      className="relative my-12 overflow-hidden"
    >
      {/* Sentinel: marks the dark portion of the section. When this crosses
          into the nav strip, the nav switches to light-on-dark colors.
          Positioned where the gradient has finished transitioning so the nav
          doesn't flip prematurely while the background is still cream. */}
      <span
        data-nav-backdrop="dark"
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0"
        style={{ top: "40%", bottom: "10%" }}
      />
      {/* Decorative blobs that show up only as we shift into Mode B */}
      <Blobs progress={scrollYProgress} />

      <div className="container-page py-32 grid lg:grid-cols-12 gap-10 items-center relative z-[2]">
        <div className="lg:col-span-6">
          <motion.p
            style={{ color: ink }}
            className="text-sm uppercase tracking-[0.18em] opacity-70"
          >
            After hours
          </motion.p>
          <motion.h2
            style={{ color: ink }}
            className="mt-3 font-display tracking-tighter2"
          >
            And then, a switch flips.
          </motion.h2>
          <motion.p
            style={{ color: ink }}
            className="mt-5 max-w-lg text-lg opacity-90"
          >
            Lights warm up, the room rearranges, the playlist gets a personality.
            Birthdays, showers, team nights, trivia — whatever you&#8217;re bringing,
            we know how to dress for it.
          </motion.p>
          <div className="mt-8">
            <BookPartyButton size="lg" />
          </div>
        </div>

        <div className="lg:col-span-6">
          <NightIllustration />
        </div>
      </div>
    </motion.section>
  );
}

function Blobs({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const opacity = useTransform(progress, [0.3, 0.7], [0, 0.7]);
  return (
    <>
      <motion.div
        style={{ opacity }}
        aria-hidden
        className="absolute -top-20 -left-10 w-[420px] h-[420px] rounded-full blur-3xl"
      >
        <div className="w-full h-full bg-ah-magenta/40 rounded-full" />
      </motion.div>
      <motion.div
        style={{ opacity }}
        aria-hidden
        className="absolute top-40 right-0 w-[480px] h-[480px] rounded-full blur-3xl"
      >
        <div className="w-full h-full bg-ah-tangerine/30 rounded-full" />
      </motion.div>
      <motion.div
        style={{ opacity }}
        aria-hidden
        className="absolute -bottom-20 left-1/3 w-[360px] h-[360px] rounded-full blur-3xl"
      >
        <div className="w-full h-full bg-ah-violet/40 rounded-full" />
      </motion.div>
    </>
  );
}

function NightIllustration() {
  return (
    <div className="aspect-[5/4] rounded-3xl overflow-hidden border border-white/10 shadow-lifted">
      <svg viewBox="0 0 600 480" className="w-full h-full" aria-hidden>
        <defs>
          <radialGradient id="glow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ff9f45" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#ff4d9e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#16271b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="600" height="480" fill="#16271b" />
        <rect width="600" height="480" fill="url(#glow)" />
        {/* String lights */}
        <g stroke="#d7f25a" strokeWidth="2" fill="#d7f25a">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 30 + i * 40;
            const y = 60 + Math.sin(i * 0.6) * 12;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" />
                <circle cx={x} cy={y} r="11" fill="#d7f25a" opacity="0.18" />
              </g>
            );
          })}
        </g>
        {/* Confetti specks */}
        {Array.from({ length: 40 }).map((_, i) => {
          const colors = ["#ff4d9e", "#ff9f45", "#d7f25a", "#6EE7B7", "#A78BFA"];
          return (
            <rect
              key={i}
              x={(i * 73) % 580 + 10}
              y={120 + ((i * 41) % 320)}
              width="6"
              height="14"
              transform={`rotate(${i * 23} ${(i * 73) % 580 + 13} ${120 + ((i * 41) % 320) + 7})`}
              fill={colors[i % colors.length]}
              opacity="0.85"
            />
          );
        })}
        {/* Disco silhouette */}
        <circle cx="300" cy="270" r="64" fill="#A78BFA" opacity="0.4" />
        <g stroke="#d7f25a" strokeWidth="1" opacity="0.7">
          <line x1="240" y1="270" x2="200" y2="270" />
          <line x1="360" y1="270" x2="400" y2="270" />
          <line x1="300" y1="210" x2="300" y2="170" />
          <line x1="300" y1="330" x2="300" y2="370" />
        </g>
      </svg>
    </div>
  );
}
