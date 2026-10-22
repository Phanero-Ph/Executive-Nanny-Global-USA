import { SERVICES, BLOG_POSTS } from "./site";
import type { Faq, Testimonial } from "./site";

// Reference homepage copy, scoped here so other pages retain their content.
export const HOME_STATS = [
  { value: "20+", label: "Years of Experience" },
  { value: "500+", label: "Happy Families Served" },
  { value: "98%", label: "Placement Success Rate" },
  { value: "90%", label: "1-Year Retention Rate" },
];

export const HOME_SERVICES = SERVICES.map((service) => {
  if (service.slug === "babysitting") return {
    ...service,
    title: "Babysitting Services",
    description: "Professional, vetted babysitters available for planned childcare with flexible membership options. Basic: $59/month for 3 submissions; Standard: $89 for 5 submissions; Deluxe: $129 for 8 submissions; Premium: $200 for unlimited submissions. Families pay caregivers directly.",
    startingAt: "Memberships from $59/month",
  };
  if (service.slug === "full-time-nanny") return {
    ...service,
    description: "Long-term nanny placement service matching families with qualified caregivers for dedicated childcare. Personalized matching, a 90-day guarantee, and ongoing support.",
    startingAt: "Search fee + salary-based placement fee",
  };
  if (service.slug === "part-time-nanny") return {
    ...service,
    title: "Part-Time Nanny Placement",
    description: "Families looking for long-term placement usually need care for at least one year. Families pay the nanny directly. A separate search fee is due before the search starts, followed by a placement fee calculated from the agreed annual salary before work starts.",
    startingAt: "Search fee + salary-based placement fee",
  };
  if (service.slug === "backup-care") return {
    ...service,
    title: "Backup Care",
    description: "Emergency and last-minute childcare when you need it most, available with quick response times. Agency matching fees start at $25 for requests 5+ days in advance. Families pay caregivers directly.",
    startingAt: "Matching fees from $25/booking",
  };
  if (service.slug === "newborn-overnight") return {
    ...service,
    startingAt: "Personalized childcare",
  };
  return { ...service, startingAt: "Tailored childcare solutions" };
});

export const HOME_TESTIMONIALS: Testimonial[] = [
  { name: "Sarah Johnson", location: "Google review", role: "2 weeks ago", rating: 5, service: "Full-Time Nanny", quote: "Executive Global Nanny helped us find the perfect nanny for our two kids. The vetting process was thorough and we felt confident from day one. Our nanny is professional, caring, and the kids absolutely love her. Couldn't ask for a better experience!" },
  { name: "Michael Chen", location: "Google review", role: "1 month ago", rating: 5, service: "Backup Care", quote: "As a busy executive, I needed reliable backup care and EGN delivered beyond expectations. The babysitters are always punctual, well-trained, and my daughter is always excited when they come over. The membership has been worth every penny." },
  { name: "Jennifer Martinez", location: "Google review", role: "3 weeks ago", rating: 5, service: "Babysitting", quote: "We've been using their babysitting services for 6 months now and it's been fantastic. Every caregiver has been background checked and CPR certified. The online booking system makes it so easy to schedule, and the communication is always top-notch." },
  { name: "David Thompson", location: "Google review", role: "1 week ago", rating: 5, service: "Nanny Placement", quote: "After interviewing several agencies, we chose Executive Global Nanny and I'm so glad we did. They took the time to understand our family's needs and matched us with an incredible nanny. The 90-day guarantee gave us peace of mind during the transition." },
  { name: "Emily Rodriguez", location: "Google review", role: "2 months ago", rating: 5, service: "Nanny Placement", quote: "The best childcare decision we've made! Our nanny is like family now. EGN's ongoing support has been amazing - they check in regularly and are always available if we have questions. Highly recommend to any family looking for quality care." },
  { name: "Robert Williams", location: "Google review", role: "3 weeks ago", rating: 5, service: "Backup Care", quote: "I was skeptical at first, but Executive Global Nanny exceeded all expectations. The backup care service has been a lifesaver when our regular nanny was unavailable. Every substitute has been professional and great with our son. Five stars!" },
];

export const HOME_FAQS: Faq[] = [
  { q: "What is the difference between Babysitting Membership and Backup Care?", a: "Babysitting Membership is for planned, recurring childcare needs with monthly subscription benefits and priority booking. Backup Care is for unexpected or emergency care situations when you need last-minute childcare support.", category: "families" },
  { q: "How do you vet nannies?", a: "All our caregivers undergo mandatory background checks, CPR and First Aid certification verification, professional reference checks, and thorough interviews. We ensure every nanny meets our high standards before placement.", category: "safety" },
  { q: "Can I request the same sitter again?", a: "Yes, absolutely! We encourage families to build relationships with caregivers. Whenever possible, we will match you with the same sitter for future bookings based on availability.", category: "families" },
  { q: "How quickly can I book backup care?", a: "We typically provide backup care within a few hours of your request. For same-day emergencies, we do our best to accommodate your needs as quickly as possible.", category: "families" },
  { q: "Do you provide full-time nanny placements?", a: "Yes, we specialize in full-time and part-time nanny placements with comprehensive matching services, ongoing support, and a 90-day guarantee replacement period.", category: "families" },
  { q: "What areas do you serve?", a: "We serve families across New Jersey (NJ), including Central Jersey, North Jersey, and South Jersey. This includes Bergen, Hudson, Essex, Morris, Passaic, Middlesex, Monmouth, Somerset, Mercer, Burlington, and Gloucester counties.", category: "families" },
];

const REFERENCE_ARTICLES = [
  { title: "Mistakes families make when they hire a nanny", excerpt: "Urgent Need — 'I need someone urgently and it should not take long to find someone'. This is usually the..." },
  { title: "7 First Signs To Note In An Unprofessional Nanny", excerpt: "One of the first signs to watch for is inconsistent punctuality. A professional nanny should be reliable and..." },
  { title: "The Benefits of Hiring a Nanny: Why Families Trust Executive Global Nanny", excerpt: "One of the most significant advantages of hiring a nanny is the personalized attention your child receives. Unlike..." },
];
export const HOME_BLOG_POSTS = BLOG_POSTS.slice(0, 3).map((post, i) => ({
  ...post,
  ...REFERENCE_ARTICLES[i],
  href: "/blog",
  category: "Caregiving 101",
  date: "Stories, Insights, Tips",
  readTime: "Read More",
}));
