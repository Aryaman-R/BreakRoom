"use client";

import Image from "next/image";
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
            In the evening the kitchen stays on and the room opens up.
            Birthdays, showers, team dinners, private events — we host them here,
            and we cater too.
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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative aspect-[5/4] rounded-3xl overflow-hidden border border-white/10 shadow-lifted"
    >
      <Image
        src="/photos/dining.jpg"
        alt="The Breakroom dining room, set for an evening gathering."
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
      {/* Night + neon wash so the daytime photo reads as 'after hours'. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,39,27,0.20) 0%, rgba(22,39,27,0.55) 60%, rgba(22,39,27,0.88) 100%), radial-gradient(120% 80% at 50% 0%, rgba(255,159,69,0.38), rgba(255,77,158,0.14) 45%, transparent 72%)",
        }}
      />
    </motion.div>
  );
}
