import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STATUS_BEAT_LIMIT,
  STATUS_FETCH_TIMEOUT_MS,
  STATUS_REVALIDATE_SECONDS,
  buildSnapshot,
  getLiveStatus,
  parseBeatTime,
  parseStatusPageUrl,
  toBeatState,
} from "./status-page";

interface FetchNext {
  revalidate: number;
}

// The module logs a warning on every failure path, which is the point of
// those paths; the assertions below are about the return value, so the line
// is swallowed instead of printed 20 times in the run.
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function statusPagePayload(
  monitors: { id: number; name: string }[] = [
    { id: 1, name: "dogancanyildiz.com" },
  ]
) {
  return {
    config: { slug: "dogancanyildiz", title: "Doğan Can YILDIZ" },
    publicGroupList: [
      {
        id: 1,
        name: "Hizmetler",
        monitorList: monitors.map((monitor) => ({
          ...monitor,
          type: "keyword",
          sendUrl: 0,
        })),
      },
    ],
  };
}

function beat(index: number, status = 1, ping: number | null = 160) {
  const minute = String(index % 60).padStart(2, "0");
  const hour = String(9 + Math.floor(index / 60)).padStart(2, "0");
  return {
    status,
    time: `2026-09-03 ${hour}:${minute}:57.494`,
    msg: "keyword not found on the page",
    ping,
  };
}

function heartbeatPayload(
  beats: ReturnType<typeof beat>[] = [beat(0)],
  uptimeList: Record<string, number> = { "1_24": 0.9985 },
  key = "1"
) {
  return { heartbeatList: { [key]: beats }, uptimeList };
}

describe("parseStatusPageUrl", () => {
  it("splits a Kuma status page URL into origin and slug", () => {
    expect(
      parseStatusPageUrl("https://uptime.dravcore.com/status/dogancanyildiz")
    ).toEqual({
      origin: "https://uptime.dravcore.com",
      slug: "dogancanyildiz",
      href: "https://uptime.dravcore.com/status/dogancanyildiz",
    });
  });

  it("tolerates surrounding whitespace and a trailing slash", () => {
    expect(
      parseStatusPageUrl("  https://uptime.example.org/status/site/  ")?.slug
    ).toBe("site");
  });

  it.each([
    ["unset", undefined],
    ["empty", "   "],
    ["not a URL", "uptime.example.org/status/site"],
    ["plain http", "http://uptime.example.org/status/site"],
    ["no status segment", "https://uptime.example.org/site"],
    ["a bare origin", "https://uptime.example.org"],
    ["a deeper path", "https://uptime.example.org/status/site/extra"],
    [
      "a slug with a path traversal",
      "https://uptime.example.org/status/%2e%2e",
    ],
  ])("returns null for %s", (_label, value) => {
    expect(parseStatusPageUrl(value)).toBeNull();
  });
});

describe("parseBeatTime", () => {
  it("reads Kuma's space separated UTC instant", () => {
    expect(parseBeatTime("2026-09-03 09:33:57.494")).toBe(
      "2026-09-03T09:33:57.494Z"
    );
  });

  it("accepts a value without milliseconds", () => {
    expect(parseBeatTime("2026-09-03 09:33:57")).toBe(
      "2026-09-03T09:33:57.000Z"
    );
  });

  it("returns null for anything else", () => {
    expect(parseBeatTime("yesterday")).toBeNull();
    expect(parseBeatTime("2026-13-45 99:99:99")).toBeNull();
  });
});

describe("toBeatState", () => {
  it("maps Kuma's four documented codes", () => {
    expect(toBeatState(0)).toBe("down");
    expect(toBeatState(1)).toBe("up");
    expect(toBeatState(2)).toBe("pending");
    expect(toBeatState(3)).toBe("maintenance");
  });

  it("does not guess at a code it has never seen", () => {
    expect(toBeatState(7)).toBe("unknown");
    expect(toBeatState(-1)).toBe("unknown");
  });
});

