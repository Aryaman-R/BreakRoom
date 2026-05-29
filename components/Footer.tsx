"use client";

import Link from "next/link";
import { useState } from "react";

const HOURS = [
  ["Mon – Fri", "7:00 AM – 5:00 PM"],
  ["Saturday", "8:00 AM – 3:00 PM (events after)"],
  ["Sunday", "Private events only"],
];

export function Footer() {
  return (
    <footer className="relative z-[2] mt-32 border-t border-qh-line bg-qh-bg-elevated">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display italic text-2xl text-qh-ink">
            The Break Room.
          </p>
          <p className="mt-3 max-w-sm text-qh-ink-soft">
            Coffee and quiet by day. Color and noise by night.
            We&apos;re here for both.
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
            142 Linden Street<br />
            Brooklyn, NY 11221<br />
            <a href="tel:+17185550199" className="hover:text-qh-ink">
              (718) 555&#8209;0199
            </a><br />
            <a href="mailto:hello@thebreakroom.cafe" className="hover:text-qh-ink">
              hello@thebreakroom.cafe
            </a>
          </address>
          <div className="mt-4 flex gap-3 text-qh-ink-soft text-sm">
            <a className="hover:text-qh-ink" href="#" aria-label="Instagram">Instagram</a>
            <a className="hover:text-qh-ink" href="#" aria-label="TikTok">TikTok</a>
          </div>
        </div>
      </div>

      <div className="border-t border-qh-line">
        <div className="container-page py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-qh-ink-soft">
          <p>© {new Date().getFullYear()} The Break Room. All rights reserved.</p>
          <p>
            <Link href="/visit" className="hover:text-qh-ink">Contact</Link>
            <span className="mx-2">·</span>
            Made with care in Brooklyn.
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
