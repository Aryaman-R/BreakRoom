import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { formatMinutes, isOrderingOpen, lastOrderMinute } from "@/lib/hours";
import { formatCents } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { priceOrder } from "@/lib/pricing";
import { createOrderSchema } from "@/lib/schemas";
import { loadSettings } from "@/lib/settings";
import { serviceClient } from "@/lib/supabase/service";
import type { MenuItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// Statuses that count against the one-open-order-per-phone cap.
const OPEN_STATUSES = ["new", "call_to_confirm", "accepted", "ready"];

// The gauntlet, in the order specified by docs/ORDERING-IMPLEMENTATION.md §3:
// hours → code → blocklist → open-order cap → daily cap → item/variant/addon
// validity + quantity caps → server-side price recomputation → hard cap /
// call-to-confirm threshold → atomic insert with snapshotted items.
//
// A kiosk walk-in takes a different route through the middle of it: with no
// phone number there is nothing to verify, block, or count against, so it
// gets caps of its own instead (§ "walk-in" below, and
// docs/ORDERING-FRAUD-PREVENTION.md).
export const POST = handleErrors(async (req: NextRequest) => {
  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", "That order couldn't be read. Please try again.");
  }
  const body = parsed.data;

  const db = serviceClient();
  const settings = await loadSettings(db);

  // 1 · Hours gate — Pacific wall clock, never the server's own timezone.
  if (!isOrderingOpen(settings)) {
    return apiError(
      403,
      "closed",
      `Online ordering is open ${formatMinutes(settings.ordering_open_minutes)} – ` +
        `${formatMinutes(lastOrderMinute(settings))} daily.`
    );
  }

  const walkIn = !body.phone?.trim();
  let phone: string | null = null;

  if (walkIn) {
    // 2a · Walk-in: kiosk only, and only while the owner leaves it on.
    // `source` is client-supplied and therefore not proof of anything — the
    // caps below are what actually bound the damage, not this check.
    if (body.source !== "kiosk") {
      return apiError(400, "phone_required", "Please enter a mobile number to order.");
    }
    if (!settings.allow_walkin_orders) {
      return apiError(
        403,
        "walkin_disabled",
        "We need a mobile number for online orders right now — or order at the counter."
      );
    }

    // Two caps, both cafe-wide, because there is no customer identity to
    // key on. Together they mean a flood of forged walk-ins costs the cafe
    // a handful of rejected tickets and nothing else — and no food, since
    // staff still press Accept before anything is made.
    const { count: openWalkIns, error: openWalkInErr } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .is("phone", null)
      .in("status", OPEN_STATUSES);
    if (openWalkInErr) {
      console.error("[orders] walk-in open check failed:", openWalkInErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if ((openWalkIns ?? 0) >= settings.max_open_walkin_orders) {
      return apiError(
        429,
        "walkin_busy",
        "We're catching up on counter orders — please order at the register."
      );
    }

    const walkInHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentWalkIns, error: recentWalkInErr } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .is("phone", null)
      .gt("created_at", walkInHourAgo);
    if (recentWalkInErr) {
      console.error("[orders] walk-in rate check failed:", recentWalkInErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if ((recentWalkIns ?? 0) >= settings.max_walkin_per_hour) {
      return apiError(
        429,
        "walkin_busy",
        "We're catching up on counter orders — please order at the register."
      );
    }
  } else {
    phone = normalizePhone(body.phone!);
    if (!phone) {
      return apiError(400, "phone_invalid", "That phone number doesn't look right.");
    }

    // 2 · Verification code: matches phone, unused, unexpired → mark used.
    // A single conditional UPDATE so two concurrent submits can't share a code.
    const { data: spent, error: codeErr } = await db
      .from("verification_codes")
      .update({ used: true })
      .eq("phone", phone)
      .eq("code", body.code!)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .select("id");
    if (codeErr) {
      console.error("[orders] code check failed:", codeErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if (!spent || spent.length === 0) {
      return apiError(
        401,
        "code_invalid",
        "That code didn't match or has expired — request a new one and try again."
      );
    }

    // 3 · Blocklist.
    const { data: blocked, error: blockedErr } = await db
      .from("blocked_phones")
      .select("phone")
      .eq("phone", phone)
      .maybeSingle();
    if (blockedErr) {
      console.error("[orders] blocklist check failed:", blockedErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if (blocked) {
      return apiError(403, "blocked", "Online ordering isn't available for this number.");
    }

    // 4 · Open-order cap.
    const { count: openCount, error: openErr } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .in("status", OPEN_STATUSES);
    if (openErr) {
      console.error("[orders] open-order check failed:", openErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if ((openCount ?? 0) >= settings.max_open_orders_per_phone) {
      return apiError(
        409,
        "open_order",
        "You already have an order in progress — pick that one up first."
      );
    }

    // 5 · Daily cap. order_date defaults to Postgres current_date (UTC); the
    // whole Pacific ordering window falls inside one UTC day, so this matches.
    const utcToday = new Date().toISOString().slice(0, 10);
    const { count: dayCount, error: dayErr } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .eq("order_date", utcToday);
    if (dayErr) {
      console.error("[orders] daily-cap check failed:", dayErr);
      return apiError(500, "server_error", "Something went wrong. Please try again.");
    }
    if ((dayCount ?? 0) >= settings.max_orders_per_phone_per_day) {
      return apiError(
        429,
        "daily_cap",
        "That's the last online order we can take for this number today."
      );
    }
  }

  // 6–7 · Item validity + full server-side price recomputation.
  const ids = [...new Set(body.items.map((i) => i.menu_item_id))];
  const { data: menuRows, error: menuErr } = await db
    .from("menu_items")
    .select("*")
    .in("id", ids);
  if (menuErr) {
    console.error("[orders] menu fetch failed:", menuErr);
    return apiError(500, "server_error", "Something went wrong. Please try again.");
  }
  const menuById = new Map<string, MenuItem>(
    (menuRows as MenuItem[]).map((m) => [m.id, m])
  );
  const priced = priceOrder(menuById, body.items, settings.max_qty_per_item);
  if (!priced.ok) {
    return apiError(400, priced.code, priced.error);
  }

  // 8 · Hard cap, then threshold routing.
  if (priced.total_cents > settings.hard_cap_cents) {
    return apiError(
      400,
      "hard_cap",
      "That order is too large for online ordering — please call the cafe."
    );
  }

  // A big order normally routes to call_to_confirm, which is exactly what it
  // sounds like — and there is nobody to call on a walk-in. So for walk-ins
  // the confirm threshold is a wall, not a detour: over it, a human takes
  // the order. Adding a number at the kiosk lifts the limit back to the
  // usual hard cap.
  if (walkIn && priced.total_cents > settings.call_to_confirm_threshold_cents) {
    return apiError(
      400,
      "walkin_too_large",
      `For orders over ${formatCents(settings.call_to_confirm_threshold_cents)}, ` +
        "add your mobile number so we can reach you — or order at the counter."
    );
  }

  const status =
    priced.total_cents > settings.call_to_confirm_threshold_cents
      ? "call_to_confirm"
      : "new";

  // 9 · Atomic insert: order + snapshotted items + daily number, one transaction.
  const { data: placed, error: placeErr } = await db.rpc("place_order", {
    p_customer_name: body.customer_name,
    p_phone: phone,
    p_status: status,
    p_total_cents: priced.total_cents,
    p_source: body.source,
    p_items: priced.lines,
  });
  if (placeErr || !placed || placed.length === 0) {
    console.error("[orders] place_order failed:", placeErr);
    return apiError(500, "server_error", "Something went wrong placing your order.");
  }

  return NextResponse.json(
    {
      order_id: placed[0].order_id,
      order_number: placed[0].order_number,
      status,
    },
    { status: 201 }
  );
});
