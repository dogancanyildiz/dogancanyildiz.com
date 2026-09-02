// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import { CONSENT_STORAGE_KEY, serializeConsent } from "@/lib/consent";
import { ConsentProvider, resetConsentMemory } from "./consent-provider";
import { ConsentControls } from "./consent-controls";
import type { UmamiTag } from "@/lib/analytics";

const tag: UmamiTag = {
  src: "https://umami.dravcore.com/script.js",
  websiteId: "site-123",
  domains: "dogancanyildiz.com",
};

function Controls({ configured = true }: { configured?: boolean }) {
  return (
    <ConsentProvider tag={configured ? tag : null}>
      <ConsentControls />
    </ConsentProvider>
  );
}

const trackerScript = () =>
  document.querySelector<HTMLScriptElement>(`script[src="${tag.src}"]`);

afterEach(() => {
  resetConsentMemory();
  window.localStorage.clear();
  trackerScript()?.remove();
  delete (window as { umami?: unknown }).umami;
});

describe("ConsentControls", () => {
  it("says nothing has been answered yet and offers to allow", () => {
    renderWithIntl(<Controls />);
    expect(
      screen.getByText("You have not answered yet, so nothing is counted.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Allow visit counts" })
    ).toBeInTheDocument();
  });

  it("reports a stored refusal and still offers to allow", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(false));
    renderWithIntl(<Controls />);
    expect(
      screen.getByText("Visit counts are off. No measurement script loads.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Allow visit counts" })
    ).toBeInTheDocument();
  });

  it("stores the consent and loads the tracker when allow is pressed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Controls />);

    await user.click(
      screen.getByRole("button", { name: "Allow visit counts" })
    );

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":true'
    );
    expect(trackerScript()).not.toBeNull();
    expect(
      screen.getByText("Visit counts are on. The script loads on this browser.")
    ).toBeInTheDocument();
  });

  it("withdraws a granted consent and takes the injected script back out", async () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(true));
    const user = userEvent.setup();
    renderWithIntl(<Controls />);
    expect(trackerScript()).not.toBeNull();
    // Stands in for the global the real script installs on load: a withdrawal
    // that only removes the element would leave every later umami.track()
    // call reporting.
    (window as { umami?: unknown }).umami = { track: () => {} };

    await user.click(screen.getByRole("button", { name: "Withdraw" }));

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":false'
    );
    expect(trackerScript()).toBeNull();
    expect((window as { umami?: unknown }).umami).toBeUndefined();
    expect(
      screen.getByText("Visit counts are off. No measurement script loads.")
    ).toBeInTheDocument();
  });

  it("renders nothing when analytics is not configured", () => {
    const { container } = renderWithIntl(<Controls configured={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("puts the state sentence in a polite live region", () => {
    renderWithIntl(<Controls />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "You have not answered yet, so nothing is counted."
    );
  });
});
