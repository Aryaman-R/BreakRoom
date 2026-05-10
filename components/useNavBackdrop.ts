"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when any element marked `data-nav-backdrop="dark"` is currently
 * intersecting the top strip of the viewport (where the sticky nav lives).
 *
 * Sections that should force the nav into light-on-dark mode add the attribute:
 *
 *   <section data-nav-backdrop="dark">…</section>
 *
 * Re-queries on each route change so dynamic pages pick up new sections.
 */
export function useNavBackdrop(navHeightPx = 68): boolean {
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-nav-backdrop="dark"]')
    );
    if (elements.length === 0) {
      setOnDark(false);
      return;
    }

    const intersecting = new Set<Element>();
    const observer = new IntersectionObserver(
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
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navHeightPx]);

  return onDark;
}
