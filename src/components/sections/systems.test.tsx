// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";
import type { SiteStatus } from "@/lib/status";

const getSiteStatus = vi.fn<() => Promise<SiteStatus | null>>();

vi.mock("@/lib/status", () => ({
  getSiteStatus: () => getSiteStatus(),
}));

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
  // next-intl's real formatter wraps, so format.number/format.dateTime
  // behave like production for the options systems.tsx actually passes.
  getFormatter: async () => ({
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(activeLocale, options).format(value),
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(activeLocale, options).format(value),
  }),
}));

const { Systems } = await import("./systems");

describe("Systems", () => {
  it("renders every field once status data is available", async () => {
    activeLocale = "en";
    getSiteStatus.mockResolvedValue({
      name: "site",
      up: true,
      uptime24h: 99.95,
      lastCheck: "2026-08-20T10:15:00.000Z",
    });

    render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("99.95%")).toBeInTheDocument();
    expect(
      screen.getByText("Next.js · Docker · Coolify · Traefik · Cloudflare")
    ).toBeInTheDocument();
  });

  it("shows a neutral row instead of a number when a field has no data", async () => {
    activeLocale = "en";
    getSiteStatus.mockResolvedValue({
      name: "site",
      up: false,
      uptime24h: null,
      lastCheck: null,
    });

    render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Down")).toBeInTheDocument();
    // Uptime, deploy date and commit (no NEXT_PUBLIC_BUILD_DATE or
    // NEXT_PUBLIC_BUILD_SHA in this test run) all fall back to the same
    // neutral label.
    expect(screen.getAllByText("No data")).toHaveLength(3);
    expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
  });

  it("shows the status unavailable notice instead of throwing when there is no status at all", async () => {
    activeLocale = "en";
    getSiteStatus.mockResolvedValue(null);

    render(await resolveServerTree(<Systems />));

    expect(screen.getByText("Status unavailable")).toBeInTheDocument();
  });

  it("formats the last checked timestamp in UTC, spelled out with a timezone label", async () => {
    activeLocale = "en";
    getSiteStatus.mockResolvedValue({
      name: "site",
      up: true,
      uptime24h: 100,
      lastCheck: "2026-08-20T10:15:00.000Z",
    });

    render(await resolveServerTree(<Systems />));

    expect(
      screen.getByText("Last checked Aug 20, 2026, 10:15 AM UTC")
    ).toBeInTheDocument();
  });

  it("formats the same instant with the tr locale's month names, still in UTC", async () => {
    activeLocale = "tr";
    getSiteStatus.mockResolvedValue({
      name: "site",
      up: true,
      uptime24h: 100,
      lastCheck: "2026-08-20T10:15:00.000Z",
    });

    render(await resolveServerTree(<Systems />));

    expect(
      screen.getByText("Son kontrol 20 Ağu 2026 10:15 UTC")
    ).toBeInTheDocument();
  });
});
