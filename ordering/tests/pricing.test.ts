import { describe, expect, it } from "vitest";
import { priceOrder, type SubmittedItem } from "../lib/pricing";
import type { MenuItem } from "../lib/types";

const base = {
  description: "",
  notes_prompt: "",
  available: true,
  sort_order: 0,
  created_at: "2026-07-21T00:00:00Z",
};

const wings: MenuItem = {
  ...base,
  id: "wings",
  name: "Fried Chicken Wings",
  price_cents: 899,
  category: "Wings",
  variants: [
    { label: "4 pc", price_cents: 899 },
    { label: "8 pc", price_cents: 1299 },
  ],
  addons: null,
};

const milkTea: MenuItem = {
  ...base,
  id: "milk-tea",
  name: "Milk Tea",
  price_cents: 699,
  category: "Bubble Tea",
  variants: null,
  addons: [
    { label: "Boba", price_cents: 50 },
    { label: "Lychee jelly", price_cents: 50 },
  ],
};

const soldOut: MenuItem = {
  ...base,
  id: "gone",
  name: "Gone",
  price_cents: 500,
  category: "Sides",
  variants: null,
  addons: null,
  available: false,
};

const menu = new Map<string, MenuItem>([
  [wings.id, wings],
  [milkTea.id, milkTea],
  [soldOut.id, soldOut],
]);

const line = (over: Partial<SubmittedItem> = {}): SubmittedItem => ({
  menu_item_id: "milk-tea",
  quantity: 1,
  ...over,
});

describe("priceOrder", () => {
  it("prices variant + add-ons from the database, ignoring client numbers", () => {
    const result = priceOrder(
      menu,
      [
        line({ menu_item_id: "wings", variant_label: "8 pc" }),
        line({ addon_labels: ["Boba"], quantity: 2, notes: " 50% sweet " }),
      ],
      5
    );
    expect(result).toMatchObject({ ok: true, total_cents: 1299 + 749 * 2 });
    if (!result.ok) throw new Error("unreachable");
    expect(result.lines[0]).toMatchObject({
      item_name: "Fried Chicken Wings",
      variant_label: "8 pc",
      price_cents: 1299,
    });
    expect(result.lines[1]).toMatchObject({
      price_cents: 749,
      addons: [{ label: "Boba", price_cents: 50 }],
      notes: "50% sweet",
    });
  });

  it("rejects an empty cart", () => {
    expect(priceOrder(menu, [], 5)).toMatchObject({ ok: false, code: "empty_cart" });
  });

  it("rejects unknown items and sold-out items", () => {
    expect(priceOrder(menu, [line({ menu_item_id: "nope" })], 5)).toMatchObject({
      ok: false,
      code: "item_unavailable",
    });
    expect(priceOrder(menu, [line({ menu_item_id: "gone" })], 5)).toMatchObject({
      ok: false,
      code: "item_unavailable",
    });
  });

  it("requires a valid variant when the item has variants", () => {
    // missing
    expect(
      priceOrder(menu, [line({ menu_item_id: "wings" })], 5)
    ).toMatchObject({ ok: false, code: "variant_invalid" });
    // invented ("40 pc")
    expect(
      priceOrder(menu, [line({ menu_item_id: "wings", variant_label: "40 pc" })], 5)
    ).toMatchObject({ ok: false, code: "variant_invalid" });
    // variant sent for a variant-less item
    expect(
      priceOrder(menu, [line({ variant_label: "8 pc" })], 5)
    ).toMatchObject({ ok: false, code: "variant_invalid" });
  });

  it("rejects invented and duplicate add-ons", () => {
    expect(
      priceOrder(menu, [line({ addon_labels: ["Gold flakes"] })], 5)
    ).toMatchObject({ ok: false, code: "addon_invalid" });
    expect(
      priceOrder(menu, [line({ addon_labels: ["Boba", "Boba"] })], 5)
    ).toMatchObject({ ok: false, code: "addon_invalid" });
  });

  it("enforces the per-item quantity cap and rejects nonsense quantities", () => {
    expect(priceOrder(menu, [line({ quantity: 6 })], 5)).toMatchObject({
      ok: false,
      code: "quantity_invalid",
    });
    expect(priceOrder(menu, [line({ quantity: 0 })], 5)).toMatchObject({
      ok: false,
      code: "quantity_invalid",
    });
    expect(priceOrder(menu, [line({ quantity: 1.5 })], 5)).toMatchObject({
      ok: false,
      code: "quantity_invalid",
    });
  });

  it("survives malformed variants jsonb without pricing at NaN", () => {
    const broken: MenuItem = {
      ...wings,
      id: "broken",
      variants: [{ label: "ok" } as never, "garbage" as never],
    };
    const m = new Map(menu).set("broken", broken);
    // all variant entries malformed → treated as variant-less, base price wins
    const result = priceOrder(m, [line({ menu_item_id: "broken" })], 5);
    expect(result).toMatchObject({ ok: true, total_cents: 899 });
  });

  it("caps notes length", () => {
    const result = priceOrder(menu, [line({ notes: "x".repeat(1000) })], 5);
    if (!result.ok) throw new Error("expected ok");
    expect(result.lines[0].notes).toHaveLength(300);
  });
});
