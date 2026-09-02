#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const manifestUrl = new URL(
  "../.next/prerender-manifest.json",
  import.meta.url
);

const projectsUrl = new URL("../.velite/projects.json", import.meta.url);
const postsUrl = new URL("../.velite/posts.json", import.meta.url);
const routingUrl = new URL("../src/i18n/routing.ts", import.meta.url);

/**
 * Routed locales, read out of src/i18n/routing.ts.
 *
 * This file is plain ESM run by node, so it cannot import the TypeScript
 * routing config, and a hand written ["en", "tr"] here is a second source of
 * truth that a third locale would silently leave behind: the check would keep
 * passing while half the site went unverified. Reading the literal out of the
 * config is the cheapest way to keep one source, and
 * tests/scripts/assert-static-routes.test.ts compares the parsed list with the
 * real routing.locales so a config rewrite that defeats the regex fails there.
 */
export async function readLocales() {
  const source = await readFile(routingUrl, "utf8");
  const block = source.match(/locales:\s*\[([^\]]*)\]/)?.[1];
  const locales = [
    ...(block ?? "").matchAll(/["']([a-z]{2}(?:-[A-Za-z0-9]+)?)["']/g),
  ]
    .map((match) => match[1])
    .filter((locale) => locale !== undefined);
  if (locales.length === 0) {
    throw new Error(
      "no locales found in src/i18n/routing.ts (defineRouting locales list)"
    );
  }
  return locales;
}

/**
 * Pages that must be prerendered in every locale. "" is the locale root.
 */
export const LOCALE_PAGES = [
  "",
  "/about",
  "/projects",
  "/blog",
  "/contact",
  "/privacy",
  "/coming-soon",
  "/updating",
  "/feed.xml",
];

/**
 * Root level metadata routes, outside the [lang] segment so they carry no
 * locale prefix.
 *
 * opengraph-image is intentionally excluded: /[lang]/opengraph-image/[id]
 * shows as prerendered (SSG) in the build output, but its per-locale, per-id
 * paths live under prerender-manifest.json's dynamicRoutes, not the flat
 * routes map this script checks, so there is nothing stable to list here.
 * Verify it by hand: `curl -I <site>/en/opengraph-image/default`.
 *
 * The icons carry their extension because they are static files under src/app
 * (favicon.ico, icon.png, apple-icon.png) rather than the extensionless
 * next/og routes they replaced. Next still registers one static route per
 * file, so they do show up in the flat routes map and are checked here.
 */
export const ROOT_ROUTES = [
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
];

export function requiredRoutes(locales) {
  return [
    ...locales.flatMap((locale) =>
      LOCALE_PAGES.map((page) => `/${locale}${page}`)
    ),
    ...ROOT_ROUTES,
  ];
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

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  } catch {
    console.error(
      "prerender-manifest.json not found. Run `npm run build` first."
    );
    process.exit(1);
  }

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

  let locales;
  try {
    locales = await readLocales();
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  }

  const routes = Object.keys(manifest.routes ?? {});
  const required = requiredRoutes(locales);
  const missing = required.filter((route) => !routes.includes(route));
  const apiRoutes = routes.filter((route) => route.startsWith("/api"));

  // Every prerendered /<locale>/<section>/<slug> route, keyed by its slug.
  function prerenderedSlugs(locale, section) {
    const pattern = new RegExp(`^/${locale}/${section}/([^/]+)$`);
    return routes
      .map((route) => route.match(pattern)?.[1])
      .filter((slug) => slug !== undefined);
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

  const contentRoutes =
    required.length +
    locales.reduce(
      (total, locale) =>
        total +
        projectSlugsByLocale[locale].length +
        postSlugsByLocale[locale].length,
      0
    );

  const perLocale = locales
    .map(
      (locale) =>
        `${locale}: ${projectSlugsByLocale[locale].length} projects, ` +
        `${postSlugsByLocale[locale].length} posts`
    )
    .join("; ");

  console.log(
    `Static route check passed: ${contentRoutes} content routes prerendered ` +
      `(${perLocale}).`
  );
}

// Importable for the tests without running the check: vitest is argv[1] there,
// the npm script is this file.
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await main();
}
