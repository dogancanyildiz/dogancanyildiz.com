# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps
# Install dependencies in an isolated layer so that a source only change does
# not invalidate the npm cache. devDependencies are required here because the
# Next build runs in the next stage.
# ---------------------------------------------------------------------------
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

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
FROM node:25-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUILD_SHA
ARG NEXT_PUBLIC_BUILD_DATE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BUILD_SHA=$NEXT_PUBLIC_BUILD_SHA
ENV NEXT_PUBLIC_BUILD_DATE=$NEXT_PUBLIC_BUILD_DATE
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
FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

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
