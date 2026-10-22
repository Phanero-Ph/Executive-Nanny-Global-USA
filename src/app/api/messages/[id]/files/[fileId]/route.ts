import {actorChatEnabled,threadChatEnabled} from "@/lib/chat-settings";
import {readFile} from "node:fs/promises";
import {and,eq} from "drizzle-orm";
import {db} from "@/db";
import {conversationAttachments,conversations} from "@/db/schema";
import {getCurrentUser} from "@/lib/auth";
import {UUID,canReadConversation} from "@/lib/messaging";
import {chatFilePath,CHAT_STAGING_MS,removeChatFile} from "@/lib/chat-files";
export const runtime="nodejs";
type Params={params:Promise<{id:string;fileId:string}>};
export async function GET(req:Request,{params}:Params){
 const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});const {id,fileId}=await params;if(!UUID.test(id)||!UUID.test(fileId))return Response.json({error:"File not found."},{status:404});
 const [row]=await db.select({file:conversationAttachments,thread:conversations}).from(conversationAttachments).innerJoin(conversations,eq(conversationAttachments.conversationId,conversations.id)).where(and(eq(conversationAttachments.id,fileId),eq(conversationAttachments.conversationId,id)));
 if(!row||!canReadConversation(actor,row.thread)||!await threadChatEnabled(row.thread,db,actor)||!row.file.messageId&&(row.file.uploaderId!==actor.id||row.file.createdAt.getTime()<Date.now()-CHAT_STAGING_MS))return Response.json({error:"File not found."},{status:404});
 try{const data=await readFile(chatFilePath(row.file.storedName)),inline=row.file.mimeType.startsWith("image/")&&!new URL(req.url).searchParams.has("download");const name=encodeURIComponent(row.file.fileName).replace(/['()*]/g,c=>`%${c.charCodeAt(0).toString(16)}`);
 return new Response(new Uint8Array(data),{headers:{"Content-Type":row.file.mimeType,"Content-Length":String(data.length),"Content-Disposition":`${inline?"inline":"attachment"}; filename*=UTF-8''${name}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox; default-src 'none'","Cross-Origin-Resource-Policy":"same-origin","Referrer-Policy":"no-referrer"}});
 }catch{return Response.json({error:"File unavailable."},{status:404});}
}
export async function DELETE(req:Request,{params}:Params){
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)return Response.json({error:"Request origin not allowed."},{status:403});
 const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(!await actorChatEnabled(actor))return Response.json({error:"Chat is currently unavailable for your account.",code:"CHAT_DISABLED"},{status:403,headers:{"Cache-Control":"private, no-store"}});const {id,fileId}=await params;if(!UUID.test(id)||!UUID.test(fileId))return Response.json({error:"File not found."},{status:404});
 const result=await db.transaction(async tx=>{const [thread]=await tx.select().from(conversations).where(eq(conversations.id,id)).for("update");if(!thread||!canReadConversation(actor,thread)||!await threadChatEnabled(thread,tx,actor))return null;const [file]=await tx.select().from(conversationAttachments).where(and(eq(conversationAttachments.id,fileId),eq(conversationAttachments.conversationId,id),eq(conversationAttachments.uploaderId,actor.id)));if(!file||file.messageId)return null;await tx.delete(conversationAttachments).where(eq(conversationAttachments.id,fileId));return file;});
 if(!result)return Response.json({error:"This upload cannot be removed."},{status:404});await removeChatFile(result.storedName);return Response.json({ok:true});
}
