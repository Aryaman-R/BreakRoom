import type { Metadata } from "next";
import { defaultRepo } from "@/lib/db";
import { MenuView } from "@/components/menu/MenuView";
import { PhotoGallery } from "@/components/ui/PhotoGallery";

const PRINTED_MENU = [
  { src: "/menu/printed-1.png", alt: "Printed menu — sandwiches, sides, and specials.", w: 2000, h: 1545 },
  { src: "/menu/printed-2.png", alt: "Printed menu — rice bowls, breakfast, bubble tea, and beverages.", w: 2000, h: 1545 },
  { src: "/photos/menu-board-1.jpg", alt: "In-store menu board — sandwiches, sides, beverages.", w: 640, h: 480 },
  { src: "/photos/menu-board-2.jpg", alt: "In-store menu board — specials, burgers, rice bowls.", w: 640, h: 480 },
  { src: "/photos/bubble-tea.jpg", alt: "Bubble tea flavors and toppings sign.", w: 480, h: 640, fit: "contain" as const },
];

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Sandwiches, rice bowls, wings & yakisoba, burgers, bubble tea, shakes, and coffee from The Break Room.",
};

export default async function MenuPage() {
  const categories = await defaultRepo.getMenu();
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">The menu</p>
        <h1 className="mt-3 font-display tracking-tighter2">
          What we&#8217;re cooking &amp; pouring, today.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          Sandwiches to rice bowls, wings to bubble tea. Read it like a magazine, not a database &mdash; allergens are marked.
        </p>
      </header>
      <div className="hand-divider mt-10" />
      <MenuView categories={categories} />

      <section className="mt-20">
        <h2 className="font-display text-3xl tracking-tightish">The full menu, in print</h2>
        <p className="mt-2 text-qh-ink-soft max-w-2xl">
          Photos of our in-store menu boards and the printed takeaway card. Tap any to enlarge.
        </p>
        <div className="mt-8">
          <PhotoGallery photos={PRINTED_MENU} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" />
        </div>
      </section>
    </div>
  );
}
