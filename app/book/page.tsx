import type { Metadata } from "next";
import faqContent from "@/content/faq.json";
import { BookHero } from "@/components/booking/BookHero";
import { WhatYouCanDo } from "@/components/booking/WhatYouCanDo";
import { TheSpace } from "@/components/booking/TheSpace";
import { GoogleFormEmbed } from "@/components/booking/GoogleFormEmbed";
import { FaqAccordion } from "@/components/booking/FaqAccordion";
import { StickyJumpBar } from "@/components/booking/StickyJumpBar";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Events & Catering",
  description:
    "Private events and catering at The Breakroom in Bothell — birthdays, showers, team gatherings, and more.",
};

export default function BookPage() {
  return (
    <>
      <BookHero />
      <section id="form" className="relative scroll-mt-24 pt-8 pb-16">
        <div className="container-page max-w-3xl">
          <Reveal>
            <GoogleFormEmbed
              src="https://docs.google.com/forms/d/e/1FAIpQLSeIfi6i39cW6kjEmB-LtEBoHJljz-mjNH-bCb4QGlIDfrWTZQ/viewform?embedded=true"
              title="The Breakroom — events & catering inquiry form"
              label="Events & catering"
              heightClass="h-[2050px] sm:h-[1450px]"
              variant="after-hours"
            />
          </Reveal>
        </div>
      </section>
      <WhatYouCanDo />
      <TheSpace />
      <FaqAccordion items={faqContent.items} />
      <StickyJumpBar />
    </>
  );
}
