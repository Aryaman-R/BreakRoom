"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import clsx from "clsx";

type Size = "sm" | "md" | "lg";

interface Props {
  size?: Size;
  className?: string;
  label?: string;
  href?: string;
}

/**
 * The signature Book a Party button.
 *
 * The CSS does most of the heavy lifting (see globals.css §4 — book-btn).
 * React adds:
 *   - click-position confetti burst
 *   - colored wipe page transition (via lib/transitions/colorWipe)
 *   - press-down scale (CSS :active handles the visual; React only times the wipe)
 *
 * Reduced motion: the wipe falls back to a simple programmatic fade and the
 * confetti library is only loaded when motion is allowed.
 */
export function BookPartyButton({
  size = "md",
  className,
  label = "Book a party",
  href = "/book",
}: Props) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    // Allow modifier-clicks (open in new tab, etc.) to behave naturally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rect = ref.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    if (!reduced) {
      // Fire confetti from the button center.
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 30,
        spread: 70,
        startVelocity: 32,
        ticks: 60,
        origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
        colors: ["#FF3D8A", "#FF8C42", "#FFE066", "#6EE7B7", "#A78BFA"],
      });

      // Colored wipe transition.
      const { colorWipeIn } = await import("@/lib/transitions/colorWipe");
      await colorWipeIn({ x: cx, y: cy, color: "#FF3D8A" });
    }

    router.push(href);
  };

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      className={clsx("book-btn", `book-btn--${size}`, className)}
      data-book-btn="true"
    >
      <span className="book-btn__bg" aria-hidden="true" />
      <span className="book-btn__label">{label}</span>
      <span className="book-btn__sparkles" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </span>
    </Link>
  );
}
