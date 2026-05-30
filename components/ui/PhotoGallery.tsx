"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export interface GalleryPhoto {
  src: string;
  alt: string;
  /** Intrinsic pixel dimensions, used to size the lightbox image. */
  w: number;
  h: number;
  /** Thumbnail object-fit. Use "contain" for text-heavy/portrait signs that
   *  shouldn't be center-cropped. Defaults to "cover". */
  fit?: "cover" | "contain";
}

/**
 * Responsive photo grid with a click-to-enlarge lightbox.
 * Tiles are uniformly cropped (object-cover) unless a photo opts into "contain";
 * the lightbox shows the full frame. Keyboard: Esc closes, ←/→ step, Tab is
 * trapped within the dialog; focus returns to the originating tile on close.
 */
export function PhotoGallery({
  photos,
  className = "",
}: {
  photos: GalleryPhoto[];
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The tile that opened the lightbox, so we can restore focus on close.
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((i: number, el: HTMLElement) => {
    openerRef.current = el;
    setActive(i);
  }, []);
  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: number) =>
      setActive((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (active === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowRight") {
        step(1);
      } else if (e.key === "ArrowLeft") {
        step(-1);
      } else if (e.key === "Tab") {
        // Trap focus inside the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog on open.
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the tile that opened the lightbox.
      openerRef.current?.focus();
    };
  }, [active, close, step]);

  return (
    <>
      <ul className={clsx("grid gap-3 sm:gap-4", className)}>
        {photos.map((p, i) => (
          <li key={p.src}>
            <button
              type="button"
              onClick={(e) => open(i, e.currentTarget)}
              className={clsx(
                "group relative block w-full aspect-[4/3] rounded-2xl overflow-hidden border border-qh-line shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-qh-accent",
                p.fit === "contain" && "bg-qh-bg-elevated"
              )}
              aria-label={`Enlarge photo: ${p.alt}`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                className={clsx(
                  "transition-transform duration-500 group-hover:scale-105",
                  p.fit === "contain" ? "object-contain p-2" : "object-cover"
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-qh-ink/85 backdrop-blur-sm p-4 sm:p-8"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={photos[active].alt}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-qh-bg/90 text-qh-ink hover:bg-qh-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-qh-accent"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {photos.length > 1 && (
              <>
                <NavArrow side="left" onClick={(e) => { e.stopPropagation(); step(-1); }} />
                <NavArrow side="right" onClick={(e) => { e.stopPropagation(); step(1); }} />
              </>
            )}

            <motion.div
              key={photos[active].src}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[active].src}
                alt={photos[active].alt}
                width={photos[active].w}
                height={photos[active].h}
                className="h-auto w-auto max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-lifted"
              />
              <p className="mt-3 text-center text-sm text-qh-bg/80">{photos[active].alt}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={clsx(
        "absolute top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-qh-bg/90 text-qh-ink hover:bg-qh-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-qh-accent",
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      )}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        {side === "left" ? (
          <path d="M12 4L6 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ) : (
          <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        )}
      </svg>
    </button>
  );
}
