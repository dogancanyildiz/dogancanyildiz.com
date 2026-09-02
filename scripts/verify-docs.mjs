#!/usr/bin/env node
// Doc consistency checks that used to live in tests/docs/ and
// tests/deploy/deploy-docs.test.ts. They lock prose against the shipped
// behaviour it describes (domain redirect direction, deploy checklist
// wording), not against application code, so they run as a plain script
// instead of a vitest suite: a doc going stale is not the kind of failure a
// developer needs surfaced on every `npm run test` inner loop, but it must
// still fail CI. Run with `npm run verify:docs`.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const problems = [];

/** @param {string} relativePath */
function readDoc(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

/**
 * @param {boolean} condition
 * @param {string} message
 */
function check(condition, message) {
  if (!condition) problems.push(message);
}

// ---------------------------------------------------------------------------
// Domain redirect direction: the owner's 2026-08-27 decision made
// dogancanyildiz.com primary, with dogancanyildiz.sh only 301ing to it. Any
// document describing the reverse hop is a leftover from the superseded
// decision, except docs/plans/ (execution records written while .sh was
// still primary, each carrying its own historical-assumption note).
// ---------------------------------------------------------------------------

const HISTORICAL_TREES = ["docs/plans"];
const HISTORICAL_MARKER = /Karar değişikliği|tarihsel/i;
const REVERSED_DIRECTION =
  /(dogancanyildiz)?\.com\s*(->|→)\s*(dogancanyildiz)?\.sh|com to sh/;

/** @param {string} dir */
function markdownFiles(dir) {
  const found = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (HISTORICAL_TREES.includes(path)) continue;
      found.push(...markdownFiles(path));
    } else if (entry.name.endsWith(".md")) {
      found.push(path);
    }
  }
  return found;
}

function checkDomainDirection() {
  const files = markdownFiles("docs");

  check(
    files.includes("docs/README.md"),
    "docs/README.md not found while collecting decision documents"
  );
  check(
    files.includes("docs/10-yol-haritasi.md"),
    "docs/10-yol-haritasi.md not found while collecting decision documents"
  );
  check(
    files.includes("docs/launch-checklist.md"),
    "docs/launch-checklist.md not found while collecting decision documents"
  );

  for (const file of files) {
    const lines = readFileSync(join(root, file), "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!REVERSED_DIRECTION.test(line)) return;
      if (HISTORICAL_MARKER.test(line)) return;
      problems.push(
        `${file}:${index + 1}: states the .com -> .sh direction without a ` +
          `historical marker: ${line.trim()}`
      );
    });
  }

  const checklist = readDoc("docs/launch-checklist.md");
  check(
    // The 2026-09-02 decision made www the canonical host: the .sh redirect's
    // final hop is now www.dogancanyildiz.com, so the www. prefix is optional
    // here on purpose, not a loosening of the direction check itself.
    /dogancanyildiz\.sh -> (www\.)?dogancanyildiz\.com/.test(checklist),
    "docs/launch-checklist.md does not state the .sh -> .com redirect"
  );

  const indexRow = readDoc("docs/README.md")
    .split("\n")
    .find((line) => line.includes("launch-checklist.md"));
  check(
    indexRow !== undefined && /\.sh -> \.com 301/.test(indexRow),
    "docs/README.md's launch-checklist.md row does not agree on the .sh -> .com direction"
  );

  // The 2026-09-02 decision made www the canonical host, with the apex
  // 301ing to it at the edge. Nothing in the application can observe that
  // hop, so the checklist the owner types into the Cloudflare panel is the
  // only place it is written down: without a guard a later edit could flip
  // the direction back to www -> apex and no gate would notice.
  {
    const cloudflare = readDoc(CLOUDFLARE);
    check(
      /apex to www/.test(cloudflare),
      `${CLOUDFLARE} does not name the apex to www redirect rule`
    );
    check(
      /http\.host eq "dogancanyildiz\.com"/.test(cloudflare),
      `${CLOUDFLARE} does not filter the apex to www rule on the apex host`
    );
  }

  const roadmap = readDoc("docs/10-yol-haritasi.md");
  check(
    /curl -I https:\/\/dogancanyildiz\.sh[^\n]*dogancanyildiz\.com/.test(
      roadmap
    ),
    "docs/10-yol-haritasi.md's curl check does not show the .sh -> .com redirect"
  );
  check(
    /Karar: `\.sh -> \.com` 301 Cloudflare Redirect Rule/.test(roadmap),
    "docs/10-yol-haritasi.md does not record the .sh -> .com redirect decision"
  );

  // Guards the exclusion above: if the historical tree ever loses its note
  // the blanket skip stops being justified.
  for (const file of [
    "docs/plans/README.md",
    "docs/plans/handoffs/README.md",
  ]) {
    const doc = readDoc(file);
    check(
      /Domain varsayımı notu/.test(doc),
      `${file} no longer marks its domain assumption as historical`
    );
    check(
      /`\.com`|dogancanyildiz\.com/.test(doc),
      `${file}'s historical note no longer names dogancanyildiz.com`
    );
  }
}

