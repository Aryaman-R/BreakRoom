// Shared shapes across API routes and UI. Database rows use snake_case to
// match Postgres column names 1:1 — no mapping layer to drift.

export type Variant = { label: string; price_cents: number };
export type Addon = { label: string; price_cents: number };

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category: string;
  variants: Variant[] | null;
  addons: Addon[] | null;
  notes_prompt: string;
  available: boolean;
  sort_order: number;
  created_at: string;
};

export const ORDER_STATUSES = [
  "new",
  "call_to_confirm",
  "accepted",
  "ready",
  "picked_up",
  "no_show",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_SOURCES = ["web", "qr", "kiosk"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export type Order = {
  id: string;
  order_number: number;
  order_date: string;
  customer_name: string;
  /**
   * E.164, or null for a kiosk walk-in — the one surface where the customer
   * is standing in front of us, so staff can call the name instead of
   * texting it. The database enforces that only source='kiosk' may be null.
   */
  phone: string | null;
  status: OrderStatus;
  total_cents: number;
  source: OrderSource;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  variant_label: string;
  addons: Addon[];
  price_cents: number; // final unit price incl. variant + add-ons
  quantity: number;
  notes: string;
};

// Sanitized projection served by GET /api/orders/[id] — deliberately no phone.
export type PublicOrder = {
  order_number: number;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  /**
   * True when this order has no phone number attached (a kiosk walk-in), so
   * the confirmation can promise the right thing: a name called across the
   * counter rather than a text that will never arrive. Derived from the
   * phone column — the number itself is never exposed here.
   */
  walk_in: boolean;
  items: Array<
    Pick<
      OrderItem,
      "item_name" | "variant_label" | "addons" | "price_cents" | "quantity" | "notes"
    >
  >;
};

export type ApiError = { error: string; code: string };
