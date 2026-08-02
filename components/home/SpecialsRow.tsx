"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import type { Special } from "@/lib/types";

export function SpecialsRow({ specials }: { specials: Special[] }) {
  return (
    <section className="container-page py-24">
      <Reveal>
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
              Today
            </p>
            <h2 className="mt-2 font-display tracking-tightish">
              Fresh New Additions
            </h2>
          </div>
          <p className="text-qh-ink-soft max-w-md">
            Recipes we’ve recently added to the menu.
          </p>
        </div>
        <div className="hand-divider mt-8" />
      </Reveal>

      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        {specials.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.08}>
            <SpecialCard special={s} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SpecialCard({ special }: { special: Special }) {
  return (
    <motion.article
      whileHover={{ rotate: 1.5, scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="bg-qh-bg-elevated border border-qh-line rounded-2xl p-6 shadow-soft hover:shadow-lifted transition-shadow h-full"
    >
      <div className="h-16 w-16 rounded-2xl bg-qh-accent-soft/30 flex items-center justify-center mb-4">
        <SpecialIcon kind={special.icon} />
      </div>
      <h3 className="font-display text-xl tracking-tightish">{special.name}</h3>
      <p className="mt-2 text-qh-ink-soft text-sm leading-relaxed">{special.description}</p>
      <p className="mt-4 font-mono text-sm text-qh-ink">${special.price.toFixed(2)}</p>
    </motion.article>
  );
}

function SpecialIcon({ kind }: { kind: Special["icon"] }) {
  const stroke = "var(--qh-accent)";
  if (kind === "cup")
    return (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
        <path d="M6 12 H22 V20 A6 6 0 0 1 16 26 H12 A6 6 0 0 1 6 20 Z" stroke={stroke} strokeWidth="1.6" />
        <path d="M22 14 H25 A3 3 0 0 1 28 17 V18 A3 3 0 0 1 25 21 H22" stroke={stroke} strokeWidth="1.6" />
        <path d="M11 6 q -2 2 0 4 q 2 2 0 4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (kind === "bowl")
    return (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
        <path d="M4 16 H30 A 13 11 0 0 1 4 16 Z" stroke={stroke} strokeWidth="1.6" />
        <path d="M10 8 q 2 -3 4 0" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 6 q 2 -3 4 0" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M5 28 V16 H29 V28 Z" stroke={stroke} strokeWidth="1.6" />
      <path d="M9 16 V12 A 8 8 0 0 1 25 12 V 16" stroke={stroke} strokeWidth="1.6" />
      <path d="M9 22 H29" stroke={stroke} strokeWidth="1.4" />
    </svg>
  );
}
