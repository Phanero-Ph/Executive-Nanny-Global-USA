/* Central content model for the Executive Global Nanny marketing site. */

export const SITE = {
  name: "Executive Global Nanny",
  shortName: "EGN",
  tagline: "Trusted Nannies for New Jersey Families",
  phone: "(609) 429-6399",
  phoneHref: "tel:+16094296399",
  email: "info@executiveglobalnanny.com",
  address: "Branchburg, NJ 08876",
  town: "Branchburg",
  state: "New Jersey",
  hours: "Mon–Fri: 8am–6pm EST",
  responsePromise: "We respond within 24 hours.",
};

export const IMAGES = {
  hero: "https://images.pexels.com/photos/8671138/pexels-photo-8671138.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  familyPlay:
    "https://images.pexels.com/photos/4017415/pexels-photo-4017415.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mealCare:
    "https://images.pexels.com/photos/6974489/pexels-photo-6974489.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  kitchenPlay:
    "https://images.pexels.com/photos/6222756/pexels-photo-6222756.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sofaMoment:
    "https://images.pexels.com/photos/6274932/pexels-photo-6274932.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  rockingHorse:
    "https://images.pexels.com/photos/7180764/pexels-photo-7180764.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  kidsPlaying:
    "https://images.pexels.com/photos/5063353/pexels-photo-5063353.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  familyWindow:
    "https://images.pexels.com/photos/4868320/pexels-photo-4868320.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  bottleFeeding:
    "https://images.pexels.com/photos/6849544/pexels-photo-6849544.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  stairsBaby:
    "https://images.pexels.com/photos/19773885/pexels-photo-19773885.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  carryingBaby:
    "https://images.pexels.com/photos/7282831/pexels-photo-7282831.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  dressingBaby:
    "https://images.pexels.com/photos/7282212/pexels-photo-7282212.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  holdingHands:
    "https://images.pexels.com/photos/34566653/pexels-photo-34566653.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  motherBaby:
    "https://images.pexels.com/photos/7282778/pexels-photo-7282778.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  readingSofa:
    "https://images.pexels.com/photos/33737251/pexels-photo-33737251.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  snackTime:
    "https://images.pexels.com/photos/6274999/pexels-photo-6274999.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  readingBook:
    "https://images.pexels.com/photos/6274942/pexels-photo-6274942.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  bedroomReading:
    "https://images.pexels.com/photos/6274960/pexels-photo-6274960.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sofaReading:
    "https://images.pexels.com/photos/8909611/pexels-photo-8909611.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  coloring:
    "https://images.pexels.com/photos/8909610/pexels-photo-8909610.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  training1:
    "https://images.pexels.com/photos/5756649/pexels-photo-5756649.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  training2:
    "https://images.pexels.com/photos/5756743/pexels-photo-5756743.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  training3:
    "https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  training4:
    "https://images.pexels.com/photos/5756664/pexels-photo-5756664.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

/* ---------------------------------- Services --------------------------------- */

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  longDescription: string[];
  image: string;
  icon: string;
  features: string[];
  idealFor: string[];
  startingAt: string;
};

