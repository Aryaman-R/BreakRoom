"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const HOURS = [
  ["Every day", "9:30 AM – 3:30 PM"],
];

export function Footer() {
  return (
    <footer className="relative z-[2] mt-32 border-t border-qh-line bg-qh-bg-elevated">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-qh-ink/10 overflow-hidden shrink-0">
              <Image src="/logo-mark.png" alt="" width={32} height={28} className="h-8 w-auto" />
            </span>
            <p className="font-display italic text-2xl text-qh-ink">
              The Breakroom.
            </p>
          </div>
          <p className="mt-3 max-w-sm text-qh-ink-soft">
            Coffee and boba by day, comfort food and gatherings by night.
            Come hungry.
          </p>
          <Newsletter />
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">Hours</h4>
          <dl className="text-sm font-mono">
            {HOURS.map(([day, time]) => (
              <div key={day} className="flex justify-between py-1">
                <dt className="text-qh-ink-soft">{day}</dt>
                <dd className="text-qh-ink">{time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h4 className="font-display text-lg mb-3">Find us</h4>
          <address className="not-italic text-sm text-qh-ink-soft leading-7">
            18916 N Creek Pkwy #101<br />
            Bothell, WA 98011<br />
            <a href="tel:+14254194231" className="hover:text-qh-ink">
              (425) 395&#8209;9316
            </a><br />
            <a href="mailto:thebreakroombothell@gmail.com" className="hover:text-qh-ink">
              thebreakroombothell@gmail.com
            </a>
          </address>
          <div className="mt-4 flex gap-3 text-qh-ink-soft text-sm">
            <a className="hover:text-qh-ink" href="https://www.instagram.com/thebreakroombothell" aria-label="Instagram">Instagram</a>
            <a className="hover:text-qh-ink" href="https://www.facebook.com/people/The-Breakroom/61560259126301/" aria-label="Facebook">Facebook</a>
          </div>
        </div>
      </div>

      <div className="border-t border-qh-line">
        <div className="container-page py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-qh-ink-soft">
          <p>© {new Date().getFullYear()} The Breakroom. All rights reserved.</p>
          <p>
            <Link href="/visit" className="hover:text-qh-ink">Contact</Link>
            <span className="mx-2">·</span>
            Made with care in Bothell, WA.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO(backend): POST to /api/newsletter
        setDone(true);
        setEmail("");
      }}
      className="mt-6 max-w-md"
    >
      <label htmlFor="newsletter-email" className="text-sm text-qh-ink-soft block mb-2">
        Slow newsletter — once a month, no noise.
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@inbox.com"
          className="flex-1 min-w-0 rounded-full border border-qh-line bg-qh-bg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-qh-accent"
        />
        <button
          type="submit"
          className="w-full sm:w-auto shrink-0 rounded-full bg-qh-ink text-qh-bg px-5 py-2.5 text-sm font-medium hover:bg-qh-accent transition-colors"
        >
          {done ? "Thanks ✓" : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
