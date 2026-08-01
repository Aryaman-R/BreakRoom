"use client";

import { useKiosk } from "@/components/kiosk/KioskProvider";

// Segment-level error boundary. The layout — and so the kiosk provider —
// stays mounted around it, which is why this can tell the two audiences
// apart. "Your cart is safe on this device" is reassuring on a phone and
// meaningless on a kiosk, where the right move is to hand the screen back.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { kiosk, endSession } = useKiosk();

  return (
    <main className="container-page max-w-md py-16 text-center">
      <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
        The Breakroom
      </p>
      <h1 className="mt-3">Something spilled.</h1>
      {kiosk ? (
        <>
          <p className="mt-4 text-qh-ink-soft">
            This screen hit a snag. Start again, or order at the counter —
            either way we&#8217;ll get you sorted.
          </p>
          <button
            className="btn btn-accent btn-lg mt-6"
            onClick={() => {
              endSession();
              reset();
            }}
          >
            Start a new order
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-qh-ink-soft">
            An unexpected error interrupted the page. Your cart is safe on this
            device.
          </p>
          <button className="btn btn-primary btn-md mt-6" onClick={reset}>
            Try again
          </button>
        </>
      )}
    </main>
  );
}
