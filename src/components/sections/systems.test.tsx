// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";

// Real next-intl resolves the locale from the request scope Next's
// middleware sets up (see src/i18n/request.ts), which this render never
// goes through: Systems() itself takes no locale prop, it reads
// getTranslations()/getFormatter() ambiently the way it would inside a real
// request. This mutable value stands in for that request scope so a test
// can flip it before rendering.
let activeLocale: "en" | "tr" = "en";

vi.mock("next-intl/server", () => ({
  getTranslations: async (arg?: string | { namespace?: string }) => {
    const namespace = typeof arg === "string" ? arg : arg?.namespace;
    const messages = (await import(`../../../messages/${activeLocale}.json`))
      .default as Record<string, unknown>;
    return (key: string, values?: Record<string, unknown>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const raw = path
        .split(".")
        .reduce<unknown>(
          (node, segment) => (node as Record<string, unknown>)?.[segment],
          messages
        );
      if (typeof raw !== "string") {
        throw new Error(`missing message key: ${activeLocale}.${path}`);
      }
      if (!values) return raw;
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, String(value)),
        raw
      );
    };
  },
  // Backed by the platform's own Intl constructors, the same primitives
  // next-intl's real formatter wraps, so format.dateTime behaves like
  // production for the options systems.tsx actually passes.
  getFormatter: async () => ({
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(activeLocale, options).format(value),
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(activeLocale, options).format(value),
  }),
}));

// buildInfo is read at module scope in src/lib/build-info.ts, so stubbing
// process.env after import cannot reach it; the module is mocked with a
// mutable holder instead.
const build = { sha: "", date: "" };
vi.mock("@/lib/build-info", () => ({
  buildInfo: {
    get sha() {
      return build.sha;
    },
    get date() {
      return build.date;
    },
  },
  formatBuildSha: (sha: string) => sha.slice(0, 7),
}));

const { Systems } = await import("./systems");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Systems", () => {
  it("renders build data and the stack line from build-time values", async () => {
    activeLocale = "en";
    build.sha = "0123abcd456";
    build.date = "2026-08-28T09:12:33+00:00";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "https://status.example.org/status");

    render(await resolveServerTree(<Systems />));

    // The deploy date is formatted, never the raw ISO string (N-12).
    expect(screen.queryByText("2026-08-28T09:12:33+00:00")).toBeNull();
    expect(screen.getByText(/UTC/)).toBeInTheDocument();
    expect(screen.getByText("0123abc")).toBeInTheDocument();
    expect(
      screen.getByText("Next.js · Docker · Coolify · Traefik · Cloudflare")
    ).toBeInTheDocument();

    const statusLink = screen.getByRole("link", { name: /status/i });
    expect(statusLink).toHaveAttribute(
      "href",
      "https://status.example.org/status"
    );
    expect(statusLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
  });

  it("shows the neutral row when a build value or the status url is missing", async () => {
    activeLocale = "en";
    build.sha = "";
    build.date = "";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "");

    render(await resolveServerTree(<Systems />));

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getAllByText("No data").length).toBeGreaterThanOrEqual(3);
  });

  it("drops a status link that is not https instead of rendering it", async () => {
    activeLocale = "en";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "http://status.example.org");

    render(await resolveServerTree(<Systems />));

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders the Turkish copy for the tr locale", async () => {
    activeLocale = "tr";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "https://status.example.org");

    render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Sistemler")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /durum/i })).toBeInTheDocument();
  });
});
