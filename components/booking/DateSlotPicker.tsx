"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AvailabilitySlot } from "@/lib/types";

interface Props {
  date: string;
  slot: string;
  onDateChange: (v: string) => void;
  onSlotChange: (v: string) => void;
  dateError?: string;
  slotError?: string;
}

export function DateSlotPicker({
  date,
  slot,
  onDateChange,
  onSlotChange,
  dateError,
  slotError,
}: Props) {
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/availability?date=${date}`);
        const data = (await res.json()) as { slots: AvailabilitySlot[] };
        if (!cancelled) setSlots(data.slots);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm text-ah-cream/85 mb-2" htmlFor="bk-date">
          Date
        </label>
        <input
          id="bk-date"
          type="date"
          value={date}
          min={todayISO}
          onChange={(e) => {
            onDateChange(e.target.value);
            onSlotChange(""); // reset slot when date changes
          }}
          className="w-full rounded-xl border border-ah-cream/20 bg-ah-bg/60 text-ah-cream px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ah-electric"
        />
        {dateError && (
          <p className="mt-1.5 text-xs text-ah-magenta" role="alert">
            {dateError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-ah-cream/85 mb-2">Time slot</label>
        <div className="rounded-xl border border-ah-cream/20 bg-ah-bg/60 p-3 min-h-[58px] flex flex-wrap gap-1.5 items-center">
          {!date && (
            <span className="text-sm text-ah-cream/50 px-2">
              Pick a date first.
            </span>
          )}
          {date && loading && (
            <span className="text-sm text-ah-cream/60 px-2">Loading slots…</span>
          )}
          <AnimatePresence>
            {date &&
              !loading &&
              slots?.map((s) => {
                const selected = slot === s.time;
                return (
                  <motion.button
                    key={s.time}
                    type="button"
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    disabled={!s.available}
                    onClick={() => onSlotChange(s.time)}
                    className={`text-xs rounded-full px-3 py-1.5 font-mono transition-colors ${
                      !s.available
                        ? "bg-ah-bg/40 text-ah-cream/30 line-through cursor-not-allowed border border-ah-cream/10"
                        : selected
                        ? "bg-ah-electric text-ah-bg"
                        : "bg-ah-bg text-ah-cream/85 hover:text-ah-electric border border-ah-cream/20"
                    }`}
                  >
                    {s.time}
                  </motion.button>
                );
              })}
          </AnimatePresence>
          {date && !loading && slots && slots.every((s) => !s.available) && (
            <span className="text-sm text-ah-cream/60 px-2">
              We&#8217;re booked solid that day — try another date?
            </span>
          )}
        </div>
        {slotError && (
          <p className="mt-1.5 text-xs text-ah-magenta" role="alert">
            {slotError}
          </p>
        )}
      </div>
    </div>
  );
}
