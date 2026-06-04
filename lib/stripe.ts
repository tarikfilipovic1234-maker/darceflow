import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Returns the Stripe SDK client. Throws a friendly error if the secret key
 * isn't set so server actions can surface it nicely instead of crashing.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env to enable checkout, " +
        "the customer portal, and live webhooks.",
    );
  }
  cached = new Stripe(key, {
    typescript: true,
  });
  return cached;
}
