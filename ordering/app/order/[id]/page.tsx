"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { formatCents } from "@/lib/money";
import type { PublicOrder } from "@/lib/types";

const POLL_MS = 5000;

const STEPS = [
  { label: "Received", reached: ["new", "call_to_confirm", "accepted", "ready", "picked_up"] },
  { label: "Accepted", reached: ["accepted", "ready", "picked_up"] },
  { label: "Ready", reached: ["ready", "picked_up"] },
  { label: "Picked up", reached: ["picked_up"] },
];

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stale, setStale] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setOrder((await res.json()) as PublicOrder);
      setStale(false);
    } catch {
      // transient network/server issue — keep showing the last known state
      setStale(true);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
    const t = setInterval(fetchOrder, POLL_MS);
    return () => clearInterval(t);
  }, [fetchOrder]);

  if (notFound) {
    return (
      <Shell>
        <h1 className="mt-3">Order not found.</h1>
        <p className="mt-4 text-qh-ink-soft">
          Double-check the link from your confirmation, or{" "}
          <a href="/" className="text-qh-accent underline underline-offset-2">
            start a new order
          </a>
          .
        </p>
      </Shell>
    );
  }

  if (!order) {
    return (
      <Shell>
        <p className="mt-8 animate-pulse text-qh-ink-soft">Loading your order…</p>
      </Shell>
    );
  }

  const terminalBad = order.status === "cancelled" || order.status === "no_show";

  return (
    <Shell>
      <p className="text-sm text-qh-ink-soft">Your order number</p>
      <p className="font-display text-[5rem] leading-none tracking-tighter2">
        #{order.order_number}
      </p>

      {order.status === "call_to_confirm" ? (
        <div className="mt-4 rounded-xl border border-qh-accent/30 bg-qh-accent-soft/30 px-4 py-3">
          📞 <span className="font-medium">We&#8217;ll give you a quick call to
          confirm this one.</span>{" "}
          <span className="text-sm text-qh-ink-soft">
            Larger orders get a quick check before we fire the kitchen.
          </span>
        </div>
      ) : null}

      {terminalBad ? (
        <div className="mt-6 rounded-xl border border-qh-line bg-qh-bg-elevated px-4 py-4">
          <p className="font-medium">
            {order.status === "cancelled"
              ? "This order was cancelled."
              : "This order was marked as not picked up."}
          </p>
          <p className="mt-1 text-sm text-qh-ink-soft">
            Questions? Give us a call or ask at the counter.
          </p>
        </div>
      ) : (
        <ol className="mt-8 space-y-0">
          {STEPS.map((step, i) => {
            const done = step.reached.includes(order.status);
            const isCurrent =
              done && (i === STEPS.length - 1 || !STEPS[i + 1].reached.includes(order.status));
            return (
              <li key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                      done
                        ? "border-qh-sage bg-qh-sage text-white"
                        : "border-qh-line bg-qh-bg-elevated text-qh-ink-soft"
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span
                      className={clsx(
                        "w-px flex-1 min-h-6",
                        done ? "bg-qh-sage" : "bg-qh-line"
                      )}
                    />
                  ) : null}
                </div>
                <div className="pb-6">
                  <p className={clsx("font-medium", !done && "text-qh-ink-soft")}>
                    {step.label}
                    {isCurrent && order.status === "ready" ? " — come get it!" : ""}
                  </p>
                  {isCurrent && order.status !== "picked_up" ? (
                    <p className="text-sm text-qh-ink-soft">
                      {order.status === "ready"
                        ? "Pay at the register when you arrive."
                        : "We'll text you when it's ready."}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="card mt-6 px-4 py-4">
        <h2 className="text-base font-medium">Order details</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span>
                  {item.quantity} × {item.item_name}
                  {item.variant_label ? ` (${item.variant_label})` : ""}
                </span>
                <span className="dotted-leader" aria-hidden="true" />
                <span className="shrink-0 font-mono">
                  {formatCents(item.price_cents * item.quantity)}
                </span>
              </div>
              {item.addons.length > 0 ? (
                <p className="text-qh-ink-soft">
                  + {item.addons.map((a) => a.label).join(", ")}
                </p>
              ) : null}
              {item.notes ? (
                <p className="italic text-qh-ink-soft">&#8220;{item.notes}&#8221;</p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-qh-line pt-3">
          <span className="font-medium">Total</span>
          <span className="font-mono">{formatCents(order.total_cents)}</span>
        </div>
        <p className="mt-1 text-right text-sm text-qh-ink-soft">
          plus tax — pay at the register
        </p>
      </div>

      {stale ? (
        <p className="mt-4 text-center text-xs text-qh-ink-soft">
          Reconnecting… status may be a moment behind.
        </p>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="container-page max-w-xl py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-qh-accent">
        The Breakroom · Bothell
      </p>
      {children}
    </main>
  );
}
