import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, handleErrors } from "@/lib/api";
import { requireStaff } from "@/lib/guards";
import { patchOrderSchema } from "@/lib/schemas";
import { sendSms } from "@/lib/sms";
import { serviceClient } from "@/lib/supabase/service";
import { canTransition } from "@/lib/transitions";
import type { Order, PublicOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// GET — the customer status page. No auth: the unguessable order UUID is the
// capability. The projection deliberately contains no phone number.
export const GET = handleErrors(async (_req: NextRequest, { params }: Params) => {
  if (!z.string().uuid().safeParse(params.id).success) {
    return apiError(404, "not_found", "Order not found.");
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "order_number, status, total_cents, created_at, phone, order_items (item_name, variant_label, addons, price_cents, quantity, notes)"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (error) {
    console.error("[orders/:id] fetch failed:", error);
    return apiError(500, "server_error", "Something went wrong.");
  }
  if (!data) return apiError(404, "not_found", "Order not found.");

  // The phone is selected only to answer "will this customer get a text?" —
  // it is reduced to a boolean here and never leaves the server.
  const projection: PublicOrder = {
    order_number: data.order_number,
    status: data.status,
    total_cents: data.total_cents,
    created_at: data.created_at,
    walk_in: !data.phone,
    items: (data.order_items ?? []) as PublicOrder["items"],
  };
  return NextResponse.json(projection, {
    headers: { "Cache-Control": "no-store" },
  });
});

// PATCH — staff only. Enforces the closed transition graph, stamps
// accepted_at / ready_at, and fires the two customer SMS. Status SMS
// failures log and continue — a broken text must never strand an order.
export const PATCH = handleErrors(async (req: NextRequest, { params }: Params) => {
  const guard = await requireStaff();
  if ("response" in guard) return guard.response;

  const parsed = patchOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", "Body must be {status}.");
  }
  const nextStatus = parsed.data.status;

  const db = serviceClient();
  const { data: order, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Order>();
  if (fetchErr) {
    console.error("[orders/:id] fetch failed:", fetchErr);
    return apiError(500, "server_error", "Something went wrong.");
  }
  if (!order) return apiError(404, "not_found", "Order not found.");

  if (!canTransition(order.status, nextStatus)) {
    return apiError(
      400,
      "illegal_transition",
      `Can't go from ${order.status} to ${nextStatus}.`
    );
  }

  const patch: Record<string, string> = { status: nextStatus };
  if (nextStatus === "accepted") patch.accepted_at = new Date().toISOString();
  if (nextStatus === "ready") patch.ready_at = new Date().toISOString();

  // Conditional update = optimistic lock: if another tab moved the order
  // first, zero rows come back and we report the conflict instead of
  // silently double-applying.
  const { data: updated, error: updateErr } = await db
    .from("orders")
    .update(patch)
    .eq("id", order.id)
    .eq("status", order.status)
    .select("*");
  if (updateErr) {
    console.error("[orders/:id] update failed:", updateErr);
    return apiError(500, "server_error", "Something went wrong.");
  }
  if (!updated || updated.length === 0) {
    return apiError(409, "conflict", "Order changed under you — refresh.");
  }

  // Kiosk walk-ins have no phone: there is nothing to text, and nothing to
  // put on the blocklist. Staff call the name across the counter instead —
  // which is why the walk-in path is kiosk-only in the first place.
  if (order.phone) {
    if (nextStatus === "accepted") {
      const sms = await sendSms(
        order.phone,
        `Breakroom order #${order.order_number} confirmed — ready in about 15 minutes.`
      );
      if (!sms.ok) console.error(`[orders/:id] accepted SMS not sent for #${order.order_number}`);
    } else if (nextStatus === "ready") {
      const sms = await sendSms(
        order.phone,
        `Breakroom order #${order.order_number} is ready for pickup!`
      );
      if (!sms.ok) console.error(`[orders/:id] ready SMS not sent for #${order.order_number}`);
    } else if (nextStatus === "no_show") {
      await applyTwoStrikeRule(db, order.phone);
    }
  }

  return NextResponse.json(updated[0]);
});

// Two no-shows → phone blocked. Lives here (not a DB trigger) so the admin
// can see and reverse it from the blocklist screen.
async function applyTwoStrikeRule(
  db: ReturnType<typeof serviceClient>,
  phone: string
) {
  const { count, error } = await db
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("status", "no_show");
  if (error) {
    console.error("[orders/:id] no-show count failed:", error);
    return;
  }
  if ((count ?? 0) >= 2) {
    const { error: blockErr } = await db
      .from("blocked_phones")
      .upsert({ phone, reason: "2 no-shows" }, { onConflict: "phone" });
    if (blockErr) console.error("[orders/:id] auto-block failed:", blockErr);
  }
}
