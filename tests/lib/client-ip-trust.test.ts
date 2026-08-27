import { describe, expect, it } from "vitest";
import { UNKNOWN_IP, getClientIp } from "@/lib/client-ip";
import { resolveTrustCloudflare } from "@/lib/env";

function headersOf(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("resolveTrustCloudflare", () => {
  it("defaults to false when the variable is unset", () => {
    expect(resolveTrustCloudflare(undefined)).toBe(false);
    expect(resolveTrustCloudflare("")).toBe(false);
  });

  it("only accepts the literal string true", () => {
    expect(resolveTrustCloudflare("true")).toBe(true);
    expect(resolveTrustCloudflare("TRUE")).toBe(true);
    expect(resolveTrustCloudflare(" true ")).toBe(true);
    expect(resolveTrustCloudflare("1")).toBe(false);
    expect(resolveTrustCloudflare("yes")).toBe(false);
  });
});

describe("CF-Connecting-IP trust gate", () => {
  const forged = headersOf({
    "CF-Connecting-IP": "203.0.113.9",
    "X-Forwarded-For": "198.51.100.4",
  });

  it("ignores a forged cloudflare header while Traefik does not trust it", () => {
    expect(getClientIp(forged, { trustCloudflare: false })).toBe(
      "198.51.100.4"
    );
  });

  it("uses the cloudflare header once Traefik trusts the edge ranges", () => {
    expect(getClientIp(forged, { trustCloudflare: true })).toBe("203.0.113.9");
  });

  it("never turns a non address into a rate limit key", () => {
    const junk = headersOf({
      "CF-Connecting-IP": "not-an-ip",
      "X-Forwarded-For": "also-not-an-ip",
    });
    expect(getClientIp(junk, { trustCloudflare: true })).toBe(UNKNOWN_IP);
  });

  it("keys on the last x-forwarded-for hop, the one the trusted proxy appended", () => {
    const chain = headersOf({
      "X-Forwarded-For": "198.51.100.4, 172.68.1.1, 10.0.0.4",
    });
    expect(getClientIp(chain, { trustCloudflare: false })).toBe("10.0.0.4");
  });

  it("does not let a client supplied x-forwarded-for prefix move the key", () => {
    const first = headersOf({ "X-Forwarded-For": "203.0.113.5, 172.68.1.1" });
    const second = headersOf({ "X-Forwarded-For": "203.0.113.6, 172.68.1.1" });
    expect(getClientIp(first, { trustCloudflare: false })).toBe(
      getClientIp(second, { trustCloudflare: false })
    );
  });
});
