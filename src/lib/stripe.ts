import Stripe from "stripe";
import { MEMBERSHIP_PLANS } from "./membership";
export function getStripe() {
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key||!/^sk_(test|live)_/.test(key))throw new Error("Stripe is not configured.");
 if(key.startsWith("sk_live_")&&process.env.STRIPE_ALLOW_LIVE!=="true")throw new Error("Live Stripe payments are not enabled.");
 return new Stripe(key,{timeout:15000,maxNetworkRetries:2});
}
export function stripePrices(){return MEMBERSHIP_PLANS.map(plan=>({...plan,priceId:process.env[`STRIPE_PRICE_${plan.name.toUpperCase()}`]}));}
export function stripeReady(){const key=process.env.STRIPE_SECRET_KEY;return Boolean(key&&/^sk_(test|live)_/.test(key)&&(!key.startsWith("sk_live_")||process.env.STRIPE_ALLOW_LIVE==="true")&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.STRIPE_PORTAL_CONFIGURATION&&stripePrices().every(p=>p.priceId));}
export async function checkedPrice(stripe:Stripe,name:string){
 const plan=stripePrices().find(p=>p.name===name);if(!plan?.priceId)throw new Error("Stripe plan is not configured.");
 const price=await stripe.prices.retrieve(plan.priceId);
 if(!price.active||price.currency!=="usd"||price.unit_amount!==plan.amountCents||price.recurring?.interval!=="month"||price.recurring.interval_count!==1||price.recurring.usage_type!=="licensed")throw new Error("Stripe price does not match the membership plan.");
 return plan;
}
export function stripeMode(){return process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")?"live":"test";}
