import type { Metadata } from "next";
import about from "@/content/about.json";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoGallery } from "@/components/ui/PhotoGallery";

const ROOM_PHOTOS = [
  { src: "/photos/lounge-wide.jpg", alt: "The lounge with grey sofas and big windows.", w: 640, h: 480 },
  { src: "/photos/counter.jpg", alt: "The service counter and overhead menu boards.", w: 640, h: 480 },
  { src: "/photos/dining.jpg", alt: "Marble-top dining tables and black chairs.", w: 480, h: 640 },
  { src: "/photos/seating.jpg", alt: "Lounge seating along the wall.", w: 480, h: 640 },
  { src: "/photos/prep.jpg", alt: "Behind the counter — the prep area.", w: 480, h: 640 },
  { src: "/photos/counter-side.jpg", alt: "The counter from the side, with the menu screens.", w: 480, h: 640 },
];

export const metadata: Metadata = {
  title: "About",
  description: "The story behind The Break Room — how we ended up running two cafes in one room.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">About us</p>
        <h1 className="mt-3 font-display tracking-tighter2">
          Two cafes, one room, on different schedules.
        </h1>
      </header>
      <div className="hand-divider mt-10" />

      <section className="mt-12 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 lg:col-start-3">
          {about.story.map((para, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <p
                className={`mt-6 text-lg leading-relaxed ${i === 0 ? "dropcap" : ""}`}
                dangerouslySetInnerHTML={{ __html: para }}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tightish">Inside the room</h2>
          <p className="mt-2 text-qh-ink-soft">The actual space — tap any photo to enlarge.</p>
        </Reveal>
        <div className="mt-8">
          <PhotoGallery photos={ROOM_PHOTOS} className="grid-cols-2 sm:grid-cols-3" />
        </div>
      </section>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tightish">What we believe</h2>
        </Reveal>
        <div className="mt-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
          {about.values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="border-t border-qh-line pt-4">
                <h3 className="font-display italic text-xl text-qh-accent">
                  <span dangerouslySetInnerHTML={{ __html: v.title }} />
                </h3>
                <p
                  className="mt-2 text-qh-ink-soft"
                  dangerouslySetInnerHTML={{ __html: v.body }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tightish">The team</h2>
          <p className="mt-2 text-qh-ink-soft">A small group with strong opinions about coffee.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {about.team.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.04}>
              <article>
                <Avatar seed={i} />
                <p className="mt-2 font-display text-base leading-tight">{m.name}</p>
                <p
                  className="text-xs text-qh-ink-soft"
                  dangerouslySetInnerHTML={{ __html: m.role }}
                />
                <p
                  className="mt-1 text-xs italic text-qh-accent"
                  dangerouslySetInnerHTML={{ __html: m.drinking }}
                />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tightish">A short history</h2>
        </Reveal>
        <ol className="mt-8 max-w-2xl">
          {about.timeline.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.05}>
              <li className="relative pl-12 pb-8">
                <span className="absolute left-0 top-1 font-mono text-sm text-qh-ink-soft">{t.year}</span>
                <span
                  aria-hidden
                  className="absolute left-[42px] top-2 bottom-0 w-px"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, var(--qh-accent-soft) 70%, transparent 70%)",
                    backgroundSize: "1px 8px",
                  }}
                />
                <p
                  className="text-lg"
                  dangerouslySetInnerHTML={{ __html: t.label }}
                />
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Avatar({ seed }: { seed: number }) {
  const palettes = [
    ["#d8e6bc", "#6e8a5c"],
    ["#d8e6bc", "#3c6b4a"],
    ["#eaf1dc", "#e84c8e"],
    ["#e6f0ce", "#5c6657"],
    ["#c2d0a8", "#20271e"],
    ["#e6f0ce", "#c2d0a8"],
  ];
  const [bg, fg] = palettes[seed % palettes.length];
  return (
    <div className="aspect-square rounded-2xl overflow-hidden border border-qh-line">
      <svg viewBox="0 0 100 100" className="w-full h-full block" aria-hidden>
        <rect width="100" height="100" fill={bg} />
        <circle cx="50" cy="42" r="18" fill={fg} />
        <path d="M20 100 q 30 -36 60 0 Z" fill={fg} />
      </svg>
    </div>
  );
}
