"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Returns true when any element marked `data-nav-backdrop="dark"` is currently
 * intersecting the top strip of the viewport (where the sticky nav lives).
 *
 * Sections that should force the nav into light-on-dark mode add the attribute:
 *
 *   <section data-nav-backdrop="dark">…</section>
 *
 * Re-queries on each route change so dynamic pages pick up new sections — the
 * comment used to say so while the dependency array held only `navHeightPx`,
 * so the observer was built once against the first page's DOM and never
 * rebuilt. After any client-side navigation it was watching detached nodes:
 * the nav kept whatever colour it had and stopped reacting entirely.
 *
 * Also rebuilds on resize, because `rootMargin` is derived from
 * `window.innerHeight` and a stale value points the observation strip at the
 * wrong part of the viewport (notably on mobile when the URL bar collapses).
 */
export function useNavBackdrop(navHeightPx = 68): boolean {
  const [onDark, setOnDark] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const connect = () => {
      observer?.disconnect();

      const elements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-nav-backdrop="dark"]')
      );
      if (elements.length === 0) {
        setOnDark(false);
        return;
      }

      const intersecting = new Set<Element>();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) intersecting.add(entry.target);
            else intersecting.delete(entry.target);
          }
          setOnDark(intersecting.size > 0);
        },
        {
          // Only the top `navHeightPx` strip of the viewport counts as
          // "behind the nav". The huge negative bottom margin shrinks the
          // observation root to that strip.
          rootMargin: `0px 0px -${Math.max(0, window.innerHeight - navHeightPx)}px 0px`,
          threshold: 0,
        }
      );
      elements.forEach((el) => observer!.observe(el));
    };

    connect();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(connect, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [navHeightPx, pathname]);

  return onDark;
}
