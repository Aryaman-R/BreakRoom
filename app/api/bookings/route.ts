import { NextResponse } from "next/server";
import { defaultRepo } from "@/lib/db";
import { bookingConfirmation, bookingNotification, send } from "@/lib/email";
import { bookingSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Honeypot — silently accept (so the bot thinks it succeeded) but don't persist.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true, id: "ignored" });
  }

  const booking = await defaultRepo.createBooking(parsed.data);

  // Fire-and-forget emails. In production these would be queued.
  send(bookingConfirmation(booking)).catch(() => {});
  send(bookingNotification(booking)).catch(() => {});

  return NextResponse.json({
    ok: true,
    id: booking.id,
    booking: {
      date: booking.date,
      timeSlot: booking.timeSlot,
      guestCount: booking.guestCount,
    },
  });
}

export async function GET() {
  // Admin endpoint stub. Lock this down before exposing in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bookings = await defaultRepo.listBookings();
  return NextResponse.json({ bookings });
}
