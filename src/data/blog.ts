import { BLOG_POSTS } from "./site";

const FACEBOOK = "https://www.facebook.com/executiveglobalnanny";
const INSTAGRAM = "https://www.instagram.com/executiveglobalnannyusa/";

const REFERENCE_POSTS = [
  {
    title: "Replacing Screen Time with Activities",
    excerpt: "Replacing screen time with activities from 9 months or when the child starts crawling should be easier. Plan for activities that encourage sensory exploration, fine and gross motor development, and cognitive growth.",
    category: "Childcare", date: "Nov 22, 2025", readTime: "5 min read", href: FACEBOOK, featured: true,
  },
  {
    title: "Parenting as a Team",
    excerpt: "Parenting becomes so much easier when both caregivers learn how to work as a team. Instead of stepping in suddenly or correcting each other in front of the child, create a simple system that helps you know when the other person needs support.",
    category: "Parenting", date: "Nov 21, 2025", readTime: "4 min read", href: FACEBOOK, featured: true,
  },
  {
    title: "Tips for Working with Children of Different Ages",
    excerpt: "Creating harmony in a home with children of different ages starts with structure, empathy, and age-appropriate expectations. We equip nannies with the skills to manage multi-age homes confidently.",
    category: "Childcare", date: "Nov 19", readTime: "6 min read", href: INSTAGRAM,
  },
  {
    title: "Building Confidence in Children",
    excerpt: "As we begin a new week, choose encouragement over criticism. Celebrate effort, correct gently, and create an environment where children feel confident and supported.",
    category: "Parenting", date: "Nov 17", readTime: "4 min read", href: INSTAGRAM,
  },
  {
    title: "Thank You for 1K Followers",
    excerpt: "Your support means everything to us at Executive Global Nanny. Every follow, share, and message strengthens our mission to connect families with trusted, well-trained childcare professionals across the globe.",
    category: "Community", date: "Nov 15", readTime: "2 min read", href: FACEBOOK,
  },
  {
    title: "Teaching Children Boundaries and Respect",
    excerpt: "When a child takes something from someone's house, it's not something to overlook. It's important to set clear boundaries and teach children respect for other people's spaces and belongings.",
    category: "Parenting", date: "Nov 14", readTime: "5 min read", href: FACEBOOK,
  },
  {
    title: "The First 5 Years of Child Development",
    excerpt: "The first five years of a child's life lay the foundation for who they become. During this crucial stage, children's brains grow faster than at any other time. Give your child the best start in life.",
    category: "Education", date: "Nov 13", readTime: "7 min read", href: INSTAGRAM,
  },
  {
    title: "Transitioning from Live-In to Live-Out Nanny",
    excerpt: "Shifting from a live-in to a live-out nanny role involves more than relocating. It's about adjusting your work-life balance, communication routines, and professional boundaries.",
    category: "Careers", date: "Nov 12", readTime: "6 min read", href: INSTAGRAM,
  },
  {
    title: "7 Things You Should Know About Working as a Nanny with Us",
    excerpt: "Have you ever considered a career as an Executive Global Nanny? If you believe this exciting and prestigious profession is the right path for you, here are 7 important things you should know to help you succeed.",
    category: "Careers", date: "Jan 28", readTime: "8 min read", href: INSTAGRAM,
  },
];

// Retain the application's existing photography and scope copy to the Blog index.
export const BLOG_PAGE_POSTS = REFERENCE_POSTS.map((post, i) => ({
  ...post,
  featured: "featured" in post && post.featured === true,
  image: BLOG_POSTS[i % BLOG_POSTS.length].image,
  author: "Executive Global Nanny",
}));
