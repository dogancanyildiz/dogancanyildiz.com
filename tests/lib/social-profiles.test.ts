import { describe, expect, it } from "vitest";
import { SOCIAL_PROFILES } from "@/lib/site";
import { siteConfig } from "@/lib/site-config";

describe("SOCIAL_PROFILES", () => {
  it("is derived from sameAs, one row per social network, in display order", () => {
    const ids = SOCIAL_PROFILES.map((p) => p.id);
    // GitHub and LinkedIn are mandatory (SOCIAL throws without them); the
    // rest follow sameAs. The order is the About page's display order.
    expect(ids.slice(0, 2)).toEqual(["github", "linkedin"]);
    for (const profile of SOCIAL_PROFILES) {
      expect(siteConfig.person.sameAs).toContain(profile.url);
      expect(() => new URL(profile.url)).not.toThrow();
    }
  });

  it("leaves Credly out: an identity url for credentials, not a profile to follow", () => {
    // Hostname, not a substring: CodeQL js/incomplete-url-substring-sanitization.
    const hosts = SOCIAL_PROFILES.map((p) => new URL(p.url).hostname);
    expect(hosts).not.toContain("www.credly.com");
    expect(hosts).not.toContain("credly.com");
  });

  it("has no duplicate networks", () => {
    const ids = SOCIAL_PROFILES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
