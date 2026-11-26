import {and,eq,gt,lt,inArray} from "drizzle-orm";
import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {db} from "@/db";
import {callBookings,callBookingSettings,users} from "@/db/schema";
import {isAllowedRequestOrigin} from "@/lib/request-origin";
import {isValidEmail} from "@/lib/utils";
import {formatCallTime,getCallSettings,slotsForDate} from "@/lib/call-scheduling";
import {appUrl,queueEmail} from "@/lib/mail";
export const dynamic="force-dynamic";
export async function GET(request:Request){const day=new URL(request.url).searchParams.get("date")??"";try{return NextResponse.json(await slotsForDate(day),{headers:{"Cache-Control":"no-store"}});}catch(error){console.error("Public call availability could not be loaded. Confirm the call-booking tables exist and the database is reachable.",error);return NextResponse.json({error:"Availability is temporarily unavailable. Please try again shortly or contact our team."},{status:503});}}
export async function POST(request:Request){
 if(!isAllowedRequestOrigin(request))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const b=await request.json().catch(()=>null);if(!b||typeof b!=="object"||typeof b.name!=="string"||!b.name.trim()||b.name.length>255||typeof b.email!=="string"||!isValidEmail(b.email)||typeof b.startsAt!=="string"||typeof b.message!=="string"||b.message.length>2000||b.phone!==undefined&&(typeof b.phone!=="string"||b.phone.length>50)||b.website)return NextResponse.json({error:"Please complete your name, valid email and selected time."},{status:400});
 const start=new Date(b.startsAt);if(!Number.isFinite(start.getTime())||start.getTime()<=Date.now())return NextResponse.json({error:"Choose an available future time."},{status:400});
 try{
  await getCallSettings();const day=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(start);
  const result=await db.transaction(async tx=>{
   const [settings]=await tx.select().from(callBookingSettings).where(eq(callBookingSettings.id,1)).for("update");
   if(!settings)return null;
   const generated=await slotsForDate(day,tx);if(!generated.slots.some((s:any)=>s.startsAt===start.toISOString()))return null;
   const end=new Date(start.getTime()+settings.durationMinutes*60000),id=randomUUID();
   const bufferMs=settings.bufferMinutes*60000,[overlap]=await tx.select({id:callBookings.id}).from(callBookings).where(and(inArray(callBookings.status,["pending","confirmed"]),lt(callBookings.startsAt,new Date(end.getTime()+bufferMs)),gt(callBookings.endsAt,new Date(start.getTime()-bufferMs)))).limit(1);
   if(overlap)return null;
   await tx.insert(callBookings).values({id,name:b.name.trim(),email:b.email.trim().toLowerCase(),phone:typeof b.phone==="string"?b.phone.trim()||null:null,startsAt:start,endsAt:end,timezone:settings.timezone,message:b.message.trim()||null,status:"pending"});return {id,timezone:settings.timezone,durationMinutes:settings.durationMinutes};
  });
  if(!result)return NextResponse.json({error:"That time is no longer available. Please choose another slot."},{status:409});
  const when=formatCallTime(start,result.timezone),adminBody=`A new call request is waiting for review.\n\nName: ${b.name.trim()}\nEmail: ${b.email.trim()}\nPhone: ${b.phone?.trim()||"Not provided"}\nRequested time: ${when}\nDuration: ${result.durationMinutes} minutes\nMessage: ${b.message.trim()||"None"}\n\nManage requests: ${appUrl("/dashboard/admin/calls")}`;
  try{const admins=await db.select({id:users.id,email:users.email}).from(users).where(eq(users.role,"admin")).limit(100);const recipients=new Set(["info@executiveglobalnanny.com",...admins.map(a=>a.email)]);for(const email of recipients){const admin=admins.find(a=>a.email===email);await queueEmail(admin?.id??null,email,"New Book a Call request",adminBody);}await queueEmail(null,b.email.trim(),"We received your call request",`Hi ${b.name.trim()},\n\nYour call request is received for ${when} (${result.durationMinutes} minutes). Our team will confirm and send meeting details by email.\n\nExecutive Global Nanny`);}catch{console.error("Call booking notifications could not be sent.");}
  return NextResponse.json({ok:true,id:result.id});
 }catch(error){console.error("Call booking could not be saved.",error);return NextResponse.json({error:"We could not save your request. Please try again."},{status:500});}
}
