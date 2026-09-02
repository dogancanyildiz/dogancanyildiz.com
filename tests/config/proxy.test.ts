import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import proxy from "@/proxy";

/**
 * The 404 language is picked from x-pathname (src/app/global-not-found.tsx), so
 * the value the app reads has to be the one the proxy wrote, never the one the
 * client sent. Reading the matcher out of the source only proves the function
 * is reachable on those paths; these cases call it.
 *
 * NextResponse.next({ request: { headers } }) does not mutate the incoming
 * request, it encodes the override on the response as x-middleware-request-*
 * plus the x-middleware-override-headers list, which is what Next replays onto
 * the request before it reaches the route.
 */
function overriddenPathname(response: Response): string | null {
  return response.headers.get("x-middleware-request-x-pathname");
}

describe("proxy x-pathname", () => {
  it("overwrites a forged header on a path the i18n middleware skips", () => {
    const response = proxy(
      new NextRequest("https://dogancanyildiz.com/nope.txt", {
        headers: { "x-pathname": "/tr/hack" },
      })
    );

    expect(overriddenPathname(response)).toBe("/nope.txt");
    expect(response.headers.get("x-middleware-override-headers")).toContain(
      "x-pathname"
    );
  });

  it("writes the header on a request that carries none", () => {
    const response = proxy(
      new NextRequest("https://dogancanyildiz.com/robots.txt")
    );

    expect(overriddenPathname(response)).toBe("/robots.txt");
  });

  it("writes the header on the reserved segments too", () => {
    for (const path of ["/api/health", "/icon", "/_next/static/chunk.js"]) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${path}`, {
          headers: { "x-pathname": "/tr/hack" },
        })
      );

      expect(overriddenPathname(response)).toBe(path);
    }
  });

  it("keeps the server value on the localized branch as well", () => {
    const response = proxy(
      new NextRequest("https://dogancanyildiz.com/hakkimda", {
        headers: { "x-pathname": "/hack" },
      })
    );

    // next-intl builds its response from the patched request, so the override
    // survives the i18n branch and arrives next to the locale it negotiated.
    expect(overriddenPathname(response)).toBe("/hakkimda");
    expect(
      response.headers.get("x-middleware-request-x-next-intl-locale")
    ).toBe("tr");
  });

  it("sends the old unprefixed English nav URLs to the prefixed English pages", () => {
    for (const [from, to] of [
      ["/about", "/en/about"],
      ["/projects", "/en/projects"],
      ["/contact", "/en/contact"],
      ["/privacy", "/en/privacy"],
    ] as const) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${from}?utm=1`)
      );
      expect(response.status, from).toBe(308);
      expect(response.headers.get("location")).toBe(
        `https://dogancanyildiz.com${to}?utm=1`
      );
    }
  });

  it("recognises the legacy URLs with a trailing slash", () => {
    // A trailing slash used to walk straight past the lookup table: /about/
    // reached next-intl, which read it as the English slug of the Turkish
    // about page and sent the old English ranking to /hakkimda.
    for (const [from, to] of [
      ["/about/", "/en/about"],
      ["/projects/", "/en/projects"],
      ["/tr/about/", "/hakkimda"],
      ["/tr/blog/capt-sinavina-hazirlik/", "/blog/capt-sinavina-hazirlik"],
      ["/tr/", "/"],
    ] as const) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${from}`)
      );
      expect(response.status, from).toBe(308);
      expect(response.headers.get("location"), from).toBe(
        `https://dogancanyildiz.com${to}`
      );
    }
  });

  it("leaves the site root alone", () => {
    const response = proxy(new NextRequest("https://dogancanyildiz.com/"));
    expect(response.status).not.toBe(308);
  });

  it("does not redirect a project detail off the Turkish canonical", () => {
    const response = proxy(
      new NextRequest("https://dogancanyildiz.com/projects/hubit")
    );
    expect(response.status).not.toBe(308);
  });

  it("sends leftover /tr prefixes to the unprefixed Turkish canonical", () => {
    for (const [from, to] of [
      ["/tr", "/"],
      ["/tr/about", "/hakkimda"],
      ["/tr/contact", "/iletisim"],
      ["/tr/projects", "/projeler"],
      ["/tr/privacy", "/gizlilik"],
      ["/tr/blog/capt-sinavina-hazirlik", "/blog/capt-sinavina-hazirlik"],
    ] as const) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${from}`)
      );
      expect(response.status, from).toBe(308);
      expect(response.headers.get("location")).toBe(
        `https://dogancanyildiz.com${to}`
      );
    }
  });
});
