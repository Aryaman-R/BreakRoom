"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Sheet } from "./Sheet";
import { unitPrice, type CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import type { Addon, MenuItem, Variant } from "@/lib/types";

export function ItemSheet({
  item,
  maxQty,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  maxQty: number;
  onAdd: (line: CartLine) => void;
  onClose: () => void;
}) {
  const variants = useMemo(() => (item.variants ?? []) as Variant[], [item]);
  const addons = useMemo(() => (item.addons ?? []) as Addon[], [item]);

  const [variantLabel, setVariantLabel] = useState<string | null>(null);
  const [addonLabels, setAddonLabels] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const needsVariant = variants.length > 0 && variantLabel === null;
  const unit = unitPrice(item, variantLabel, addonLabels);

  const toggleAddon = (label: string) =>
    setAddonLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const add = () => {
    if (needsVariant) return;
    onAdd({
      menu_item_id: item.id,
      item_name: item.name,
      variant_label: variantLabel,
      addon_labels: addonLabels,
      unit_cents: unit,
      quantity,
      notes: notes.trim(),
    });
  };

  return (
    <Sheet title={item.name} onClose={onClose}>
      {item.description ? (
        <p className="text-sm text-qh-ink-soft">{item.description}</p>
      ) : null}

      {variants.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">
            Choose one <span className="text-qh-accent">*</span>
          </legend>
          <div className="mt-2 space-y-2">
            {variants.map((v) => (
              <label
                key={v.label}
                className={clsx(
                  "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2.5",
                  variantLabel === v.label
                    ? "border-qh-sage bg-qh-sage/10"
                    : "border-qh-line hover:border-qh-ink-soft"
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="variant"
                    checked={variantLabel === v.label}
                    onChange={() => setVariantLabel(v.label)}
                    className="accent-[var(--qh-sage)]"
                  />
                  {v.label}
                </span>
                <span className="font-mono text-sm">{formatCents(v.price_cents)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {addons.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Add-ons</legend>
          <div className="mt-2 space-y-2">
            {addons.map((a) => (
              <label
                key={a.label}
                className={clsx(
                  "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2.5",
                  addonLabels.includes(a.label)
                    ? "border-qh-sage bg-qh-sage/10"
                    : "border-qh-line hover:border-qh-ink-soft"
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={addonLabels.includes(a.label)}
                    onChange={() => toggleAddon(a.label)}
                    className="accent-[var(--qh-sage)]"
                  />
                  {a.label}
                </span>
                <span className="font-mono text-sm">+{formatCents(a.price_cents)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-4">
        <label htmlFor="item-notes" className="text-sm font-medium">
          Notes for the kitchen
        </label>
        {item.notes_prompt ? (
          <p className="mt-1 text-sm text-qh-ink-soft">{item.notes_prompt}</p>
        ) : null}
        <textarea
          id="item-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Anything else?"
          className="field mt-2"
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3" aria-label="Quantity">
          <button
            className="btn btn-quiet h-11 w-11 !rounded-full !p-0 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Fewer"
          >
            −
          </button>
          <span className="w-6 text-center font-mono">{quantity}</span>
          <button
            className="btn btn-quiet h-11 w-11 !rounded-full !p-0 text-lg"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="More"
          >
            +
          </button>
        </div>
        <button className="btn btn-primary btn-md" disabled={needsVariant} onClick={add}>
          {needsVariant ? "Pick an option first" : `Add · ${formatCents(unit * quantity)}`}
        </button>
      </div>
      {quantity === maxQty ? (
        <p className="mt-2 text-right text-xs text-qh-ink-soft">
          Max {maxQty} per item for online orders.
        </p>
      ) : null}
    </Sheet>
  );
}
