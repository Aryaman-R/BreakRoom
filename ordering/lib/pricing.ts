import type { Addon, MenuItem, Variant } from "./types";

// Server-side price recomputation — the "server is truth" core.
// Every client-sent price, label, and total is ignored; the unit price is
// rebuilt from the menu row's variants/addons jsonb, and anything that
// doesn't match the database is rejected outright.

export type SubmittedItem = {
  menu_item_id: string;
  variant_label?: string | null;
  addon_labels?: string[] | null;
  quantity: number;
  notes?: string | null;
};

export type PricedLine = {
  menu_item_id: string;
  item_name: string;
  variant_label: string;
  addons: Addon[]; // snapshot of the chosen add-ons at DB prices
  price_cents: number; // final unit price = variant (or base) + add-ons
  quantity: number;
  notes: string;
};

export type PricingResult =
  | { ok: true; lines: PricedLine[]; total_cents: number }
  | { ok: false; code: string; error: string };

export const MAX_NOTES_LENGTH = 300;

function fail(code: string, error: string): PricingResult {
  return { ok: false, code, error };
}

// jsonb columns arrive as unknown — keep only well-formed entries so a
// malformed admin edit can never crash checkout or price an item at NaN.
function sanitizeOptions(raw: unknown): Variant[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (v): v is Variant =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Variant).label === "string" &&
      (v as Variant).label.length > 0 &&
      Number.isInteger((v as Variant).price_cents) &&
      (v as Variant).price_cents >= 0
  );
}

export function priceOrder(
  menuById: ReadonlyMap<string, MenuItem>,
  items: SubmittedItem[],
  maxQtyPerItem: number
): PricingResult {
  if (items.length === 0) return fail("empty_cart", "Your cart is empty.");

  const lines: PricedLine[] = [];
  let total = 0;

  for (const submitted of items) {
    const item = menuById.get(submitted.menu_item_id);
    if (!item || !item.available) {
      return fail(
        "item_unavailable",
        "An item in your cart is no longer available. Please review your cart."
      );
    }

    if (
      !Number.isInteger(submitted.quantity) ||
      submitted.quantity < 1 ||
      submitted.quantity > maxQtyPerItem
    ) {
      return fail(
        "quantity_invalid",
        `Quantity for ${item.name} must be between 1 and ${maxQtyPerItem}.`
      );
    }

    const variants = sanitizeOptions(item.variants);
    let unit: number;
    let variantLabel = "";
    if (variants.length > 0) {
      const chosen = variants.find((v) => v.label === submitted.variant_label);
      if (!chosen) {
        return fail("variant_invalid", `Please pick an option for ${item.name}.`);
      }
      unit = chosen.price_cents;
      variantLabel = chosen.label;
    } else {
      if (submitted.variant_label) {
        return fail("variant_invalid", `${item.name} has no options to choose.`);
      }
      unit = item.price_cents;
    }

    const addons = sanitizeOptions(item.addons);
    const chosenAddons: Addon[] = [];
    const requested = submitted.addon_labels ?? [];
    if (new Set(requested).size !== requested.length) {
      return fail("addon_invalid", `Duplicate add-on for ${item.name}.`);
    }
    for (const label of requested) {
      const addon = addons.find((a) => a.label === label);
      if (!addon) {
        return fail("addon_invalid", `Unknown add-on for ${item.name}.`);
      }
      chosenAddons.push({ label: addon.label, price_cents: addon.price_cents });
      unit += addon.price_cents;
    }

    const notes = (submitted.notes ?? "").trim().slice(0, MAX_NOTES_LENGTH);

    lines.push({
      menu_item_id: item.id,
      item_name: item.name,
      variant_label: variantLabel,
      addons: chosenAddons,
      price_cents: unit,
      quantity: submitted.quantity,
      notes,
    });
    total += unit * submitted.quantity;
  }

  return { ok: true, lines, total_cents: total };
}
