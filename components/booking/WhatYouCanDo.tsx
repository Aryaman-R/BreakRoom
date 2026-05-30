"use client";

import { motion } from "framer-motion";

const CARDS = [
  { title: "Birthday parties",         body: "Cake, candles, the works. We&#8217;ll dim the lights at the right moment.",                color: "#ff4d9e", text: "#16271b", tilt: -2 },
  { title: "Team offsites",            body: "Better than a hotel ballroom. Quieter than a karaoke bar.",                                color: "#ff9f45", text: "#16271b", tilt: 2 },
  { title: "Showers &amp; celebrations", body: "Baby, bridal, graduation, divorce — we don&#8217;t judge, we host.",                       color: "#d7f25a", text: "#16271b", tilt: -1.5 },
  { title: "Whatever you can imagine", body: "Listening parties, board game nights, midnight book clubs. Tell us.",                       color: "#6EE7B7", text: "#16271b", tilt: 1.5 },
];

export function WhatYouCanDo() {
  return (
    <section className="relative py-24">
      <div className="container-page">
        <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">What you can do here</p>
        <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
          Pick your shape of fun.
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARDS.map((card) => (
            <motion.article
              key={card.title}
              initial={{ rotate: card.tilt, scale: 0.96, opacity: 0 }}
              whileInView={{ rotate: card.tilt, scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
              style={{ background: card.color, color: card.text }}
              className="rounded-3xl p-6 min-h-56 flex flex-col justify-between gap-4 shadow-lifted"
            >
              <h3
                className="font-display text-xl tracking-tightish"
                dangerouslySetInnerHTML={{ __html: card.title }}
              />
              <p
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: card.body }}
              />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
