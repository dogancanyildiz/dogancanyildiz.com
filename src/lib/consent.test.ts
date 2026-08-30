import { describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  isAnalyticsAllowed,
  parseConsent,
  serializeConsent,
} from "./consent";

describe("consent storage", () => {
  it("names a stable localStorage key", () => {
    expect(CONSENT_STORAGE_KEY).toBe("dcy-consent");
  });

  it("round-trips an allow and a refuse choice", () => {
    const allowed = parseConsent(
      serializeConsent(true, "2026-08-30T12:00:00.000Z")
    );
    expect(allowed).toEqual({
      version: CONSENT_VERSION,
      analytics: true,
      updatedAt: "2026-08-30T12:00:00.000Z",
    });
    expect(isAnalyticsAllowed(allowed)).toBe(true);

    const refused = parseConsent(
      serializeConsent(false, "2026-08-30T12:00:00.000Z")
    );
    expect(refused?.analytics).toBe(false);
    expect(isAnalyticsAllowed(refused)).toBe(false);
  });

  it("treats missing, garbage and old versions as no choice", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("not-json")).toBeNull();
    expect(parseConsent("{}")).toBeNull();
    expect(
      parseConsent(JSON.stringify({ version: 0, analytics: true }))
    ).toBeNull();
    expect(isAnalyticsAllowed(null)).toBe(false);
  });
});
