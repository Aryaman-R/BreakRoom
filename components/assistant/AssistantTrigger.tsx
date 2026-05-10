"use client";

import { useAssistant } from "./AssistantContext";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ASSIST_PAGES = ["/menu", "/visit", "/book"];

/**
 * Small coffee-cup icon in the top nav. Pulses subtly when the user has been
 * idle for 20+ seconds on a page where the assistant is likely to help.
 *
 * `dark` mirrors the nav's light-on-dark state so the hover background matches.
 */
export function AssistantTrigger({ dark = false }: { dark?: boolean }) {
  const { toggle } = useAssistant();
  const pathname = usePathname() ?? "/";
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(false);
    if (!ASSIST_PAGES.some((p) => pathname.startsWith(p))) return;

    const id = setTimeout(() => setPulse(true), 20_000);
    const reset = () => {
      setPulse(false);
      clearTimeout(id);
    };
    window.addEventListener("pointerdown", reset, { once: true });
    window.addEventListener("keydown", reset, { once: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [pathname]);

  return (
    <button
      type="button"
      aria-label="Ask Beans"
      onClick={toggle}
      className={clsx(
        "h-10 w-10 inline-flex items-center justify-center rounded-full transition-colors",
        // Icon color inherits from the nav header (currentColor)
        dark ? "hover:bg-ah-cream/10" : "hover:bg-qh-line/60",
        pulse && "nav-bean-pulse"
      )}
    >
      <CupIcon />
    </button>
  );
}

function CupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 9 H17 V15 A4 4 0 0 1 13 19 H9 A4 4 0 0 1 5 15 Z"
            stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 11 H19 A2 2 0 0 1 21 13 V14 A2 2 0 0 1 19 16 H17"
            stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 5 C 8 6, 10 7, 9 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 4 C 12 5, 14 6, 13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