export const SERVICES: Service[] = [
  {
    slug: "full-time-nanny",
    title: "Full-Time Nanny Placement",
    short: "A dedicated, career nanny matched to your household.",
    description:
      "Our signature service: a thoroughly vetted, full-time nanny placed in your home with a 90-day replacement guarantee.",
    longDescription: [
      "Finding the right full-time nanny is one of the most important decisions your family will make. Our recruiters take time to understand your parenting style, schedule, household rhythms, and long-term goals — then curate a shortlist of candidates who truly fit.",
      "Every full-time candidate completes identity verification, reference checks, a compliant background screen with documented consent, CPR/First Aid verification, and an in-depth recruiter interview before you ever meet them. You interview only the best — typically 2 to 4 exceptional nannies.",
      "Once you choose your nanny, we support the transition with a trial period, a written work agreement template, and check-ins at 30, 60, and 90 days. If the placement isn't right within the guarantee window, we rematch at no additional placement fee.",
    ],
    image: IMAGES.familyPlay,
    icon: "baby",
    features: [
      "Dedicated recruiter & tailored candidate shortlist",
      "Background screening with documented consent",
      "CPR/First Aid certification verification",
      "Reference checks & in-depth recruiter interview",
      "Trial day & work-agreement support",
      "90-day replacement guarantee",
    ],
    idealFor: [
      "Working parents needing 30–50+ hours per week",
      "Families seeking consistency for infants & toddlers",
      "Households relocating to Somerset County & surrounds",
    ],
    startingAt: "Search fee applies",
  },
  {
    slug: "part-time-nanny",
    title: "Part-Time Nanny",
    short: "Consistent after-school & part-time coverage.",
    description:
      "Regular part-time care — after-school pickups, homework help, and flexible daytime hours that fit your week.",
    longDescription: [
      "Not every family needs full-time care. Our part-time nannies provide dependable coverage for after-school hours, preschool gaps, work-from-home support, and weekend routines.",
      "Part-time placements go through the same rigorous vetting as full-time placements. We match on availability windows, driving requirements, homework support skills, and activity interests so your children look forward to every visit.",
    ],
    image: IMAGES.readingBook,
    icon: "clock",
    features: [
      "After-school pickup & homework support",
      "Flexible 10–29 hour weekly schedules",
      "Same full vetting as full-time placements",
      "Driving-record review for transport roles",
      "Easy schedule adjustments as needs change",
      "Backup coverage options for sick days",
    ],
    idealFor: [
      "After-school coverage (3–7pm)",
      "Work-from-home parents needing quiet hours",
      "Preschool & kindergarten gap coverage",
    ],
    startingAt: "Search fee applies",
  },
  {
    slug: "babysitting",
    title: "Babysitting & Date-Night Care",
    short: "Vetted sitters on demand, booked in minutes.",
    description:
      "Membership-based babysitting with CPR-certified babysitters — perfect for date nights, events, and weekend plans.",
    longDescription: [
      "Our babysitting membership gives your family on-demand access to a bench of vetted, CPR-certified sitters across Somerset, Hunterdon, Morris, and Middlesex counties.",
      "Request care in minutes through your family portal: share the date, time, ages, and bedtime routine — we confirm a sitter who already knows your household preferences. Members enjoy priority booking and flexible scheduling, with monthly plans ranging from 3 bookings to unlimited babysitter submissions.",
    ],
    image: IMAGES.sofaMoment,
    icon: "sparkles",
    features: [
      "CPR-certified sitters, background-checked",
      "Book in minutes via your family portal",
      "Priority booking & flexible scheduling",
      "Sitter notes & bedtime-routine profiles",
      "Evening, weekend & holiday availability",
      "No placement fee — simple membership",
    ],
    idealFor: [
      "Date nights & evenings out",
      "Weddings, events & travel coverage",
      "Weekend errands & self-care time",
    ],
    startingAt: "Memberships from $59/mo",
  },
  {
    slug: "backup-care",
    title: "Backup & Emergency Care",
    short: "Same-day care when plans fall apart.",
    description:
      "Last-minute coverage for sick days, school closures, and nanny or babysitter gaps — often confirmed within hours.",
    longDescription: [
      "School closed? Regular nanny sick? Meeting you can't miss? Our backup-care bench exists for exactly these mornings.",
      "Backup members keep a household profile on file so we can arrange a vetted babysitter quickly — often within 2 to 4 hours in our core service area. Every backup babysitter meets the same screening bar: verified identity, references, background check, and CPR certification.",
    ],
    image: IMAGES.kitchenPlay,
    icon: "siren",
    features: [
      "Same-day requests, often filled in hours",
      "Household profile kept on file",
      "Fully vetted backup bench",
      "School-closure & sick-day coverage",
      "Transparent per-booking pricing",
      "Care summaries after every visit",
    ],
    idealFor: [
      "Two-career households without local family",
      "School holidays & snow days",
      "Regular-nanny vacation & sick coverage",
    ],
    startingAt: "Per-booking from $35/hr",
  },
  {
    slug: "newborn-overnight",
    title: "Newborn & Overnight Care",
    short: "Specialist night nannies & postpartum support.",
    description:
      "Overnight newborn specialists and postpartum support so the whole family can rest, recover, and bond.",
    longDescription: [
      "The first months are beautiful and exhausting. Our newborn care specialists provide overnight support — feeding, soothing, diapering, and sleep-shaping — so parents wake rested.",
      "Daytime postpartum support is also available: light household help, sibling care, and evidence-based guidance on feeding and sleep rhythms. All newborn specialists hold infant CPR certification and verified newborn experience.",
    ],
    image: IMAGES.bottleFeeding,
    icon: "moon",
    features: [
      "Overnight shifts (8–12 hours)",
      "Infant CPR-certified specialists",
      "Feeding, soothing & sleep-shaping",
      "Postpartum daytime support",
      "Multiples & preemie experience available",
      "Gentle, evidence-based approach",
    ],
    idealFor: [
      "New parents in the first 6 months",
      "C-section recovery support",
      "Families welcoming multiples",
    ],
    startingAt: "Overnights from $320/night",
  },
  {
    slug: "household-manager",
    title: "Household Manager & Family Assistant",
    short: "Keep the whole household running smoothly.",
    description:
      "Professional household managers and family assistants for calendars, errands, meal prep, and family logistics.",
    longDescription: [
      "When life outgrows the calendar, a household manager brings it all back into order — school logistics, vendor coordination, grocery and meal planning, travel prep, and light family assisting.",
      "We recruit organized, discreet professionals with verified experience. Many families pair a household manager with part-time childcare for complete coverage.",
    ],
    image: IMAGES.coloring,
    icon: "briefcase",
    features: [
      "Calendar, school & activity logistics",
      "Errands, groceries & meal planning",
      "Vendor & household-staff coordination",
      "Travel planning & packing support",
      "Discreet, NDA-friendly professionals",
      "Combine with part-time childcare",
    ],
    idealFor: [
      "Busy executives & business owners",
      "Large or multi-property households",
      "Families juggling kids' activities",
    ],
    startingAt: "Search fee applies",
  },
];

