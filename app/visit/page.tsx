import type { Metadata } from "next";
import { ContactForm } from "@/components/visit/ContactForm";
import { MapEmbed } from "@/components/visit/MapEmbed";

export const metadata: Metadata = {
  title: "Visit",
  description: "Hours, address, and directions to The Break Room in Brooklyn.",
};

const HOURS = [
  { day: "Monday",    hours: "7:00 AM – 5:00 PM" },
  { day: "Tuesday",   hours: "7:00 AM – 5:00 PM" },
  { day: "Wednesday", hours: "7:00 AM – 5:00 PM" },
  { day: "Thursday",  hours: "7:00 AM – 5:00 PM" },
  { day: "Friday",    hours: "7:00 AM – 5:00 PM" },
  { day: "Saturday",  hours: "8:00 AM – 3:00 PM (events after)" },
  { day: "Sunday",    hours: "Private events only" },
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
          You can&#8217;t miss the awning.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          We&#8217;re a five minute walk from the L train, on the quieter end of Linden.
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
            142 Linden Street<br />
            Brooklyn, NY 11221
          </address>
          <p className="mt-3 text-sm">
            <a href="tel:+17185550199" className="text-qh-accent underline underline-offset-2">
              (718) 555&#8209;0199
            </a>
            <span className="mx-2 text-qh-line">·</span>
            <a href="mailto:hello@thebreakroom.cafe" className="text-qh-accent underline underline-offset-2">
              hello@thebreakroom.cafe
            </a>
          </p>

          <div className="mt-10">
            <h2 className="font-display text-2xl">How to find us</h2>
            <p className="mt-3 text-qh-ink-soft">
              Look for the awning the color of butter. We&#8217;re next to the bookshop with
              the orange door &mdash;
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
              that one.
            </p>
          </div>
        </div>

        <div>
          <MapEmbed />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <PhotoTile aspect="aspect-[4/5]" />
            <PhotoTile aspect="aspect-[4/5]" tone="b" />
            <PhotoTile aspect="aspect-[4/5]" tone="c" />
          </div>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-display text-2xl">Send us a note</h2>
        <p className="mt-2 text-qh-ink-soft max-w-lg">
          For party bookings, the form on the
          <a href="/book" className="text-qh-accent underline underline-offset-2 mx-1">book page</a>
          will get to us faster. For everything else:
        </p>
        <div className="mt-6 max-w-xl">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

function PhotoTile({ aspect, tone = "a" }: { aspect: string; tone?: "a" | "b" | "c" }) {
  const palettes = {
    a: ["#F4D6B5", "#9C7A55", "#FFF8E7"],
    b: ["#E8BD93", "#7E8C6E", "#FBF7F0"],
    c: ["#F2E6D2", "#8B5E3C", "#FFEAC4"],
  } as const;
  const [bg, mid, top] = palettes[tone];
  return (
    <div className={`${aspect} rounded-2xl overflow-hidden border border-qh-line shadow-soft`}>
      <svg viewBox="0 0 100 125" className="w-full h-full" aria-hidden>
        <rect width="100" height="125" fill={bg} />
        <rect y="80" width="100" height="45" fill={mid} />
        <circle cx="35" cy="60" r="22" fill={top} stroke="#3F2A18" strokeWidth="1" />
        <rect x="62" y="44" width="30" height="30" fill={top} stroke="#3F2A18" strokeWidth="1" />
      </svg>
    </div>
  );
}
