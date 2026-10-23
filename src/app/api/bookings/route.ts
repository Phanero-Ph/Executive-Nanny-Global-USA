import {adminCan} from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {credentialsEligible} from "@/lib/credentials";
import { NextResponse } from "next/server";
import { and,count,eq,inArray,ne,or,sql } from "drizzle-orm";
import { db } from "@/db";
import { users,careBookings,bookingAssignments,bookingEvents,membershipCycles,membershipPayments,nannyApplications,nannyMatches,mailJobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/mail";
import { BOOKING_LIMITS,BOOKING_LABELS,OPEN_BOOKING_STATUSES,membershipWindow,parseBookingTime } from "@/lib/bookings";
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
async function notify(tx:Tx,id:string,status:string,ids:string[]){
 const recipients=await tx.select({id:users.id,email:users.email,role:users.role}).from(users).where(or(inArray(users.id,[...new Set(ids)]),eq(users.role,"admin"))).limit(100);
 for(const recipient of recipients){if(recipient.role==="admin"&&!await adminCan(recipient,"matching.view",tx))continue;await tx.insert(mailJobs).values({userId:recipient.id,recipient:recipient.email,subject:"Care booking update",body:`Booking ${id}: ${BOOKING_LABELS[status]??status}. View your dashboard for the latest details: ${appUrl(recipient.role==="admin"?"/dashboard/admin/bookings":`/dashboard/${recipient.role}`)}\n\nExecutive Global Nanny`});}
}
async function paidCycle(tx:Tx,cycleId:string,familyId:string,start:Date,end:Date){
 const [cycle]=await tx.select().from(membershipCycles).where(and(eq(membershipCycles.id,cycleId),eq(membershipCycles.userId,familyId))).for("update");
 if(!cycle||cycle.cancelledAt||!Object.hasOwn(BOOKING_LIMITS,cycle.plan))return false;
 const window=membershipWindow(cycle);if(start<window.start||end>window.end)return false;
 const payments=await tx.select().from(membershipPayments).where(eq(membershipPayments.cycleId,cycle.id));
 return payments.filter(p=>!p.voidedAt).reduce((sum,p)=>sum+p.amountCents-p.refundedCents,0)>=cycle.amountCents;
}
async function handle(req:Request,create:boolean){
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(actor.role==="admin"&&!await adminCan(actor,"matching.manage"))return Response.json({error:"Permission required."},{status:403});
 if(create&&actor.role!=="family")return NextResponse.json({error:"A family account is required."},{status:403});
 const body=await req.json().catch(()=>null);if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request."},{status:400});
 const start=parseBookingTime(body.startsAt),end=parseBookingTime(body.endsAt);
 if(create&&(!start||!end||start.getTime()<=Date.now()||end.getTime()-start.getTime()<30*60000||end.getTime()-start.getTime()>24*3600000||typeof body.requestKey!=="string"||!/^[a-f0-9-]{36}$/i.test(body.requestKey)||typeof body.town!=="string"||!body.town.trim()||body.town.length>255||typeof body.address!=="string"||!body.address.trim()||body.address.length>1000||typeof body.careNeeds!=="string"||!body.careNeeds.trim()||body.careNeeds.length>3000))return NextResponse.json({error:"Enter a future booking lasting 30 minutes to 24 hours, with location and care needs."},{status:400});
 if(!create&&(typeof body.id!=="string"||!Number.isInteger(body.revision)||!["assign","accept","decline","confirm","cancel","complete"].includes(body.action)||body.note!==undefined&&(typeof body.note!=="string"||body.note.length>500)))return NextResponse.json({error:"Invalid booking update."},{status:400});
 try{
 const [snapshot]=create?[]:await db.select().from(careBookings).where(eq(careBookings.id,body.id)).limit(1);
 if(!create&&(!snapshot||(actor.role!=="admin"&&!(actor.role==="family"&&snapshot.familyId===actor.id)&&!(actor.role==="nanny"&&snapshot.caregiverId===actor.id))))return NextResponse.json({error:"Booking not found."},{status:404});
 const result=await db.transaction(async tx=>{
 const familyId=create?actor.id:snapshot!.familyId;
 const [family]=await tx.select({id:users.id,role:users.role}).from(users).where(eq(users.id,familyId)).for("update");
 if(family?.role!=="family")return{status:409,error:"Family account unavailable."};
 if(create){
 const [existing]=await tx.select().from(careBookings).where(and(eq(careBookings.familyId,actor.id),eq(careBookings.requestKey,body.requestKey)));if(existing){if(Math.floor(existing.startsAt.getTime()/1000)!==Math.floor(start!.getTime()/1000)||Math.floor(existing.endsAt.getTime()/1000)!==Math.floor(end!.getTime()/1000)||existing.town!==body.town.trim()||existing.address!==body.address.trim()||existing.careNeeds!==body.careNeeds.trim())return{status:409,error:"This submission is already linked to another booking. Refresh before submitting a new request."};return{status:200,id:existing.id};}
 const cycles=await tx.select().from(membershipCycles).where(eq(membershipCycles.userId,actor.id)).orderBy(sql`${membershipCycles.startDate} DESC`).for("update");
 let selected:typeof membershipCycles.$inferSelect|undefined;
 for(const cycle of cycles){const window=membershipWindow(cycle);if(new Date()<window.start||new Date()>=window.end)continue;if(await paidCycle(tx,cycle.id,actor.id,start!,end!)){selected=cycle;break;}}
 if(!selected)return{status:409,error:"A fully paid, active membership must cover the entire booking. Contact our team to set up or renew your membership."};
 const [{used}]=await tx.select({used:count()}).from(careBookings).where(and(eq(careBookings.cycleId,selected.id),eq(careBookings.consumesCredit,1)));
 const limit=BOOKING_LIMITS[selected.plan];if(limit!==null&&used>=limit)return{status:409,error:"You have used all bookings in this membership period."};
 const overlap=await tx.select({id:careBookings.id}).from(careBookings).where(and(eq(careBookings.familyId,actor.id),inArray(careBookings.status,OPEN_BOOKING_STATUSES),sql`${careBookings.startsAt}<${end}`,sql`${careBookings.endsAt}>${start}`)).limit(1);
 if(overlap.length)return{status:409,error:"Your family already has a booking during these times."};
 const [created]=await tx.insert(careBookings).values({familyId:actor.id,cycleId:selected.id,requestKey:body.requestKey,startsAt:start!,endsAt:end!,town:body.town.trim(),address:body.address.trim(),careNeeds:body.careNeeds.trim()}).$returningId();
 await tx.insert(bookingEvents).values({bookingId:created.id,actorId:actor.id,action:"requested"});await notify(tx,created.id,"requested",[actor.id]);return{status:200,id:created.id};
 }
 const [booking]=await tx.select().from(careBookings).where(eq(careBookings.id,body.id)).for("update");
 if(!booking||booking.revision!==body.revision)return{status:409,error:"This booking changed. Refresh before saving."};
 if(actor.role!=="admin"&&!(actor.role==="family"&&booking.familyId===actor.id)&&!(actor.role==="nanny"&&booking.caregiverId===actor.id))return{status:404,error:"Booking not found."};
 if(!OPEN_BOOKING_STATUSES.includes(booking.status))return{status:409,error:"This booking is already closed."};
 const action=body.action as string;
 if((actor.role==="family"&&action!=="cancel")||(actor.role==="nanny"&&!["accept","decline"].includes(action))||(actor.role==="admin"&&!["assign","confirm","cancel","complete"].includes(action)))return{status:403,error:"This action is not permitted."};
 if(action!=="cancel"&&action!=="complete"&&booking.startsAt.getTime()<=Date.now())return{status:409,error:"The booking has already started."};
 if(action==="cancel"&&actor.role==="family"&&booking.startsAt.getTime()<=Date.now())return{status:409,error:"Contact our team to cancel after care has started."};
 let caregiver=booking.caregiverId,application=booking.applicationId,status=booking.status;
 if(action==="assign"){
 if(typeof body.applicationId!=="string")return{status:400,error:"Choose an approved caregiver."};
 const [candidate]=await tx.select().from(nannyApplications).where(eq(nannyApplications.id,body.applicationId));
 if(!candidate?.userId||candidate.status!=="active")return{status:409,error:"Choose an approved, active caregiver."};caregiver=candidate.userId;application=candidate.id;
 }
 const lockedIds=[...new Set([caregiver,booking.caregiverId].filter((id):id is string=>!!id))].sort();
 for(const id of lockedIds)await tx.select({id:users.id}).from(users).where(eq(users.id,id)).for("update");
 if(["assign","accept","confirm"].includes(action)){
 if(!await paidCycle(tx,booking.cycleId,familyId,booking.startsAt,booking.endsAt))return{status:409,error:"Membership payment needs attention before this booking can proceed."};
 const [candidate]=application?await tx.select().from(nannyApplications).where(eq(nannyApplications.id,application)).for("update"):[];
 const [account]=caregiver?await tx.select({role:users.role}).from(users).where(eq(users.id,caregiver)):[];
 if(!candidate||candidate.userId!==caregiver||candidate.status!=="active"||account?.role!=="nanny")return{status:409,error:"This caregiver is no longer eligible for assignment."};
 if(!await credentialsEligible(tx,caregiver!,booking.endsAt))return{status:409,error:"Current CPR and First Aid certificates and a clear, current agency background check must cover the entire booking."};
 const placements=await tx.select({id:nannyMatches.id}).from(nannyMatches).innerJoin(nannyApplications,eq(nannyMatches.nannyApplicationId,nannyApplications.id)).where(and(eq(nannyApplications.userId,caregiver!),eq(nannyMatches.status,"placed"))).limit(1);
 const conflicts=await tx.select({id:careBookings.id}).from(careBookings).where(and(eq(careBookings.caregiverId,caregiver!),ne(careBookings.id,booking.id),inArray(careBookings.status,["assigned","accepted","confirmed"]),sql`${careBookings.startsAt}<${booking.endsAt}`,sql`${careBookings.endsAt}>${booking.startsAt}`)).limit(1);
 if(placements.length||conflicts.length)return{status:409,error:"This caregiver has a conflicting assignment or placement."};
 }
 if(action==="assign"){
 if(booking.caregiverId===caregiver)return{status:409,error:"This caregiver is already assigned."};
 await tx.update(bookingAssignments).set({status:"withdrawn",respondedAt:new Date()}).where(and(eq(bookingAssignments.bookingId,booking.id),inArray(bookingAssignments.status,["invited","accepted"])));
 await tx.insert(bookingAssignments).values({bookingId:booking.id,caregiverId:caregiver!});status="assigned";
 }else if(action==="accept"||action==="decline"){
 if(booking.status!=="assigned")return{status:409,error:"Only pending invitations can be accepted or declined."};
 await tx.update(bookingAssignments).set({status:action==="accept"?"accepted":"declined",respondedAt:new Date()}).where(and(eq(bookingAssignments.bookingId,booking.id),eq(bookingAssignments.caregiverId,actor.id),eq(bookingAssignments.status,"invited")));
 status=action==="accept"?"accepted":"requested";if(action==="decline"){caregiver=null;application=null;}
 }else if(action==="confirm"){
 if(booking.status!=="accepted")return{status:409,error:"The caregiver must accept before confirmation."};status="confirmed";
 }else if(action==="complete"){
 if(booking.status!=="confirmed"||booking.endsAt.getTime()>Date.now())return{status:409,error:"Only confirmed bookings whose care period has ended can be completed."};status="completed";
 }else{
 status="cancelled";await tx.update(bookingAssignments).set({status:"cancelled",respondedAt:new Date()}).where(and(eq(bookingAssignments.bookingId,booking.id),inArray(bookingAssignments.status,["invited","accepted"])));
 }
 await tx.update(careBookings).set({status,caregiverId:caregiver,applicationId:application,consumesCredit:status==="cancelled"&&booking.startsAt.getTime()>Date.now()?0:booking.consumesCredit,revision:sql`${careBookings.revision}+1`,updatedAt:new Date()}).where(eq(careBookings.id,booking.id));
 await tx.insert(bookingEvents).values({bookingId:booking.id,actorId:actor.id,action,note:typeof body.note==="string"?body.note.trim()||null:null});
 await notify(tx,booking.id,status,[familyId,...lockedIds]);return{status:200,id:booking.id};
 },{isolationLevel:"read committed"});return NextResponse.json(result.status===200?{ok:true,id:result.id}:{error:result.error},{status:result.status});
 }catch{console.error("Booking could not be saved.");return NextResponse.json({error:"Unable to save booking. Please try again."},{status:500});}
}
export async function POST(req:Request){return handle(req,true);}
export async function PATCH(req:Request){return handle(req,false);}
