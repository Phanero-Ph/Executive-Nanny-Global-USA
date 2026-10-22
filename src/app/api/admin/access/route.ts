import {getCurrentUser} from "@/lib/auth";
import {getAdminGrant} from "@/lib/admin-permissions";
export const dynamic="force-dynamic";
export async function GET(){const actor=await getCurrentUser();if(!actor)return Response.json({error:"Please sign in."},{status:401});if(actor.role!=="admin")return Response.json({error:"Administrator access required."},{status:403});return Response.json(await getAdminGrant(actor.id),{headers:{"Cache-Control":"private, no-store"}});}
