export default function NotFound() {
  return (
    <main className="container-page max-w-md py-16 text-center">
      <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
        The Breakroom
      </p>
      <h1 className="mt-3">That page isn&#8217;t on the menu.</h1>
      <p className="mt-4 text-qh-ink-soft">
        <a href="/" className="text-qh-accent underline underline-offset-2">
          Head back to ordering
        </a>
        .
      </p>
    </main>
  );
}
