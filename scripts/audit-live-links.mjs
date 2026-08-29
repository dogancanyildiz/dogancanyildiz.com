#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 15_000;

async function readJson(relativePath, hint) {
  try {
    return JSON.parse(await readFile(join(root, relativePath), "utf8"));
  } catch {
    console.error(`${relativePath} not found. ${hint}`);
    process.exit(1);
  }
}

function collectProjectLiveUrls(projects) {
  // No locale filter: en and tr are the same project translated, so the
  // same live URL appears under both, and the Map below already
  // deduplicates it. Filtering to "en" only meant a live link that existed
  // solely on the tr entry (a translation added without its en counterpart,
  // or vice versa) was never audited.
  /** @type {Map<string, string[]>} */
  const urls = new Map();
  for (const project of projects) {
    const live = project.links?.live;
    if (!live) continue;
    const sources = urls.get(live) ?? [];
    sources.push(`${project.locale}/projects/${project.slug}`);
    urls.set(live, sources);
  }
  return urls;
}

async function collectCertificateVerifyUrls() {
  /** @type {Map<string, string[]>} */
  const urls = new Map();
  let body;
  try {
    body = await readFile(join(root, "src/content/profile.ts"), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `src/content/profile.ts not readable, skipping certificate URLs (${message}).`
    );
    return urls;
  }
  const matches = [...body.matchAll(/verifyUrl:\s*"(https:\/\/[^"]+)"/g)];
  for (const match of matches) {
    const url = match[1];
    const sources = urls.get(url) ?? [];
    sources.push("certificates");
    urls.set(url, sources);
  }
  if (matches.length === 0) {
    console.log(
      "No certificate verifyUrl found in src/content/profile.ts (none filled in yet)."
    );
  }
  return urls;
}

/**
 * @param {string} url
 * @param {string} label
 */
async function checkUrl(url, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { Range: "bytes=0-0" },
      });
    }

    if (response.ok) {
      console.log(`ok  ${label} -> ${url}`);
      return true;
    }

    console.error(`fail ${label} -> ${url} (${response.status})`);
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`fail ${label} -> ${url} (${message})`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const projects = await readJson(
  ".velite/projects.json",
  "Run `npm run build:content` first."
);

/** @type {Map<string, string[]>} */
const urls = collectProjectLiveUrls(projects);
for (const [url, sources] of await collectCertificateVerifyUrls()) {
  const existing = urls.get(url) ?? [];
  urls.set(url, [...existing, ...sources]);
}

if (urls.size === 0) {
  console.log("No live demo or certificate verify URLs to audit.");
  process.exit(0);
}

let failed = 0;
for (const [url, sources] of urls) {
  const label = sources.join(", ");
  const ok = await checkUrl(url, label);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} URL(s) failed the trust link audit.`);
  process.exit(1);
}

console.log(`\nTrust link audit passed (${urls.size} URL(s)).`);
