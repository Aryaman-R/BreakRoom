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

  // Deliberately NANP-only. This is a pickup cafe: every real customer walks
  // in to collect, so a verification SMS has no reason to leave the country,
  // and /api/verify/start hands whatever this accepts straight to Twilio.
  // Accepting the whole E.164 space is how SMS pumping bills the cafe for
  // premium-rate international traffic.
  it("refuses to send outside the North American Numbering Plan", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBeNull(); // UK
    expect(normalizePhone("+61 2 9374 4000")).toBeNull(); // Australia
    expect(normalizePhone("+880 1700 000000")).toBeNull(); // a pumping favourite
  });

  it("rejects structurally impossible NANP numbers", () => {
    expect(normalizePhone("+1 025 555 0100")).toBeNull(); // area code starts 0
    expect(normalizePhone("+1 125 555 0100")).toBeNull(); // area code starts 1
    expect(normalizePhone("+1 411 555 0100")).toBeNull(); // N11 service code
    expect(normalizePhone("4250550100")).toBeNull(); // exchange starts 0
    expect(normalizePhone("4251550100")).toBeNull(); // exchange starts 1
  });

  it("rejects garbage", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("hello")).toBeNull();
    expect(normalizePhone("555-0100")).toBeNull(); // 7 digits, no area code
    expect(normalizePhone("+0123456789")).toBeNull(); // leading zero country code
    expect(normalizePhone("123456789012345678")).toBeNull(); // too long
  });
});
