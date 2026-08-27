# Trust maintenance checklist

Quarterly and release-time checks that keep the portfolio's trust signals accurate.
Code automates live demo URLs in CI (`npm run verify:links`); the rest stays manual.

## Every release (CI)

- [ ] `npm run verify:links` passes after `npm run build:content` (live demo URLs from project frontmatter).
- [ ] Person JSON-LD on `/` includes `knowsAbout`, `alumniOf`, `worksFor`, and `sameAs` (Rich Results Test when schema changes).
- [ ] `siteConfig.person.name` matches `brand.name` in `messages/en.json` and `messages/tr.json` (covered by `tests/trust.test.ts`).

## Every three months

- [ ] Re-run `npm run verify:links` locally and fix any broken demo or certificate verify URL.
- [ ] Confirm certificate `verifyUrl` values in `src/content/profile.ts` still open (Credly, Hackviser, Cisco).
- [ ] Spot-check GitHub, LinkedIn and site footer links; spelling of your name must match everywhere.
- [ ] Search Console: no new structured-data errors on the home URL; sitemap still processes cleanly.

## Owner content (when delivered)

- [ ] Profile photo at `public/images/profile.jpg` (or `.webp`) shows in Hero and About; Person schema `image` populates automatically.
- [ ] Project covers in `content/images/<slug>-cover.png` with `cover:` in MDX frontmatter.
- [ ] Speaking entries in `src/content/profile.ts` (`speaking.en` / `speaking.tr`).
- [ ] Testimonials in `src/content/testimonials.ts` after references are approved.
- [ ] CV at `public/cv/dogancanyildiz-cv.pdf` (download button appears when the file exists).

## Search Console (after Person schema updates)

1. URL Inspection on `https://dogancanyildiz.com/` (and `/tr/` if indexed separately).
2. Confirm **Person** rich result preview or valid JSON-LD with no critical errors.
3. Re-submit sitemap if major URL or hreflang changes shipped.

## Consistency QA

| Source | Field | Expected |
|--------|--------|----------|
| `src/lib/site-config.ts` | `person.name` | Doğan Can Yıldız |
| `messages/*.json` | `brand.name` | Same spelling |
| GitHub profile | Display name | Same spelling |
| LinkedIn | Name | Same spelling |
