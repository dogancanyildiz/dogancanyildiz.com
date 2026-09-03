// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";
import type { LiveStatusSnapshot, StatusBeat } from "@/lib/status-page";

// Same stand-in for the request scope as systems.test.tsx: LiveStatus takes no
// locale prop, it reads getTranslations()/getFormatter() ambiently.
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
  getFormatter: async () => ({
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(activeLocale, options).format(value),
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(activeLocale, options).format(value),
  }),
}));

// The network lives in src/lib/status-page.ts and is exercised by its own
// suite; this file is about what the cell renders for a given snapshot.
const snapshot: { value: LiveStatusSnapshot | null } = { value: null };
vi.mock("@/lib/status-page", () => ({
  getLiveStatus: async () => snapshot.value,
}));

const { LiveStatus } = await import("./live-status");

const HREF = "https://uptime.example.org/status/site";

function beats(
  count: number,
  status: StatusBeat["status"] = "up"
): StatusBeat[] {
  return Array.from({ length: count }, (_, index) => ({
    status,
    time: new Date(Date.UTC(2026, 8, 3, 9, index, 57)).toISOString(),
    ping: 160 + index,
  }));
}

function snapshotWith(
  overrides: Partial<LiveStatusSnapshot> = {}
): LiveStatusSnapshot {
  const list = overrides.beats ?? beats(40);
  return {
    status: "up",
    uptime24: 0.99857,
    monitorName: "dogancanyildiz.com",
    checkedAt: list[list.length - 1]?.time ?? "2026-09-03T09:39:57.000Z",
    ...overrides,
    beats: list,
  };
}

function bars(): HTMLElement[] {
  return screen.getAllByRole("img");
}

beforeEach(() => {
  activeLocale = "en";
  snapshot.value = null;
});

describe("LiveStatus", () => {
  it("falls back to the plain status page link with no snapshot", async () => {
    render(await resolveServerTree(<LiveStatus href={HREF} />));

    const link = screen.getByRole("link", { name: /status page/i });
    expect(link).toHaveAttribute("href", HREF);
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.queryByText(/last 24 hours/i)).toBeNull();
  });

  it("renders the dot, the uptime and one bar per heartbeat", async () => {
    snapshot.value = snapshotWith();

    const { container } = render(
      await resolveServerTree(<LiveStatus href={HREF} />)
    );

    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("Last 40 checks")).toBeInTheDocument();
    expect(bars()).toHaveLength(40);

    // The dot is decorative and paints the "up" token, breathing the way the
    // hero availability dot does.
    const dot = container.querySelector(".status-pulse");
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass("bg-status-up");
    expect(dot).toHaveAttribute("aria-hidden", "true");

    // The link the cell used to be is still the last thing in it.
    expect(screen.getByRole("link", { name: /status page/i })).toHaveAttribute(
      "href",
      HREF
    );
  });

  it("names every bar with its instant, state and ping", async () => {
    snapshot.value = snapshotWith({ beats: beats(3) });

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    const [first] = bars();
    const label = first?.getAttribute("aria-label") ?? "";
    expect(label).toContain("UTC");
    expect(label).toContain("Operational");
    expect(label).toContain("160 ms");
    // The tooltip repeats the accessible name rather than inventing a second
    // wording for it.
    expect(first).toHaveAttribute("title", label);
  });

  it("leaves the ping out of the label when Kuma recorded none", async () => {
    snapshot.value = snapshotWith({
      beats: [{ status: "down", time: "2026-09-03T09:39:57.000Z", ping: null }],
    });

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    const [only] = bars();
    expect(only?.getAttribute("aria-label")).not.toContain("ms");
    expect(only).toHaveClass("bg-status-down");
  });

  it("paints each Kuma state from its own theme token", async () => {
    snapshot.value = snapshotWith({
      status: "maintenance",
      beats: [
        { status: "up", time: "2026-09-03T09:00:57.000Z", ping: 100 },
        { status: "down", time: "2026-09-03T09:01:57.000Z", ping: null },
        { status: "pending", time: "2026-09-03T09:02:57.000Z", ping: 900 },
        { status: "maintenance", time: "2026-09-03T09:03:57.000Z", ping: null },
        { status: "unknown", time: "2026-09-03T09:04:57.000Z", ping: null },
      ],
    });

    const { container } = render(
      await resolveServerTree(<LiveStatus href={HREF} />)
    );

    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(
      bars().map((bar) =>
        [...bar.classList].find((name) => name.startsWith("bg-"))
      )
    ).toEqual([
      "bg-status-up",
      "bg-status-down",
      "bg-status-pending",
      "bg-status-maintenance",
      "bg-border-strong",
    ]);
    // A monitor that is not up does not breathe.
    expect(container.querySelector(".status-pulse")).toBeNull();
  });

  it("hides the oldest bars below the sm breakpoint so 320px never overflows", async () => {
    snapshot.value = snapshotWith();

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    const hidden = bars().filter((bar) => bar.classList.contains("hidden"));
    expect(hidden).toHaveLength(16);
    expect(bars().slice(0, 16)).toEqual(hidden);
    for (const bar of hidden) {
      expect(bar).toHaveClass("sm:block");
    }
  });

  it("keeps every bar when there are fewer than the mobile limit", async () => {
    snapshot.value = snapshotWith({ beats: beats(12) });

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    expect(bars()).toHaveLength(12);
    expect(bars().some((bar) => bar.classList.contains("hidden"))).toBe(false);
  });

  it("drops the uptime line when Kuma published no 24 hour figure", async () => {
    snapshot.value = snapshotWith({ uptime24: null, beats: beats(4) });

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    expect(screen.queryByText("last 24 hours")).toBeNull();
    expect(screen.getByText("Operational")).toBeInTheDocument();
  });

  it("formats the uptime and the state in Turkish for the tr locale", async () => {
    activeLocale = "tr";
    snapshot.value = snapshotWith({ status: "down", beats: beats(40, "down") });

    render(await resolveServerTree(<LiveStatus href={HREF} />));

    expect(screen.getByText("Kesinti")).toBeInTheDocument();
    expect(screen.getByText("%99,9")).toBeInTheDocument();
    expect(screen.getByText("son 24 saat")).toBeInTheDocument();
    expect(screen.getByText("Son 40 kontrol")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /durum sayfasını aç/i })
    ).toBeInTheDocument();
  });
});
