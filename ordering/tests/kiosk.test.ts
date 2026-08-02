import { afterEach, describe, expect, it } from "vitest";
import {
  applyBackspace,
  applyInsert,
  countdownSeconds,
  DEFAULT_KIOSK_EXIT_PIN,
  KIOSK_EXIT_PIN_MAX,
  KIOSK_EXIT_TAP_GAP_MS,
  KIOSK_EXIT_TAPS,
  kioskExitPin,
  NO_TAPS,
  parseKioskValue,
  registerTap,
  tapsUnlock,
} from "../lib/kiosk";

describe("parseKioskValue", () => {
  it("recognizes the on switch", () => {
    expect(parseKioskValue("on")).toBe("on");
    expect(parseKioskValue("1")).toBe("on");
    expect(parseKioskValue("true")).toBe("on");
    expect(parseKioskValue(" ON ")).toBe("on");
  });

  it("recognizes the off switch", () => {
    expect(parseKioskValue("off")).toBe("off");
    expect(parseKioskValue("0")).toBe("off");
    expect(parseKioskValue("false")).toBe("off");
  });

  it("ignores anything else", () => {
    expect(parseKioskValue(null)).toBeNull();
    expect(parseKioskValue("")).toBeNull();
    expect(parseKioskValue("yes")).toBeNull();
    expect(parseKioskValue("kiosk")).toBeNull();
  });
});

describe("countdownSeconds", () => {
  it("rounds up so a countdown never shows 0 while time remains", () => {
    expect(countdownSeconds(15_000)).toBe(15);
    expect(countdownSeconds(14_001)).toBe(15);
    expect(countdownSeconds(1)).toBe(1);
    expect(countdownSeconds(0)).toBe(0);
  });

  it("clamps overshoot from a late timer tick", () => {
    expect(countdownSeconds(-250)).toBe(0);
  });
});

describe("registerTap", () => {
  it("counts taps that arrive within the gap", () => {
    let s = NO_TAPS;
    for (let i = 1; i <= KIOSK_EXIT_TAPS; i++) {
      s = registerTap(s, i * 200);
      expect(s.count).toBe(i);
    }
    expect(tapsUnlock(s)).toBe(true);
  });

  it("starts over when the customer just brushed the corner minutes apart", () => {
    let s = registerTap(NO_TAPS, 1_000);
    s = registerTap(s, 1_200);
    expect(s.count).toBe(2);
    s = registerTap(s, 1_200 + KIOSK_EXIT_TAP_GAP_MS + 1);
    expect(s.count).toBe(1);
    expect(tapsUnlock(s)).toBe(false);
  });

  it("treats a tap exactly on the gap boundary as continuing", () => {
    const s = registerTap({ count: 2, last: 5_000 }, 5_000 + KIOSK_EXIT_TAP_GAP_MS);
    expect(s.count).toBe(3);
  });

  it("does not unlock below the tap threshold", () => {
    expect(tapsUnlock({ count: KIOSK_EXIT_TAPS - 1, last: 0 })).toBe(false);
    expect(tapsUnlock(NO_TAPS)).toBe(false);
  });
});

describe("kioskExitPin", () => {
  const original = process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN;
    else process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = original;
  });

  it("falls back to the documented default so a kiosk is never stranded", () => {
    delete process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN;
    expect(kioskExitPin()).toBe(DEFAULT_KIOSK_EXIT_PIN);
  });

  it("treats a blank or whitespace-only value as unset", () => {
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = "   ";
    expect(kioskExitPin()).toBe(DEFAULT_KIOSK_EXIT_PIN);
  });

  it("uses the configured PIN", () => {
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = "907341";
    expect(kioskExitPin()).toBe("907341");
  });

  it("accepts a PIN exactly at the pad's capacity", () => {
    const atLimit = "1".repeat(KIOSK_EXIT_PIN_MAX);
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = atLimit;
    expect(kioskExitPin()).toBe(atLimit);
  });

  // The pad auto-submits when the entry reaches the PIN's length. A PIN longer
  // than the pad can hold could never reach it, so the pad accepted digits
  // forever and submitted nothing — staff permanently locked out of the
  // device. A misconfigured PIN should cost a weak PIN, not the only exit.
  it("refuses a PIN too long to ever be entered", () => {
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = "1".repeat(KIOSK_EXIT_PIN_MAX + 1);
    expect(kioskExitPin()).toBe(DEFAULT_KIOSK_EXIT_PIN);
  });
});

describe("applyInsert", () => {
  it("inserts at the caret", () => {
    expect(applyInsert("held", 2, 2, "llo wor")).toEqual({
      value: "hello world",
      caret: 9,
    });
  });

  it("replaces a selection", () => {
    expect(applyInsert("hello world", 0, 5, "goodbye")).toEqual({
      value: "goodbye world",
      caret: 7,
    });
  });

  it("appends when selection is unavailable (email/number inputs)", () => {
    expect(applyInsert("user@site", null, null, ".com")).toEqual({
      value: "user@site.com",
      caret: 13,
    });
  });

  it("clamps out-of-range stale selections", () => {
    expect(applyInsert("ab", 10, 20, "c")).toEqual({ value: "abc", caret: 3 });
    expect(applyInsert("ab", -5, 1, "x")).toEqual({ value: "xb", caret: 1 });
  });

  it("honors maxLength", () => {
    expect(applyInsert("12345", 5, 5, "6", 6)).toEqual({ value: "123456", caret: 6 });
    expect(applyInsert("123456", 6, 6, "7", 6)).toEqual({ value: "123456", caret: 6 });
    // Partial fit: only what still fits goes in.
    expect(applyInsert("1234", 4, 4, "567", 6)).toEqual({ value: "123456", caret: 6 });
    // Replacing a selection frees room first.
    expect(applyInsert("123456", 0, 6, "789", 6)).toEqual({ value: "789", caret: 3 });
  });

  it("treats negative maxLength as unlimited", () => {
    expect(applyInsert("a", 1, 1, "b", -1)).toEqual({ value: "ab", caret: 2 });
  });
});

describe("applyBackspace", () => {
  it("deletes the character before the caret", () => {
    expect(applyBackspace("hello", 5, 5)).toEqual({ value: "hell", caret: 4 });
    expect(applyBackspace("hello", 1, 1)).toEqual({ value: "ello", caret: 0 });
  });

  it("deletes the selection instead when one exists", () => {
    expect(applyBackspace("hello world", 5, 11)).toEqual({ value: "hello", caret: 5 });
  });

  it("no-ops at the start", () => {
    expect(applyBackspace("hello", 0, 0)).toEqual({ value: "hello", caret: 0 });
    expect(applyBackspace("", 0, 0)).toEqual({ value: "", caret: 0 });
  });

  it("deletes from the end when selection is unavailable", () => {
    expect(applyBackspace("hello", null, null)).toEqual({ value: "hell", caret: 4 });
  });

  it("removes a whole surrogate pair, never half an emoji", () => {
    const v = `hi${String.fromCodePoint(0x1f600)}`; // "hi😀" — 4 UTF-16 units
    expect(applyBackspace(v, 4, 4)).toEqual({ value: "hi", caret: 2 });
  });
});
