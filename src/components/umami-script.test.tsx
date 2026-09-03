import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UmamiTracker, layoutUmamiTag } from "./umami-script";

const REAL_ORIGIN = "https://umami.dravcore.com";

/** Configures the tracker the way a production deployment does. */
function stubConfiguredTag() {
  vi.stubEnv("UMAMI_SCRIPT_URL", `${REAL_ORIGIN}/script.js`);
  vi.stubEnv("UMAMI_WEBSITE_ID", "site-123");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.dogancanyildiz.com");
}

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

describe("UmamiTracker", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the deferred tag with the website id and the domain pin", () => {
    stubConfiguredTag();
    vi.stubEnv("NODE_ENV", "production");

    const html = renderToStaticMarkup(<UmamiTracker />);

    expect(html).toContain(`src="${REAL_ORIGIN}/script.js"`);
    expect(html).toContain('data-website-id="site-123"');
    expect(html).toContain('data-domains="www.dogancanyildiz.com"');
    expect(html).toContain("defer");
  });

  it("renders nothing outside a production build", () => {
    stubConfiguredTag();
    vi.stubEnv("NODE_ENV", "development");

    expect(renderToStaticMarkup(<UmamiTracker />)).toBe("");
  });

  it("renders nothing when the deployment has no umami configured", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(renderToStaticMarkup(<UmamiTracker />)).toBe("");
  });

  it("loads without waiting on a stored choice", () => {
    // The banner and the dcy-consent key are gone (2026-09-03): the tag is
    // in the prerendered document, so nothing on the client gates it.
    stubConfiguredTag();
    vi.stubEnv("NODE_ENV", "production");

    expect(renderToStaticMarkup(<UmamiTracker />)).not.toBe("");
  });
});
