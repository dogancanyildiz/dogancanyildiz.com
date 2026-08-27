import { describe, expect, it } from "vitest";

import { UNKNOWN_IP, getClientIp, isIpAddress } from "./client-ip";

function headersOf(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("isIpAddress", () => {
  it("accepts ipv4", () => {
    expect(isIpAddress("203.0.113.9")).toBe(true);
  });

  it("accepts ipv6", () => {
    expect(isIpAddress("2001:db8::1")).toBe(true);
  });

  it("accepts an ipv4 mapped ipv6 address", () => {
    expect(isIpAddress("::ffff:203.0.113.9")).toBe(true);
  });

  it("rejects a colon only string", () => {
    expect(isIpAddress(":::")).toBe(false);
  });

  it("rejects octets above 255", () => {
    expect(isIpAddress("999.0.0.1")).toBe(false);
  });

  it("rejects arbitrary text", () => {
    expect(isIpAddress("not-an-ip")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses CF-Connecting-IP when cloudflare is trusted", () => {
    const headers = headersOf({
      "cf-connecting-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.4, 10.0.0.1",
    });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe("203.0.113.9");
  });

  it("ignores CF-Connecting-IP when cloudflare is not trusted", () => {
    const headers = headersOf({
      "cf-connecting-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.4, 10.0.0.1",
    });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe(
      "198.51.100.4"
    );
  });

  it("takes the first x-forwarded-for entry", () => {
    const headers = headersOf({
      "x-forwarded-for": " 198.51.100.4 , 10.0.0.1 ",
    });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe(
      "198.51.100.4"
    );
  });

  it("falls back to x-forwarded-for when a spoofed CF header is not an ip", () => {
    const headers = headersOf({
      "cf-connecting-ip": "not-an-ip",
      "x-forwarded-for": "198.51.100.4",
    });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe(
      "198.51.100.4"
    );
  });

  it("returns the unknown bucket when no usable header is present", () => {
    expect(getClientIp(headersOf({}), { trustCloudflare: true })).toBe(
      UNKNOWN_IP
    );
  });
});
