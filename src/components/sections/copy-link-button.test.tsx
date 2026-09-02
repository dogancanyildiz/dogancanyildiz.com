// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CopyLinkButton } from "@/components/sections/copy-link-button";

const URL_UNDER_TEST = "https://dogancanyildiz.com/blog/a-slug";

const LABELS = {
  label: "Copy link",
  copiedLabel: "Copied",
  failedLabel: "Could not copy, select the address instead",
};

function renderButton() {
  return render(<CopyLinkButton url={URL_UNDER_TEST} {...LABELS} />);
}

/**
 * Replaces navigator.clipboard for one test.
 *
 * `null` stands for the browser that exposes no clipboard at all (an insecure
 * origin), which fails differently from a write that is refused: reading
 * .writeText off undefined throws a TypeError instead of rejecting. Both have
 * to end on the same message.
 *
 * userEvent.setup() installs a clipboard stub of its own, which would replace
 * this one, so the clicks below go through fireEvent instead. The interaction
 * is a plain click; nothing here needs the pointer sequence userEvent models.
 */
function stubClipboard(writeText: ((text: string) => Promise<void>) | null) {
  Object.defineProperty(navigator, "clipboard", {
    value: writeText ? { writeText } : undefined,
    configurable: true,
    writable: true,
  });
}

/** Clicks and lets the async handler settle before the assertions run. */
async function clickCopy(name: string = LABELS.label) {
  const button = screen.getByRole("button", { name });
  await act(async () => {
    fireEvent.click(button);
  });
}

/** The live region, which is what a screen reader is actually told. */
function statusText(): string {
  return screen.getByRole("status").textContent ?? "";
}

afterEach(() => {
  vi.useRealTimers();
});

describe("copy link button", () => {
  it("writes the url and reports it, in the button and in a live region", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    stubClipboard(writeText);
    renderButton();

    await clickCopy();

    expect(writeText).toHaveBeenCalledWith(URL_UNDER_TEST);
    expect(
      screen.getByRole("button", { name: LABELS.copiedLabel })
    ).toBeInTheDocument();
    expect(statusText()).toBe(LABELS.copiedLabel);
  });

  it("announces politely rather than interrupting", () => {
    stubClipboard(async () => {});
    renderButton();

    // Present and empty before the click: a live region has to be in the
    // accessibility tree before its content changes, otherwise the first
    // change is the region appearing and goes unannounced.
    const region = screen.getByRole("status");

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region.textContent).toBe("");
  });

  it("offers the copy again after two seconds", async () => {
    vi.useFakeTimers();
    stubClipboard(async () => {});
    renderButton();

    await clickCopy();
    expect(statusText()).toBe(LABELS.copiedLabel);

    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(statusText()).toBe(LABELS.copiedLabel);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(
      screen.getByRole("button", { name: LABELS.label })
    ).toBeInTheDocument();
    expect(statusText()).toBe("");
  });

  it("falls back to the visible address when the write is refused", async () => {
    stubClipboard(async () => {
      throw new Error("NotAllowedError");
    });
    renderButton();

    await clickCopy();

    expect(
      screen.getByRole("button", { name: LABELS.failedLabel })
    ).toBeInTheDocument();
    expect(statusText()).toBe(LABELS.failedLabel);
  });

  it("gives the same answer when the browser exposes no clipboard at all", async () => {
    stubClipboard(null);
    renderButton();

    await clickCopy();

    expect(statusText()).toBe(LABELS.failedLabel);
  });

  it("clears the failure after the same two seconds", async () => {
    // The failure is not the recovery path, the url printed beside the button
    // is, so the message expires with the success one instead of staying up.
    vi.useFakeTimers();
    stubClipboard(null);
    renderButton();

    await clickCopy();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByRole("button", { name: LABELS.label })
    ).toBeInTheDocument();
  });

  it("drops its timer when the button unmounts", async () => {
    vi.useFakeTimers();
    stubClipboard(async () => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderButton();

    await clickCopy();
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // A setState landing on an unmounted component is a React warning, not a
    // throw, so nothing but the console says the cleanup regressed.
    expect(errors).not.toHaveBeenCalled();
  });

  it("passes the class list it is handed straight to the control", () => {
    stubClipboard(async () => {});
    render(
      <CopyLinkButton
        url={URL_UNDER_TEST}
        {...LABELS}
        className="tap-target inline-flex"
      />
    );

    // The share block gives it the same shape as the links beside it; a
    // button that quietly ignored the prop would sit at 20px.
    expect(screen.getByRole("button", { name: LABELS.label })).toHaveClass(
      "tap-target"
    );
  });
});
