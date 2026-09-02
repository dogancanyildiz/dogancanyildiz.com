import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Locks the response headers next.config.ts emits.
 *
 * The headers are the only layer that currently ships HSTS and the framing and
 * isolation policy, so a silent regression here is invisible until someone
 * scans the live site. The assertions read the real config module, not a copy
 * of the values.
 */

type HeaderEntry = { key: string; value: string };

async function loadHeaders(nodeEnv: "production" | "development") {
  vi.stubEnv("NODE_ENV", nodeEnv);
  const { default: nextConfig } = await import("../../next.config");
  const rules = await nextConfig.headers!();
  return {
    rules,
    forSource(source: string): HeaderEntry[] {
      const rule = rules.find((entry) => entry.source === source);
      if (!rule) throw new Error(`No header rule for ${source}`);
      return rule.headers;
    },
  };
}

function value(headers: HeaderEntry[], key: string): string | undefined {
  return headers.find((entry) => entry.key === key)?.value;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("static security headers", () => {
  it("sets the baseline headers on every path", async () => {
    const { forSource } = await loadHeaders("production");
    const headers = forSource("/:path*");

    expect(value(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(value(headers, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(value(headers, "X-Frame-Options")).toBe("DENY");
    expect(value(headers, "Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(value(headers, "Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("denies every powerful feature in permissions-policy", async () => {
    const { forSource } = await loadHeaders("production");
    const policy = value(forSource("/:path*"), "Permissions-Policy") ?? "";

    for (const feature of [
      "camera",
      "microphone",
      "geolocation",
      "payment",
      "usb",
      "serial",
      "midi",
      "display-capture",
      "browsing-topics",
      "interest-cohort",
    ]) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it("locks the csp directives that stop framing and plugins", async () => {
    const { forSource } = await loadHeaders("production");
    const csp = value(forSource("/:path*"), "Content-Security-Policy") ?? "";

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
  });
});

describe("strict transport security", () => {
  it("sends a one year hsts without preload in production", async () => {
    const { forSource } = await loadHeaders("production");
    const hsts = value(forSource("/:path*"), "Strict-Transport-Security");

    expect(hsts).toBe("max-age=31536000; includeSubDomains");
    expect(hsts).not.toContain("preload");
  });

  it("stays out of development so plain http localhost keeps working", async () => {
    const { forSource } = await loadHeaders("development");
    expect(value(forSource("/:path*"), "Strict-Transport-Security")).toBe(
      undefined
    );
  });
});

describe("asset caching", () => {
  it("caches the cv and the vendored og fonts for a day", async () => {
    const { forSource } = await loadHeaders("production");

    for (const source of ["/cv/:path*", "/fonts/:path*"]) {
      expect(value(forSource(source), "Cache-Control")).toBe(
        "public, max-age=86400"
      );
    }
  });

  it("never marks an unhashed asset immutable", async () => {
    const { rules } = await loadHeaders("production");
    const cacheValues = rules
      .flatMap((rule) => rule.headers)
      .filter((header) => header.key === "Cache-Control")
      .map((header) => header.value);

    expect(cacheValues.length).toBeGreaterThan(0);
    for (const cacheValue of cacheValues) {
      expect(cacheValue).not.toContain("immutable");
    }
  });

  it("caches the static icon files for a day", async () => {
    const { forSource } = await loadHeaders("production");

    for (const source of ["/favicon.ico", "/icon.png", "/apple-icon.png"]) {
      expect(value(forSource(source), "Cache-Control")).toBe(
        "public, max-age=86400"
      );
    }
  });
});

describe("cv indexing", () => {
  it("keeps the cv out of the search index", async () => {
    const { forSource } = await loadHeaders("production");
    expect(value(forSource("/cv/:path*"), "X-Robots-Tag")).toBe(
      "noindex, nofollow"
    );
  });
});
