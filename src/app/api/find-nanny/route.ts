import {getAgencyFees} from "@/lib/agency-fees";
import { validDate } from "@/lib/membership";
import { nannySubmissionAllowance, PlacementError } from "@/lib/placement-policy";
import { notifySubmission } from "@/lib/mail";
import { isDuplicateEntry } from "@/db/errors";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, familyRequests, caregiverFees } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

const nannyTypes = ["Live-in", "Live-out", "Part-time", "Full-time", "One-time", "Recurring weekly"];
const ages = ["0-1 years", "2-4 years", "5-8 years", "9-12 years", "13+ years"];
const care = ["Light housekeeping", "Meal preparation", "Homework help", "Transportation", "Pet care", "School pickup / transportation"];
export async function POST(req: Request) {
  try {
    if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "Request origin not allowed." }, { status: 403 });
    const account = await getCurrentUser({allowUnverified:true});
    if(!account)return NextResponse.json({error:"Create your family account, verify your email, and sign in before submitting a care request."},{status:401});
    if(account&&["family","nanny"].includes(account.role)&&!account.emailVerifiedAt)return NextResponse.json({error:"Verify your email address before submitting a request or application. Open the verification link in your email or visit /verify-email to resend it.",code:"EMAIL_VERIFICATION_REQUIRED"},{status:403});
    if (account && account.role !== "family") return NextResponse.json({ error: "Only family accounts can submit care requests." }, { status: 403 });
    const body = await req.json() as Record<string, unknown>;
    const text = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
    const choices = (key: string, allowed: string[]) => Array.isArray(body[key]) && (body[key] as unknown[]).every(value => typeof value === "string" && allowed.includes(value)) ? [...new Set(body[key] as string[])] : null;
    const category = text("careCategory") || "caregiver";
    if(!["nanny","caregiver"].includes(category)) return NextResponse.json({error:"Choose babysitter or nanny placement."},{status:400});
    const submissionKey = text("submissionKey");
    if(!/^[a-f0-9-]{36}$/i.test(submissionKey)) return NextResponse.json({error:"Refresh the form before submitting."},{status:400});
    const name = text("name") || account.name, email = account.email, phone = text("phone"), startDate = text("startDate"), children = text("numberOfChildren"), address=text("address");
    const addressParts=address.split(",").map(part=>part.trim()).filter(Boolean);
    const town=text("town")||(addressParts.length>=3?addressParts[addressParts.length-2]:addressParts.length===2?addressParts[1]:"");
    const types = choices("nannyTypes", nannyTypes), childAges = choices("childrenAges", ages), additionalCare = choices("additionalCare", care);
    const startTime=text("startTime"),endTime=text("endTime"),scheduleDetails=text("schedule"),zipInput=text("zip").replace(/\s/g,"");
    const zip=zipInput.replace(/^(\d{5})-?(\d{4})$/,"$1-$2");
    if (!name || !phone || !isValidEmail(email) || !validDate(startDate) || !["1", "2", "3", "4", "5+"].includes(children) || !types?.length || !childAges || !additionalCare) return NextResponse.json({ error: "Please complete the required fields with valid values." }, { status: 400 });
    if(category==="nanny"){
      if(types.length!==1||!(["One-time","Recurring weekly"] as string[]).includes(types[0])||childAges.length===0||!town)return NextResponse.json({error:"Choose one babysitting schedule, children’s ages, and a town or city."},{status:400});
      const validTime=(value:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      if(!validTime(startTime)||!validTime(endTime)||endTime<=startTime)return NextResponse.json({error:"Enter a valid start and end time. End time must be later than start time."},{status:400});
      if(types[0]==="Recurring weekly"&&!scheduleDetails)return NextResponse.json({error:"Add the preferred days for your recurring request."},{status:400});
      if(zip&&!/^\d{5}(?:-\d{4})?$/.test(zip))return NextResponse.json({error:"Enter a 5-digit US ZIP code, such as 08876, or ZIP+4, such as 08876-1234."},{status:400});
      if(startDate<new Date().toISOString().slice(0,10))return NextResponse.json({error:"Choose today or a future date for care to begin."},{status:400});
    }
    if(category==="caregiver"&&!address)return NextResponse.json({error:"Enter the house address, including your town or city."},{status:400});
    if(name.length>255||phone.length>50||town.length>255||zip.length>20||address.length>1000||text("careNeeds").length>3000||text("hiringCriteria").length>3000||text("previousExperience").length>3000||text("careRecipient").length>300||text("schedule").length>2000)return NextResponse.json({error:"Please shorten the contact, address or care details."},{status:400});
    const user = await db.transaction(async tx => {
      const created = { id: account.id };
      await tx.select({id:users.id}).from(users).where(eq(users.id,created.id)).for("update");
      const [existing]=await tx.select({id:familyRequests.id}).from(familyRequests).where(and(eq(familyRequests.userId,created.id),eq(familyRequests.submissionKey,submissionKey)));
      if(existing)return {...created,requestId:existing.id,duplicate:true,requiresSubscription:false};
      const allowance=category==="nanny"?await nannySubmissionAllowance(tx,created.id):null;
      if(category==="nanny"&&!allowance)throw new PlacementError("Subscribe to a plan before submitting a babysitter request.");
      if(allowance&&allowance.limit!==null&&allowance.used>=allowance.limit)throw new PlacementError("You have used all babysitter submissions for this paid month. Your allowance resets with your next paid membership period.");
      const fees=category==="caregiver"?await getAgencyFees(tx):null;
      const requestId=randomUUID();
      await tx.insert(familyRequests).values({
        id:requestId,careCategory:category,placementRateBps:fees?.placementRateBps??null,membershipCycleId:allowance?.cycleId??null,submissionKey,
        userId: created.id, name, email, phone, town:town||null, zip:zip||null, serviceType: types.join(", "), startDate,
        childrenInfo: category==="caregiver"?`Care recipient: ${text("careRecipient")||[children?`${children} children`:"",childAges.join(", ")].filter(Boolean).join(" · ")||"Not specified"}\nCare requirements: ${text("careNeeds")||text("hiringCriteria")}`:`Number of children: ${children}\nAges: ${childAges.join(", ") || "Not specified"}`,
        schedule: (category==="nanny"?[types[0],`${startTime}–${endTime}`,scheduleDetails]:[text("duration"),scheduleDetails]).filter(Boolean).join("\n") || null, budget: text("budget") || null,
        message: (category==="nanny"?[`Additional support: ${additionalCare.join(", ")||"None"}`,`Care needs: ${text("careNeeds")||"None provided"}`]:[`House size: ${text("houseSize")}`,`House address: ${address}`,`Additional care: ${additionalCare.join(", ")||"Not specified"}`,`Preferred nanny age: ${text("preferredNannyAge")||"Not specified"}`,`Hiring criteria: ${text("hiringCriteria")||text("careNeeds")||"Not specified"}`,`Previous nanny experience: ${text("previousExperience")||"Not specified"}`]).filter(Boolean).join("\n"),
        status: category==="nanny"?"searching":"search_fee_invoiced", searchFeeStatus: category==="nanny"?"included":"unpaid", placementFeeStatus:category==="nanny"?"included":"unpaid",
      });
      if(category==="caregiver"){
       await tx.insert(caregiverFees).values({requestId,kind:"search",amountCents:fees!.searchCents,checkoutKey:randomUUID()});
      }
      return {...created,requestId,requiresSubscription:false,duplicate:false};
    });
    if(user.requestId&&!user.duplicate&&category==="nanny") await notifySubmission(user.id, email, "family");
    return NextResponse.json({ ok: true, requestId:user.requestId, careCategory:category, duplicate:user.duplicate });
  } catch (error) {
    if(error instanceof PlacementError)return NextResponse.json({error:error.message},{status:error.status});
    if (isDuplicateEntry(error)) return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
    return NextResponse.json({ error: "Couldn't submit your request. Please try again." }, { status: 500 });
  }
}
