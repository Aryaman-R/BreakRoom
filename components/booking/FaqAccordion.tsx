"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Item {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24">
      <div className="container-page max-w-3xl">
        <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">FAQ</p>
        <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
          Things people ask.
        </h2>

        <ul className="mt-10 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={i}
                className="rounded-2xl border border-ah-cream/15 bg-ah-bg-2/40 backdrop-blur-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display text-lg text-ah-cream">
                    <span dangerouslySetInnerHTML={{ __html: item.q }} />
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ah-electric text-ah-bg font-display"
                    aria-hidden
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <p
                        className="px-5 pb-5 text-ah-cream/85 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: item.a }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
