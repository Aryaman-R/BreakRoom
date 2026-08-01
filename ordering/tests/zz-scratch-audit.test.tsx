// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { KIOSK_STORAGE_KEY } from "../lib/kiosk";
import { KioskProvider, useKiosk } from "../components/kiosk/KioskProvider";
import { KioskExit } from "../components/kiosk/KioskExit";
import { OrderApp } from "../components/customer/OrderApp";
import type { MenuItem } from "../lib/types";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace, refresh }),
}));

const MENU: MenuItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Latte",
    description: "",
    category: "Drinks",
    price_cents: 500,
    variants: [],
    addons: [],
    available: true,
    sort_order: 1,
  } as unknown as MenuItem,
];

const STALE_CART = JSON.stringify([
  {
    menu_item_id: "11111111-1111-1111-1111-111111111111",
    item_name: "Latte",
    variant_label: null,
    addon_labels: [],
    unit_cents: 500,
    quantity: 3,
    notes: "",
  },
]);

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});
afterEach(cleanup);

describe("kiosk session lifecycle", () => {
  it("A: a stale cart survives a kiosk reload and greets the next customer", async () => {
    localStorage.setItem(KIOSK_STORAGE_KEY, "1");
    localStorage.setItem("breakroom-cart-v1", STALE_CART);

    function Harness() {
      const { attract, beginSession } = useKiosk();
      return (
        <>
          <button data-testid="tap" onClick={beginSession}>
            tap {String(attract)}
          </button>
          <OrderApp
            menu={MENU}
            open
            hoursCopy="7am - 2pm"
            maxQty={5}
            allowWalkin
            source="web"
          />
        </>
      );
    }
    render(
      <KioskProvider>
        <Harness />
      </KioskProvider>
    );
    // simulate the next customer tapping "tap anywhere to start"
    await act(async () => {
      fireEvent.click(screen.getByTestId("tap"));
    });
    // If the reload wiped the session there should be no cart bar at all.
    expect(screen.queryByText(/View order/)).toBeTruthy();
    expect(screen.getByText(/View order/).textContent).toContain("3 items");
    expect(localStorage.getItem("breakroom-cart-v1")).toBe(STALE_CART);
  });

  it("B: an abandoned staff PIN pad survives endSession and sits over attract", async () => {
    localStorage.setItem(KIOSK_STORAGE_KEY, "1");

    function Harness() {
      const { attract, endSession } = useKiosk();
      return (
        <>
          <span data-testid="attract">{String(attract)}</span>
          <button data-testid="end" onClick={endSession}>
            end
          </button>
          <KioskExit />
        </>
      );
    }
    render(
      <KioskProvider>
        <Harness />
      </KioskProvider>
    );
    const hotspot = document.querySelector<HTMLButtonElement>(
      'button[aria-hidden="true"]'
    )!;
    await act(async () => {
      for (let i = 0; i < 5; i++) fireEvent.click(hotspot);
    });
    expect(screen.queryByText("Staff exit")).toBeTruthy();

    // The idle timer fires (or the customer taps "Start over"): session ends.
    await act(async () => {
      fireEvent.click(screen.getByTestId("end"));
    });
    expect(screen.getByTestId("attract").textContent).toBe("true");
    // Pad still up, over the attract screen, with no timer left to clear it.
    expect(screen.queryByText("Staff exit")).toBeTruthy();
  });

  it("C: a PIN longer than 12 digits can never be submitted", async () => {
    localStorage.setItem(KIOSK_STORAGE_KEY, "1");
    const prev = process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN;
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = "1234567890123"; // 13 digits
    render(
      <KioskProvider>
        <KioskExit />
      </KioskProvider>
    );
    const hotspot = document.querySelector<HTMLButtonElement>(
      'button[aria-hidden="true"]'
    )!;
    await act(async () => {
      for (let i = 0; i < 5; i++) fireEvent.click(hotspot);
    });
    expect(screen.queryByText("Staff exit")).toBeTruthy();
    for (const d of "1234567890123") {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: d }));
      });
    }
    // Never submitted: no wrong-PIN message, pad still open, entry capped at 12.
    expect(screen.queryByText(/Wrong PIN/)).toBeNull();
    expect(screen.getByLabelText(/digits entered/).getAttribute("aria-label")).toBe(
      "12 digits entered"
    );
    expect(localStorage.getItem(KIOSK_STORAGE_KEY)).toBe("1");
    process.env.NEXT_PUBLIC_KIOSK_EXIT_PIN = prev;
  });
});
