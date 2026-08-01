"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearCart } from "@/lib/cart";
import { KIOSK_STORAGE_KEY, parseKioskValue } from "@/lib/kiosk";

// Kiosk mode, in one place.
//
// A "kiosk" here is any device the owner has switched on with ?kiosk=on —
// today a touchscreen on the counter, tomorrow the Raspberry Pi in the
// roadmap. The flag lives in localStorage, so it is per-device and totally
// invisible to everyone ordering from their phone: same URL, same app, same
// code paths, plus a session model that suits a screen strangers share.
//
// Everything kiosk-specific hangs off this context: the on-screen keyboard,
// the idle reset, the attract screen, the staff exit, and the handful of
// places the customer UI reads `kiosk` to make a different choice (no link
// off to the main site, no phone required, a big confirmation instead of a
// live order tracker).

export type KioskContextValue = {
  /** True only on a device that has been switched into kiosk mode. */
  kiosk: boolean;
  /** False until the stored flag has been read — SSR and first paint. */
  ready: boolean;
  /**
   * Bumped on every session reset. Screens holding customer state watch this
   * and drop it; anything derived from the URL is handled by the navigation
   * that accompanies the bump.
   */
  resetToken: number;
  /** True while the "tap to order" screen is covering the app. */
  attract: boolean;
  /** End the current customer's session: wipe the cart, return to the menu. */
  endSession: () => void;
  /** Clear the attract screen — the next customer has walked up. */
  beginSession: () => void;
  /** Leave kiosk mode on this device (staff exit). */
  exitKiosk: () => void;
};

const KioskContext = createContext<KioskContextValue>({
  kiosk: false,
  ready: false,
  resetToken: 0,
  attract: false,
  endSession: () => {},
  beginSession: () => {},
  exitKiosk: () => {},
});

export function useKiosk(): KioskContextValue {
  return useContext(KioskContext);
}

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [kiosk, setKiosk] = useState(false);
  const [ready, setReady] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [attract, setAttract] = useState(false);

  // endSession is called from timers; keep it stable by reading the path
  // through a ref instead of taking it as a dependency.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // ?kiosk=on|off updates the sticky flag. Read straight off the location
  // rather than through useSearchParams: the param is only ever typed into a
  // URL bar (a full page load), so this needs no Suspense boundary and can't
  // opt any page out of static rendering.
  useEffect(() => {
    let on = false;
    try {
      const change = parseKioskValue(
        new URLSearchParams(window.location.search).get("kiosk")
      );
      if (change === "on") localStorage.setItem(KIOSK_STORAGE_KEY, "1");
      if (change === "off") localStorage.removeItem(KIOSK_STORAGE_KEY);
      on = localStorage.getItem(KIOSK_STORAGE_KEY) === "1";
    } catch {
      // Storage unavailable (privacy mode) — kiosk mode stays off.
    }
    setKiosk(on);
    setReady(true);
    // A kiosk that boots into the menu should greet the next customer with
    // the attract screen, not with wherever the browser last left off. A
    // deep link (an order confirmation after a crash-restart) is left alone.
    if (on && pathRef.current === "/") setAttract(true);
  }, []);

  // Lets CSS restyle the whole app for arm's-length touch use.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("kiosk", kiosk);
    return () => root.classList.remove("kiosk");
  }, [kiosk]);

  const endSession = useCallback(() => {
    clearCart();
    setResetToken((t) => t + 1);
    setAttract(true);
    window.scrollTo({ top: 0 });
    if (pathRef.current !== "/") router.replace("/");
    // The menu is force-dynamic so sold-out changes land immediately; refresh
    // makes sure the next customer gets today's menu, not a cached payload.
    router.refresh();
  }, [router]);

  const beginSession = useCallback(() => setAttract(false), []);

  const exitKiosk = useCallback(() => {
    try {
      localStorage.removeItem(KIOSK_STORAGE_KEY);
    } catch {
      // Nothing to clear if storage is unavailable.
    }
    clearCart();
    setKiosk(false);
    setAttract(false);
    setResetToken((t) => t + 1);
  }, []);

  const value = useMemo(
    () => ({ kiosk, ready, resetToken, attract, endSession, beginSession, exitKiosk }),
    [kiosk, ready, resetToken, attract, endSession, beginSession, exitKiosk]
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
