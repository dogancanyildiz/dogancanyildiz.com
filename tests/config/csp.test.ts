import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("keeps the report only policy out of development", async () => {
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
