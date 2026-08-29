import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("returns null and logs when GATUS_URL is not configured", async () => {
    vi.stubEnv("GATUS_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => okJson(statusesFixture));

    expect(await getSiteStatus()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const [line] = warn.mock.calls[0] as [string];
    const logged = JSON.parse(line);
    expect(logged.reason).toBe("gatus-url-unset");
    expect(logged.gatusHost).toBe("unset");
    warn.mockRestore();
  });

  it("keeps every warning on the shared log line shape", async () => {
    // src/lib/log.ts documents time, level and msg as the line contract: a
    // hand rolled JSON.stringify here dropped all three, so a Coolify filter
    // on level or a sort on time silently lost these lines.
    vi.stubEnv("GATUS_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => okJson(statusesFixture));

    await getSiteStatus();

    const [line] = warn.mock.calls[0] as [string];
    const logged = JSON.parse(line) as Record<string, unknown>;
    expect(logged.level).toBe("warn");
    expect(logged.msg).toBe("site status unavailable");
    expect(typeof logged.time).toBe("string");
    expect(new Date(String(logged.time)).toISOString()).toBe(logged.time);
    warn.mockRestore();
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
    expect(line).not.toContain("dogancanyildiz");
    warn.mockRestore();
  });

  it("scrubs the Gatus host out of an error message that embeds the request URL", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        // Some fetch wrappers (and DNS errors) put the full URL in the
        // message; the log must not carry it through unmasked.
        throw new Error(
          `request to ${GATUS_URL}/api/v1/endpoints/statuses?page=1&pageSize=20 failed`
        );
      })
    );

    expect(await getSiteStatus()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const [line] = warn.mock.calls[0] as [string];
    expect(line).not.toContain("dogancanyildiz");
    expect(line).not.toContain(GATUS_URL);
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

describe("server-only modules", () => {
  // status.ts read GATUS_URL and said "Server-only" in its docstring while
  // nothing enforced it: a "use client" component could have imported it and
  // the build would have stayed green. server-only is how the rest of the
  // repo states that contract (cv.ts, profile-image.ts, mdx-content.tsx).
  function collect(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) collect(full, out);
      else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
        out.push(full);
    }
    return out;
  }

  it("backs every server-only claim with the import that enforces it", () => {
    const offenders = collect(join(process.cwd(), "src")).filter((file) => {
      const body = readFileSync(file, "utf8");
      return (
        /\*\s*Server-only:/.test(body) && !body.includes('import "server-only"')
      );
    });
    expect(offenders).toEqual([]);
  });
});
