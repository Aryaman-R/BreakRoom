import { z } from "zod";
import { ORDER_SOURCES, ORDER_STATUSES } from "./types";
import { SETTING_KEYS } from "./settings";

// Request-body validation. Prices are conspicuously absent from customer
// payloads — the server recomputes everything from the database.

export const verifyStartSchema = z.object({
  phone: z.string().min(1).max(30),
});

export const createOrderSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(80),
    // Optional only for a kiosk walk-in; the refine below is what actually
    // decides, and the route re-checks the source server-side.
    phone: z.string().max(30).nullish(),
    code: z.string().regex(/^\d{6}$/, "code must be 6 digits").nullish(),
    source: z.enum(ORDER_SOURCES).default("web"),
    items: z
      .array(
        z.object({
          menu_item_id: z.string().uuid(),
          variant_label: z.string().max(80).nullish(),
          addon_labels: z.array(z.string().max(80)).max(20).nullish(),
          quantity: z.number().int().min(1).max(99),
          notes: z.string().max(1000).nullish(),
        })
      )
      .min(1)
      .max(25),
  })
  .refine(
    (o) =>
      o.phone?.trim()
        ? // A number given is a number we verify. No exceptions, no surface.
          Boolean(o.code)
        : // Only the kiosk may leave it out at all.
          o.source === "kiosk",
    { message: "a phone number and verification code are required" }
  );

export const patchOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const optionListSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1).max(80),
      price_cents: z.number().int().min(0).max(100_000),
    })
  )
  .max(20);

export const menuItemCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).default(""),
  price_cents: z.number().int().min(0).max(100_000),
  category: z.string().trim().min(1).max(60).default("Other"),
  variants: optionListSchema.nullable().default(null),
  addons: optionListSchema.nullable().default(null),
  notes_prompt: z.string().max(300).default(""),
  available: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(10_000).default(0),
});

export const menuItemPatchSchema = menuItemCreateSchema.partial();

export const settingsPatchSchema = z
  .object(
    Object.fromEntries(
      SETTING_KEYS.map((k) => [k, z.number().int().min(0).max(1_000_000)])
    ) as Record<(typeof SETTING_KEYS)[number], z.ZodNumber>
  )
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: "no settings given" });

export const blockPhoneSchema = z.object({
  phone: z.string().min(1).max(30),
  reason: z.string().max(200).default(""),
});
