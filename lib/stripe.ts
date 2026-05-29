/**
 * Server-side Stripe client.
 *
 * Lazily instantiated so the rest of the app (and the build) doesn't fall over
 * when STRIPE_SECRET_KEY isn't set — only the ordering routes need it.
 */

import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env to enable ordering."
    );
  }
  if (!client) {
    // Pin to the account default API version by omitting `apiVersion`.
    client = new Stripe(key, { appInfo: { name: "The Break Room" } });
  }
  return client;
}

/** True when the publishable key is configured (used to gate the UI). */
export function orderingEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
