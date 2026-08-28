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

function mockFetch(
  handler: (url: string) => Response | Promise<Response>
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => handler(String(input)))
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
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.9993 })
        : okJson(statusesFixture)
    );

    const status = await getSiteStatus();

    expect(status).toEqual({
      name: "site",
      up: true,
      uptime24h: 99.93,
      lastCheck: "2026-08-27T09:14:00Z",
    });
    expect(Object.keys(status!).sort()).toEqual([
      "lastCheck",
      "name",
      "up",
      "uptime24h",
    ]);
  });

  it("never leaks topology fields from the Gatus payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.9993 })
        : okJson(statusesFixture)
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
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.9993 })
        : okJson(statusesFixture)
    );

    const status = await getSiteStatus();

    expect(status?.name).toBe("site");
    expect(status?.uptime24h).not.toBe(98.77);
  });

  it("accepts a bare numeric uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okText("0.98765") : okJson(statusesFixture)
    );

    expect((await getSiteStatus())?.uptime24h).toBe(98.77);
  });

  it("accepts an already-percentage uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 99.5 })
        : okJson(statusesFixture)
    );

    expect((await getSiteStatus())?.uptime24h).toBe(99.5);
  });

  it("falls back to the 24h uptime carried by the statuses payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? new Response("not found", { status: 404 })
        : okJson(statusesFixture)
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
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.5 })
        : okJson(downFixture)
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
      })
    );

    expect(await getSiteStatus()).toBeNull();
  });

  it("returns null when the statuses payload does not match the schema", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.99 })
        : okJson({ results: "nope" })
    );

    expect(await getSiteStatus()).toBeNull();
  });

  it("passes a bounded AbortSignal to every fetch so a hanging Gatus never blocks ISR", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const signals: (AbortSignal | undefined)[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown, init?: RequestInit) => {
        signals.push(init?.signal ?? undefined);
        return String(input).includes("/uptimes/24h")
          ? okJson({ uptime: 0.9993 })
          : okJson(statusesFixture);
      })
    );

    await getSiteStatus();

    expect(signals).toHaveLength(2);
    for (const signal of signals) {
      expect(signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("still returns up/lastCheck when only the uptime request fails", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch((url) => {
      if (url.includes("/uptimes/24h")) throw new Error("ECONNRESET");
      return okJson(statusesFixture);
    });

    const status = await getSiteStatus();

    expect(status?.up).toBe(true);
    expect(status?.lastCheck).toBe("2026-08-27T09:14:00Z");
    expect(status?.uptime24h).toBe(99.93);
    expect(warn).toHaveBeenCalledTimes(1);
    const [line] = warn.mock.calls[0] as [string];
    const logged = JSON.parse(line);
    expect(logged.reason).toBe("uptime-fetch-failed");
    expect(logged.gatusHost).not.toContain("dogancanyildiz");
    warn.mockRestore();
  });

  it("logs a single masked-host warning when the statuses request rejects", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );

    expect(await getSiteStatus()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const [line] = warn.mock.calls[0] as [string];
    const logged = JSON.parse(line);
    expect(logged.scope).toBe("status");
    expect(logged.reason).toBe("statuses-fetch-failed");
    expect(typeof logged.gatusHost).toBe("string");
    expect(logged.gatusHost).not.toBe(GATUS_URL);
    expect(logged.gatusHost).not.toContain("dogancanyildiz");
    warn.mockRestore();
  });

  it("returns a null lastCheck instead of an unparsable timestamp", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badTimestampFixture = {
      results: [
        {
          name: "site",
          group: "public",
          key: "public_site",
          url: "https://dogancanyildiz.com/api/health",
          uptime: { "24h": 0.9993 },
          results: [
            {
              status: 200,
              success: true,
              timestamp: "not-a-date",
            },
          ],
        },
      ],
    };
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? okJson({ uptime: 0.9993 })
        : okJson(badTimestampFixture)
    );

    const status = await getSiteStatus();

    expect(status?.up).toBe(true);
    expect(status?.lastCheck).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
