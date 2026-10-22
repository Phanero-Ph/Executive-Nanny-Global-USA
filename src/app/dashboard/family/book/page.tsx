import {ChatOnly} from "@/components/ChatAccess";
import {getAgencyFees} from "@/lib/agency-fees";
import {feeMoney,feePercent} from "@/lib/fee-format";
import "./caregiver-request.css";
import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowLeft,ArrowUpRight,Check,HeartHandshake,MessageCircle} from "lucide-react";
import {getDashboardUser as getCurrentUser} from "@/lib/dashboard-auth";
import {CaregiverPlacementForm} from "@/components/CaregiverPlacementForm";
export const dynamic="force-dynamic";
export const metadata={title:"Request a Nanny",robots:{index:false,follow:false}};
export default async function BookPage(){
 const user=await getCurrentUser();if(!user)redirect("/login");if(user.role!=="family")redirect(`/dashboard/${user.role}`);
 const fees=await getAgencyFees();
 return <section className="caregiver-request-page application-page">
  <Link href="/dashboard/family?view=caregiver" className="caregiver-back"><ArrowLeft size={15} aria-hidden="true"/>Back to your requests</Link>
  <header className="caregiver-heading"><div><p className="dashboard-eyebrow">SUPPORT FOR YOUR FAMILY</p><h1>Request a Nanny</h1><p>Share your requirements and preferred start date. Our team will find and shortlist nannies who fit your family.</p></div><span className="caregiver-heading-icon" aria-hidden="true"><HeartHandshake size={34} strokeWidth={1.5}/></span></header>
  <div className="caregiver-request-layout"><div className="caregiver-form-column">
   <CaregiverPlacementForm account={{name:user.name,email:user.email,phone:user.phone}}/>
  </div><aside className="caregiver-request-aside" aria-label="Request information">
   <div className="caregiver-summary"><p className="caregiver-overline">YOUR REQUEST</p><h2>A little planning.<br/>Thoughtful support.</h2><p>A clear picture of your routine helps our team coordinate care that fits.</p>
   <div className="caregiver-membership"><span className="is-active"><Check size={14} aria-hidden="true"/></span><div><strong>No subscription required</strong><small>Pay per nanny search and placement</small></div></div>
   <dl><div><dt>Search fee</dt><dd>{feeMoney(fees.searchCents)} per request</dd></div><div><dt>Placement fee</dt><dd>{feePercent(fees.placementRateBps)} of agreed annual salary</dd></div><div><dt>Nanny wages</dt><dd>Paid separately</dd></div></dl></div>
   <div className="caregiver-next"><h3>What happens next?</h3><ol>{[{title:"Submit & pay the search fee",text:`Your ${feeMoney(fees.searchCents)} search fee allows our team to begin.`},{title:"Agency matching & selection",text:"The agency selects a suitable nanny from the shortlist."},{title:"Confirm your placement",text:`The agency records the agreed annual salary. Review and pay the calculated ${feePercent(fees.placementRateBps)} placement fee before your nanny starts.`}].map((step,i)=><li key={step.title}><span>{i+1}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol><ChatOnly><Link href="/dashboard/messages"><MessageCircle size={16} aria-hidden="true"/>Ask our team a question<ArrowUpRight size={14} aria-hidden="true"/></Link></ChatOnly></div>
  </aside></div>
 </section>;
}
