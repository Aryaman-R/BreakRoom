"use client";

import { motion, LayoutGroup } from "framer-motion";
import type { EventType } from "@/lib/types";

const OPTIONS: { id: EventType; label: string }[] = [
  { id: "birthday",  label: "Birthday" },
  { id: "corporate", label: "Corporate" },
  { id: "shower",    label: "Shower" },
  { id: "other",     label: "Other" },
];

interface Props {
  value: EventType;
  onChange: (v: EventType) => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
}

export function EventTypeControl({ value, onChange, otherValue, onOtherChange }: Props) {
  return (
    <div>
      <label className="block text-sm text-ah-cream/85 mb-2">Event type</label>
      <LayoutGroup id="event-type">
        <div className="inline-flex rounded-full bg-ah-bg/60 border border-ah-cream/20 p-1 flex-wrap">
          {OPTIONS.map((opt) => {
            const active = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`relative px-4 py-2 text-sm rounded-full transition-colors ${
                  active ? "text-ah-bg" : "text-ah-cream/80 hover:text-ah-cream"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="event-type-pill"
                    className="absolute inset-0 rounded-full bg-ah-electric"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-[1]">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {value === "other" && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Tell us a bit more…"
          className="mt-3 w-full max-w-md rounded-xl border border-ah-cream/20 bg-ah-bg/60 text-ah-cream placeholder-ah-cream/40 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ah-electric"
        />
      )}
    </div>
  );
}
