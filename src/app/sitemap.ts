import type { MetadataRoute } from "next";

import { projects } from "@/data/projects";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      priority: 1,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/projects`,
      lastModified,
      priority: 0.9,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      priority: 0.6,
      changeFrequency: "yearly",
    },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...projectPages];
}
