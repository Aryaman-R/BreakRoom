import type { Metadata } from "next";
import { defaultRepo } from "@/lib/db";
import { MenuView } from "@/components/menu/MenuView";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Coffee, tea, pastries, and lunch from The Break Room. Sourced honestly, made with care.",
};

export default async function MenuPage() {
  const categories = await defaultRepo.getMenu();
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">The menu</p>
        <h1 className="mt-3 font-display tracking-tighter2">
          What we&#8217;re pouring &amp; baking, today.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          Read it like a magazine, not a database. Allergens are marked. The specials change.
        </p>
      </header>
      <div className="hand-divider mt-10" />
      <MenuView categories={categories} />
    </div>
  );
}
