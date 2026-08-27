# Faz 1: Deploy hattı (Docker, Coolify, Cloudflare, Traefik) Implementation Plan


> Durum: Uygulandı, PR #3 merge edildi (main); panel adımları sahibinde (handoffs/faz-1-manual-checklist.md). Devir notu: handoffs/faz-1.md
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoyu `main`'e atılan her commit'te kendi sunucusunda otomatik yayınlanan, PR başına preview URL üreten, Cloudflare edge'inin arkasında doğru domain yönlendirmesiyle çalışan bir uygulamaya çevirmek.

**Architecture:** Uygulama çok aşamalı bir Dockerfile ile (deps -> builder -> runner) `node:24-alpine` üstünde `output: 'standalone'` çıktısı olarak paketlenir ve Coolify'ın GitHub App entegrasyonu üzerinden doğrudan sunucuda build edilir; GitHub Actions yalnızca lint/typecheck/test/build kapısıdır, image push etmez. Trafik Cloudflare proxied moddan (Full strict TLS) Traefik'e, oradan container'a iner; cross-domain 301, cache, rate limit ve bot filtresi edge'de, HSTS/compress ve gerçek istemci IP'sinin güvenilir okunması Traefik'te, sağlık kontrolü `/api/health` üstünde çözülür. Kod olarak üretilen her şey (Dockerfile, .dockerignore, compose, workflow, `getClientIp`) testlidir; Coolify, Cloudflare, Traefik ve Resend paneli üzerinden yapılan işler repoya commit edilen el ile yürütülür checklist dokümanları olarak teslim edilir.

**Tech Stack:** Docker (BuildKit), node:24-alpine, Next.js 16.3.3 standalone output, Coolify v4.3.1 (Dockerfile build pack + GitHub App), Traefik v3 (Coolify proxy), Cloudflare (DNS proxied, Rules, WAF), GitHub Actions, hadolint v2.15.1, vitest (node environment), Resend.

**Spec:**
- `docs/00-ozet-ve-karar.md`
- `docs/06-devops-ve-deploy.md`
- `docs/09-guvenlik.md`
- `docs/10-yol-haritasi.md`
- `docs/11-acik-sorular.md`
- Gerçek içerik kaynağı: `.local/content/portfolio-content.md` (bu fazda yalnızca iletişim adresi için okunur)

## Global Constraints

- next 16.3.3 (Active LTS), react 19.2.x, tailwindcss 4.3.x, next-intl 4.13.7, velite 0.4.0 (EXACT pin, caret yok), motion 13.1.1 (import: motion/react), node 24 (.nvmrc), package.json engines.node ">=20.9", npm (lockfile commit edilir).
- Paket yöneticisi npm; script'ler: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run), format (prettier --check).
- Test aracı: vitest (node environment) lib/ ve app/api kodu için; UI için build çıktısı ve curl tabanlı doğrulama. Faz 0 vitest'i kurar, sonraki fazlar kullanır.
- output: 'standalone'; edge runtime kullanılmaz; next/image remotePatterns TANIMLANMAZ; next/font/google KULLANILMAZ (woff2 vendor + next/font/local).
- URL şeması: EN kökte (/, /about), TR /tr altında; localeDetection kapalı; çevirisi olmayan içerik diğer dilin sitemap/hreflang'ına girmez.
- İçerik: .local/content/portfolio-content.md gerçek kaynak; "Alex Chen", example.com, alex@example.com, placeholder sosyal link ve CSS gradyan kapak yayına çıkmaz. Görseli olmayan proje kapaksız yayınlanır.
- Metin üslubu (EN ve TR site metinleri, commit mesajları, yorumlar): uzun çizgi (em dash) ve en dash kullanılmaz; kısa çizgi, virgül, iki nokta kullanılır.
- Commit mesajları Conventional Commits (feat:, fix:, chore:, refactor:, docs:), gövde İngilizce, AI atıf/co-author satırı ASLA eklenmez.
- Güvenlik: RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL, GATUS_URL yalnızca Runtime env; NEXT_PUBLIC_SITE_URL Build env. .local/, .nodeterm/, .env* Docker build context'ine girmez. Gerçek IP CF-Connecting-IP'den, yalnızca Cloudflare IP aralıklarından gelen istekte güvenilir.
- Cloudflare proxied (turuncu bulut) + Full (strict) önde; dogancanyildiz.com -> dogancanyildiz.sh 301 Cloudflare Redirect Rule ile (tek atlama, path korunur).
- Her faz tek dal (feature/faz-N-slug), tek PR; faz bitiş kriteri planın sonunda "Bitti sayılma kriteri" olarak yer alır ve doğrulama komutları içerir.

---

## Dosya yapısı

Bu fazda oluşturulan veya değiştirilen dosyalar ve her birinin tek sorumluluğu:

| Dosya | Sorumluluk |
|---|---|
| `Dockerfile` | Üç aşamalı üretim imajı: bağımlılık kurulumu, Next build, standalone runtime |
| `.dockerignore` | Build context'ini daraltmak, `.local/` ve `.env*` gibi sırların imaja hiç girmemesini garanti etmek |
| `docker-compose.yml` | Yalnızca yerel doğrulama; Coolify bu dosyayı kullanmaz |
| `.github/workflows/ci.yml` | PR ve main push'unda lint + typecheck + test + build kapısı, ayrıca hadolint ve docker build kapısı; image push yok |
| `tests/deploy/dockerignore.test.ts` | `.dockerignore` sözleşmesinin regresyon testi |
| `tests/deploy/dockerfile.test.ts` | Dockerfile sözleşmesinin (aşamalar, non-root, CMD, ENV) regresyon testi |
| `tests/deploy/ci-workflow.test.ts` | CI workflow sözleşmesinin (adımlar var, registry push yok) regresyon testi |
| `tests/lib/client-ip-trust.test.ts` | Faz 0'ın `getClientIp` güven kapısını Traefik ayarına bağlayan regresyon testi |
| `docs/deploy/coolify-kurulum.md` | Coolify panelinde el ile yürütülen kurulum checklist'i ve env Build/Runtime tablosu |
| `docs/deploy/cloudflare-kurulum.md` | Cloudflare panelinde el ile yürütülen DNS, SSL, Redirect/Cache/Rate Limiting/Bot Fight checklist'i |
| `docs/deploy/traefik-ve-origin.md` | Coolify proxy config'i (trustedIPs), middleware etiketleri, origin kısıtlaması |
| `docs/deploy/resend-domain.md` | Resend'de `dogancanyildiz.sh` SPF/DKIM/DMARC doğrulama checklist'i |
| `.env.example` | Faz 1'de kullanılan env adlarının tam listesi ve Build/Runtime notu |
| `README.md` | Deploy bölümü: yerel docker doğrulaması ve `docs/deploy/` yönlendirmesi |

---

## Task 1: Faz 0 ön koşullarını doğrula ve faz dalını aç

**Files:**
- Modify: yok (yalnızca doğrulama ve dal açma)
- Test: yok (doğrulama komutları adımların içinde)

