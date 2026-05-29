import type { Metadata } from "next";
import { OrderCheckout } from "@/components/order/OrderCheckout";

export const metadata: Metadata = {
  title: "Order ahead",
  description:
    "Order coffee, pastries, and lunch from The Break Room ahead of time and pick it up without the wait.",
};

export default function OrderPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-qh-accent">
          Order ahead
        </p>
        <h1 className="mt-3 font-display tracking-tighter2">
          Skip the line, not the ritual.
        </h1>
        <p className="mt-5 text-qh-ink-soft text-lg">
          Pay now, pick a time, and it&#8217;ll be ready when you arrive.
        </p>
      </header>
      <div className="hand-divider mt-10 mb-12" />
      <OrderCheckout />
    </div>
  );
}
