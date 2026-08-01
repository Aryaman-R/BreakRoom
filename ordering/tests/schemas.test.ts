import { describe, expect, it } from "vitest";
import { createOrderSchema } from "../lib/schemas";

// The order payload is the app's only untrusted input, and the kiosk walk-in
// path made it conditional: phone and code are required unless the order
// claims to come from a kiosk. That "unless" is a security boundary, so it
// gets tested directly rather than only through the route.
//
// Note what this schema does NOT decide: whether a kiosk order is genuinely
// from the kiosk. Nothing client-side can prove that. The route bounds the
// damage with cafe-wide walk-in caps instead — see app/api/orders/route.ts
// and docs/ORDERING-FRAUD-PREVENTION.md.

const ITEM = {
  menu_item_id: "3f1c9b6e-8a2d-4f3b-9c11-6d5e2a7b4c88",
  quantity: 1,
};

const base = (over: Record<string, unknown> = {}) => ({
  customer_name: "Sam",
  items: [ITEM],
  ...over,
});

describe("createOrderSchema", () => {
  it("accepts a normal web order with phone and code", () => {
    const parsed = createOrderSchema.safeParse(
      base({ phone: "4255550100", code: "123456" })
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.source).toBe("web");
  });

  it("accepts a kiosk walk-in with no phone and no code", () => {
    const parsed = createOrderSchema.safeParse(base({ source: "kiosk" }));
    expect(parsed.success).toBe(true);
  });

  it("rejects a phoneless order from the web", () => {
    expect(createOrderSchema.safeParse(base()).success).toBe(false);
    expect(
      createOrderSchema.safeParse(base({ source: "web" })).success
    ).toBe(false);
  });

  it("rejects a phoneless order from the QR code — that customer isn't here", () => {
    expect(createOrderSchema.safeParse(base({ source: "qr" })).success).toBe(false);
  });

  it("treats a blank or whitespace phone as no phone at all", () => {
    expect(createOrderSchema.safeParse(base({ phone: "   " })).success).toBe(false);
    expect(
      createOrderSchema.safeParse(base({ phone: "  ", source: "kiosk" })).success
    ).toBe(true);
  });

  it("still demands a code whenever a number is given, kiosk included", () => {
    expect(
      createOrderSchema.safeParse(base({ phone: "4255550100" })).success
    ).toBe(false);
    expect(
      createOrderSchema.safeParse(base({ phone: "4255550100", source: "kiosk" }))
        .success
    ).toBe(false);
    expect(
      createOrderSchema.safeParse(
        base({ phone: "4255550100", code: "123456", source: "kiosk" })
      ).success
    ).toBe(true);
  });

  it("rejects codes that aren't six digits", () => {
    for (const code of ["12345", "1234567", "12345a", ""]) {
      expect(
        createOrderSchema.safeParse(base({ phone: "4255550100", code })).success
      ).toBe(false);
    }
  });

  it("rejects an unknown source", () => {
    expect(
      createOrderSchema.safeParse(
        base({ phone: "4255550100", code: "123456", source: "doordash" })
      ).success
    ).toBe(false);
  });

  it("still requires a name and at least one item", () => {
    expect(
      createOrderSchema.safeParse({ source: "kiosk", items: [ITEM] }).success
    ).toBe(false);
    expect(
      createOrderSchema.safeParse({
        customer_name: "  ",
        source: "kiosk",
        items: [ITEM],
      }).success
    ).toBe(false);
    expect(
      createOrderSchema.safeParse({
        customer_name: "Sam",
        source: "kiosk",
        items: [],
      }).success
    ).toBe(false);
  });

  it("never lets a client send prices", () => {
    const parsed = createOrderSchema.safeParse(
      base({
        source: "kiosk",
        items: [{ ...ITEM, price_cents: 1, unit_cents: 1 }],
        total_cents: 1,
      })
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("total_cents");
      expect(parsed.data.items[0]).not.toHaveProperty("price_cents");
    }
  });
});
