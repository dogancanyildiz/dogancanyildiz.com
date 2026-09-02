// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { layoutUmamiTag } from "./umami-script";

const REAL_ORIGIN = "https://umami.dravcore.com";

describe("layoutUmamiTag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when the tracker is not configured", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    expect(layoutUmamiTag()).toBeNull();
  });

  it("returns the tag with website id and domains once configured", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", `${REAL_ORIGIN}/script.js`);
    vi.stubEnv("UMAMI_WEBSITE_ID", "site-123");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
    expect(layoutUmamiTag()).toEqual({
      src: `${REAL_ORIGIN}/script.js`,
      websiteId: "site-123",
      domains: "dogancanyildiz.com",
    });
  });

  it("stays silent in development when the script points at the wrong origin", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "https://example.com/script.js");
    vi.stubEnv("UMAMI_WEBSITE_ID", "site-123");
    vi.stubEnv("NODE_ENV", "development");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(layoutUmamiTag()).toBeNull();
    expect(error).toHaveBeenCalled();
  });
});
