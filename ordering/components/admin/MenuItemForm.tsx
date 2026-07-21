"use client";

import { useState } from "react";
import { Sheet } from "@/components/customer/Sheet";
import { fromRows, OptionListEditor, toRows, type OptionRow } from "./OptionListEditor";
import type { MenuItem, Variant } from "@/lib/types";

export type MenuItemDraft = {
  name: string;
  description: string;
  price_cents: number;
  category: string;
  variants: Variant[] | null;
  addons: Variant[] | null;
  notes_prompt: string;
  available: boolean;
  sort_order: number;
};

export function MenuItemForm({
  item,
  categories,
  onSave,
  onClose,
  saving,
  error,
}: {
  item: MenuItem | null; // null = create
  categories: string[];
  onSave: (draft: MenuItemDraft) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [dollars, setDollars] = useState(((item?.price_cents ?? 0) / 100).toFixed(2));
  const [category, setCategory] = useState(item?.category ?? categories[0] ?? "Other");
  const [variantRows, setVariantRows] = useState<OptionRow[]>(
    toRows((item?.variants ?? null) as Variant[] | null)
  );
  const [addonRows, setAddonRows] = useState<OptionRow[]>(
    toRows((item?.addons ?? null) as Variant[] | null)
  );
  const [notesPrompt, setNotesPrompt] = useState(item?.notes_prompt ?? "");
  const [available, setAvailable] = useState(item?.available ?? true);
  const [sortOrder, setSortOrder] = useState(String(item?.sort_order ?? 0));

  const save = () => {
    onSave({
      name: name.trim(),
      description: description.trim(),
      price_cents: Math.max(0, Math.round(parseFloat(dollars || "0") * 100) || 0),
      category: category.trim() || "Other",
      variants: fromRows(variantRows),
      addons: fromRows(addonRows),
      notes_prompt: notesPrompt.trim(),
      available,
      sort_order: Math.max(0, parseInt(sortOrder, 10) || 0),
    });
  };

  return (
    <Sheet title={item ? `Edit: ${item.name}` : "New menu item"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="mi-name">
            Name
          </label>
          <input
            id="mi-name"
            className="field mt-1"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="mi-price">
              Base price
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-qh-ink-soft">
                $
              </span>
              <input
                id="mi-price"
                className="field pl-7 text-right font-mono"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-qh-ink-soft">
              Ignored at checkout when variants exist — variants set the price.
            </p>
          </div>
          <div className="w-28">
            <label className="text-sm font-medium" htmlFor="mi-sort">
              Sort order
            </label>
            <input
              id="mi-sort"
              className="field mt-1 text-right font-mono"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="mi-category">
            Category
          </label>
          <input
            id="mi-category"
            className="field mt-1"
            list="mi-categories"
            value={category}
            maxLength={60}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="mi-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="mi-desc">
            Description <span className="font-normal text-qh-ink-soft">(optional)</span>
          </label>
          <textarea
            id="mi-desc"
            className="field mt-1"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <OptionListEditor
          legend="Variants"
          hint="A required single choice that sets the price — wing count, size, protein. Leave empty if the item has one price."
          rows={variantRows}
          onChange={setVariantRows}
        />

        <OptionListEditor
          legend="Add-ons"
          hint="Optional extras added on top — boba, avocado, bacon, combo upgrades."
          rows={addonRows}
          onChange={setAddonRows}
        />

        <div>
          <label className="text-sm font-medium" htmlFor="mi-notes">
            Notes prompt
          </label>
          <p className="text-xs text-qh-ink-soft">
            Shown above the customer&#8217;s notes box — use it for free-text choices
            like bread, sauce, sweetness, ice, or side picks.
          </p>
          <input
            id="mi-notes"
            className="field mt-1"
            maxLength={300}
            placeholder="e.g. Bread: wheat, sourdough, or white"
            value={notesPrompt}
            onChange={(e) => setNotesPrompt(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="accent-[var(--qh-sage)]"
          />
          Available to order
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
            {error}
          </p>
        ) : null}

        <button
          className="btn btn-primary btn-md w-full"
          onClick={save}
          disabled={saving || name.trim().length === 0}
        >
          {saving ? "Saving…" : item ? "Save changes" : "Create item"}
        </button>
      </div>
    </Sheet>
  );
}
