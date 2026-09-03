import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CSP_REPORT_LIMITS,
  CSP_REPORTS_PER_REQUEST,
  isCspMeasurementEnabled,
} from "@/app/api/csp-report/mode";

type HeaderEntry = { key: string; value: string };

async function loadNextConfig(nodeEnv: "production" | "development") {
  vi.stubEnv("NODE_ENV", nodeEnv);
  const configModule = await import("../../next.config");
  return {
    nextConfig: configModule.default,
    UMAMI_ORIGIN: configModule.UMAMI_ORIGIN,
    CSP_REPORT_PATH: configModule.CSP_REPORT_PATH,
    CSP_REPORT_GROUP: configModule.CSP_REPORT_GROUP,
    cspReportEndpoint: configModule.cspReportEndpoint,
  };
}

type LoadedConfig = Awaited<ReturnType<typeof loadNextConfig>>;

async function headersFor(
  nextConfig: LoadedConfig["nextConfig"],
  source: string
): Promise<HeaderEntry[]> {
  const rules = await nextConfig.headers!();
  const rule = rules.find((entry) => entry.source === source);
  if (!rule) throw new Error(`No header rule for ${source}`);
  return rule.headers;
}

async function headerValue(
  nextConfig: LoadedConfig["nextConfig"],
  key: string
): Promise<string | undefined> {
  const headers = await headersFor(nextConfig, "/:path*");
  return headers.find((entry) => entry.key === key)?.value;
}

async function contentSecurityPolicy(
  nextConfig: LoadedConfig["nextConfig"]
): Promise<string> {
  const value = await headerValue(nextConfig, "Content-Security-Policy");
  if (!value) throw new Error("Content-Security-Policy header is not defined");
  return value;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("content security policy", () => {
  it("allows the umami origin in script-src", async () => {
    const { nextConfig, UMAMI_ORIGIN } = await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain(`script-src 'self' 'unsafe-inline' ${UMAMI_ORIGIN}`);
  });

  it("allows the umami origin in connect-src", async () => {
    const { nextConfig, UMAMI_ORIGIN } = await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain(`connect-src 'self' ${UMAMI_ORIGIN}`);
  });

  it("keeps the restrictive directives untouched", async () => {
    const { nextConfig } = await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("does not widen script-src with a wildcard", async () => {
    const { nextConfig } = await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).not.toContain("script-src 'self' *");
  });

  it("never ships unsafe-eval in production", async () => {
    const { nextConfig } = await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).not.toContain("'unsafe-eval'");
  });
});

describe("violation reporting", () => {
  it("points both reporting directives at the collector route", async () => {
    const { nextConfig, CSP_REPORT_GROUP, cspReportEndpoint } =
      await loadNextConfig("production");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain(`report-to ${CSP_REPORT_GROUP}`);
    expect(csp).toContain(`report-uri ${cspReportEndpoint()}`);
  });

  it("declares the reporting endpoint group with the same name", async () => {
    const { nextConfig, CSP_REPORT_GROUP, cspReportEndpoint } =
      await loadNextConfig("production");
    const value = await headerValue(nextConfig, "Reporting-Endpoints");
    expect(value).toBe(`${CSP_REPORT_GROUP}="${cspReportEndpoint()}"`);
  });

  it("resolves the endpoint against the site origin when it is known", async () => {
    const { cspReportEndpoint, CSP_REPORT_PATH } =
      await loadNextConfig("production");
    expect(cspReportEndpoint("https://dogancanyildiz.com/")).toBe(
      "https://dogancanyildiz.com/api/csp-report"
    );
    expect(cspReportEndpoint("")).toBe(CSP_REPORT_PATH);
    expect(cspReportEndpoint("not a url")).toBe(CSP_REPORT_PATH);
  });

  it("falls back to the relative path when the site origin is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { cspReportEndpoint, CSP_REPORT_PATH } =
      await loadNextConfig("production");
    expect(cspReportEndpoint()).toBe(CSP_REPORT_PATH);
  });

  it("ships a stricter report only policy that drops both unsafe-inline", async () => {
    vi.stubEnv("CSP_REPORT_ONLY", "1");
    const { nextConfig } = await loadNextConfig("production");
    const reportOnly = await headerValue(
      nextConfig,
      "Content-Security-Policy-Report-Only"
    );
    expect(reportOnly).toBeDefined();
    expect(reportOnly).not.toContain("'unsafe-inline'");
    expect(reportOnly).toContain("script-src 'self' https://");
    expect(reportOnly).toContain("style-src 'self'");
    expect(reportOnly).toContain("report-to");
  });

  it("leaves the report only policy off until the build opts in", async () => {
    const { nextConfig } = await loadNextConfig("production");
    const reportOnly = await headerValue(
      nextConfig,
      "Content-Security-Policy-Report-Only"
    );
    // Always on it would cost every visitor around twenty POSTs per page view
    // and exhaust the collector budget within two views, so the measurement is
    // a window the owner opens, not a permanent header.
    expect(reportOnly).toBeUndefined();
  });

  it("keeps the report only policy out of development", async () => {
    vi.stubEnv("CSP_REPORT_ONLY", "1");
    const { nextConfig } = await loadNextConfig("development");
    const reportOnly = await headerValue(
      nextConfig,
      "Content-Security-Policy-Report-Only"
    );
    expect(reportOnly).toBeUndefined();
  });

  it("keeps the enforced development policy permissive for hmr", async () => {
    const { nextConfig } = await loadNextConfig("development");
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' ws:");
  });
});

