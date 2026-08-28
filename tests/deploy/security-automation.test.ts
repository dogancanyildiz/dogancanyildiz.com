import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dependency and code scanning", () => {
  it("replaced renovate with dependabot", () => {
    expect(existsSync(join(process.cwd(), "renovate.json"))).toBe(false);
    const content = read(".github/dependabot.yml");
    expect(content).toMatch(/^version: 2/m);
    for (const ecosystem of ["npm", "github-actions", "docker"]) {
      expect(content).toContain(`package-ecosystem: ${ecosystem}`);
    }
  });

  it("targets dev and never merges on its own", () => {
    const content = read(".github/dependabot.yml");
    expect(content.match(/target-branch: dev/g)).toHaveLength(3);
    expect(content).not.toContain("automerge");
  });

  it("keeps framework majors and the velite pin out of automatic bumps", () => {
    const content = read(".github/dependabot.yml");
    expect(content).toMatch(
      /dependency-name: next\s*\n\s*update-types: \[version-update:semver-major\]/
    );
    expect(content).toMatch(/dependency-name: velite\s*$/m);
  });

  it("runs codeql on pull requests, pushes and a weekly schedule", () => {
    const content = read(".github/workflows/codeql.yml");
    expect(content).toMatch(/pull_request:\s*\n\s*branches: \[dev, main\]/);
    expect(content).toMatch(/push:\s*\n\s*branches: \[dev, main\]/);
    expect(content).toMatch(/schedule:\s*\n\s*(#.*\n\s*)?- cron:/);
    expect(content).toContain("languages: javascript-typescript");
    expect(content).toContain("security-events: write");
    expect(content).toContain("name: CodeQL analysis");
  });
});

describe("security contact", () => {
  it("serves an RFC 9116 security.txt that has not expired", () => {
    const content = read("public/.well-known/security.txt");
    expect(content).toContain("Contact: mailto:me@dogancanyildiz.com");
    expect(content).toContain(
      "Canonical: https://dogancanyildiz.com/.well-known/security.txt"
    );
    const expires = content.match(/^Expires: (.+)$/m)?.[1];
    expect(expires).toBeDefined();
    const expiresAt = new Date(expires as string).getTime();
    expect(Number.isNaN(expiresAt)).toBe(false);
    // Renew before it lapses; the test fails 30 days ahead as a reminder.
    expect(expiresAt - Date.now()).toBeGreaterThan(30 * 24 * 60 * 60 * 1000);
  });

  it("uses the same address as the site and the policy", () => {
    const site = read("src/lib/site.ts");
    const policy = read("SECURITY.md");
    const email = site.match(/CONTACT_EMAIL_PUBLIC = "([^"]+)"/)?.[1];
    expect(email).toBe("me@dogancanyildiz.com");
    expect(policy).toContain(email as string);
    expect(read("public/.well-known/security.txt")).toContain(email as string);
  });
});

describe("license", () => {
  it("has a root LICENSE that splits code from content", () => {
    const content = read("LICENSE");
    expect(content).toMatch(/^MIT License/);
    expect(content).toContain("content/");
    expect(content).toContain("public/cv/");
    const pkg = JSON.parse(read("package.json")) as { license?: string };
    expect(pkg.license).toBe("MIT");
  });
});
