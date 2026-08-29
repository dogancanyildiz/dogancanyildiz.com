import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HONEYPOT_FIELD, MAX_BODY_BYTES } from "@/lib/contact-validation";
import {
  CONTACT_RATE_LIMIT,
  UNKNOWN_RATE_LIMIT,
  contactRateLimiter,
} from "@/lib/rate-limit";

import { POST } from "./route";

const SITE_ORIGIN = "https://dogancanyildiz.com";

const messages = {
  api: {
    invalidRequest: "Invalid request. Name, email, and message are required.",
    emailNotConfigured: "Email is not configured on the server.",
    sendFailed: "The message could not be sent. Please try again later.",
    tooManyRequests: "Too many requests. Please try again in a few minutes.",
    bodyTooLarge: "Request body is too large.",
    unsupportedMediaType:
      "Unsupported content type. The contact form sends JSON.",
    forbiddenOrigin: "This request did not come from the contact form.",
    sendTimeout: "The mail service did not answer in time.",
  },
} satisfies Record<string, Record<string, string>>;

// Widened view for the translator stub, which is handed an arbitrary namespace.
const messageLookup: Record<string, Record<string, string> | undefined> =
  messages;

// The locale reaches the translator, so the mock records which one was asked
// for and answers with a marker the assertions can read back.
const requestedLocales: string[] = [];

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace, locale }) => {
    requestedLocales.push(locale);
    return (key: string) =>
      `${locale}:${messageLookup[namespace]?.[key] ?? key}`.replace(/^en:/, "");
  }),
}));

type SendPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo: string;
};

type SendResult = {
  data: { id: string } | null;
  error: { name: string; message: string } | null;
};

type SendOptions = { idempotencyKey?: string };

const send =
  vi.fn<(payload: SendPayload, options?: SendOptions) => Promise<SendResult>>();

/** The nth recorded send, failing loudly instead of reading past the end. */
function sendCall(index = 0): [SendPayload, (SendOptions | undefined)?] {
  const call = send.mock.calls[index];
  if (!call) {
    throw new Error(`resend send was not called ${index + 1} time(s)`);
  }
  return call;
}

vi.mock("@/lib/resend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/resend")>();
  return {
    ...actual,
    // The factory is hoisted above the `send` binding, so the stub reaches it
    // through a closure that only runs when the route calls it.
    resend: {
      emails: {
        send: (payload: SendPayload, options?: SendOptions) =>
          send(payload, options),
      },
    },
  };
});

const validPayload = {
  name: "Doğan Can",
  email: "visitor@mail.invalid",
  message: "I would like to talk about a project.",
};

type RequestOverrides = {
  headers?: Record<string, string | undefined>;
  body?: string;
  ip?: string;
};

function contactRequest(overrides: RequestOverrides = {}): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    origin: SITE_ORIGIN,
    "x-forwarded-for": overrides.ip ?? "203.0.113.7",
  };
  for (const [key, value] of Object.entries(overrides.headers ?? {})) {
    if (value === undefined) {
      delete headers[key];
    } else {
      headers[key] = value;
    }
  }

  return new Request(`${SITE_ORIGIN}/api/contact`, {
    method: "POST",
    headers,
    body: overrides.body ?? JSON.stringify(validPayload),
  });
}

/** The deploy checklist probe: a valid transport with a deliberately bad body. */
function probe(): Request {
  return contactRequest({ body: "{}" });
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.CONTACT_EMAIL = "me@mail.invalid";
  process.env.FROM_EMAIL = "site@mail.invalid";
  send.mockResolvedValue({ data: { id: "mail-id" }, error: null });
});

