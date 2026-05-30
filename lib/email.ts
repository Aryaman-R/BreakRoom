/**
 * Email transport — stubbed today, ready for Resend/Postmark tomorrow.
 *
 * Swap the body of `send` for the real provider:
 *
 *   import { Resend } from "resend";
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({ from, to, subject, html });
 */

import type { Booking } from "./types";

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
    subject: "We got your booking request — The Breakroom",
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
      `— The Breakroom`,
    ].join("\n"),
  };
}

export function bookingNotification(b: Booking): EmailMessage {
  return {
    to: process.env.BOOKING_NOTIFY_EMAIL ?? "thebreakroombothell@gmail.com",
    subject: `New booking request: ${b.name} — ${b.date} ${b.timeSlot}`,
    text: JSON.stringify(b, null, 2),
  };
}
