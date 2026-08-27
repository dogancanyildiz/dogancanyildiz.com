import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  it("answers 200 with a status field and never caches", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns uptime and timestamp next to the status", async () => {
    // The deploy checklists must not expect a literal {"status":"ok"} body:
    // two of these three fields change on every call.
    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp as string).toISOString()).toBe(
      body.timestamp
    );
  });
});
