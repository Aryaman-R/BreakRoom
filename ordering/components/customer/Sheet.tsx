"use client";

import { useEffect, useRef } from "react";

// Bottom sheet on phones, centered dialog on bigger screens. Every customer
// decision happens inside one of these — item options, the cart, checkout —
// so it behaves like a real modal dialog: focus moves in, Tab stays in, and
// focus goes back where it came from on close.
//
// The Tab trap is implemented on keydown only, never by re-focusing on
// focusout. The kiosk keyboard deliberately cancels pointerdown to keep the
// caret in the field it's typing into, and a focusout-based trap fights that
// for control of focus every time a key is pressed.

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Land on the panel itself rather than the first control: a screen reader
    // then announces the dialog and its title before anything else, and no
    // half-made choice is focused by surprise.
    panel.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const stops = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (stops.length === 0) {
        e.preventDefault();
        panel.current.focus({ preventScroll: true });
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      // Wrap at both ends, and pull focus back in if it has escaped to the
      // page behind (which is what happens on the very first Tab from the
      // panel itself).
      if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      // Closing the cart should return you to the button that opened it, not
      // dump you at the top of the page. When one sheet replaces another
      // (checkout → cart) React runs this cleanup before the new sheet's
      // effect, so the incoming panel still wins the focus.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div
      className="kiosk-lift fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Click-catcher, not a control: the ✕ button and Escape are the
          accessible ways out, and a full-screen "Close" button at the head of
          the tab order only ever confuses a screen-reader user. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-qh-ink/40"
        onClick={onClose}
      />
      <div
        ref={panel}
        tabIndex={-1}
        className="kiosk-sheet-panel relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-qh-bg-elevated shadow-lifted outline-none"
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-qh-line bg-qh-bg-elevated px-5 py-4">
          <h2 className="text-lg font-display tracking-tightish">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-qh-line px-3 py-1 text-sm text-qh-ink-soft hover:border-qh-ink-soft"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
