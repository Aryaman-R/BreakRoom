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
  description: "About The Breakroom — a neighborhood café in Bothell for coffee, boba, and comfort food.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">About us</p>
        <h1 className="mt-3 font-display tracking-tighter2">
          A neighborhood café in Bothell.
        </h1>
      </header>
      <div className="hand-divider mt-10" />

      <section className="mt-12 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 lg:col-start-3">
          {about.story.map((para, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <p
                
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
    </div>
  );
}
