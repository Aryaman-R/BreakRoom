import type { Metadata } from "next";
import { defaultRepo } from "@/lib/db";
import { MenuView } from "@/components/menu/MenuView";
import { PhotoGallery } from "@/components/ui/PhotoGallery";

const PRINTED_MENU = [
  { src: "/menu/printed-2.png", alt: "Printed menu — rice bowls, breakfast, bubble tea, and beverages.", w: 2000, h: 1545 },
  { src: "/menu/printed-1.png", alt: "Printed menu — sandwiches, sides, and specials.", w: 2000, h: 1545 }
  //{ src: "/photos/menu-board-1.jpg", alt: "In-store menu board — sandwiches, sides, beverages.", w: 640, h: 480 },
  //{ src: "/photos/menu-board-2.jpg", alt: "In-store menu board — specials, burgers, rice bowls.", w: 640, h: 480 },
  //{ src: "/photos/bubble-tea.jpg", alt: "Bubble tea flavors and toppings sign.", w: 480, h: 640, fit: "contain" as const },
];

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Sandwiches, rice bowls, wings & yakisoba, burgers, bubble tea, shakes, and coffee from The Breakroom.",
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
        <a
        href="#print_menu"
        className="inline-flex items-center mt-3 text-sm font-medium text-qh-accent hover:text-qh-ink transition-colors"
        >
        Quick View ↓
      </a>
      </header>
      <div className="hand-divider mt-10" />
       <section className="mt-12">
  <div className="flex items-center gap-2">
    <span className="text-qh-accent">✨</span>
    <h2 className="font-display text-2xl tracking-tight">
      New Additions
    </h2>
  </div>

  <p className="mt-2 text-qh-ink-soft max-w-xl">
    Fresh favorites we've recently added to the menu.
  </p>

  <div className="mt-8 grid gap-8 md:grid-cols-2">
    {/* Item 1 */}
    <article className="rounded-2xl border border-qh-line overflow-hidden bg-white">
      <img
        src="menu/butter_chicken.jpeg"
        alt="Butter Chicken Rice Bowl"
        className="aspect-[4/3] w-full object-cover"
      />

      <div className="p-5">
        <h3 className="font-display text-xl">Butter Chicken Bowl</h3>
        <p className="mt-2 text-qh-ink-soft">
          Rich, buttery tomato curry and chicken served with rice and fresh sides.
        </p>

        <p className="mt-4 font-semibold">$16.99</p>
      </div>
    </article>

    {/* Item 2 */}
    <article className="rounded-2xl border border-qh-line overflow-hidden bg-white">
      <img
        src="menu/chicken_wings.jpg"
        alt="Chicken Wings"
        className="aspect-[4/3] w-full object-cover object-top-left"
      />

      <div className="p-5">
        <h3 className="font-display text-xl">Chicken Wings</h3>
        <p className="mt-2 text-qh-ink-soft">
          Perfectly crispy wings with your pick of classic or signature sauces.
        </p>

        <p className="mt-4 font-semibold">$8.99</p>
      </div>
    </article>
  </div>
</section>
      <MenuView categories={categories} />
      

      <section className="mt-20">
        <h2 className="font-display text-3xl tracking-tightish" id = "print_menu">The full menu, in print</h2>
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
