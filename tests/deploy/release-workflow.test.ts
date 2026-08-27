import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/release.yml"), "utf8");

describe("release workflow", () => {
  it("runs on pushes to main and on demand", () => {
    const content = workflow();
    expect(content).toMatch(/push:\s*\n\s*branches: \[main\]/);
    expect(content).toContain("workflow_dispatch:");
    expect(content).toMatch(/inputs:\s*\n\s*version:/);
    expect(content).toContain("if: github.ref == 'refs/heads/main'");
  });

  it("asks for exactly the write scopes it uses", () => {
    expect(workflow()).toMatch(
      /permissions:\s*\n\s*contents: write\s*\n\s*pull-requests: write/
    );
  });

  it("checks out the full history so the last tag is reachable", () => {
    const content = workflow();
    expect(content).toContain("actions/checkout@v7");
    expect(content).toContain("fetch-depth: 0");
    expect(content).toContain("actions/setup-node@v7");
    expect(content).toContain('node-version-file: ".nvmrc"');
  });

  it("derives the version from the release script", () => {
    expect(workflow()).toContain("node scripts/release-version.mjs");
  });

  it("tags the released commit as github-actions[bot] and publishes it", () => {
    const content = workflow();
    expect(content).toContain('git config user.name "github-actions[bot]"');
    expect(content).toContain('git tag -a "$TAG" -m "$TAG" "$GITHUB_SHA"');
    expect(content).toContain('git push origin "refs/tags/$TAG"');
    expect(content).toContain('gh release create "$TAG"');
    expect(content).toContain("--notes-file");
  });

  it("syncs the version back through a pull request instead of pushing to main", () => {
    const content = workflow();
    expect(content).toContain('branch="release/sync-$TAG"');
    expect(content).toContain("--base dev");
    expect(content).toContain(
      'git commit -m "chore(release): sync version $TAG"'
    );
    expect(content).not.toMatch(/git push[^\n]*origin[^\n]*\bmain\b/);
  });

  it("passes the dispatch input through the environment, never inline", () => {
    const content = workflow();
    expect(content).toContain("VERSION_INPUT: ${{ inputs.version }}");
    expect(content).not.toContain("--version ${{ inputs.version }}");
  });

  it("does not reference any runtime secret", () => {
    const content = workflow();
    for (const secret of [
      "RESEND_API_KEY",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
      "GATUS_URL",
    ]) {
      expect(content).not.toContain(secret);
    }
  });

  it("leaves no ai attribution in what it writes", () => {
    const content = workflow().toLowerCase();
    for (const marker of ["co-authored-by", "generated with", "claude"]) {
      expect(content).not.toContain(marker);
    }
  });
});
