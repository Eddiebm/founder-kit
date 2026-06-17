import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://myfounderkit.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/auth`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
