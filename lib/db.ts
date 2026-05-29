/**
 * Data-access layer.
 *
 * Today: a thin in-memory implementation backed by JSON files in /content
 * for read paths, and a process-local array for bookings.
 *
 * Tomorrow: swap `defaultRepo` to a Postgres-backed implementation
 * (Supabase / Neon / your own pg pool) without touching API routes or UI.
 *
 *   import { Pool } from "pg";
 *   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 *   export const defaultRepo: Repo = createPgRepo(pool);
 *
 * Keep the surface narrow on purpose. New persisted entities should be
 * added here as methods, not as ad-hoc reads from JSON.
 */

import { randomUUID } from "node:crypto";
import menuContent from "@/content/menu.json";
import specialsContent from "@/content/specials.json";
import eventsContent from "@/content/events.json";
import type {
  AvailabilitySlot,
  Booking,
  BookingInput,
  MenuCategory,
  MenuItem,
  Order,
  PublicEvent,
  Special,
} from "./types";

export interface Repo {
  // Reads
  getMenu(): Promise<MenuCategory[]>;
  getSpecials(): Promise<Special[]>;
  getUpcomingEvents(): Promise<PublicEvent[]>;
  getPastEvents(): Promise<PublicEvent[]>;
  getEvent(id: string): Promise<PublicEvent | null>;
  getAvailability(dateISO: string): Promise<AvailabilitySlot[]>;
  /** Flat map of orderable menu items by id — the source of truth for prices. */
  getMenuItemMap(): Promise<Map<string, MenuItem>>;

  // Writes
  createBooking(input: BookingInput): Promise<Booking>;
  listBookings(): Promise<Booking[]>;

  // Orders
  createOrder(order: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | null>;
  /** Idempotently mark an order paid. Returns the order, or null if unknown. */
  markOrderPaid(paymentIntentId: string, paidAtISO: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
}

/** All slots the cafe could offer for a private booking. */
const SLOT_TEMPLATE = [
  "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
  "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM",
];

class InMemoryRepo implements Repo {
  private bookings: Booking[] = [];
  private orders: Order[] = [];

  async getMenu() {
    // Fold today's specials into the "Specials" category.
    const cats = (menuContent.categories as MenuCategory[]).map((c) => ({ ...c }));
    const specials = await this.getSpecials();
    const sIdx = cats.findIndex((c) => c.id === "specials");
    if (sIdx !== -1) {
      cats[sIdx] = {
        ...cats[sIdx],
        items: specials.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          description: s.description,
          tags: [],
        })),
      };
    }
    return cats;
  }

  async getSpecials() {
    return specialsContent.specials as Special[];
  }

  async getUpcomingEvents() {
    return eventsContent.upcoming as PublicEvent[];
  }

  async getPastEvents() {
    return eventsContent.past as PublicEvent[];
  }

  async getEvent(id: string) {
    const all = [
      ...(eventsContent.upcoming as PublicEvent[]),
      ...(eventsContent.past as PublicEvent[]),
    ];
    return all.find((e) => e.id === id) ?? null;
  }

  async getAvailability(dateISO: string) {
    // Simulate: a few slots are "taken" deterministically per date.
    // Real impl will query the bookings table for that date.
    const seed = hashString(dateISO);
    return SLOT_TEMPLATE.map((time, i) => ({
      time,
      available: ((seed + i) % 7) !== 0,
    }));
  }

  async createBooking(input: BookingInput) {
    const booking: Booking = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    this.bookings.push(booking);
    return booking;
  }

  async listBookings() {
    return [...this.bookings].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }

  async getMenuItemMap() {
    const cats = await this.getMenu();
    const map = new Map<string, MenuItem>();
    for (const cat of cats) {
      for (const item of cat.items) map.set(item.id, item);
    }
    return map;
  }

  async createOrder(order: Order) {
    this.orders.push(order);
    return order;
  }

  async getOrder(id: string) {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  async getOrderByPaymentIntent(paymentIntentId: string) {
    return this.orders.find((o) => o.paymentIntentId === paymentIntentId) ?? null;
  }

  async markOrderPaid(paymentIntentId: string, paidAtISO: string) {
    const order = this.orders.find((o) => o.paymentIntentId === paymentIntentId);
    if (!order) return null;
    // Idempotent: webhooks can be delivered more than once.
    if (order.status !== "paid") {
      order.status = "paid";
      order.paidAt = paidAtISO;
    }
    return order;
  }

  async listOrders() {
    return [...this.orders].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Singleton repo for the running process. In dev with HMR, attach to the
 * global so the in-memory bookings array survives module reloads.
 */
const globalForRepo = globalThis as unknown as { __repo?: Repo };
export const defaultRepo: Repo =
  globalForRepo.__repo ?? (globalForRepo.__repo = new InMemoryRepo());
