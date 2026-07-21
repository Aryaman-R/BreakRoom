import { describe, expect, it } from "vitest";
import { normalizePhone } from "../lib/phone";

describe("normalizePhone", () => {
  it("normalizes common US formats to E.164", () => {
    expect(normalizePhone("(425) 555-0100")).toBe("+14255550100");
    expect(normalizePhone("425-555-0100")).toBe("+14255550100");
    expect(normalizePhone("425.555.0100")).toBe("+14255550100");
    expect(normalizePhone("4255550100")).toBe("+14255550100");
    expect(normalizePhone("1 425 555 0100")).toBe("+14255550100");
    expect(normalizePhone("+1 (425) 555-0100")).toBe("+14255550100");
  });

  it("keeps valid international numbers", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects garbage", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("hello")).toBeNull();
    expect(normalizePhone("555-0100")).toBeNull(); // 7 digits, no area code
    expect(normalizePhone("+0123456789")).toBeNull(); // leading zero country code
    expect(normalizePhone("123456789012345678")).toBeNull(); // too long
  });
});
