import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/log", () => ({
  log: vi.fn(),
  describeError: (error: unknown) =>
    error instanceof Error ? error.name : String(error),
}));

const { getLatestRelease, parseLatestRelease } =
  await import("@/lib/release-info");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseLatestRelease", () => {
  it("strips the v prefix and keeps the release page url", () => {
    expect(
      parseLatestRelease({
        tag_name: "v0.8.0",
        html_url: "https://github.com/x/y/releases/tag/v0.8.0",
      })
    ).toEqual({
      version: "0.8.0",
      url: "https://github.com/x/y/releases/tag/v0.8.0",
    });
  });

  it("rejects tags that are not plain semver and malformed payloads", () => {
    expect(
      parseLatestRelease({ tag_name: "release-1", html_url: "https://a.b" })
    ).toBeNull();
    expect(parseLatestRelease({ tag_name: "v1.2.3" })).toBeNull();
    expect(parseLatestRelease("nope")).toBeNull();
  });
});

describe("getLatestRelease", () => {
  it("returns the parsed release on a 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          tag_name: "v0.8.0",
          html_url: "https://github.com/x/y/releases/tag/v0.8.0",
        }),
      }))
    );
    await expect(getLatestRelease()).resolves.toEqual({
      version: "0.8.0",
      url: "https://github.com/x/y/releases/tag/v0.8.0",
    });
  });

  it("returns null on an HTTP error or a thrown fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }))
    );
    await expect(getLatestRelease()).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      })
    );
    await expect(getLatestRelease()).resolves.toBeNull();
  });
});
