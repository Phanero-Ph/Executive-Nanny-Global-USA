import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for using Executive Global Nanny’s website, accounts, babysitter subscriptions, and nanny placement services.",
  alternates: { canonical: "/terms-conditions" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to Terms",
    paragraphs: [
      'Welcome to Executive Global Nanny LLC ("EGN," "we," "our," or "us"). These Terms & Conditions apply when you visit our website, create an account, submit a care request or nanny application, or use our placement and childcare services. By using the website or services, you agree to these terms. If you do not agree, do not use the services.',
      "Additional written service agreements, checkout disclosures, or placement documents may apply to a particular service. If they conflict with these general terms, the service-specific written agreement controls for that service.",
    ],
  },
  {
    id: "services",
    title: "Services Provided",
    paragraphs: ["EGN provides agency-coordinated childcare and placement services, which may include:"],
    bullets: [
      "Babysitter requests under monthly family membership plans.",
      "Full-time and part-time nanny placement and agency matching.",
      "Nanny recruitment, application review, identity and credential checks, reference verification, and authorized background screening.",
      "Training and professional development for nannies.",
      "Ongoing agency support related to requests and placements.",
    ],
  },
  {
    id: "fees",
    title: "Fees and Payment",
    subsections: [
      {
        title: "Babysitter membership plans",
        paragraphs: [
          "Babysitter requests require an active paid monthly subscription. Current plans provide 3 requests for Basic ($59/month), 5 for Standard ($89/month), 8 for Deluxe ($129/month), or unlimited requests for Premium ($200/month). The available allowance is shown in the account and checkout. A request uses an allowance when submitted. Plan prices and allowances may change prospectively; the price applicable to your purchase is shown before you confirm payment.",
          "Subscriptions renew monthly until cancelled. You may manage or cancel billing through the billing controls in your account. Cancellation stops future renewal; access and request allowance continue according to the paid billing period and plan terms. Unused monthly submissions do not create a cash balance.",
        ],
      },
      {
        title: "Nanny search and placement fees",
        paragraphs: [
          "Nanny placement does not require a babysitter subscription. A $300 search fee is due for each nanny request. The request is released to the agency for matching after the search payment is confirmed. After the agency selects a nanny and records the agreed annual salary, a placement fee equal to 15% of that salary is due before the nanny starts work. Nanny wages are separate and are paid by the family directly to the nanny unless a written agreement says otherwise.",
          "The applicable fee and payment status are displayed in the family account. If a fee or term changes, the amount applicable to a new request or placement will be shown before payment or agreement. Search fees are not refundable once the agency has begun the search, except where required by law or stated in a written service agreement.",
        ],
      },
      {
        title: "Payment processing",
        paragraphs: [
          "Payments are processed using the payment methods presented at checkout. Payment confirmation may take a short time to reach your account. Do not submit a duplicate payment while a transaction is being confirmed; contact the agency if the status remains unclear. Families remain responsible for paying nanny wages and household employment costs that are not expressly included in a written EGN agreement.",
        ],
      },
    ],
  },
  {
    id: "screening",
    title: "Background Checks and Vetting",
    paragraphs: [
      "EGN reviews nanny applications and, with appropriate authorization, conducts or coordinates identity, reference, credential, and background checks relevant to a placement. Nannies must provide accurate information and the documents requested for their application; the agency carries out background screening rather than requiring a nanny to provide a completed background-check report as a substitute.",
      "Screening is intended to support safer placements but cannot eliminate every risk or guarantee future conduct, performance, or suitability. Families should promptly raise safety concerns with the agency and take reasonable steps to protect children in their care.",
    ],
  },
  {
    id: "family-responsibilities",
    title: "Family Responsibilities",
    paragraphs: ["Families agree to:"],
    bullets: [
      "Provide complete and accurate household, care, schedule, location, budget, and child-related information.",
      "Keep account and contact information current and tell EGN about material changes to a request or placement.",
      "Provide a safe, lawful, and respectful working environment and treat nannies professionally.",
      "Pay agreed nanny wages and meet applicable tax, employment, insurance, and workplace obligations.",
      "Use nanny profiles and information only to evaluate and manage the requested placement, and keep confidential information private.",
      "Report safety concerns or incidents to EGN promptly.",
    ],
  },
  {
    id: "nanny-responsibilities",
    title: "Nanny Responsibilities",
    paragraphs: ["Nannies using the platform agree to:"],
    bullets: [
      "Provide truthful information about identity, qualifications, experience, references, availability, and work authorization where applicable.",
      "Submit the application documents requested by EGN and keep required credentials current.",
      "Provide safe, professional, and nurturing care within the agreed role and follow lawful household guidance.",
      "Protect family and child information and not share it without permission or a legal obligation.",
      "Tell EGN and the family promptly about availability changes, incidents, or safety concerns.",
      "Comply with applicable laws and the terms of any employment agreement with the family.",
    ],
  },
  {
    id: "placement-and-employment",
    title: "Placement, Employment, and Agency Role",
    paragraphs: [
      "EGN coordinates the search and selects candidates for a family’s shortlist based on information available to the agency. The family may review the shortlist and communicate with the agency about next steps through the platform. Platform messaging is for family-to-agency and nanny-to-agency communication; it is not a family-to-nanny chat service.",
      "Unless a separate written agreement states otherwise, EGN acts as a placement agency and the family is responsible for the employment relationship with a nanny it hires, including wages and employer obligations. EGN does not guarantee a particular placement or an individual’s conduct. Any placement guarantee, including its duration, eligibility, and remedy, is governed by the applicable written placement agreement.",
    ],
  },
  {
    id: "cancellations",
    title: "Cancellations, Refunds, and Placement Support",
    paragraphs: [
      "Subscription cancellations stop future renewals under the billing period described above. For nanny placement searches, the search fee covers the agency’s work to initiate and conduct the search and is not refundable after matching work begins, except where required by law or a written service agreement. The placement fee, replacement support, and other remedies are governed by the written placement agreement and applicable law.",
      "If you believe a payment was made in error or need to discuss a cancellation, contact EGN promptly. We will review the payment and applicable agreement.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use and Account Security",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the website or services for unlawful, deceptive, abusive, or discriminatory purposes.",
      "Submit false or misleading information, impersonate another person, or misuse another user’s documents or profile.",
      "Attempt to access another account, private file, or system without authorization, or interfere with platform security or operation.",
      "Share login credentials or use another person’s account without permission.",
    ],
  },
  {
    id: "confidentiality",
    title: "Confidentiality",
    paragraphs: [
      "Families and nannies must protect personal, household, child, employment, and screening information they receive through the agency. Use that information only for the service or placement for which it was provided. Confidentiality obligations continue after an account is closed or a placement ends, except where disclosure is required by law or needed to address an immediate safety concern.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    paragraphs: [
      "Website content, branding, graphics, and software are owned by EGN or its licensors and protected by applicable intellectual-property laws. You may use the website for its intended purposes, but may not copy, distribute, modify, or commercially exploit protected content without written permission.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the extent permitted by law, EGN is not responsible for independent acts or omissions by families or nannies, employment decisions made by a family, or information a user provides that EGN could not reasonably verify. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited. Any service-specific allocation of risk or remedy must be stated in the applicable written agreement.",
    ],
  },
  {
    id: "disputes",
    title: "Governing Law and Disputes",
    paragraphs: [
      "These Terms are governed by the laws applicable in New Jersey, without regard to conflict-of-law rules, subject to any mandatory consumer protections that apply. If a concern arises, please contact EGN first so we can try to resolve it in good faith. Any formal dispute process is subject to the applicable written agreement and governing law.",
    ],
  },
  {
    id: "changes-and-termination",
    title: "Changes and Termination",
    paragraphs: [
      "We may update these Terms by posting a revised version here and updating the date. Changes apply prospectively from the posted effective date, except where law or a written agreement requires otherwise. We may suspend or end access when necessary to protect users, the platform, or the agency, or when an account violates these Terms or applicable law. You may stop using the website and close your account by contacting us; payment, confidentiality, and other obligations that by their nature continue will remain in effect.",
    ],
  },
];

export default function TermsConditionsPage() {
  return <LegalDocument title="Terms & Conditions" description="Last updated October 22, 2026 · Terms for using our website, accounts, and childcare services." sections={SECTIONS} contactTitle="Questions about these terms?" />;
}
