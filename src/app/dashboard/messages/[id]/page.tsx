import {actorChatEnabled,threadChatEnabled} from "@/lib/chat-settings";
import {notFound,redirect} from "next/navigation";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {conversations} from "@/db/schema";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {canReadConversation,conversationInbox,UUID} from "@/lib/messaging";
import {ConversationView,MessageInbox} from "@/components/Messaging";
export const dynamic="force-dynamic";
export const metadata={title:"Private conversation",robots:{index:false,follow:false}};
export default async function Conversation({params}:{params:Promise<{id:string}>}){const actor=await getCurrentUser();if(!actor)redirect("/login");if(!await actorChatEnabled(actor))redirect(`/dashboard/${actor.role}`);const {id}=await params;if(!UUID.test(id))notFound();const allowed=await db.transaction(async tx=>{const [thread]=await tx.select().from(conversations).where(eq(conversations.id,id));if(!thread)return false;return canReadConversation(actor,thread)&&await threadChatEnabled(thread,tx,actor);});if(!allowed)notFound();const initial=(await conversationInbox(actor)).map(c=>({...c,updatedAt:c.updatedAt.toISOString()}));return <MessageInbox initial={initial} role={actor.role} selectedId={id}><ConversationView key={id} id={id} userId={actor.id} role={actor.role}/></MessageInbox>;}
