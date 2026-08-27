import { describe, expect, it } from "vitest";

import {
  DEV_FALLBACK_EMAIL,
  resolveRequiredEmail,
  resolveSiteUrl,
  resolveTrustCloudflare,
} from "./env";

describe("resolveSiteUrl", () => {
  it("returns the value untouched when it has no trailing slash", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.sh")).toBe(
      "https://dogancanyildiz.sh"
    );
  });

  it("strips trailing slashes so joined paths never double up", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.sh//")).toBe(
      "https://dogancanyildiz.sh"
    );
  });

  it("throws when the variable is missing", () => {
    expect(() => resolveSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("throws when the variable is blank", () => {
    expect(() => resolveSiteUrl("   ")).toThrow(/NEXT_PUBLIC_SITE_URL/);
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
