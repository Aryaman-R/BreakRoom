import type { Addon, MenuItem, Variant } from "./types";

// Client-side cart model. Prices held here are DISPLAY ONLY — the server
// recomputes everything from the database at submit time; only ids, labels,
// quantity, and notes are sent.

export type CartLine = {
  menu_item_id: string;
  item_name: string;
  variant_label: string | null;
  addon_labels: string[];
  unit_cents: number; // display estimate
  quantity: number;
  notes: string;
};

export function lineKey(line: CartLine): string {
  return [
    line.menu_item_id,
    line.variant_label ?? "",
    [...line.addon_labels].sort().join("|"),
    line.notes,
  ].join("::");
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.unit_cents * l.quantity, 0);
}

/** Display-only unit price for a configured item. */
export function unitPrice(
  item: MenuItem,
  variantLabel: string | null,
  addonLabels: string[]
): number {
  const variants = (item.variants ?? []) as Variant[];
  const addons = (item.addons ?? []) as Addon[];
  const base =
    variants.length > 0
      ? variants.find((v) => v.label === variantLabel)?.price_cents ?? item.price_cents
      : item.price_cents;
  return (
    base +
    addonLabels.reduce(
      (sum, label) => sum + (addons.find((a) => a.label === label)?.price_cents ?? 0),
      0
    )
  );
}

const STORAGE_KEY = "breakroom-cart-v1";

export function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage full/blocked — cart just won't survive a refresh
  }
}

export function clearCart(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
