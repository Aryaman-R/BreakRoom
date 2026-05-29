"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, formatCents } from "@/lib/cart";

/**
 * Global slide-in cart. Mounted once in the root layout. Mode A styling —
 * ordering coffee should feel as calm as the rest of the daytime site.
 */
export function CartDrawer() {
  const { isOpen, close, lines, subtotalCents, setQuantity, remove, count } =
    useCart();

  // Escape to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[80] bg-qh-ink/30 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-label="Your order"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 z-[81] h-[100dvh] w-full sm:w-[420px] sm:max-w-[calc(100vw-2rem)] flex flex-col bg-qh-bg-elevated border-l border-qh-line shadow-lifted"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-qh-line">
              <div>
                <p className="font-display text-xl">Your order</p>
                <p className="text-xs text-qh-ink-soft mt-0.5">
                  Pay ahead, skip the line.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close order"
                className="h-9 w-9 rounded-full hover:bg-qh-line/60 inline-flex items-center justify-center"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-qh-ink-soft gap-3 py-16">
                  <p className="font-display text-lg text-qh-ink">Nothing here yet</p>
                  <p className="text-sm max-w-[26ch]">
                    Add a coffee or a pastry from the menu and it&#8217;ll show up here.
                  </p>
                  <Link
                    href="/menu"
                    onClick={close}
                    className="mt-2 rounded-full border border-qh-ink px-4 py-2 text-sm text-qh-ink hover:bg-qh-ink hover:text-qh-bg transition-colors"
                  >
                    Browse the menu
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li key={line.id} className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-display leading-tight"
                          dangerouslySetInnerHTML={{ __html: line.name }}
                        />
                        <p className="text-xs text-qh-ink-soft font-mono mt-0.5">
                          {formatCents(Math.round(line.price * 100))} each
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          className="mt-1 text-xs text-qh-ink-soft underline hover:text-qh-accent"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-mono text-sm text-qh-ink">
                          {formatCents(Math.round(line.price * 100) * line.quantity)}
                        </span>
                        <Stepper
                          value={line.quantity}
                          onChange={(q) => setQuantity(line.id, q)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-qh-line px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-qh-ink-soft">
                    Subtotal · {count} item{count === 1 ? "" : "s"}
                  </span>
                  <span className="font-mono text-qh-ink">
                    {formatCents(subtotalCents)}
                  </span>
                </div>
                <Link
                  href="/order"
                  onClick={close}
                  className="block w-full text-center rounded-full bg-qh-ink text-qh-bg px-5 py-3 text-sm font-medium hover:bg-qh-accent transition-colors"
                >
                  Checkout
                </Link>
                <p className="text-[11px] text-qh-ink-soft text-center">
                  Taxes shown at checkout. Pickup only.
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-qh-line">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
        className="h-8 w-8 inline-flex items-center justify-center text-qh-ink-soft hover:text-qh-ink"
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-mono text-qh-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
        className="h-8 w-8 inline-flex items-center justify-center text-qh-ink-soft hover:text-qh-ink"
      >
        ＋
      </button>
    </div>
  );
}