// ---------------------------------------------------------------------------
// Locale scheme: the 2026-08-30 decision flipped the default locale to
// Turkish (TR at the root, EN under /en). A document still describing the
// original English-at-root scheme as the current one, with no marker that
// the direction reversed, sends a reader to build against a routing table
// that no longer exists. Same shape as the domain check above: a stale
// pattern, a historical-marker exception, docs/plans/** excluded (it is a
// record of what was true when each phase ran, not a living document).
// ---------------------------------------------------------------------------

const STALE_LOCALE_SCHEME =
  /İngilizce (kökte|varsayılan)|EN kökte|EN prefix'siz|İngilizce prefix'siz/;

function checkLocaleScheme() {
  const files = [...markdownFiles("docs"), README];

  for (const file of files) {
    const lines = readFileSync(join(root, file), "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!STALE_LOCALE_SCHEME.test(line)) return;
      if (HISTORICAL_MARKER.test(line)) return;
      problems.push(
        `${file}:${index + 1}: describes the pre-2026-08-30 locale scheme ` +
          `(English at the root) as current, with no historical marker: ${line.trim()}`
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Deploy checklists match the shipped behaviour.
// ---------------------------------------------------------------------------

const COOLIFY = "docs/deploy/coolify-kurulum.md";
const README = "README.md";
const TRAEFIK = "docs/deploy/traefik-ve-origin.md";
const CLOUDFLARE = "docs/deploy/cloudflare-kurulum.md";
const FAZ1_CHECKLIST = "docs/plans/handoffs/faz-1-manual-checklist.md";
const FAZ1_HANDOFF = "docs/plans/handoffs/faz-1.md";

function checkDeployDocs() {
  // The Dockerfile ARG lost its default in fc470e0, so a build without the
  // argument fails in resolveSiteUrl while prerendering /robots.txt. Any
  // checklist still promising a silent undefined sends the owner to the
  // wrong place to debug a failed Coolify build.
  for (const path of [COOLIFY, README]) {
    const doc = readDoc(path);
    check(
      !/sessizce `undefined` kalır/.test(doc),
      `${path} still promises a silent undefined NEXT_PUBLIC_SITE_URL`
    );
    check(
      !/leaves it undefined in production/.test(doc),
      `${path} still promises a silent undefined NEXT_PUBLIC_SITE_URL`
    );
    check(
      /resolveSiteUrl/.test(doc),
      `${path} does not name resolveSiteUrl as the failure mode`
    );
  }

  // src/app/api/health/route.ts answers with status, checks and timestamp
  // (uptime left the body on 2026-08-28). A checklist that prints the body as
  // a literal makes a healthy deploy look broken at the gate that blocks
  // going to production.
  for (const path of [COOLIFY, FAZ1_HANDOFF]) {
    check(
      !/200 `?\{"status":"ok"\}`?/.test(readDoc(path)),
      `${path} expects a literal {"status":"ok"} health check body`
    );
  }
  {
    const doc = readDoc(COOLIFY);
    check(/checks/.test(doc), `${COOLIFY} does not name checks as a field`);
    check(
      /timestamp/.test(doc),
      `${COOLIFY} does not name timestamp as a field`
    );
    check(
      !/"uptime"/.test(doc),
      `${COOLIFY} still documents the retired uptime field`
    );
  }

  // Coolify derives router names from the application uuid
  // (http-0-<uuid>, https-0-<uuid>). A label written on a router that has no
  // rule is silently ignored by Traefik, which would ship the site without
  // HSTS.
  for (const path of [TRAEFIK, FAZ1_CHECKLIST]) {
    const doc = readDoc(path);
    check(
      !/routers\.portfolio/.test(doc),
      `${path} still targets a router literally named portfolio`
    );
    check(
      /routers\.https-0-<uuid>\.middlewares/.test(doc),
      `${path} does not use the generated https-0-<uuid> router name`
    );
    check(
      /security-headers@file,compress@file/.test(doc),
      `${path} does not keep the existing security-headers/compress middlewares`
    );
  }
  check(
    /silinmez/.test(readDoc(TRAEFIK)),
    `${TRAEFIK} does not warn against deleting the generated labels`
  );

  // Coolify publishes the Traefik ports, so Docker DNATs them into FORWARD
  // while ufw only filters INPUT. An allowlist written in ufw alone leaves
  // the origin open to the whole internet while the checklist ticks the box
  // that gates TRUST_CF_CONNECTING_IP=true.
  for (const path of [TRAEFIK, FAZ1_CHECKLIST]) {
    const doc = readDoc(path);
    check(
      /DOCKER-USER/.test(doc),
      `${path} does not restrict the published ports through DOCKER-USER`
    );
    check(
      !/ufw allow from/.test(doc),
      `${path} allowlists 80/443 in ufw, which Docker's FORWARD chain bypasses`
    );
  }
  {
    const doc = readDoc(TRAEFIK);
    check(
      /ufw tek başına 80 ve 443'ü kapatmaz/.test(doc),
      `${TRAEFIK} does not state that ufw alone does not close 80/443`
    );
    check(/FORWARD/.test(doc), `${TRAEFIK} does not mention the FORWARD chain`);
    check(
      /netfilter-persistent/.test(doc),
      `${TRAEFIK} does not mention netfilter-persistent`
    );
  }

  // A loop that sends CF-Connecting-IP through Cloudflare cannot fail: the
  // edge overwrites the header and the edge rate limiting rule answers 429 on
  // its own. It proves nothing while gating the flag that decides whether the
  // contact rate limit can be bypassed.
  for (const path of [TRAEFIK, FAZ1_CHECKLIST]) {
    check(
      !/-H "CF-Connecting-IP: 203\.0\.113/.test(readDoc(path)),
      `${path} sends a spoofed CF-Connecting-IP header through Cloudflare as proof`
    );
  }
  {
    const doc = readDoc(TRAEFIK);
    check(
      /rate limiting kuralı \(10 saniyede 3 istek\)/.test(doc),
      `${TRAEFIK} does not explain the edge rate limiting rule`
    );
    check(/ClientHost/.test(doc), `${TRAEFIK} does not mention ClientHost`);
    check(/retry-after/.test(doc), `${TRAEFIK} does not mention retry-after`);
  }
}

checkDomainDirection();
checkLocaleScheme();
checkDeployDocs();

if (problems.length > 0) {
  console.error("Doc verification failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Doc verification passed (${markdownFiles("docs").length} files scanned).`
);
