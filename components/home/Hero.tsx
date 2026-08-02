"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Fragment, useRef } from "react";
import { BookPartyButton } from "@/components/BookPartyButton";
import { ORDER_AHEAD_URL } from "@/lib/business";


const HEADLINE = "Coffee, boba, and good food — all day.";

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
      <div className="container-page grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-6 relative z-[2]">
          {/* The words are separated by real space text nodes rather than by an
              `mr-` gap, and there is no sr-only duplicate. Previously the h1's
              text content read "Coffee, boba, and good food — all day." followed
              immediately by "Coffee,boba,andgoodfood—allday." — the sr-only copy
              plus the visible words, which carried no whitespace between them.
              That concatenation is what a crawler indexed as the page's H1. */}
          <h1 className="font-display tracking-tighter2 text-qh-ink">
            {words.map((w, i) => {
              const italic = i === 3;
              return (
                <Fragment key={i}>
                  <span
                    // padding + negative margin gives the overflow-hidden box
                    // breathing room on both sides so italic letterforms don't
                    // clip on the left edge, without changing visible spacing.
                    className="inline-block overflow-hidden align-bottom px-[0.12em] -mx-[0.12em] pb-[0.05em]"
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
                  {i < words.length - 1 ? " " : null}
                </Fragment>
              );
            })}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-6 max-w-md text-qh-ink-soft text-lg"
          >
            By day it’s coffee, bubble tea, and Asian-American comfort food.
            In the evening the room opens up for dinners, gatherings, and private events.
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

            {/* The homepage's only ordering CTA used to be `hidden sm:inline-flex`
                — invisible on phones, which is most of the traffic for a cafe —
                and it pointed at DoorDash rather than the cafe's own app, so
                every order it won paid a commission. Now it is visible at every
                width and goes to the order-ahead app first. */}
            <Link
              href={ORDER_AHEAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-full text-sm font-medium transition-colors bg-qh-accent text-white hover:bg-qh-accent/90"
            >
              Order ahead ↗
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
          <Image
            src="/photos/lounge.jpg"
            alt="The lounge at The Breakroom — soft grey sofas, plants, and big windows letting in morning light."
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
}
