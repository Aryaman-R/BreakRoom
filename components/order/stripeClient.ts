"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let promise: Promise<Stripe | null> | null = null;

/**
 * Singleton publishable-key Stripe loader. Returns null when the key isn't
 * configured so the UI can degrade gracefully instead of throwing.
 */
export function getStripePromise(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!promise) promise = loadStripe(key);
  return promise;
}
