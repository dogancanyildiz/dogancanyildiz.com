import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dockerfile = () =>
  readFileSync(join(process.cwd(), "Dockerfile"), "utf8");

describe("Dockerfile", () => {
  it("declares the three build stages in order", () => {
    const content = dockerfile();
    const depsIndex = content.indexOf("FROM node:24-alpine AS deps");
    const builderIndex = content.indexOf("FROM node:24-alpine AS builder");
    const runnerIndex = content.indexOf("FROM node:24-alpine AS runner");

    expect(depsIndex).toBeGreaterThan(-1);
    expect(builderIndex).toBeGreaterThan(depsIndex);
    expect(runnerIndex).toBeGreaterThan(builderIndex);
  });

  it("installs dependencies from the lockfile with npm ci", () => {
    expect(dockerfile()).toMatch(/RUN npm ci/);
    expect(dockerfile()).not.toMatch(/npm install/);
  });

  it("uses npm run build as the single build entry point", () => {
    expect(dockerfile()).toMatch(/RUN npm run build/);
  });

  it("accepts NEXT_PUBLIC_SITE_URL as a build argument", () => {
    const content = dockerfile();
    expect(content).toMatch(/^ARG NEXT_PUBLIC_SITE_URL$/m);
    expect(content).not.toMatch(/ARG NEXT_PUBLIC_SITE_URL=/);
    expect(content).toMatch(/ENV NEXT_PUBLIC_SITE_URL=\$NEXT_PUBLIC_SITE_URL/);
  });

  it("never bakes a runtime secret into an image layer", () => {
    const content = dockerfile();
    for (const secret of [
      "RESEND_API_KEY",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
      "GATUS_URL",
    ]) {
      expect(content).not.toContain(secret);
    }
  });

  it("copies only the standalone output, static assets and public", () => {
    const content = dockerfile();
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/.next/standalone ./"
    );
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/.next/static ./.next/static"
    );
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/public ./public"
    );
  });

  it("runs as the built in non root node user", () => {
    expect(dockerfile()).toMatch(/^USER node$/m);
  });

  it("binds to every interface on port 3000", () => {
    const content = dockerfile();
    expect(content).toMatch(/^ENV PORT=3000$/m);
    expect(content).toMatch(/^ENV HOSTNAME=0\.0\.0\.0$/m);
    expect(content).toMatch(/^EXPOSE 3000$/m);
  });

  it("starts the standalone server directly, not through npm", () => {
    const content = dockerfile();
    expect(content).toContain('CMD ["node", "server.js"]');
    expect(content).not.toContain("npm start");
  });

  it("declares a health check with a start period for coolify#7500", () => {
    const content = dockerfile();
    expect(content).toMatch(/HEALTHCHECK .*--start-period=30s/);
    expect(content).toContain("/api/health");
  });
});
