import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { requireAdmin } from "@/lib/guards";
import { menuItemCreateSchema } from "@/lib/schemas";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// GET — every item including sold-out/archived, for the admin table.
export const GET = handleErrors(async () => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const db = serviceClient();
  const { data, error } = await db
    .from("menu_items")
    .select("*")
    .order("category")
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("[admin/menu] list failed:", error);
    return apiError(500, "server_error", "Couldn't load the menu.");
  }
  return NextResponse.json(data);
});

export const POST = handleErrors(async (req: NextRequest) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = menuItemCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", parsed.error.issues[0]?.message ?? "Invalid item.");
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("menu_items")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) {
    console.error("[admin/menu] create failed:", error);
    return apiError(500, "server_error", "Couldn't create the item.");
  }
  return NextResponse.json(data, { status: 201 });
});
