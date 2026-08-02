"use client";

import { useEffect, useState } from "react";
import { localNow, openState, type OpenState } from "@/lib/business";

/**
 * Anything derived from "now" has to be computed after mount.
 *
 * This site is a static export: every page is rendered once at build time and
 * served as frozen HTML. A `new Date()` evaluated during render is therefore
 * the *build* date, not the visitor's — which is how the /visit table ended up
 * highlighting whichever weekday the site was last deployed on, and how the
 * footer's copyright year would have gone stale on January 1st.
 *
 * These hooks return `null` on the server and on the first client render (so
 * markup matches and React does not warn), then fill in the real value.
 * Callers render a neutral fallback for `null`.
 */

/** Cafe-local weekday, 0 = Sunday. `null` until mounted. */
export function useLocalDay(): number | null {
  const [day, setDay] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDay(localNow().day);
    tick();
    // Re-check hourly so a tab left open overnight rolls over.
    const id = setInterval(tick, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return day;
}

/** Live open/closed state. `null` until mounted. */
export function useOpenState(): OpenState | null {
  const [state, setState] = useState<OpenState | null>(null);

  useEffect(() => {
    const tick = () => setState(openState());
    tick();
    // A minute is fine — this only ever flips on the half hour.
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}

/** Current year, computed after mount so a static build cannot freeze it. */
export function useCurrentYear(): number | null {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return year;
}
