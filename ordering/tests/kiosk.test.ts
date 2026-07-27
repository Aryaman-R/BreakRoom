import { describe, expect, it } from "vitest";
import { applyBackspace, applyInsert, parseKioskValue } from "../lib/kiosk";

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
