import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { defaultRepo } from "@/lib/db";
import { orderConfirmation, orderNotification, send } from "@/lib/email";

// Must run on Node (needs the raw body + crypto for signature verification).
export const runtime = "nodejs";
// Never cache or statically optimize a webhook.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the source of truth for confirming an order is paid.
 *
 * We verify the signature against the raw request body, then on
 * `payment_intent.succeeded` flip the matching order to "paid" and send the
 * receipt. Handling is idempotent: Stripe may deliver an event more than once.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook is not configured (missing STRIPE_WEBHOOK_SECRET)." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Raw body is required for signature verification — do NOT parse as JSON.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const existing = await defaultRepo.getOrderByPaymentIntent(pi.id);
      // Only act on the first successful transition — keeps emails idempotent.
      if (existing && existing.status !== "paid") {
        const order = await defaultRepo.markOrderPaid(pi.id, new Date().toISOString());
        if (order) {
          send(orderConfirmation(order)).catch(() => {});
          send(orderNotification(order)).catch(() => {});
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      // Order stays "pending"; the customer can retry. Nothing to persist.
      break;
    }
    default:
      // Ignore unrelated event types.
      break;
  }

  return NextResponse.json({ received: true });
}