export const serviceBySlug = (slug: string) =>
  SERVICES.find((s) => s.slug === slug);

/* -------------------------------- Service areas ------------------------------- */

export type ServiceArea = {
  slug: string;
  name: string;
  county: string;
  zips: string[];
  description: string[];
  highlights: string[];
  image: string;
};

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "branchburg",
    name: "Branchburg",
    county: "Somerset County",
    zips: ["08876", "08853"],
    description: [
      "Executive Global Nanny is headquartered in Branchburg, NJ — which means Branchburg families get our fastest response times, deepest network of nannies and babysitters, and same-day backup availability.",
      "From neighborhoods around Raritan Valley Community College to the family streets off Route 28 and Old York Road, our nannies, sitters, and newborn specialists serve Branchburg daily — including after-school coverage for Branchburg Township schools.",
    ],
    highlights: [
      "HQ town — fastest matching & backup response",
      "After-school care for Branchburg Township schools",
      "Deep bench of local, CPR-certified sitters",
      "Evening & weekend date-night coverage",
    ],
    image: IMAGES.hero,
  },
  {
    slug: "bridgewater",
    name: "Bridgewater",
    county: "Somerset County",
    zips: ["08807", "08836"],
    description: [
      "Bridgewater's growing families rely on EGN for full-time nanny placements, after-school care, and on-demand babysitting across neighborhoods from Martinsville to Finderne.",
      "With easy Route 22 and I-287 access, our nannies and babysitters reach Bridgewater homes quickly — ideal for backup care on school-closure days and early-morning coverage.",
    ],
    highlights: [
      "Full-time & part-time nanny placements",
      "Backup care with fast I-287 corridor access",
      "After-school programs & activity transport",
      "Newborn & overnight specialists",
    ],
    image: IMAGES.familyWindow,
  },
  {
    slug: "hillsborough",
    name: "Hillsborough",
    county: "Somerset County",
    zips: ["08844"],
    description: [
      "Hillsborough families choose EGN for dependable, long-term nannies and flexible babysitting that keeps up with busy school and sports calendars.",
      "Our recruiters regularly place nannies in Hillsborough for after-school routines, homework support, and full-day infant care — all backed by our 90-day replacement guarantee on placements.",
    ],
    highlights: [
      "Long-term nanny placements",
      "Homework & activity-routine support",
      "Infant & toddler specialists",
      "Membership babysitting for weekends",
    ],
    image: IMAGES.sofaReading,
  },
  {
    slug: "somerset-county",
    name: "Somerset County",
    county: "Somerset County",
    zips: ["08876", "08807", "08844", "07920", "08869", "08558"],
    description: [
      "As a Somerset County agency, we serve the full county — Basking Ridge, Bedminster, Bernardsville, Far Hills, Franklin, Montgomery, North Plainfield, Raritan, Somerville, Warren, and Watchung.",
      "County-wide coverage means a larger vetted nanny and babysitter pool, quicker shortlists, and reliable backup care from Branchburg to the northern hills.",
    ],
    highlights: [
      "Full-county coverage, one agency",
      "Largest vetted nanny and babysitter pool in the county",
      "School-district-aware matching",
      "Same-day backup in core towns",
    ],
    image: IMAGES.kidsPlaying,
  },
  {
    slug: "hunterdon-county",
    name: "Hunterdon County",
    county: "Hunterdon County",
    zips: ["08822", "08559", "08827", "08833", "08801"],
    description: [
      "From Flemington and Raritan Township to Clinton, Readington, and Lebanon, Hunterdon County families trust EGN for personalized nanny placements and dependable sitters.",
      "We match with commute and transport needs in mind — including nannies and babysitters who can drive for school pickups and activities across the county's spread-out communities.",
    ],
    highlights: [
      "Nannies and babysitters who can drive for rural routes",
      "Full-time placements & after-school care",
      "Weekend babysitting memberships",
      "Newborn & postpartum support",
    ],
    image: IMAGES.mealCare,
  },
  {
    slug: "morris-county",
    name: "Morris County",
    county: "Morris County",
    zips: ["07960", "07950", "07869", "07927", "07853"],
    description: [
      "Morristown, Mendham, Chester, Long Valley, and surrounding Morris County towns are served by our full placement and babysitting services.",
      "Morris County families often pair a part-time nanny with a babysitting membership — daily structure plus flexible evenings and weekends.",
    ],
    highlights: [
      "Placement + membership bundles",
      "Experienced infant & toddler nannies",
      "Household managers for busy families",
      "Holiday & school-break coverage",
    ],
    image: IMAGES.stairsBaby,
  },
  {
    slug: "middlesex-county",
    name: "Middlesex County",
    county: "Middlesex County",
    zips: ["08854", "08536", "08831", "08817", "08859"],
    description: [
      "Serving northern Middlesex — Piscataway, South Plainfield, Edison, Metuchen, and Plainsboro — with vetted nannies and on-demand sitters.",
      "Our recruiters understand Middlesex school schedules and commuter realities, matching nannies and babysitters who fit early starts and NYC-commute households.",
    ],
    highlights: [
      "Early-morning coverage for commuters",
      "After-school care & homework help",
      "Vetted date-night sitters",
      "Backup care for working parents",
    ],
    image: IMAGES.snackTime,
  },
  {
    slug: "princeton-area",
    name: "Princeton Area",
    county: "Mercer County",
    zips: ["08540", "08542", "08558", "08528"],
    description: [
      "Princeton, West Windsor, Montgomery, and Kingston families rely on EGN for highly educated, professional nannies and family assistants.",
      "University-affiliated and relocating families appreciate our structured vetting, trial periods, and work-agreement support — plus newborn specialists for growing households.",
    ],
    highlights: [
      "Professional, career nannies",
      "Relocation-friendly onboarding",
      "Family assistants & household managers",
      "Newborn & overnight care",
    ],
    image: IMAGES.holdingHands,
  },
];

