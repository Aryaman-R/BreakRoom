/**
 * Email transport — stubbed today, ready for Resend/Postmark tomorrow.
 *
 * Swap the body of `send` for the real provider:
 *
 *   import { Resend } from "resend";
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({ from, to, subject, html });
 */

import type { Booking, Order } from "./types";

function formatMoney(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function send(message: EmailMessage): Promise<{ ok: true }> {
  // TODO(backend): replace with Resend/Postmark client.
  // Intentionally a no-op so dev runs without API keys.
  if (process.env.NODE_ENV !== "production") {
    console.info("[email:dev]", message.subject, "→", message.to);
  }
  return { ok: true };
}

export function bookingConfirmation(b: Booking): EmailMessage {
  return {
    to: b.email,
    subject: "We got your booking request — The Break Room",
    text: [
      `Hi ${b.name},`,
      ``,
      `Thanks for asking us to host. Here's what we've got:`,
      `  Event:        ${b.eventType}${b.eventTypeOther ? ` (${b.eventTypeOther})` : ""}`,
      `  Date / time:  ${b.date} at ${b.timeSlot}`,
      `  Guests:       ${b.guestCount}`,
      `  Catering:     ${b.catering.join(", ") || "—"}`,
      ``,
      `We'll email you within one business day to confirm details.`,
      ``,
      `— The Break Room`,
    ].join("\n"),
  };
}

export function bookingNotification(b: Booking): EmailMessage {
  return {
    to: process.env.BOOKING_NOTIFY_EMAIL ?? "hello@thebreakroom.cafe",
    subject: `New booking request: ${b.name} — ${b.date} ${b.timeSlot}`,
    text: JSON.stringify(b, null, 2),
  };
}

export function orderConfirmation(o: Order): EmailMessage {
  const lines = o.items.map(
    (i) => `  ${i.quantity}× ${i.name.replace(/&#8217;/g, "'")}` +
      `  ${formatMoney(Math.round(i.price * 100) * i.quantity, o.currency)}`
  );
  return {
    to: o.email,
    subject: "Your order is paid — The Break Room",
    text: [
      `Hi ${o.name},`,
      ``,
      `Thanks for ordering ahead. We're on it.`,
      ``,
      ...lines,
      ``,
      `  Total:   ${formatMoney(o.amountTotal, o.currency)}`,
      `  Pickup:  ${o.pickupTime}`,
      ``,
      `Show this email (or just your name) at the counter.`,
      ``,
      `— The Break Room`,
    ].join("\n"),
  };
}

export function orderNotification(o: Order): EmailMessage {
  return {
    to: process.env.BOOKING_NOTIFY_EMAIL ?? "hello@thebreakroom.cafe",
    subject: `New paid order: ${o.name} — pickup ${o.pickupTime}`,
    text: JSON.stringify(o, null, 2),
  };
}
