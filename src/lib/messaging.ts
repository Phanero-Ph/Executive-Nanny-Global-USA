import {adminCan} from "./admin-permissions";
import {getChatSettings} from "./chat-settings";
import {and,eq,sql,inArray} from "drizzle-orm";
import {db} from "@/db";
import {users,conversations,conversationReads} from "@/db/schema";
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
export type MessageActor={id:string;role:string};
export const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function canReadConversation(actor:MessageActor,thread:typeof conversations.$inferSelect){return thread.kind==="agency"&&!!thread.memberId&&(actor.role==="admin"||["family","nanny"].includes(actor.role)&&actor.id===thread.memberId);}
export async function conversationInbox(actor:MessageActor){
 const flags=await getChatSettings(),roles=[...(flags.familyEnabled&&(actor.role!=="admin"||await adminCan(actor,"messages.family"))?["family"]:[]),...(flags.nannyEnabled&&(actor.role!=="admin"||await adminCan(actor,"messages.nanny"))?["nanny"]:[])];if(!roles.length)return [];
 return db.select({id:conversations.id,memberId:conversations.memberId,memberName:users.name,memberRole:users.role,updatedAt:conversations.updatedAt,
 preview:sql<string>`COALESCE((SELECT CASE WHEN body<>'' THEN body ELSE 'Attachment' END FROM conversation_messages m WHERE m.conversation_id=${conversations.id} ORDER BY m.sequence DESC LIMIT 1),'Start a conversation')`,
 unread:sql<number>`(SELECT COUNT(*) FROM conversation_messages msg WHERE msg.conversation_id=${conversations.id} AND msg.sender_id<>${actor.id} AND msg.sequence>COALESCE((SELECT r.last_sequence FROM conversation_reads r WHERE r.conversation_id=${conversations.id} AND r.user_id=${actor.id}),0))`.mapWith(Number)})
 .from(conversations).innerJoin(users,eq(conversations.memberId,users.id)).where(and(inArray(users.role,roles),eq(conversations.kind,"agency"),actor.role==="admin"?undefined:eq(conversations.memberId,actor.id))).orderBy(sql`${conversations.updatedAt} DESC`,conversations.id).limit(100);
}
export async function markConversationRead(tx:Tx,id:string,userId:string,sequence:number){await tx.insert(conversationReads).values({conversationId:id,userId,lastSequence:sequence}).onDuplicateKeyUpdate({set:{lastSequence:sql`GREATEST(${conversationReads.lastSequence},${sequence})`}});}
