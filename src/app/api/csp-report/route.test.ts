import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CSP_REPORT_RATE_LIMIT,
  MAX_REPORT_BYTES,
  type NormalizedReport,
  cspReportRateLimiter,
  isAcceptedContentType,
  normalizeReports,
} from "./report";
import { POST } from "./route";

/** First normalized report, failing loudly when the body produced none. */
function firstReport(body: unknown): NormalizedReport {
  const [report] = normalizeReports(body);
  if (!report) {
    throw new Error("normalizeReports returned no entries");
  }
  return report;
}

/** First console.warn argument, failing loudly when the spy never ran. */
function firstWarning(warn: { mock: { calls: unknown[][] } }): string {
  const call = warn.mock.calls[0];
  if (!call) {
    throw new Error("console.warn was not called");
  }
  return String(call[0]);
}

function post(
  body: unknown,
  {
    contentType = "application/csp-report",
    ip = "203.0.113.10",
    extraHeaders = {},
  }: {
    contentType?: string;
    ip?: string;
    extraHeaders?: Record<string, string>;
  } = {}
): Request {
  return new Request("https://dogancanyildiz.com/api/csp-report", {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-forwarded-for": ip,
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const violation = {
  "csp-report": {
    "document-uri": "https://dogancanyildiz.com/en",
    "effective-directive": "script-src-elem",
    "blocked-uri": "inline",
    disposition: "report",
    "source-file": "https://dogancanyildiz.com/en",
    "line-number": 12,
  },
};

beforeEach(() => {
  cspReportRateLimiter.reset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  cspReportRateLimiter.reset();
});

describe("POST /api/csp-report", () => {
  it("accepts a report-uri payload and answers 204 with no body", async () => {
    const response = await POST(post(violation));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("logs one json line per accepted report", async () => {
    const warn = vi.spyOn(console, "warn");
    await POST(post(violation));

    expect(warn).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(firstWarning(warn));

    expect(logged).toMatchObject({
      event: "csp-violation",
      directive: "script-src-elem",
      blockedUrl: "inline",
      documentUrl: "https://dogancanyildiz.com/en",
    });
  });

  it("accepts the reporting api batch format", async () => {
    const warn = vi.spyOn(console, "warn");
    const response = await POST(
      post(
        [
          {
            type: "csp-violation",
            url: "https://dogancanyildiz.com/tr",
            body: {
              documentURL: "https://dogancanyildiz.com/tr",
              effectiveDirective: "style-src-attr",
              blockedURL: "inline",
              disposition: "report",
            },
          },
          { type: "deprecation", body: { id: "ignored" } },
        ],
        { contentType: "application/reports+json" }
      )
    );

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(firstWarning(warn))).toMatchObject({
      directive: "style-src-attr",
    });
  });

  it("rejects a content type the browsers never send", async () => {
    const response = await POST(
      post(violation, { contentType: "application/json" })
    );
    expect(response.status).toBe(415);
  });

  it("rejects a declared body over the cap with 413", async () => {
    const response = await POST(
      post(violation, {
        extraHeaders: { "content-length": String(MAX_REPORT_BYTES + 1) },
      })
    );
    expect(response.status).toBe(413);
  });

  it("rejects an actual body over the cap with 413", async () => {
    const oversized = {
      "csp-report": {
        ...violation["csp-report"],
        "script-sample": "a".repeat(MAX_REPORT_BYTES + 1),
      },
    };
    const response = await POST(post(oversized));
    expect(response.status).toBe(413);
  });

  it("rejects malformed json with 400", async () => {
    const response = await POST(post("{not json"));
    expect(response.status).toBe(400);
  });

  it("rejects a well formed body that carries no violation with 400", async () => {
    const response = await POST(post({ hello: "world" }));
    expect(response.status).toBe(400);
  });

  it("rate limits a single ip and answers 429 with retry-after", async () => {
    for (let i = 0; i < CSP_REPORT_RATE_LIMIT.limit; i += 1) {
      const allowed = await POST(post(violation));
      expect(allowed.status).toBe(204);
    }

    const blocked = await POST(post(violation));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("keeps the limit per ip", async () => {
    for (let i = 0; i < CSP_REPORT_RATE_LIMIT.limit; i += 1) {
      await POST(post(violation, { ip: "203.0.113.10" }));
    }
    const other = await POST(post(violation, { ip: "203.0.113.11" }));
    expect(other.status).toBe(204);
  });
});

describe("report parsing", () => {
  it("truncates attacker controlled strings before they reach the log", () => {
    const report = firstReport({
      "csp-report": { "document-uri": "x".repeat(5000) },
    });

    expect(report.documentUrl.length).toBe(300);
  });

  it("drops non string and non finite fields", () => {
    const report = firstReport({
      "csp-report": {
        "document-uri": { nested: true },
        "line-number": Number.NaN,
      },
    });

    expect(report.documentUrl).toBe("");
    expect(report.lineNumber).toBeNull();
  });

  it("returns nothing for shapes that are not csp reports", () => {
    expect(normalizeReports(null)).toEqual([]);
    expect(normalizeReports("string")).toEqual([]);
    expect(normalizeReports([{ type: "deprecation", body: {} }])).toEqual([]);
  });

  it("ignores the charset parameter on the content type", () => {
    expect(isAcceptedContentType("application/csp-report; charset=utf-8")).toBe(
      true
    );
    expect(isAcceptedContentType("APPLICATION/REPORTS+JSON")).toBe(true);
    expect(isAcceptedContentType(null)).toBe(false);
  });
});