export const areaBySlug = (slug: string) =>
  SERVICE_AREAS.find((a) => a.slug === slug);

/* --------------------------------- Testimonials ------------------------------- */

export type Testimonial = {
  name: string;
  location: string;
  role: string;
  quote: string;
  rating: number;
  service: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "The Henderson Family",
    location: "Branchburg, NJ",
    role: "Full-Time Placement",
    quote:
      "Our recruiter understood exactly what we needed — and our nanny felt like family within a week. The 90-day guarantee gave us total peace of mind during the transition.",
    rating: 5,
    service: "Full-Time Nanny",
  },
  {
    name: "Priya S.",
    location: "Bridgewater, NJ",
    role: "Babysitting Member",
    quote:
      "Every sitter has been punctual, warm, and CPR certified. The online booking makes it so easy to schedule, and the care summaries after each visit are a lovely touch.",
    rating: 5,
    service: "Babysitting",
  },
  {
    name: "The Okafor Family",
    location: "Hillsborough, NJ",
    role: "After-School Care",
    quote:
      "After-school pickup, homework, dinner prep — our part-time nanny handles it all. The kids genuinely look forward to her arriving every day.",
    rating: 5,
    service: "Part-Time Nanny",
  },
  {
    name: "Melissa R.",
    location: "Flemington, NJ",
    role: "Backup Care",
    quote:
      "School closed with two hours' notice and EGN had a wonderful backup sitter at our door before my first meeting. Absolute lifesavers for working parents.",
    rating: 5,
    service: "Backup Care",
  },
  {
    name: "The Alvarez Family",
    location: "Princeton, NJ",
    role: "Newborn Care",
    quote:
      "Our night nanny helped our twins — and us — learn to sleep. Gentle, knowledgeable, and incredibly professional. Worth every penny.",
    rating: 5,
    service: "Overnight Newborn",
  },
  {
    name: "Danielle K., Nanny",
    location: "Somerville, NJ",
    role: "EGN Nanny",
    quote:
      "As a nanny, the training and support stand out. The subscription gives me real visibility with great families, and my recruiter checks in regularly.",
    rating: 5,
    service: "Nanny Network",
  },
];

/* ------------------------------------- FAQs ----------------------------------- */

export type Faq = { q: string; a: string; category: string };

export const FAQ_CATEGORIES = [
  { id: "families", label: "For Families" },
  { id: "pricing", label: "Pricing & Fees" },
  { id: "safety", label: "Safety & Vetting" },
  { id: "nannies", label: "For Nannies" },
] as const;

