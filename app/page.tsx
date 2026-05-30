import { Hero } from "@/components/home/Hero";
import { WorkHoursSection } from "@/components/home/WorkHoursSection";
import { AfterHoursTransition } from "@/components/home/AfterHoursTransition";
import { SpecialsRow } from "@/components/home/SpecialsRow";
import { defaultRepo } from "@/lib/db";

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
