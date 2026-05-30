"use client";

import { motion } from "framer-motion";
import type { BookingFormValues } from "@/lib/validation";

export function SuccessCard({ values }: { values: BookingFormValues }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-3xl p-8 sm:p-10 text-ah-bg shadow-lifted"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #d7f25a 0%, #6EE7B7 50%, #A78BFA 100%)",
      }}
    >
      <p className="text-sm uppercase tracking-[0.18em] opacity-70">Confirmed</p>
      <h3 className="mt-2 font-party text-4xl tracking-tightish">
        You&#8217;re on the list.
      </h3>
      <p className="mt-3 max-w-lg">
        We&#8217;ll email you within one business day to confirm details. In the
        meantime, here&#8217;s what we&#8217;ve got:
      </p>
      <dl className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row label="When" value={`${values.date} · ${values.timeSlot}`} />
        <Row label="Type" value={values.eventType + (values.eventTypeOther ? ` (${values.eventTypeOther})` : "")} />
        <Row label="Guests" value={`${values.guestCount}`} />
        <Row label="Catering" value={values.catering.join(", ")} />
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={icsHref(values)}
          download="thebreakroom.ics"
          className="rounded-full bg-ah-bg text-ah-cream px-5 py-2.5 text-sm font-medium hover:bg-black/80 transition-colors"
        >
          Add to calendar
        </a>
        <a
          href="/"
          className="rounded-full border border-ah-bg px-5 py-2.5 text-sm font-medium hover:bg-ah-bg hover:text-ah-cream transition-colors"
        >
          Back home
        </a>
      </div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs uppercase tracking-[0.18em] opacity-70 w-20 shrink-0">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

function icsHref(v: BookingFormValues): string {
  const start = `${v.date.replace(/-/g, "")}T180000`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Breakroom//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@thebreakroombothell.com`,
    `DTSTART:${start}`,
    `SUMMARY:Event at The Breakroom`,
    `LOCATION:18916 N Creek Pkwy #101, Bothell WA 98011`,
    `DESCRIPTION:Booking request for ${v.guestCount} guests (${v.eventType}).`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
