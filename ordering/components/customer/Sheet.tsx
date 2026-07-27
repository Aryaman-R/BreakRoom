"use client";

import { useEffect } from "react";

// Bottom sheet on phones, centered dialog on bigger screens.
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="kiosk-lift fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-qh-ink/40"
        onClick={onClose}
      />
      <div className="kiosk-sheet-panel relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-qh-bg-elevated shadow-lifted">
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
