import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleErrors } from "@/lib/api";
import { requireAdmin } from "@/lib/guards";
import { settingsPatchSchema } from "@/lib/schemas";
import { loadSettings } from "@/lib/settings";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export const GET = handleErrors(async () => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  return NextResponse.json(await loadSettings(serviceClient()));
});

export const PATCH = handleErrors(async (req: NextRequest) => {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = settingsPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, "invalid_request", "No valid settings in the request.");
  }

  const db = serviceClient();
  const merged = { ...(await loadSettings(db)), ...parsed.data };

  // Sanity-check the hours window as a whole so a partial update can't strand
  // ordering in a state where it never opens.
  if (merged.ordering_close_minutes > 1440 || merged.ordering_open_minutes >= 1440) {
    return apiError(400, "hours_invalid", "Hours must be within one day.");
  }
  if (
    merged.ordering_open_minutes >=
    merged.ordering_close_minutes - merged.last_order_buffer_minutes
  ) {
    return apiError(
      400,
      "hours_invalid",
      "Opening time must be before closing time minus the last-order buffer."
    );
  }

  const rows = Object.entries(parsed.data).map(([key, value]) => ({ key, value }));
  const { error } = await db.from("settings").upsert(rows, { onConflict: "key" });
  if (error) {
    console.error("[admin/settings] upsert failed:", error);
    return apiError(500, "server_error", "Couldn't save settings.");
  }
  return NextResponse.json(merged);
});
