"use client";

import Image from "next/image";

const PHOTOS = [
  { src: "/photos/lounge-wide.jpg", alt: "The lounge with sofas and big windows, ready for a gathering.", color: "#ff4d9e" },
  { src: "/photos/dining.jpg", alt: "Marble-top dining tables and black chairs.", color: "#ff9f45" },
  { src: "/photos/seating.jpg", alt: "Lounge seating along the wall.", color: "#A78BFA" },
  { src: "/photos/counter.jpg", alt: "The service counter and overhead menu boards.", color: "#6EE7B7" },
  { src: "/photos/lounge.jpg", alt: "Soft sofas and plants in the lounge.", color: "#d7f25a" },
];

export function TheSpace() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ah-electric">The space</p>
            <h2 className="mt-3 font-party text-4xl sm:text-5xl text-ah-cream tracking-tightish">
              See what you&#8217;re working with.
            </h2>
          </div>
          <p className="text-ah-cream/80 max-w-md font-mono text-sm">
            Up to 40 standing &middot; 24 seated &middot; A/V included &middot; Catering options
          </p>
        </div>

        <div
          className="mt-10 -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto snap-x snap-mandatory flex gap-5 pb-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {PHOTOS.map((p) => (
            <div
              key={p.src}
              className="relative snap-start shrink-0 w-[82%] sm:w-[420px] aspect-[4/5] rounded-3xl overflow-hidden shadow-lifted"
              style={{ border: `4px solid ${p.color}` }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 640px) 82vw, 420px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
