// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import { MobileMenu } from "./mobile-menu";

let pathname = "/about";

// See the comment in language-switcher.test.tsx: this replaces next-intl's
// navigation wrapper (Link, usePathname) so the render never has to reach a
// real App Router context, which jsdom cannot provide.
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("MobileMenu", () => {
  it("starts closed and opens the panel on trigger click", async () => {
    pathname = "/about";
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("marks the item matching the current route with aria-current=page", async () => {
    pathname = "/about";
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");

    const about = screen.getByRole("link", { name: "About" });
    const projects = screen.getByRole("link", { name: "Projects" });
    expect(about).toHaveAttribute("aria-current", "page");
    expect(projects).not.toHaveAttribute("aria-current");
  });

  it("closes the panel when a nav link is activated", async () => {
    pathname = "/about";
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the panel with the close button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the panel and keeps Tab inside it while open", async () => {
    // The panel is a real dialog, unlike the consent banner, so it owes the
    // matching behaviour: focus goes in on open, Tab cannot walk out to the
    // page behind it, and focus comes back to the trigger on close.
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    const trigger = screen.getByRole("button", { name: "Open menu" });

    await user.click(trigger);
    const panel = await screen.findByRole("dialog");
    expect(panel.contains(document.activeElement)).toBe(true);

    // One full lap of the panel: every stop stays inside it.
    for (let step = 0; step < 12; step += 1) {
      await user.tab();
      expect(
        panel.contains(document.activeElement),
        `focus left the panel after ${step + 1} tabs`
      ).toBe(true);
    }

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("closes the panel on Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileMenu />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
