import {randomBytes,createHash,randomUUID} from "node:crypto";
import {eq,and,isNull,sql} from "drizzle-orm";
import {db} from "@/db";
import {users,adminAccess,adminInvitations,adminAccessLock,reviewEvents,mailJobs} from "@/db/schema";
import {getAdminGrant} from "./admin-permissions";
import {ALL_PERMISSIONS,normalizePermissions,grantAllows,type AdminPermission} from "./admin-permission-catalog";
import {appUrl} from "./mail";
export class AdminManagementError extends Error{constructor(message:string,public status=400){super(message);}}
type Tx=Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function lockAdminManagement(tx:Tx,actor:{id:string;role:string}){await tx.insert(adminAccessLock).values({id:1}).onDuplicateKeyUpdate({set:{id:1}});await tx.select().from(adminAccessLock).where(eq(adminAccessLock.id,1)).for("update");const grant=actor.role==="admin"?await getAdminGrant(actor.id,tx):null;if(!grantAllows(grant,"admins.manage"))throw new AdminManagementError("Administrator management permission required.",403);return grant!;}
export function validateAdminGrant(body:Record<string,unknown>,actor:Awaited<ReturnType<typeof getAdminGrant>>){
 if(typeof body.superAdmin!=="boolean"||!Array.isArray(body.permissions)||body.permissions.length>ALL_PERMISSIONS.length||body.permissions.some(p=>typeof p!=="string"||!ALL_PERMISSIONS.includes(p as AdminPermission))||typeof body.roleLabel!=="string"||!body.roleLabel.trim()||body.roleLabel.length>80)throw new AdminManagementError("Choose a valid role and permissions.");
 if(!body.superAdmin&&body.roleLabel.trim()==="Super Admin")throw new AdminManagementError("Super Admin is a reserved role name.");
 const permissions=normalizePermissions(body.permissions);if((body.superAdmin&&!actor?.superAdmin)||(!actor?.superAdmin&&permissions.some(p=>!actor?.permissions.includes(p))))throw new AdminManagementError("You can only assign permissions you hold. Only Super Admins can assign Super Admin access.",403);
 return{superAdmin:body.superAdmin?1:0,permissions:JSON.stringify(permissions),roleLabel:body.superAdmin?"Super Admin":body.roleLabel.trim()};
}
export async function queueAdminInvitation(tx:Tx,user:{id:string;email:string;name:string},actorId:string){
 await tx.update(adminInvitations).set({revokedAt:new Date()}).where(and(eq(adminInvitations.userId,user.id),isNull(adminInvitations.consumedAt),isNull(adminInvitations.revokedAt)));
 const token=randomBytes(32).toString("hex"),expiresAt=new Date(Date.now()+48*3600000);
 await tx.insert(adminInvitations).values({userId:user.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt,createdBy:actorId});
 const mailId=randomUUID();await tx.insert(mailJobs).values({id:mailId,userId:user.id,recipient:user.email,subject:"Your Executive Global Nanny administrator invitation",body:`Hello ${user.name},\n\nYou have been invited to the Executive Global Nanny agency workspace. Verify your email and set your own password using this link within 48 hours:\n\n${appUrl(`/admin-invite?token=${token}`)}\n\nIf you were not expecting this invitation, you can ignore it.\n\nExecutive Global Nanny`});return {expiresAt,mailId};
}
export async function createAdminInvitation(actor:{id:string;role:string},body:Record<string,unknown>){
 if(typeof body.name!=="string"||!body.name.trim()||body.name.length>255||typeof body.email!=="string"||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email))throw new AdminManagementError("Enter a full name and valid email address.");
 return db.transaction(async tx=>{const grant=await lockAdminManagement(tx,actor),values=validateAdminGrant(body,grant),email=(body.email as string).trim().toLowerCase();const [existing]=await tx.select({id:users.id}).from(users).where(eq(users.email,email));if(existing)throw new AdminManagementError("An account already uses this email address. Existing family or nanny accounts cannot be converted here.",409);
 const id=randomUUID(),name=(body.name as string).trim();await tx.insert(users).values({id,name,email,role:"admin",passwordHash:`invited:${randomBytes(32).toString("hex")}`});await tx.insert(adminAccess).values({userId:id,...values,status:"invited"});const {expiresAt,mailId}=await queueAdminInvitation(tx,{id,name,email},actor.id);await tx.insert(reviewEvents).values({reviewerId:actor.id,fromStatus:"admin_invitation",toStatus:"invited",note:`Invited administrator ${id} (${email}). Role: ${values.roleLabel}. Permissions: ${values.permissions}.`});return{id,expiresAt,mailId};});
}
export async function updateAdminAccess(actor:{id:string;role:string},id:string,body:Record<string,unknown>){return db.transaction(async tx=>{
 const grant=await lockAdminManagement(tx,actor);const [target]=await tx.select({access:adminAccess,user:users}).from(adminAccess).innerJoin(users,eq(adminAccess.userId,users.id)).where(eq(adminAccess.userId,id)).for("update");if(!target||target.user.role!=="admin")throw new AdminManagementError("Administrator not found.",404);
 if(!Number.isSafeInteger(body.revision)||body.revision!==target.access.revision)throw new AdminManagementError("This administrator changed. Refresh before saving.",409);
 if(target.access.superAdmin&&!grant.superAdmin)throw new AdminManagementError("Only Super Admins can manage this account.",403);
 if(!grant.superAdmin){let existing:string[]=[];try{existing=JSON.parse(target.access.permissions);}catch{}if(normalizePermissions(existing).some(p=>!grant.permissions.includes(p)))throw new AdminManagementError("Only an administrator with this account’s permissions can manage it.",403);}
 let mailId:string|undefined;const action=body.action;if(!["update","suspend","restore","resend","revoke"].includes(String(action)))throw new AdminManagementError("Choose a valid administrator action.");
 let next={superAdmin:target.access.superAdmin,permissions:target.access.permissions,roleLabel:target.access.roleLabel,status:target.access.status};
 if(action==="update")next={...next,...validateAdminGrant(body,grant)};
 if(action==="suspend"||action==="revoke")next.status="suspended";
 if(action==="restore"){if(!target.user.emailVerifiedAt){const [invited]=await tx.select({id:adminInvitations.id}).from(adminInvitations).where(eq(adminInvitations.userId,id)).limit(1);if(invited)throw new AdminManagementError("Resend the invitation to activate this account.",409);}next.status="active";}
 if(action==="resend"){if(target.user.emailVerifiedAt||target.access.status==="active")throw new AdminManagementError("This account has already accepted its invitation.",409);next.status="invited";mailId=(await queueAdminInvitation(tx,target.user,actor.id)).mailId;}
 if(id===actor.id&&next.status!=="active")throw new AdminManagementError("You cannot suspend your own account.",409);
 if(target.access.status==="active"&&target.access.superAdmin===1&&(next.status!=="active"||next.superAdmin!==1)){const active=await tx.select({id:adminAccess.userId}).from(adminAccess).innerJoin(users,eq(adminAccess.userId,users.id)).where(and(eq(adminAccess.status,"active"),eq(adminAccess.superAdmin,1),eq(users.role,"admin")));if(active.length<=1)throw new AdminManagementError("At least one active Super Admin must remain.",409);}
 if(next.status==="suspended")await tx.update(adminInvitations).set({revokedAt:new Date()}).where(and(eq(adminInvitations.userId,id),isNull(adminInvitations.consumedAt),isNull(adminInvitations.revokedAt)));
 await tx.update(adminAccess).set({...next,revision:target.access.revision+1,updatedAt:new Date()}).where(eq(adminAccess.userId,id));
 if(next.status!==target.access.status)await tx.update(users).set({sessionVersion:sql`${users.sessionVersion}+1`}).where(eq(users.id,id));
 await tx.insert(reviewEvents).values({reviewerId:actor.id,fromStatus:"admin_access",toStatus:next.status,note:`Administrator ${id} (${target.user.email}): ${String(action)}. Before: ${JSON.stringify({status:target.access.status,superAdmin:target.access.superAdmin,role:target.access.roleLabel,permissions:target.access.permissions})}. After: ${JSON.stringify(next)}.`});return{ok:true,mailId};
 });}
