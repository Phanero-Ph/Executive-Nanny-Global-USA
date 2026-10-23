import {adminCan} from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {actorChatEnabled,getChatSettings} from "@/lib/chat-settings";
import {NextResponse} from "next/server";
import {and,eq,or,like,inArray} from "drizzle-orm";
import {db} from "@/db";
import {conversations,users} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {UUID,conversationInbox} from "@/lib/messaging";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});if(!["family","nanny","admin"].includes(actor.role))return NextResponse.json({error:"Account access required."},{status:403});
 const search=new URL(req.url).searchParams.get("contacts");
 if(search!==null){if(actor.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
 const flags=await getChatSettings();const roles=[...(flags.familyEnabled&&await adminCan(actor,"messages.family")?["family"]:[]),...(flags.nannyEnabled&&await adminCan(actor,"messages.nanny")?["nanny"]:[])];if(!roles.length)return NextResponse.json({contacts:[]},{headers:{"Cache-Control":"private, no-store"}});
 const contacts=await db.select({id:users.id,name:users.name,role:users.role}).from(users).where(and(inArray(users.role,roles),or(like(users.name,`%${search.slice(0,100)}%`),eq(users.id,search)))).limit(30);return NextResponse.json({contacts},{headers:{"Cache-Control":"private, no-store"}});}
 try{return NextResponse.json({conversations:await conversationInbox(actor)},{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Unable to load messages."},{status:500});}
}
export async function POST(req:Request){
 if(!isAllowedRequestOrigin(req))return NextResponse.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return NextResponse.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});if(!["family","nanny","admin"].includes(actor.role))return NextResponse.json({error:"Account access required."},{status:403});
 const body=await req.json().catch(()=>null);
 const memberId=actor.role==="admin"?body?.memberId:actor.id;
 if(typeof memberId!=="string"||!UUID.test(memberId)||actor.role!=="admin"&&body?.memberId&&body.memberId!==actor.id)return NextResponse.json({error:"Choose your agency conversation."},{status:400});
 try{const id=await db.transaction(async tx=>{
  const [member]=await tx.select().from(users).where(eq(users.id,memberId)).for("update");
  if(!member||!["family","nanny"].includes(member.role)||!await actorChatEnabled(member,tx)||actor.role==="admin"&&!await adminCan(actor,member.role==="family"?"messages.family":"messages.nanny",tx))return null;
  const [existing]=await tx.select().from(conversations).where(and(eq(conversations.kind,"agency"),eq(conversations.memberId,memberId)));
  if(existing)return existing.id;
  const [created]=await tx.insert(conversations).values({kind:"agency",sourceId:memberId,memberId}).$returningId();return created.id;
 },{isolationLevel:"read committed"});return id?NextResponse.json({id}):NextResponse.json({error:"Account unavailable."},{status:404});
 }catch{return NextResponse.json({error:"Unable to open conversation."},{status:500});}
}