afterEach(() => {
  contactRateLimiter.reset();
  requestedLocales.length = 0;
  send.mockClear();
  vi.unstubAllEnvs();
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("POST /api/contact success path", () => {
  it("sends the message and answers ok", async () => {
    const response = await POST(contactRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("sets reply-to so the visitor can be answered from the mail client", () => {
    return POST(contactRequest()).then(() => {
      expect(sendCall()[0]).toMatchObject({
        replyTo: validPayload.email,
        to: "me@mail.invalid",
        from: "site@mail.invalid",
      });
    });
  });

  it("writes the sender as plain labelled lines, not as a mail header", async () => {
    await POST(contactRequest());
    const payload = sendCall()[0];

    expect(payload.text).toBe(
      `Name: ${validPayload.name}\nEmail: ${validPayload.email}\n\n${validPayload.message}`
    );
    expect(payload.text.startsWith("From:")).toBe(false);
    expect(payload.subject).toContain(validPayload.name);
  });

  it("carries a request id and the remaining budget", async () => {
    const response = await POST(contactRequest());

    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("x-ratelimit-limit")).toBe(
      String(CONTACT_RATE_LIMIT.limit)
    );
    expect(response.headers.get("x-ratelimit-remaining")).toBe(
      String(CONTACT_RATE_LIMIT.limit - 1)
    );
  });

  it("gives every request its own id", async () => {
    const first = await POST(contactRequest());
    const second = await POST(contactRequest());

    expect(first.headers.get("x-request-id")).not.toBe(
      second.headers.get("x-request-id")
    );
  });
});

describe("POST /api/contact rejections", () => {
  it("answers 415 when the body is not json", async () => {
    const response = await POST(
      contactRequest({ headers: { "content-type": "text/plain" } })
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: messages.api.unsupportedMediaType,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a json content type with a charset parameter", async () => {
    const response = await POST(
      contactRequest({
        headers: { "content-type": "application/json; charset=utf-8" },
      })
    );

    expect(response.status).toBe(200);
  });

  it("answers 403 when the origin is another site", async () => {
    const response = await POST(
      contactRequest({ headers: { origin: "https://evil.invalid" } })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: messages.api.forbiddenOrigin,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("answers 403 when there is no origin at all", async () => {
    // A browser always attaches Origin to a POST, so a missing header is a
    // scripted caller rather than the site's form.
    const response = await POST(
      contactRequest({ headers: { origin: undefined } })
    );

    expect(response.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("answers 413 on an oversized Content-Length", async () => {
    const response = await POST(
      contactRequest({
        headers: { "content-length": String(MAX_BODY_BYTES + 1) },
      })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: messages.api.bodyTooLarge,
    });
  });

  it("answers 413 when the streamed body passes the cap", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({
          ...validPayload,
          message: "m".repeat(MAX_BODY_BYTES + 10),
        }),
        headers: { "content-length": undefined },
      })
    );

    expect(response.status).toBe(413);
  });

  it("answers 400 with the field that failed", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({ ...validPayload, email: "not-an-address" }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: messages.api.invalidRequest,
      field: "email",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("answers 400 on malformed json without naming a field", async () => {
    const response = await POST(contactRequest({ body: "{not json" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: messages.api.invalidRequest,
    });
  });

  it("answers 400 when the payload carries an unknown field", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({ ...validPayload, subject: "Injected" }),
      })
    );

    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("refuses a name that carries a mail header break", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({
          ...validPayload,
          name: "Doğan\r\nBcc: victim@mail.invalid",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ field: "name" });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact honeypot", () => {
  it("looks like a success to the bot but sends nothing", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({
          ...validPayload,
          [HONEYPOT_FIELD]: "http://spam.invalid",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("logs the hit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await POST(
      contactRequest({
        body: JSON.stringify({
          ...validPayload,
          [HONEYPOT_FIELD]: "http://spam.invalid",
        }),
      })
    );

    expect(warn).toHaveBeenCalledTimes(1);
    const warned = warn.mock.calls[0];
    if (!warned) {
      throw new Error("console.warn was not called");
    }
    const line = JSON.parse(String(warned[0]));

    expect(line.msg).toContain("honeypot");
    expect(line.requestId).toEqual(expect.any(String));
  });

  it("passes an empty honeypot straight through", async () => {
    const response = await POST(
      contactRequest({
        body: JSON.stringify({ ...validPayload, [HONEYPOT_FIELD]: "" }),
      })
    );

    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("POST /api/contact mail failures", () => {
  it("answers 503 when the mail configuration is incomplete", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.CONTACT_EMAIL;

    const response = await POST(contactRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: messages.api.emailNotConfigured,
    });
  });

  it("answers 500 when the provider rejects the message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "visitor@mail.invalid" },
    });

    const response = await POST(contactRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: messages.api.sendFailed });
  });

  it("never writes the provider message into the log line", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "visitor@mail.invalid" },
    });

    await POST(contactRequest());

    const logged = error.mock.calls[0];
    if (!logged) {
      throw new Error("console.error was not called");
    }
    const line = String(logged[0]);

    expect(line).toContain("validation_error");
    expect(line).not.toContain("visitor@mail.invalid");
    expect(line).not.toContain(validPayload.message);
  });

  it("answers 504 when the provider does not respond in time", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockImplementation(() => new Promise(() => {}));

    const pending = POST(contactRequest());
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: messages.api.sendTimeout });
    vi.useRealTimers();
  });

  it("answers 500 when the send call throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockRejectedValue(new TypeError("fetch failed"));

    const response = await POST(contactRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: messages.api.sendFailed });
  });
});

