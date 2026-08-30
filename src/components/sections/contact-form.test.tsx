// @vitest-environment jsdom
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../../tests/helpers/render";
import { HONEYPOT_FIELD } from "@/lib/contact-validation";
import { ContactForm } from "./contact-form";

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: async () => body,
  } as Response;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.selectOptions(screen.getByLabelText("What do you need"), "web");
  await user.type(screen.getByLabelText("Message"), "Hello there");
}

let fetchMock: Mock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ContactForm live regions", () => {
  it("keeps both the status and alert region in the document from the first render", () => {
    renderWithIntl(<ContactForm />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.getByRole("alert")).toHaveTextContent("");
  });
});

describe("ContactForm validation", () => {
  it("shows a per field error, aria-invalid and aria-describedby, and focuses the first invalid field on empty submit", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "contact-name-error");
    expect(screen.getByText("Please enter your name.")).toHaveAttribute(
      "id",
      "contact-name-error"
    );
    expect(name).toHaveFocus();

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByLabelText("What do you need")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByLabelText("Message")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please check the highlighted fields."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("focuses the topic field when it is the first one left empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Message"), "Hello there");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const topic = screen.getByLabelText("What do you need");
    expect(topic).toHaveAttribute("aria-invalid", "true");
    expect(topic).toHaveFocus();
    expect(screen.getByText("Please choose a heading.")).toHaveAttribute(
      "id",
      "contact-topic-error"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("ContactForm submission", () => {
  it("posts the field values, the X-Locale header and the empty honeypot on a normal submit", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const status = await screen.findByText(
      /Thanks, your message is on its way/
    );
    // The success message moves focus to the status region itself (it
    // carries tabIndex={-1} for exactly this), so a screen reader user who
    // just submitted lands on the confirmation instead of the last field.
    expect(status).toHaveFocus();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/contact");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-Locale"]).toBe("en");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      topic: "web",
      message: "Hello there",
      [HONEYPOT_FIELD]: "",
    });
  });

  it("still sends the request when the honeypot is filled, instead of faking a silent success", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    const honeypot = screen.getByLabelText("Leave this field empty");
    expect(honeypot.closest("div")).toHaveAttribute("aria-hidden", "true");
    expect(honeypot).toHaveAttribute("tabIndex", "-1");

    await fillValidForm(user);
    await user.type(honeypot, "spam bot");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await screen.findByText(/Thanks, your message is on its way/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)[HONEYPOT_FIELD]).toBe("spam bot");
  });

  it("locks the fields and the submit button with readOnly/aria-disabled rather than disabled, and reports busy, while the request is in flight", async () => {
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const button = screen.getByRole("button", { name: "Sending" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not the disabled attribute: a disabled control drops out of the tab
    // order and, for the button, takes the keyboard focus with it.
    expect(button).not.toHaveAttribute("disabled");
    expect(screen.getByLabelText("Name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("disabled");
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByLabelText("What do you need")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByLabelText("What do you need")).not.toHaveAttribute(
      "disabled"
    );
    expect(screen.getByRole("status")).toHaveTextContent("Sending");

    // A second submit while the first is still in flight must not fire a
    // second request: the guard at the top of handleSubmit is what makes it
    // safe to leave the button focusable and merely aria-disabled instead of
    // truly disabled.
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch(jsonResponse(200, {}));
      await Promise.resolve();
    });
  });

  it("shows the timeout message when the request aborts", async () => {
    // A real AbortSignal.timeout() rejection is instanceof Error in every
    // browser that ships it (Chromium and Firefox both make DOMException
    // extend Error); jsdom's own DOMException shim does not, which would
    // make this assert the wrong branch of the component for a reason that
    // has nothing to do with the component. A plain Error named
    // TimeoutError reproduces what the component actually receives at
    // runtime instead of what jsdom's polyfill happens to produce.
    const timeoutError = new Error("The operation was aborted.");
    timeoutError.name = "TimeoutError";
    fetchMock.mockRejectedValue(timeoutError);
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const alert = await screen.findByText(
      "The request took too long. It may still have reached me, so please wait a moment before sending it again."
    );
    expect(alert).toHaveFocus();
  });

  it("shows the translated field message under the field the server named, and the generic sentence in the alert region", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        error: "Invalid request. Name, email, and message are required.",
        field: "email",
      })
    );
    const user = userEvent.setup();
    renderWithIntl(<ContactForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const email = await screen.findByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveFocus();
    expect(
      screen.getByText("Please enter a valid email address.")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid request. Name, email, and message are required."
    );
    // The field message is the client's own catalog entry translated from
    // the server's field name, never the server's raw sentence repeated
    // under the input: that would tell this visitor every field failed
    // rather than just the one the server rejected.
    expect(
      screen.queryByText(
        "Invalid request. Name, email, and message are required.",
        { selector: "p" }
      )
    ).not.toBeInTheDocument();
  });
});

describe("ContactForm rate limiting", () => {
  it("locks the button and counts the Retry-After window down to zero", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        429,
        { error: "Too many requests. Please try again in a few minutes." },
        { "Retry-After": "2" }
      )
    );
    renderWithIntl(<ContactForm />);

    // fireEvent + fake timers rather than user-event: user-event's own
    // pointer/keyboard simulation and Testing Library's findBy*/waitFor both
    // lean on real timers to detect a running Jest/Vitest clock (see
    // node_modules/@testing-library/dom/dist/helpers.js, which only checks
    // for a `jest` global), so either one paired with vi.useFakeTimers()
    // hangs until the real test timeout. fireEvent plus a manual flush of
    // the submit handler's microtask chain sidesteps both.
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("What do you need"), {
      target: { value: "web" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Hello there" },
    });

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    // submitRequest awaits fetch(), then res.json(): flushing a handful of
    // microtask turns (unaffected by the faked macrotask clock) lets both
    // settle and their state updates commit before the next assertion.
    await act(async () => {
      for (let i = 0; i < 6; i += 1) {
        await Promise.resolve();
      }
    });

    expect(
      screen.getByRole("button", { name: "Try again in 2s" })
    ).toHaveAttribute("aria-disabled", "true");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByRole("button", { name: "Try again in 1s" })
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const unlocked = screen.getByRole("button", { name: "Send message" });
    expect(unlocked).not.toHaveAttribute("aria-disabled");
  });
});
