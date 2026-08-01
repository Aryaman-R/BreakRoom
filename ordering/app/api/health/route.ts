import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// Liveness probe, added for the kiosk.
//
// A kiosk sitting on cafe wifi that has lost its uplink still reports
// navigator.onLine === true, and the first the customer would hear of it is
// a failed order at the very end of checkout. So the kiosk asks the origin
// instead of trusting the browser — and the origin asks the database, since
// "Vercel is up but Supabase isn't" fails a customer just as thoroughly.
//
// Deliberately cheap: a HEAD-style count against a seven-row table, no auth,
// nothing about it worth scraping.
export async function GET() {
  try {
    const { error } = await serviceClient()
      .from("settings")
      .select("key", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[health] database unreachable:", err);
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
