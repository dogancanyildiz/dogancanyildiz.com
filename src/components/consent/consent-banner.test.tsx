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
  src: "https://umami.dravcore.com/script.js",
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
    // A region, not a dialog: nothing here traps focus or closes on Escape,
    // so announcing a dialog would promise an interaction model the banner
    // does not implement.
    expect(
      screen.getByRole("region", { name: "Visit counts" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loads no tracker while the question is still unanswered", () => {
    renderWithIntl(<Banner />);
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(document.querySelector(`script[src="${tag.src}"]`)).toBeNull();
  });

  it("stays hidden when analytics is not configured", () => {
    renderWithIntl(<Banner configured={false} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("injects the tracker after allow and remembers the choice", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Banner />);
    await user.click(
      screen.getByRole("button", { name: "Allow visit counts" })
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":true'
    );
    expect(document.querySelector(`script[src="${tag.src}"]`)).not.toBeNull();
  });

  it("honours the choice for this visit when storage refuses the write", async () => {
    // Safari's private mode throws on setItem. The banner still has to close
    // and the choice still has to take effect, otherwise the question comes
    // back on every render for the whole visit.
    // jsdom serves localStorage through a proxy, so the method has to be
    // replaced on Storage.prototype; an instance level spy never runs.
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    const user = userEvent.setup();
    renderWithIntl(<Banner />);

    await user.click(
      screen.getByRole("button", { name: "Allow visit counts" })
    );

    expect(setItem).toHaveBeenCalled();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.querySelector(`script[src="${tag.src}"]`)).not.toBeNull();
    setItem.mockRestore();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it("does not inject the tracker after a refusal", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Banner />);
    await user.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
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
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.querySelector(`script[src="${tag.src}"]`)).toBeNull();
  });
});
