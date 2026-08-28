import { afterEach, describe, expect, it, vi } from "vitest";

import { CONTACT_RATE_LIMIT, contactRateLimiter } from "@/lib/rate-limit";

import { POST } from "./route";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }) => {
    const messages: Record<string, Record<string, string>> = {
      api: {
        invalidRequest:
          "Invalid request. Name, email, and message are required.",
        emailNotConfigured: "Email is not configured on the server.",
        sendFailed: "The message could not be sent. Please try again later.",
        tooManyRequests:
          "Too many requests. Please try again in a few minutes.",
        bodyTooLarge: "Request body is too large.",
      },
    };
    return (key: string) => messages[namespace]?.[key] ?? key;
  }),
}));

function probe(): Request {
  // The shape the deploy checklist sends: a deliberately invalid body, so the
  // request consumes a rate limit slot without sending any mail.
  return new Request("https://dogancanyildiz.com/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.7",
    },
    body: "{}",
  });
}

describe("POST /api/contact rate limit probe", () => {
  afterEach(() => {
    contactRateLimiter.reset();
  });

  it("counts invalid bodies against the limit and then answers 429", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit + 1; i += 1) {
      statuses.push((await POST(probe())).status);
    }

    expect(statuses.slice(0, CONTACT_RATE_LIMIT.limit)).toEqual(
      Array<number>(CONTACT_RATE_LIMIT.limit).fill(400)
    );
    expect(statuses.at(-1)).toBe(429);
  });

  it("answers the 429 as json with a Retry-After header", async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit; i += 1) {
      await POST(probe());
    }
    const limited = await POST(probe());

    // Cloudflare's own block answers with an HTML page and no Retry-After,
    // which is how the checklist tells the two 429s apart.
    expect(limited.status).toBe(429);
    expect(limited.headers.get("content-type")).toMatch(/application\/json/);
    expect(limited.headers.get("retry-after")).not.toBeNull();
    expect(await limited.json()).toHaveProperty("error");
  });
});
