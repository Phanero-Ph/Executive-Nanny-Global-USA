import type { MetadataRoute } from "next";
import { BLOG_POSTS, SERVICES, SERVICE_AREAS } from "@/data/site";

const SITE_URL = "https://executiveglobalnannyusa.com";
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/services",
  "/training",
  "/blog",
  "/faqs",
  "/contact",
  "/pricing",
  "/service-areas",
  "/privacy-policy",
  "/terms-conditions",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));
  const servicePages = SERVICES.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
  }));
  const serviceAreaPages = SERVICE_AREAS.map((area) => ({
    url: `${SITE_URL}/service-areas/${area.slug}`,
  }));
  const articlePages = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
  }));

  return [...staticPages, ...servicePages, ...serviceAreaPages, ...articlePages];
}
