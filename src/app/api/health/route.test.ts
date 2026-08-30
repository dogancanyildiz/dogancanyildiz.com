import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const originalEnv = { ...process.env };

function setMailEnv(present: boolean): void {
  for (const key of [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "CONTACT_EMAIL",
    "FROM_EMAIL",
  ]) {
    if (present) {
      process.env[key] = "set";
    } else {
      delete process.env[key];
    }
  }
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("GET /api/health", () => {
  it("answers ok with a boolean per dependency", async () => {
    setMailEnv(true);
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks).toEqual({ content: true, mail: true });
  });

  it("reports degraded when the mail environment is incomplete", async () => {
    setMailEnv(false);
    const response = await GET();
    const body = await response.json();

    // The uptime monitor watches the body's status field, so it has to move even
    // though the HTTP status deliberately stays 200 for the container probe.
    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.checks.mail).toBe(false);
  });

  it("never publishes process internals", async () => {
    setMailEnv(true);
    const body = await (await GET()).json();

    expect(Object.keys(body).sort()).toEqual(["checks", "status", "timestamp"]);
    expect(body).not.toHaveProperty("uptime");
    expect(body).not.toHaveProperty("pid");
    expect(body).not.toHaveProperty("memory");
  });

  it("is never cached", async () => {
    setMailEnv(true);
    const response = await GET();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
