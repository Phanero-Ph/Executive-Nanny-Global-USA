import {getCurrentUser} from "@/lib/auth";
import {getChatSettings} from "@/lib/chat-settings";
export const dynamic="force-dynamic";
export async function GET(){const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});return Response.json(await getChatSettings(),{headers:{"Cache-Control":"private, no-store"}});}
