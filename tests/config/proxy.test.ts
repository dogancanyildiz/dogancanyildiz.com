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
    for (const path of ["/api/health", "/icon.png", "/_next/static/chunk.js"]) {
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
      ["/blog", "/en/blog"],
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

  it("routes the old unprefixed detail URLs by the language of their slug", () => {
    // Owner decision (2026-09-02): an unprefixed legacy detail URL goes to
    // the locale its slug was written in, not blindly to /en.
    for (const [from, to] of [
      ["/blog/self-hosting-with-coolify", "/en/blog/self-hosting-with-coolify"],
      ["/blog/capt-sinavina-hazirlik", "/yazilar/capt-sinavina-hazirlik"],
      ["/blog/ccna-dan-web-guvenligine", "/yazilar/ccna-dan-web-guvenligine"],
      ["/projects/cargo-pilot", "/en/projects/cargo-pilot"],
      ["/projects/hubit", "/en/projects/hubit"],
      ["/projects/wikonya", "/en/projects/wikonya"],
      ["/projects/koklu-hukuk", "/en/projects/koklu-hukuk"],
      ["/projects/gpa-calculator", "/en/projects/gpa-calculator"],
      [
        "/projects/ticket-purchasing-system",
        "/en/projects/ticket-purchasing-system",
      ],
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

  it("moves the renamed English post slugs under the /en prefix", () => {
    for (const [from, to] of [
      [
        "/en/blog/capt-sinavina-hazirlik",
        "/en/blog/capt-preparation-in-a-docker-lab",
      ],
      [
        "/en/blog/ccna-dan-web-guvenligine",
        "/en/blog/from-ccna-to-web-security",
      ],
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

  it("moves the renamed Turkish project slugs on the unprefixed path", () => {
    for (const [from, to] of [
      ["/projeler/gpa-calculator", "/projeler/not-ortalamasi-hesaplayici"],
      [
        "/projeler/ticket-purchasing-system",
        "/projeler/bilet-satin-alma-sistemi",
      ],
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

  it("never 308s a canonical URL off its own address", () => {
    for (const path of [
      "/",
      "/hakkimda",
      "/projeler",
      "/iletisim",
      "/hizmetler",
      "/gizlilik",
      "/yazilar",
      "/yazilar/capt-sinavina-hazirlik",
      "/yazilar/ccna-dan-web-guvenligine",
      "/yazilar/coolify-ile-kendi-sunucumda",
      "/projeler/cargo-pilot",
      "/projeler/hubit",
      "/projeler/wikonya",
      "/projeler/koklu-hukuk",
      "/projeler/not-ortalamasi-hesaplayici",
      "/projeler/bilet-satin-alma-sistemi",
      "/en",
      "/en/about",
      "/en/projects",
      "/en/contact",
      "/en/services",
      "/en/privacy",
      "/en/blog",
      "/en/blog/self-hosting-with-coolify",
      "/en/blog/capt-preparation-in-a-docker-lab",
      "/en/blog/from-ccna-to-web-security",
      "/en/projects/cargo-pilot",
      "/en/projects/hubit",
      "/en/projects/wikonya",
      "/en/projects/koklu-hukuk",
      "/en/projects/gpa-calculator",
      "/en/projects/ticket-purchasing-system",
    ]) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${path}`)
      );
      expect(response.status, path).not.toBe(308);
    }
  });

  it("does not emit next-intl's own hreflang Link header", () => {
    // alternateLinks: false in src/i18n/routing.ts. With localized dynamic
    // templates the header would put the current slug into the other
    // locale's template and advertise a 404 as the alternate, contradicting
    // the hreflang set the page builds in its <head>.
    for (const path of ["/yazilar", "/hakkimda", "/en/blog"]) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${path}`)
      );
      expect(response.headers.get("link"), path).toBeNull();
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
      ["/tr/blog/capt-sinavina-hazirlik/", "/yazilar/capt-sinavina-hazirlik"],
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

  it("sends the old unprefixed project detail to the English canonical", () => {
    // Deliberate reversal of the pre-2026-09-02 rule. /projects/<slug> was
    // the Turkish detail address only because the detail template was not
    // localized; now that Turkish details live at /projeler/<tr-slug>, the
    // unprefixed English-shaped path belongs to the English page.
    const response = proxy(
      new NextRequest("https://dogancanyildiz.com/projects/hubit")
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://dogancanyildiz.com/en/projects/hubit"
    );
  });

  it("sends leftover /tr prefixes to the unprefixed Turkish canonical", () => {
    for (const [from, to] of [
      ["/tr", "/"],
      ["/tr/about", "/hakkimda"],
      ["/tr/contact", "/iletisim"],
      ["/tr/projects", "/projeler"],
      ["/tr/privacy", "/gizlilik"],
      ["/tr/blog", "/yazilar"],
      ["/tr/blog/capt-sinavina-hazirlik", "/yazilar/capt-sinavina-hazirlik"],
      [
        "/tr/blog/ccna-dan-web-guvenligine",
        "/yazilar/ccna-dan-web-guvenligine",
      ],
      [
        "/tr/blog/self-hosting-with-coolify",
        "/yazilar/coolify-ile-kendi-sunucumda",
      ],
      [
        "/tr/yazilar/self-hosting-with-coolify",
        "/yazilar/coolify-ile-kendi-sunucumda",
      ],
      ["/tr/projects/cargo-pilot", "/projeler/cargo-pilot"],
      ["/tr/projects/hubit", "/projeler/hubit"],
      ["/tr/projects/wikonya", "/projeler/wikonya"],
      ["/tr/projects/koklu-hukuk", "/projeler/koklu-hukuk"],
      ["/tr/projects/gpa-calculator", "/projeler/not-ortalamasi-hesaplayici"],
      [
        "/tr/projects/ticket-purchasing-system",
        "/projeler/bilet-satin-alma-sistemi",
      ],
      ["/tr/projeler/gpa-calculator", "/projeler/not-ortalamasi-hesaplayici"],
      [
        "/tr/projeler/ticket-purchasing-system",
        "/projeler/bilet-satin-alma-sistemi",
      ],
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

  it("keeps a /tr prefixed Turkish canonical to a single hop", () => {
    // The /tr table must never fall through to the unprefixed one: a
    // Turkish address stripped to /projects/gpa-calculator would land on
    // the English page instead of its own.
    for (const path of [
      "/tr/yazilar/capt-sinavina-hazirlik",
      "/tr/projeler/hubit",
      "/tr/hakkimda",
    ] as const) {
      const response = proxy(
        new NextRequest(`https://dogancanyildiz.com${path}`)
      );
      expect(response.status, path).toBe(308);
      expect(response.headers.get("location"), path).toBe(
        `https://dogancanyildiz.com${path.slice("/tr".length)}`
      );
    }
  });
});
