import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const COOLIFY = "docs/deploy/coolify-kurulum.md";
const README = "README.md";

describe("deploy checklists match the shipped behaviour", () => {
  describe("NEXT_PUBLIC_SITE_URL build argument", () => {
    // The Dockerfile ARG lost its default in fc470e0, so a build without the
    // argument fails in resolveSiteUrl while prerendering /robots.txt. Any
    // checklist still promising a silent undefined sends the owner to the
    // wrong place to debug a failed Coolify build.
    it.each([COOLIFY, README])(
      "%s does not promise a silent undefined value",
      (path) => {
        const doc = readDoc(path);
        expect(doc).not.toMatch(/sessizce `undefined` kalır/);
        expect(doc).not.toMatch(/leaves it undefined in production/);
      }
    );

    it.each([COOLIFY, README])(
      "%s names resolveSiteUrl as the failure mode",
      (path) => {
        expect(readDoc(path)).toMatch(/resolveSiteUrl/);
      }
    );
  });

  describe("health check expectation", () => {
    // src/app/api/health/route.ts answers with status, uptime and timestamp.
    // A checklist that prints the body as a literal makes a healthy deploy
    // look broken at the gate that blocks going to production.
    const HANDOFF = "docs/plans/handoffs/faz-1.md";

    it.each([COOLIFY, HANDOFF])(
      "%s does not expect a literal {status:ok} body",
      (path) => {
        expect(readDoc(path)).not.toMatch(/200 `?\{"status":"ok"\}`?/);
      }
    );

    it("the Coolify checklist names uptime and timestamp as varying fields", () => {
      const doc = readDoc(COOLIFY);
      expect(doc).toMatch(/uptime/);
      expect(doc).toMatch(/timestamp/);
    });
  });

  describe("Traefik middleware labels", () => {
    // Coolify derives router names from the application uuid (http-0-<uuid>,
    // https-0-<uuid>). A label written on a router that has no rule is
    // silently ignored by Traefik, which would ship the site without HSTS.
    const TRAEFIK = "docs/deploy/traefik-ve-origin.md";
    const CHECKLIST = "docs/plans/handoffs/faz-1-manual-checklist.md";

    it.each([TRAEFIK, CHECKLIST])(
      "%s never targets a router named portfolio",
      (path) => {
        expect(readDoc(path)).not.toMatch(/routers\.portfolio/);
      }
    );

    it.each([TRAEFIK, CHECKLIST])(
      "%s uses the generated router name and keeps the existing value",
      (path) => {
        const doc = readDoc(path);
        expect(doc).toMatch(/routers\.https-0-<uuid>\.middlewares/);
        expect(doc).toMatch(/security-headers@file,compress@file/);
      }
    );

    it("the Traefik checklist warns against deleting generated labels", () => {
      expect(readDoc(TRAEFIK)).toMatch(/silinmez/);
    });
  });
});
