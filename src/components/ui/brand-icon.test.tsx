// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { GithubIcon, LinkedinIcon } from "./brand-icon";

describe("brand icons", () => {
  it("defaults GithubIcon to aria-hidden with no img role", () => {
    const { container } = render(<GithubIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("defaults LinkedinIcon to aria-hidden with no img role", () => {
    const { container } = render(<LinkedinIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role", "img");
  });

  it("lets a caller override aria-hidden when it supplies its own name", () => {
    const { container } = render(
      <GithubIcon aria-hidden={undefined} role="img" aria-label="GitHub" />
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-label", "GitHub");
    expect(svg).toHaveAttribute("role", "img");
  });
});
