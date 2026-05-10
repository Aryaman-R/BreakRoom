/**
 * Colored wipe page transition.
 * A single full-screen panel scales up from a click point to cover the viewport,
 * then resolves so the destination route can render underneath.
 *
 * Stays simple: pure DOM, no framework coupling. If `prefers-reduced-motion` is
 * set, the caller should skip this entirely.
 */

export interface ColorWipeOpts {
  x: number;
  y: number;
  color?: string;
  durationMs?: number;
}

export function colorWipeIn({
  x,
  y,
  color = "#FF3D8A",
  durationMs = 480,
}: ColorWipeOpts): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 24px;
      height: 24px;
      border-radius: 9999px;
      background: ${color};
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 9999;
      transition: transform ${durationMs}ms cubic-bezier(0.7, 0, 0.3, 1);
      will-change: transform;
    `;
    document.body.appendChild(el);

    // Compute the scale needed to cover the viewport from this point.
    const farX = Math.max(x, window.innerWidth - x);
    const farY = Math.max(y, window.innerHeight - y);
    const radius = Math.hypot(farX, farY);
    const targetScale = (radius * 2) / 24 + 1;

    requestAnimationFrame(() => {
      el.style.transform = `translate(-50%, -50%) scale(${targetScale})`;
    });

    const cleanup = () => {
      // Hold the cover for a beat so the next route mounts behind it,
      // then fade it away. The route push happens right after this resolves.
      setTimeout(() => {
        el.style.transition = `opacity 320ms ease`;
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 360);
      }, 200);
      resolve();
    };

    el.addEventListener("transitionend", cleanup, { once: true });
    // Failsafe in case transitionend never fires.
    setTimeout(cleanup, durationMs + 80);
  });
}
