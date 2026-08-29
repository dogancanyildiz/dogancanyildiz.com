import { describe, expect, it } from "vitest";

/**
 * RFC 9110 section 15.5.6 makes Allow mandatory on a 405, and Next's auto
 * generated fallback for an unexported verb sends the status without it. Each
 * route therefore exports its own rejection handlers; this locks both the
 * status and the header so a new route handler cannot quietly drop them.
 */
const ROUTES = [
  {
    path: "@/app/api/health/route",
    implemented: "GET",
    allow: "GET, HEAD, OPTIONS",
  },
  {
    path: "@/app/api/contact/route",
    implemented: "POST",
    allow: "POST, OPTIONS",
  },
  {
    path: "@/app/api/csp-report/route",
    implemented: "POST",
    allow: "POST, OPTIONS",
  },
] as const;

const VERBS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

describe.each(ROUTES)("$path", ({ path, implemented, allow }) => {
  it.each(VERBS.filter((verb) => verb !== implemented))(
    "answers %s with 405 and an Allow header",
    async (verb) => {
      const route = (await import(path)) as Record<
        string,
        (() => Response) | undefined
      >;
      const handler = route[verb];
      expect(handler, `${path} exports no ${verb} handler`).toBeTypeOf(
        "function"
      );
      const response = handler!();
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe(allow);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  );

  it("still exports the verb it implements", async () => {
    const route = (await import(path)) as Record<string, unknown>;
    expect(route[implemented]).toBeTypeOf("function");
  });
});
