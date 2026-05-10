"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import clsx from "clsx";
import type { MenuCategory, MenuItem } from "@/lib/types";

type Filter = "all" | "V" | "GF" | "DF" | "under10";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",     label: "Everything" },
  { id: "V",       label: "Vegan" },
  { id: "GF",      label: "Gluten-free" },
  { id: "DF",      label: "Dairy-free" },
  { id: "under10", label: "Under $10" },
];

export function MenuView({ categories }: { categories: MenuCategory[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo<MenuCategory[]>(() => {
    if (filter === "all") return categories;
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => {
          if (filter === "under10") return i.price < 10;
          return i.tags.includes(filter as never);
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [filter, categories]);

  return (
    <div className="mt-10 grid lg:grid-cols-12 gap-10">
      <aside className="lg:col-span-3">
        <div className="lg:sticky lg:top-24 space-y-6">
          <CategoryNav categories={filtered} />
          <FilterToggle value={filter} onChange={setFilter} />
          <Allergens />
        </div>
      </aside>

      <div className="lg:col-span-9">
        <LayoutGroup id="menu-items">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((cat) => (
              <motion.section
                layout
                key={cat.id}
                id={`cat-${cat.id}`}
                className={clsx(
                  "scroll-mt-28 mb-16",
                  cat.id === "specials" &&
                    "border border-dashed border-qh-accent rounded-2xl p-6 -mx-6"
                )}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <header className="mb-6">
                  <h2 className="font-display text-3xl tracking-tightish">
                    {cat.id === "specials" ? <span className="italic">{cat.name}</span> : cat.name}
                  </h2>
                  <p className="mt-1 text-qh-ink-soft text-sm">{cat.blurb}</p>
                </header>
                <ul className="space-y-5">
                  {cat.items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </LayoutGroup>

        {filtered.length === 0 && (
          <p className="text-qh-ink-soft italic">
            Nothing on the menu fits that filter — try a different one.
          </p>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-[1fr_auto] gap-x-4"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-lg leading-tight">
            <span dangerouslySetInnerHTML={{ __html: item.name }} />
          </h3>
          <span className="dotted-leader" />
          <span className="font-mono text-sm text-qh-ink whitespace-nowrap">
            ${item.price.toFixed(2)}
          </span>
          <AllergenIcons tags={item.tags} />
        </div>
        {item.description && (
          <p
            className="mt-1 text-sm text-qh-ink-soft"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        )}
      </div>
    </motion.li>
  );
}

function CategoryNav({ categories }: { categories: MenuCategory[] }) {
  return (
    <nav>
      <p className="text-xs uppercase tracking-[0.18em] text-qh-ink-soft mb-3">
        Sections
      </p>
      <ul className="space-y-1.5 text-sm">
        {categories.map((c) => (
          <li key={c.id}>
            <a
              href={`#cat-${c.id}`}
              className="text-qh-ink hover:text-qh-accent transition-colors"
            >
              {c.id === "specials" ? <em>{c.name}</em> : c.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FilterToggle({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-qh-ink-soft mb-3">
        Show me only
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = value === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={clsx(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                active
                  ? "bg-qh-ink text-qh-bg border-qh-ink"
                  : "border-qh-line text-qh-ink-soft hover:text-qh-ink"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ALLERGEN_LABEL: Record<string, string> = {
  V: "Vegetarian",
  GF: "Gluten-free",
  DF: "Dairy-free",
  N: "Contains nuts",
};

function AllergenIcons({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <span className="ml-2 inline-flex gap-1">
      {tags.map((t) => (
        <abbr
          key={t}
          title={ALLERGEN_LABEL[t] ?? t}
          className="no-underline inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border border-qh-line text-[10px] font-mono text-qh-ink-soft"
        >
          {t}
        </abbr>
      ))}
    </span>
  );
}

function Allergens() {
  return (
    <div className="text-xs text-qh-ink-soft border-t border-qh-line pt-4">
      <p className="uppercase tracking-[0.18em] mb-2">Key</p>
      <ul className="space-y-1">
        <li><span className="font-mono text-qh-ink">V</span> — Vegetarian</li>
        <li><span className="font-mono text-qh-ink">GF</span> — Gluten-free</li>
        <li><span className="font-mono text-qh-ink">DF</span> — Dairy-free</li>
        <li><span className="font-mono text-qh-ink">N</span> — Contains nuts</li>
      </ul>
    </div>
  );
}
