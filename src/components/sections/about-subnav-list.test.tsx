// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AboutSubnavList } from "./about-subnav-list";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

// jsdom does not implement IntersectionObserver at all, and the component
// only needs the constructor plus observe/disconnect to exist; the actual
// intersection math is driven by hand from each test through this stand-in,
// which records the callback the component registered so a test can invoke
// it with whatever entries it wants to simulate a scroll position.
let observed: string[] = [];
let callback: ObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(cb: ObserverCallback) {
    callback = cb;
  }
  observe(target: Element) {
    observed.push(target.id);
  }
  unobserve() {}
  disconnect() {
    callback = null;
  }
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  observed = [];
  callback = null;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  document.body.innerHTML = "";
});

const items = [
  { id: "about-skills", label: "Skills" },
  { id: "about-experience", label: "Experience" },
  { id: "about-community", label: "Community" },
];

function mountSections() {
  for (const item of items) {
    const section = document.createElement("div");
    section.id = item.id;
    document.body.appendChild(section);
  }
}

describe("AboutSubnavList", () => {
  it("starts with no item marked current", () => {
    mountSections();
    render(<AboutSubnavList items={items} ariaLabel="On this page" />);
    for (const item of items) {
      expect(
        screen.getByRole("link", { name: item.label })
      ).not.toHaveAttribute("aria-current");
    }
  });

  it("observes every section the items point at", () => {
    mountSections();
    render(<AboutSubnavList items={items} ariaLabel="On this page" />);
    expect(observed.sort()).toEqual(
      ["about-skills", "about-experience", "about-community"].sort()
    );
  });

  it("marks the intersecting section current once the observer reports it", () => {
    mountSections();
    render(<AboutSubnavList items={items} ariaLabel="On this page" />);

    act(() => {
      callback?.([
        { target: { id: "about-experience" } as Element, isIntersecting: true },
      ]);
    });

    expect(screen.getByRole("link", { name: "Experience" })).toHaveAttribute(
      "aria-current",
      "location"
    );
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("resolves the topmost intersecting section in items order when more than one intersects", () => {
    mountSections();
    render(<AboutSubnavList items={items} ariaLabel="On this page" />);

    act(() => {
      callback?.([
        { target: { id: "about-community" } as Element, isIntersecting: true },
        { target: { id: "about-skills" } as Element, isIntersecting: true },
      ]);
    });

    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "location"
    );
    expect(screen.getByRole("link", { name: "Community" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("clears the active section once nothing intersects any more", () => {
    mountSections();
    render(<AboutSubnavList items={items} ariaLabel="On this page" />);

    act(() => {
      callback?.([
        { target: { id: "about-skills" } as Element, isIntersecting: true },
      ]);
    });
    expect(screen.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "location"
    );

    act(() => {
      callback?.([
        { target: { id: "about-skills" } as Element, isIntersecting: false },
      ]);
    });
    expect(screen.getByRole("link", { name: "Skills" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
