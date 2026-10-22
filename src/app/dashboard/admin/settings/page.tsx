import "./settings.css";
import {AdminTeamManager} from "@/components/AdminTeamManager";
import {getAdminGrant} from "@/lib/admin-permissions";
import {grantAllows,normalizePermissions} from "@/lib/admin-permission-catalog";
import {CreditCard,Database,Mail,Settings2,ShieldCheck,Users,UserRound,MessageCircle,Wallet,LockKeyhole,CheckCircle2,Circle} from "lucide-react";
import {AdminChatSettings} from "@/components/AdminChatSettings";
import {getChatSettings} from "@/lib/chat-settings";
import {AdminFeeSettings} from "@/components/AdminFeeSettings";
import {getAgencyFees} from "@/lib/agency-fees";
import {eq,asc,desc,inArray} from "drizzle-orm";
import {db} from "@/db";
import {users,adminAccess,adminInvitations,reviewEvents} from "@/db/schema";
import {requireAdmin} from "@/lib/admin-access";
import {AdminAccountEditor} from "@/components/AdminAccountEditor";
export const dynamic="force-dynamic";
export default async function Settings(){
 const actor=await requireAdmin();
 const grant=await getAdminGrant(actor.id),canFees=grantAllows(grant,"settings.fees"),canChat=grantAllows(grant,"settings.chat"),canTeam=grantAllows(grant,"admins.manage");
 const [fees,chat,team,invitations,audit]=await Promise.all([getAgencyFees(),getChatSettings(),canTeam?db.select({id:users.id,name:users.name,email:users.email,access:adminAccess}).from(users).innerJoin(adminAccess,eq(adminAccess.userId,users.id)).where(eq(users.role,"admin")).orderBy(asc(users.name)):Promise.resolve([]),canTeam?db.select({userId:adminInvitations.userId,expiresAt:adminInvitations.expiresAt,consumedAt:adminInvitations.consumedAt,revokedAt:adminInvitations.revokedAt}).from(adminInvitations).orderBy(desc(adminInvitations.createdAt)):Promise.resolve([]),canTeam?db.select({id:reviewEvents.id,reviewer:users.name,note:reviewEvents.note,createdAt:reviewEvents.createdAt,fromStatus:reviewEvents.fromStatus}).from(reviewEvents).innerJoin(users,eq(reviewEvents.reviewerId,users.id)).where(grant?.superAdmin?undefined:inArray(reviewEvents.fromStatus,["admin_invitation","admin_access"])).orderBy(desc(reviewEvents.createdAt)).limit(50):Promise.resolve([])]);
 const members=team.map(member=>{let permissions:string[]=[];try{permissions=JSON.parse(member.access.permissions);}catch{}const invitation=invitations.find(i=>i.userId===member.id&&!i.consumedAt&&!i.revokedAt)??invitations.find(i=>i.userId===member.id&&!i.consumedAt);return{id:member.id,name:member.name,email:member.email,superAdmin:member.access.superAdmin===1,roleLabel:member.access.roleLabel,status:member.access.status,permissions:normalizePermissions(permissions),revision:member.access.revision,expiresAt:invitation?.expiresAt.toISOString()??null};});
 const services=[{label:"Payments",icon:CreditCard,value:process.env.STRIPE_SECRET_KEY?(process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")?"Stripe live mode":"Stripe test mode"):"Not configured",configured:!!process.env.STRIPE_SECRET_KEY},{label:"Email delivery",icon:Mail,value:process.env.EMAIL_MODE==="smtp"?"SMTP delivery":"Local preview mode",configured:process.env.EMAIL_MODE==="smtp"},{label:"Database",icon:Database,value:process.env.DATABASE_URL?"MySQL configured":"Not configured",configured:!!process.env.DATABASE_URL}];
 return <div className="agency-settings application-page">
  <header className="as-heading"><div><p className="as-eyebrow">AGENCY ADMINISTRATION</p><h1>Team & settings<span>.</span></h1><p>Make the workspace work for your agency.</p></div><span className="as-access"><ShieldCheck size={15} aria-hidden="true"/>Administrator access</span></header>
  <nav className="as-section-nav" aria-label="Settings sections">{[{id:"communication",label:"Communication",icon:MessageCircle},{id:"service-fees",label:"Service fees",icon:Wallet},{id:"agency-team",label:"Agency team",icon:Users},{id:"your-account",label:"Your account",icon:UserRound},{id:"integrations",label:"Integrations",icon:Settings2}].filter(item=>item.id==="communication"?canChat:item.id==="service-fees"?canFees:item.id==="agency-team"?canTeam:item.id==="integrations"?grant?.superAdmin:true).map(item=><a href={`#${item.id}`} key={item.id}><item.icon size={15} aria-hidden="true"/>{item.label}</a>)}</nav>
  {(canChat||canFees)&&<div className="as-group-heading"><div><p className="as-eyebrow">WORKSPACE PREFERENCES</p><h2>Your agency, your controls</h2></div><p>Manage communication and nanny placement fees.</p></div>}
  <div className="as-controls-grid">{canChat&&<AdminChatSettings {...chat}/>} {canFees&&<AdminFeeSettings {...fees}/>}</div>
  <div className={`as-people-grid ${canTeam?"has-team-management":""}`}>
   {canTeam&&grant&&<AdminTeamManager members={members} grant={grant} actorId={actor.id}/>}
   <AdminAccountEditor id={actor.id} name={actor.name} phone={actor.phone} email={actor.email} version={actor.updatedAt.toISOString()} variant="settings"/>
  </div>
  {grant?.superAdmin&&<section id="integrations" className="as-integrations" aria-labelledby="integrations-title"><div className="as-group-heading"><div><p className="as-eyebrow">CONNECTED SERVICES</p><h2 id="integrations-title">Service configuration</h2></div><span className="as-readonly">Read-only configuration<LockKeyhole size={13} aria-hidden="true"/></span></div><div className="as-services">{services.map(service=><div className="as-service" key={service.label}><span className="as-service-icon"><service.icon size={20} aria-hidden="true"/></span><div><p>{service.label}</p><strong>{service.value}</strong></div>{service.configured?<CheckCircle2 size={16} className="as-configured" aria-label="Configured"/>:<Circle size={16} className="as-unconfigured" aria-label="Preview or not configured"/>}</div>)}</div><p className="as-environment-note">Deployment configuration is managed in the private application environment.</p></section>}
 {canTeam&&<section className="as-card atm-audit"><header className="as-card-head"><span className="as-icon"><ShieldCheck size={20}/></span><div><p className="as-eyebrow">ACCOUNTABILITY</p><h2>Recent administrator activity</h2></div></header><div className="as-card-body"><ul>{audit.map(event=><li key={event.id}><strong>{event.reviewer}</strong><time>{event.createdAt.toLocaleString("en-US",{timeZone:"Africa/Lagos"})} WAT</time><p>{event.note||event.fromStatus}</p></li>)}</ul>{!audit.length&&<p className="as-description">No administrative activity recorded yet.</p>}</div></section>}
 </div>;
}
