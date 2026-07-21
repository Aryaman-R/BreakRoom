import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { requireAdmin } from "@/lib/guards";
import { normalizePhone } from "@/lib/phone";
import { blockPhoneSchema } from "@/lib/schemas";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export const GET = handleErrors(async () => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const db = serviceClient();
  const { data, error } = await db
    .from("blocked_phones")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[admin/blocked] list failed:", error);
    return apiError(500, "server_error", "Couldn't load the blocklist.");
  }
  return NextResponse.json(data);
});

// Manual block (the two-strike rule inserts automatically from the PATCH route).
export const POST = handleErrors(async (req: NextRequest) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = blockPhoneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", "Body must be {phone, reason?}.");
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return apiError(400, "phone_invalid", "That phone number doesn't look right.");
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("blocked_phones")
    .upsert({ phone, reason: parsed.data.reason }, { onConflict: "phone" })
    .select("*")
    .single();
  if (error) {
    console.error("[admin/blocked] block failed:", error);
    return apiError(500, "server_error", "Couldn't block that number.");
  }
  return NextResponse.json(data, { status: 201 });
});

// Unblock: DELETE /api/admin/blocked?phone=%2B14255550100
export const DELETE = handleErrors(async (req: NextRequest) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const raw = req.nextUrl.searchParams.get("phone") ?? "";
  const phone = normalizePhone(raw);
  if (!phone) {
    return apiError(400, "phone_invalid", "Pass ?phone= to unblock.");
  }

  const db = serviceClient();
  const { error, count } = await db
    .from("blocked_phones")
    .delete({ count: "exact" })
    .eq("phone", phone);
  if (error) {
    console.error("[admin/blocked] unblock failed:", error);
    return apiError(500, "server_error", "Couldn't unblock that number.");
  }
  if (!count) return apiError(404, "not_found", "That number isn't blocked.");
  return NextResponse.json({ unblocked: phone });
});
