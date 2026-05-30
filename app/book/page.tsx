import type { Metadata } from "next";
import { Suspense } from "react";
import faqContent from "@/content/faq.json";
import { BookHero } from "@/components/booking/BookHero";
import { WhatYouCanDo } from "@/components/booking/WhatYouCanDo";
import { TheSpace } from "@/components/booking/TheSpace";
import { BookingForm } from "@/components/booking/BookingForm";
import { FaqAccordion } from "@/components/booking/FaqAccordion";
import { StickyJumpBar } from "@/components/booking/StickyJumpBar";

export const metadata: Metadata = {
  title: "Events & Catering",
  description:
    "Private events and catering at The Breakroom in Bothell — birthdays, showers, team gatherings, and more.",
};

export default function BookPage() {
  return (
    <>
      <BookHero />
      <WhatYouCanDo />
      <TheSpace />
      <section id="form" className="relative scroll-mt-24 py-24">
        <div className="container-page max-w-3xl">
          <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">
            The form
          </p>
          <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
            Tell us what you&#8217;re thinking.
          </h2>
          <p className="mt-4 text-ah-cream/80 max-w-xl">
            We&#8217;ll write back within a business day with a quote and the next steps.
            None of this is binding — it just gets the conversation started.
          </p>
          <div className="mt-10">
            <Suspense fallback={<FormFallback />}>
              <BookingForm />
            </Suspense>
          </div>
        </div>
      </section>
      <FaqAccordion items={faqContent.items} />
      <StickyJumpBar />
    </>
  );
}

function FormFallback() {
  return (
    <div className="rounded-3xl border border-ah-cream/15 bg-ah-bg-2/40 backdrop-blur-sm p-10 text-ah-cream/70">
      Loading the form…
    </div>
  );
}
