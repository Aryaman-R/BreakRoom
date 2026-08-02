import type { Metadata } from "next";
import Image from "next/image";
import about from "@/content/about.json";
import { Reveal } from "@/components/ui/Reveal";
import { PhotoGallery } from "@/components/ui/PhotoGallery";

/**
 * Named from the photo filenames (sunidhi.jpg / trupti.jpg). The alt text was
 * "Owner 1" and "Owner 2" — placeholders that shipped, and the only thing a
 * screen-reader user was told about the two people the page is about.
 */
const OWNERS = [
  {
    src: "/photos/sunidhi.jpg",
    name: "Sunidhi",
    alt: "Sunidhi, co-owner of The Breakroom.",
  },
  {
    src: "/photos/trupti.jpg",
    name: "Trupti",
    alt: "Trupti, co-owner of The Breakroom.",
  },
];

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
  description:
    "About The Breakroom — a neighborhood café in Bothell, WA for coffee, boba, and Asian-American comfort food, run by owners Sunidhi and Trupti.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">About us</p>
        {/* whitespace-nowrap removed — at the clamp's 2.4rem floor this line
            was wider than a 320px viewport and forced a horizontal scroll. */}
        <h1 className="mt-3 font-display tracking-tighter2">
          Meet the Owners
        </h1>
      </header>
      <div className="hand-divider mt-10" />

      <section className="mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {OWNERS.map((o) => (
            <figure key={o.src}>
              {/* next/image with explicit dimensions. These were bare <img>
                  tags with no width, no height and no lazy loading, pointing at
                  1.2 MB lossless PNGs of photographs — so the page shipped
                  2.4 MB and jumped ~1260px twice as the images landed. */}
              <Image
                src={o.src}
                alt={o.alt}
                width={889}
                height={2000}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="w-full rounded-2xl"
              />
              <figcaption className="mt-3 text-sm text-qh-ink-soft">
                {o.name} — co-owner
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-20 max-w-2xl">
        <Reveal>
          <h2 className="font-display text-3xl tracking-tightish">Our story</h2>
          {/* content/about.json carried four paragraphs that nothing rendered:
              the page had roughly 350 characters of unique text on it, which is
              thin for the page most likely to rank for "cafe in Bothell". */}
          <div className="mt-4 space-y-4 text-qh-ink-soft text-lg leading-relaxed">
            {about.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
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
              {/* Plain text — content/about.json holds no markup, so there was
                  nothing for dangerouslySetInnerHTML to do here but widen the
                  blast radius if that file ever takes user-supplied content. */}
              <div className="border-t border-qh-line pt-4">
                <h3 className="font-display italic text-xl text-qh-accent">
                  {v.title}
                </h3>
                <p className="mt-2 text-qh-ink-soft">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
