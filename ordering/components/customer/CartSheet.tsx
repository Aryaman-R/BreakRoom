"use client";

import { Sheet } from "./Sheet";
import { cartSubtotal, lineKey, type CartLine } from "@/lib/cart";
import { formatCents } from "@/lib/money";

export function CartSheet({
  lines,
  maxQty,
  onChangeQty,
  onRemove,
  onCheckout,
  onClose,
}: {
  lines: CartLine[];
  maxQty: number;
  onChangeQty: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Your order" onClose={onClose}>
      {lines.length === 0 ? (
        <p className="py-8 text-center text-qh-ink-soft">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {lines.map((line) => {
              const key = lineKey(line);
              return (
                <li key={key} className="border-b border-qh-line pb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{line.item_name}</span>
                    {line.variant_label ? (
                      <span className="text-sm text-qh-ink-soft">
                        · {line.variant_label}
                      </span>
                    ) : null}
                    <span className="dotted-leader" aria-hidden="true" />
                    <span className="shrink-0 font-mono text-sm">
                      {formatCents(line.unit_cents * line.quantity)}
                    </span>
                  </div>
                  {line.addon_labels.length > 0 ? (
                    <p className="mt-0.5 text-sm text-qh-ink-soft">
                      + {line.addon_labels.join(", ")}
                    </p>
                  ) : null}
                  {line.notes ? (
                    <p className="mt-0.5 text-sm italic text-qh-ink-soft">
                      &#8220;{line.notes}&#8221;
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      className="btn btn-quiet h-8 w-8 !rounded-full !p-0"
                      onClick={() => onChangeQty(key, line.quantity - 1)}
                      aria-label={`Fewer ${line.item_name}`}
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-mono text-sm">
                      {line.quantity}
                    </span>
                    <button
                      className="btn btn-quiet h-8 w-8 !rounded-full !p-0"
                      onClick={() => onChangeQty(key, Math.min(maxQty, line.quantity + 1))}
                      aria-label={`More ${line.item_name}`}
                    >
                      +
                    </button>
                    <button
                      className="ml-auto text-sm text-qh-ink-soft underline underline-offset-2 hover:text-qh-accent"
                      onClick={() => onRemove(key)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-baseline justify-between">
            <span className="font-medium">Subtotal</span>
            <span className="font-mono">{formatCents(cartSubtotal(lines))}</span>
          </div>
          <p className="mt-1 text-right text-sm text-qh-ink-soft">plus tax at pickup</p>

          <div className="mt-4 rounded-xl border border-qh-accent/30 bg-qh-accent-soft/30 px-4 py-3 text-sm">
            💳 <span className="font-medium">Pay at the register when you pick up.</span>{" "}
            No payment is taken online.
          </div>

          <button className="btn btn-accent btn-lg mt-5 w-full" onClick={onCheckout}>
            Check out
          </button>
        </>
      )}
    </Sheet>
  );
}
