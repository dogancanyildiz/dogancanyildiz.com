import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "@/instrumentation";
import { MAIL_ENV_KEYS, missingMailEnv } from "@/lib/resend";

const originalEnv = { ...process.env };

function withEnv(overrides: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("missingMailEnv", () => {
  it("names every variable that is absent or blank", () => {
    expect(
      missingMailEnv({
        RESEND_API_KEY: "re_key",
        CONTACT_EMAIL: "   ",
      })
    ).toEqual(["CONTACT_EMAIL", "FROM_EMAIL"]);
  });

  it("is empty when all three are set", () => {
    expect(
      missingMailEnv({
        RESEND_API_KEY: "re_key",
        CONTACT_EMAIL: "me@example.invalid",
        FROM_EMAIL: "site@example.invalid",
      })
    ).toEqual([]);
  });

  it("covers exactly the variables the contact route needs", () => {
    expect([...MAIL_ENV_KEYS]).toEqual([
      "RESEND_API_KEY",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
    ]);
  });
});

describe("register", () => {
  it("logs loudly in production when a mail variable is missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    withEnv({
      NEXT_RUNTIME: "nodejs",
      NODE_ENV: "production",
      RESEND_API_KEY: "re_key",
      CONTACT_EMAIL: undefined,
      FROM_EMAIL: undefined,
    });

    expect(() => register()).not.toThrow();

    expect(error).toHaveBeenCalledTimes(1);
    const logged = error.mock.calls[0];
    if (!logged) throw new Error("console.error was not called");
    const line = JSON.parse(String(logged[0]));

    expect(line.level).toBe("error");
    expect(line.missing).toBe("CONTACT_EMAIL,FROM_EMAIL");
  });

  it("stays quiet on the error channel when production is configured", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    withEnv({
      NEXT_RUNTIME: "nodejs",
      NODE_ENV: "production",
      RESEND_API_KEY: "re_key",
      CONTACT_EMAIL: "me@example.invalid",
      FROM_EMAIL: "site@example.invalid",
    });

    register();

    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
  });

  it("does nothing outside the node runtime", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    withEnv({
      NEXT_RUNTIME: "edge",
      NODE_ENV: "production",
      RESEND_API_KEY: undefined,
      CONTACT_EMAIL: undefined,
      FROM_EMAIL: undefined,
    });

    register();

    expect(error).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it("does not treat a missing variable as an error outside production", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    withEnv({
      NEXT_RUNTIME: "nodejs",
      NODE_ENV: "development",
      RESEND_API_KEY: undefined,
      CONTACT_EMAIL: undefined,
      FROM_EMAIL: undefined,
    });

    register();

    expect(error).not.toHaveBeenCalled();
  });
});
