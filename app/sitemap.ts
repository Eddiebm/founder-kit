import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://myfounderkit.com";
  const articles = getAllArticles();

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    ...articles.map((a) => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
