import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { defaultRepo } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { orderSchema } from "@/lib/validation";
import type { Order, OrderItem } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Creates a pending order and a Stripe PaymentIntent for it.
 *
 * Prices are resolved server-side from the menu — the client only sends item
 * ids and quantities, never amounts. The order is recorded as "pending" and
 * only flips to "paid" when the Stripe webhook confirms the charge.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Resolve prices from the menu — the source of truth.
  const menu = await defaultRepo.getMenuItemMap();
  const items: OrderItem[] = [];
  for (const line of parsed.data.items) {
    const item = menu.get(line.id);
    if (!item) {
      return NextResponse.json(
        { error: `That item is no longer on the menu (${line.id}).` },
        { status: 422 }
      );
    }
    items.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: line.quantity,
    });
  }

  const amountTotal = items.reduce(
    (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
    0
  );
  if (amountTotal <= 0) {
    return NextResponse.json({ error: "Order total must be positive." }, { status: 422 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Online ordering isn't available right now." },
      { status: 503 }
    );
  }

  const orderId = randomUUID();
  const currency = "usd";

  const intent = await stripe.paymentIntents.create({
    amount: amountTotal,
    currency,
    automatic_payment_methods: { enabled: true },
    receipt_email: parsed.data.email,
    description: `The Break Room — order ${orderId}`,
    metadata: {
      orderId,
      pickupTime: parsed.data.pickupTime,
      customerName: parsed.data.name,
    },
  });

  const order: Order = {
    id: orderId,
    items,
    name: parsed.data.name,
    email: parsed.data.email,
    pickupTime: parsed.data.pickupTime,
    amountTotal,
    currency,
    status: "pending",
    paymentIntentId: intent.id,
    createdAt: new Date().toISOString(),
  };
  await defaultRepo.createOrder(order);

  return NextResponse.json({
    orderId,
    clientSecret: intent.client_secret,
    amountTotal,
    currency,
    items,
  });
}
