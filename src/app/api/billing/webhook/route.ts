import {NextResponse} from "next/server";
import {getStripe} from "@/lib/stripe";
import {processStripeEvent} from "@/lib/stripe-events";
export const runtime="nodejs";
export async function POST(req:Request){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"Webhook not configured."},{status:503});
 const signature=req.headers.get("stripe-signature");if(!signature)return NextResponse.json({error:"Missing signature."},{status:400});
 let event;
 try{event=getStripe().webhooks.constructEvent(await req.text(),signature,secret);}catch{return NextResponse.json({error:"Invalid webhook signature."},{status:400});}
 try{await processStripeEvent(event);return NextResponse.json({received:true});}catch{console.error(`Stripe event processing failed: ${event.type}`);return NextResponse.json({error:"Webhook processing failed; retry required."},{status:500});}
}
