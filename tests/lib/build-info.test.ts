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
});
