// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  UMAMI_EVENT,
  linkHost,
  outboundEvent,
  trackUmamiEvent,
  umamiEvent,
} from "./analytics-events";

describe("umamiEvent", () => {
  it("marks the element with the event name", () => {
    expect(umamiEvent(UMAMI_EVENT.whatsappClick)).toEqual({
      "data-umami-event": "whatsapp-click",
    });
  });

  it("writes each field as its own data attribute", () => {
    expect(umamiEvent(UMAMI_EVENT.cvDownload, { locale: "tr" })).toEqual({
      "data-umami-event": "cv-download",
      "data-umami-event-locale": "tr",
    });
  });

  it("drops fields with nothing to record instead of sending an empty one", () => {
    expect(
      umamiEvent(UMAMI_EVENT.outboundClick, { host: "", surface: undefined })
    ).toEqual({ "data-umami-event": "outbound-click" });
  });
});

describe("linkHost", () => {
  it("reduces a profile url to its hostname", () => {
    expect(linkHost("https://github.com/dogancanyildiz")).toBe("github.com");
  });

  it("reports the scheme for mailto, which has no host", () => {
    expect(linkHost("mailto:me@dogancanyildiz.com")).toBe("mailto");
  });

  it("returns an empty host for something that is not a url", () => {
    expect(linkHost("/about")).toBe("");
  });
});

describe("outboundEvent", () => {
  it("keys the outbound event on the target host", () => {
    expect(outboundEvent("https://www.linkedin.com/in/example")).toEqual({
      "data-umami-event": "outbound-click",
      "data-umami-event-host": "www.linkedin.com",
    });
  });
});

describe("trackUmamiEvent", () => {
  it("forwards the event to the tracker once it is loaded", () => {
    const track = vi.fn();
    window.umami = { track };

    trackUmamiEvent(UMAMI_EVENT.contactSubmit, { topic: "devops" });

    expect(track).toHaveBeenCalledWith("contact-submit", { topic: "devops" });
    delete window.umami;
  });

  it("does nothing when the tracker never loaded", () => {
    delete window.umami;
    expect(() =>
      trackUmamiEvent(UMAMI_EVENT.contactSubmit, { topic: "web" })
    ).not.toThrow();
  });

  it("swallows a throw from the tracker so the interaction survives it", () => {
    window.umami = {
      track: () => {
        throw new Error("collector unreachable");
      },
    };

    expect(() => trackUmamiEvent(UMAMI_EVENT.contactSubmit)).not.toThrow();
    delete window.umami;
  });
});
