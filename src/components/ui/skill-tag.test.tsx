// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillTag } from "./skill-tag";

describe("SkillTag", () => {
  it("renders an aria-hidden icon for a label with a known brand mark", () => {
    render(<SkillTag label="TypeScript" />);
    const pill = screen.getByText("TypeScript");
    const svg = pill.parentElement?.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    // The mark carries no accessible name of its own: the visible text beside
    // it is the label, so the icon must never be exposed as its own image.
    expect(svg).not.toHaveAttribute("role", "img");
  });

  it("renders text only, with no svg, for a label with no matching icon", () => {
    render(<SkillTag label="A Skill Nobody Mapped" />);
    const pill = screen.getByText("A Skill Nobody Mapped");
    expect(pill.querySelector("svg")).toBeNull();
  });
});
