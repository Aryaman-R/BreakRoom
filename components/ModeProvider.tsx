"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";

/**
 * Sets `data-mode` on <body> based on the current route.
 * `/book` is Mode B (After Hours); everything else is Mode A (Quiet Hours).
 *
 * The first paint is handled by an inline script in app/layout.tsx; this hook
 * keeps it correct across client-side navigations.
 *
 * Also the single place motion preferences are honoured. The reduced-motion
 * block in globals.css only reaches CSS animations and transitions — every
 * framer-motion animation on this site is a JS-driven inline transform, so the
 * media query could not touch them and a visitor who had asked their OS for
 * less motion still got the full parallax, slide-ins, and word-by-word
 * headline. `reducedMotion="user"` makes every motion component in the tree
 * respect that setting.
 *
 * Future: extend with section-level overrides driven by IntersectionObserver
 * (used on the home page's "after hours" transition).
 */
export function ModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isAfterHours = pathname?.startsWith("/book");
    document.body.dataset.mode = isAfterHours ? "after-hours" : "quiet-hours";
  }, [pathname]);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
