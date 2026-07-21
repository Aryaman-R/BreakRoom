"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrderCard, type StaffOrder } from "./OrderCard";
import { useChime } from "./useChime";
import { browserClient } from "@/lib/supabase/browser";
import type { OrderStatus } from "@/lib/types";

const POLL_FALLBACK_MS = 10_000;

const OPEN_STATUSES: OrderStatus[] = ["new", "call_to_confirm", "accepted", "ready"];

const GROUPS: Array<{ title: string; statuses: OrderStatus[] }> = [
  { title: "Needs attention", statuses: ["new", "call_to_confirm"] },
  { title: "In the kitchen", statuses: ["accepted"] },
  { title: "Ready — waiting on pickup", statuses: ["ready"] },
];

export function StaffScreen() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(false);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const needsAttention = orders.some(
    (o) => o.status === "new" || o.status === "call_to_confirm"
  );
  const { enabled: soundOn, enable: enableSound } = useChime(needsAttention);

  const fetchOrders = useCallback(async () => {
    const db = browserClient();
    // Today's orders plus anything older that's still open.
    const utcToday = new Date().toISOString().slice(0, 10);
    const { data, error: err } = await db
      .from("orders")
      .select("*, order_items (*)")
      .or(`order_date.eq.${utcToday},status.in.(${OPEN_STATUSES.join(",")})`)
      .order("created_at", { ascending: true });
    if (err) {
      setError("Can't reach the database — retrying…");
      return;
    }
    setError(null);
    setOrders((data ?? []) as StaffOrder[]);
    setLoaded(true);
  }, []);

  // Realtime with a polling fallback; a clock tick keeps the "Xm ago" fresh.
  useEffect(() => {
    fetchOrders();
    const db = browserClient();
    const channel = db
      .channel("staff-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    const poll = setInterval(fetchOrders, POLL_FALLBACK_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      db.removeChannel(channel);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [fetchOrders]);

  const transition = useCallback(
    async (order: StaffOrder, to: OrderStatus, confirmText?: string) => {
      if (confirmText && !window.confirm(confirmText)) return;
      setBusyId(order.id);
      try {
        const res = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: to }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "That didn't save — try again.");
        }
      } catch {
        setError("Network hiccup — try again.");
      } finally {
        setBusyId(null);
        fetchOrders();
      }
    },
    [fetchOrders]
  );

  const signOut = async () => {
    await browserClient().auth.signOut();
    window.location.assign("/login");
  };

  const done = orders.filter((o) => !OPEN_STATUSES.includes(o.status));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-qh-line bg-qh-bg-elevated/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl leading-none">Orders</h1>
            <span
              className={`h-2.5 w-2.5 rounded-full ${live ? "bg-qh-sage" : "bg-qh-line"}`}
              title={live ? "Live updates connected" : "Polling every 10s"}
            />
          </div>
          <div className="flex items-center gap-2">
            {!soundOn ? (
              <button className="btn btn-accent btn-sm" onClick={enableSound}>
                🔔 Enable sound
              </button>
            ) : null}
            <a href="/admin" className="btn btn-quiet btn-sm">
              Admin
            </a>
            <button className="btn btn-quiet btn-sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-6">
        {error ? (
          <p role="alert" className="mb-4 rounded-lg bg-[#f9e6ea] px-3 py-2 text-sm text-[#a4283d]">
            {error}
          </p>
        ) : null}

        {!loaded ? (
          <p className="py-12 text-center text-qh-ink-soft">Loading orders…</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {GROUPS.map((group) => {
              const groupOrders = orders.filter((o) => group.statuses.includes(o.status));
              return (
                <section key={group.title}>
                  <h2 className="text-lg">
                    {group.title}
                    <span className="ml-2 font-mono text-sm text-qh-ink-soft">
                      {groupOrders.length}
                    </span>
                  </h2>
                  <div className="mt-3 space-y-3">
                    {groupOrders.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-qh-line px-4 py-6 text-center text-sm text-qh-ink-soft">
                        Nothing here right now.
                      </p>
                    ) : (
                      groupOrders.map((o) => (
                        <OrderCard
                          key={o.id}
                          order={o}
                          now={now}
                          busy={busyId === o.id}
                          onTransition={transition}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {loaded && done.length > 0 ? (
          <details className="mt-10">
            <summary className="cursor-pointer text-qh-ink-soft">
              Done today · {done.length}
            </summary>
            <ul className="mt-3 space-y-1 text-sm text-qh-ink-soft">
              {done
                .slice()
                .reverse()
                .map((o) => (
                  <li key={o.id} className="flex gap-3">
                    <span className="font-mono">#{o.order_number}</span>
                    <span>{o.customer_name}</span>
                    <span className="uppercase">{o.status.replace("_", " ")}</span>
                  </li>
                ))}
            </ul>
          </details>
        ) : null}
      </main>
    </div>
  );
}
