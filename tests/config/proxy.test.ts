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
      new NextRequest("https://dogancanyildiz.com/tr/hakkimda", {
        headers: { "x-pathname": "/hack" },
      })
    );

    // next-intl builds its response from the patched request, so the override
    // survives the i18n branch and arrives next to the locale it negotiated.
    expect(overriddenPathname(response)).toBe("/tr/hakkimda");
    expect(
      response.headers.get("x-middleware-request-x-next-intl-locale")
    ).toBe("tr");
  });
});
