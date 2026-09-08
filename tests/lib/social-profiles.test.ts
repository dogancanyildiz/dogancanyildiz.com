import { describe, expect, it } from "vitest";
import { SOCIAL_PROFILE_GROUPS, SOCIAL_PROFILES } from "@/lib/site";
import { siteConfig } from "@/lib/site-config";

describe("SOCIAL_PROFILES", () => {
  it("is derived from sameAs, one row per social network, in display order", () => {
    const ids = SOCIAL_PROFILES.map((p) => p.id);
    // GitHub and LinkedIn are mandatory (SOCIAL throws without them); the
    // rest follow sameAs. The order is the About page's display order.
    expect(ids).toEqual([
      "linkedin",
      "github",
      "medium",
      "youtube",
      "x",
      "instagram",
      "threads",
      "tiktok",
    ]);
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

  it("puts every profile in one of the three display groups", () => {
    for (const profile of SOCIAL_PROFILES) {
      expect(SOCIAL_PROFILE_GROUPS).toContain(profile.group);
    }
    const byGroup = (g: string) =>
      SOCIAL_PROFILES.filter((p) => p.group === g).map((p) => p.id);
    expect(byGroup("professional")).toEqual(["linkedin", "github"]);
    expect(byGroup("content")).toEqual(["medium", "youtube"]);
    expect(byGroup("social")).toEqual(["x", "instagram", "threads", "tiktok"]);
  });
});
