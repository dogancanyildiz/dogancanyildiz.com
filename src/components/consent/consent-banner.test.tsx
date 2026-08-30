// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";
import { ConsentProvider, resetConsentMemory } from "./consent-provider";
import { ConsentBanner } from "./consent-banner";
import type { UmamiTag } from "@/lib/analytics";

const tag: UmamiTag = {
  src: "https://analytics.dogancanyildiz.com/script.js",
  websiteId: "site-123",
  domains: "dogancanyildiz.com",
};

vi.mock("@/i18n/navigation", () => ({
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

function Banner({ configured = true }: { configured?: boolean }) {
  return (
    <ConsentProvider tag={configured ? tag : null}>
      <ConsentBanner />
    </ConsentProvider>
  );
}

describe("ConsentBanner", () => {
  afterEach(() => {
    resetConsentMemory();
    window.localStorage.clear();
    document
      .querySelectorAll(`script[src="${tag.src}"]`)
      .forEach((node) => node.remove());
  });

  it("asks when analytics is configured and no choice is stored", () => {
    renderWithIntl(<Banner />);
    expect(
      screen.getByRole("dialog", { name: "Visit counts" })
    ).toBeInTheDocument();
  });

  it("stays hidden when analytics is not configured", () => {
    renderWithIntl(<Banner configured={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("injects the tracker after allow and remembers the choice", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Banner />);
    await user.click(
      screen.getByRole("button", { name: "Allow visit counts" })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":true'
    );
    expect(document.querySelector(`script[src="${tag.src}"]`)).not.toBeNull();
  });

  it("does not inject the tracker after a refusal", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Banner />);
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":false'
    );
    expect(document.querySelector(`script[src="${tag.src}"]`)).toBeNull();
  });

  it("does not ask again after a stored refusal", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        analytics: false,
        updatedAt: "2026-08-30T12:00:00.000Z",
      })
    );
    renderWithIntl(<Banner />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector(`script[src="${tag.src}"]`)).toBeNull();
  });
});
