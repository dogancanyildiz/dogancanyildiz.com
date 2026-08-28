import { describe, expect, it } from "vitest";
import {
  certificates,
  community,
  education,
  experience,
  isHttpsUrl,
  skills,
  speaking,
  withCheckedVerifyUrls,
} from "@/content/profile";
import type { HttpsUrl } from "@/content/profile";

const LOCALES = ["en", "tr"] as const;
const FORBIDDEN = [
  "not completed",
  "tamamlanmadı",
  "TBD",
  "placeholder",
  "Lorem",
];

describe("profile data", () => {
  it("has the same number of entries in both locales", () => {
    expect(skills.en.length).toBe(skills.tr.length);
    expect(skills.en.map((group) => group.id)).toEqual(
      skills.tr.map((group) => group.id)
    );
    expect(experience.en.length).toBe(experience.tr.length);
    expect(community.en.length).toBe(community.tr.length);
    expect(certificates.en.length).toBe(certificates.tr.length);
    expect(education.en.length).toBe(education.tr.length);
    expect(speaking.en.length).toBe(speaking.tr.length);
  });

  it("models a verifyUrl field on every certificate without inventing links", () => {
    for (const locale of LOCALES) {
      for (const certificate of certificates[locale]) {
        expect(certificate.name.length).toBeGreaterThan(0);
        expect(certificate.issuer.length).toBeGreaterThan(0);
        if (certificate.verifyUrl !== undefined) {
          expect(certificate.verifyUrl).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("refuses every scheme a verification link must never carry", () => {
    for (const hostile of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
      "http://credly.com/badges/1",
      "//credly.com/badges/1",
      "/badges/1",
      "https:/credly.com",
      "",
    ]) {
      expect(isHttpsUrl(hostile)).toBe(false);
    }
  });

  it("accepts a real https verification link", () => {
    expect(isHttpsUrl("https://www.credly.com/badges/1")).toBe(true);
  });

  it("fails the build when a hostile link is cast past the type", () => {
    expect(() =>
      withCheckedVerifyUrls({
        en: [
          {
            name: "Fake",
            issuer: "Fake",
            verifyUrl: "javascript:alert(1)" as HttpsUrl,
          },
        ],
        tr: [],
      })
    ).toThrow(/not https/);
  });

  it("keeps the military academy line neutral and drops cefr levels", () => {
    const serialized = JSON.stringify({
      skills,
      experience,
      community,
      certificates,
      education,
      speaking,
    });
    for (const term of FORBIDDEN) {
      expect(serialized).not.toContain(term);
    }
    expect(serialized).not.toMatch(/\bB1\b/);
    expect(serialized).not.toMatch(/\bA2\b/);
  });

  it("contains no bracketed placeholder text in the speaking list", () => {
    const serialized = JSON.stringify(speaking);
    expect(serialized).not.toMatch(/\[[^\]]+\]/);
  });

  it("uses no em dash or en dash", () => {
    const serialized = JSON.stringify({
      skills,
      experience,
      community,
      certificates,
      education,
    });
    expect(serialized).not.toMatch(/[\u2013\u2014]/);
  });
});
