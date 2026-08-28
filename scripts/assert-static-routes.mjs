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

const projectsUrl = new URL("../.velite/projects.json", import.meta.url);
const postsUrl = new URL("../.velite/posts.json", import.meta.url);

let veliteProjects;
let velitePosts;
try {
  veliteProjects = JSON.parse(await readFile(projectsUrl, "utf8"));
  velitePosts = JSON.parse(await readFile(postsUrl, "utf8"));
} catch {
  console.error(
    ".velite content not found. Run `npm run build:content` first."
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
  "/en/feed.xml",
  "/tr/feed.xml",
  // Root level metadata routes, outside the [lang] segment so they carry no
  // locale prefix.
  "/robots.txt",
  "/sitemap.xml",
  "/icon",
  "/apple-icon",
  // opengraph-image is intentionally excluded: /[lang]/opengraph-image/[id]
  // shows as prerendered (SSG) in the build output, but its per-locale,
  // per-id paths live under prerender-manifest.json's dynamicRoutes, not the
  // flat routes map this script checks, so there is nothing stable to list
  // here. Verify it by hand: `curl -I <site>/en/opengraph-image/default`.
];

const missing = required.filter((route) => !routes.includes(route));

const apiRoutes = routes.filter((route) => route.startsWith("/api"));

const locales = ["en", "tr"];

// Every prerendered /<locale>/<section>/<slug> route, keyed by its slug.
function prerenderedSlugs(locale, section) {
  const pattern = new RegExp(`^/${locale}/${section}/([^/]+)$`);
  return routes
    .map((route) => route.match(pattern)?.[1])
    .filter((slug) => slug !== undefined);
}

function setsEqual(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const value of setA) {
    if (!setB.has(value)) return false;
  }
  return true;
}

const projectSlugsByLocale = Object.fromEntries(
  locales.map((locale) => [
    locale,
    veliteProjects
      .filter((project) => project.locale === locale)
      .map((project) => project.slug),
  ])
);

const postSlugsByLocale = Object.fromEntries(
  locales.map((locale) => [
    locale,
    velitePosts
      .filter((post) => post.locale === locale && !post.draft)
      .map((post) => post.slug),
  ])
);

const problems = [];

if (missing.length > 0) {
  problems.push(`not prerendered: ${missing.join(", ")}`);
}

for (const locale of locales) {
  const prerenderedProjects = prerenderedSlugs(locale, "projects");
  const expectedProjects = projectSlugsByLocale[locale];
  if (!setsEqual(prerenderedProjects, expectedProjects)) {
    problems.push(
      `${locale} project routes do not match content slugs: ` +
        `prerendered=[${[...prerenderedProjects].sort().join(", ")}] ` +
        `expected=[${[...expectedProjects].sort().join(", ")}]`
    );
  }

  const prerenderedPosts = prerenderedSlugs(locale, "blog");
  const expectedPosts = postSlugsByLocale[locale];
  if (!setsEqual(prerenderedPosts, expectedPosts)) {
    problems.push(
      `${locale} blog routes do not match content slugs: ` +
        `prerendered=[${[...prerenderedPosts].sort().join(", ")}] ` +
        `expected=[${[...expectedPosts].sort().join(", ")}]`
    );
  }
}

if (apiRoutes.length > 0) {
  problems.push(`api routes must stay dynamic: ${apiRoutes.join(", ")}`);
}

if (problems.length > 0) {
  console.error("Static route check failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const enProjectCount = projectSlugsByLocale.en.length;
const trProjectCount = projectSlugsByLocale.tr.length;
const enPostCount = postSlugsByLocale.en.length;
const trPostCount = postSlugsByLocale.tr.length;

const contentRoutes =
  required.length + enProjectCount + trProjectCount + enPostCount + trPostCount;

console.log(
  `Static route check passed: ${contentRoutes} content routes prerendered ` +
    `(${enProjectCount} project pages per locale, ${enPostCount} en posts, ${trPostCount} tr posts).`
);
