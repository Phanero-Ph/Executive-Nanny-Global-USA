import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stripeBilling, stripeEvents } from "@/db/schema";
import { getStripe, stripeMode } from "./stripe";
import { processStripeEvent, STRIPE_EVENTS } from "./stripe-events";

// Scan all relevant events, not just Stripe's delivery failures: a local listener
// can miss an event that Stripe delivered successfully to another endpoint.
export async function recoverStripeEvents(stripe: Stripe = getStripe(), now = new Date()) {
 const result = { scanned: 0, recovered: 0, skipped: 0, failed: 0 };
 const events = stripe.events.list({
  types: STRIPE_EVENTS,
  created: { gte: Math.floor(now.getTime() / 1000) - 30 * 86400, lte: Math.floor(now.getTime() / 1000) },
  limit: 100,
 });
 for await (const event of events) {
  if (++result.scanned > 10000) throw new Error("Stripe recovery scan limit reached; review the recovery backlog.");
  if (event.livemode !== (stripeMode() === "live")) throw new Error("Stripe recovery mode mismatch.");
  const object = event.data.object as { customer?: string | { id: string } | null };
  const customer = typeof object.customer === "string" ? object.customer : object.customer?.id;
  if (!customer) { result.skipped++; continue; }
  const [owner] = await db.select({ id: stripeBilling.userId }).from(stripeBilling).where(eq(stripeBilling.customerId, customer));
  const [seen] = await db.select({ id: stripeEvents.id }).from(stripeEvents).where(eq(stripeEvents.id, event.id));
  if (!owner || seen) { result.skipped++; continue; }
  try {
   // Uses the webhook's transaction, ownership checks and duplicate protection.
   // The event came directly from authenticated Stripe API pagination.
   await processStripeEvent(event);
   result.recovered++;
  } catch {
   result.failed++;
   console.error(`Stripe recovery failed for ${event.type}; it will be retried on the next run.`);
  }
 }
 return result;
}
