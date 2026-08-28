import { afterEach, describe, expect, it, vi } from "vitest";

async function loadNextConfig() {
  vi.stubEnv("NODE_ENV", "production");
  const configModule = await import("../../next.config");
  return {
    nextConfig: configModule.default,
    UMAMI_ORIGIN: configModule.UMAMI_ORIGIN,
  };
}

async function contentSecurityPolicy(
  nextConfig: Awaited<ReturnType<typeof loadNextConfig>>["nextConfig"],
): Promise<string> {
  const rules = await nextConfig.headers!();
  const header = rules[0].headers.find(
    (entry) => entry.key === "Content-Security-Policy",
  );
  if (!header) throw new Error("Content-Security-Policy header is not defined");
  return header.value;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("content security policy", () => {
  it("allows the umami origin in script-src", async () => {
    const { nextConfig, UMAMI_ORIGIN } = await loadNextConfig();
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain(`script-src 'self' 'unsafe-inline' ${UMAMI_ORIGIN}`);
  });

  it("allows the umami origin in connect-src", async () => {
    const { nextConfig, UMAMI_ORIGIN } = await loadNextConfig();
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain(`connect-src 'self' ${UMAMI_ORIGIN}`);
  });

  it("keeps the restrictive directives untouched", async () => {
    const { nextConfig } = await loadNextConfig();
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("does not widen script-src with a wildcard", async () => {
    const { nextConfig } = await loadNextConfig();
    const csp = await contentSecurityPolicy(nextConfig);
    expect(csp).not.toContain("script-src 'self' *");
  });
});
