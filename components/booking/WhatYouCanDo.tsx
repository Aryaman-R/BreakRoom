"use client";

import { motion } from "framer-motion";

const CARDS = [
  { title: "Have the place to yourself", body: "Private use of the lounge for your gathering &mdash; about 24 seated or 40 standing, with our marble tables and soft sofas.", color: "#ff4d9e", text: "#16271b", tilt: -2 },
  { title: "Full menu, dialed in",        body: "Our whole comfort-food menu plus specialty coffee, bubble tea, and shakes &mdash; set up for your group.",               color: "#ff9f45", text: "#16271b", tilt: 2 },
  { title: "Catering, off-site",          body: "Hosting somewhere else? We&#8217;ll cater your office lunch, shower, or team dinner and bring the boba.",                      color: "#d7f25a", text: "#16271b", tilt: -1.5 },
  { title: "Set up your way",             body: "Flexible layouts and A/V for presentations &mdash; meetings, celebrations, or a quiet team dinner. Tell us what you need.",     color: "#6EE7B7", text: "#16271b", tilt: 1.5 },
];

export function WhatYouCanDo() {
  return (
    <section className="relative py-24">
      <div className="container-page">
        <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">What we can do for you</p>
        <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
          Dine in or let us cater.
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
