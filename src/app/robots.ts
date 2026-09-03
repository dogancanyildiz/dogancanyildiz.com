import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();

  // One rule for every crawler: the whole site is open except /api/. The AI
  // answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, and the rest)
  // fall under "*" and are left free on purpose. This is a GEO decision, not
  // an oversight: being quotable in an AI answer is worth more here than the
  // pages it would cost to block them, and there is nothing on the site to
  // withhold from a model that a search index may already read. Revisit the
  // day that trade changes; until then add no bot-specific Disallow.
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
