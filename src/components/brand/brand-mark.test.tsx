// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrandMark } from "./brand-mark";

describe("BrandMark", () => {
  it("renders one decorative svg with no accessible name", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    if (!svg) throw new Error("BrandMark rendered no svg");

    // The header link is labelled by the name text next to the mark. A title
    // or a role here would have the link announced twice.
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg.querySelector("title")).toBeNull();
  });

  it("takes the letters from currentColor and the block from the primary token", () => {
    const { container } = render(<BrandMark />);
    // One export covers both themes: the letters inherit the text colour and
    // the accent block reads --primary, which already flips per palette.
    expect(container.querySelector("path")).toHaveAttribute(
      "fill",
      "currentColor"
    );
    const block = container.querySelector("rect");
    expect(block?.getAttribute("class")).toBe("fill-primary");
    // No literal from either exported file may survive: they are what the
    // token replaces.
    expect(container.innerHTML).not.toContain("#007041");
    expect(container.innerHTML).not.toContain("#4fcc8d");
    expect(container.innerHTML).not.toContain("#2b3036");
  });

  it("blinks the cursor only when asked, through a class and not inline style", () => {
    const steady = render(<BrandMark />);
    expect(steady.container.querySelector("rect")?.getAttribute("class")).toBe(
      "fill-primary"
    );
    steady.unmount();
    const blinking = render(<BrandMark cursor="blink" />);
    const rect = blinking.container.querySelector("rect");
    expect(rect?.getAttribute("class")).toBe("fill-primary brand-cursor");
    expect(rect?.getAttribute("style")).toBeNull();
  });

  it("derives the width from the viewBox so the mark never distorts", () => {
    const { container } = render(<BrandMark height={40} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "40");
    // 218.8 / 74.2 * 40, rounded to two decimals.
    expect(svg).toHaveAttribute("width", "117.95");
    expect(svg).toHaveAttribute("viewBox", "7.4 -72.6 218.8 74.2");
  });
});
