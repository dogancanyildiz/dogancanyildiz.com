// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { UmamiScript } from "./umami-script";

const REAL_ORIGIN = "https://analytics.dogancanyildiz.com";

// A <script async src> React 19 treats as a hoistable resource: it never
// lands under the render container, it lands in document.head instead
// (deduped by src), so every assertion here reads the head rather than the
// container RTL hands back.
function trackerScript(): HTMLScriptElement | null {
  return document.head.querySelector(`script[src^="${REAL_ORIGIN}"]`);
}

describe("UmamiScript", () => {
  it("renders nothing when the tracker is not configured", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "");
    vi.stubEnv("UMAMI_WEBSITE_ID", "");
    const { container } = render(<UmamiScript />);
    expect(container).toBeEmptyDOMElement();
    expect(trackerScript()).toBeNull();
  });

  it("prints the tag with data-website-id and data-domains once configured", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", `${REAL_ORIGIN}/script.js`);
    vi.stubEnv("UMAMI_WEBSITE_ID", "site-123");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
    render(<UmamiScript />);
    const script = trackerScript();
    expect(script).not.toBeNull();
    expect(script).toHaveAttribute("src", `${REAL_ORIGIN}/script.js`);
    expect(script).toHaveAttribute("data-website-id", "site-123");
    expect(script).toHaveAttribute("data-domains", "dogancanyildiz.com");
  });

  it("stays silent in development when the script points at the wrong origin, instead of throwing", () => {
    vi.stubEnv("UMAMI_SCRIPT_URL", "https://example.com/script.js");
    vi.stubEnv("UMAMI_WEBSITE_ID", "site-123");
    vi.stubEnv("NODE_ENV", "development");
    const { container } = render(<UmamiScript />);
    expect(container).toBeEmptyDOMElement();
    expect(
      document.head.querySelector('script[src^="https://example.com"]')
    ).toBeNull();
  });
});
