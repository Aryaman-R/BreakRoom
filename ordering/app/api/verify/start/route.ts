import { randomInt } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { normalizePhone } from "@/lib/phone";
import { verifyStartSchema } from "@/lib/schemas";
import { loadSettings } from "@/lib/settings";
import { sendSms } from "@/lib/sms";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 3;

/**
 * Caller's address, for per-IP rate limiting.
 *
 * On Vercel x-forwarded-for is set by the platform and the left-most entry is
 * the real client. Behind any other proxy this is spoofable, which is why it
 * is only one of three budgets and not the one doing the real work.
 */
function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return req.headers.get("x-real-ip")?.slice(0, 64) ?? null;
}

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

  const settings = await loadSettings(db);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Three budgets, because each one alone has an obvious way around it.
  //
  //   per phone   the original. Useless against an attacker who simply uses a
  //               different number every request — which is exactly what SMS
  //               pumping does.
  //   per IP      catches the naive version of that.
  //   global      the backstop that actually bounds the bill, whatever the
  //               attacker rotates. Tune it in /admin, not in a deploy.
  //
  // Every send costs the cafe real money and there was no ceiling of any kind
  // above the per-phone one, so a script walking a list of numbers could run
  // the Twilio account up unbounded. lib/phone.ts refusing anything outside
  // the NANP is the other half of this.
  const { count: perPhone, error: phoneErr } = await db
    .from("verification_codes")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gt("created_at", hourAgo);
  if (phoneErr) {
    console.error("[verify/start] rate-limit check failed:", phoneErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }
  if ((perPhone ?? 0) >= MAX_SENDS_PER_HOUR) {
    return apiError(
      429,
      "too_many_codes",
      "Too many codes requested — please wait a bit and try again."
    );
  }

  const ip = clientIp(req);
  if (ip) {
    const { count: perIp, error: ipErr } = await db
      .from("verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("request_ip", ip)
      .gt("created_at", hourAgo);
    if (ipErr) {
      console.error("[verify/start] per-IP check failed:", ipErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if ((perIp ?? 0) >= settings.max_sms_per_hour_per_ip) {
      return apiError(
        429,
        "too_many_codes",
        "Too many codes requested — please wait a bit and try again."
      );
    }
  }

  const { count: global, error: globalErr } = await db
    .from("verification_codes")
    .select("id", { count: "exact", head: true })
    .gt("created_at", hourAgo);
  if (globalErr) {
    console.error("[verify/start] global budget check failed:", globalErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }
  if ((global ?? 0) >= settings.max_sms_per_hour_global) {
    // Loud, because either the cafe is having its busiest hour ever or it is
    // being farmed for SMS revenue, and both are worth a look.
    console.error(
      `[verify/start] global SMS budget reached (${global}/${settings.max_sms_per_hour_global} this hour)`
    );
    return apiError(
      429,
      "sms_budget",
      "We can't text codes right now — please order at the counter."
    );
  }

  // One live code per phone. Leaving the previous ones valid meant up to three
  // codes would satisfy a single guess, which is a threefold discount on
  // brute-forcing them.
  const { error: supersedeErr } = await db
    .from("verification_codes")
    .update({ used: true })
    .eq("phone", phone)
    .eq("used", false);
  if (supersedeErr) {
    console.error("[verify/start] superseding old codes failed:", supersedeErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error: insertErr } = await db.from("verification_codes").insert({
    phone,
    code,
    request_ip: ip,
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
