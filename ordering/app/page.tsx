import { createClient } from "@supabase/supabase-js";
import { OrderApp } from "@/components/customer/OrderApp";
import { formatMinutes, isOrderingOpen, lastOrderMinute } from "@/lib/hours";
import { loadSettings } from "@/lib/settings";
import { serviceClient } from "@/lib/supabase/service";
import type { MenuItem, OrderSource } from "@/lib/types";

// Menu availability and the hours gate must reflect admin changes on the very
// next request — never prerender this page.
export const dynamic = "force-dynamic";

type Props = { searchParams: { source?: string } };

export default async function OrderPage({ searchParams }: Props) {
  // ?source=qr from the counter QR code (Phase 2) — anything else is web.
  const source: OrderSource = searchParams.source === "qr" ? "qr" : "web";

  let menu: MenuItem[] = [];
  let open = false;
  let hoursCopy = "";
  let maxQty = 5;
  let unavailable = false;

  try {
    // Menu through the anon key so RLS does the available-items filtering,
    // exactly as a browser client would see it.
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const [{ data, error }, settings] = await Promise.all([
      anon
        .from("menu_items")
        .select("*")
        .order("sort_order")
        .order("name"),
      loadSettings(serviceClient()),
    ]);
    if (error) throw error;
    menu = (data ?? []) as MenuItem[];
    open = isOrderingOpen(settings);
    maxQty = settings.max_qty_per_item;
    hoursCopy = `${formatMinutes(settings.ordering_open_minutes)} – ${formatMinutes(
      lastOrderMinute(settings)
    )} daily`;
  } catch (err) {
    console.error("[/] menu load failed:", err);
    unavailable = true;
  }

  if (unavailable) {
    return (
      <main className="container-page py-16 max-w-2xl text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          The Breakroom
        </p>
        <h1 className="mt-3">Ordering is taking a quick break.</h1>
        <p className="mt-4 text-qh-ink-soft">
          Something on our end isn&#8217;t responding. Please try again in a
          minute, or come order at the counter.
        </p>
      </main>
    );
  }

  return <OrderApp menu={menu} open={open} hoursCopy={hoursCopy} maxQty={maxQty} source={source} />;
}
