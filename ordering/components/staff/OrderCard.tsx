"use client";

import clsx from "clsx";
import { formatCents } from "@/lib/money";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type StaffOrder = Order & { order_items: OrderItem[] };

const ACTIONS: Partial<
  Record<OrderStatus, Array<{ to: OrderStatus; label: string; kind: "primary" | "accent" | "quiet" | "danger"; confirm?: string }>>
> = {
  new: [
    { to: "accepted", label: "Accept", kind: "accent" },
    { to: "cancelled", label: "Cancel", kind: "danger", confirm: "Cancel this order?" },
  ],
  call_to_confirm: [
    { to: "accepted", label: "Accept", kind: "accent" },
    { to: "cancelled", label: "Cancel", kind: "danger", confirm: "Cancel this order?" },
  ],
  accepted: [
    { to: "ready", label: "Ready", kind: "primary" },
    { to: "cancelled", label: "Cancel", kind: "danger", confirm: "Cancel this order?" },
  ],
  ready: [
    { to: "picked_up", label: "Picked up", kind: "primary" },
    {
      to: "no_show",
      label: "No-show",
      kind: "danger",
      confirm: "Mark as no-show? Two no-shows blocks the phone number.",
    },
  ],
};

function age(iso: string, now: number): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function OrderCard({
  order,
  now,
  busy,
  onTransition,
}: {
  order: StaffOrder;
  now: number;
  busy: boolean;
  onTransition: (order: StaffOrder, to: OrderStatus, confirm?: string) => void;
}) {
  const needsAttention = order.status === "new" || order.status === "call_to_confirm";

  return (
    <article
      className={clsx(
        "card px-4 py-3",
        needsAttention && "border-qh-accent ring-2 ring-qh-accent/30"
      )}
    >
      <header className="flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl leading-none">#{order.order_number}</span>
        <span className="text-sm text-qh-ink-soft">{age(order.created_at, now)}</span>
      </header>

      <p className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-medium">{order.customer_name}</span>
        <span className="rounded-full border border-qh-line px-2 py-0.5 font-mono text-xs uppercase">
          {order.source}
        </span>
        {order.status === "call_to_confirm" ? (
          <span className="rounded-full bg-qh-accent px-2 py-0.5 text-xs font-medium text-white">
            📞 Call first — {order.phone}
          </span>
        ) : null}
      </p>

      <ul className="mt-3 space-y-2 border-t border-qh-line pt-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="text-sm leading-snug">
            <p className="font-medium">
              {item.quantity} × {item.item_name}
              {item.variant_label ? ` — ${item.variant_label}` : ""}
            </p>
            {item.addons.length > 0 ? (
              <p className="text-qh-ink-soft">
                + {item.addons.map((a) => a.label).join(", ")}
              </p>
            ) : null}
            {item.notes ? (
              <p className="text-qh-sage">✎ {item.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <footer className="mt-3 flex items-center justify-between gap-2 border-t border-qh-line pt-3">
        <span className="font-mono text-sm">{formatCents(order.total_cents)}</span>
        <div className="flex gap-2">
          {(ACTIONS[order.status] ?? []).map((a) => (
            <button
              key={a.to}
              disabled={busy}
              onClick={() => onTransition(order, a.to, a.confirm)}
              className={clsx("btn btn-sm", {
                "btn-primary": a.kind === "primary",
                "btn-accent": a.kind === "accent",
                "btn-quiet": a.kind === "quiet",
                "btn-danger": a.kind === "danger",
              })}
            >
              {a.label}
            </button>
          ))}
        </div>
      </footer>
    </article>
  );
}
