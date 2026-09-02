import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/links.yml"), "utf8");

describe("links workflow", () => {
  it("never runs on pull_request or push", () => {
    const content = workflow();
    expect(content).not.toMatch(/^\s*pull_request:/m);
    expect(content).not.toMatch(/^\s*push:/m);
  });

  it("runs on a weekly schedule and can be triggered by hand", () => {
    const content = workflow();
    expect(content).toMatch(/schedule:\s*\n\s*(#.*\n\s*)?- cron:/);
    expect(content).toContain("workflow_dispatch:");
  });

  it("has a job and a step level timeout", () => {
    const content = workflow();
    expect(content).toMatch(/timeout-minutes: \d+/);
    // Both the job and the "Verify live links" step declare one.
    expect(content.match(/timeout-minutes: \d+/g)).toHaveLength(2);
  });

  it("retries verify:links instead of failing on the first hiccup", () => {
    const content = workflow();
    expect(content).toContain("npm run verify:links");
    expect(content).toMatch(/attempts=3/);
    expect(content).toMatch(/sleep "\$backoff"/);
  });

  it("pins every action to a commit sha with a version comment", () => {
    const content = workflow();
    const uses = [...content.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const use of uses) {
      expect(use, use).toMatch(/@[0-9a-f]{40}$/);
    }
    expect(content).toMatch(/@[0-9a-f]{40} # v\d/);
  });

  it("installs with --ignore-scripts, like ci.yml and the Dockerfile", () => {
    // F-075 hardened the install in ci.yml and the Dockerfile but left this
    // one on a bare "npm ci". Same package.json, same lifecycle script
    // surface, and this job runs unattended on a schedule, so it gets the
    // same treatment.
    const content = workflow();
    expect(content).toContain("npm ci --ignore-scripts");
    expect(content).toContain(
      "npm rebuild sharp esbuild @swc/core unrs-resolver @parcel/watcher"
    );
    expect(content).not.toMatch(/run: npm ci$/m);
  });

  it("grants read only repository access", () => {
    expect(workflow()).toMatch(/permissions:\s*\n\s*contents: read/);
  });
});
