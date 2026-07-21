import { describe, expect, it } from "vitest";
import {
  formatMinutes,
  isOrderingOpen,
  lastOrderMinute,
  pacificMinutesOfDay,
} from "../lib/hours";

// Breakroom defaults: open 9:30 AM (570), close 3:30 PM (930), buffer 20.
const s = {
  ordering_open_minutes: 570,
  ordering_close_minutes: 930,
  last_order_buffer_minutes: 20,
};

describe("pacificMinutesOfDay", () => {
  it("converts UTC instants to Pacific wall clock (PDT, UTC-7)", () => {
    // 2026-07-21 17:00 UTC = 10:00 AM PDT
    expect(pacificMinutesOfDay(new Date("2026-07-21T17:00:00Z"))).toBe(600);
  });

  it("handles PST (UTC-8) in winter", () => {
    // 2026-01-15 17:00 UTC = 9:00 AM PST
    expect(pacificMinutesOfDay(new Date("2026-01-15T17:00:00Z"))).toBe(540);
  });

  it("handles midnight without the ICU '24' quirk", () => {
    // 2026-07-21 07:00 UTC = 00:00 PDT
    expect(pacificMinutesOfDay(new Date("2026-07-21T07:00:00Z"))).toBe(0);
  });
});

describe("isOrderingOpen", () => {
  // July dates → PDT (UTC-7)
  const at = (h: number, m: number) =>
    new Date(Date.UTC(2026, 6, 21, h + 7, m)); // Pacific wall clock h:m

  it("opens exactly at 9:30 AM", () => {
    expect(isOrderingOpen(s, at(9, 29))).toBe(false);
    expect(isOrderingOpen(s, at(9, 30))).toBe(true);
  });

  it("last order lands before 3:10 PM (close minus buffer)", () => {
    expect(lastOrderMinute(s)).toBe(910);
    expect(isOrderingOpen(s, at(15, 9))).toBe(true);
    expect(isOrderingOpen(s, at(15, 10))).toBe(false);
    expect(isOrderingOpen(s, at(15, 15))).toBe(false); // the checklist case
  });

  it("is closed overnight", () => {
    expect(isOrderingOpen(s, at(2, 0))).toBe(false);
    expect(isOrderingOpen(s, at(23, 0))).toBe(false);
  });
});

describe("formatMinutes", () => {
  it("renders 12-hour times", () => {
    expect(formatMinutes(570)).toBe("9:30 AM");
    expect(formatMinutes(910)).toBe("3:10 PM");
    expect(formatMinutes(0)).toBe("12:00 AM");
    expect(formatMinutes(720)).toBe("12:00 PM");
  });
});