export const FAQS: Faq[] = [
  {
    q: "How does the nanny matching process work?",
    a: "Share your needs through our family request form or a consultation call. After your search fee is confirmed, your dedicated recruiter screens our vetted bench, verifies availability, and presents a curated shortlist — typically 2 to 4 candidates. You interview your favorites, enjoy a trial day, and we support onboarding with a work agreement and 30/60/90-day check-ins.",
    category: "families",
  },
  {
    q: "How quickly can we get a nanny or sitter?",
    a: "Babysitting members can often book care within hours, and backup-care requests in our core area are frequently filled the same day. Full-time placements typically take 1–3 weeks depending on your schedule requirements and how quickly interviews are completed.",
    category: "families",
  },
  {
    q: "Can we browse nanny profiles ourselves?",
    a: "No — and that's intentional. EGN is an agency-controlled service: our recruiters curate tailored shortlists from fully vetted, subscription-active nannies and babysitters. This protects their privacy and ensures every candidate you meet is already qualified, available, and genuinely suited to your household.",
    category: "families",
  },
  {
    q: "What ages do your nannies and babysitters support?",
    a: "Newborns through age 13, including multiples. Our newborn specialists focus on ages 0–6 months (overnight and daytime), while our nannies and sitters cover infants, toddlers, preschoolers, and school-age children.",
    category: "families",
  },
  {
    q: "What is the family search fee?",
    a: "Babysitter requests use a paid family subscription. Nanny requests need no subscription: pay the search fee before the search starts, then the placement fee calculated from the agreed annual salary before work starts.",
    category: "pricing",
  },
  {
    q: "How do placement fees work?",
    a: "The agency selects a nanny and records the agreed annual salary. Your placement quote shows the annual salary, percentage rate and calculated fee. Review and pay it before your nanny starts work; wages are paid separately.",
    category: "pricing",
  },
  {
    q: "How do babysitter subscriptions work?",
    a: "Choose Basic ($59/month for 3 babysitter submissions), Standard ($89/month for 5 babysitter submissions), Deluxe ($129/month for 8 babysitter submissions), or Premium ($200/month for unlimited babysitter submissions). All plans include priority booking, vetted CPR-certified babysitters, and flexible scheduling. These limits apply to babysitter search submissions in each paid monthly period. Babysitter search and company placement fees are included; wages are separate.",
    category: "pricing",
  },
  {
    q: "Do nannies pay to join the platform?",
    a: "Yes. Approved nannies hold an active platform subscription ($19/month or $190/year) that keeps their profile visible for matching, unlocks training, and funds ongoing verification. Matching eligibility pauses automatically if a subscription lapses, which protects families from inactive profiles.",
    category: "pricing",
  },
  {
    q: "How do you vet nannies?",
    a: "Every nanny completes identity verification, professional reference checks, a compliant background screen with documented consent, CPR/First Aid verification, and an in-depth recruiter interview. Credentials and certifications are re-verified on expiry, and only subscription-active nannies are proposed to families.",
    category: "safety",
  },
  {
    q: "Are your nannies CPR and First Aid certified?",
    a: "Yes — current infant/child CPR and First Aid certification (or enrollment in our certification course) is required before any nanny is proposed to a family. We verify certificates directly and track expiry dates so nothing lapses unnoticed.",
    category: "safety",
  },
  {
    q: "What happens if our placement doesn't work out?",
    a: "Full-time and part-time placements include a 90-day replacement guarantee: if the match isn't right for any reason within the guarantee window, we rematch at no additional placement fee. Your recruiter stays in touch through structured 30/60/90-day check-ins to catch concerns early.",
    category: "safety",
  },
  {
    q: "Who employs the nanny — us or the agency?",
    a: "In most placements, the family is the employer of record and the nanny is your household employee; EGN provides the search, screening, matching, and ongoing support. We provide work-agreement templates and can recommend household payroll partners. Confirm final arrangements during your consultation.",
    category: "safety",
  },
  {
    q: "How do I apply as a nanny or sitter?",
    a: "Complete the nanny application online — it takes about 10 minutes and you can save progress. Our team reviews every application within 2 business days, then invites qualified candidates to document review, screening, and a recruiter interview.",
    category: "nannies",
  },
  {
    q: "What do I need to qualify?",
    a: "You'll need at least 2 years of professional childcare experience (or 1 year plus relevant certification), verifiable references, eligibility to work in the US, and infant/child CPR/First Aid certification — or willingness to certify through our training academy before matching.",
    category: "nannies",
  },
  {
    q: "How and when do nannies and babysitters get paid?",
    a: "For nanny placements, families pay nannies directly as household employees on an agreed schedule. For babysitting and backup bookings, members are billed through the platform and babysitter earnings are disbursed weekly. Your recruiter confirms the exact arrangement for every role.",
    category: "nannies",
  },
  {
    q: "What training is available to nannies?",
    a: "Subscribers get access to the EGN Training Academy: CPR/First Aid certification, newborn care, positive discipline, child nutrition, special-needs awareness, and our Professional Nanny Foundations course — plus certificates that strengthen your profile with families.",
    category: "nannies",
  },
];

