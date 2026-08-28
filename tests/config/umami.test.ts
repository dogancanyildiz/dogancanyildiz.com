import { afterEach, describe, expect, it, vi } from "vitest";

import {
  UMAMI_ORIGIN,
  UmamiOriginMismatchError,
  resolveUmamiTag,
} from "@/lib/analytics";

const base = {
  scriptUrl: UMAMI_ORIGIN,
  websiteId: "b7c0d2ae-0000-4000-8000-000000000000",
  siteUrl: "https://dogancanyildiz.com",
  isProduction: true,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("umami tag", () => {
  it("builds the script url from the configured origin", () => {
    expect(resolveUmamiTag(base)).toEqual({
      src: `${UMAMI_ORIGIN}/script.js`,
      websiteId: base.websiteId,
      domains: "dogancanyildiz.com",
    });
  });

  it("tolerates a trailing slash on the configured url", () => {
    expect(
      resolveUmamiTag({ ...base, scriptUrl: `${UMAMI_ORIGIN}//` })?.src
    ).toBe(`${UMAMI_ORIGIN}/script.js`);
  });

  it("accepts the full tag url, the natural misreading of the variable name", () => {
    expect(
      resolveUmamiTag({ ...base, scriptUrl: `${UMAMI_ORIGIN}/script.js` })?.src
    ).toBe(`${UMAMI_ORIGIN}/script.js`);
  });

  it("rejects any other path on the allowed origin", () => {
    for (const scriptUrl of [
      `${UMAMI_ORIGIN}/umami`,
      `${UMAMI_ORIGIN}/umami/script.js`,
      `${UMAMI_ORIGIN}/script.js?v=2`,
    ]) {
      expect(() => resolveUmamiTag({ ...base, scriptUrl })).toThrow(
        UmamiOriginMismatchError
      );
    }
  });

  it("pins data-domains to the site hostname", () => {
    expect(
      resolveUmamiTag({ ...base, siteUrl: "https://staging.example.com" })
        ?.domains
    ).toBe("staging.example.com");
  });

  it("renders nothing when either value is missing", () => {
    expect(resolveUmamiTag({ ...base, scriptUrl: undefined })).toBeNull();
    expect(resolveUmamiTag({ ...base, websiteId: undefined })).toBeNull();
    expect(resolveUmamiTag({ ...base, scriptUrl: "   " })).toBeNull();
    expect(resolveUmamiTag({ ...base, websiteId: "   " })).toBeNull();
  });

  it("fails the production build when the origin is not the one the csp allows", () => {
    expect(() =>
      resolveUmamiTag({ ...base, scriptUrl: "https://analytics.example.com" })
    ).toThrow(UmamiOriginMismatchError);
    expect(() => resolveUmamiTag({ ...base, scriptUrl: "not a url" })).toThrow(
      UmamiOriginMismatchError
    );
  });

  it("rejects a look alike host that only shares the suffix", () => {
    expect(() =>
      resolveUmamiTag({
        ...base,
        scriptUrl: "https://analytics.dogancanyildiz.com.evil.test",
      })
    ).toThrow(UmamiOriginMismatchError);
  });

  it("rejects the plain http variant of the allowed host", () => {
    expect(() =>
      resolveUmamiTag({
        ...base,
        scriptUrl: "http://analytics.dogancanyildiz.com",
      })
    ).toThrow(UmamiOriginMismatchError);
  });

  it("only logs in development so next dev keeps running", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const tag = resolveUmamiTag({
      ...base,
      scriptUrl: "https://analytics.example.com",
      isProduction: false,
    });

    expect(tag).toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });

  it("omits data-domains when the site origin cannot be parsed", () => {
    expect(resolveUmamiTag({ ...base, siteUrl: "nonsense" })?.domains).toBe(
      undefined
    );
  });
});

describe("csp and tracker agreement", () => {
  it("shares one origin constant with next.config", async () => {
    const configModule = await import("../../next.config");
    expect(configModule.UMAMI_ORIGIN).toBe(UMAMI_ORIGIN);
  });
});
