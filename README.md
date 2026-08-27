# dogancanyildiz.sh

Personal portfolio of Doğan Can Yıldız, a full stack web developer and DevOps
engineer. The site is a Next.js App Router application that is self hosted on a
Coolify managed server behind Traefik and Cloudflare, without Vercel.

## Stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 16.3.3, App Router, `output: 'standalone'`                  |
| UI        | React 19.2, Tailwind CSS 4, shadcn/ui, motion 13                    |
| Email     | Resend, through `/api/contact`                                      |
| Runtime   | Node 24, single container                                           |
| Hosting   | Docker image built by Coolify, Traefik in front, Cloudflare proxied |

## Requirements

- Node 24 (`.nvmrc` pins it, `nvm use` picks it up)
- npm 11.16.0, the lockfile is committed and must be regenerated with the same
  major version

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

| Script                 | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Development server on http://localhost:3000  |
| `npm run build`        | Production build, writes `.next/standalone`  |
| `npm run start`        | Serves the production build                  |
| `npm run lint`         | ESLint with the Next.js config               |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm test`             | vitest, node environment, `src/**/*.test.ts` |
| `npm run format`       | Prettier in check mode                       |
| `npm run format:write` | Prettier in write mode                       |

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

## Internationalization

- English is served from the root (`/`, `/about`), Turkish from `/tr` (`/tr`, `/tr/about`).
- Locale routing lives in `src/i18n/routing.ts`; `src/proxy.ts` applies it. Automatic
  Accept-Language redirects and the locale cookie are disabled: the URL is the only signal.
- Messages live in `messages/en.json` and `messages/tr.json`. Both files must carry the
  exact same key set.
- Every page and layout under `src/app/[lang]/` must call `setRequestLocale(lang)`. A page
  that forgets it silently drops out of static rendering; `npm run verify:routes` catches it.
- Route Handlers do not receive the `[lang]` param. `/api/contact` reads `locale` from the
  request body instead.

## Security posture

- Security headers and a Content Security Policy are set in `next.config.ts`
  through `headers()`. HSTS is deliberately absent from the app, Traefik owns it
  so there is a single source of truth.
- `poweredByHeader` is off.
- `images.remotePatterns` is intentionally undefined. Leaving it undefined keeps
  `next/image` on local files only and closes the AVIF decoding surface that the
  August 2026 Next.js advisory describes. Adding a remote host reopens it and
  needs a deliberate review.
- `/api/contact` checks `Content-Length`, rate limits per visitor IP, validates
  the body server side including the honeypot field, and returns a generic error
  on every failure. Details go to the server log only.

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
   from `dogancanyildiz.com` to `dogancanyildiz.sh` is a single hop Cloudflare
   Redirect Rule that keeps the path.

The `Dockerfile`, `.dockerignore` and the GitHub Actions gate live in this
repository, see the Deploy section below for the local verification commands and
for the panel side checklists.

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

## Deploy

Production runs on a self hosted Coolify instance behind Cloudflare and
Traefik. The image is built on the server from the Dockerfile in this repo,
GitHub Actions only gates pull requests and does not push any image.

Local verification of the production image:

```bash
docker compose up --build -d
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok", ...}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # 200
docker compose down
```

Lint the Dockerfile the same way CI does:

```bash
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
```

The parts that live in a control panel rather than in this repo are written
down as step by step checklists:

- `docs/deploy/coolify-kurulum.md` - GitHub App, build pack, env layers, health check
- `docs/deploy/cloudflare-kurulum.md` - DNS, TLS, redirect, cache, rate limiting
- `docs/deploy/traefik-ve-origin.md` - trusted proxy headers, HSTS, origin lockdown
- `docs/deploy/resend-domain.md` - SPF, DKIM, DMARC for the sender domain
