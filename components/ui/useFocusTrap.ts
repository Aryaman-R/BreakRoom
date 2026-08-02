"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Keeps Tab inside an open overlay and gives focus back when it closes.
 *
 * Both overlays on this site declared `aria-modal="true"` — a promise to
 * assistive tech that the rest of the page is inert — while doing nothing to
 * keep focus inside. Tabbing walked straight out into the page behind, and
 * closing dropped focus onto <body>, so a keyboard or screen-reader user had
 * to tab from the very top of the document to get back to where they were.
 *
 * @param ref       the overlay container
 * @param active    whether the overlay is open
 * @param onEscape  called on Escape, if provided
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    // Remember where focus came from so it can be handed back on close.
    const previous = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    // Move focus in, preferring whatever the overlay marked as the entry point.
    const initial =
      node.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0];
    initial?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;

      // Wrap at both ends, and pull focus back if it has escaped the overlay.
      if (e.shiftKey) {
        if (current === first || !node.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !node.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      // Only restore if focus is still somewhere in (or lost by) the overlay —
      // if the user has since clicked elsewhere, leave them alone.
      const activeNow = document.activeElement;
      if (!activeNow || activeNow === document.body || node.contains(activeNow)) {
        previous?.focus?.();
      }
    };
  }, [ref, active, onEscape]);
}
