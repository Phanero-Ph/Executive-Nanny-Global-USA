import {adminCan} from "@/lib/admin-permissions";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {actorChatEnabled,threadChatEnabled} from "@/lib/chat-settings";
import {and,count,desc,eq,gt,inArray,lt,lte,ne} from "drizzle-orm";
import {db} from "@/db";
import {conversations,conversationMessages,conversationAttachments,users,mailJobs} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {UUID,canReadConversation,markConversationRead} from "@/lib/messaging";
import {CHAT_MAX_FILES,CHAT_MESSAGE_FILE_LIMIT,CHAT_STAGING_MS} from "@/lib/chat-file-policy";
import {appUrl} from "@/lib/mail";
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
async function load(tx:Tx,id:string,actor:{id:string;role:string}){
 const [thread]=await tx.select().from(conversations).where(eq(conversations.id,id)).for("update");return thread&&canReadConversation(actor,thread)&&await threadChatEnabled(thread,tx,actor)?thread:null;
}
const privateHeaders={"Cache-Control":"private, no-store"};
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});const {id}=await params;
 if(!UUID.test(id))return Response.json({error:"Conversation not found."},{status:404});
 const query=new URL(req.url).searchParams,before=query.get("before"),around=query.get("around");
 if(before!==null&&(!/^\d+$/.test(before)||Number(before)<1||Number(before)>2147483647)||around!==null&&!UUID.test(around)||before&&around)return Response.json({error:"Invalid message cursor."},{status:400});
 try{const result=await db.transaction(async tx=>{
  const thread=await load(tx,id,actor);if(!thread)return null;
  let anchorSequence:number|undefined;if(around){const [anchor]=await tx.select({sequence:conversationMessages.sequence}).from(conversationMessages).where(and(eq(conversationMessages.conversationId,id),eq(conversationMessages.id,around)));if(!anchor)return null;anchorSequence=anchor.sequence;}
  const [member]=await tx.select({name:users.name,role:users.role}).from(users).where(eq(users.id,thread.memberId!));
  const messages=await tx.select({id:conversationMessages.id,sequence:conversationMessages.sequence,body:conversationMessages.body,createdAt:conversationMessages.createdAt,senderId:conversationMessages.senderId,senderName:users.name,senderRole:users.role,replyToId:conversationMessages.replyToId}).from(conversationMessages).innerJoin(users,eq(conversationMessages.senderId,users.id)).where(and(eq(conversationMessages.conversationId,id),before?lt(conversationMessages.sequence,Number(before)):undefined,anchorSequence?lte(conversationMessages.sequence,anchorSequence+12):undefined)).orderBy(desc(conversationMessages.sequence)).limit(50);
  messages.reverse();const quoteIds=[...new Set(messages.flatMap(m=>m.replyToId?[m.replyToId]:[]))];
  const quotes=quoteIds.length?await tx.select({id:conversationMessages.id,sequence:conversationMessages.sequence,body:conversationMessages.body,senderName:users.name,senderRole:users.role}).from(conversationMessages).innerJoin(users,eq(conversationMessages.senderId,users.id)).where(and(eq(conversationMessages.conversationId,id),inArray(conversationMessages.id,quoteIds))):[];
  const ids=[...new Set([...messages.map(m=>m.id),...quoteIds])];const files=ids.length?await tx.select({id:conversationAttachments.id,messageId:conversationAttachments.messageId,fileName:conversationAttachments.fileName,mimeType:conversationAttachments.mimeType,sizeBytes:conversationAttachments.sizeBytes}).from(conversationAttachments).where(and(eq(conversationAttachments.conversationId,id),inArray(conversationAttachments.messageId,ids))):[];
  return{id,memberName:member?.name??"Member",memberRole:member?.role,writable:true,lastSequence:thread.lastSequence,messages:messages.map(m=>{const quote=quotes.find(q=>q.id===m.replyToId);return{...m,attachments:files.filter(f=>f.messageId===m.id).map(({messageId:_,...file})=>{void _;return file;}),replyTo:quote?{...quote,body:quote.body.slice(0,280),attachmentName:files.find(f=>f.messageId===quote.id)?.fileName??null}:null};}),olderCursor:messages[0]?.sequence>1?messages[0].sequence:null};
 },{isolationLevel:"read committed"});return result?Response.json(result,{headers:privateHeaders}):Response.json({error:"Conversation not found."},{status:404});
 }catch{return Response.json({error:"Unable to load conversation."},{status:500});}
}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!isAllowedRequestOrigin(req))return Response.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});const {id}=await params;if(!UUID.test(id))return Response.json({error:"Conversation not found."},{status:404});
 if(Number(req.headers.get("content-length"))>16384)return Response.json({error:"Message is too long."},{status:400});const body=await req.json().catch(()=>null);
 if(!body||!["send","read"].includes(body.action))return Response.json({error:"Choose a valid message action."},{status:400});
 const attachmentIds:unknown=body.attachmentIds??[],replyToId=body.replyToId??null;
 if(body.action==="send"&&(typeof body.body!=="string"||body.body.length>2000||!Array.isArray(attachmentIds)||attachmentIds.length>CHAT_MAX_FILES||attachmentIds.some(value=>typeof value!=="string"||!UUID.test(value))||new Set(attachmentIds).size!==attachmentIds.length||!body.body.trim()&&!attachmentIds.length||typeof body.requestKey!=="string"||!UUID.test(body.requestKey)||replyToId!==null&&(typeof replyToId!=="string"||!UUID.test(replyToId)))||body.action==="read"&&(!Number.isInteger(body.sequence)||body.sequence<0))return Response.json({error:"Enter a message of up to 2,000 characters or attach up to 5 files."},{status:400});
 try{const result=await db.transaction(async tx=>{
  const thread=await load(tx,id,actor);if(!thread)return{status:404,error:"Conversation not found."};
  if(body.action==="read"){if(body.sequence>thread.lastSequence)return{status:400,error:"Read cursor exceeds the latest message."};await markConversationRead(tx,id,actor.id,body.sequence);return{status:200};}
  const ids=attachmentIds as string[];
  const [existing]=await tx.select().from(conversationMessages).where(and(eq(conversationMessages.conversationId,id),eq(conversationMessages.senderId,actor.id),eq(conversationMessages.requestKey,body.requestKey)));
  if(existing){const existingFiles=await tx.select({id:conversationAttachments.id}).from(conversationAttachments).where(eq(conversationAttachments.messageId,existing.id));return existing.body===body.body.trim()&&existing.replyToId===replyToId&&existingFiles.map(f=>f.id).sort().join() === [...ids].sort().join()?{status:200,id:existing.id,sequence:existing.sequence}:{status:409,error:"This submission key was already used for a different message."};}
  if(replyToId){const [original]=await tx.select({id:conversationMessages.id}).from(conversationMessages).where(and(eq(conversationMessages.conversationId,id),eq(conversationMessages.id,replyToId)));if(!original)return{status:400,error:"Reply to a message in this conversation."};}
  const files=ids.length?await tx.select().from(conversationAttachments).where(and(eq(conversationAttachments.conversationId,id),eq(conversationAttachments.uploaderId,actor.id),inArray(conversationAttachments.id,ids))):[];
  if(files.length!==ids.length||files.some(f=>f.messageId||f.createdAt.getTime()<Date.now()-CHAT_STAGING_MS))return{status:400,error:"One of your uploads is unavailable or expired. Remove it and upload it again."};
  if(files.reduce((sum,f)=>sum+f.sizeBytes,0)>CHAT_MESSAGE_FILE_LIMIT)return{status:400,error:"Attachments must total 25 MB or less per message."};
  const [{recent}]=await tx.select({recent:count()}).from(conversationMessages).where(and(eq(conversationMessages.conversationId,id),eq(conversationMessages.senderId,actor.id),gt(conversationMessages.createdAt,new Date(Date.now()-60000))));if(recent>=20)return{status:429,error:"Please wait a minute before sending more messages."};
  const sequence=thread.lastSequence+1;const [message]=await tx.insert(conversationMessages).values({conversationId:id,senderId:actor.id,requestKey:body.requestKey,sequence,body:body.body.trim(),replyToId}).$returningId();
  if(ids.length)await tx.update(conversationAttachments).set({messageId:message.id}).where(inArray(conversationAttachments.id,ids));
  await tx.update(conversations).set({lastSequence:sequence,updatedAt:new Date()}).where(eq(conversations.id,id));
  const recipients=await tx.select({id:users.id,email:users.email}).from(users).where(and(actor.role==="admin"?eq(users.id,thread.memberId!):eq(users.role,"admin"),ne(users.id,actor.id)));
  for(const recipient of recipients){if(actor.role!=="admin"&&!await adminCan({...recipient,role:"admin"},actor.role==="family"?"messages.family":"messages.nanny",tx))continue;await tx.insert(mailJobs).values({userId:recipient.id,recipient:recipient.email,subject:`New message ${id}`,body:`You have a new message from your private agency conversation. Sign in to read and reply: ${appUrl(`/dashboard/messages/${id}`)}\n\nExecutive Global Nanny`});}
  return{status:200,id:message.id,sequence};
 },{isolationLevel:"read committed"});return Response.json(result.status===200?{ok:true,id:result.id,sequence:result.sequence}:{error:result.error},{status:result.status,headers:privateHeaders});
 }catch{return Response.json({error:"Unable to save message. Please try again."},{status:500});}
}
