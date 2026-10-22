import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {stripeBilling} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {getStripe} from "@/lib/stripe";
import {appUrl} from "@/lib/mail";
export async function POST(req:Request){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Please sign in."},{status:401});if(user.role!=="family")return NextResponse.json({error:"A family account is required."},{status:403});
 const [billing]=await db.select().from(stripeBilling).where(eq(stripeBilling.userId,user.id));if(!billing)return NextResponse.json({error:"No Stripe billing account found."},{status:404});
 if(!process.env.STRIPE_PORTAL_CONFIGURATION)return NextResponse.json({error:"Billing management is being configured. Please contact our team."},{status:503});
 try{const session=await getStripe().billingPortal.sessions.create({customer:billing.customerId,configuration:process.env.STRIPE_PORTAL_CONFIGURATION,return_url:appUrl("/dashboard/family")});return NextResponse.json({url:session.url});}catch{return NextResponse.json({error:"Unable to open billing management. Please try again."},{status:502});}
}
