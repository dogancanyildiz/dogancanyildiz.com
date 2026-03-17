import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), priority: 1, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), priority: 0.6, changeFrequency: "yearly" },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE_URL}/projects/${p.slug}`,
    lastModified: new Date(),
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...projectPages];
}
