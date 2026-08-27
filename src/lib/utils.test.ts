import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("drops falsy class names", () => {
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("lets the last tailwind class win on conflict", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("returns an empty string when nothing is passed", () => {
    expect(cn()).toBe("");
  });
});
