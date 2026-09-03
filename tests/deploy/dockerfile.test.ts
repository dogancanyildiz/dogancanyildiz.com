import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dockerfile = () =>
  readFileSync(join(process.cwd(), "Dockerfile"), "utf8");

// A pinned node:24-alpine digest, shared by all three FROM lines and the
// stage order assertion below.
const BASE_IMAGE = /node:24-alpine@sha256:[a-f0-9]{64}/;

describe("Dockerfile", () => {
  it("pins the base image to a digest, not a floating tag", () => {
    const content = dockerfile();
    expect(content).not.toMatch(/^FROM node:24-alpine\s/m);
    expect(content).not.toMatch(/^FROM node:24-alpine$/m);
    expect(BASE_IMAGE.test(content)).toBe(true);
  });

  it("declares the three build stages in order, all on the same digest", () => {
    const content = dockerfile();
    const stage = (name: string) => {
      const match = content.match(
        new RegExp(
          `^FROM (node:24-alpine@sha256:[a-f0-9]{64}) AS ${name}$`,
          "m"
        )
      );
      expect(match, `stage ${name} not found`).not.toBeNull();
      return match as RegExpMatchArray;
    };

    const deps = stage("deps");
    const builder = stage("builder");
    const runner = stage("runner");

    expect(deps.index).toBeGreaterThan(-1);
    expect(builder.index).toBeGreaterThan(deps.index as number);
    expect(runner.index).toBeGreaterThan(builder.index as number);
    // Same pin in every stage: a partially bumped digest would leave stages
    // built from different base images without anyone noticing.
    expect(builder[1]).toBe(deps[1]);
    expect(runner[1]).toBe(deps[1]);
  });

  it("installs dependencies from the lockfile with npm ci", () => {
    expect(dockerfile()).toMatch(
      /RUN --mount=type=cache,target=\/root\/\.npm npm ci/
    );
    expect(dockerfile()).not.toMatch(/npm install/);
  });

  it("installs with --ignore-scripts and rebuilds only the native addons that need it", () => {
    // F-075: a plain "npm ci" runs every dependency's install/postinstall
    // script unreviewed. --ignore-scripts skips all of them, then "npm
    // rebuild" explicitly reruns it for just the packages that carry one
    // (native addons whose prebuilt binary otherwise resolves through a
    // platform specific optionalDependency, verified end to end against this
    // image: see the comment above this RUN line).
    const content = dockerfile();
    expect(content).toContain("npm ci --no-audit --no-fund --ignore-scripts");
    expect(content).toContain(
      "npm rebuild sharp esbuild @swc/core unrs-resolver @parcel/watcher"
    );
  });

  it("uses npm run build as the single build entry point", () => {
    // The NEXT_PUBLIC_BUILD_DATE fallback prefixes this RUN line with an
    // inline shell assignment, so the entry point is asserted as a suffix
    // rather than a standalone "RUN npm run build" line.
    expect(dockerfile()).toMatch(/npm run build$/m);
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
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
    ]) {
      expect(content).not.toContain(secret);
    }
  });

  it("carries every optional public build variable through the builder stage", () => {
    const content = dockerfile();
    for (const name of [
      "NEXT_PUBLIC_BUILD_DATE",
      "NEXT_PUBLIC_STATUS_URL",
      "UMAMI_SCRIPT_URL",
      "UMAMI_WEBSITE_ID",
    ]) {
      // Without the ARG line Docker discards the --build-arg Coolify passes,
      // and without the matching ENV line next build never sees the value:
      // the feature it feeds then stays silently disabled in production.
      expect(content).toMatch(new RegExp(`^ARG ${name}`, "m"));
      expect(content).toMatch(new RegExp(`^ENV ${name}=\\$${name}$`, "m"));
    }
  });

  it("falls back NEXT_PUBLIC_BUILD_SHA to Coolify's SOURCE_COMMIT build-arg", () => {
    const content = dockerfile();
    // Coolify passes SOURCE_COMMIT into every Dockerfile build automatically,
    // so an empty NEXT_PUBLIC_BUILD_SHA still resolves to a real commit
    // without anything entered in the Coolify UI.
    expect(content).toMatch(/^ARG NEXT_PUBLIC_BUILD_SHA$/m);
    expect(content).toMatch(/^ARG SOURCE_COMMIT=""$/m);
    expect(content).toMatch(
      /^ENV NEXT_PUBLIC_BUILD_SHA=\$\{NEXT_PUBLIC_BUILD_SHA:-\$SOURCE_COMMIT\}$/m
    );
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
