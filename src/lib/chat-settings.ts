import {adminCan,getAdminGrant} from "./admin-permissions";
import {grantAllows} from "./admin-permission-catalog";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {agencyChatSettings,users,conversations} from "@/db/schema";
import {roleChatEnabled} from "./chat-policy";
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function getChatSettings(connection:Tx|typeof db=db){const [row]=await connection.select().from(agencyChatSettings).where(eq(agencyChatSettings.id,1));return {familyEnabled:row?row.familyEnabled===1:true,nannyEnabled:row?row.nannyEnabled===1:true,revision:row?.revision??0};}
export async function actorChatEnabled(actor:{id:string;role:string},connection:Tx|typeof db=db){if(actor.role==="admin"){const grant=await getAdminGrant(actor.id,connection);return grantAllows(grant,"messages.family")||grantAllows(grant,"messages.nanny");}return roleChatEnabled(actor.role,await getChatSettings(connection));}
export async function threadChatEnabled(thread:typeof conversations.$inferSelect,connection:Tx|typeof db=db,actor?:{id:string;role:string}){if(!thread.memberId)return false;const [member]=await connection.select({role:users.role}).from(users).where(eq(users.id,thread.memberId));return !!member&&roleChatEnabled(member.role,await getChatSettings(connection))&&(!actor||actor.role!=="admin"||await adminCan(actor,member.role==="family"?"messages.family":"messages.nanny",connection));}
