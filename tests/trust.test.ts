import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { testimonials } from "@/content/testimonials";
import { siteConfig } from "@/lib/site-config";
import { buildInfo, formatBuildSha } from "@/lib/build-info";

const en = JSON.parse(
  readFileSync(join(process.cwd(), "messages/en.json"), "utf8")
) as { brand: { name: string } };
const tr = JSON.parse(
  readFileSync(join(process.cwd(), "messages/tr.json"), "utf8")
) as { brand: { name: string } };

const personJsonLd = () =>
  readFileSync(
    join(process.cwd(), "src/components/seo/person-jsonld.tsx"),
    "utf8"
  );

const auditScript = () =>
  readFileSync(join(process.cwd(), "scripts/audit-live-links.mjs"), "utf8");

// verify:links runs on its own schedule (.github/workflows/links.yml), not
// inside ci.yml: a third party outage should not block every merge.
const linksWorkflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/links.yml"), "utf8");

describe("trust signals", () => {
  it("keeps the visible brand name aligned with Person schema name", () => {
    expect(en.brand.name).toBe(siteConfig.person.name);
    expect(tr.brand.name).toBe(siteConfig.person.name);
  });

  it("models testimonial placeholders as empty locale arrays", () => {
    expect(testimonials.en).toEqual([]);
    expect(testimonials.tr).toEqual([]);
  });

  it("extends Person JSON-LD with machine-readable trust fields", () => {
    const source = personJsonLd();
    for (const field of ["knowsAbout", "alumniOf", "worksFor", "image"]) {
      expect(source).toContain(field);
    }
    expect(source).toContain("profileImagePath()");
    expect(source).toContain("sameAs: [...siteConfig.person.sameAs]");
    expect(source).not.toContain("telephone");
    expect(source).not.toContain("WHATSAPP_NUMBER");
    expect(source).not.toContain("905543828000");
  });

  it("ships a live link audit script wired into automation", () => {
    expect(auditScript()).toContain("projects.json");
    expect(auditScript()).toContain("verifyUrl");
    expect(linksWorkflow()).toContain("npm run verify:links");
  });

  it("exposes optional build metadata for the footer", () => {
    expect(typeof buildInfo.sha).toBe("string");
    expect(typeof buildInfo.date).toBe("string");
    expect(formatBuildSha("abcdef123456")).toBe("abcdef1");
  });
});

describe("trust maintenance docs", () => {
  it("documents quarterly link audit and Search Console checks", () => {
    const doc = readFileSync(
      join(process.cwd(), "docs/trust-maintenance-checklist.md"),
      "utf8"
    );
    expect(doc).toContain("verify:links");
    expect(doc).toContain("Search Console");
    expect(doc).toContain("üç ay");
  });
});
