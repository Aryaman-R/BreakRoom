"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatCents } from "@/lib/money";
import type { MenuItem, Variant } from "@/lib/types";

// Curated category order for the cafe's flow; anything new lands after,
// alphabetically.
const CATEGORY_ORDER = [
  "Sandwiches",
  "Rice Bowls",
  "Wings & Yakisoba",
  "Burgers",
  "Sides",
  "Bubble Tea",
  "Coffee & Espresso",
  "Tea",
];

function categoryRank(c: string): number {
  const i = CATEGORY_ORDER.indexOf(c);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

function priceLabel(item: MenuItem): string {
  const variants = (item.variants ?? []) as Variant[];
  if (variants.length > 0) {
    const prices = variants.map((v) => v.price_cents);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatCents(min) : `${formatCents(min)} – ${formatCents(max)}`;
  }
  return formatCents(item.price_cents);
}

/** DOM id for a category section — stable, and safe in a URL fragment. */
function sectionId(category: string): string {
  return `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function MenuList({
  menu,
  interactive,
  onPick,
}: {
  menu: MenuItem[];
  interactive: boolean;
  onPick: (item: MenuItem) => void;
}) {
  const categories = useMemo(
    () =>
      [...new Set(menu.map((m) => m.category))].sort(
        (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b)
      ),
    [menu]
  );

  const [active, setActive] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);

  // Which category is under the top of the screen. The bottom margin keeps
  // only the upper slice of the viewport in play, so the highlight tracks
  // what you're reading rather than whatever is tallest on screen.
  useEffect(() => {
    if (categories.length < 2) return;
    const sections = categories
      .map((c) => document.getElementById(sectionId(c)))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Topmost visible section wins.
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        );
        setActive(top.target.id);
      },
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  // Keep the active chip in view on a narrow rail, without scrolling the page.
  useEffect(() => {
    if (!active || !rail.current) return;
    const chip = rail.current.querySelector<HTMLElement>(`[data-for="${active}"]`);
    if (!chip) return;
    const railBox = rail.current.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    if (chipBox.left < railBox.left || chipBox.right > railBox.right) {
      rail.current.scrollTo({
        left: chip.offsetLeft - rail.current.clientWidth / 2 + chip.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [active]);

  if (menu.length === 0) {
    return (
      <p className="py-12 text-center text-qh-ink-soft">
        The menu is being set up — check back soon.
      </p>
    );
  }

  return (
    <>
      {categories.length > 1 ? (
        // Jump navigation. The Breakroom's menu runs eight categories deep,
        // which is a lot of thumb on a phone and a lot of reaching on a
        // kiosk — this is the difference between "scroll until you find the
        // bubble tea" and one tap.
        <nav
          aria-label="Menu categories"
          className="sticky top-0 z-30 -mx-5 mb-6 border-b border-qh-line bg-qh-bg/95 px-5 backdrop-blur"
        >
          <div
            ref={rail}
            className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => {
              const id = sectionId(category);
              return (
                <a
                  key={category}
                  href={`#${id}`}
                  data-for={id}
                  aria-current={active === id ? "true" : undefined}
                  className={clsx(
                    "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors",
                    active === id
                      ? "border-qh-sage bg-qh-sage text-white"
                      : "border-qh-line bg-qh-bg-elevated text-qh-ink-soft"
                  )}
                >
                  {category}
                </a>
              );
            })}
          </div>
        </nav>
      ) : null}

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category} id={sectionId(category)} className="scroll-mt-20">
            <h2 className="font-display text-xl tracking-tightish">{category}</h2>
            <div className="hand-divider mt-2" />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {menu
                .filter((m) => m.category === category)
                .map((item) => (
                  <li key={item.id}>
                    <button
                      disabled={!interactive}
                      onClick={() => onPick(item)}
                      className="card w-full px-4 py-3 text-left transition hover:shadow-lifted disabled:cursor-default disabled:hover:shadow-soft"
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="dotted-leader" aria-hidden="true" />
                        <span className="shrink-0 font-mono text-sm">
                          {priceLabel(item)}
                        </span>
                      </span>
                      {item.description ? (
                        <span className="mt-1 block text-sm text-qh-ink-soft">
                          {item.description}
                        </span>
                      ) : null}
                      {interactive ? (
                        <span className="mt-2 inline-block text-sm text-qh-accent">
                          {((item.variants ?? []) as Variant[]).length > 0
                            ? "Choose options →"
                            : "Add to order →"}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
