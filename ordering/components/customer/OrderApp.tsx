"use client";

import { useEffect, useState } from "react";
import { CartSheet } from "./CartSheet";
import { CheckoutSheet } from "./CheckoutSheet";
import { ItemSheet } from "./ItemSheet";
import { MenuList } from "./MenuList";
import {
  cartCount,
  cartSubtotal,
  lineKey,
  loadCart,
  saveCart,
  type CartLine,
} from "@/lib/cart";
import { formatCents } from "@/lib/money";
import type { MenuItem, OrderSource } from "@/lib/types";

export function OrderApp({
  menu,
  open,
  hoursCopy,
  maxQty,
  source,
}: {
  menu: MenuItem[];
  open: boolean;
  hoursCopy: string;
  maxQty: number;
  source: OrderSource;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [view, setView] = useState<null | "cart" | "checkout">(null);

  // Cart lives in localStorage; hydrate after mount to keep SSR markup stable.
  useEffect(() => {
    setCart(loadCart());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveCart(cart);
  }, [cart, hydrated]);

  const addLine = (line: CartLine) => {
    setCart((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key
            ? { ...l, quantity: Math.min(maxQty, l.quantity + line.quantity) }
            : l
        );
      }
      return [...prev, line];
    });
    setActiveItem(null);
  };

  const changeQty = (key: string, quantity: number) => {
    setCart((prev) =>
      quantity < 1
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
    );
  };

  const removeLine = (key: string) =>
    setCart((prev) => prev.filter((l) => lineKey(l) !== key));

  const count = cartCount(cart);

  return (
    <div className="min-h-dvh pb-28">
      <header className="border-b border-qh-line bg-qh-bg-elevated">
        <div className="container-page flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-qh-accent">
              The Breakroom · Bothell
            </p>
            <h1 className="text-2xl leading-none">Order ahead.</h1>
          </div>
          <a
            href="https://breakroombothell.com"
            className="text-sm text-qh-ink-soft underline underline-offset-2 hover:text-qh-accent"
          >
            Main site
          </a>
        </div>
      </header>

      <main className="container-page py-8">
        {open ? (
          <p className="mb-6 rounded-xl border border-qh-line bg-qh-bg-elevated px-4 py-3 text-sm text-qh-ink-soft">
            Build your order, verify your number, and{" "}
            <span className="font-medium text-qh-ink">pay at the register</span>{" "}
            when you pick up. Prices shown are before tax.
          </p>
        ) : (
          <div className="mb-6 rounded-xl border border-qh-accent/30 bg-qh-accent-soft/30 px-4 py-4">
            <p className="font-medium">Online ordering is closed right now.</p>
            <p className="mt-1 text-sm text-qh-ink-soft">
              We take online orders {hoursCopy}. The menu&#8217;s below for
              browsing — see you soon!
            </p>
          </div>
        )}

        <MenuList menu={menu} interactive={open} onPick={setActiveItem} />
      </main>

      {open && count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-qh-line bg-qh-bg-elevated/95 backdrop-blur">
          <div className="container-page py-3">
            <button
              className="btn btn-primary btn-lg w-full justify-between"
              onClick={() => setView("cart")}
            >
              <span>
                View order · {count} {count === 1 ? "item" : "items"}
              </span>
              <span className="font-mono">{formatCents(cartSubtotal(cart))}</span>
            </button>
          </div>
        </div>
      ) : null}

      {activeItem && open ? (
        <ItemSheet
          item={activeItem}
          maxQty={maxQty}
          onAdd={addLine}
          onClose={() => setActiveItem(null)}
        />
      ) : null}

      {view === "cart" ? (
        <CartSheet
          lines={cart}
          maxQty={maxQty}
          onChangeQty={changeQty}
          onRemove={removeLine}
          onCheckout={() => setView("checkout")}
          onClose={() => setView(null)}
        />
      ) : null}

      {view === "checkout" ? (
        <CheckoutSheet lines={cart} source={source} onClose={() => setView("cart")} />
      ) : null}
    </div>
  );
}
