import { describe, expect, it } from "vitest";
import { canTransition } from "../lib/transitions";
import { ORDER_STATUSES } from "../lib/types";

describe("canTransition", () => {
  it("allows the documented lifecycle", () => {
    expect(canTransition("new", "accepted")).toBe(true);
    expect(canTransition("new", "cancelled")).toBe(true);
    expect(canTransition("call_to_confirm", "accepted")).toBe(true);
    expect(canTransition("call_to_confirm", "cancelled")).toBe(true);
    expect(canTransition("accepted", "ready")).toBe(true);
    expect(canTransition("accepted", "cancelled")).toBe(true);
    expect(canTransition("ready", "picked_up")).toBe(true);
    expect(canTransition("ready", "no_show")).toBe(true);
  });

  it("rejects the illegal jump from the checklist (new → ready)", () => {
    expect(canTransition("new", "ready")).toBe(false);
  });

  it("terminal states go nowhere", () => {
    for (const from of ["picked_up", "no_show", "cancelled"] as const) {
      for (const to of ORDER_STATUSES) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it("nothing ever transitions back to new", () => {
    for (const from of ORDER_STATUSES) {
      expect(canTransition(from, "new")).toBe(false);
    }
  });
});
