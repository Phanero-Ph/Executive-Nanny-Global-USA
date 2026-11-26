import {desc,eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import {db} from "@/db";
import {callBookings,callBookingSettings} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {adminCan} from "@/lib/admin-permissions";
import {getCallSettings,parseSettings,formatCallTime} from "@/lib/call-scheduling";
import {callConfirmationEmail} from "@/lib/call-email";
import {queueEmail} from "@/lib/mail";
async function authorized(){const actor=await getCurrentUser();return actor?.role==="admin"&&await adminCan(actor,"matching.manage")?actor:null;}
export async function GET(){if(!await authorized())return NextResponse.json({error:"Administrator access required."},{status:403});try{const [row,bookings]=await Promise.all([getCallSettings(),db.select().from(callBookings).orderBy(desc(callBookings.startsAt)).limit(200)]);return NextResponse.json({settings:parseSettings(row),bookings});}catch{return NextResponse.json({error:"Unable to load call bookings."},{status:503});}}
export async function PATCH(request:Request){
 const actor=await authorized();if(!actor)return NextResponse.json({error:"Administrator access required."},{status:403});const b=await request.json().catch(()=>null);if(!b||typeof b!=="object")return NextResponse.json({error:"Invalid update."},{status:400});
 try{
  if(b.action==="settings"){
   const duration=Number(b.durationMinutes),buffer=Number(b.bufferMinutes),lead=Number(b.leadHours),ahead=Number(b.maxDaysAhead),hours=b.hours,blocked=b.blocked;
   if(!Number.isInteger(duration)||duration<15||duration>120||!Number.isInteger(buffer)||buffer<0||buffer>60||!Number.isInteger(lead)||lead<0||lead>720||!Number.isInteger(ahead)||ahead<1||ahead>365||!hours||typeof hours!=="object"||!Array.isArray(blocked)||blocked.length>100)return NextResponse.json({error:"Check duration, buffer, notice, booking window, weekly hours, and blocked dates."},{status:400});
   for(let day=0;day<=6;day++){const span=hours[String(day)];if(span!==null&&(!span||typeof span.start!=="string"||typeof span.end!=="string"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(span.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(span.end)||span.start>=span.end))return NextResponse.json({error:"Each enabled day needs a valid start time before its end time."},{status:400});}
   if(blocked.some((d:any)=>typeof d!=="string"||!/^(20\d\d|19\d\d)-\d\d-\d\d$/.test(d)))return NextResponse.json({error:"Blocked dates must use YYYY-MM-DD."},{status:400});
   const settings=await getCallSettings();await db.update(callBookingSettings).set({durationMinutes:duration,bufferMinutes:buffer,leadHours:lead,maxDaysAhead:ahead,weeklyHours:JSON.stringify(hours),blockedDates:JSON.stringify([...new Set(blocked)]),revision:settings.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(callBookingSettings.id,1));return NextResponse.json({ok:true});
  }
  if(typeof b.id!=="string"||!(["confirm","cancel"].includes(b.action)))return NextResponse.json({error:"Choose a valid booking action."},{status:400});
  const [booking]=await db.select().from(callBookings).where(eq(callBookings.id,b.id)).limit(1);if(!booking)return NextResponse.json({error:"Call request not found."},{status:404});
  if(b.action==="cancel"){
   await db.update(callBookings).set({status:"cancelled",updatedAt:new Date()}).where(eq(callBookings.id,b.id));
   try{const delivery=await queueEmail(null,booking.email,"Your call request was cancelled",`Hello ${booking.name},\n\nYour call request for ${formatCallTime(booking.startsAt,booking.timezone)} has been cancelled. Please visit the website to choose another available time.\n\nExecutive Global Nanny`);return NextResponse.json({ok:true,emailDelivery:delivery.status,message:delivery.message});}
   catch(error){console.error("Call request was cancelled, but its email could not be queued.",error);return NextResponse.json({ok:true,emailDelivery:"failed",message:"The request was cancelled, but the notification could not be queued. Check the mail server configuration."});}
  }
  if(typeof b.meetingDetails!=="string"||!b.meetingDetails.trim()||b.meetingDetails.length>2000||typeof b.reply!=="string"||!b.reply.trim()||b.reply.length>4000)return NextResponse.json({error:"Add meeting details and a reply for the visitor."},{status:400});
  await db.update(callBookings).set({status:"confirmed",meetingDetails:b.meetingDetails.trim(),adminReply:b.reply.trim(),updatedAt:new Date()}).where(eq(callBookings.id,b.id));
  try{const content=callConfirmationEmail({name:booking.name,scheduledFor:formatCallTime(booking.startsAt,booking.timezone),meetingDetails:b.meetingDetails.trim(),reply:b.reply.trim()});const delivery=await queueEmail(null,booking.email,"Your call is confirmed",content.text,content.html);return NextResponse.json({ok:true,emailDelivery:delivery.status,message:delivery.message});}
  catch(error){console.error("Meeting details were saved, but the confirmation email could not be queued.",error);return NextResponse.json({ok:true,emailDelivery:"failed",message:"Meeting details were saved, but the email could not be queued. Check the mail server configuration."});}
 }catch(error){console.error("Call booking update failed.",error);return NextResponse.json({error:"Unable to update this call request."},{status:500});}
}
