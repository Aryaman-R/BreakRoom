"use client";

import clsx from "clsx";
import { useCart } from "@/lib/cart";

/**
 * Cart trigger for the top nav. Shows a count badge and opens the drawer.
 * Hidden until there's at least one item so it never clutters the calm
 * Mode A nav for browsers who aren't ordering.
 */
export function CartButton({ dark }: { dark: boolean }) {
  const { count, toggle, hydrated } = useCart();

  if (!hydrated || count === 0) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Open your order (${count} item${count === 1 ? "" : "s"})`}
      className={clsx(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        dark ? "hover:bg-ah-cream/10 text-ah-cream" : "hover:bg-qh-line/60 text-qh-ink"
      )}
    >
      <BagIcon />
      <span
        className={clsx(
          "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-medium inline-flex items-center justify-center",
          dark ? "bg-ah-electric text-ah-bg" : "bg-qh-accent text-qh-bg"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