/* ------------------------------------- Blog ----------------------------------- */

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  image: string;
  sections: { heading?: string; paragraphs: string[] }[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-much-does-a-nanny-cost-in-new-jersey",
    title: "How Much Does a Nanny Cost in New Jersey? (2026 Guide)",
    excerpt:
      "Realistic NJ nanny rates by role and county, plus the agency fees, taxes, and hidden costs families should budget for.",
    category: "Costs & Budgeting",
    date: "September 28, 2026",
    readTime: "8 min read",
    author: "EGN Family Advisory Team",
    image: IMAGES.familyPlay,
    sections: [
      {
        paragraphs: [
          "Hiring a nanny in New Jersey is a significant investment — and one of the highest-value decisions a busy family can make. In Somerset, Hunterdon, Morris, and Middlesex counties, experienced full-time nannies typically earn $22–$32 per hour in 2026, depending on experience, education, duties, and hours.",
          "Part-time and after-school nannies generally fall in the $24–$30 per hour range (shorter shifts command a premium), while evening babysitters average $22–$28 per hour. Overnight newborn specialists are usually booked per night, commonly $320–$450 for 8–12 hour shifts.",
        ],
      },
      {
        heading: "Agency fees, explained honestly",
        paragraphs: [
          "At Executive Global Nanny, families pay an upfront search fee that activates your recruiter and candidate search — at the current nanny search rate. When you select your nanny, a one-time placement fee (calculated as a percentage of the agreed annual salary) finalizes the match and activates your 90-day replacement guarantee.",
          "Ask any agency for these numbers in writing before interviews begin. A reputable agency will always confirm fees upfront — no surprises after you've fallen in love with a candidate.",
        ],
      },
      {
        heading: "Don't forget the 'nanny tax'",
        paragraphs: [
          "In most placements, your nanny is your household employee, which means Social Security, Medicare, and unemployment obligations apply. Budget roughly 10–12% on top of gross wages for the employer share, and consider a household payroll service ($50–$75/month) to handle withholdings and filings cleanly.",
          "Paid time off, holidays, and a guaranteed-hours clause are standard in professional NJ nanny roles — and the families offering them attract far stronger candidates.",
        ],
      },
      {
        heading: "The bottom line",
        paragraphs: [
          "For a full-time nanny in central New Jersey, most families should budget $50,000–$70,000 per year all-in, including wages, taxes, and agency fees amortized over the first year. It isn't small — but neither is the value of consistent, one-on-one care from someone who truly knows your children.",
          "Want a precise estimate for your schedule? Request a consultation and we'll build a transparent budget before you commit to anything.",
        ],
      },
    ],
  },
  {
    slug: "nanny-interview-questions",
    title: "15 Nanny Interview Questions That Reveal Everything",
    excerpt:
      "Go beyond 'do you like kids?' — the scenario-based questions our recruiters use to spot exceptional nannies.",
    category: "Hiring Guide",
    date: "September 14, 2026",
    readTime: "7 min read",
    author: "EGN Recruiting Team",
    image: IMAGES.readingSofa,
    sections: [
      {
        paragraphs: [
          "Every candidate you meet through EGN has already passed our screening — but the family interview is where fit is decided. The best interviews feel like conversations, not interrogations, and focus on real scenarios rather than hypotheticals.",
          "Here are the questions our recruiters recommend most, grouped by what they reveal.",
        ],
      },
      {
        heading: "Safety instincts (non-negotiable)",
        paragraphs: [
          "1. 'Walk me through what you'd do if my toddler fell and hit their head at the playground.' Listen for: scene safety, calm assessment, when they'd call you vs. 911, and incident documentation. 2. 'Tell me about a time a child in your care had an allergic reaction or medical scare.' 3. 'What are your water-safety rules?' — strong candidates answer without hesitation.",
        ],
      },
      {
        heading: "Discipline philosophy",
        paragraphs: [
          "4. 'How do you handle tantrums in a grocery store?' 5. 'What does positive discipline mean to you in practice?' 6. 'Tell me about the most challenging behavior you've managed and what you learned.' You're listening for alignment with your own approach — consistency between parents and nanny matters more than any single method.",
        ],
      },
      {
        heading: "Day-to-day fit",
        paragraphs: [
          "7. 'Describe your ideal daily schedule with a child this age.' 8. 'How do you balance activities vs. downtime?' 9. 'What's your approach to screen time?' 10. 'How do you handle schedule changes or last-minute requests?' 11–15. Logistics: driving comfort, meal prep, homework help, travel willingness, and long-term availability.",
          "Close with this: 'What questions do you have for us?' The best nannies interview you right back — about communication style, feedback, and growth. That's exactly what you want.",
        ],
      },
    ],
  },
  {
    slug: "nanny-vs-daycare-new-jersey",
    title: "Nanny vs. Daycare in New Jersey: An Honest Comparison",
    excerpt:
      "Cost, flexibility, illness policies, and socialization — how the two options really compare for NJ families.",
    category: "Comparisons",
    date: "August 30, 2026",
    readTime: "6 min read",
    author: "EGN Family Advisory Team",
    image: IMAGES.kidsPlaying,
    sections: [
      {
        paragraphs: [
          "New Jersey has excellent daycare centers — and excellent nannies. The right choice depends on your children's ages, your schedules, and what 'good care' means to your family. Here's how they compare on the factors families ask about most.",
        ],
      },
      {
        heading: "Cost",
        paragraphs: [
          "Infant daycare in central NJ averages $1,800–$2,500 per month per child; costs scale roughly linearly with each additional child. A full-time nanny costs more for one child but often breaks even — or saves money — with two or more children in care.",
        ],
      },
      {
        heading: "Flexibility & illness",
        paragraphs: [
          "Nannies win decisively here: no drop-off windows, coverage during mild illness, and schedules built around your workday. Daycares exclude sick children (as they should), which means backup plans — and backup care costs — for every fever and stomach bug.",
        ],
      },
      {
        heading: "Socialization & structure",
        paragraphs: [
          "Quality centers offer built-in peer socialization and curriculum. Strong nannies replicate much of this through library programs, classes, playground routines, and nanny-share playdates — ask candidates how they build social time into the week.",
          "Many EGN families blend both: a part-time nanny plus two-day preschool, or full-time care with scheduled group activities. There's no single right answer — only the right fit for your season of life.",
        ],
      },
    ],
  },
  {
    slug: "preparing-your-home-for-a-new-nanny",
    title: "Preparing Your Home (and Kids) for a New Nanny",
    excerpt:
      "The first-week checklist: house guide, emergency info, routines, and how to make day one feel easy for everyone.",
    category: "Getting Started",
    date: "August 12, 2026",
    readTime: "5 min read",
    author: "EGN Family Advisory Team",
    image: IMAGES.bedroomReading,
    sections: [
      {
        paragraphs: [
          "A great placement can stumble on a chaotic first week. The families with the smoothest transitions all do the same thing: they prepare the home, the information, and the children before day one.",
        ],
      },
      {
        heading: "Write the house guide",
        paragraphs: [
          "Create a simple binder or shared doc: Wi-Fi, alarm codes, appliance quirks, cleaning expectations, screen-time rules, discipline approach, and the daily rhythm (nap times, meals, activities). EGN provides a template with every placement — most families complete it in under an hour.",
        ],
      },
      {
        heading: "Make safety visible",
        paragraphs: [
          "Post emergency numbers on the fridge: pediatrician, poison control (1-800-222-1222), preferred hospital, and two backup contacts. Walk your nanny through fire exits, the first-aid kit, EpiPen or medication storage, and any household hazards on day one.",
        ],
      },
      {
        heading: "Prepare the kids",
        paragraphs: [
          "Talk about the new nanny positively and concretely: show a photo, explain the schedule, and plan a welcome activity. For toddlers, overlap with a parent for the first day or two. Expect some testing of boundaries in week two — it's normal, and your EGN recruiter checks in at 30/60/90 days to help smooth any bumps.",
        ],
      },
    ],
  },
  {
    slug: "backup-childcare-plan-working-parents",
    title: "Every Working Parent Needs a Backup Childcare Plan",
    excerpt:
      "School closures, sick nannies, and snow days: build a three-layer backup plan before you need it.",
    category: "Working Parents",
    date: "July 26, 2026",
    readTime: "6 min read",
    author: "EGN Family Advisory Team",
    image: IMAGES.kitchenPlay,
    sections: [
      {
        paragraphs: [
          "The average working parent faces 8–12 unplanned childcare gaps per year: sick days, school closures, delayed openings, and nanny or babysitter vacations. Without a plan, each one becomes a 7am scramble. With a plan, it's a text message.",
        ],
      },
      {
        heading: "Layer 1: Your inner circle",
        paragraphs: [
          "List every person who could cover 2–4 hours on short notice — partner schedule-swaps, grandparents, nearby relatives, trusted neighbors. Write down their constraints honestly; a plan that depends on someone who's always traveling isn't a plan.",
        ],
      },
      {
        heading: "Layer 2: A backup-care membership",
        paragraphs: [
          "This is the layer most families miss. With an EGN backup profile on file — children's ages, routines, allergies, emergency contacts — one request can have a vetted babysitter at your door, often within 2–4 hours in our core service area. No 7am group texts. No vetting strangers from an app.",
        ],
      },
      {
        heading: "Layer 3: Employer & community options",
        paragraphs: [
          "Check whether your employer offers backup-care benefits (many do, unused), and know your school district's closure-notification system. Keep a 'gap day' kit ready: easy meals, activity ideas, and a pre-packed bag so any babysitter can step in smoothly.",
        ],
      },
    ],
  },
  {
    slug: "why-cpr-first-aid-certification-matters",
    title: "Why We Require CPR/First Aid for Every Nanny and Babysitter",
    excerpt:
      "Choking, falls, allergic reactions: the emergencies where minutes matter — and how certification changes outcomes.",
    category: "Safety",
    date: "July 8, 2026",
    readTime: "5 min read",
    author: "EGN Training Academy",
    image: IMAGES.training3,
    sections: [
      {
        paragraphs: [
          "Choking is a leading cause of injury for children under 4. Allergic reactions can escalate in minutes. Falls happen in seconds. In each of these moments, a nanny's or babysitter's response in the first 2–3 minutes matters more than anything else — including how fast 911 arrives.",
          "That's why EGN requires current infant/child CPR and First Aid certification (or active enrollment in our course) before any nanny or babysitter is matched with a family. No exceptions.",
        ],
      },
      {
        heading: "What certification actually covers",
        paragraphs: [
          "Pediatric CPR/First Aid courses teach infant and child CPR, choking relief for responsive and unresponsive children, AED use, bleeding control, burn care, seizure response, and anaphylaxis recognition with EpiPen administration. Our academy course adds scenario practice specific to home childcare settings.",
        ],
      },
      {
        heading: "Verification, not just claims",
        paragraphs: [
          "Anyone can claim certification on a profile. We verify certificates directly, record expiry dates, and block matching for lapsed credentials — one of many quiet safeguards built into our readiness checklist. Families can ask their recruiter for verification status on any shortlisted candidate at any time.",
        ],
      },
    ],
  },
];

