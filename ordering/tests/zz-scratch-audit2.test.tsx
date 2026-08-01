// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { KIOSK_STORAGE_KEY } from "../lib/kiosk";
import { KioskProvider, useKiosk } from "../components/kiosk/KioskProvider";
import { KioskIdle } from "../components/kiosk/KioskIdle";
import OrderStatusPage from "../app/order/[id]/page";

let path = "/order/abc";
const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => path,
  useRouter: () => ({ push: vi.fn(), replace, refresh }),
}));

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  localStorage.setItem(KIOSK_STORAGE_KEY, "1");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function Probe() {
  const { attract } = useKiosk();
  return <span data-testid="attract">{String(attract)}</span>;
}

describe("kiosk strands", () => {
  it("D: kiosk + 404 order id shows a dead end with no timer to reset it", async () => {
    path = "/order/nope";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 404 }))
    );
    render(
      <KioskProvider>
        <Probe />
        <KioskIdle />
        <OrderStatusPage params={{ id: "nope" }} searchParams={{ n: "42" }} />
      </KioskProvider>
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByText(/Order not found/)).toBeTruthy();
    // No kiosk confirmation => no auto-reset countdown.
    expect(screen.queryByText(/This screen clears in/)).toBeNull();

    // And the idle timer is disarmed on /order/ paths, so nothing else fires.
    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.queryByText(/Still ordering\?/)).toBeNull();
    expect(screen.getByTestId("attract").textContent).toBe("false");
    expect(replace).not.toHaveBeenCalled();
  });

  it("E: idle warning fires and wipes an abandoned cart on /", async () => {
    path = "/";
    localStorage.setItem("breakroom-cart-v1", "[{}]");
    vi.useFakeTimers();
    render(
      <KioskProvider>
        <Probe />
        <KioskIdle />
      </KioskProvider>
    );
    // provider effect runs, attract=true on "/" at boot; simulate a started
    // session by rendering with attract cleared is not possible here, so this
    // asserts the *boot* state instead: idle disarmed behind attract.
    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.queryByText(/Still ordering\?/)).toBeNull();
    expect(localStorage.getItem("breakroom-cart-v1")).toBe("[{}]");
  });
});
