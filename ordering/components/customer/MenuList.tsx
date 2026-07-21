"use client";

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

export function MenuList({
  menu,
  interactive,
  onPick,
}: {
  menu: MenuItem[];
  interactive: boolean;
  onPick: (item: MenuItem) => void;
}) {
  const categories = [...new Set(menu.map((m) => m.category))].sort(
    (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b)
  );

  if (menu.length === 0) {
    return (
      <p className="py-12 text-center text-qh-ink-soft">
        The menu is being set up — check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category}>
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
  );
}
