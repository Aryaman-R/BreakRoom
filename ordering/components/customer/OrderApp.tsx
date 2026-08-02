"use client";

import { useEffect, useState } from "react";
import { CartSheet } from "./CartSheet";
import { CheckoutSheet } from "./CheckoutSheet";
import { ItemSheet } from "./ItemSheet";
import { MenuList } from "./MenuList";
import { KioskAttract } from "@/components/kiosk/KioskAttract";
import { useKiosk } from "@/components/kiosk/KioskProvider";
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
  allowWalkin,
  source,
}: {
  menu: MenuItem[];
  open: boolean;
  hoursCopy: string;
  maxQty: number;
  /** Whether the kiosk may take an order without a phone number. */
  allowWalkin: boolean;
  source: OrderSource;
}) {
  const { kiosk, ready, attract, resetToken, endSession } = useKiosk();
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

  // A kiosk session ended — idle timeout, "start over", or an order placed.
  // The provider has already wiped stored state; drop the in-memory copy and
  // every open sheet so the next customer starts from a blank screen.
  useEffect(() => {
    if (resetToken === 0) return;
    setCart([]);
    setActiveItem(null);
    setView(null);
  }, [resetToken]);

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
  // The kiosk knows what it is; the server only ever sees web-vs-QR.
  const effectiveSource: OrderSource = kiosk ? "kiosk" : source;

  return (
    <div className="min-h-dvh pb-28">
      <header className="border-b border-qh-line bg-qh-bg-elevated">
        <div className="container-page flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-qh-accent">
              The Breakroom · Bothell
            </p>
            <h1 className="text-2xl leading-none">
              {kiosk ? "Order here." : "Order ahead."}
            </h1>
          </div>
          {/* Nothing here until we know which device this is.
              `kiosk` is false on the server and on the first client render,
              because the flag lives in localStorage and cannot be read until
              after mount — so a kiosk painted the public build first, offering
              a one-way link off to the marketing site on hardware with no back
              button. That is precisely what "the kiosk never navigates
              off-app" exists to prevent. An empty slot for one frame is the
              honest answer; the header keeps its height either way. */}
          {!ready ? null : kiosk ? (
            // Never link a kiosk off to another site — there's no back button
            // on locked-down hardware. Offer the escape hatch that a shared
            // screen actually needs instead.
            <button
              className="btn btn-quiet btn-sm"
              onClick={endSession}
              aria-label="Clear this order and start over"
            >
              Start over
            </button>
          ) : (
            <a
              href="https://breakroombothell.com"
              className="text-sm text-qh-ink-soft underline underline-offset-2 hover:text-qh-accent"
            >
              Main site
            </a>
          )}
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
        <CheckoutSheet
          lines={cart}
          source={effectiveSource}
          allowWalkin={kiosk && allowWalkin}
          onClose={() => setView("cart")}
        />
      ) : null}

      {kiosk && attract ? <KioskAttract open={open} hoursCopy={hoursCopy} /> : null}
    </div>
  );
}
