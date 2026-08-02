import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { WorkHoursSection } from "@/components/home/WorkHoursSection";
import { AfterHoursTransition } from "@/components/home/AfterHoursTransition";
import { SpecialsRow } from "@/components/home/SpecialsRow";
import { defaultRepo } from "@/lib/db";
import { BUSINESS, FULL_ADDRESS, hoursSummary } from "@/lib/business";

/**
 * The homepage exported no metadata at all, so it inherited the bare default
 * title and the words "cafe" and "coffee shop" appeared nowhere in its head —
 * on the one page most likely to rank for "cafe in Bothell".
 */
export const metadata: Metadata = {
  title: "The Breakroom — Cafe, Coffee & Boba in Bothell, WA",
  description: `${BUSINESS.description} Find us at ${FULL_ADDRESS}. Open ${hoursSummary()}.`,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const specials = await defaultRepo.getSpecials();

  return (
    <>
      <Hero />
      <WorkHoursSection />
      <AfterHoursTransition />
      <SpecialsRow specials={specials} />
    </>
  );
}
