import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadBuildInfo() {
  const mod = await import("@/lib/build-info");
  return mod.buildInfo;
}

describe("buildInfo", () => {
  it("carries the package version bundled at build time", async () => {
    const { buildInfo, commitUrl } = await import("@/lib/build-info");
    expect(buildInfo.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(commitUrl("abc1234")).toBe(
      "https://github.com/dogancanyildiz/dogancanyildiz.com/commit/abc1234"
    );
  });

  it("derives the year from NEXT_PUBLIC_BUILD_DATE", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_DATE", "2027-01-05T10:00:00+00:00");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "abc1234");

    const buildInfo = await loadBuildInfo();

    expect(buildInfo.year).toBe("2027");
    expect(buildInfo.date).toBe("2027-01-05T10:00:00+00:00");
  });

  it("falls back to an empty year when NEXT_PUBLIC_BUILD_DATE is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_DATE", "");

    const buildInfo = await loadBuildInfo();

    // Never `new Date().getFullYear()` here: this module ships in the client
    // bundle, so a runtime fallback would compute a different year in the
    // browser than the one baked into the static HTML once the calendar
    // year turns over, which is exactly the hydration mismatch this guards
    // against.
    expect(buildInfo.year).toBe("");
    expect(buildInfo.date).toBe("");
  });

  it("falls back to an empty year when NEXT_PUBLIC_BUILD_DATE cannot be read as a year", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_DATE", "not-a-date");

    const buildInfo = await loadBuildInfo();

    expect(buildInfo.year).toBe("");
  });

  it("no longer reads NEXT_PUBLIC_BUILD_YEAR", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_YEAR", "1999");
    vi.stubEnv("NEXT_PUBLIC_BUILD_DATE", "2027-03-09T00:00:00+00:00");

    const buildInfo = await loadBuildInfo();

    expect(buildInfo.year).toBe("2027");
  });

  it("prefers the build time sha over the runtime one", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "abc1234");
    vi.stubEnv("SOURCE_COMMIT", "8b20a2554d5f2b8b3fd9e0f7d2c1a4e6b9d0c3f1");

    const buildInfo = await loadBuildInfo();

    expect(buildInfo.sha).toBe("abc1234");
  });

  it("falls back to Coolify's runtime SOURCE_COMMIT", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
    vi.stubEnv("SOURCE_COMMIT", "8b20a2554d5f2b8b3fd9e0f7d2c1a4e6b9d0c3f1");

    const { buildInfo, formatBuildSha } = await import("@/lib/build-info");

    // Kept whole; formatBuildSha is the one place that shortens it.
    expect(buildInfo.sha).toBe("8b20a2554d5f2b8b3fd9e0f7d2c1a4e6b9d0c3f1");
    expect(formatBuildSha(buildInfo.sha)).toBe("8b20a25");
  });

  it("leaves the sha empty when neither variable is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
    vi.stubEnv("SOURCE_COMMIT", "");

    const buildInfo = await loadBuildInfo();

    expect(buildInfo.sha).toBe("");
  });
});

describe("resolveBuildSha", () => {
  it.each([
    ["a full sha", "8b20a2554d5f2b8b3fd9e0f7d2c1a4e6b9d0c3f1"],
    ["a short sha", "8b20a25"],
    ["surrounding whitespace", "  8b20a25  "],
    ["an uppercase sha", "8B20A25"],
  ])("accepts %s from SOURCE_COMMIT", async (_label, value) => {
    const { resolveBuildSha } = await import("@/lib/build-info");

    expect(resolveBuildSha("", value)).toBe(value.trim().toLowerCase());
  });

  it.each([
    ["unset", undefined],
    ["empty", "   "],
    ["too short", "8b20a2"],
    ["too long", "0".repeat(41)],
    ["a branch name", "refs/heads/dev"],
    ["prose", "unknown"],
  ])("ignores %s", async (_label, value) => {
    const { resolveBuildSha } = await import("@/lib/build-info");

    expect(resolveBuildSha(undefined, value)).toBe("");
  });
});
