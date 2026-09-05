#!/usr/bin/env node
// Submits the site's URLs to IndexNow so Bing, Yandex and the other
// participating engines recrawl changed pages within minutes instead of
// waiting for organic discovery. Google does not consume IndexNow, so this is
// purely a Bing/Yandex accelerator (and, through Bing's index, AI search).
//
// Runs after a deploy: it reads the live sitemap so it only ever submits URLs
// that are already serving the new content. Failures are logged and swallowed
// with a zero exit, because a missed IndexNow ping must never fail a deploy.

const KEY = "828981823e501352aecca80aa31aca32";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const TIMEOUT_MS = 15_000;

const siteUrl = (
  process.env.INDEXNOW_SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.dogancanyildiz.com"
).replace(/\/+$/, "");

const host = new URL(siteUrl).host;

async function fetchSitemapUrls() {
  const res = await fetch(`${siteUrl}/sitemap.xml`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/xml" },
  });
  if (!res.ok) {
    throw new Error(`sitemap.xml responded ${res.status}`);
  }
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].trim()
  );
  // Only submit URLs on this host: a sitemap alternate could name another
  // origin, and IndexNow rejects a batch whose URLs leave the declared host.
  return [...new Set(locs)].filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });
}

async function main() {
  let urlList;
  try {
    urlList = await fetchSitemapUrls();
  } catch (error) {
    console.error(`IndexNow: could not read sitemap (${error.message}).`);
    return;
  }

  if (urlList.length === 0) {
    console.error("IndexNow: sitemap held no URLs for this host, skipping.");
    return;
  }

  const body = {
    host,
    key: KEY,
    keyLocation: `${siteUrl}/${KEY}.txt`,
    urlList,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // 200 and 202 are both success; the endpoint returns 202 while it queues.
    console.log(
      `IndexNow: submitted ${urlList.length} URL(s) for ${host}, ` +
        `endpoint responded ${res.status}.`
    );
  } catch (error) {
    console.error(`IndexNow: submission failed (${error.message}).`);
  }
}

await main();
