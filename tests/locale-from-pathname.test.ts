import { describe, expect, it } from "vitest";
import {
  isLocalizedRoutePath,
  localeFromPathname,
} from "@/lib/locale-from-pathname";

describe("localeFromPathname", () => {
  it("maps /tr paths to tr", () => {
    expect(localeFromPathname("/tr")).toBe("tr");
    expect(localeFromPathname("/tr/about")).toBe("tr");
    expect(localeFromPathname("/tr/blog/nope")).toBe("tr");
  });

  it("maps everything else to en", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/about")).toBe("en");
    expect(localeFromPathname("/blog/nope")).toBe("en");
    expect(localeFromPathname("")).toBe("en");
  });
});

describe("isLocalizedRoutePath", () => {
  it("claims the root and every page path", () => {
    expect(isLocalizedRoutePath("/")).toBe(true);
    expect(isLocalizedRoutePath("/about")).toBe(true);
    expect(isLocalizedRoutePath("/blog/nope")).toBe(true);
  });

  it("claims every locale prefixed path, feed included", () => {
    expect(isLocalizedRoutePath("/en")).toBe(true);
    expect(isLocalizedRoutePath("/tr")).toBe(true);
    expect(isLocalizedRoutePath("/tr/blog/some-post")).toBe(true);
    expect(isLocalizedRoutePath("/en/feed.xml")).toBe(true);
    expect(isLocalizedRoutePath("/feed.xml")).toBe(true);
  });

  it("leaves route handlers and framework internals alone", () => {
    expect(isLocalizedRoutePath("/api")).toBe(false);
    expect(isLocalizedRoutePath("/api/contact")).toBe(false);
    expect(isLocalizedRoutePath("/api/csp-report")).toBe(false);
    expect(isLocalizedRoutePath("/_next/static/chunk.js")).toBe(false);
    expect(isLocalizedRoutePath("/_vercel/insights")).toBe(false);
  });

  it("leaves the app root metadata routes alone", () => {
    expect(isLocalizedRoutePath("/icon")).toBe(false);
    expect(isLocalizedRoutePath("/apple-icon")).toBe(false);
  });

  it("leaves files alone", () => {
    expect(isLocalizedRoutePath("/robots.txt")).toBe(false);
    expect(isLocalizedRoutePath("/favicon.ico")).toBe(false);
    expect(isLocalizedRoutePath("/cv/dogancanyildiz-cv.pdf")).toBe(false);
    expect(isLocalizedRoutePath("/fonts/og/geist-latin.woff")).toBe(false);
  });

  it("does not mistake a prefix for a segment boundary", () => {
    expect(isLocalizedRoutePath("/apifoo")).toBe(true);
    expect(isLocalizedRoutePath("/icons")).toBe(true);
    expect(isLocalizedRoutePath("/english")).toBe(true);
  });

  it("keeps a dotted directory from hiding a page path", () => {
    expect(isLocalizedRoutePath("/v1.0/about")).toBe(true);
  });
});
