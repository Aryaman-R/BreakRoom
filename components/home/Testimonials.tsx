"use client";

import { Reveal } from "@/components/ui/Reveal";

interface Testimonial {
  quote: string;
  author: string;
  context: string;
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="container-page py-24">
      <Reveal>
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          What people say
        </p>
        <h2 className="mt-2 font-display tracking-tightish max-w-2xl">
          Quieter than a yelp page.
        </h2>
      </Reveal>

      <div className="mt-12 grid md:grid-cols-3 gap-10">
        {testimonials.map((t, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <figure className="relative pl-10">
              <span
                aria-hidden
                className="absolute left-0 top-0 font-display text-7xl leading-none text-qh-accent select-none"
              >
                &ldquo;
              </span>
              <blockquote
                className="font-display italic text-xl leading-snug text-qh-ink"
                dangerouslySetInnerHTML={{ __html: t.quote }}
              />
              <figcaption className="mt-4 text-sm text-qh-ink-soft">
                — {t.author}
                <span className="block text-xs mt-0.5">{t.context}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
