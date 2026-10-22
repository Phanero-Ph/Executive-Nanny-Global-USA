import {actorChatEnabled} from "@/lib/chat-settings";
import {redirect} from "next/navigation";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {conversationInbox} from "@/lib/messaging";
import {MessageInbox} from "@/components/Messaging";
export const dynamic="force-dynamic";
export const metadata={title:"Messages",robots:{index:false,follow:false}};
export default async function Messages(){const actor=await getCurrentUser();if(!actor)redirect("/login");if(!await actorChatEnabled(actor))redirect(`/dashboard/${actor.role}`);if(!["family","nanny","admin"].includes(actor.role))redirect("/");const initial=(await conversationInbox(actor)).map(c=>({...c,updatedAt:c.updatedAt.toISOString()}));return <MessageInbox initial={initial} role={actor.role}/>;}
