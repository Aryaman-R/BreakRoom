import type { Metadata } from "next";
import Image from "next/image";
import { defaultRepo } from "@/lib/db";
import { Reveal } from "@/components/ui/Reveal";
import type { PublicEvent } from "@/lib/types";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming public events at The Breakroom — open mics, trivia, cuppings, and more.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    defaultRepo.getUpcomingEvents(),
    defaultRepo.getPastEvents(),
  ]);

  return (
    <div className="container-page py-16 max-w-4xl">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">Events</p>
        <h1 className="mt-3 font-display tracking-tighter2">
          Things you can show up to.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          These are open to the public &mdash; for a private booking, head to the
          <a href="/book" className="text-qh-accent underline underline-offset-2 mx-1">book page</a>.
        </p>
      </header>
      <div className="hand-divider mt-10" />

      <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { src: "/photos/counter.jpg", alt: "The service counter and overhead menu boards." },
          { src: "/photos/lounge-wide.jpg", alt: "The lounge with sofas and big windows." },
          { src: "/photos/patio.jpg", alt: "Patio seating outside The Breakroom." },
        ].map((p) => (
          <div
            key={p.src}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-qh-line shadow-soft"
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 768px) 31vw, 260px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl">Coming up</h2>
        {upcoming.length === 0 ? (
          <EmptyEvents />
        ) : (
          <ul className="mt-6 space-y-6">
            {upcoming.map((e, i) => (
              <Reveal key={e.id} delay={i * 0.06}>
                <EventCard event={e} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl text-qh-ink-soft">Past</h2>
          <ul className="mt-6 space-y-4 opacity-60">
            {past.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline gap-4 py-2 border-b border-qh-line text-sm"
              >
                <span className="font-mono text-xs text-qh-ink-soft w-24 shrink-0">{e.date}</span>
                <span className="font-display">{e.title}</span>
                <span className="text-qh-ink-soft text-xs">— {e.host}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EmptyEvents() {
  return (
    <div className="mt-6 rounded-2xl border border-qh-line bg-qh-bg-elevated p-8">
      <p className="font-display text-xl tracking-tightish leading-tight">
        No public events on the calendar right now.
      </p>
      <p className="mt-3 text-sm text-qh-ink-soft">
        Follow{" "}
        <a
          href="https://www.instagram.com/thebreakroombothell"
          target="_blank"
          rel="noopener noreferrer"
          className="text-qh-accent underline underline-offset-2"
        >
          @thebreakroombothell
        </a>{" "}
        on Instagram for pop-ups and seasonal specials &mdash; and for private
        events or catering, head to our{" "}
        <a href="/book" className="text-qh-accent underline underline-offset-2">
          events &amp; catering
        </a>{" "}
        form.
      </p>
    </div>
  );
}

function EventCard({ event }: { event: PublicEvent }) {
  return (
    <article className="grid grid-cols-[88px_1fr_auto] items-center gap-6 p-5 rounded-2xl border border-qh-line bg-qh-bg-elevated hover:shadow-soft transition-shadow">
      {/* Date pill — Mode-B color splash that hints at the bridge */}
      <DatePill date={event.date} />

      <div className="min-w-0">
        <h3 className="font-display text-xl tracking-tightish leading-tight">{event.title}</h3>
        <p className="text-sm text-qh-ink-soft">{event.time} · {event.host}</p>
        <p className="mt-2 text-sm">{event.description}</p>
      </div>

      <button
        type="button"
        className="rounded-full px-5 py-2.5 text-sm border border-qh-ink text-qh-ink hover:bg-ah-magenta hover:text-ah-cream hover:border-ah-magenta transition-colors"
      >
        RSVP
      </button>
    </article>
  );
}

function DatePill({ date }: { date: string }) {
  const d = new Date(date + "T12:00:00");
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  return (
    <div className="rounded-2xl bg-ah-bg text-ah-cream w-[88px] h-[88px] flex flex-col items-center justify-center shadow-soft -rotate-2">
      <span className="text-xs uppercase tracking-[0.18em] text-ah-electric">{month}</span>
      <span className="font-display text-3xl leading-none">{day}</span>
    </div>
  );
}