export const postBySlug = (slug: string) =>
  BLOG_POSTS.find((p) => p.slug === slug);

/* ----------------------------------- Pricing ---------------------------------- */

export const PRICING = {
  familySearch: [
    {name:"Babysitter membership",price:"$59",unit:"/month and up",blurb:"Subscribe before submitting your babysitter requirements.",features:["3, 5, 8 or unlimited submissions per paid month","Recruiter search and shortlist","Agency selection and placement","Company search and placement fees included"],cta:"Choose a Subscription",featured:true},
    {name:"Nanny search",price:"Quoted per request",unit:"per request",blurb:"No subscription required. Pay after submitting your requirements.",features:["Recruiter search after confirmed payment","Candidates matched to your requirements","Agency matching and selection"],cta:"Request a Nanny",featured:false},
    {name:"Nanny placement",price:"Salary-based",unit:"of agreed annual salary",blurb:"The agency records the agreed annual salary and calculates your placement fee.",features:["Separate from the search fee","Review the salary and fee before paying","Placement starts after both fees are paid"],cta:"View Your Requests",featured:false},
  ],
  memberships: [
    {
      name: "Basic",
      price: "$59",
      unit: "/month",
      blurb: "3 babysitter submissions per paid month",
      features: ["Recruiter search", "Candidate shortlist", "Agency selection and placement", "Search and placement fees included"],
      cta: "Choose Basic",
      featured: false,
    },
    {
      name: "Standard",
      price: "$89",
      unit: "/month",
      blurb: "5 babysitter submissions per paid month",
      features: ["Recruiter search", "Candidate shortlist", "Agency selection and placement", "Search and placement fees included"],
      cta: "Choose Standard",
      featured: false,
    },
    {
      name: "Deluxe",
      price: "$129",
      unit: "/month",
      blurb: "8 babysitter submissions per paid month",
      features: ["Recruiter search", "Candidate shortlist", "Agency selection and placement", "Search and placement fees included"],
      cta: "Choose Deluxe",
      featured: true,
    },
    {
      name: "Premium",
      price: "$200",
      unit: "/month",
      blurb: "Unlimited babysitter submissions per paid month",
      features: ["Recruiter search", "Candidate shortlist", "Agency selection and placement", "Search and placement fees included"],
      cta: "Choose Premium",
      featured: false,
    },
  ],
  caregiver: {
    monthly: { price: "$19", unit: "/month" },
    yearly: { price: "$190", unit: "/year", note: "2 months free" },
    features: [
      "Active profile & matching eligibility",
      "Full Training Academy access",
      "CPR/First Aid course discounts",
      "Verified-profile badge for families",
      "Direct recruiter support",
      "Priority placement consideration",
    ],
  },
};

