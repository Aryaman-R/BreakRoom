"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BookPartyButton } from "@/components/BookPartyButton";

const HEADLINE = "Somewhere between the office and home.";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax: image moves at 0.85x scroll speed (i.e., translates 15% of scroll)
  const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  const words = HEADLINE.split(" ");

  return (
    <section ref={ref} className="relative pt-10 sm:pt-16 pb-24">
      <div className="container-page grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        <div className="lg:col-span-6 relative z-[2]">
          <h1 className="font-display tracking-tighter2 text-qh-ink">
            <span className="sr-only">{HEADLINE}</span>
            {words.map((w, i) => {
              const italic = i === 4;
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  // padding + negative margin gives the overflow-hidden box
                  // breathing room on both sides so italic letterforms don't
                  // clip on the left edge, without changing visible spacing.
                  className="inline-block overflow-hidden align-bottom mr-[0.18em] px-[0.12em] -mx-[0.12em] pb-[0.05em]"
                >
                  <motion.span
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      delay: 0.05 * i,
                      duration: 0.7,
                      ease: [0.2, 0.7, 0.2, 1],
                    }}
                    className={`inline-block ${italic ? "italic text-qh-accent" : ""}`}
                  >
                    {w}
                  </motion.span>
                </span>
              );
            })}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-6 max-w-md text-qh-ink-soft text-lg"
          >
            By day a quiet workspace, by night a colorful event space.
            Same room, different lighting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="mt-8 flex items-center gap-4 flex-wrap"
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-qh-ink text-qh-ink hover:bg-qh-ink hover:text-qh-bg transition-colors text-sm"
            >
              See the menu
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7 H11 M8 4 L11 7 L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <BookPartyButton size="md" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          style={{ y: yImage }}
          className="lg:col-span-6 relative aspect-[4/5] rounded-3xl overflow-hidden shadow-soft border border-qh-line"
        >
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * SVG illustration in lieu of a real photo. Warm morning palette.
 * Replace with a real `next/image` of the cafe when photography lands.
 */
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 800 1000"
      className="w-full h-full block"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FBE6CC" />
          <stop offset="60%" stopColor="#F4D6B5" />
          <stop offset="100%" stopColor="#E8BD93" />
        </linearGradient>
        <linearGradient id="table" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9C7A55" />
          <stop offset="100%" stopColor="#6E4E32" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#sky)" />
      {/* Window light streaks */}
      <g opacity="0.45">
        <polygon points="0,0 320,0 80,1000 -240,1000" fill="#FFF1D8" />
        <polygon points="380,0 460,0 240,1000 140,1000" fill="#FFEAC4" />
      </g>
      {/* Table */}
      <rect x="0" y="640" width="800" height="360" fill="url(#table)" />
      <rect x="0" y="640" width="800" height="6" fill="#3F2A18" opacity="0.5" />
      {/* Notebook */}
      <g transform="translate(120 660)">
        <rect width="320" height="240" rx="8" fill="#FFF8E7" stroke="#3F2A18" strokeWidth="2" />
        <line x1="20" y1="40" x2="300" y2="40" stroke="#C9A57B" strokeWidth="1" />
        <line x1="20" y1="80" x2="300" y2="80" stroke="#C9A57B" strokeWidth="1" />
        <line x1="20" y1="120" x2="300" y2="120" stroke="#C9A57B" strokeWidth="1" />
        <line x1="20" y1="160" x2="220" y2="160" stroke="#C9A57B" strokeWidth="1" />
        <path d="M20 200 q 40 -8 80 0 t 80 0" stroke="#2A2520" fill="none" strokeWidth="1.5" />
      </g>
      {/* Coffee cup */}
      <g transform="translate(520 700)">
        <ellipse cx="80" cy="20" rx="80" ry="20" fill="#3F2A18" />
        <path d="M0 20 v 130 a 80 24 0 0 0 160 0 V 20 Z" fill="#FBF7F0" stroke="#3F2A18" strokeWidth="3" />
        <path d="M160 50 q 40 0 40 40 t -40 40" fill="none" stroke="#FBF7F0" strokeWidth="10" />
        <path d="M160 50 q 40 0 40 40 t -40 40" fill="none" stroke="#3F2A18" strokeWidth="3" />
        <ellipse cx="80" cy="22" rx="68" ry="14" fill="#5C3A1F" />
        <ellipse cx="80" cy="22" rx="40" ry="6" fill="#B58A6A" opacity="0.6" />
      </g>
      {/* Steam */}
      <g opacity="0.5" stroke="#FBF7F0" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M580 690 q 6 -20 -4 -36 q -10 -16 4 -32" />
        <path d="M610 690 q 6 -16 -4 -32 q -10 -16 4 -32" />
      </g>
    </svg>
  );
}
