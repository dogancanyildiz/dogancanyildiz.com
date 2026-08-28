import { describe, expect, it } from "vitest";
import {
  certificates,
  community,
  education,
  experience,
  skills,
  speaking,
} from "@/content/profile";

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
