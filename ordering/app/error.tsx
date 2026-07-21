"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-page max-w-md py-16 text-center">
      <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
        The Breakroom
      </p>
      <h1 className="mt-3">Something spilled.</h1>
      <p className="mt-4 text-qh-ink-soft">
        An unexpected error interrupted the page. Your cart is safe on this
        device.
      </p>
      <button className="btn btn-primary btn-md mt-6" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
