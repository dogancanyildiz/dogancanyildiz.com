import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

describe("ci workflow", () => {
  it("runs on pull requests and on pushes to dev and main", () => {
    const content = workflow();
    expect(content).toMatch(/pull_request:\s*\n\s*branches: \[dev, main\]/);
    expect(content).toMatch(/push:\s*\n\s*branches: \[dev, main\]/);
  });

  it("keeps the job names branch protection binds its required checks to", () => {
    const content = workflow();
    expect(content).toContain("name: Quality checks");
    expect(content).toContain("name: Docker image");
  });

  it("pins the node version through .nvmrc", () => {
    expect(workflow()).toContain('node-version-file: ".nvmrc"');
  });

  it("runs every quality gate script", () => {
    const content = workflow();
    for (const command of [
      "npm ci",
      "npm run format",
      "npm run lint",
      "npm run typecheck",
      "npm run test -- --coverage",
      "npm run verify:docs",
      "npm run build:app",
      "npm run verify:routes",
    ]) {
      expect(content).toContain(`run: ${command}`);
    }
  });

  it("never runs verify:links as part of the merge gate", () => {
    // Moved to .github/workflows/links.yml: a third party outage should not
    // block every merge to dev or main. See tests/deploy/links-workflow.test.ts.
    expect(workflow()).not.toContain("verify:links");
  });

  it("compiles content once and never re-runs velite inside next build", () => {
    const content = workflow();
    expect(content).toContain("run: npm run build:content");
    // build:app is "next build" alone; the full "build" script (velite &&
    // next build) would compile the same MDX a second time here.
    expect(content).not.toMatch(/run: npm run build\n/);
  });

  it("audits production dependencies and reviews PR dependency changes", () => {
    const content = workflow();
    expect(content).toContain("run: npm audit --omit=dev --audit-level=high");
    expect(content).toContain("dependency-review-action");
    expect(content).toContain("fail-on-severity: high");
    expect(content).toMatch(
      /if: github\.event_name == 'pull_request'\s*\n\s*uses: actions\/dependency-review-action/
    );
  });

  it("runs the audit as the last checks step, tolerating its known-red result", () => {
    // The audit is expected to fail until velite (owned outside this
    // cluster) drops its sub-0.35.0 sharp dependency. continue-on-error
    // keeps that from failing the required check; placing it after every
    // other step keeps lint/typecheck/test/build feedback visible in the
    // log regardless of the audit's outcome.
    const content = workflow();
    const auditIndex = content.indexOf("run: npm audit --omit=dev");
    const testIndex = content.indexOf("run: npm run test");
    const buildIndex = content.indexOf("run: npm run build:app");
    expect(auditIndex).toBeGreaterThan(testIndex);
    expect(auditIndex).toBeGreaterThan(buildIndex);
    expect(content).toMatch(
      /run: npm audit --omit=dev --audit-level=high\s*\n\s*continue-on-error: true/
    );
  });

  it("lints the Dockerfile with a digest pinned hadolint image", () => {
    const content = workflow();
    expect(content).not.toContain("hadolint/hadolint:v2.15.1-alpine");
    expect(content).toMatch(/hadolint\/hadolint@sha256:[a-f0-9]{64}/);
  });

  it("builds the image through buildx with a cache, but never pushes it", () => {
    const content = workflow();
    expect(content).toContain("docker/build-push-action");
    expect(content).toContain("docker/setup-buildx-action");
    expect(content).toContain("push: false");
    expect(content).toContain("load: true");
    expect(content).toContain("cache-from: type=gha");
    expect(content).toContain("cache-to: type=gha,mode=max");
    expect(content).not.toContain("docker push");
    expect(content).not.toContain("docker/login-action");
    expect(content).not.toContain("ghcr.io");
  });

  it("runs the built image, waits for it to report healthy, and probes it", () => {
    const content = workflow();
    expect(content).toContain("docker run -d --name portfolio-smoke");
    expect(content).toMatch(
      /docker inspect --format '\{\{\.State\.Health\.Status\}\}'/
    );
    expect(content).toContain("curl -fsS http://127.0.0.1:3131/api/health");
    expect(content).toMatch(
      /docker inspect --format '\{\{json \.Config\.Healthcheck\}\}'/
    );
    expect(content).toContain('if [ "$config" = "null" ]');
  });

  it("always removes the smoke container, even after a failed step", () => {
    const content = workflow();
    expect(content).toMatch(
      /if: always\(\)\s*\n\s*run: docker rm -f portfolio-smoke/
    );
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

  it("has a timeout on every job", () => {
    const content = workflow();
    // Split on top level "  <job-id>:" lines (two-space indent under
    // "jobs:") so a job added without its own timeout-minutes is caught,
    // rather than just counting timeout-minutes anywhere in the file.
    const jobBodies = content
      .split(/\n(?=  [a-zA-Z0-9_-]+:\n)/)
      .filter((block) => /^  [a-zA-Z0-9_-]+:\n {4}name:/.test(block));
    expect(jobBodies.length).toBeGreaterThanOrEqual(2);
    for (const job of jobBodies) {
      const jobName = job.match(/name: (.+)/)?.[1] ?? "unknown job";
      expect(job, jobName).toMatch(/\n {4}timeout-minutes: \d+/);
    }
  });

  it("grants the workflow read only repository access", () => {
    expect(workflow()).toMatch(/permissions:\s*\n\s*contents: read/);
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
});
