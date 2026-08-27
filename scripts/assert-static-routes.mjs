#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const manifestUrl = new URL(
  "../.next/prerender-manifest.json",
  import.meta.url
);

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
} catch {
  console.error(
    "prerender-manifest.json not found. Run `npm run build` first."
  );
  process.exit(1);
}

const routes = Object.keys(manifest.routes ?? {});

const required = [
  "/en",
  "/tr",
  "/en/about",
  "/tr/about",
  "/en/projects",
  "/tr/projects",
  "/en/blog",
  "/tr/blog",
  "/en/contact",
  "/tr/contact",
];

const missing = required.filter((route) => !routes.includes(route));

const detail = (prefix) =>
  routes.filter((route) =>
    new RegExp(`^${prefix}/projects/[^/]+$`).test(route)
  );

const enDetail = detail("/en");
const trDetail = detail("/tr");

const apiRoutes = routes.filter((route) => route.startsWith("/api"));

const problems = [];

if (missing.length > 0) {
  problems.push(`not prerendered: ${missing.join(", ")}`);
}
if (enDetail.length === 0) {
  problems.push("no prerendered project detail page for en");
}
if (enDetail.length !== trDetail.length) {
  problems.push(
    `project detail count differs: en=${enDetail.length} tr=${trDetail.length}`
  );
}
if (apiRoutes.length > 0) {
  problems.push(`api routes must stay dynamic: ${apiRoutes.join(", ")}`);
}

if (problems.length > 0) {
  console.error("Static route check failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const contentRoutes = required.length + enDetail.length + trDetail.length;

console.log(
  `Static route check passed: ${contentRoutes} content routes prerendered ` +
    `(${enDetail.length} project pages per locale).`
);
