// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";
import type { LiveStatusSnapshot } from "@/lib/status-page";

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
const build = { sha: "", date: "", version: "0.7.0" };
vi.mock("@/lib/build-info", () => ({
  buildInfo: {
    get sha() {
      return build.sha;
    },
    get date() {
      return build.date;
    },
    get version() {
      return build.version;
    },
  },
  formatBuildSha: (sha: string) => sha.slice(0, 7),
  commitUrl: (sha: string) =>
    `https://github.com/dogancanyildiz/dogancanyildiz.com/commit/${sha}`,
}));

// The live status cell reads Uptime Kuma over the network. Its rendering is
// covered by live-status.test.tsx; here the fetch is replaced so the panel
// test stays offline and can flip between "Kuma answered" and "it did not".
const liveStatus: { value: LiveStatusSnapshot | null } = { value: null };
vi.mock("@/lib/status-page", () => ({
  getLiveStatus: async () => liveStatus.value,
}));

const { Systems } = await import("./systems");

afterEach(() => {
  vi.unstubAllEnvs();
  liveStatus.value = null;
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
    // Istanbul clock with the zone on the value; 09:12 UTC reads 12:12 GMT+3.
    expect(screen.getByText(/12:12.*GMT\+3/)).toBeInTheDocument();
    // The version is what a visitor reads; the sha is fine print linking to
    // the commit on GitHub.
    expect(screen.getByText("v0.7.0")).toBeInTheDocument();
    const commitLink = screen.getByRole("link", { name: /0123abc/ });
    expect(commitLink).toHaveAttribute(
      "href",
      "https://github.com/dogancanyildiz/dogancanyildiz.com/commit/0123abcd456"
    );
    expect(commitLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
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
    // Date and status fall back; the version always renders, the sha simply
    // disappears from the release cell.
    expect(screen.getAllByText("No data").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("v0.7.0")).toBeInTheDocument();
  });

  it("drops a status link that is not https instead of rendering it", async () => {
    activeLocale = "en";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "http://status.example.org");

    render(await resolveServerTree(<Systems />));

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("puts the live status widget in the status cell when Kuma answers", async () => {
    activeLocale = "en";
    build.sha = "0123abcd456";
    build.date = "2026-08-28T09:12:33+00:00";
    vi.stubEnv(
      "NEXT_PUBLIC_STATUS_URL",
      "https://uptime.example.org/status/site"
    );
    liveStatus.value = {
      status: "up",
      uptime24: 0.999,
      monitorName: "dogancanyildiz.com",
      checkedAt: "2026-09-03T09:39:57.000Z",
      beats: [
        { status: "up", time: "2026-09-03T09:38:57.000Z", ping: 160 },
        { status: "up", time: "2026-09-03T09:39:57.000Z", ping: 171 },
      ],
    };

    const { container } = render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
    // The panel's other three cells are untouched by the widget.
    expect(screen.getByText("0123abc")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /status page/i })
    ).toBeInTheDocument();
  });

  it("keeps the bare status link when Kuma cannot be read", async () => {
    activeLocale = "en";
    vi.stubEnv(
      "NEXT_PUBLIC_STATUS_URL",
      "https://uptime.example.org/status/site"
    );
    liveStatus.value = null;

    const { container } = render(await resolveServerTree(<Systems />));

    expect(container.querySelectorAll('[role="img"]')).toHaveLength(0);
    expect(screen.queryByText("Operational")).toBeNull();
    expect(screen.getByRole("link", { name: /status page/i })).toHaveAttribute(
      "href",
      "https://uptime.example.org/status/site"
    );
  });

  it("renders the Turkish copy for the tr locale", async () => {
    activeLocale = "tr";
    vi.stubEnv("NEXT_PUBLIC_STATUS_URL", "https://status.example.org");

    render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Sistemler")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /durum/i })).toBeInTheDocument();
  });
});