**Interfaces:**
- Consumes (Faz 0'dan): `next.config.ts` içinde `output: "standalone"`; `src/app/api/health/route.ts` içinde `GET(): Promise<Response>` ve gövde `{ "status": "ok" }`; `.nvmrc` içeriği `24`; `package.json` script'leri `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`; `next` sürümü `16.3.3`.
- Produces: `feature/faz-1-deploy-hatti` dalı; sonraki tüm task'lar bu dalda çalışır.

- [ ] **Step 1: Faz 0 çıktılarının varlığını doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git switch main && git pull --ff-only
grep -n 'output' next.config.ts
test -f src/app/api/health/route.ts && echo "health route OK"
cat .nvmrc
node -e "const p=require('./package.json'); console.log('next', p.dependencies.next); console.log('scripts', Object.keys(p.scripts).sort().join(',')); console.log('engines', JSON.stringify(p.engines));"
```

Expected:

```
  output: "standalone",
health route OK
24
next 16.3.3
scripts build,dev,format,lint,start,test,typecheck
engines {"node":">=20.9"}
```

Bu çıktının herhangi bir satırı tutmuyorsa Faz 1'e başlanmaz: Faz 0 dalı henüz merge edilmemiştir, önce o tamamlanır. Faz 1'in Dockerfile'ı `output: "standalone"` olmadan çalışmaz, CI'ın `test` adımı vitest kurulmadan çalışmaz.

- [ ] **Step 2: Sağlık kontrolü sözleşmesini yerelde doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm ci
npm run build
npx next start -p 3100 &
sleep 5
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/api/health
curl -s http://127.0.0.1:3100/api/health
kill %1
```

Expected:

```
200
{"status":"ok"}
```

Bu sözleşme (yol `/api/health`, HTTP 200, gövde `{"status":"ok"}`) Dockerfile HEALTHCHECK'i, Coolify health check ayarı ve Task 11'deki uçtan uca doğrulama tarafından aynen kullanılır.

- [ ] **Step 3: Faz dalını aç**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git switch -c feature/faz-1-deploy-hatti
git status --short
```

Expected: dal `feature/faz-1-deploy-hatti` olarak değişir, çalışma ağacı temiz (yalnızca `.nodeterm/` gibi ignore edilmiş girdiler olabilir).

- [ ] **Step 4: Test klasörünü hazırla ve vitest'in çalıştığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
mkdir -p tests/deploy tests/lib docs/deploy
npm run test
```

Expected: vitest çalışır ve Faz 0'dan gelen testler geçer. Hiç test dosyası yoksa vitest "No test files found" ile çıkar; bu da kabul edilebilir bir başlangıç durumudur, Task 2 ilk dosyayı ekleyecek.

---

## Task 2: `.dockerignore` ve build context sözleşmesi

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.dockerignore`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/deploy/dockerignore.test.ts`

**Interfaces:**
- Consumes: `feature/faz-1-deploy-hatti` dalı (Task 1).
- Produces: `.dockerignore` dosyası. Task 3'teki `docker build` bu dosyaya güvenerek `.local/`, `.env*`, `node_modules` ve `.next`'i context dışında bırakır. Test dosyası `tests/deploy/dockerignore.test.ts` adıyla Task 11'in tam test koşusunda tekrar çalışır.

- [ ] **Step 1: Failing test'i yaz**

`tests/deploy/dockerignore.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOCKERIGNORE_PATH = join(process.cwd(), ".dockerignore");

function readPatterns(): string[] {
  return readFileSync(DOCKERIGNORE_PATH, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

describe(".dockerignore", () => {
  const required = [
    "node_modules",
    ".next",
    ".git",
    ".github",
    ".claude",
    ".local",
    ".nodeterm",
    ".env",
    ".env.*",
    "docs",
    "*.md",
    "!README.md",
    "docker-compose.yml",
    "tsconfig.tsbuildinfo",
  ];

  it.each(required)("excludes %s from the build context", (pattern) => {
    expect(readPatterns()).toContain(pattern);
  });

  it("never excludes markdown files below the repository root", () => {
    // Velite (Faz 4) reads content/**/*.md and content/**/*.mdx from the build
    // context. A recursive "**/*.md" pattern here would silently produce an
    // empty content collection inside the image.
    expect(readPatterns()).not.toContain("**/*.md");
    expect(readPatterns()).not.toContain("**/*.mdx");
  });

  it("does not exclude the Dockerfile itself", () => {
    expect(readPatterns()).not.toContain("Dockerfile");
  });
});
```

- [ ] **Step 2: Test'i çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/deploy/dockerignore.test.ts`

Expected: FAIL. Hata `ENOENT: no such file or directory, open '.../.dockerignore'`.

- [ ] **Step 3: `.dockerignore` dosyasını yaz**

`.dockerignore`:

```
# Dependencies and build output, always reinstalled or regenerated in the image
node_modules
.next
out
coverage

# Version control and CI metadata
.git
.gitignore
.github

# Local only. .local holds the real portfolio content draft and the CV PDF,
# .nodeterm holds canvas state. Neither belongs in an image layer.
.local
.nodeterm
.claude
.vscode
.idea

# Secrets. Runtime values are injected by Coolify, never baked into the image.
.env
.env.*

# Docs and root level markdown. This pattern is root only on purpose:
# a recursive **/*.md would also drop content/**/*.md, which Velite needs
# in Faz 4.
docs
*.md
!README.md
LICENSE

# Local verification helper, Coolify builds straight from the Dockerfile
docker-compose.yml

# TypeScript incremental build cache
tsconfig.tsbuildinfo
*.tsbuildinfo

# OS noise
.DS_Store
Thumbs.db
```

- [ ] **Step 4: Test'i çalıştır, geçtiğini gör**

Run: `npx vitest run tests/deploy/dockerignore.test.ts`

Expected: PASS, 17 test (15 pattern + 2 negatif kontrol).

- [ ] **Step 5: Context'te sızıntı olmadığını elle doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git ls-files --others --ignored --exclude-standard --directory | head -20
tar --exclude-from=.dockerignore -cf - . 2>/dev/null | tar -tf - | grep -c -E '^\./(\.local|\.env|node_modules|\.next)/' || echo 0
```

Expected: son komut `0` yazdırır. `.local/`, `.env*`, `node_modules/` ve `.next/` context'te yoktur.

- [ ] **Step 6: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add .dockerignore tests/deploy/dockerignore.test.ts
git commit -m "chore: add .dockerignore with a contract test

Keep .local, .env files, node_modules and build output out of the Docker
build context. The markdown pattern stays root only so the future content
collection under content/ still reaches the builder stage."
```

---

## Task 3: Çok aşamalı `Dockerfile` ve yerel imaj doğrulaması

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/Dockerfile`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/deploy/dockerfile.test.ts`

**Interfaces:**
- Consumes: `.dockerignore` (Task 2); Faz 0'dan `next.config.ts` içindeki `output: "standalone"` ve `src/app/api/health/route.ts` (`GET` -> 200, `{"status":"ok"}`).
- Produces:
  - `Dockerfile` üç aşamalı: `deps`, `builder`, `runner`.
  - Build arg: `NEXT_PUBLIC_SITE_URL` (varsayılan `https://dogancanyildiz.sh`). Coolify'ın Build variable'ı bu arg'a bağlanır (Task 7).
  - Runtime env: `PORT=3000`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`.
  - Container komutu: `CMD ["node", "server.js"]`.
  - `HEALTHCHECK` `/api/health` yolunu 15 saniyede bir yoklar, `--start-period=30s`.
  - Build girişi tek bir satırdır: `RUN npm run build`. Faz 4 velite'ı `package.json` içindeki `"build"` script'ini `"velite --clean && next build"` yaparak devreye alır; Dockerfile'ın bu satırı değişmez ve Dockerfile'a ayrı bir `RUN npx velite build` adımı EKLENMEZ (aksi halde velite iki kez koşar).

- [ ] **Step 1: Failing test'i yaz**

`tests/deploy/dockerfile.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dockerfile = () =>
  readFileSync(join(process.cwd(), "Dockerfile"), "utf8");

describe("Dockerfile", () => {
  it("declares the three build stages in order", () => {
    const content = dockerfile();
    const depsIndex = content.indexOf("FROM node:24-alpine AS deps");
    const builderIndex = content.indexOf("FROM node:24-alpine AS builder");
    const runnerIndex = content.indexOf("FROM node:24-alpine AS runner");

    expect(depsIndex).toBeGreaterThan(-1);
    expect(builderIndex).toBeGreaterThan(depsIndex);
    expect(runnerIndex).toBeGreaterThan(builderIndex);
  });

  it("installs dependencies from the lockfile with npm ci", () => {
    expect(dockerfile()).toMatch(/RUN npm ci/);
    expect(dockerfile()).not.toMatch(/npm install/);
  });

  it("uses npm run build as the single build entry point", () => {
    expect(dockerfile()).toMatch(/RUN npm run build/);
  });

  it("accepts NEXT_PUBLIC_SITE_URL as a build argument", () => {
    const content = dockerfile();
    expect(content).toMatch(/ARG NEXT_PUBLIC_SITE_URL=/);
    expect(content).toMatch(/ENV NEXT_PUBLIC_SITE_URL=\$NEXT_PUBLIC_SITE_URL/);
  });

  it("never bakes a runtime secret into an image layer", () => {
    const content = dockerfile();
    for (const secret of [
      "RESEND_API_KEY",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
      "GATUS_URL",
    ]) {
      expect(content).not.toContain(secret);
    }
  });

  it("copies only the standalone output, static assets and public", () => {
    const content = dockerfile();
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/.next/standalone ./"
    );
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/.next/static ./.next/static"
    );
    expect(content).toContain(
      "COPY --from=builder --chown=node:node /app/public ./public"
    );
  });

  it("runs as the built in non root node user", () => {
    expect(dockerfile()).toMatch(/^USER node$/m);
  });

  it("binds to every interface on port 3000", () => {
    const content = dockerfile();
    expect(content).toMatch(/^ENV PORT=3000$/m);
    expect(content).toMatch(/^ENV HOSTNAME=0\.0\.0\.0$/m);
    expect(content).toMatch(/^EXPOSE 3000$/m);
  });

  it("starts the standalone server directly, not through npm", () => {
    const content = dockerfile();
    expect(content).toContain('CMD ["node", "server.js"]');
    expect(content).not.toContain("npm start");
  });

  it("declares a health check with a start period for coolify#7500", () => {
    const content = dockerfile();
    expect(content).toMatch(/HEALTHCHECK .*--start-period=30s/);
    expect(content).toContain("/api/health");
  });
});
```

- [ ] **Step 2: Test'i çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/deploy/dockerfile.test.ts`

Expected: FAIL, 10 test, hepsi `ENOENT: no such file or directory, open '.../Dockerfile'`.

- [ ] **Step 3: `Dockerfile` dosyasını yaz**

`Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps
# Install dependencies in an isolated layer so that a source only change does
# not invalidate the npm cache. devDependencies are required here because the
# Next build runs in the next stage.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
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
# ---------------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
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
FROM node:24-alpine AS runner
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
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
```

- [ ] **Step 4: Test'i çalıştır, geçtiğini gör**

Run: `npx vitest run tests/deploy/dockerfile.test.ts`

Expected: PASS, 10 test.

- [ ] **Step 5: hadolint ile Dockerfile'ı denetle**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
echo "hadolint exit: $?"
```

Expected:

```
hadolint exit: 0
```

Çıktı boş olmalı. Bir uyarı çıkarsa Dockerfile düzeltilir, `--failure-threshold` gevşetilmez.

- [ ] **Step 6: İmajı build et**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 -t portfolio-local:faz1 .
docker image inspect portfolio-local:faz1 --format '{{.Config.User}} {{.Config.Cmd}} {{index .Config.Labels "org.opencontainers.image.ref.name"}}'
```

Expected: build başarılı biter, son satır şunu yazar:

```
node [node server.js] <no value>
```

- [ ] **Step 7: Container'ı çalıştır ve uçtan uca doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker run -d --name portfolio-faz1 -p 3000:3000 portfolio-local:faz1
sleep 12
curl -s http://127.0.0.1:3000/api/health
echo
curl -s -o /dev/null -w 'root status: %{http_code}\n' http://127.0.0.1:3000/
docker exec portfolio-faz1 id -un
docker exec portfolio-faz1 sh -c 'ls -a /app | grep -c -E "^(\.local|\.env)$" || true'
sleep 25
docker inspect --format '{{.State.Health.Status}}' portfolio-faz1
```

Expected:

```
{"status":"ok"}
root status: 200
node
0
healthy
```

`node` satırı non-root çalıştığını, `0` satırı `.local` ve `.env` dosyalarının imajda olmadığını, `healthy` satırı HEALTHCHECK'in `--start-period=30s` içinde yeşile döndüğünü kanıtlar.

- [ ] **Step 8: Container'ı temizle**

Run:

```bash
docker rm -f portfolio-faz1
```

Expected: `portfolio-faz1`

- [ ] **Step 9: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add Dockerfile tests/deploy/dockerfile.test.ts
git commit -m "feat: add multi stage Dockerfile for standalone output

deps installs from the lockfile, builder runs npm run build with
NEXT_PUBLIC_SITE_URL as a build argument, runner ships only the standalone
server as the unprivileged node user. The health check probes /api/health
through node fetch with a 30 second start period, which avoids the curl and
wget failure reported in coollabsio/coolify#7500."
```

---

