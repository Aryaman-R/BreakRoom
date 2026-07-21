import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, handleErrors } from "@/lib/api";
import { requireAdmin } from "@/lib/guards";
import { menuItemPatchSchema } from "@/lib/schemas";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export const PATCH = handleErrors(async (req: NextRequest, { params }: Params) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  if (!z.string().uuid().safeParse(params.id).success) {
    return apiError(404, "not_found", "Item not found.");
  }

  const parsed = menuItemPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return apiError(400, "invalid_request", "Nothing valid to update.");
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("menu_items")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*");
  if (error) {
    console.error("[admin/menu/:id] update failed:", error);
    return apiError(500, "server_error", "Couldn't update the item.");
  }
  if (!data || data.length === 0) return apiError(404, "not_found", "Item not found.");
  return NextResponse.json(data[0]);
});

export const DELETE = handleErrors(async (_req: NextRequest, { params }: Params) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  if (!z.string().uuid().safeParse(params.id).success) {
    return apiError(404, "not_found", "Item not found.");
  }

  const db = serviceClient();
  const { error, count } = await db
    .from("menu_items")
    .delete({ count: "exact" })
    .eq("id", params.id);
  if (error) {
    // 23503 = foreign key violation: the item appears in order history.
    // History is immutable by design — archive instead.
    if (error.code === "23503") {
      return apiError(
        409,
        "has_orders",
        "This item has order history and can't be deleted — mark it unavailable instead."
      );
    }
    console.error("[admin/menu/:id] delete failed:", error);
    return apiError(500, "server_error", "Couldn't delete the item.");
  }
  if (!count) return apiError(404, "not_found", "Item not found.");
  return NextResponse.json({ deleted: true });
});
