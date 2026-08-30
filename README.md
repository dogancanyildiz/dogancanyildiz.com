# dogancanyildiz.com

Personal portfolio of Doğan Can YILDIZ, a full-stack web developer and DevOps
specialist. The site is a Next.js App Router application that is self hosted on a
Coolify managed server behind Traefik and Cloudflare, without Vercel.

## Stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 16.3.3, App Router, `output: 'standalone'`                  |
| UI        | React 19.2, Tailwind CSS 4, shadcn/ui, no JS animation layer        |
| Email     | Resend, through `/api/contact`                                      |
| Runtime   | Node 24, single container                                           |
| Hosting   | Docker image built by Coolify, Traefik in front, Cloudflare proxied |

## Requirements

- Node 24 (`.nvmrc` pins it, `nvm use` picks it up)
- npm 11.16.0, the lockfile is committed and must be regenerated with the same
  major version
- `AGENTS.md` and `CLAUDE.md` are gitignored on purpose: `next dev` rewrites
  them on every start. A fresh clone gets them back the first time `npm run dev`
  runs; until then the project instructions live in `docs/` (start with
  `docs/00-ozet-ve-karar.md`).

## Local setup

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_SITE_URL` has no fallback. `npm run build` throws when it is
missing, because a silent fallback would put a wrong host into `robots.txt` and
`sitemap.xml`.

## Scripts

| Script                  | What it does                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Development server on http://localhost:3000, velite runs alongside it in watch mode                                                                                                          |
| `npm run build`         | Production build, writes `.next/standalone`                                                                                                                                                  |
| `npm run build:content` | Runs velite once in strict mode, validates every content file against its schema                                                                                                             |
| `npm run build:app`     | `next build` only, for a tree that already has fresh velite output (CI uses it after `build:content`)                                                                                        |
| `npm run start`         | Serves the production build                                                                                                                                                                  |
| `npm run lint`          | ESLint with the Next.js config, type aware rules on, zero warnings allowed                                                                                                                   |
| `npm run typecheck`     | `tsc --noEmit`                                                                                                                                                                               |
| `npm test`              | vitest: node environment for `*.test.ts`, jsdom + Testing Library for `*.test.tsx`; CI adds `--coverage`                                                                                     |
| `npm run format`        | Prettier in check mode                                                                                                                                                                       |
| `npm run format:write`  | Prettier in write mode                                                                                                                                                                       |
| `npm run verify:routes` | Reads `.next/prerender-manifest.json` after a build: every content route prerendered in both locales, `/api/*` dynamic                                                                       |
| `npm run verify:links`  | HEAD/GET audit of project live demo URLs and certificate verify links (requires `npm run build:content` first); not a merge gate, `.github/workflows/links.yml` runs it weekly and on demand |
| `npm run verify:docs`   | Structural checks over `docs/` and the deploy checklists (`scripts/verify-docs.mjs`), runs in CI                                                                                             |
| `npm run release:check` | Dry run of `scripts/release-version.mjs`: prints the version the next merge to `main` would cut, writes nothing                                                                              |
| `npm run vendor:fonts`  | Copies the woff2 and woff font files from the @fontsource packages into src/fonts and public/fonts/og                                                                                        |

## Environment variables

Every variable is documented in `.env.example`. The split between Coolify build
and runtime variables is not cosmetic. Marking the build variable as runtime
only fails the build outright, and marking a secret as a build variable leaks it
into image layers and build logs.

| Variable                 | Coolify layer | Required          | Notes                                                                                                                                                                                                                    |
| ------------------------ | ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`   | Build         | Yes               | Inlined into the client bundle by `next build`. The Dockerfile `ARG` has no default, so a build without this argument fails in `resolveSiteUrl` while prerendering `/robots.txt` instead of shipping an undefined value. |
| `RESEND_API_KEY`         | Runtime       | Yes in production | Build variables can leak into image layers and build logs.                                                                                                                                                               |
| `CONTACT_EMAIL`          | Runtime       | Yes in production | Inbox that receives form messages.                                                                                                                                                                                       |
| `FROM_EMAIL`             | Runtime       | Yes in production | Must live on a domain verified in Resend.                                                                                                                                                                                |
| `TRUST_CF_CONNECTING_IP` | Runtime       | No                | Set to `true` only after the origin is reachable from Cloudflare alone and Traefik trusts the Cloudflare ranges. `trustedIPs` by itself does not protect `CF-Connecting-IP`.                                             |
| `NEXT_PUBLIC_BUILD_SHA`  | Build         | No                | Commit SHA shown in the Systems panel; Coolify's `SOURCE_COMMIT` or CI's `github.sha`. Empty hides the field.                                                                                                            |
| `NEXT_PUBLIC_BUILD_DATE` | Build         | No                | ISO deploy timestamp for the Systems panel and the footer year. Empty hides both.                                                                                                                                        |
| `GATUS_URL`              | Runtime       | No                | Base URL of the Gatus instance the Systems panel reads. Server side only, never reaches the client; empty renders the neutral "status unavailable" row.                                                                  |
| `UMAMI_SCRIPT_URL`       | Build         | No                | Self hosted Umami origin. Must match the origin allowed by the CSP (`src/lib/analytics.ts`), the build fails otherwise.                                                                                                  |
| `UMAMI_WEBSITE_ID`       | Build         | No                | Umami website UUID. The tracker tag is only rendered when both Umami values are set.                                                                                                                                     |
| `CSP_REPORT_ONLY`        | Build         | No                | `1` for a single measurement deploy: ships the strict report-only CSP and raises the `/api/csp-report` budget. Remove after the window.                                                                                  |

## Internationalization

- English is served from the root (`/`, `/about`), Turkish from `/tr` (`/tr`, `/tr/about`).
- Locale routing lives in `src/i18n/routing.ts`; `src/proxy.ts` applies it. Automatic
  Accept-Language redirects and the locale cookie are disabled: the URL is the only signal.
- Messages live in `messages/en.json` and `messages/tr.json`. Both files must carry the
  exact same key set.
- Every page and layout under `src/app/[lang]/` must call `setRequestLocale(lang)`. A page
  that forgets it silently drops out of static rendering; `npm run verify:routes` catches it.
- Route Handlers do not receive the `[lang]` param. `/api/contact` resolves the locale
  from the `X-Locale` request header the form sends, then the `/tr` prefix of the
  `Referer`, then `Accept-Language` (q weighted), before the rate limiter runs, so every
  error body comes back translated.

## Security posture

- Security headers and a Content Security Policy are set in `next.config.ts`
  through `headers()`: `X-Content-Type-Options`, `Referrer-Policy`, a wide
  `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy`
  and `Cross-Origin-Resource-Policy: same-origin`, plus `Strict-Transport-Security`
  in production (`max-age=31536000; includeSubDomains`, no preload). HSTS moves to
  the Traefik middleware once that is live, the app side line is removed then so
  only one layer sends it. `tests/deploy/security-headers.test.ts` locks the set.
- The enforced CSP keeps `script-src 'unsafe-inline'` because the App Router
  streams its RSC payload through inline scripts and a nonce would force every
  route into dynamic rendering. Violations report to `/api/csp-report`; a strict
  report-only policy can be shipped for a measurement window with
  `CSP_REPORT_ONLY=1` at build time.
- `/cv/*` is served with `X-Robots-Tag: noindex, nofollow` and a one day cache,
  `/fonts/*` with a one day cache (no `immutable`, the file names are not hashed).
- `poweredByHeader` is off.
- `images.remotePatterns` is intentionally undefined. Leaving it undefined keeps
  `next/image` on local files only and closes the AVIF decoding surface that the
  August 2026 Next.js advisory describes. Adding a remote host reopens it and
  needs a deliberate review.
- `/api/contact` requires `Content-Type: application/json` (415 otherwise) and
  an `Origin` equal to `NEXT_PUBLIC_SITE_URL` (403 otherwise, so a preview host
  needs its own value), rate limits per visitor IP with a separate looser bucket
  for the shared "unknown" key, caps the body by `Content-Length` and while
  streaming (413), validates every field server side including the honeypot and
  CR/LF in name and email, and answers with `X-Request-Id`, `X-RateLimit-Limit`,
  `X-RateLimit-Remaining` and, on 429, `Retry-After`. Errors are translated;
  400 bodies name the failing field. The Resend call has a 10 second timeout
  (504), carries `Reply-To` and an idempotency key. Logs are one JSON object per
  line and never contain the message body or the visitor address.
- `/api/health` answers `{ status: "ok" | "degraded", checks: { content, mail }, timestamp }`
  with HTTP 200 either way; `status` goes to `degraded` when a mail variable is
  missing, which is what the Gatus condition alarms on. `src/instrumentation.ts`
  also logs a loud error line at startup in that case.
- Dependency and code scanning: Dependabot (`.github/dependabot.yml`, weekly
  grouped PRs against `dev`, security updates on demand) and CodeQL
  (`.github/workflows/codeql.yml`, javascript-typescript, on every PR and
  weekly). Both report to the repository Security tab.
- Found a vulnerability? See [SECURITY.md](./SECURITY.md) or
  `/.well-known/security.txt` on the live site.

## Deployment

The application is deployed by Coolify from this git repository:

1. Coolify is connected through the GitHub App and uses the Dockerfile build
   pack. Pushing to `main` triggers a build and a deploy, pull requests get a
   preview deployment.
2. The image runs `node server.js` from `.next/standalone` as a non root user.
3. The container health check points at `/api/health`.
4. Traefik terminates TLS, adds HSTS and compression, and trusts the Cloudflare
   ranges through `forwardedHeaders.trustedIPs`.
5. Cloudflare runs in proxied mode with SSL set to Full (strict). The redirect
   from `dogancanyildiz.sh` to `dogancanyildiz.com` is planned as a single hop
   Cloudflare Redirect Rule that keeps the path; the `.sh` domain is not
   registered yet, so the rule is not live (see `docs/plans/README.md`).

The `Dockerfile`, `.dockerignore` and the GitHub Actions gate live in this
repository. The CI workflow runs the dependency review, lint, typecheck, tests
with coverage, `verify:docs`, build, `verify:routes`, prettier and a production
audit, then lints the Dockerfile, builds the image with a cached Buildx build
and boots it once to probe `/api/health` from outside the container. Every
action is pinned to a commit SHA, `release.yml` waits for that CI run to succeed
before it tags. GitHub Actions never pushes an image, Coolify builds it on the
server.

### Local verification

Local verification of the production image:

```bash
docker compose up --build -d
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok","checks":{"content":true,"mail":false},...}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # 200
docker compose down
```

`mail` is `false` locally unless the three Resend variables are set; the
compose file only needs `NEXT_PUBLIC_SITE_URL`.

Lint the Dockerfile the same way CI does:

```bash
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
```

### Panel side checklists

The parts that live in a control panel rather than in this repo are written
down as step by step checklists:

- `docs/deploy/coolify-kurulum.md` - GitHub App, build pack, env layers, health check
- `docs/deploy/cloudflare-kurulum.md` - DNS, TLS, redirect, cache, rate limiting
- `docs/deploy/traefik-ve-origin.md` - trusted proxy headers, HSTS, origin lockdown
- `docs/deploy/resend-domain.md` - SPF, DKIM, DMARC for the sender domain
- `docs/runbooks/infrastructure.md` - Gatus, Umami and the environment variables behind them

## Repository layout

```
src/app        App Router routes, api handlers, metadata routes
src/components UI, layout and section components
src/lib        Framework free helpers, each one unit tested
docs           Architecture decisions and the phased roadmap
docs/plans     Executable implementation plans, one per phase
```

## Documentation

Architecture decisions live in `docs/`. Start with
`docs/00-ozet-ve-karar.md` for the summary and `docs/10-yol-haritasi.md` for the
phase order.

## Branching and releases

```
feature/*  --PR-->  dev  --PR-->  main  --push-->  release workflow
```

- `feature/*` branches off `dev`. `dev` is the integration branch, `main` is
  the released state and only moves through a pull request from `dev`.
- `.github/workflows/ci.yml` runs on pull requests to and pushes on both `dev`
  and `main`. Its two jobs, `Quality checks` and `Docker image`, plus the
  `CodeQL analysis` job from `codeql.yml`, are the required checks in branch
  protection, so their names must not change.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
  They are the only input the version comes from.

Every merge into `main` runs `.github/workflows/release.yml`, which:

1. derives the next version from the commits since the last `v*` tag,
2. pushes an annotated tag and publishes a GitHub Release with grouped notes,
3. opens a `chore(release): sync version vX.Y.Z` pull request against `dev`
   that carries `package.json`, `package-lock.json` and `CHANGELOG.md` forward.

| Commit type                                           | Version bump |
| ----------------------------------------------------- | ------------ |
| `feat`                                                | minor        |
| `fix`, `perf`, `refactor`                             | patch        |
| `!:` in the subject or `BREAKING CHANGE:` in the body | major        |
| `chore`, `docs`, `ci`, `test`, `style`, `build`       | none         |

A batch that only carries release neutral commits finishes without a tag.
`npm run release:check` prints the decision locally without writing anything.

The project is pre release at `0.x`. `1.0.0` is cut by hand, by running the
release workflow through `workflow_dispatch` with `version: 1.0.0`; after that
the table above governs on its own. `CHANGELOG.md` follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and is written by the
release workflow. The full flow, including the branch protection settings and
the Coolify staging option, is in `docs/06-devops-ve-deploy.md`.

## Adding content

Projects and blog posts are MDX files under `content/`, compiled by Velite at
build time and dev time against the schemas in `velite.config.ts`.

- Project: `content/projects/<locale>/<slug>.mdx`. Required front matter:
  `title`, `slug`, `summary`, `role`, `stack` (a non empty list), `year`,
  `outcome`. `links.live`, `links.repo` (both must be `https://`), `cover`,
  `coverAlt`, `featured`, `order`, `updated` and `draft` are optional; `updated`
  feeds the sitemap `lastmod`, the home page shows the `featured` projects and
  falls back to the first three. List `stack` in learning order when it is a web stack (HTML, CSS,
  JavaScript, TypeScript, framework) or pipeline order for DevOps (Git, CI,
  containers, OS, routing).
- Blog post: `content/blog/<locale>/<slug>.mdx`. Required front matter:
  `title`, `slug`, `date`, `summary`. `tags`, `cover`, `coverAlt`, `updated` and
  `draft` are optional; `updated` becomes `dateModified` in the BlogPosting
  schema and the sitemap `lastmod`.
- `<locale>` is derived from the folder name and can only be `en` or `tr`,
  there is no `locale` field to set by hand.
- The same piece of content must use the SAME `slug` value in both locale
  folders, the hreflang pair between the English and Turkish page is built
  from that match. If a piece of content has not been translated yet, do not
  create a placeholder file for the other locale: an untranslated slug never
  appears in that locale's routes, sitemap or hreflang alternates, there is
  no fallback page.
- A cover image is optional. Place it under `content/images/` and reference
  it with a relative path from the frontmatter, for example
  `cover: ../../images/<slug>-cover.png`. Content with no `cover` field is
  published without a cover, it does not fall back to a CSS gradient or a
  stock image.
- Front matter values are YAML: a value containing `": "` (a colon followed
  by a space), such as a title with a subtitle, must be wrapped in quotes or
  the parser misreads it as a nested key.

`npm run dev` runs Velite in watch mode alongside the Next.js dev server, so
content changes are picked up without a restart. `npm run build:content`
runs Velite once in strict mode and is the fastest way to check that new
front matter matches the schema before running the full build.

## License

The code is MIT licensed. The written content, the CV, the images and the
personal branding are not, see [LICENSE](./LICENSE) for the exact split.
