import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const compose = () =>
  readFileSync(join(process.cwd(), "docker-compose.yml"), "utf8");

const envExample = () =>
  readFileSync(join(process.cwd(), ".env.example"), "utf8");

describe("docker-compose.yml", () => {
  it("threads the build metadata args through to the image", () => {
    const content = compose();
    expect(content).toMatch(
      /NEXT_PUBLIC_BUILD_SHA:\s*"\$\{NEXT_PUBLIC_BUILD_SHA:-\}"/
    );
    expect(content).toMatch(
      /NEXT_PUBLIC_BUILD_DATE:\s*"\$\{NEXT_PUBLIC_BUILD_DATE:-\}"/
    );
  });

  it("does not tag the local image after a closed phase", () => {
    const content = compose();
    const imageLine = content
      .split("\n")
      .find((line) => line.trim().startsWith("image:"));
    expect(imageLine).toBeDefined();
    expect(imageLine).not.toMatch(/faz\d/i);
  });

  it("keeps the runtime env vars unset by default so a local run never sends real mail", () => {
    const content = compose();
    for (const name of [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
    ]) {
      expect(content).toMatch(
        new RegExp(`${name}:\\s*"\\$\\{${name}:-\\}"`)
      );
    }
  });
});

describe(".env.example", () => {
  it("documents the build metadata variables the compose file and CI pass through", () => {
    const content = envExample();
    expect(content).toMatch(/^NEXT_PUBLIC_BUILD_SHA=$/m);
    expect(content).toMatch(/^NEXT_PUBLIC_BUILD_DATE=$/m);
  });
});
