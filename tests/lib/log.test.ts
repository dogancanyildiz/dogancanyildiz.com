import { afterEach, describe, expect, it, vi } from "vitest";

import { describeError, formatLogLine, log } from "@/lib/log";

describe("formatLogLine", () => {
  it("emits a single json object with the fixed envelope first", () => {
    const line = formatLogLine(
      "info",
      "contact message accepted",
      { requestId: "abc", route: "/api/contact" },
      "2026-08-28T00:00:00.000Z"
    );

    expect(line).toBe(
      '{"time":"2026-08-28T00:00:00.000Z","level":"info","msg":"contact message accepted","requestId":"abc","route":"/api/contact"}'
    );
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({ level: "info", requestId: "abc" });
  });

  it("drops undefined fields instead of writing nulls", () => {
    const line = formatLogLine("warn", "m", { a: undefined, b: null }, "t");
    expect(JSON.parse(line)).toEqual({
      time: "t",
      level: "warn",
      msg: "m",
      b: null,
    });
  });

  it("never lets a field overwrite the envelope", () => {
    const line = formatLogLine(
      "error",
      "real message",
      { level: "info", msg: "spoofed", time: "spoofed" },
      "t"
    );
    expect(JSON.parse(line)).toEqual({
      time: "t",
      level: "error",
      msg: "real message",
    });
  });
});

describe("log", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes each level to the matching console channel", () => {
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    log("info", "a");
    log("warn", "b");
    log("error", "c");

    expect(info).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    const logged = error.mock.calls[0];
    if (!logged) throw new Error("console.error was not called");
    expect(JSON.parse(String(logged[0]))).toMatchObject({
      level: "error",
      msg: "c",
    });
  });
});

describe("describeError", () => {
  it("keeps the error name and never the message", () => {
    expect(describeError(new TypeError("visitor@example.invalid"))).toBe(
      "TypeError"
    );
  });

  it("falls back to a constant for non error values", () => {
    expect(describeError({ secret: true })).toBe("UnknownError");
  });

  it("labels a thrown string with its type instead of echoing it", () => {
    expect(describeError("boom")).toBe("String/boom");
    expect(describeError("   ")).toBe("String");
  });

  it("collapses a thrown string onto one bounded line", () => {
    // A thrown string can be assembled out of visitor input, so it gets the
    // same treatment the Error branch gives a code: bounded, and never able
    // to spread a payload across the log view.
    const noisy = describeError("line one\nline two\tthree\u200bfour");
    expect(noisy).toBe("String/line one line two three four");
    expect(noisy).not.toContain("\n");

    const long = describeError(`x${"y".repeat(500)}`);
    // "String/" plus exactly MAX_THROWN_STRING characters of the value.
    expect(long).toHaveLength("String/".length + 200);
    expect(long.startsWith("String/xy")).toBe(true);
  });

  it("keeps the provider error code next to the name", () => {
    // nodemailer names almost every failure "Error" and puts the part an
    // operator can act on in code: EAUTH, ECONNECTION, EENVELOPE.
    const error = Object.assign(
      new Error("550 rejected: visitor@mail.invalid"),
      {
        code: "EENVELOPE",
      }
    );

    expect(describeError(error)).toBe("Error/EENVELOPE");
  });

  it("drops a code that is not a short code shaped token", () => {
    // A library is free to put anything in code, and a sentence there could
    // carry the payload the name is kept clean of.
    const wordy = Object.assign(new Error("x"), {
      code: "550 rejected: visitor@mail.invalid",
    });
    const numeric = Object.assign(new Error("x"), { code: 550 });

    expect(describeError(wordy)).toBe("Error");
    expect(describeError(numeric)).toBe("Error");
  });
});
