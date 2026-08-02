"use client";

import { HOURS_TABLE, formatDayHours } from "@/lib/business";
import { useLocalDay, useOpenState } from "@/components/ui/useLiveClock";

/**
 * The opening-hours table.
 *
 * Two things this fixes over the inline version it replaced:
 *
 * 1. "Today" was computed with `new Date()` during render. In a static export
 *    that is the *build* date, so the highlight pointed at whichever weekday
 *    the site was last deployed on. It is now resolved after mount, in the
 *    cafe's timezone, so it is right for the visitor rather than for the
 *    deploy.
 * 2. The table had no header cells and signalled "today" with a 1.11:1
 *    background tint — invisible to a screen reader and to most sighted
 *    people. There are real <th> cells now, and today carries a text badge
 *    plus aria-current, so the meaning does not depend on seeing the colour.
 */
export function HoursTable() {
  const today = useLocalDay();
  const status = useOpenState();

  return (
    <>
      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">
          Opening hours for each day of the week
        </caption>
        <thead>
          <tr className="border-b border-qh-line">
            <th scope="col" className="py-2 px-3 text-left font-medium">
              Day
            </th>
            <th scope="col" className="py-2 px-3 text-right font-medium">
              Hours
            </th>
          </tr>
        </thead>
        <tbody>
          {HOURS_TABLE.map((d) => {
            const isToday = today === d.day;
            return (
              <tr
                key={d.label}
                aria-current={isToday ? "date" : undefined}
                className={isToday ? "bg-qh-accent-soft/30" : ""}
              >
                <th scope="row" className="py-2 px-3 font-medium text-left">
                  {d.label}
                  {isToday && (
                    <span className="ml-2 rounded-full bg-qh-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white align-middle">
                      Today
                    </span>
                  )}
                </th>
                <td
                  className={`py-2 px-3 font-mono text-right ${
                    d.open === null ? "text-qh-ink-soft" : ""
                  }`}
                >
                  {formatDayHours(d)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Rendered only once the clock is known, so the static HTML never
          claims a state it cannot verify. */}
      {status && (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              status.isOpen ? "bg-qh-sage" : "bg-qh-ink-soft"
            }`}
            aria-hidden
          />
          <span className={status.isOpen ? "font-medium text-qh-ink" : "text-qh-ink-soft"}>
            {status.isOpen ? "Open now" : "Closed"} · {status.label}
          </span>
        </p>
      )}
    </>
  );
}
