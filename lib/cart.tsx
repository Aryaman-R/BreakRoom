"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartLine {
  id: string;
  name: string;
  price: number; // unit price in dollars
  quantity: number;
}

export const MAX_PER_ITEM = 20;

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  hydrated: boolean;
  add: (item: { id: string; name: string; price: number }) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tbr-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't clobber stored data).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode) — fail quietly */
    }
  }, [lines, hydrated]);

  const add = useCallback((item: { id: string; name: string; price: number }) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.id === item.id
            ? { ...l, quantity: Math.min(MAX_PER_ITEM, l.quantity + 1) }
            : l
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) =>
            l.id === id ? { ...l, quantity: Math.min(MAX_PER_ITEM, quantity) } : l
          )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotalCents = lines.reduce(
    (s, l) => s + Math.round(l.price * 100) * l.quantity,
    0
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotalCents,
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((o) => !o),
    }),
    [lines, count, subtotalCents, hydrated, add, setQuantity, remove, clear, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/** Format a cents amount as USD. */
export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
