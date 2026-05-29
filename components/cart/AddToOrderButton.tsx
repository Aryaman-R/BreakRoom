"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

/**
 * Small "Add to order" control shown on each menu row.
 * Briefly confirms the add, then resets.
 */
export function AddToOrderButton({
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        add({ id, name, price });
        setAdded(true);
      }}
      aria-label={`Add ${name.replace(/&#8217;/g, "'")} to your order`}
      className="shrink-0 inline-flex items-center gap-1 rounded-full border border-qh-line px-3 py-1 text-xs text-qh-ink-soft hover:text-qh-ink hover:border-qh-accent transition-colors min-h-9"
    >
      {added ? (
        <>Added&nbsp;✓</>
      ) : (
        <>
          <span aria-hidden className="text-sm leading-none">＋</span>
          Add
        </>
      )}
    </button>
  );
}
