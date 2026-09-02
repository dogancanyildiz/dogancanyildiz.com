# syntax=docker/dockerfile:1

# Pinned to a digest, not a floating tag: node:24-alpine can point at a
# different image tomorrow, a digest cannot. Dependabot's docker ecosystem
# (directory: /) tracks this line and opens a pull request when a new
# node:24-alpine build is published.
# node:24-alpine

# ---------------------------------------------------------------------------
# Stage 1: deps
# Install dependencies in an isolated layer so that a source only change does
# not invalidate the npm cache. devDependencies are required here because the
# Next build runs in the next stage. The cache mount keeps npm's download
# cache across builds without baking it into any image layer.
# ---------------------------------------------------------------------------
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts skips every package's install/postinstall/preinstall
# lifecycle script (arbitrary code from the dependency tree, run automatically
# on a plain "npm ci"). The five packages that actually carry one of those
# scripts here (`npm query ":attr(scripts, [install]), :attr(scripts,
# [postinstall])"`) are all native addons that ship a prebuilt binary as a
# platform specific optionalDependency (@img/sharp-*, @esbuild/*,
# @swc/core-*, @unrs/resolver-binding-*, @parcel/watcher-*): npm's own
# platform resolution already installs the right one from package-lock.json,
# so the script exists only to double check that or, lacking a prebuilt
# binary for the current platform, compile from source. "npm rebuild" reruns
# just those five scripts, still without letting the rest of the tree run
# arbitrary code. Verified against this image (linux/amd64 musl): sharp loads
# and calls into libvips at runtime, and `npm run build` completes end to end,
# with or without the rebuild step, so it is kept here as a deliberate safety
# net rather than a step this setup has been observed to need.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --ignore-scripts && \
    npm rebuild sharp esbuild @swc/core unrs-resolver @parcel/watcher

# ---------------------------------------------------------------------------
# Stage 2: builder
# "npm run build" is the single build entry point. Faz 4 adds the content
# pipeline by turning the "build" script into "velite --clean && next build"
# in package.json, so this stage does not change when Velite lands. Do not add
# a separate velite RUN step here, it would compile the content twice.
# NEXT_PUBLIC_SITE_URL must arrive as a build argument: next build inlines it
# into the client bundle, a runtime only value would stay undefined in the
# browser.
# There is no default on purpose: a build that forgets the argument fails in
# resolveSiteUrl instead of silently inlining the production url into a
# preview bundle. CI, docker compose and Coolify all pass it explicitly.
# ---------------------------------------------------------------------------
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUILD_SHA
ARG NEXT_PUBLIC_BUILD_DATE
# Optional like the build metadata above: an empty value hides the Systems
# panel's status link instead of failing the build. Without this ARG the value
# Coolify passes with --build-arg would be silently discarded and the link
# could never appear in production.
ARG NEXT_PUBLIC_STATUS_URL=""
ARG UMAMI_SCRIPT_URL=""
ARG UMAMI_WEBSITE_ID=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BUILD_SHA=$NEXT_PUBLIC_BUILD_SHA
ENV NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE
ENV NEXT_PUBLIC_STATUS_URL=$NEXT_PUBLIC_STATUS_URL
ENV UMAMI_SCRIPT_URL=$UMAMI_SCRIPT_URL
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: runner
# Ship only the standalone server, the static assets and public. The node
# image already provides an unprivileged "node" user, so no extra addgroup or
# adduser call is needed.
# ---------------------------------------------------------------------------
FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG UMAMI_SCRIPT_URL=""
ARG UMAMI_WEBSITE_ID=""
ENV UMAMI_SCRIPT_URL=$UMAMI_SCRIPT_URL
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

# The probe runs through node's built in fetch instead of curl or wget.
# coollabsio/coolify#7500 reports connection refused for curl and wget based
# health checks in Dockerfile built Node containers, and node:24-alpine ships
# no curl at all. The 30 second start period covers the standalone cold start.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
# PORT is read back so an override at run time keeps the probe on the right port.
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/health`).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
