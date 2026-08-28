import { afterEach, describe, expect, it, vi } from "vitest";
import statusesFixture from "../fixtures/gatus-statuses.json";
import { getSiteStatus } from "@/lib/status";

const GATUS_URL = "https://status.dogancanyildiz.com";

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function okText(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

function mockFetch(handler: (url: string) => Response | Promise<Response>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => handler(String(input))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getSiteStatus", () => {
  it("returns exactly the four allowed fields for the public site endpoint", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const status = await getSiteStatus();

    expect(status).toEqual({
      name: "site",
      up: true,
      uptime24h: 99.93,
      lastCheck: "2026-08-27T09:14:00Z",
    });
    expect(Object.keys(status!).sort()).toEqual(["lastCheck", "name", "up", "uptime24h"]);
  });

  it("never leaks topology fields from the Gatus payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const serialized = JSON.stringify(await getSiteStatus()).toLowerCase();

    for (const forbidden of [
      "http",
      "url",
      "hostname",
      "group",
      "analytics",
      "dogancanyildiz",
      "8080",
      "averageresponsetime",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("ignores every endpoint other than the public site one", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const status = await getSiteStatus();

    expect(status?.name).toBe("site");
    expect(status?.uptime24h).not.toBe(98.77);
  });

  it("accepts a bare numeric uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okText("0.98765") : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(98.77);
  });

  it("accepts an already-percentage uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 99.5 }) : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(99.5);
  });

  it("falls back to the 24h uptime carried by the statuses payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? new Response("not found", { status: 404 })
        : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(99.93);
  });

  it("reports down when the last check failed", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const downFixture = {
      results: [
        {
          name: "site",
          group: "public",
          key: "public_site",
          url: "https://dogancanyildiz.com/api/health",
          uptime: { "24h": 0.5 },
          results: [
            {
              status: 502,
              hostname: "dogancanyildiz.com",
              errors: ["bad gateway"],
              success: false,
              timestamp: "2026-08-27T09:20:00Z",
            },
          ],
        },
      ],
    };
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.5 }) : okJson(downFixture),
    );

    const status = await getSiteStatus();

    expect(status?.up).toBe(false);
    expect(status?.lastCheck).toBe("2026-08-27T09:20:00Z");
  });

  it("returns null when GATUS_URL is not configured", async () => {
    vi.stubEnv("GATUS_URL", "");
    mockFetch(() => okJson(statusesFixture));

    expect(await getSiteStatus()).toBeNull();
  });

  it("returns null when Gatus is unreachable", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );

    expect(await getSiteStatus()).toBeNull();
  });

  it("returns null when the statuses payload does not match the schema", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.99 }) : okJson({ results: "nope" }),
    );

    expect(await getSiteStatus()).toBeNull();
  });
});
