import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/visit/ContactForm";
import { MapEmbed } from "@/components/visit/MapEmbed";

export const metadata: Metadata = {
  title: "Visit",
  description: "Hours, address, and directions to The Breakroom in Bothell, WA.",
};

const HOURS = [
  { day: "Monday",    hours: "7:30 AM – 8:30 PM" },
  { day: "Tuesday",   hours: "7:30 AM – 8:30 PM" },
  { day: "Wednesday", hours: "7:30 AM – 8:30 PM" },
  { day: "Thursday",  hours: "7:30 AM – 8:30 PM" },
  { day: "Friday",    hours: "7:30 AM – 8:30 PM" },
  { day: "Saturday",  hours: "7:30 AM – 8:30 PM" },
  { day: "Sunday",    hours: "7:30 AM – 8:30 PM" },
];

export default function VisitPage() {
  // Note: in browser this resolves to a real day; SSR uses server tz.
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="container-page py-16 max-w-5xl">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          Come by
        </p>
        <h1 className="mt-3 font-display tracking-tighter2">
          Right on North Creek Parkway.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          We&#8217;re in the North Creek Parkway Center in Bothell, with easy parking right out front.
        </p>
      </header>
      <div className="hand-divider mt-10" />

      <section className="mt-12 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-2xl">Hours</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {HOURS.map((h) => {
                const isToday = h.day === today;
                return (
                  <tr
                    key={h.day}
                    className={isToday ? "bg-qh-accent-soft/30" : ""}
                  >
                    <td className="py-2 px-3 font-medium">{h.day}</td>
                    <td className="py-2 px-3 font-mono text-right">{h.hours}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="font-display text-2xl mt-10">Address</h2>
          <address className="not-italic mt-2 text-qh-ink-soft leading-7">
            18916 N Creek Pkwy #101<br />
            Bothell, WA 98011
          </address>
          <p className="mt-3 text-sm">
            <a href="tel:+14253959316" className="text-qh-accent underline underline-offset-2">
              (425) 395&#8209;9316
            </a>
            <span className="mx-2 text-qh-line">·</span>
            <a href="mailto:thebreakroombothell@gmail.com" className="text-qh-accent underline underline-offset-2">
              thebreakroombothell@gmail.com
            </a>
          </p>

          <div className="mt-10">
            <h2 className="font-display text-2xl">How to find us</h2>
            <p className="mt-3 text-qh-ink-soft">
              Head to Building 18916 in the North Creek Parkway Center and look for Suite 101
              &mdash; the green counter and glowing menu screens are hard to miss.
              <span className="inline-block ml-1 align-middle">
                <svg width="60" height="20" viewBox="0 0 60 20" aria-hidden>
                  <path
                    d="M2 10 q 16 -8 30 0 q 14 8 26 0"
                    stroke="var(--qh-accent)"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 6 L 58 10 L 50 14"
                    stroke="var(--qh-accent)"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </p>
          </div>
        </div>

        <div>
          <MapEmbed />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <PhotoTile src="/photos/exterior.jpg" alt="The Breakroom storefront and unit sign." />
            <PhotoTile src="/photos/patio.jpg" alt="Patio seating outside The Breakroom." />
            <PhotoTile src="/photos/dining.jpg" alt="Marble-top dining tables inside." />
          </div>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-display text-2xl">Send us a note</h2>
        <p className="mt-2 text-qh-ink-soft max-w-lg">
          Planning a private event or catering? The form on the
          <a href="/book" className="text-qh-accent underline underline-offset-2 mx-1">events page</a>
          will reach us fastest. For everything else:
        </p>
        <div className="mt-6 max-w-xl">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

function PhotoTile({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-qh-line shadow-soft">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 30vw, 160px"
        className="object-cover"
      />
    </div>
  );
}
