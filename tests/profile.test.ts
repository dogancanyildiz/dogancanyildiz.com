import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  certificateGroupsFor,
  certificates,
  community,
  education,
  experience,
  isHttpsUrl,
  isIsoDate,
  skills,
  speaking,
  withCheckedCertificates,
} from "@/content/profile";
import type {
  CertificateBadge,
  CertificateEntry,
  HttpsUrl,
} from "@/content/profile";

const LOCALES = ["en", "tr"] as const;
const FORBIDDEN = [
  "not completed",
  "tamamlanmadı",
  "TBD",
  "placeholder",
  "Lorem",
];

// A verification link may only point at a page the issuer itself publishes.
// Anything else is a link the visitor cannot use to check the claim, and a
// typo in a host is exactly the mistake that turns a credential into a dead
// end nobody notices.
const ALLOWED_VERIFY_PREFIXES = [
  "https://www.credly.com/badges/",
  "https://hackviser.com/verify",
];

// A minimal PNG/JPEG header reader. The point of the check is that the
// numbers written in profile.ts are the file's real intrinsic size, so it has
// to come from the bytes on disk rather than from the same image library that
// produced them.
function intrinsicSize(path: string): { width: number; height: number } {
  const fd = openSync(path, "r");
  try {
    const head = Buffer.alloc(32);
    readSync(fd, head, 0, 32, 0);

    if (head.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
      // IHDR is the first chunk of every PNG: length, type, then width and
      // height as big endian 32 bit integers.
      expect(head.subarray(12, 16).toString("latin1")).toBe("IHDR");
      return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
    }

    if (head[0] === 0xff && head[1] === 0xd8) {
      // Walk the JPEG segment chain to the frame header, which carries the
      // size. SOF0/1/2/3, 5/6/7, 9/10/11, 13/14/15 are frame markers; DHT
      // (c4), JPG (c8) and DAC (cc) share the range and are not.
      let offset = 2;
      const segment = Buffer.alloc(9);
      for (;;) {
        readSync(fd, segment, 0, 4, offset);
        expect(segment[0]).toBe(0xff);
        const marker = segment[1] as number;
        const length = segment.readUInt16BE(2);
        const isFrame =
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc;
        if (isFrame) {
          readSync(fd, segment, 0, 9, offset);
          return {
            height: segment.readUInt16BE(5),
            width: segment.readUInt16BE(7),
          };
        }
        offset += 2 + length;
      }
    }

    throw new Error(`${path} is neither a PNG nor a JPEG`);
  } finally {
    closeSync(fd);
  }
}

function entryId(entry: CertificateEntry): string {
  return `${entry.group}/${entry.name}`;
}

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

  it("names, dates and links the same credentials in both locales", () => {
    // Credential names are issued in English and never translated, so the two
    // locales must not drift into describing different credentials.
    expect(certificates.en.map(entryId)).toEqual(certificates.tr.map(entryId));
    expect(certificates.en.map((entry) => entry.issued)).toEqual(
      certificates.tr.map((entry) => entry.issued)
    );
    expect(certificates.en.map((entry) => entry.verifyUrl)).toEqual(
      certificates.tr.map((entry) => entry.verifyUrl)
    );
  });

  it("points every verification link at a page its issuer publishes", () => {
    for (const locale of LOCALES) {
      for (const certificate of certificates[locale]) {
        expect(certificate.name.length).toBeGreaterThan(0);
        expect(certificate.issuer.length).toBeGreaterThan(0);
        if (certificate.verifyUrl === undefined) continue;
        expect(certificate.verifyUrl).toMatch(/^https:\/\//);
        expect(
          ALLOWED_VERIFY_PREFIXES.some((prefix) =>
            certificate.verifyUrl?.startsWith(prefix)
          ),
          `${certificate.name}: ${certificate.verifyUrl}`
        ).toBe(true);
      }
    }
  });

  it("dates every credential that has a date, as an ISO calendar day", () => {
    for (const certificate of certificates.en) {
      if (certificate.issued === undefined) continue;
      expect(isIsoDate(certificate.issued), certificate.name).toBe(true);
    }
  });

  it("ships the badge artwork it points at, at the size it claims", () => {
    for (const certificate of certificates.en) {
      const badge = certificate.badge;
      if (badge === undefined) continue;
      const path = join(process.cwd(), "public", badge.src);
      expect(existsSync(path), `missing ${badge.src}`).toBe(true);
      // next/image reserves the box from these two numbers, so a wrong value
      // is a layout shift on a real visit that no unit test would otherwise
      // notice.
      expect(intrinsicSize(path), badge.src).toEqual({
        width: badge.width,
        height: badge.height,
      });
    }
  });

  it("groups the certificates by issuer, each issuer once", () => {
    for (const locale of LOCALES) {
      const groups = certificateGroupsFor(locale);
      expect(groups.map((group) => group.id)).toEqual([
        "hackviser",
        "cisco-networking-academy",
        "ibm-skillsbuild",
        "global-ai-hub",
      ]);
      // A repeated heading means an entry was filed out of its run.
      expect(new Set(groups.map((group) => group.id)).size).toBe(groups.length);
      for (const group of groups) {
        for (const entry of group.entries) {
          expect(entry.group).toBe(group.id);
          expect(entry.issuer).toBe(group.issuer);
        }
      }
      expect(groups.flatMap((group) => group.entries).length).toBe(
        certificates[locale].length
      );
    }
  });

  it("orders each group newest first, attendance badges last", () => {
    for (const group of certificateGroupsFor("en")) {
      const assessed = group.entries.filter((entry) => !entry.participation);
      const attended = group.entries.filter((entry) => entry.participation);
      // The assessed run comes first, whole and unbroken.
      expect(group.entries).toEqual([...assessed, ...attended]);
      for (const run of [assessed, attended]) {
        const dates = run
          .map((entry) => entry.issued)
          .filter((issued): issued is NonNullable<typeof issued> =>
            Boolean(issued)
          );
        expect(dates, group.id).toEqual([...dates].sort().reverse());
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

  it("rejects a date that reads like a day but is not one", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-6-2")).toBe(false);
    expect(isIsoDate("June 2026")).toBe(false);
    expect(isIsoDate("2026-06-02")).toBe(true);
  });

  it("fails the build when a hostile link is cast past the type", () => {
    expect(() =>
      withCheckedCertificates({
        en: [
          {
            name: "Fake",
            issuer: "Fake",
            group: "hackviser",
            credentialCategory: "certificate",
            verifyUrl: "javascript:alert(1)" as HttpsUrl,
          },
        ],
        tr: [],
      })
    ).toThrow(/not https/);
  });

  it("fails the build on an unreadable date or stray artwork", () => {
    const base: CertificateEntry = {
      name: "Fake",
      issuer: "Fake",
      group: "hackviser",
      credentialCategory: "badge",
    };

    expect(() =>
      withCheckedCertificates({
        en: [{ ...base, issued: "2026-02-30" }],
        tr: [],
      })
    ).toThrow(/ISO calendar day/);

    expect(() =>
      withCheckedCertificates({
        en: [
          {
            ...base,
            badge: {
              src: "/fonts/geist.woff2" as CertificateBadge["src"],
              width: 340,
              height: 340,
              kind: "badge",
            },
          },
        ],
        tr: [],
      })
    ).toThrow(/outside \/images\/badges\//);

    expect(() =>
      withCheckedCertificates({
        en: [
          {
            ...base,
            badge: {
              src: "/images/badges/a.png",
              width: 0,
              height: 340,
              kind: "badge",
            },
          },
        ],
        tr: [],
      })
    ).toThrow(/intrinsic size/);
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