describe("POST /api/contact rate limit", () => {
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

  it("answers the 429 as json with Retry-After and the budget headers", async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit; i += 1) {
      await POST(probe());
    }
    const limited = await POST(probe());

    // Cloudflare's own block answers with an HTML page and no Retry-After,
    // which is how the checklist tells the two 429s apart.
    expect(limited.status).toBe(429);
    expect(limited.headers.get("content-type")).toMatch(/application\/json/);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(limited.headers.get("x-ratelimit-limit")).toBe(
      String(CONTACT_RATE_LIMIT.limit)
    );
    expect(limited.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(await limited.json()).toHaveProperty("error");
  });

  it("does not spend a slot on a rejected content type", async () => {
    for (let i = 0; i < 20; i += 1) {
      await POST(contactRequest({ headers: { "content-type": "text/plain" } }));
    }

    expect((await POST(contactRequest())).status).toBe(200);
  });

  it("does not spend a slot on a refused origin", async () => {
    for (let i = 0; i < 20; i += 1) {
      await POST(
        contactRequest({ headers: { origin: "https://evil.invalid" } })
      );
    }

    expect((await POST(contactRequest())).status).toBe(200);
  });

  it("does not spend a slot on an oversized body", async () => {
    for (let i = 0; i < 20; i += 1) {
      await POST(
        contactRequest({
          headers: { "content-length": String(MAX_BODY_BYTES + 1) },
        })
      );
    }

    expect((await POST(contactRequest())).status).toBe(200);
  });

  it("gives the shared unknown key its own looser budget", async () => {
    const unresolvable = { "x-forwarded-for": undefined };
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit + 1; i += 1) {
      await POST(contactRequest({ headers: unresolvable, body: "{}" }));
    }

    // A visitor whose ip never resolves is not locked out after five tries.
    const next = await POST(contactRequest({ headers: unresolvable }));
    expect(next.status).toBe(200);
    expect(next.headers.get("x-ratelimit-limit")).toBe(
      String(UNKNOWN_RATE_LIMIT.limit)
    );
  });

  it("spends a slot on a body that never finishes", async () => {
    const ip = "203.0.113.44";
    const stalled = new Request(`${SITE_ORIGIN}/api/contact`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: SITE_ORIGIN,
        "x-forwarded-for": ip,
      },
      // A body that is opened and never closed. Node needs duplex for a
      // streamed request body.
      body: new ReadableStream<Uint8Array>({ start() {} }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    // The handler parks on the read and never answers, which is exactly the
    // shape that used to cost nothing: the slot has to be gone before the
    // body is read, not after.
    void POST(stalled);

    await vi.waitFor(() =>
      expect(contactRateLimiter.peek(ip).remaining).toBe(
        CONTACT_RATE_LIMIT.limit - 1
      )
    );
  });

  it("keeps separate ip budgets apart", async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit + 1; i += 1) {
      await POST(contactRequest({ ip: "203.0.113.7", body: "{}" }));
    }

    expect((await POST(contactRequest({ ip: "198.51.100.4" }))).status).toBe(
      200
    );
  });
});

