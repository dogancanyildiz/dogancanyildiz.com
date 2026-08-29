import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/release.yml"), "utf8");

describe("release workflow", () => {
  it("waits for CI to succeed on main instead of reacting to the push directly", () => {
    const content = workflow();
    expect(content).toMatch(/workflow_run:\s*\n\s*workflows: \[CI\]/);
    expect(content).toContain("types: [completed]");
    expect(content).toMatch(/branches: \[main\]/);
    expect(content).not.toMatch(/^\s*push:/m);
    expect(content).toContain("workflow_dispatch:");
    expect(content).toMatch(/inputs:\s*\n\s*version:/);
  });

  it("only releases a workflow_dispatch from main or a green CI run on main", () => {
    const content = workflow();
    expect(content).toContain(
      "(github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')"
    );
    expect(content).toContain(
      "(github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.head_branch == 'main')"
    );
  });

  it("has a job level timeout", () => {
    expect(workflow()).toMatch(/timeout-minutes: \d+/);
  });

  it("asks for exactly the write scopes it uses", () => {
    expect(workflow()).toMatch(
      /permissions:\s*\n\s*contents: write\s*\n\s*pull-requests: write/
    );
  });

  it("resolves RELEASE_SHA to the commit CI verified, not the workflow's own ref", () => {
    const content = workflow();
    expect(content).toContain(
      "RELEASE_SHA: ${{ github.event.workflow_run.head_sha || github.sha }}"
    );
    expect(content).toContain("ref: ${{ env.RELEASE_SHA }}");
  });

  it("checks out the full history so the last tag is reachable", () => {
    const content = workflow();
    expect(content).toMatch(/actions\/checkout@[0-9a-f]{40} # v\d/);
    expect(content).toContain("fetch-depth: 0");
    expect(content).toMatch(/actions\/setup-node@[0-9a-f]{40} # v\d/);
    expect(content).toContain('node-version-file: ".nvmrc"');
  });

  it("pins every action to a commit sha", () => {
    const content = workflow();
    const uses = [...content.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) {
      expect(use, use).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it("derives the version from the release script", () => {
    expect(workflow()).toContain("node scripts/release-version.mjs");
  });

  it("tags the released commit as github-actions[bot] and publishes it", () => {
    const content = workflow();
    expect(content).toContain('git config user.name "github-actions[bot]"');
    expect(content).toContain('git tag -a "$TAG" -m "$TAG" "$RELEASE_SHA"');
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
