import Stripe from "stripe";
import { env } from "@/lib/env";

const globalStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }

  if (!globalStripe.stripe) {
    globalStripe.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  return globalStripe.stripe;
}
