import type { Metadata } from "next";
import { LegalDocument, type LegalSection } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn what information Executive Global Nanny collects, how we use it, and the choices available to families and nannies.",
  alternates: { canonical: "/privacy-policy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      'Executive Global Nanny LLC ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our website, member portal, and nanny placement and babysitting services.',
      "This policy applies to families, nannies, and visitors. It should be read together with our Terms & Conditions and any written service agreement that applies to your placement or membership.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    subsections: [
      {
        title: "Personal and account information",
        bullets: [
          "Name, email address, phone number, and mailing or service address.",
          "Account login and verification details.",
          "Date of birth, government-issued identification, and other documents when needed for identity or eligibility review.",
          "Payment and billing status, subscription records, and transaction references. Payment card details are handled by our payment processor; we do not store full card numbers on our application servers.",
        ],
      },
      {
        title: "Family information",
        bullets: [
          "Information about children relevant to care, such as ages, routines, support needs, and preferences, provided by a parent or guardian.",
          "Household requirements, care schedule, location, and preferred care arrangements.",
          "Information needed to coordinate a request, placement, or ongoing support.",
        ],
      },
      {
        title: "Nanny information",
        bullets: [
          "Employment history, education, childcare experience, skills, availability, and geographic preferences.",
          "References, identity documents, and professional certificates such as CPR or First Aid credentials.",
          "Screening information obtained by the agency, with appropriate authorization, such as background-check results and reference verification.",
          "Answers in a nanny application about conviction history, health, prescribed medication, allergies, and caregiving constraints. We use these details to review the application, follow up when relevant, and assess role and placement suitability and care-related safety. Access is limited to authorized team members who need the information for these purposes.",
          "Profile photographs and documents you choose or are required to submit as part of your application.",
        ],
      },
      {
        title: "Website and usage information",
        paragraphs: [
          "Our systems and hosting providers may receive technical information such as browser type, device information, IP address, pages requested, and the time and date of a visit. We use this information to operate, secure, and troubleshoot the website.",
        ],
      },
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
    paragraphs: ["We use information for the purposes for which it was provided and to operate our agency services, including to:"],
    bullets: [
      "Create and protect accounts, confirm email addresses, and provide access to the appropriate member dashboard.",
      "Review nanny applications, verify credentials and references, and conduct authorized agency screening.",
      "Understand family care requirements, select suitable candidates, prepare shortlists, and coordinate placements.",
      "Manage babysitter subscriptions, nanny search and placement fees, payment status, and billing support.",
      "Send account, service, safety, and administrative messages, and respond to questions or requests.",
      "Maintain records, investigate misuse or security issues, comply with legal obligations, and protect the rights and safety of users and the agency.",
      "Send newsletters or promotional information where permitted; you may opt out of marketing messages at any time.",
    ],
  },
  {
    id: "sharing",
    title: "Information Sharing and Disclosure",
    paragraphs: ["We do not sell personal information. We share information only when reasonably needed for the purposes below:"],
    subsections: [
      {
        title: "For a requested service or placement",
        paragraphs: [
          "When the agency is arranging a match, we may share relevant profile and care-request details with the family or nanny involved so they can assess and support the proposed placement. Access to sensitive application documents and screening records is restricted and is not generally included in family-facing profile summaries.",
        ],
      },
      {
        title: "Service providers",
        paragraphs: [
          "We use service providers that support payment processing, email delivery, hosting, security, and agency operations. They receive only the information needed to perform their services and are expected to protect it appropriately.",
        ],
      },
      {
        title: "Legal and safety reasons",
        paragraphs: [
          "We may disclose information if required by law or legal process, to protect the safety or rights of a person, to investigate suspected fraud or misuse, or to enforce our agreements.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Data Security",
    paragraphs: [
      "We use administrative, technical, and organizational safeguards designed to protect information from unauthorized access, loss, misuse, alteration, or disclosure. These include account authentication, role-based access controls, and restricted access to private application and chat files. We limit access to personal information to people and service providers who need it for their work.",
      "No method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security, but we work to identify and address risks and encourage you to use a unique password and protect your account credentials.",
    ],
  },
  {
    id: "rights-and-choices",
    title: "Your Rights and Choices",
    paragraphs: ["Depending on applicable law, you may ask us to:"],
    bullets: [
      "Provide access to personal information we hold about you.",
      "Correct information that is inaccurate or incomplete.",
      "Delete information, subject to records we must retain for legal, safety, payment, or legitimate business purposes.",
      "Limit or object to certain uses, or withdraw consent where processing depends on consent.",
      "Unsubscribe from marketing messages using the link in the message or by contacting us.",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    paragraphs: [
      "We retain personal information for as long as needed to provide services, manage an account or placement, meet legal and accounting obligations, resolve disputes, enforce agreements, and protect safety. Retention periods vary by the type and sensitivity of the information. When information is no longer needed, we take steps to delete or de-identify it, subject to technical, legal, and backup requirements.",
    ],
  },
  {
    id: "children",
    title: "Children’s Privacy",
    paragraphs: [
      "Our website and account services are intended for adults. We do not knowingly invite children under 18 to create accounts. Parents or guardians may provide limited information about a child when requesting care; that information is used to understand and coordinate the requested service. Please contact us if you believe a child has provided personal information directly to us.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Privacy Policy",
    paragraphs: [
      "We may update this policy when our practices, services, or legal requirements change. We will post the current version here and update the date above. If a change materially affects how we use information, we will provide notice where required by law.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return <LegalDocument title="Privacy Policy" description="Last updated October 22, 2026 · How we collect, use, and protect information entrusted to us." sections={SECTIONS} contactTitle="Questions about privacy or your information?" />;
}
