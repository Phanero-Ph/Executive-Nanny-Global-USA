import {actorChatEnabled,threadChatEnabled} from "@/lib/chat-settings";
import { isAllowedRequestOrigin } from "@/lib/request-origin";
import {createHash} from "node:crypto";
import {and,count,eq,gt,isNull,sql} from "drizzle-orm";
import {getCurrentUser} from "@/lib/auth";
import {db} from "@/db";
import {conversationAttachments,conversations,users} from "@/db/schema";
import {UUID,canReadConversation} from "@/lib/messaging";
import {boundedForm,validateChatFile,saveChatFile,removeChatFile,cleanupChatUploads} from "@/lib/chat-files";
export const runtime="nodejs";
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!isAllowedRequestOrigin(req))return Response.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});const {id}=await params;if(!UUID.test(id))return Response.json({error:"Conversation not found."},{status:404});
 const [thread]=await db.select().from(conversations).where(eq(conversations.id,id));if(!thread||!canReadConversation(actor,thread)||!await threadChatEnabled(thread,db,actor))return Response.json({error:"Conversation not found."},{status:404});
 let file:Awaited<ReturnType<typeof validateChatFile>>,hash:string,uploadKey:string;
 try{const form=await boundedForm(req),value=form.get("file"),key=form.get("uploadKey");if(!(value instanceof File)||typeof key!=="string"||!UUID.test(key))throw Error("Choose a file and a valid upload key.");uploadKey=key;hash=createHash("sha256").update(Buffer.from(await value.arrayBuffer())).digest("hex");file=await validateChatFile(value);}catch(error){return Response.json({error:error instanceof Error?error.message:"Unable to read this file."},{status:400});}
 let storedName:string|undefined,retained=false;
 try{
 await cleanupChatUploads(20,actor.id);storedName=await saveChatFile(file.data,file.ext);
 const result=await db.transaction(async tx=>{
  const [current]=await tx.select().from(conversations).where(eq(conversations.id,id)).for("update");if(!current||!canReadConversation(actor,current)||!await threadChatEnabled(current,tx,actor))return{status:404,error:"Conversation not found."};
  await tx.select({id:users.id}).from(users).where(eq(users.id,actor.id)).for("update");
  const [existing]=await tx.select().from(conversationAttachments).where(and(eq(conversationAttachments.conversationId,id),eq(conversationAttachments.uploaderId,actor.id),eq(conversationAttachments.uploadKey,uploadKey)));
  if(existing)return existing.contentHash===hash?{status:200,attachment:existing}:{status:409,error:"This upload key was already used for a different file."};
  const [{pending}]=await tx.select({pending:count()}).from(conversationAttachments).where(and(eq(conversationAttachments.uploaderId,actor.id),isNull(conversationAttachments.messageId)));
  const [{files,bytes}]=await tx.select({files:count(),bytes:sql<number>`COALESCE(SUM(${conversationAttachments.sizeBytes}),0)`.mapWith(Number)}).from(conversationAttachments).where(and(eq(conversationAttachments.uploaderId,actor.id),gt(conversationAttachments.createdAt,new Date(Date.now()-86400000))));
  if(pending>=10||files>=20||bytes+file.data.length>100*1024*1024)return{status:429,error:"Upload limit reached. Remove unused uploads or try again tomorrow (20 files / 100 MB per day)."};
  const [created]=await tx.insert(conversationAttachments).values({conversationId:id,uploaderId:actor.id,uploadKey,contentHash:hash,fileName:file.fileName,storedName:storedName!,mimeType:file.mime,sizeBytes:file.data.length}).$returningId();
  return{status:200,created:true,attachment:{id:created.id,fileName:file.fileName,mimeType:file.mime,sizeBytes:file.data.length}};
 },{isolationLevel:"read committed"});
 retained="created" in result&&!!result.created;
 return Response.json("attachment" in result?{attachment:{id:result.attachment!.id,fileName:result.attachment!.fileName,mimeType:result.attachment!.mimeType,sizeBytes:result.attachment!.sizeBytes}}:{error:result.error},{status:result.status,headers:{"Cache-Control":"private, no-store"}});
 }catch{return Response.json({error:"Upload failed. Please retry."},{status:500});}finally{if(storedName&&!retained)await removeChatFile(storedName);}
}
