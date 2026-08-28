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
      "npm run lint",
      "npm run typecheck",
      "npm run test",
      "npm run build",
      "npm run verify:routes",
      "npm run verify:links",
    ]) {
      expect(content).toContain(`run: ${command}`);
    }
  });

  it("lints the Dockerfile with a pinned hadolint image", () => {
    expect(workflow()).toContain("hadolint/hadolint:v2.15.1-alpine");
  });

  it("builds the image but never pushes it to a registry", () => {
    const content = workflow();
    expect(content).toContain("docker build");
    expect(content).not.toContain("docker push");
    expect(content).not.toContain("docker/login-action");
    expect(content).not.toContain("ghcr.io");
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