describe("buildSnapshot", () => {
  it("reports the newest heartbeat as the current state", () => {
    const snapshot = buildSnapshot(
      statusPagePayload(),
      heartbeatPayload([beat(0, 1), beat(1, 1), beat(2, 0)])
    );

    expect(snapshot?.status).toBe("down");
    expect(snapshot?.monitorName).toBe("dogancanyildiz.com");
    expect(snapshot?.checkedAt).toBe("2026-09-03T09:02:57.494Z");
    expect(snapshot?.beats).toHaveLength(3);
  });

  it("keeps only the newest heartbeats", () => {
    const beats = Array.from({ length: 100 }, (_, index) => beat(index));
    const snapshot = buildSnapshot(
      statusPagePayload(),
      heartbeatPayload(beats)
    );

    expect(snapshot?.beats).toHaveLength(STATUS_BEAT_LIMIT);
    expect(snapshot?.beats[STATUS_BEAT_LIMIT - 1]?.time).toBe(
      "2026-09-03T10:39:57.494Z"
    );
  });

  it("never carries Kuma's operator written msg into the snapshot", () => {
    const snapshot = buildSnapshot(statusPagePayload(), heartbeatPayload());

    expect(JSON.stringify(snapshot)).not.toContain("keyword not found");
  });

  it("clamps the 24 hour uptime into 0..1 and rounds the ping", () => {
    const snapshot = buildSnapshot(
      statusPagePayload(),
      heartbeatPayload([beat(0, 1, 160.4)], { "1_24": 1.2 })
    );

    expect(snapshot?.uptime24).toBe(1);
    expect(snapshot?.beats[0]?.ping).toBe(160);
  });

  it("reports a null uptime when Kuma published no 24 hour figure", () => {
    const snapshot = buildSnapshot(
      statusPagePayload(),
      heartbeatPayload([beat(0)], {})
    );

    expect(snapshot?.uptime24).toBeNull();
  });

  it("prefers the monitor named after the site over the first one", () => {
    const snapshot = buildSnapshot(
      statusPagePayload([
        { id: 4, name: "mail.example.org" },
        { id: 1, name: "dogancanyildiz.com" },
      ]),
      heartbeatPayload([beat(0)], { "1_24": 1 })
    );

    expect(snapshot?.monitorName).toBe("dogancanyildiz.com");
  });

  it("falls back to the first monitor when none carries the site name", () => {
    const snapshot = buildSnapshot(
      statusPagePayload([{ id: 9, name: "mail.example.org" }]),
      heartbeatPayload([beat(0)], { "9_24": 0.5 }, "9")
    );

    expect(snapshot?.monitorName).toBe("mail.example.org");
    expect(snapshot?.uptime24).toBe(0.5);
  });

  it("drops heartbeats whose timestamp does not parse", () => {
    const snapshot = buildSnapshot(
      statusPagePayload(),
      heartbeatPayload([
        { status: 1, time: "not a time", msg: "", ping: 12 },
        beat(1),
      ])
    );

    expect(snapshot?.beats).toHaveLength(1);
  });

  it.each([
    ["a payload that is not an object", null, heartbeatPayload()],
    ["a missing monitor list", { publicGroupList: [{}] }, heartbeatPayload()],
    ["a group list with no monitors", { publicGroupList: [] }, {}],
    [
      "a heartbeat list keyed on another monitor",
      statusPagePayload(),
      heartbeatPayload([beat(0)], {}, "42"),
    ],
    ["an empty heartbeat list", statusPagePayload(), heartbeatPayload([])],
    [
      "a heartbeat with the wrong field types",
      statusPagePayload(),
      { heartbeatList: { "1": [{ status: "up", time: 5 }] } },
    ],
  ])("returns null for %s", (_label, page, heartbeat) => {
    expect(buildSnapshot(page, heartbeat)).toBeNull();
  });
});

describe("getLiveStatus", () => {
  const target = {
    origin: "https://uptime.example.org",
    slug: "site",
    href: "https://uptime.example.org/status/site",
  };

  it("does not touch the network without a Kuma shaped URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLiveStatus(null)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads both endpoints through the ISR cache with a timeout", async () => {
    // The init type is Next's extended RequestInit, the reason the assertions
    // below can look at `next.revalidate` at all.
    const fetchMock = vi.fn(
      async (url: string, init: { signal: AbortSignal; next: FetchNext }) => {
        void init;
        return {
          ok: true,
          status: 200,
          json: async () =>
            url.includes("/heartbeat/")
              ? heartbeatPayload()
              : statusPagePayload(),
        };
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const snapshot = await getLiveStatus(target);

    expect(snapshot?.status).toBe("up");
    expect(snapshot?.uptime24).toBe(0.9985);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://uptime.example.org/api/status-page/site",
      "https://uptime.example.org/api/status-page/heartbeat/site",
    ]);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.next.revalidate).toBe(STATUS_REVALIDATE_SECONDS);
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
    expect(STATUS_FETCH_TIMEOUT_MS).toBe(4000);
  });

  it("returns null and warns when an endpoint answers with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    );

    await expect(getLiveStatus(target)).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain(
      "status page fetch failed"
    );
  });

  it("returns null when the request times out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => {
        const error = new Error("The operation was aborted due to timeout");
        error.name = "TimeoutError";
        void init.signal;
        throw error;
      })
    );

    await expect(getLiveStatus(target)).resolves.toBeNull();
    expect(String(warn.mock.calls[0]?.[0])).toContain("TimeoutError");
  });

  it("returns null when the host is unreachable, so a build never fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      })
    );

    await expect(getLiveStatus(target)).resolves.toBeNull();
  });

  it("returns null and warns when the payload fails validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: true }),
      }))
    );

    await expect(getLiveStatus(target)).resolves.toBeNull();
    expect(String(warn.mock.calls[0]?.[0])).toContain(
      "status page payload rejected"
    );
  });
});
