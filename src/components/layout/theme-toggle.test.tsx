// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import { ThemeToggle } from "./theme-toggle";

const setTheme = vi.fn();
let resolvedTheme: string | undefined;

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme, setTheme }),
}));

describe("ThemeToggle", () => {
  it("renders one button before resolvedTheme has settled, unpressed", () => {
    resolvedTheme = undefined;
    const { container } = renderWithIntl(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle theme" });
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(button).toHaveAttribute("aria-pressed", "false");
    // Never a disabled placeholder: the pre-hydration button is the same
    // element, it only lacks the resolved theme until mount.
    expect(button).not.toHaveAttribute("disabled");
    expect(button).not.toHaveAttribute("aria-disabled");
    // The size/border classes come from the same Button element on every
    // mount state: nothing here differs between the pre-hydration render and
    // the one after resolvedTheme settles, so there is no layout jump.
    expect(button.className).toContain("tap-target");
    expect(button.className).toContain("border-border-strong");
  });

  it("reports aria-pressed=true once resolvedTheme resolves to dark, with the same classes", async () => {
    resolvedTheme = "dark";
    const { container } = renderWithIntl(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle theme" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.className).toContain("tap-target");
    expect(button.className).toContain("border-border-strong");
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("flips from dark to light on click", async () => {
    resolvedTheme = "dark";
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("flips from light to dark on click", async () => {
    resolvedTheme = "light";
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