## Task 4: `docker-compose.yml` (yalnızca yerel doğrulama)

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docker-compose.yml`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/deploy/dockerignore.test.ts` (Task 2'de `docker-compose.yml` zaten context dışında bırakıldığı doğrulanıyor, yeni test dosyası eklenmiyor)

**Interfaces:**
- Consumes: `Dockerfile` (Task 3), build arg `NEXT_PUBLIC_SITE_URL`, port 3000.
- Produces: `docker-compose.yml`, tek servis adı `web`, imaj etiketi `portfolio-local:faz1`. Yerel doğrulama komutu: `docker compose up --build -d`. Coolify bu dosyayı okumaz; Coolify'da compose build pack seçilmez, çünkü compose build pack zero-downtime rolling update'i devre dışı bırakır (`docs/06-devops-ve-deploy.md`, bölüm 1).

- [ ] **Step 1: `docker-compose.yml` dosyasını yaz**

`docker-compose.yml`:

```yaml
# Local verification only.
#
# Coolify does NOT use this file. Production is built with the Dockerfile
# build pack, because the compose build pack disables Coolify's zero downtime
# rolling update (see docs/06-devops-ve-deploy.md section 1).
#
# Usage:
#   docker compose up --build -d
#   curl -s http://127.0.0.1:3000/api/health
#   docker compose down

services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_SITE_URL: http://localhost:3000
    image: portfolio-local:faz1
    container_name: portfolio-local
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      # Runtime only values. Left empty on purpose so a local run never
      # sends real mail. Provide them through a shell export when the
      # contact endpoint is being tested.
      RESEND_API_KEY: "${RESEND_API_KEY:-}"
      CONTACT_EMAIL: "${CONTACT_EMAIL:-}"
      FROM_EMAIL: "${FROM_EMAIL:-}"
    restart: "no"
```

- [ ] **Step 2: Compose dosyasının geçerli olduğunu doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker compose config --quiet && echo "compose config OK"
```

Expected:

```
compose config OK
```

- [ ] **Step 3: Compose ile ayağa kaldır ve doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker compose up --build -d
sleep 12
curl -s http://127.0.0.1:3000/api/health
echo
curl -s -o /dev/null -w 'root status: %{http_code}\n' http://127.0.0.1:3000/
docker compose down
```

Expected:

```
{"status":"ok"}
root status: 200
```

- [ ] **Step 4: `.dockerignore` sözleşmesinin hâlâ geçtiğini doğrula**

Run: `npx vitest run tests/deploy/dockerignore.test.ts`

Expected: PASS, 17 test. `docker-compose.yml` build context dışında kalmaya devam eder.

- [ ] **Step 5: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docker-compose.yml
git commit -m "chore: add local only docker compose file

Single web service that builds the production image and exposes port 3000
for curl based verification. Coolify keeps using the Dockerfile build pack,
the compose build pack would disable rolling updates."
```

---

## Task 5: GitHub Actions CI kapısı

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.github/workflows/ci.yml`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/deploy/ci-workflow.test.ts`

**Interfaces:**
- Consumes: `.nvmrc` (Faz 0, içerik `24`); `package.json` script'leri `lint`, `typecheck`, `test`, `build`; `Dockerfile` (Task 3).
- Produces:
  - Workflow adı `ci`, iki job: `checks` ve `docker`.
  - Tetikleyiciler: `pull_request` (branches `main`) ve `push` (branches `main`).
  - `checks` job'u sırayla `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` çalıştırır.
  - `docker` job'u hadolint ve `docker build` çalıştırır, hiçbir registry'ye push etmez.
  - Bu iki job GitHub'da branch protection'a "required status check" olarak bağlanır (Task 11).

- [ ] **Step 1: Failing test'i yaz**

`tests/deploy/ci-workflow.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = () =>
  readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

describe("ci workflow", () => {
  it("runs on pull requests and on pushes to main", () => {
    const content = workflow();
    expect(content).toMatch(/pull_request:\s*\n\s*branches: \[main\]/);
    expect(content).toMatch(/push:\s*\n\s*branches: \[main\]/);
  });

  it("pins the node version through .nvmrc", () => {
    expect(workflow()).toContain('node-version-file: ".nvmrc"');
  });

  it("runs every quality gate script", () => {
    const content = workflow();
    for (const command of [
      "npm ci",
      "npm run lint",
      "npm run typecheck",
      "npm run test",
      "npm run build",
    ]) {
      expect(content).toContain(`run: ${command}`);
    }
  });

  it("lints the Dockerfile with a pinned hadolint image", () => {
    expect(workflow()).toContain("hadolint/hadolint:v2.15.1-alpine");
  });

  it("builds the image but never pushes it to a registry", () => {
    const content = workflow();
    expect(content).toContain("docker build");
    expect(content).not.toContain("docker push");
    expect(content).not.toContain("docker/login-action");
    expect(content).not.toContain("ghcr.io");
  });

  it("grants the workflow read only repository access", () => {
    expect(workflow()).toMatch(/permissions:\s*\n\s*contents: read/);
  });

  it("does not reference any runtime secret", () => {
    const content = workflow();
    for (const secret of [
      "RESEND_API_KEY",
      "CONTACT_EMAIL",
      "FROM_EMAIL",
      "GATUS_URL",
    ]) {
      expect(content).not.toContain(secret);
    }
  });
});
```

- [ ] **Step 2: Test'i çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/deploy/ci-workflow.test.ts`

Expected: FAIL, 7 test, hepsi `ENOENT: no such file or directory, open '.../.github/workflows/ci.yml'`.

- [ ] **Step 3: Workflow dosyasını yaz**

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: lint, typecheck, test, build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: ".nvmrc"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
        env:
          # Build time only. The value never has to be a secret, it is inlined
          # into the client bundle anyway.
          NEXT_PUBLIC_SITE_URL: https://dogancanyildiz.sh

  docker:
    name: hadolint and image build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - name: Lint the Dockerfile
        run: docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
      - name: Build the production image
        # No registry login and no push on purpose. Coolify builds and keeps
        # the image on the server, this job is only a gate.
        run: docker build --build-arg NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh -t portfolio-ci:${{ github.sha }} .
```

- [ ] **Step 4: Test'i çalıştır, geçtiğini gör**

Run: `npx vitest run tests/deploy/ci-workflow.test.ts`

Expected: PASS, 7 test.

- [ ] **Step 5: Workflow'un YAML olarak geçerli olduğunu doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "const fs=require('node:fs');const t=fs.readFileSync('.github/workflows/ci.yml','utf8');const bad=t.split('\n').filter((l)=>/\t/.test(l));console.log('tab lines:', bad.length);console.log('jobs:', [...t.matchAll(/^  (\w[\w-]*):$/gm)].map((m)=>m[1]).join(','));"
```

Expected:

```
tab lines: 0
jobs: checks,docker
```

- [ ] **Step 6: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add .github/workflows/ci.yml tests/deploy/ci-workflow.test.ts
git commit -m "ci: add pull request and main push quality gate

The checks job runs lint, typecheck, vitest and next build against the node
version pinned in .nvmrc. The docker job lints the Dockerfile with hadolint
and builds the production image without pushing it anywhere, Coolify keeps
owning the deploy."
```

---

## Task 6: `CF-Connecting-IP` güvenini Traefik ayarıyla eşitle

Faz 0 `src/lib/client-ip.ts` ve `src/lib/env.ts` dosyalarını zaten yazdı ve contact route'unu bunlara bağladı. Bu task **yeni bir modül yazmaz**; Faz 0'ın bıraktığı güven anahtarını (`TRUST_CF_CONNECTING_IP`) Task 9'da kurulan Traefik `forwardedHeaders.trustedIPs` ayarıyla eşitler ve bu eşitliği bir regresyon testiyle kilitler.

**Files:**
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/lib/client-ip-trust.test.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.env.example` (yalnızca `TRUST_CF_CONNECTING_IP` yorum satırı, Task 9'a atıf eklenir)

**Interfaces:**
- Consumes (hepsi Faz 0 çıktısı, bu fazda **imzası değişmez**):
  - `src/lib/client-ip.ts`: `getClientIp(headers: Headers, options: { trustCloudflare: boolean }): string`, `isIpAddress(value: string): boolean`, `UNKNOWN_IP = "unknown"`
  - `src/lib/env.ts`: `resolveTrustCloudflare(value: string | undefined): boolean`, `trustsCloudflareHeaders(): boolean`
  - `src/app/api/contact/route.ts`: `getClientIp(request.headers, { trustCloudflare: trustsCloudflareHeaders() })` çağrısı zaten yerinde.
- Produces:
  - `tests/lib/client-ip-trust.test.ts`: güven kapısının davranışını kilitleyen regresyon testi.
  - Coolify Runtime değişkeni `TRUST_CF_CONNECTING_IP=true` (Task 9 bittikten sonra, Task 11 Step 6'da doğrulanır). Task 7'deki Coolify env tablosu bu değişkeni içerir.

- [ ] **Step 1: Faz 0'ın arayüzünün gerçekten yerinde olduğunu doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "export function getClientIp" src/lib/client-ip.ts
grep -n "export function resolveTrustCloudflare\|export function trustsCloudflareHeaders" src/lib/env.ts
grep -n "trustsCloudflareHeaders\|getClientIp" src/app/api/contact/route.ts
grep -n "TRUST_CF_CONNECTING_IP" .env.example
```

Expected (dördü de eşleşmeli, aksi halde Faz 0 merge edilmemiştir ve bu task'a başlanmaz):

```
src/lib/client-ip.ts:  export function getClientIp(
src/lib/env.ts:  export function resolveTrustCloudflare(value: string | undefined): boolean {
src/lib/env.ts:  export function trustsCloudflareHeaders(): boolean {
src/app/api/contact/route.ts:  import { getClientIp } from "@/lib/client-ip";
src/app/api/contact/route.ts:  const ip = getClientIp(request.headers, {
.env.example:  TRUST_CF_CONNECTING_IP=false
```

`getClientIp` tek argümanlı görünüyorsa (`getClientIp(headers: Headers)`) dur: birisi Faz 0'ın imzasını değiştirmiş demektir, `git log -p src/lib/client-ip.ts` ile nedenini bul ve Faz 0'ın imzasına geri dön. Bu fazda imza **değişmez**.

- [ ] **Step 2: Başarısız olan regresyon testini yaz**

`tests/lib/client-ip-trust.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { UNKNOWN_IP, getClientIp } from "@/lib/client-ip";
import { resolveTrustCloudflare } from "@/lib/env";

function headersOf(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("resolveTrustCloudflare", () => {
  it("defaults to false when the variable is unset", () => {
    expect(resolveTrustCloudflare(undefined)).toBe(false);
    expect(resolveTrustCloudflare("")).toBe(false);
  });

  it("only accepts the literal string true", () => {
    expect(resolveTrustCloudflare("true")).toBe(true);
    expect(resolveTrustCloudflare("TRUE")).toBe(true);
    expect(resolveTrustCloudflare(" true ")).toBe(true);
    expect(resolveTrustCloudflare("1")).toBe(false);
    expect(resolveTrustCloudflare("yes")).toBe(false);
  });
});

describe("CF-Connecting-IP trust gate", () => {
  const forged = headersOf({
    "CF-Connecting-IP": "203.0.113.9",
    "X-Forwarded-For": "198.51.100.4",
  });

  it("ignores a forged cloudflare header while Traefik does not trust it", () => {
    expect(getClientIp(forged, { trustCloudflare: false })).toBe("198.51.100.4");
  });

  it("uses the cloudflare header once Traefik trusts the edge ranges", () => {
    expect(getClientIp(forged, { trustCloudflare: true })).toBe("203.0.113.9");
  });

  it("never turns a non address into a rate limit key", () => {
    const junk = headersOf({
      "CF-Connecting-IP": "not-an-ip",
      "X-Forwarded-For": "also-not-an-ip",
    });
    expect(getClientIp(junk, { trustCloudflare: true })).toBe(UNKNOWN_IP);
  });

  it("reads the leftmost x-forwarded-for entry, not the proxy hop", () => {
    const chain = headersOf({
      "X-Forwarded-For": "198.51.100.4, 172.68.1.1, 10.0.0.4",
    });
    expect(getClientIp(chain, { trustCloudflare: false })).toBe("198.51.100.4");
  });
});
```

- [ ] **Step 3: Test'i çalıştır**

Run: `npx vitest run tests/lib/client-ip-trust.test.ts`

Expected: PASS, 6 test. Faz 0 uygulaması zaten doğru olduğu için bu test kırmızıdan başlamaz; işlevi Faz 1'in Traefik ayarıyla birlikte imzanın donmasını sağlamak. Test kırmızı çıkarsa Faz 0'ın `client-ip.ts` veya `env.ts` dosyası bozulmuştur; devam etmeden onu düzelt.

- [ ] **Step 4: `.env.example` yorumunu Task 9'a bağla**

`.env.example` içindeki `TRUST_CF_CONNECTING_IP` bloğunun yorumunu şununla değiştir (değer `false` kalır, üretimdeki değer Coolify'da set edilir):

```
# Coolify layer: Runtime only
# Set to "true" only once Traefik trusts the Cloudflare ranges through
# forwardedHeaders.trustedIPs, see docs/deploy/traefik-ve-origin.md section 2.
# Until then the rate limiter reads the first x-forwarded-for value instead of
# CF-Connecting-IP. Local development and PR previews stay on "false" because
# neither sits behind Cloudflare.
TRUST_CF_CONNECTING_IP=false
```

- [ ] **Step 5: Kapıları çalıştır**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck
npm run lint
npm run test
```

Expected: üçü de hatasız geçer. `npm run test` çıktısında Faz 0'ın `src/lib/*.test.ts` dosyaları ve bu fazın `tests/**` dosyaları birlikte görünür (`vitest.config.ts` iki deseni de içeriyor, bkz. Task 1).

- [ ] **Step 6: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add tests/lib/client-ip-trust.test.ts .env.example
git commit -m "test: lock the CF-Connecting-IP trust gate

The rate limit key may only come from CF-Connecting-IP once Traefik declares
the Cloudflare ranges in forwardedHeaders.trustedIPs. This test freezes that
contract so a later change cannot start trusting a client supplied header by
accident. TRUST_CF_CONNECTING_IP flips to true in Coolify after task 9."
```

**Not, Coolify tarafı:** `TRUST_CF_CONNECTING_IP=true` değeri Coolify'da Runtime değişkeni olarak **yalnızca Task 9 (Traefik `forwardedHeaders.trustedIPs` + origin kısıtlaması) tamamlandıktan sonra** set edilir. Sıra ters çevrilirse rate limit anahtarı istemcinin gönderdiği başlıktan türer ve limit tamamen atlanabilir hale gelir. Doğrulama Task 11 Step 6'da.

---

## Task 7: Coolify kurulum checklist'i

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/deploy/coolify-kurulum.md`

**Interfaces:**
- Consumes: `Dockerfile` build arg `NEXT_PUBLIC_SITE_URL` (Task 3); `HEALTHCHECK` yolu `/api/health` (Task 3); `.github/workflows/ci.yml` job adları `checks` ve `docker` (Task 5).
- Produces:
  - `docs/deploy/coolify-kurulum.md`, Coolify panelinde el ile yürütülen adım listesi.
  - Env katman sözleşmesi: `NEXT_PUBLIC_SITE_URL` = Build variable; `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `GATUS_URL` = Runtime only. Faz 5 `GATUS_URL`'i bu tabloya bakarak ekler.
  - Preview domain şablonu: `http://{{pr_id}}.preview.dogancanyildiz.sh`. Task 8 bu şablon için DNS kaydı açar, Task 9 erişimi admin IP'siyle sınırlar.

- [ ] **Step 1: Checklist dokümanını yaz**

`docs/deploy/coolify-kurulum.md`:

````markdown
# Coolify kurulumu (el ile checklist)

Hedef Coolify sürümü: v4.3.1. Bu adımlar Coolify panelinde el ile yürütülür, repoda otomatikleştirilmez. Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 1, 2, 6 ve 9.

## 1. GitHub App kaynağı

- [ ] Coolify -> Sources -> "+ Add" -> GitHub App.
- [ ] App'i `dogancanyildiz/portfolio` reposuna kur.
- [ ] Repository permissions: Contents `Read`, Metadata `Read`, Pull requests `Read and write`, Checks `Read and write`, Deployments `Read and write`, Webhooks `Read and write`.
- [ ] Doğrulama: Coolify kaynak sayfasında repo listesi görünüyor. Pull requests izni eksikse Preview Deployments sessizce çalışmaz, Deploy Key ile bu özellik hiç desteklenmiyor.

## 2. Uygulama kaynağı

- [ ] "+ New" -> Application -> Private Repository (with GitHub App) -> `dogancanyildiz/portfolio`, branch `main`.
- [ ] Build Pack: **Dockerfile**. Nixpacks veya Docker Compose seçilmez.
- [ ] Base Directory: `/`
- [ ] Dockerfile Location: `/Dockerfile`
- [ ] Ports Exposes: `3000`
- [ ] Ports Mappings: **boş bırakılır**. Host port mapping tanımlanırsa Coolify'ın zero downtime rolling update koşullarından biri bozulur.

## 3. Domain

- [ ] Domains: `https://dogancanyildiz.sh`
- [ ] "Redirect" ayarı: www -> non-www (Coolify'ın dahili www yönlendirmesi). `dogancanyildiz.com -> dogancanyildiz.sh` cross domain yönlendirmesi burada değil, Cloudflare Redirect Rules'ta tanımlanır, bkz. `docs/deploy/cloudflare-kurulum.md`.

## 4. Env değişkenleri

Coolify'da her değişkenin yanındaki "Build Variable?" kutusu, o değişkenin `docker build --build-arg` olarak geçip geçmeyeceğini belirler.

| Değişken | Build Variable? | Değer | Gerekçe |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Evet** | `https://dogancanyildiz.sh` | `next build` bunu client bundle'a inline ediyor. Yalnızca Runtime işaretlenirse tarayıcıda sessizce `undefined` kalır. |
| `RESEND_API_KEY` | Hayır (Runtime) | Resend panelinden alınan `re_...` anahtarı | Sır. Build variable image katmanlarına ve build loglarına sızabilir. |
| `CONTACT_EMAIL` | Hayır (Runtime) | `me@dogancanyildiz.com` | Yalnızca sunucu tarafındaki contact route okuyor. |
| `FROM_EMAIL` | Hayır (Runtime) | `contact@dogancanyildiz.sh` | Aynı gerekçe. Resend'de doğrulanmış domain olmalı, bkz. `docs/deploy/resend-domain.md`. |
| `TRUST_CF_CONNECTING_IP` | Hayır (Runtime) | Task 9 tamamlanana kadar `false`, sonra `true` | Faz 0'ın `trustsCloudflareHeaders()` kapısı. Traefik `forwardedHeaders.trustedIPs` set edilmeden `true` yapılırsa rate limit anahtarı istemcinin uydurduğu başlıktan türer ve limit tamamen atlanabilir. Bkz. `docs/deploy/traefik-ve-origin.md` bölüm 2. |
| `GATUS_URL` | Hayır (Runtime) | Faz 5'te doldurulur | İç adres, client'a hiçbir koşulda gitmez. |

- [ ] Doğrulama: deploy sonrası Coolify build logunda `re_` ile başlayan hiçbir string yok.
- [ ] Doğrulama: canlı sayfanın HTML kaynağında `https://dogancanyildiz.sh` geçiyor (`NEXT_PUBLIC_SITE_URL` gerçekten gömülmüş).
- [ ] Doğrulama: `TRUST_CF_CONNECTING_IP` yalnızca Task 9 bittikten sonra `true` yapıldı; PR preview ortamlarında `false` kalıyor (preview'lar Cloudflare'ın arkasında değil).

## 5. Auto deploy ve Preview Deployments

- [ ] Advanced -> "Auto Deploy" açık. `main`'e push, GitHub App webhook'u üzerinden yeniden deploy tetikler.
- [ ] Advanced -> "Preview Deployments" açık.
- [ ] Preview URL şablonu: `http://{{pr_id}}.preview.dogancanyildiz.sh`
  - Şema bilerek `http`. Cloudflare ücretsiz planı wildcard DNS kaydını proxy'leyemiyor, dolayısıyla `*.preview` kaydı gri bulut kalıyor; gri bulutta Let's Encrypt HTTP-01 doğrulaması origin'e doğrudan ulaşmak zorunda kalır ve origin yalnızca Cloudflare IP'lerine açık olduğu için başarısız olur. Preview'lar TLS'siz ve yalnızca allowlist'teki admin IP'sinden erişilebilir kalır, bkz. `docs/deploy/traefik-ve-origin.md`.
- [ ] Doğrulama: test PR'ı açıldığında Coolify PR'a preview URL'i içeren bir yorum bırakıyor.

## 6. Health check

Dockerfile'da bir `HEALTHCHECK` tanımlıysa Coolify'ın UI ayarını ezer. Bu repoda `HEALTHCHECK` tanımlı, dolayısıyla asıl kaynak Dockerfile'dır. UI ayarı yine de aynı değerlerle doldurulur ki iki katman çelişmesin.

- [ ] Health Check: Enabled
- [ ] Path: `/api/health`
- [ ] Port: `3000`
- [ ] Method: `GET`, Expected Status: `200`
- [ ] Interval: `15`, Timeout: `5`, Retries: `3`, **Start Period: `30`**

Start period kritik: `coollabsio/coolify#7500`, Dockerfile ile build edilen Node container'larında curl ve wget tabanlı probe'ların connection refused vermesini raporluyor ve issue hâlâ açık. Bu repoda probe curl kullanmıyor (node'un yerleşik `fetch`'i kullanılıyor, `node:24-alpine` zaten curl içermiyor) ve start period standalone soğuk başlangıcı kapsıyor.

- [ ] Doğrulama, production'a bağlamadan önce sunucuda elle çalıştır:

```bash
# <container> yerine Coolify'ın oluşturduğu konteyner adını yaz
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i portfolio
docker inspect --format '{{.State.Health.Status}}' <container>
docker exec <container> node -e "fetch('http://127.0.0.1:3000/api/health').then(async (r) => { console.log(r.status, await r.text()); })"
```

Beklenen:

```
healthy
200 {"status":"ok"}
```

`unhealthy` görülürse rolling update yeni deploy'ları geri alır. O durumda Coolify UI'da health check geçici olarak kapatılır, sorun `#7500` referansıyla not edilir ve production'a health check bağlı halde geçilmez.

## 7. Rolling update (zero downtime) koşulları

Dördü birden sağlanmalı:

- [ ] Health check geçiyor (bölüm 6)
- [ ] Varsayılan konteyner isimleri kullanılıyor (Coolify'ın ürettiği isim değiştirilmedi)
- [ ] Host port mapping yok (bölüm 2)
- [ ] Compose build pack kullanılmıyor (bölüm 2)

## 8. Rollback ve yedek

- [ ] Coolify'ın tek tıkla rollback'i yalnızca sunucuda duran local image'lar üzerinde çalışır; git tabanlı Dockerfile yolu bunu native sağlar, ek ayar gerekmez.
- [ ] Coolify instance'ının kendi backup/restore mekanizması bu deploy hattından bağımsız olarak kurulur.
- [ ] GHCR pull yoluna ileride geçilirse floating `latest` tag kullanılmaz, git SHA tag zorunludur.

## 9. GitHub branch protection

- [ ] GitHub -> Settings -> Branches -> `main` için "Require status checks to pass": `lint, typecheck, test, build` ve `hadolint and image build` işaretlenir. Bu iki check `.github/workflows/ci.yml` içindeki `checks` ve `docker` job'larının görünen adlarıdır.
````

- [ ] **Step 2: Dokümanın iç tutarlılığını doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -c 'NEXT_PUBLIC_SITE_URL' docs/deploy/coolify-kurulum.md
grep -n '\-\-start-period=30s' Dockerfile
grep -n 'Start Period: `30`' docs/deploy/coolify-kurulum.md
grep -n 'lint, typecheck, test, build' .github/workflows/ci.yml
```

Expected:

```
3
<satır no>:HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
<satır no>:- [ ] Interval: `15`, Timeout: `5`, Retries: `3`, **Start Period: `30`**
<satır no>:    name: lint, typecheck, test, build
```

Son üç komut çıktı vermiyorsa doküman ile Dockerfile veya workflow arasında sapma vardır, doküman düzeltilir.

- [ ] **Step 3: Em dash taraması**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -c "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" docs/deploy/coolify-kurulum.md || echo 0
```

Expected: `0`

- [ ] **Step 4: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/deploy/coolify-kurulum.md
git commit -m "docs: add the manual coolify setup checklist

GitHub App permissions, Dockerfile build pack settings, the build and
runtime split for every environment variable, the preview deployment domain
template and the health check verification required by coolify#7500."
```

---

## Task 8: Cloudflare kurulum checklist'i

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/deploy/cloudflare-kurulum.md`

**Interfaces:**
- Consumes: Coolify preview domain şablonu `http://{{pr_id}}.preview.dogancanyildiz.sh` (Task 7).
- Produces:
  - `docs/deploy/cloudflare-kurulum.md`.
  - DNS sözleşmesi: `dogancanyildiz.sh` apex ve `www` proxied; `*.preview.dogancanyildiz.sh` DNS-only; `dogancanyildiz.com` apex ve `www` proxied ve `192.0.2.1` üzerine yönlendirme amaçlı.
  - Redirect Rule adı `com to sh`, Cache Rule adı `static assets`, Rate limiting rule adı `contact endpoint`. Task 11 bu üç kuralı curl ile doğrular.
  - Cloudflare IPv4/IPv6 aralık listesi Task 9 tarafından Traefik `trustedIPs` ve ufw kurallarında tekrar kullanılır.

- [ ] **Step 1: Checklist dokümanını yaz**

`docs/deploy/cloudflare-kurulum.md`:

````markdown
# Cloudflare kurulumu (el ile checklist)

Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 8, `docs/09-guvenlik.md` bölüm 6. Plan ücretsiz (Free) plan varsayıyor.

## 1. DNS kayıtları

`ORIGIN_IPV4` yerine sunucunun statik IPv4 adresi yazılır.

### Zone: dogancanyildiz.sh

| Tip | Ad | İçerik | Proxy |
|---|---|---|---|
| A | `@` | `ORIGIN_IPV4` | Proxied (turuncu bulut) |
| CNAME | `www` | `dogancanyildiz.sh` | Proxied (turuncu bulut) |
| A | `*.preview` | `ORIGIN_IPV4` | **DNS only (gri bulut)** |

- [ ] `*.preview` bilerek gri bulut: ücretsiz planda wildcard DNS kayıtları proxy'lenemez. Preview'lar bu yüzden TLS'siz `http` üzerinden ve yalnızca origin firewall'unda allowlist'e alınmış admin IP'sinden erişilebilir, bkz. `docs/deploy/traefik-ve-origin.md`.
- [ ] Resend'in ekleyeceği MX ve TXT kayıtları (`send`, `resend._domainkey`, `_dmarc`) proxy'lenemez ve proxy'lenmemeli, bkz. `docs/deploy/resend-domain.md`.

### Zone: dogancanyildiz.com

| Tip | Ad | İçerik | Proxy |
|---|---|---|---|
| A | `@` | `192.0.2.1` | Proxied (turuncu bulut) |
| CNAME | `www` | `dogancanyildiz.com` | Proxied (turuncu bulut) |

`192.0.2.1` RFC 5737 dokümantasyon aralığından bir adres. Redirect Rule istek origin'e hiç gitmeden edge'de cevaplandığı için gerçek bir sunucuya işaret etmesi gerekmiyor; proxied bir kaydın var olması yeterli, olmazsa Rules hiç çalışmaz.

- [ ] **Uyarı:** `.com` zone'undaki MX kayıtlarına dokunulmaz. İletişim adresi `me@dogancanyildiz.com` ve HTTP yönlendirmesi e-postayı etkilemez, ama MX kayıtları silinirse posta durur.

## 2. SSL/TLS

- [ ] SSL/TLS -> Overview -> Encryption mode: **Full (strict)**. Flexible seçilirse Cloudflare ile origin arası düz HTTP'ye düşer.
- [ ] SSL/TLS -> Edge Certificates -> "Always Use HTTPS": açık.
- [ ] Origin sertifikası Traefik'in Let's Encrypt HTTP-01 akışıyla kalır. Cloudflare proxied modda `/.well-known/acme-challenge` yolunu geçirir, "Always Use HTTPS" bu yolu engellemez.
- [ ] HSTS Cloudflare'da **açılmaz**. Tek kaynak Traefik'teki `security-headers` middleware'i, bkz. `docs/deploy/traefik-ve-origin.md`. İki yerde tanımlamak tutarsızlık riski taşır.

## 3. Redirect Rule: `com to sh`

Rules -> Redirect Rules -> Create rule.

- [ ] Rule name: `com to sh`
- [ ] Custom filter expression:

```
(http.host eq "dogancanyildiz.com" or http.host eq "www.dogancanyildiz.com")
```

- [ ] Then: URL redirect -> Type: **Dynamic**
- [ ] Expression:

```
concat("https://dogancanyildiz.sh", http.request.uri.path)
```

- [ ] Status code: **301**
- [ ] Preserve query string: **açık**
- [ ] Hedef bilerek `https://dogancanyildiz.sh` köküne gidiyor, `/en` değil. Zincirli yönlendirme (`.com -> .sh -> .sh/en`) yasak, EN zaten kökte servis ediliyor.

Doğrulama:

```bash
curl -sI https://dogancanyildiz.com/projects | grep -i -E '^(HTTP|location)'
curl -sI 'https://www.dogancanyildiz.com/tr/about?utm_source=x' | grep -i -E '^(HTTP|location)'
```

Beklenen:

```
HTTP/2 301
location: https://dogancanyildiz.sh/projects
HTTP/2 301
location: https://dogancanyildiz.sh/tr/about?utm_source=x
```

Tek atlama şartı: ikinci bir `301` veya `location` satırı çıkmamalı.

## 4. Cache Rule: `static assets`

Caching -> Cache Rules -> Create rule.

- [ ] Rule name: `static assets`
- [ ] Expression:

```
(starts_with(http.request.uri.path, "/_next/static/")) or (lower(http.request.uri.path.extension) in {"png" "jpg" "jpeg" "webp" "avif" "svg" "ico" "woff2"})
```

- [ ] Cache eligibility: **Eligible for cache**
- [ ] Edge TTL: **Use cache-control header if present, bypass cache if not**
- [ ] Browser TTL: **Respect origin TTL**

Next.js `/_next/static/` altına zaten `cache-control: public, max-age=31536000, immutable` gönderiyor; bu kural o header'ı edge'de de geçerli kılıyor.

Doğrulama (build sonrası gerçek bir asset yolu ile, ikinci istekte `HIT` beklenir):

```bash
ASSET=$(curl -s https://dogancanyildiz.sh/ | grep -o '/_next/static/[^"]*\.js' | head -1)
curl -sI "https://dogancanyildiz.sh${ASSET}" | grep -i -E '^(cf-cache-status|cache-control)'
curl -sI "https://dogancanyildiz.sh${ASSET}" | grep -i '^cf-cache-status'
```

Beklenen: ilk çağrıda `cf-cache-status: MISS` ve `cache-control: public, max-age=31536000, immutable`, ikinci çağrıda `cf-cache-status: HIT`.

## 5. Rate limiting rule: `contact endpoint`

Security -> WAF -> Rate limiting rules -> Create rule.

Ücretsiz planın sert sınırları var ve kural buna göre kuruluyor: en fazla 1 kural, sayma periyodu yalnızca 10 saniye, mitigation timeout yalnızca 10 saniye, ifadede yalnızca `Path` ve `Verified Bot` alanları kullanılabiliyor. HTTP metoduna göre filtreleme ücretsiz planda mümkün değil, bu yüzden ifade yalnızca yola bakar.

- [ ] Rule name: `contact endpoint`
- [ ] Expression:

```
(http.request.uri.path eq "/api/contact")
```

- [ ] Characteristics: `IP`
- [ ] Period: `10 seconds`
- [ ] Requests: `3`
- [ ] Action: `Block`, Duration: `10 seconds`
- [ ] Bu yalnızca dış katman. Uygulama içindeki in-memory sliding window limiti (Faz 0'ın contact sertleştirmesi) aynen yerinde kalır, biri diğerinin yerine geçmez.

Doğrulama:

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "$i: %{http_code}\n" -X POST https://dogancanyildiz.sh/api/contact \
    -H 'content-type: application/json' -d '{}'
done
```

Beklenen: ilk istekler uygulamadan `400` döner (boş gövde), altıncı istekte Cloudflare `429` verir.

## 6. Bot Fight Mode

- [ ] Security -> Bots -> "Bot Fight Mode": açık.
- [ ] Bu edge katmanı, uygulama içi honeypot ve rate limit'in yerine geçmez, üstüne eklenir.

## 7. Turnstile: şimdilik eklenmiyor

- [ ] Cloudflare zaten bir bağımlılık olduğu için Turnstile'ın ek maliyeti düşük, ama kanıtlanmış spam görülene kadar eklenmiyor (YAGNI). Gerçek spam gelirse ilk adım budur.

## 8. Cloudflare IP aralıkları

Traefik `forwardedHeaders.trustedIPs` ve origin firewall kuralları bu listeye dayanır. Liste değişebilir, kurulumdan önce tazelenir:

```bash
curl -s https://www.cloudflare.com/ips-v4
curl -s https://www.cloudflare.com/ips-v6
```

2026-08-27 tarihindeki liste `docs/deploy/traefik-ve-origin.md` içinde birebir yazılı.
````

- [ ] **Step 2: Dokümanın iç tutarlılığını doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -c 'dogancanyildiz.sh' docs/deploy/cloudflare-kurulum.md
grep -n '192.0.2.1' docs/deploy/cloudflare-kurulum.md
grep -n 'Full (strict)' docs/deploy/cloudflare-kurulum.md
grep -c "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" docs/deploy/cloudflare-kurulum.md || echo 0
```

Expected: ilk komut 10'dan büyük bir sayı, ikinci ve üçüncü komutlar birer satır döner, son komut `0` yazar.

- [ ] **Step 3: Cloudflare IP listesinin dokümandaki tarihle uyumlu olduğunu doğrula**

Run:

```bash
curl -s https://www.cloudflare.com/ips-v4 | wc -l
curl -s https://www.cloudflare.com/ips-v6 | wc -l
```

Expected: `15` ve `7`. Sayılar farklıysa Task 9'daki liste tazelenir ve doküman güncellenir.

- [ ] **Step 4: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/deploy/cloudflare-kurulum.md
git commit -m "docs: add the manual cloudflare setup checklist

DNS records for both zones, Full strict TLS, the single hop com to sh
redirect rule, a cache rule for immutable static assets, the contact
endpoint rate limiting rule within the free plan limits, and Bot Fight Mode.
Every section carries its own curl verification."
```

---

## Task 9: Traefik ayarları ve origin kısıtlaması

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/deploy/traefik-ve-origin.md`

**Interfaces:**
- Consumes: Cloudflare IP aralıkları (Task 8, bölüm 8); Faz 0'ın `getClientIp(headers, { trustCloudflare })` fonksiyonunun okuduğu `CF-Connecting-IP` header'ı ve `TRUST_CF_CONNECTING_IP` anahtarı (Task 6); Coolify preview şeması `http://{{pr_id}}.preview.dogancanyildiz.sh` (Task 7).
- Produces:
  - `docs/deploy/traefik-ve-origin.md`.
  - Traefik entrypoint adları: `http` (80) ve `https` (443), Coolify'ın varsayılanları.
  - Dinamik config dosya yolu: `/data/coolify/proxy/dynamic/cloudflare.yaml`, middleware adları `security-headers`, `compress`, `cloudflare-only`.
  - Yedek yönlendirme middleware adı `redirect-to-sh`.

- [ ] **Step 1: Dokümanı yaz**

`docs/deploy/traefik-ve-origin.md`:

````markdown
# Traefik ayarları ve origin kısıtlaması (el ile checklist)

Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 7 ve 8b/8e, `docs/09-guvenlik.md` bölüm 6. Traefik, Coolify'ın kendi proxy'sidir; entrypoint adları `http` (port 80) ve `https` (port 443).

## 0. Ön koşul: readonly labels kapatılır

- [ ] Coolify -> uygulama -> Advanced -> "Readonly labels" **kapatılır**. Aksi halde elle eklenen middleware etiketleri UI tarafından ezilir.

## 1. Cloudflare IP aralıkları (2026-08-27)

Kurulumdan önce `curl -s https://www.cloudflare.com/ips-v4` ve `curl -s https://www.cloudflare.com/ips-v6` ile tazelenir.

IPv4 (15 blok):

```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

IPv6 (7 blok):

```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

## 2. forwardedHeaders.trustedIPs (Traefik static config)

`trustedIPs` bir entrypoint ayarıdır, yani Traefik'in static config'ine girer. Coolify'da bu dosya `/data/coolify/proxy/docker-compose.yml` içindedir ve panelden Server -> Proxy -> Configuration ekranından düzenlenir.

- [ ] Traefik servisinin `command:` listesine şu iki satır eklenir:

```yaml
      - '--entryPoints.http.forwardedHeaders.trustedIPs=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32'
      - '--entryPoints.https.forwardedHeaders.trustedIPs=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,2400:cb00::/32,2606:4700::/32,2803:f800::/32,2405:b500::/32,2405:8100::/32,2a06:98c0::/29,2c0f:f248::/32'
```

- [ ] Proxy yeniden başlatılır (Coolify -> Server -> Proxy -> Restart).
- [ ] Bu ayar olmadan Traefik gerçek ziyaretçi IP'sini Cloudflare edge IP'si sanar; contact formunun IP bazlı rate limit'i tüm istekleri tek kovada toplar ve `CF-Connecting-IP` taklit edilebilir bir header olarak kalır.

Doğrulama:

```bash
docker inspect coolify-proxy --format '{{range .Config.Cmd}}{{println .}}{{end}}' | grep forwardedHeaders
```

Beklenen: yukarıdaki iki satırın karşılığı çıktıda görünür.

- [ ] **Ancak bu doğrulama geçtikten sonra**: Coolify -> uygulama -> Environment Variables -> `TRUST_CF_CONNECTING_IP` değeri `false`'tan `true`'ya çevrilir ve uygulama redeploy edilir. Bu, Faz 0'ın `trustsCloudflareHeaders()` kapısını açar ve contact rate limit anahtarı `CF-Connecting-IP`'den türemeye başlar. Sıra ters çevrilirse (`true` önce, `trustedIPs` sonra) rate limit tamamen atlanabilir hale gelir.
- [ ] Doğrulama: uydurma bir başlıkla atılan istek limiti atlayamıyor.

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Content-Type: application/json" \
    -H "CF-Connecting-IP: 203.0.113.$i" \
    -d '{"name":"t","email":"t@example.org","message":"rate limit probe"}' \
    https://dogancanyildiz.sh/api/contact
done
```

Beklenen: son satır `429`. Cloudflare edge, istemcinin gönderdiği `CF-Connecting-IP` başlığını kendi değeriyle ezdiği için altı istek de aynı kovaya düşer; `429` görülmüyorsa `trustedIPs` veya origin kısıtlaması eksiktir.

## 3. Dinamik middleware'ler

`/data/coolify/proxy/dynamic/cloudflare.yaml` dosyası oluşturulur:

```yaml
http:
  middlewares:
    # HSTS. Single source of truth for this header. It is deliberately not
    # set in Cloudflare and not in next.config.ts headers().
    security-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: false

    # gzip, brotli and zstd negotiated through Accept-Encoding
    compress:
      compress: {}

    # Only Cloudflare edge addresses may reach the application routers.
    # No ipStrategy is set on purpose: the match must run against the real
    # TCP peer, not against a forwarded header.
    cloudflare-only:
      ipAllowList:
        sourceRange:
          - 173.245.48.0/20
          - 103.21.244.0/22
          - 103.22.200.0/22
          - 103.31.4.0/22
          - 141.101.64.0/18
          - 108.162.192.0/18
          - 190.93.240.0/20
          - 188.114.96.0/20
          - 197.234.240.0/22
          - 198.41.128.0/17
          - 162.158.0.0/15
          - 104.16.0.0/13
          - 104.24.0.0/14
          - 172.64.0.0/13
          - 131.0.72.0/22
          - 2400:cb00::/32
          - 2606:4700::/32
          - 2803:f800::/32
          - 2405:b500::/32
          - 2405:8100::/32
          - 2a06:98c0::/29
          - 2c0f:f248::/32

    # Backup path only. The live com to sh redirect lives in Cloudflare
    # Redirect Rules. This middleware exists so the redirect survives a
    # temporary switch back to DNS only mode.
    redirect-to-sh:
      redirectRegex:
        regex: "^https://(www\\.)?dogancanyildiz\\.com/(.*)"
        replacement: "https://dogancanyildiz.sh/${2}"
        permanent: true
```

- [ ] Dosya kaydedilir, proxy yeniden başlatılır.
- [ ] `${2}` ikinci yakalama grubudur, `(www\.)?` birinci grubu tüketir. Hedef doğrudan `https://dogancanyildiz.sh/` köküne gider, `/en`'e değil; zincirli yönlendirme yasağı burada da geçerli.

## 4. Uygulamaya middleware etiketleri

Coolify -> uygulama -> Advanced -> Custom Labels:

```
traefik.http.routers.portfolio.middlewares=security-headers@file,compress@file
```

- [ ] `@file` eki dinamik dosyadan gelen middleware'lere referans verir.
- [ ] `buffering` middleware'i **eklenmez**. React'ın streaming SSR yanıtlarını Traefik'in `mem`/`maxResponseBodyBytes` buffering'i geciktirir; ihtiyaç doğarsa staging'de gözlemlenip ayrıca değerlendirilir.
- [ ] HTTP/3 ve Brotli Traefik'te ayrıca açılmaz, Cloudflare proxied modda ikisi de edge'de sağlanıyor.

Doğrulama:

```bash
curl -sI https://dogancanyildiz.sh/ | grep -i -E '^(strict-transport-security|content-encoding|x-powered-by)'
curl -sI -H 'accept-encoding: br' https://dogancanyildiz.sh/ | grep -i '^content-encoding'
```

Beklenen: `strict-transport-security: max-age=31536000; includeSubDomains` var, `x-powered-by` hiç yok, `content-encoding` `br` veya `zstd`.

## 5. Origin'i Cloudflare IP'lerine kısıtlamak

İki yol var, **ufw tercih edilir**: paket seviyesinde çalışır, Traefik'e hiç yük bindirmez ve Traefik yeniden yapılandırılırken bile geçerli kalır.

### 5a. ufw (tercih edilen)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH

# Cloudflare edge addresses on 80 and 443
for cidr in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
  sudo ufw allow from "$cidr" proto tcp to any port 80,443 comment 'cloudflare'
done

# Admin address for preview deployments, which are DNS only and therefore
# never reach the origin through Cloudflare. Replace ADMIN_IPV4 with the
# owner's current public address.
sudo ufw allow from ADMIN_IPV4 proto tcp to any port 80,443 comment 'admin previews'

sudo ufw --force enable
sudo ufw status numbered
```

- [ ] `ADMIN_IPV4` değeri `curl -s https://api.ipify.org` ile alınır ve adres değiştikçe güncellenir.
- [ ] Kural sayısı beklenen: 22 Cloudflare bloğu + OpenSSH + admin = 24 satır.

Doğrulama, Cloudflare'ı bypass edip origin'e doğrudan bağlanmayı dene:

```bash
# ORIGIN_IPV4 yerine sunucunun gerçek adresi. Bu komut allowlist'te olmayan
# bir ağdan (ör. mobil veri) çalıştırılır.
curl -sS --max-time 8 --resolve dogancanyildiz.sh:443:ORIGIN_IPV4 https://dogancanyildiz.sh/api/health
```

Beklenen: `curl: (28) Connection timed out` veya `curl: (7) Failed to connect`. Bir JSON gövdesi dönerse kısıt çalışmıyordur.

### 5b. Traefik ipAllowList (alternatif)

ufw kullanılamıyorsa (ör. sağlayıcı tarafında yönetilen bir firewall varsa) bölüm 3'teki `cloudflare-only` middleware'i uygulamanın etiketlerine eklenir:

```
traefik.http.routers.portfolio.middlewares=cloudflare-only@file,security-headers@file,compress@file
```

- [ ] Bu yol seçilirse preview router'ına `cloudflare-only` **eklenmez**, aksi halde DNS-only preview'lar hiç açılmaz.
- [ ] Bu yol origin portlarını ağ seviyesinde kapatmaz, yalnızca HTTP katmanında `403` döner. ufw ile birlikte kullanılabilir, ufw'nin yerine geçmez.

## 6. Preview deployment erişimi

- [ ] `*.preview.dogancanyildiz.sh` Cloudflare'da DNS-only (gri bulut), bkz. `docs/deploy/cloudflare-kurulum.md` bölüm 1.
- [ ] Preview'lar `http` üzerinden servis edilir, TLS yok: gri bulutta Let's Encrypt HTTP-01 doğrulaması origin'e doğrudan ulaşmak zorunda kalır ve ufw bunu keser.
- [ ] Erişim yalnızca ufw'de allowlist'e alınmış admin IP'sinden mümkündür. Bu bilerek seçilmiş bir kısıt: preview'lar herkese açık değildir.
````

- [ ] **Step 2: Dokümandaki IP listesinin canlı listeyle aynı olduğunu doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
diff <(curl -s https://www.cloudflare.com/ips-v4) <(sed -n '/^173.245.48.0\/20$/,/^131.0.72.0\/22$/p' docs/deploy/traefik-ve-origin.md | head -15) && echo "ipv4 list matches"
diff <(curl -s https://www.cloudflare.com/ips-v6) <(sed -n '/^2400:cb00::\/32$/,/^2c0f:f248::\/32$/p' docs/deploy/traefik-ve-origin.md | head -7) && echo "ipv6 list matches"
```

Expected:

```
ipv4 list matches
ipv6 list matches
```

- [ ] **Step 3: Em dash ve iç tutarlılık taraması**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -c "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" docs/deploy/traefik-ve-origin.md || echo 0
grep -n 'security-headers@file,compress@file' docs/deploy/traefik-ve-origin.md
grep -n 'buffering' docs/deploy/traefik-ve-origin.md
```

Expected: `0`, ardından middleware etiketi satırı ve buffering satırı görünür.

- [ ] **Step 4: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/deploy/traefik-ve-origin.md
git commit -m "docs: add traefik and origin lockdown checklist

Cloudflare ranges in forwardedHeaders.trustedIPs on both entrypoints, an HSTS
and compress middleware pair, buffering left off for streaming SSR, the
redirectregex backup path, and a ufw first origin lockdown with a Traefik
ipAllowList alternative."
```

---

## Task 10: Resend domain doğrulaması ve `.env.example`

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/deploy/resend-domain.md`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.env.example`

**Interfaces:**
- Consumes: Coolify env tablosu (Task 7, bölüm 4); Cloudflare DNS zone `dogancanyildiz.sh` (Task 8, bölüm 1).
- Produces:
  - `docs/deploy/resend-domain.md`.
  - `.env.example` içindeki tam env adı listesi: `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `GATUS_URL`.
  - Adres sözleşmesi: `CONTACT_EMAIL=me@dogancanyildiz.com` (alıcı), `FROM_EMAIL=contact@dogancanyildiz.sh` (gönderici, doğrulanmış domain).

- [ ] **Step 1: `.env.example` dosyasını yeniden yaz**

`.env.example`:

```
# Build variable. next build inlines this into the client bundle, so Coolify
# must mark it as a Build Variable. A runtime only value stays undefined in
# the browser.
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh

# Runtime only. Never mark these as Coolify build variables: build variables
# can leak into image layers and build logs.

# Resend API key, https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxx

# Recipient of contact form messages
CONTACT_EMAIL=me@dogancanyildiz.com

# Sender address. The domain must be verified in Resend, see
# docs/deploy/resend-domain.md
FROM_EMAIL=contact@dogancanyildiz.sh

# Gatus status API base url, filled in during Faz 5. Server side only, the
# value never reaches the client.
GATUS_URL=
```

- [ ] **Step 2: Resend checklist dokümanını yaz**

`docs/deploy/resend-domain.md`:

````markdown
# Resend domain doğrulaması (el ile checklist)

Amaç: contact formunun gönderdiği postanın spam'e düşmemesi. Alıcı adres `me@dogancanyildiz.com` olarak kesinleşti (`docs/11-acik-sorular.md` soru 5); gönderici adres doğrulanmış bir domain üzerinde olmak zorunda, bu yüzden `contact@dogancanyildiz.sh` kullanılıyor.

## 1. Resend'de domain ekle

- [ ] Resend -> Domains -> "Add Domain" -> `dogancanyildiz.sh`
- [ ] Region: `eu-west-1` (Türkiye'ye en yakın Resend bölgesi). Seçilen bölge MX kaydının hedefini belirler.
- [ ] Resend üç kayıt üretir. Değerler panelden kopyalanır, buraya yazılan `p=...` ve host adları örnektir.

## 2. Cloudflare DNS kayıtları

`dogancanyildiz.sh` zone'una eklenir. Üçü de **DNS only (gri bulut)**; MX ve TXT kayıtları zaten proxy'lenemez.

| Tip | Ad | İçerik | Öncelik |
|---|---|---|---|
| MX | `send` | Resend'in verdiği `feedback-smtp.<region>.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - |
| TXT | `resend._domainkey` | Resend'in verdiği `p=MIGfMA0GCSq...` DKIM değeri | - |

DMARC kaydı Resend tarafından üretilmiyor, elle eklenir:

| Tip | Ad | İçerik |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:me@dogancanyildiz.com; adkim=r; aspf=r` |

- [ ] `p=none` bilinçli bir başlangıç: rapor topla, hiçbir postayı reddetme. Birkaç hafta rapor izlendikten sonra `p=quarantine`'a çıkılabilir.

## 3. Doğrulama

- [ ] Resend panelinde domain durumu `Verified` oluyor (DNS yayılması birkaç dakika sürebilir).
- [ ] Komut satırından:

```bash
dig +short TXT send.dogancanyildiz.sh
dig +short MX send.dogancanyildiz.sh
dig +short TXT resend._domainkey.dogancanyildiz.sh
dig +short TXT _dmarc.dogancanyildiz.sh
```

Beklenen: sırasıyla `"v=spf1 include:amazonses.com ~all"`, `10 feedback-smtp.<region>.amazonses.com.`, `"p=MIGfMA0GCSq..."` ile başlayan DKIM değeri ve `"v=DMARC1; p=none; ..."`.

## 4. Uçtan uca test

Coolify'da `RESEND_API_KEY`, `CONTACT_EMAIL` ve `FROM_EMAIL` Runtime değişkeni olarak set edildikten ve uygulama yeniden deploy edildikten sonra:

```bash
curl -s -X POST https://dogancanyildiz.sh/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Deploy check","email":"me@dogancanyildiz.com","subject":"faz 1 smoke test","message":"Deploy pipeline verification message."}'
```

Beklenen: `{"ok":true}` ve `me@dogancanyildiz.com` kutusuna postanın ulaşması.

- [ ] Gelen postanın kaynağında `dkim=pass` ve `spf=pass` görünüyor (Gmail'de "Show original").

## 5. Sık yapılan hata

- [ ] `dogancanyildiz.com` zone'undaki MX kayıtlarına dokunulmadı. `.com` HTTP tarafında `.sh`'a 301 yönleniyor ama posta akışı bundan tamamen bağımsız; MX silinirse `me@dogancanyildiz.com` adresine posta ulaşmaz.
- [ ] `RESEND_API_KEY` Coolify'da Build Variable olarak işaretlenmedi.
````

- [ ] **Step 3: Env adlarının kod ile tutarlı olduğunu doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -o 'process\.env\.[A-Z_]*' -r src | sort -u
grep -o '^[A-Z_]*=' .env.example | tr -d '=' | sort
```

Expected: `src` altında geçen her env adı `.env.example` listesinde bulunur. `.env.example` çıktısı:

```
CONTACT_EMAIL
FROM_EMAIL
GATUS_URL
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
```

`src` tarafında `.env.example`'da olmayan bir isim çıkarsa `.env.example` genişletilir.

- [ ] **Step 4: Em dash taraması ve testler**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -c "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" docs/deploy/resend-domain.md .env.example || echo 0
npm run test
```

Expected: em dash sayısı her iki dosyada `0`, tüm testler geçer.

- [ ] **Step 5: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/deploy/resend-domain.md .env.example
git commit -m "docs: add resend domain verification checklist

SPF, DKIM and DMARC records for dogancanyildiz.sh, an end to end contact
form check, and a warning about the .com MX records that the http redirect
must not touch. .env.example now lists every variable with its coolify
layer."
```

---

## Task 11: README deploy bölümü, PR ve uçtan uca doğrulama

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/README.md`
- Test: tüm test paketi (`npm run test`) ve canlı curl doğrulamaları

**Interfaces:**
- Consumes: bu fazın tüm çıktıları (`Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/ci.yml`, `tests/lib/client-ip-trust.test.ts`, `docs/deploy/*.md`).
- Produces: `main`'e merge edilmiş Faz 1 PR'ı; canlı `https://dogancanyildiz.sh`; `docs/deploy/` altındaki dört checklist'in tamamlanmış hali.

- [ ] **Step 1: README'ye deploy bölümü ekle**

`README.md` dosyasının sonuna şu bölüm eklenir (Faz 0'ın yazdığı mevcut içerik korunur):

````markdown
## Deploy

Production runs on a self hosted Coolify instance behind Cloudflare and
Traefik. The image is built on the server from the Dockerfile in this repo,
GitHub Actions only gates pull requests and does not push any image.

Local verification of the production image:

```bash
docker compose up --build -d
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok"}
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
````

- [ ] **Step 2: Tüm yerel kapıları çalıştır**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run lint
npm run typecheck
npm run test
npm run build
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh -t portfolio-local:faz1 .
```

Expected: hepsi sıfır çıkış koduyla biter, hadolint çıktısı boş.

- [ ] **Step 3: Commit ve PR aç**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add README.md
git commit -m "docs: document the deploy pipeline in the readme

Local image verification commands and pointers to the four control panel
checklists under docs/deploy."
git push -u origin feature/faz-1-deploy-hatti
gh pr create --base main --head feature/faz-1-deploy-hatti \
  --title "Faz 1: deploy pipeline (Docker, Coolify, Cloudflare, Traefik)" \
  --body "Phase 1 of the modernization roadmap, see docs/10-yol-haritasi.md.

Adds the multi stage Dockerfile, .dockerignore, a local only compose file,
the GitHub Actions quality gate, the CF-Connecting-IP reader used as the
contact rate limit key, and four manual setup checklists under docs/deploy
for Coolify, Cloudflare, Traefik and Resend.

Done criteria are listed in docs/plans/2026-08-27-faz-1-deploy-hatti.md."
```

- [ ] **Step 4: CI'ın yeşil geçtiğini doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh pr checks --watch
```

Expected: `lint, typecheck, test, build` ve `hadolint and image build` check'leri `pass`.

- [ ] **Step 5: Preview deployment'ın üretildiğini doğrula**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh pr view --json comments --jq '.comments[].body' | grep -i preview
```

Expected: Coolify'ın bıraktığı yorumda `http://<pr-id>.preview.dogancanyildiz.sh` biçiminde bir URL görünür.

```bash
# Allowlist'teki admin makinesinden
curl -s http://<pr-id>.preview.dogancanyildiz.sh/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: `docs/deploy/` checklist'lerini sırayla uygula**

Bu adımlar panel üzerinden el ile yürütülür ve her checklist kendi doğrulama komutlarını taşır. Sıra bağlayıcı:

1. `docs/deploy/coolify-kurulum.md` (GitHub App, uygulama, env, health check)
2. `docs/deploy/cloudflare-kurulum.md` (DNS, Full strict, Redirect/Cache/Rate limiting/Bot Fight)
3. `docs/deploy/traefik-ve-origin.md` (trustedIPs, middleware'ler, ufw, ardından `TRUST_CF_CONNECTING_IP=true`)
4. `docs/deploy/resend-domain.md` (SPF/DKIM/DMARC, uçtan uca contact testi)

Her checklist'te `- [ ]` kutuları işaretlenir ve dosya güncellenmiş haliyle commit edilir:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/deploy
git commit -m "docs: tick off the completed deploy checklists"
git push
```

- [ ] **Step 7: PR'ı merge et ve otomatik deploy'u doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
sleep 120
curl -s https://dogancanyildiz.sh/api/health
echo
curl -s -o /dev/null -w 'root status: %{http_code}\n' https://dogancanyildiz.sh/
```

Expected:

```
{"status":"ok"}
root status: 200
```

- [ ] **Step 8: `.com -> .sh` yönlendirmesini son onaydan sonra canlıya al**

`docs/11-acik-sorular.md` soru 5 hâlâ açık: `.com` 301'i site sahibinin kesin onayı olmadan canlıya alınmaz. Onay geldikten sonra `docs/deploy/cloudflare-kurulum.md` bölüm 3 uygulanır ve doğrulanır:

```bash
curl -sI https://dogancanyildiz.com/projects | grep -i -E '^(HTTP|location)'
curl -sI -L https://dogancanyildiz.com/projects | grep -c -i '^location'
```

Expected:

```
HTTP/2 301
location: https://dogancanyildiz.sh/projects
1
```

Son satırdaki `1`, yönlendirmenin tek atlama olduğunu kanıtlar. `2` veya daha büyük bir sayı zincirli redirect demektir ve düzeltilmeden bırakılmaz.

---

## Bitti sayılma kriteri

Aşağıdaki komutların hepsi verilen çıktıyı üretmeden Faz 1 tamamlanmış sayılmaz.

**1. Yerel kod kapıları**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run lint && npm run typecheck && npm run test && npm run build
```

Beklenen: dört komut da sıfır çıkış koduyla biter; vitest çıktısında bu fazın dört dosyası geçer (`dockerignore` 17, `dockerfile` 10, `ci-workflow` 7, `client-ip-trust` 6, toplam 40) ve bunların yanında Faz 0'ın `src/lib/*.test.ts` dosyaları (5 dosya, 45 test) da koşar; genel toplam 9 dosya, 85 test.

**2. Dockerfile denetimi**

```bash
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile; echo "exit: $?"
```

Beklenen:

```
exit: 0
```

**3. Yerel imaj davranışı**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 -t portfolio-local:faz1 .
docker run -d --name faz1-check -p 3000:3000 portfolio-local:faz1
sleep 40
curl -s http://127.0.0.1:3000/api/health; echo
curl -s -o /dev/null -w 'root: %{http_code}\n' http://127.0.0.1:3000/
docker exec faz1-check id -un
docker inspect --format '{{.State.Health.Status}}' faz1-check
docker rm -f faz1-check
```

Beklenen:

```
{"status":"ok"}
root: 200
node
healthy
faz1-check
```

**4. Build context sızıntısı yok**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
docker run --rm portfolio-local:faz1 sh -c 'ls -a /app | grep -c -E "^(\.local|\.env|\.git|node_modules)$" || true'
```

Beklenen: `0`

**5. CI kapısı**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh run list --workflow=ci.yml --limit 1 --json conclusion,headBranch --jq '.[0]'
```

Beklenen: `{"conclusion":"success","headBranch":"main"}`

**6. Otomatik deploy ve canlı site**

```bash
curl -s https://dogancanyildiz.sh/api/health; echo
curl -s -o /dev/null -w 'root: %{http_code}\n' https://dogancanyildiz.sh/
curl -sI https://dogancanyildiz.sh/ | grep -i -E '^(strict-transport-security|x-content-type-options|referrer-policy|x-powered-by)'
```

Beklenen:

```
{"status":"ok"}
root: 200
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
```

`x-powered-by` satırı hiç çıkmamalı.

**7. Preview deployment**

Test PR'ında Coolify yorumu bir preview URL içeriyor ve allowlist'teki makineden:

```bash
curl -s http://<pr-id>.preview.dogancanyildiz.sh/api/health
```

Beklenen: `{"status":"ok"}`

**8. Domain yönlendirmesi (site sahibinin onayından sonra)**

```bash
curl -sI https://dogancanyildiz.com/projects | grep -i -E '^(HTTP|location)'
curl -sI -L https://dogancanyildiz.com/projects | grep -c -i '^location'
```

Beklenen:

```
HTTP/2 301
location: https://dogancanyildiz.sh/projects
1
```

**9. Origin kısıtı**

Allowlist dışındaki bir ağdan:

```bash
curl -sS --max-time 8 --resolve dogancanyildiz.sh:443:ORIGIN_IPV4 https://dogancanyildiz.sh/api/health
```

Beklenen: `curl: (28) Connection timed out` veya `curl: (7) Failed to connect`. Gövde dönerse kısıt çalışmıyordur.

**10. Gerçek istemci IP'si**

```bash
docker inspect coolify-proxy --format '{{range .Config.Cmd}}{{println .}}{{end}}' | grep -c forwardedHeaders
```

Beklenen: `2` (http ve https entrypoint'leri için birer satır).

**11. Contact formu uçtan uca**

```bash
curl -s -X POST https://dogancanyildiz.sh/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Deploy check","email":"me@dogancanyildiz.com","subject":"faz 1 smoke test","message":"Deploy pipeline verification message."}'
```

Beklenen: `{"ok":true}` ve `me@dogancanyildiz.com` kutusuna postanın ulaşması, kaynağında `dkim=pass` ve `spf=pass`.

**12. Rate limiting**

```bash
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "$i: %{http_code}\n" -X POST https://dogancanyildiz.sh/api/contact \
    -H 'content-type: application/json' -d '{}'
done
```

Beklenen: son istek(ler) `429` döner.

---

## Devir notu şablonu

Faz 2 ajanına aktarılmak üzere doldurulur. Boş bırakılan alan "bilinmiyor" demektir, tahmin yazılmaz.

```markdown
# Faz 1 devir notu

## Yapıldı
- [ ] `Dockerfile` (deps/builder/runner, node:24-alpine, USER node, CMD ["node","server.js"])
- [ ] `.dockerignore` (.local, .nodeterm, .env*, node_modules, .next, root *.md hariç README)
- [ ] `docker-compose.yml` (yalnızca yerel doğrulama, servis adı `web`, port 3000)
- [ ] `.github/workflows/ci.yml` (job'lar: `checks`, `docker`; image push yok)
- [ ] `tests/lib/client-ip-trust.test.ts` (Faz 0'ın `getClientIp(headers, { trustCloudflare })` imzası kilitlendi, yeni modül yazılmadı)
- [ ] `docs/deploy/coolify-kurulum.md` uygulandı
- [ ] `docs/deploy/cloudflare-kurulum.md` uygulandı
- [ ] `docs/deploy/traefik-ve-origin.md` uygulandı
- [ ] `docs/deploy/resend-domain.md` uygulandı
- [ ] `.env.example` altı değişkeni de listeliyor (`NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `TRUST_CF_CONNECTING_IP`, `GATUS_URL`)
- [ ] README deploy bölümü

## Doğrulandı (komut + çıktı yapıştırılır)
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build`
- [ ] hadolint exit 0
- [ ] yerel container: `{"status":"ok"}`, `root: 200`, `node`, `healthy`
- [ ] canlı: `https://dogancanyildiz.sh/api/health` -> `{"status":"ok"}`
- [ ] preview URL çalışıyor (URL: ______)
- [ ] `.com -> .sh` tek atlama 301 (site sahibi onayı: evet / hayır / beklemede)
- [ ] origin doğrudan erişime kapalı
- [ ] `forwardedHeaders.trustedIPs` iki entrypoint'te de set
- [ ] contact formu uçtan uca, `dkim=pass` + `spf=pass`

## Açık kaldı
- [ ] `.com -> .sh` 301 canlıya alındı mı? (`docs/11-acik-sorular.md` soru 5, site sahibinin son onayı)
- [ ] `TRUST_CF_CONNECTING_IP` Coolify'da `true` yapıldı mı? (yalnızca Task 9 bittiyse; Task 6 notu)
- [ ] Coolify health check `#7500` yüzünden geçici kapatıldı mı?
- [ ] `ADMIN_IPV4` değeri hangi adres, ne zaman tazelenmeli?
- [ ] Diğer: ______

## Üretilen arayüzler (Faz 2 ve sonrası bunlara güvenebilir)
- Build girişi tek satır: `npm run build`. Faz 4 velite'ı `"build": "velite --clean && next build"` haline getirir, Dockerfile'ın `RUN npm run build` satırı değişmez ve Dockerfile'a ayrı bir velite adımı EKLENMEZ.
- Build arg: `NEXT_PUBLIC_SITE_URL` (Coolify Build Variable). Faz 2'nin `metadataBase`, `sitemap.ts` ve `alternates` üretimi bu değeri okur.
- Runtime env: `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `TRUST_CF_CONNECTING_IP` (Task 9 sonrası `true`), `GATUS_URL` (Faz 5'te doldurulur).
- Container sözleşmesi: port `3000`, `HOSTNAME=0.0.0.0`, health `/api/health` -> `200` `{"status":"ok"}`.
- `import { getClientIp, isIpAddress, UNKNOWN_IP } from "@/lib/client-ip"`, imza Faz 0'daki gibi `getClientIp(headers: Headers, options: { trustCloudflare: boolean }): string`. Bu faz imzayı DEĞİŞTİRMEZ, yalnızca `TRUST_CF_CONNECTING_IP` değerini Traefik ayarıyla eşitler.
- Test yerleşimi: `tests/deploy/*.test.ts` ve `tests/lib/*.test.ts`, vitest `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]` (ilk desen Faz 0'ın `src/lib/*.test.ts` dosyaları için, ikincisi Faz 1 ve sonrası için), alias `@` -> `./src`.
- CI check adları: `lint, typecheck, test, build` ve `hadolint and image build`. Faz 2'nin PR'ı bu iki kapıdan geçmek zorunda.
- Preview URL şablonu: `http://{{pr_id}}.preview.dogancanyildiz.sh`, yalnızca allowlist'teki IP'den erişilebilir.
- Traefik middleware adları: `security-headers@file`, `compress@file`, `cloudflare-only@file`, `redirect-to-sh` (yedek yol).
- URL kararı: `.sh` ana domain, `.com` tek atlama 301. Faz 2'de `NEXT_PUBLIC_SITE_URL` yalnızca `.sh` değerini alır, uygulama kodu `.com`'u hiç bilmez.
```

---

## Self-Review

**1. Spec coverage**

| Spec maddesi (kaynak) | Karşılayan task |
|---|---|
| Çok aşamalı Dockerfile, node:24-alpine, non-root, standalone kopyalama, `CMD ["node","server.js"]` (`06` bölüm 2) | Task 3 |
| `HOSTNAME=0.0.0.0`, `PORT=3000` | Task 3, Step 3 ve test "binds to every interface" |
| velite için yer bırakma, Faz 4 `build` script'ini değiştirir | Task 3 Interfaces + Dockerfile yorumu + devir notu |
| `.dockerignore`, `.local` dahil (`06` bölüm 3, `09` uygulama notları) | Task 2 |
| `docker-compose.yml` yalnızca yerel (`06` bölüm 1) | Task 4 |
| GitHub Actions PR + push main, image push yok (`06` bölüm 5) | Task 5 |
| Coolify GitHub App, Dockerfile build pack, auto deploy, Preview (`06` bölüm 1, 6) | Task 7 |
| Health check `/api/health`, `#7500` start-period ve doğrulama (`06` bölüm 6, `09` riskler) | Task 3 (HEALTHCHECK) + Task 7 bölüm 6 |
| Env Build/Runtime tablosu (`06` bölüm 6, `09` karar 4) | Task 7 bölüm 4 + Task 10 `.env.example` |
| Cloudflare DNS, proxied, Full strict (`06` bölüm 8, 8c) | Task 8 bölüm 1, 2 |
| Redirect Rule `.com -> .sh`, tek atlama, path korunur (`06` bölüm 8a) | Task 8 bölüm 3 + Bitti kriteri 8 |
| Cache rule `_next/static` (`06` bölüm 8d) | Task 8 bölüm 4 |
| Rate limiting `/api/contact` (`06` bölüm 8d) | Task 8 bölüm 5 |
| Bot Fight Mode (`06` bölüm 8d, `09` bölüm 6) | Task 8 bölüm 6 |
| Traefik `forwardedHeaders.trustedIPs` (`06` bölüm 8b, `09` bölüm 6) | Task 9 bölüm 2 + Bitti kriteri 10 |
| HSTS/compress middleware, buffering kapalı (`06` bölüm 7) | Task 9 bölüm 3, 4 |
| `redirectregex` yedek yol (`06` bölüm 7) | Task 9 bölüm 3 |
| Origin'i Cloudflare IP'lerine kısıtlama, ufw veya ipAllowList (`06` bölüm 8e, `09` bölüm 6) | Task 9 bölüm 5 |
| Resend SPF/DKIM/DMARC (`10` Faz 1, `11` soru 5) | Task 10 |
| Yerel doğrulama: docker build, docker run, curl (`10` Faz 1 bitiş kriteri) | Task 3 Step 6-7, Task 4 Step 3, Bitti kriteri 3 |
| Coolify tarafı el ile checklist, kod tarafı TDD | Task 2, 3, 5, 6 TDD; Task 7, 8, 9, 10 checklist |
| `CF-Connecting-IP` rate limit anahtarı (`10` Faz 1) | Task 6 |
| Tek dal, tek PR (`10` uygulama notları) | Task 1 Step 3, Task 11 Step 3 ve 7 |
| Açık soru 5 (domain onayı) launch'u değil yalnızca 301'i bekletir (`11`) | Task 11 Step 8 + devir notu "Açık kaldı" |

Boşluk bulunmadı.

**2. Placeholder taraması**

- "TBD", "uygun şekilde", "benzer şekilde", "Task N'e benzer" ifadeleri yok; her task kendi kodunu tam yazıyor (`.dockerignore` içeriği, Dockerfile'ın tamamı, workflow'un tamamı, `client-ip-trust.test.ts`'in tamamı, dört checklist'in tamamı).
- Değiştirilmesi gereken tek üç değer açıkça isimlendirilmiş ve nasıl elde edileceği yazılmış: `ORIGIN_IPV4` (sunucunun statik adresi), `ADMIN_IPV4` (`curl -s https://api.ipify.org`), Resend'in panelden kopyalanan `p=...` DKIM değeri. Bunlar yer tutucu değil, ortama özgü sırlar.
- Task 6 yeni modül yazmıyor: Faz 0'ın `client-ip.ts` ve `env.ts` dosyalarını Step 1'de dört `grep` ile doğruluyor, eşleşmezse faz durduruluyor. Bu bir yer tutucu değil, devralınan arayüzün ön koşul denetimi.

**3. Tip ve isim tutarlılığı**

- `getClientIp(headers: Headers, options: { trustCloudflare: boolean }): string` Faz 0'da tanımlandı; Task 6, Task 9 ve devir notu aynı imzayı kullanıyor, bu faz imzayı yeniden tanımlamıyor.
- `TRUST_CF_CONNECTING_IP` adı `.env.example` (Faz 0), Task 6, Task 7 Coolify tablosu, Task 9 ve devir notunda aynı yazımla geçiyor.
- Sağlık sözleşmesi `/api/health` -> `200` `{"status":"ok"}`: Task 1 Step 2, Task 3 HEALTHCHECK ve testi, Task 4 Step 3, Task 7 bölüm 6, Bitti kriteri 3 ve 6 aynı gövdeyi bekliyor.
- Build arg adı `NEXT_PUBLIC_SITE_URL`: Dockerfile, docker-compose, ci.yml, Coolify tablosu, `.env.example` aynı yazımı kullanıyor.
- İmaj etiketi `portfolio-local:faz1`: Task 3, Task 4 ve Bitti kriteri 3-4 aynı.
- hadolint sürümü `v2.15.1-alpine`: Task 3, Task 5 (ve testi), README ve Bitti kriteri 2 aynı.
- Middleware adları `security-headers`, `compress`, `cloudflare-only`, `redirect-to-sh`: Task 9 bölüm 3, 4, 5b ve devir notu aynı.
- CI job görünen adları `lint, typecheck, test, build` ve `hadolint and image build`: `.github/workflows/ci.yml`, Task 7 bölüm 9 ve devir notu aynı.
- Test sayıları: `dockerignore` 15 pattern + 2 negatif = 17, `dockerfile` 10, `ci-workflow` 7, `client-ip-trust` 6, bu fazın toplamı 40; Faz 0'ın 45 testiyle birlikte 85. Bitti kriteri 1'deki sayı bununla uyumlu.
- `FROM_EMAIL=contact@dogancanyildiz.sh` ve `CONTACT_EMAIL=me@dogancanyildiz.com`: Task 7 tablosu, Task 10 `.env.example` ve Resend dokümanı aynı.

**4. Kaynaklardan gelen düzeltmeler**

Spec dokümanındaki iki değer bilerek güncellendi, gerekçesi burada kayıtlı:

- `docs/06-devops-ve-deploy.md` bölüm 5 `actions/checkout@v4` ve `actions/setup-node@v4` yazıyor. 2026-08-27 itibarıyla güncel major sürümler `v7` (checkout v7.0.1, setup-node v7.0.0, ikisi de Temmuz 2026). Workflow `v7` kullanıyor.
- Cloudflare Rate Limiting ücretsiz planda tek kural, yalnızca 10 saniyelik sayma periyodu ve mitigation timeout, ifadede yalnızca `Path` ve `Verified Bot` alanları. Bu yüzden Task 8 bölüm 5'teki ifade HTTP metoduna bakmıyor ve periyot 10 saniye.
- Dockerfile runner aşaması `addgroup`/`adduser` ile `nextjs` kullanıcısı yaratmak yerine `node` imajının hazır `node` kullanıcısını kullanıyor; Next.js'in kendi `examples/with-docker` referansı da bugün bu deseni kullanıyor ve iki `RUN` katmanı eksiliyor.
- Health check probe'u `curl`/`wget` değil node'un yerleşik `fetch`'i: `node:24-alpine` curl içermiyor ve `coollabsio/coolify#7500` tam olarak curl/wget tabanlı probe'ları raporluyor.
