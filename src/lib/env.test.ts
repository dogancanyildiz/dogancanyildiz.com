import { describe, expect, it } from "vitest";

import {
  DEV_FALLBACK_EMAIL,
  resolveRequiredEmail,
  resolveSiteUrl,
  resolveTrustCloudflare,
} from "./env";

describe("resolveSiteUrl", () => {
  it("returns the value untouched when it has no trailing slash", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.com")).toBe(
      "https://dogancanyildiz.com"
    );
  });

  it("strips trailing slashes so joined paths never double up", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.com//")).toBe(
      "https://dogancanyildiz.com"
    );
  });

  it("throws when the variable is missing", () => {
    expect(() => resolveSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("throws when the variable is blank", () => {
    expect(() => resolveSiteUrl("   ")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("throws when the scheme is missing", () => {
    expect(() => resolveSiteUrl("dogancanyildiz.com")).toThrow(
      /not an absolute URL/
    );
  });

  it("throws for a scheme other than http or https", () => {
    expect(() => resolveSiteUrl("ftp://dogancanyildiz.com")).toThrow(
      /http or https/
    );
  });

  it("throws when a path is present", () => {
    expect(() => resolveSiteUrl("https://dogancanyildiz.com/blog")).toThrow(
      /without a path/
    );
  });

  it("accepts a local http origin with a port", () => {
    expect(resolveSiteUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000"
    );
  });
});

describe("resolveRequiredEmail", () => {
  it("returns the trimmed value when it is set", () => {
    expect(
      resolveRequiredEmail("CONTACT_EMAIL", " me@dogancanyildiz.com ", true)
    ).toBe("me@dogancanyildiz.com");
  });

  it("throws in production when the value is missing", () => {
    expect(() => resolveRequiredEmail("FROM_EMAIL", undefined, true)).toThrow(
      /FROM_EMAIL/
    );
  });

  it("falls back to the resend sandbox address outside production", () => {
    expect(resolveRequiredEmail("CONTACT_EMAIL", undefined, false)).toBe(
      DEV_FALLBACK_EMAIL
    );
  });
});

describe("resolveTrustCloudflare", () => {
  it("is enabled only for the literal string true", () => {
    expect(resolveTrustCloudflare("true")).toBe(true);
    expect(resolveTrustCloudflare("TRUE")).toBe(true);
  });

  it("is disabled for anything else", () => {
    expect(resolveTrustCloudflare(undefined)).toBe(false);
    expect(resolveTrustCloudflare("false")).toBe(false);
    expect(resolveTrustCloudflare("1")).toBe(false);
  });
});
