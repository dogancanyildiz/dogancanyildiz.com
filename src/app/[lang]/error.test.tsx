// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import LocaleError from "./error";

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

describe("LocaleError", () => {
  it("shows the error message and logs the original error to the console", () => {
    const error = Object.assign(new Error("boom"), { digest: undefined });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    renderWithIntl(<LocaleError error={error} retry={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong" })
    ).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it("shows the digest when the error carries one, omits it otherwise", () => {
    const withDigest = Object.assign(new Error("boom"), { digest: "abc123" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = renderWithIntl(
      <LocaleError error={withDigest} retry={vi.fn()} />
    );
    expect(screen.getByText("abc123")).toBeInTheDocument();

    const withoutDigest = Object.assign(new Error("boom"), {
      digest: undefined,
    });
    rerender(<LocaleError error={withoutDigest} retry={vi.fn()} />);
    expect(screen.queryByText("abc123")).not.toBeInTheDocument();
  });

  it("calls retry when the try again button is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <LocaleError
        error={Object.assign(new Error("boom"), { digest: undefined })}
        retry={retry}
      />
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("links back home", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithIntl(
      <LocaleError
        error={Object.assign(new Error("boom"), { digest: undefined })}
        retry={vi.fn()}
      />
    );
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
