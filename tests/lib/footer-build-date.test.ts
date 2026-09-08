import { describe, expect, it } from "vitest";
import { formatBuildDate } from "@/components/layout/footer";

const render = (value: Date) =>
  new Intl.DateTimeFormat("tr", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(value);

describe("formatBuildDate", () => {
  it("prints a UTC build stamp as an Istanbul calendar date", () => {
    // 21:30 UTC on the 5th is already the 6th in Istanbul (UTC+3).
    expect(formatBuildDate("2026-09-05T21:30:00Z", render)).toBe(
      "6 Eylül 2026"
    );
    expect(formatBuildDate("2026-09-05T16:59:07Z", render)).toBe(
      "5 Eylül 2026"
    );
  });

  it("keeps an empty stamp empty so the footer can drop the line", () => {
    expect(formatBuildDate("", render)).toBe("");
  });

  it("falls back to the raw text for a stamp that does not parse", () => {
    expect(formatBuildDate("yesterday", render)).toBe("yesterday");
  });
});