describe("measurement switch", () => {
  it("only reads an explicit 1", () => {
    expect(isCspMeasurementEnabled(undefined)).toBe(false);
    expect(isCspMeasurementEnabled("")).toBe(false);
    expect(isCspMeasurementEnabled("0")).toBe(false);
    expect(isCspMeasurementEnabled("true")).toBe(false);
    expect(isCspMeasurementEnabled(" 1 ")).toBe(true);
  });

  it("throttles the collector to the idle budget by default", async () => {
    const { CSP_REPORT_RATE_LIMIT } =
      await import("@/app/api/csp-report/report");
    expect(CSP_REPORT_RATE_LIMIT.limit).toBe(CSP_REPORT_LIMITS.idle);
  });

  it("raises the collector budget while the measurement window is open", async () => {
    vi.stubEnv("CSP_REPORT_ONLY", "1");
    const { CSP_REPORT_RATE_LIMIT } =
      await import("@/app/api/csp-report/report");
    expect(CSP_REPORT_RATE_LIMIT.limit).toBe(CSP_REPORT_LIMITS.measuring);
  });

  it("caps the reports per request at the idle batch size by default", async () => {
    const { MAX_REPORTS_PER_REQUEST } =
      await import("@/app/api/csp-report/report");
    expect(MAX_REPORTS_PER_REQUEST).toBe(CSP_REPORTS_PER_REQUEST.idle);
  });

  it("raises the reports per request cap with the request budget", async () => {
    // Raising the per client budget without raising this cap would let the
    // measurement accept the request and then drop most of the page view it
    // was opened to measure: one batch carries around twenty violations.
    vi.stubEnv("CSP_REPORT_ONLY", "1");
    const { MAX_REPORTS_PER_REQUEST } =
      await import("@/app/api/csp-report/report");
    expect(MAX_REPORTS_PER_REQUEST).toBe(CSP_REPORTS_PER_REQUEST.measuring);
    expect(MAX_REPORTS_PER_REQUEST).toBeGreaterThan(
      CSP_REPORTS_PER_REQUEST.idle
    );
  });

  it("keeps both budgets moving in the same direction", async () => {
    expect(CSP_REPORT_LIMITS.measuring).toBeGreaterThan(CSP_REPORT_LIMITS.idle);
    expect(CSP_REPORTS_PER_REQUEST.measuring).toBeGreaterThan(
      CSP_REPORTS_PER_REQUEST.idle
    );
  });
});
