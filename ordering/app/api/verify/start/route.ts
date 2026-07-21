import { randomInt } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";
import { verifyStartSchema } from "@/lib/schemas";
import { sendSms } from "@/lib/sms";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 3;

export const POST = handleErrors(async (req: NextRequest) => {
  const parsed = verifyStartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", "Please enter a phone number.");
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return apiError(400, "phone_invalid", "That phone number doesn't look right.");
  }

  const db = serviceClient();

  // Blocked phones can't even receive a code.
  const { data: blocked, error: blockedErr } = await db
    .from("blocked_phones")
    .select("phone")
    .eq("phone", phone)
    .maybeSingle();
  if (blockedErr) {
    console.error("[verify/start] blocklist check failed:", blockedErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }
  if (blocked) {
    return apiError(403, "blocked", "Online ordering isn't available for this number.");
  }

  // Max 3 sends per phone per hour.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await db
    .from("verification_codes")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gt("created_at", hourAgo);
  if (countErr) {
    console.error("[verify/start] rate-limit check failed:", countErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }
  if ((count ?? 0) >= MAX_SENDS_PER_HOUR) {
    return apiError(
      429,
      "too_many_codes",
      "Too many codes requested — please wait a bit and try again."
    );
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error: insertErr } = await db.from("verification_codes").insert({
    phone,
    code,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  if (insertErr) {
    console.error("[verify/start] code insert failed:", insertErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }

  const sms = await sendSms(phone, `Your Breakroom code: ${code}`);

  if (sms.ok) return NextResponse.json({ sent: true });

  if (sms.dev) {
    // No Twilio configured. In development (or with the explicit smoke-test
    // flag) hand the code back so the flow stays testable end to end.
    const devAllowed =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_DEV_VERIFICATION === "1";
    if (devAllowed) {
      return NextResponse.json({ sent: false, dev_code: code });
    }
    console.error("[verify/start] SMS not configured in production");
    return apiError(
      503,
      "sms_unavailable",
      "Text messages aren't set up yet — please order at the counter."
    );
  }

  // Twilio configured but the send failed — a failed verification SMS must
  // surface clearly to the customer (docs/ORDERING-IMPLEMENTATION.md §8).
  return apiError(
    502,
    "sms_failed",
    "We couldn't text that number. Double-check it and try again."
  );
});
