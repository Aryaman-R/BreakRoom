"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

export function WorkHoursSection() {
  return (
    <section className="container-page py-24 grid lg:grid-cols-12 gap-12 items-center">
      <Reveal className="lg:col-span-5">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          During work hours
        </p>
        <h2 className="mt-3 font-display tracking-tightish">
          A quiet desk you don&#8217;t have to set up.
        </h2>
        <p className="mt-5 text-qh-ink-soft text-lg leading-relaxed">
          Fast Wi-Fi, real outlets, soft lighting, and music low enough to think
          over. We pour real coffee, refill your water without asking, and we&#8217;ll
          let you have the corner table for as long as you need it.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-y-2 text-sm text-qh-ink">
          <li>· Free Wi-Fi (we tested it)</li>
          <li>· Outlets at every seat</li>
          <li>· Phone-call booth in back</li>
          <li>· No laptop guilt</li>
        </ul>
      </Reveal>

      <Reveal delay={0.15} className="lg:col-span-7 relative">
        <div className="aspect-[5/4] rounded-3xl overflow-hidden shadow-soft border border-qh-line bg-qh-bg-elevated">
          <DaytimeIllustration />
        </div>
        <LiveStatusCard />
      </Reveal>
    </section>
  );
}

function LiveStatusCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="absolute -bottom-6 left-3 right-3 sm:left-6 sm:right-auto bg-qh-bg-elevated border border-qh-line rounded-2xl shadow-lifted p-4 sm:max-w-[280px]"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-qh-sage animate-pulse" aria-hidden />
        <span className="font-medium text-qh-ink">Open now</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-qh-ink-soft">Wi-Fi</dt>
        <dd className="font-mono text-qh-ink">fast</dd>
        <dt className="text-qh-ink-soft">Seats</dt>
        <dd className="font-mono text-qh-ink">~12 free</dd>
        <dt className="text-qh-ink-soft">Music</dt>
        <dd className="font-mono text-qh-ink">low</dd>
      </dl>
    </motion.div>
  );
}

function DaytimeIllustration() {
  return (
    <svg viewBox="0 0 600 480" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="dwall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#eaf1dc" />
          <stop offset="100%" stopColor="#d8e6bc" />
        </linearGradient>
      </defs>
      <rect width="600" height="320" fill="url(#dwall)" />
      <rect y="320" width="600" height="160" fill="#4e6b42" />
      {/* Window */}
      <rect x="60" y="40" width="220" height="180" fill="#eff6e2" stroke="#20271e" strokeWidth="3" />
      <line x1="170" y1="40" x2="170" y2="220" stroke="#20271e" strokeWidth="3" />
      <line x1="60" y1="130" x2="280" y2="130" stroke="#20271e" strokeWidth="3" />
      {/* Plant */}
      <ellipse cx="500" cy="320" rx="40" ry="14" fill="#20271e" />
      <path d="M500 320 C 460 240, 470 180, 510 200" stroke="#3c6b4a" strokeWidth="6" fill="none" />
      <path d="M500 320 C 540 240, 530 180, 490 200" stroke="#3c6b4a" strokeWidth="6" fill="none" />
      {/* Laptop */}
      <g transform="translate(180 320)">
        <rect x="-6" y="-72" width="200" height="120" rx="6" fill="#20271e" />
        <rect x="0" y="-66" width="188" height="108" fill="#f5f9ec" />
        <rect x="14" y="-58" width="160" height="6" rx="2" fill="#c2d0a8" />
        <rect x="14" y="-46" width="100" height="4" rx="2" fill="#c2d0a8" opacity="0.7" />
        <rect x="-20" y="48" width="228" height="10" rx="3" fill="#1A1410" />
      </g>
      {/* Latte */}
      <g transform="translate(440 360)">
        <ellipse cx="0" cy="0" rx="40" ry="10" fill="#20271e" />
        <path d="M-40 0 v 50 a 40 12 0 0 0 80 0 V 0 Z" fill="#f5f9ec" stroke="#20271e" strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="34" ry="8" fill="#8aa178" />
        <path d="M-12 -2 q 12 -10 24 0" stroke="#f5f9ec" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