describe("POST /api/contact idempotency", () => {
  // The send timeout only stops the handler waiting; the upstream request can
  // still deliver, so the retry the visitor is invited to make has to collapse
  // onto the same send at the provider.
  it("derives the key from the payload", async () => {
    await POST(contactRequest());

    expect(sendCall()[1]).toMatchObject({
      idempotencyKey: expect.stringMatching(/^contact-[0-9a-f]{32}$/),
    });
  });

  it("reuses the key for the same message and not for another", async () => {
    await POST(contactRequest());
    await POST(contactRequest({ ip: "198.51.100.4" }));
    await POST(
      contactRequest({
        ip: "198.51.100.5",
        body: JSON.stringify({
          ...validPayload,
          message: "A different message.",
        }),
      })
    );

    const keys = send.mock.calls.map((call) => call[1]?.idempotencyKey);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });
});

describe("POST /api/contact locale", () => {
  it("prefers the locale the form sends in X-Locale", async () => {
    await POST(contactRequest({ headers: { "x-locale": "tr" }, body: "{}" }));
    expect(requestedLocales).toEqual(["tr"]);
  });

  it("falls back to the /tr prefix of the referring page", async () => {
    await POST(
      contactRequest({
        headers: { referer: `${SITE_ORIGIN}/tr/contact` },
        body: "{}",
      })
    );
    expect(requestedLocales).toEqual(["tr"]);
  });

  it("ignores an English referer", async () => {
    await POST(
      contactRequest({
        headers: { referer: `${SITE_ORIGIN}/contact` },
        body: "{}",
      })
    );
    expect(requestedLocales).toEqual(["en"]);
  });

  it("reads Accept-Language by quality value, not by substring", async () => {
    await POST(
      contactRequest({
        headers: { "accept-language": "en-US,en;q=0.9,tr;q=0.1" },
        body: "{}",
      })
    );
    expect(requestedLocales).toEqual(["en"]);
  });

  it("answers Turkish when Turkish carries the highest quality value", async () => {
    await POST(
      contactRequest({
        headers: { "accept-language": "de;q=0.5,tr;q=0.9,en;q=0.8" },
        body: "{}",
      })
    );
    expect(requestedLocales).toEqual(["tr"]);
  });

  it("uses the same locale on every early rejection", async () => {
    const turkish = { "x-locale": "tr" };

    const unsupported = await POST(
      contactRequest({
        headers: { ...turkish, "content-type": "text/plain" },
      })
    );
    const forbidden = await POST(
      contactRequest({
        headers: { ...turkish, origin: "https://evil.invalid" },
      })
    );
    const tooLarge = await POST(
      contactRequest({
        headers: { ...turkish, "content-length": String(MAX_BODY_BYTES + 1) },
      })
    );

    for (const response of [unsupported, forbidden, tooLarge]) {
      const body = await response.json();
      expect(body.error.startsWith("tr:")).toBe(true);
    }
  });

  it("answers a 429 in the requested locale too", async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT.limit; i += 1) {
      await POST(probe());
    }
    const limited = await POST(
      contactRequest({ headers: { "x-locale": "tr" }, body: "{}" })
    );

    expect(limited.status).toBe(429);
    expect((await limited.json()).error.startsWith("tr:")).toBe(true);
  });
});
