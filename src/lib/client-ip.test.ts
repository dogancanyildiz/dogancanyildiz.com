import { describe, expect, it } from "vitest";

import {
  UNKNOWN_IP,
  getClientIp,
  isIpAddress,
  normalizeClientIp,
} from "./client-ip";

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
    expect(getClientIp(headers, { trustCloudflare: false })).toBe("10.0.0.1");
  });

  it("takes the last x-forwarded-for entry, the hop the trusted proxy appended", () => {
    const headers = headersOf({
      "x-forwarded-for": " 198.51.100.4 , 10.0.0.1 ",
    });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe("10.0.0.1");
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

  it("does not let a client supplied x-forwarded-for prefix change the key", () => {
    const first = headersOf({ "x-forwarded-for": "203.0.113.5, 203.0.113.4" });
    const second = headersOf({ "x-forwarded-for": "203.0.113.6, 203.0.113.4" });
    expect(getClientIp(first, { trustCloudflare: false })).toBe("203.0.113.4");
    expect(getClientIp(second, { trustCloudflare: false })).toBe("203.0.113.4");
  });

  it("returns the unknown bucket when the nearest hop is not an ip", () => {
    const headers = headersOf({ "x-forwarded-for": "203.0.113.5, garbage" });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe(UNKNOWN_IP);
  });

  it("falls back to the unknown bucket, not a forged value, when both the cloudflare header and every x-forwarded-for hop are junk", () => {
    const headers = headersOf({
      "cf-connecting-ip": "not-an-ip",
      "x-forwarded-for": "also-not-an-ip",
    });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe(UNKNOWN_IP);
  });

  it("gives one ipv6 visitor one key however the address is written", () => {
    const compressed = headersOf({ "x-forwarded-for": "2001:db8::1" });
    const expanded = headersOf({
      "x-forwarded-for": "2001:0DB8:0000:0000:0000:0000:0000:0001",
    });

    expect(getClientIp(expanded, { trustCloudflare: false })).toBe(
      getClientIp(compressed, { trustCloudflare: false })
    );
  });

  it("normalizes the cloudflare header the same way", () => {
    const headers = headersOf({ "cf-connecting-ip": "2001:0db8::0001" });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe(
      normalizeClientIp("2001:db8::1")
    );
  });

  it("strips the port a proxy may append to the nearest hop", () => {
    const ipv4 = headersOf({
      "x-forwarded-for": "198.51.100.4, 203.0.113.9:54321",
    });
    const ipv6 = headersOf({ "x-forwarded-for": "[2001:db8::1]:54321" });

    expect(getClientIp(ipv4, { trustCloudflare: false })).toBe("203.0.113.9");
    expect(getClientIp(ipv6, { trustCloudflare: false })).toBe(
      normalizeClientIp("2001:db8::1")
    );
  });
});

describe("normalizeClientIp", () => {
  it("leaves an ipv4 address as it is", () => {
    expect(normalizeClientIp("203.0.113.9")).toBe("203.0.113.9");
  });

  it("rejects anything that is not an address", () => {
    expect(normalizeClientIp("not-an-ip")).toBeNull();
    expect(normalizeClientIp("")).toBeNull();
    expect(normalizeClientIp("203.000.113.9")).toBeNull();
  });

  it("collapses an ipv6 address onto its /64 block", () => {
    // The smallest block an ISP hands to one subscriber. Without this a
    // visitor walks the host part and buys a fresh budget per request.
    expect(normalizeClientIp("2001:db8:1:2:3:4:5:6")).toBe(
      normalizeClientIp("2001:db8:1:2:ffff:ffff:ffff:ffff")
    );
    expect(normalizeClientIp("2001:db8:1:2::1")).toBe("2001:db8:1:2::/64");
  });

  it("keeps different /64 blocks apart", () => {
    expect(normalizeClientIp("2001:db8:1:2::1")).not.toBe(
      normalizeClientIp("2001:db8:1:3::1")
    );
  });

  it("drops the zone id so one interface is not two keys", () => {
    expect(normalizeClientIp("fe80::1%eth0")).toBe(
      normalizeClientIp("fe80::1")
    );
  });

  it("maps an ipv4 mapped ipv6 address onto the plain ipv4 key", () => {
    expect(normalizeClientIp("::ffff:203.0.113.9")).toBe("203.0.113.9");
    expect(normalizeClientIp("::FFFF:cb00:7109")).toBe("203.0.113.9");
  });
});
