"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { hoursSummary } from "@/lib/business";
import { useOpenState } from "@/components/ui/useLiveClock";

export function WorkHoursSection() {
  return (
    <section className="container-page py-24 grid lg:grid-cols-12 gap-12 items-center">
      <Reveal className="lg:col-span-5">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          Drop in
        </p>
        <h2 className="mt-3 font-display tracking-tightish">
          A comfortable place to post up.
        </h2>
        <p className="mt-5 text-qh-ink-soft text-lg leading-relaxed">
          Soft sofas, marble tables, big windows, and free Wi-Fi. Settle in with a
          latte, a bubble tea, or a full plate — and stay as long as you like.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-y-2 text-sm text-qh-ink">
          <li>· Free Wi-Fi</li>
          <li>· Comfy lounge seating</li>
          <li>· Coffee, boba &amp; shakes</li>
          <li>· {hoursSummary()}</li>
        </ul>
      </Reveal>

      <Reveal delay={0.15} className="lg:col-span-7 relative">
        <div className="relative aspect-[5/4] rounded-3xl overflow-hidden shadow-soft border border-qh-line bg-qh-bg-elevated">
          <Image
            src="/photos/lounge-wide.jpg"
            alt="The lounge at The Breakroom — soft sofas, marble tables, and big windows."
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover"
          />
        </div>
        <LiveStatusCard />
      </Reveal>
    </section>
  );
}

/**
 * The card used to be a hard-coded "Open now" with a pulsing green dot and a
 * "Kitchen: open" row — displayed at 3 AM on a Sunday just as confidently as
 * at noon on a Tuesday. It now reflects the real clock in the cafe's timezone,
 * and renders nothing at all until it knows, so a static build never ships a
 * claim it cannot back up.
 */
function LiveStatusCard() {
  const status = useOpenState();
  const reduceMotion = useReducedMotion();

  if (!status) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="absolute -bottom-6 left-3 right-3 sm:left-6 sm:right-auto bg-qh-bg-elevated border border-qh-line rounded-2xl shadow-lifted p-4 sm:max-w-[280px]"
    >
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status.isOpen
              ? "bg-qh-sage motion-safe:animate-pulse"
              : "bg-qh-ink-soft"
          }`}
          aria-hidden
        />
        <span className="font-medium text-qh-ink">
          {status.isOpen ? "Open now" : "Closed"}
        </span>
      </div>
      <p className="mt-1 text-xs text-qh-ink-soft">{status.label}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-qh-ink-soft">Coffee</dt>
        <dd className="font-mono text-qh-ink">{status.isOpen ? "on" : "—"}</dd>
        <dt className="text-qh-ink-soft">Boba</dt>
        <dd className="font-mono text-qh-ink">{status.isOpen ? "yes" : "—"}</dd>
        <dt className="text-qh-ink-soft">Kitchen</dt>
        <dd className="font-mono text-qh-ink">
          {status.isOpen ? "open" : "closed"}
        </dd>
      </dl>
    </motion.div>
  );
}
