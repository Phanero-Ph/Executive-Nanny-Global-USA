import {ChatOnly} from "@/components/ChatAccess";
import "./care-request.css";
import {hasPaidFamilyMembership} from "@/lib/family-membership";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, HeartHandshake, Check, ShieldCheck, MessageCircle } from "lucide-react";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import { FindNannyForm } from "@/components/FindNannyForm";
export const dynamic = "force-dynamic";
export default async function NewFamilyRequestPage() {
 const user = await getCurrentUser();
 if (!user) redirect("/login");
 if (user.role !== "family") redirect("/dashboard/nanny");
 if(!await hasPaidFamilyMembership(user.id))redirect("/dashboard/family?view=membership&locked=nanny");
 return <div className="care-request-page application-page">
  <Link href="/dashboard/family?view=requests" className="care-request-back"><ArrowLeft size={16} aria-hidden="true"/>Request a Babysitter</Link>
  <header className="care-request-heading"><div><p className="dashboard-eyebrow">A little about your family</p><p>Tell us what matters to your family. We’ll use your preferences to guide your care search.</p></div><span className="care-request-heading-icon" aria-hidden="true"><HeartHandshake size={38} strokeWidth={1.3}/></span></header>
  <div className="care-request-layout">
   <aside className="care-request-guide" aria-label="Request guide">
    <div className="care-request-guide-card"><span className="care-request-tag">REQUEST A BABYSITTER</span><h2>Let’s get to know<br/>your needs.</h2><p>A few thoughtful details help us understand the care you’re looking for.</p>
     <nav aria-label="Form sections" className="care-request-steps">{[{title:"Your details",detail:"Stay connected"},{title:"Care for your family",detail:"Children, timing & care type"},{title:"Home & preferences",detail:"The details that matter"}].map((step,i)=><a key={step.title} href={`#care-request-section-0${i+1}`}><span>0{i+1}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div><ArrowUpRight size={14} aria-hidden="true"/></a>)}</nav>
     <div className="care-request-account"><Check size={16} aria-hidden="true"/><span>Connected to your family account</span></div>
    </div>
    <div className="care-request-next"><ShieldCheck size={22} aria-hidden="true"/><h3>What happens next?</h3><p>Our team will review your request and contact you about the next steps. Follow your search from your dashboard.</p><ChatOnly><Link href="/dashboard/messages"><MessageCircle size={15} aria-hidden="true"/>Have a question?<ArrowUpRight size={14} aria-hidden="true"/></Link></ChatOnly></div>
   </aside>
   <div className="care-request-form"><div className="care-request-form-intro"><div><h2>Babysitter request</h2><p>Complete the details below to start your search.</p></div><span>Required fields marked *</span></div><FindNannyForm initialCategory="nanny" account={{name:user.name,email:user.email,phone:user.phone}}/></div>
  </div>
 </div>;
}
