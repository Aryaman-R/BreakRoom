import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { formatMinutes, isOrderingOpen, lastOrderMinute } from "@/lib/hours";
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

  const phone = normalizePhone(body.phone);
  if (!phone) {
    return apiError(400, "phone_invalid", "That phone number doesn't look right.");
  }

  // 2 · Verification code: matches phone, unused, unexpired → mark used.
  // A single conditional UPDATE so two concurrent submits can't share a code.
  const { data: spent, error: codeErr } = await db
    .from("verification_codes")
    .update({ used: true })
    .eq("phone", phone)
    .eq("code", body.code)
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
