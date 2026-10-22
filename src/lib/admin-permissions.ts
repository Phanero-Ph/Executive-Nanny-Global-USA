import {eq} from "drizzle-orm";
import {db} from "@/db";
import {adminAccess} from "@/db/schema";
import {ALL_PERMISSIONS,normalizePermissions,grantAllows,type AdminPermission} from "./admin-permission-catalog";
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function getAdminGrant(id:string,connection:Tx|typeof db=db){const [row]=await connection.select().from(adminAccess).where(eq(adminAccess.userId,id));if(!row||row.status!=="active")return null;let permissions:AdminPermission[]=[];try{const input=JSON.parse(row.permissions);if(Array.isArray(input))permissions=normalizePermissions(input.filter(p=>typeof p==="string"));}catch{}return {superAdmin:row.superAdmin===1,permissions:row.superAdmin===1?[...ALL_PERMISSIONS]:permissions,roleLabel:row.roleLabel,revision:row.revision};}
export async function adminIsActive(id:string){return !!await getAdminGrant(id);}
export async function adminCan(actor:{id:string;role:string}|null,permission:AdminPermission,connection:Tx|typeof db=db){return actor?.role==="admin"&&grantAllows(await getAdminGrant(actor.id,connection),permission);}