/* ----------------------------------- Training --------------------------------- */

export const TRAINING_COURSES = [
  {
    title: "Infant/Child CPR & First Aid",
    duration: "1 day · Blended",
    level: "Required for matching",
    description:
      "Pediatric CPR, choking relief, AED use, anaphylaxis response, and home-emergency scenarios — with same-week certification.",
    icon: "heart",
  },
  {
    title: "Professional Nanny Foundations",
    duration: "4 weeks · Online",
    level: "EGN Certificate",
    description:
      "Contracts, communication, boundaries, child development milestones, and the professionalism standards NJ families expect.",
    icon: "award",
  },
  {
    title: "Newborn Care Specialist",
    duration: "2 weeks · Hybrid",
    level: "Specialist",
    description:
      "Feeding, soothing, sleep-shaping, multiples, preemies, and postpartum family support from experienced night nannies.",
    icon: "moon",
  },
  {
    title: "Positive Discipline in Practice",
    duration: "2 weeks · Online",
    level: "EGN Certificate",
    description:
      "Age-by-age guidance, tantrum response, sibling dynamics, and building cooperation without punishment or permissiveness.",
    icon: "smile",
  },
  {
    title: "Child Nutrition & Meal Prep",
    duration: "1 week · Online",
    level: "Enrichment",
    description:
      "Allergy-aware cooking, introducing solids, lunchbox systems, and family meal planning that kids actually eat.",
    icon: "salad",
  },
  {
    title: "Special Needs Awareness",
    duration: "2 weeks · Online",
    level: "Enrichment",
    description:
      "Inclusive care foundations: sensory needs, routines that reduce anxiety, communication tools, and family collaboration.",
    icon: "puzzle",
  },
];

/* --------------------------------- Navigation --------------------------------- */

export const NAV = {
  primary: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Training", href: "/training" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  ctas: [
    { label: "Find a Nanny", href: "/find-nanny", variant: "ember" as const },
    { label: "Become a Nanny", href: "/signup?role=nanny", variant: "outline-light" as const },
  ],
};

export const STATS = [
  { value: "500+", label: "Nannies and babysitters in our NJ network" },
  { value: "1,200+", label: "Families served across New Jersey" },
  { value: "90-day", label: "Replacement guarantee on placements" },
  { value: "100%", label: "CPR-certified nannies and babysitters, verified" },
];

export const TOWNS_MARQUEE = [
  "Branchburg",
  "Bridgewater",
  "Hillsborough",
  "Somerville",
  "Flemington",
  "Morristown",
  "Princeton",
  "Edison",
  "Clinton",
  "Mendham",
  "Bedminster",
  "Montgomery",
];
