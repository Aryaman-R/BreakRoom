"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sets `data-mode` on <body> based on the current route.
 * `/book` is Mode B (After Hours); everything else is Mode A (Quiet Hours).
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

  return <>{children}</>;
}
