# Faz 5: Altyapı vitrini (Gatus status widget), Umami, bakım otomasyonu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayına çıkmış siteye, kendi sunucusundaki Gatus'tan beslenen canlı bir "Systems" bölümü, self-host Umami analytics ve doğrulanmış bir bakım/otomatik-redeploy zinciri eklemek; topoloji bilgisi (hostname, port, IP, iç adres) hiçbir koşulda client'a sızmadan.

**Architecture:** Coolify'da iki yeni docker-compose kaynağı çalışır: Gatus (sqlite storage, alerting yok, `status.dogancanyildiz.sh`) ve Umami + Postgres (`analytics.dogancanyildiz.sh`). Next tarafında `src/lib/status.ts` Gatus'un JSON API'sini yalnızca sunucu tarafında, 60 saniye revalidate ile çeker, Zod ile parse eder ve dört alanlık bir nesneye (`name`, `up`, `uptime24h`, `lastCheck`) daraltır; `src/components/sections/systems.tsx` bu veriyi build-time'dan gelen commit SHA ve deploy zamanıyla birlikte ana sayfada gösterir, veri yoksa nötr bir "status unavailable" satırına düşer. Umami script tag'i layout'ta koşullu render edilir ve `next.config.ts`'teki CSP `script-src`/`connect-src` direktifleri bu tek origin ile genişletilir.

**Tech Stack:** Next.js 16.3.3 (App Router, `output: 'standalone'`, ISR), React 19.2.x, next-intl 4.13.7, Zod 4.4.x, vitest 4.1.x (node environment), Tailwind CSS 4.3.x, Docker + Coolify + Traefik, Gatus v5, Umami (postgresql), PostgreSQL 17, Cloudflare (proxied, Full strict).

**Spec:**
- `docs/00-ozet-ve-karar.md`
- `docs/05-backend-icerik-ve-servisler.md` (bölüm 3: Gatus status widget, bölüm 4: Umami)
- `docs/06-devops-ve-deploy.md` (bölüm 6: Coolify env katmanları, bölüm 8h: yan servisler proxied alt domain'lerde)
- `docs/09-guvenlik.md` (bölüm 3: status widget alan filtresi, bölüm 4: env katmanı, bölüm 5: bakım otomasyonu)
- `docs/10-yol-haritasi.md` (Faz 5)

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

## Bu fazın ön koşulları (Faz 0-4 çıktıları)

Bu plan aşağıdakilerin main'de hazır olduğunu varsayar. Task 1'e başlamadan önce hepsini doğrula, eksikse ilgili fazın planına dön:

| Ön koşul | Doğrulama komutu | Beklenen |
|---|---|---|
| Next 16.3.3 | `npm ls next` | `next@16.3.3` |
| vitest kurulu, node environment | `cat vitest.config.ts` | `environment: "node"` |
| `src/app/api/health/route.ts` var | `curl -s https://dogancanyildiz.sh/api/health` | `{"status":"ok"}` |
| `app/[lang]` + next-intl | `ls src/app/\[lang\]/page.tsx messages/en.json messages/tr.json` | üç dosya da listeleniyor |
| Dockerfile + .dockerignore | `ls Dockerfile .dockerignore` | ikisi de var |
| `next.config.ts` içinde CSP | `grep -c "Content-Security-Policy" next.config.ts` | `1` |
| Renovate kurulu | `cat renovate.json` | dosya var, `automerge` alanı tanımlı |
| Site canlı | `curl -sI https://dogancanyildiz.sh \| head -1` | `HTTP/2 200` |

Dal: `git checkout -b feature/faz-5-altyapi-vitrini`

---

### Task 1: Gatus container'ı ve config'i

**Files:**
- Create: `infra/gatus/docker-compose.yml`
- Create: `infra/gatus/config/gatus.yaml`
- Create: `infra/README.md`
- Modify: `.dockerignore`

**Interfaces:**
- Consumes: `https://dogancanyildiz.sh/api/health` (Faz 0'da eklenen liveness endpoint'i, gövdesi `{"status":"ok"}`).
- Produces:
  - `https://status.dogancanyildiz.sh/api/v1/endpoints/statuses` public JSON API'si.
  - Gatus endpoint anahtarı `public_site` (group `public` + name `site`). Bu string Task 2'de `SITE_ENDPOINT_KEY` sabiti olarak kullanılır, iki yerde birebir aynı olmak zorunda.
  - Coolify Runtime env değeri: `GATUS_URL=https://status.dogancanyildiz.sh`.

- [ ] **Step 1: Gatus compose dosyasını yaz**

`infra/gatus/docker-compose.yml`:

```yaml
services:
  gatus:
    image: twinproduction/gatus:v5
    restart: unless-stopped
    environment:
      SERVICE_FQDN_GATUS_8080: /
      GATUS_CONFIG_PATH: /config/config.yaml
      GATUS_LOG_LEVEL: WARN
    volumes:
      - ./config/gatus.yaml:/config/config.yaml:ro
      - gatus-data:/data
    expose:
      - "8080"

volumes:
  gatus-data:
```

Notlar (kod yorumu olarak eklenmiyor, uygulayıcı için):
- `SERVICE_FQDN_GATUS_8080` Coolify'ın magic env'i; Coolify bu servise Traefik router'ı üretir ve UI'daki Domains alanına yazdığın FQDN'i bağlar.
- Host port mapping (`ports:`) bilinçli olarak yok; Coolify'ın rolling update koşullarından biri host port mapping olmaması (bkz. `docs/06-devops-ve-deploy.md` bölüm 6).
- `twinproduction/gatus` imajı scratch tabanlı, içinde shell yok; bu yüzden compose'da `healthcheck` tanımlanmıyor, sağlık kontrolü Coolify'ın kendi HTTP kontrolüne bırakılıyor.

- [ ] **Step 2: Gatus config'ini yaz**

`infra/gatus/config/gatus.yaml`:

```yaml
# Public status configuration for dogancanyildiz.sh
# Rules:
#   - Only public URLs are listed here. No internal hostname, no container name,
#     no private IP, no port of an internal service.
#   - No alerting block: this instance is a public read-only dashboard, not a pager.
#   - Endpoint key is derived as "<group>_<name>", so this file produces "public_site".
metrics: false
concurrency: 2

storage:
  type: sqlite
  path: /data/gatus.db

ui:
  title: status.dogancanyildiz.sh
  header: Status
  dark-mode: true

endpoints:
  - name: site
    group: public
    url: https://dogancanyildiz.sh/api/health
    interval: 60s
    conditions:
      - "[STATUS] == 200"
      - "[BODY].status == ok"
```

- [ ] **Step 3: infra/README.md yaz**

`infra/README.md`:

```markdown
# infra

Side services that run next to the portfolio application on the same Coolify server.
Each folder is a separate Coolify resource of type "Docker Compose" pointing at this
repository, so the compose file and its config live under version control.

| Folder | Coolify resource | Public domain |
|---|---|---|
| `gatus/` | gatus | https://status.dogancanyildiz.sh |
| `umami/` | umami | https://analytics.dogancanyildiz.sh |

These folders are excluded from the application Docker build context through
`.dockerignore`; the Next.js image never needs them.
```

- [ ] **Step 4: .dockerignore'a infra ekle**

`.dockerignore` dosyasının sonuna tek satır ekle (mevcut satırlara dokunma):

```
infra
```

- [ ] **Step 5: Compose dosyasının sözdizimini yerelde doğrula**

Run: `docker compose -f infra/gatus/docker-compose.yml config --quiet && echo COMPOSE_OK`
Expected: `COMPOSE_OK` (hiçbir uyarı satırı olmadan)

- [ ] **Step 6: Commit**

```bash
git add infra/gatus/docker-compose.yml infra/gatus/config/gatus.yaml infra/README.md .dockerignore
git commit -m "feat(infra): add gatus status monitoring compose stack"
```

- [ ] **Step 7: Cloudflare'da DNS kaydını aç**

Cloudflare > dogancanyildiz.sh > DNS > Records:
- Type `A`, Name `status`, Content: sunucunun public IPv4 adresi, Proxy status **Proxied** (turuncu bulut), TTL Auto.
- SSL/TLS modu zaten Full (strict); zone seviyesinde olduğu için ayrıca değiştirilmiyor.

- [ ] **Step 8: Coolify'da Gatus kaynağını oluştur**

Coolify > Project > + New Resource > Docker Compose:
- Source: bu GitHub repository, branch `main`
- Base Directory: `/infra/gatus`
- Docker Compose Location: `/docker-compose.yml`
- Deploy > Domains: `gatus` servisi için `https://status.dogancanyildiz.sh`
- Deploy et.

- [ ] **Step 9: Gatus'un ayakta olduğunu ve endpoint anahtarını doğrula**

Run:

```bash
curl -s https://status.dogancanyildiz.sh/api/v1/endpoints/statuses | jq -r '.results[].key'
```

Expected: tek satır, `public_site`

Anahtar farklı çıkarsa (ör. Gatus sürümü sanitize kuralını değiştirmişse) Task 2'deki `SITE_ENDPOINT_KEY` sabitini bu çıktıdaki değere göre yaz; ikisi ayrışırsa widget sessizce boş kalır.

- [ ] **Step 10: 24 saatlik uptime uç noktasının cevap verdiğini doğrula**

Run:

```bash
curl -s -w '\n%{http_code}\n' https://status.dogancanyildiz.sh/api/v1/endpoints/public_site/uptimes/24h
```

Expected: son satır `200`; gövde ya `0.9993` gibi bir ondalık sayı ya da `{"uptime":99.93}` gibi bir JSON nesnesi. İki biçim de Task 2'de destekleniyor, hangisinin geldiğini not al.

- [ ] **Step 11: Coolify'a GATUS_URL runtime değişkenini ekle**

Coolify > portfolio uygulaması > Environment Variables > + Add:
- Key: `GATUS_URL`
- Value: `https://status.dogancanyildiz.sh`
- Build Variable: **kapalı** (yalnızca Runtime). Bu kural `docs/09-guvenlik.md` bölüm 4'ten geliyor.

Henüz redeploy etme, Task 4'ün sonunda tek seferde yapılacak.

---

### Task 2: src/lib/status.ts, Gatus JSON'unu dört alana daraltan sunucu tarafı okuyucu

**Files:**
- Create: `src/lib/status.ts`
- Create: `tests/lib/status.test.ts`
- Create: `tests/fixtures/gatus-statuses.json`
- Modify: `package.json` (zod bağımlılığı)
- Modify: `vitest.config.ts` (yalnızca `@` alias'ı yoksa)

**Interfaces:**
- Consumes: `GATUS_URL` runtime env (Task 1 Step 11), Gatus endpoint anahtarı `public_site` (Task 1 Step 2).
- Produces:
  - `export const SITE_ENDPOINT_KEY: string` (değer: `"public_site"`)
  - `export const SITE_ENDPOINT_ALIAS: string` (değer: `"site"`)
  - `export interface SiteStatus { name: string; up: boolean; uptime24h: number | null; lastCheck: string }`
  - `export async function getSiteStatus(): Promise<SiteStatus | null>`

- [ ] **Step 1: zod'u doğrudan bağımlılık olarak ekle**

Run:

```bash
npm install zod@^4.4.3
npm ls zod
```

Expected: `npm ls zod` çıktısının ilk seviyesinde `zod@4.4.x` görünüyor (velite'ın transitive kopyası değil, doğrudan bağımlılık).

- [ ] **Step 2: vitest'in `@` alias'ını doğrula, yoksa ekle**

Run: `grep -n "alias" vitest.config.ts`

Alias satırı yoksa `vitest.config.ts` dosyasını tamamen bununla değiştir:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Faz 0 birim testleri src/lib/*.test.ts altinda, Faz 1 ve sonrasi tests/ altinda.
    // Iki desen de dahil, aksi halde Faz 0'in 45 testi sessizce calismaz.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Gatus fixture'ını yaz**

`tests/fixtures/gatus-statuses.json` (gerçek Gatus çıktısının şekli; `url`, `hostname`, `group`, `key` alanları bilinçli olarak duruyor, sızıntı testi tam da bunların dışarı çıkmadığını kanıtlıyor):

```json
{
  "results": [
    {
      "name": "site",
      "group": "public",
      "key": "public_site",
      "url": "https://dogancanyildiz.sh/api/health",
      "uptime": { "1h": 1, "24h": 0.9993, "7d": 0.9981 },
      "averageResponseTime": 142,
      "results": [
        {
          "status": 200,
          "hostname": "dogancanyildiz.sh",
          "duration": 140000000,
          "errors": [],
          "success": true,
          "timestamp": "2026-08-27T09:13:00Z"
        },
        {
          "status": 200,
          "hostname": "dogancanyildiz.sh",
          "duration": 138000000,
          "errors": [],
          "success": true,
          "timestamp": "2026-08-27T09:14:00Z"
        }
      ]
    },
    {
      "name": "umami",
      "group": "public",
      "key": "public_umami",
      "url": "https://analytics.dogancanyildiz.sh/api/heartbeat",
      "uptime": { "24h": 0.9877 },
      "averageResponseTime": 210,
      "results": [
        {
          "status": 200,
          "hostname": "analytics.dogancanyildiz.sh",
          "duration": 210000000,
          "errors": [],
          "success": true,
          "timestamp": "2026-08-27T09:14:10Z"
        }
      ]
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalNumberOfResults": 2
}
```

- [ ] **Step 4: Başarısız testi yaz**

`tests/lib/status.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import statusesFixture from "../fixtures/gatus-statuses.json";
import { getSiteStatus } from "@/lib/status";

const GATUS_URL = "https://status.dogancanyildiz.sh";

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function okText(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

function mockFetch(handler: (url: string) => Response | Promise<Response>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => handler(String(input))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getSiteStatus", () => {
  it("returns exactly the four allowed fields for the public site endpoint", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const status = await getSiteStatus();

    expect(status).toEqual({
      name: "site",
      up: true,
      uptime24h: 99.93,
      lastCheck: "2026-08-27T09:14:00Z",
    });
    expect(Object.keys(status!).sort()).toEqual(["lastCheck", "name", "up", "uptime24h"]);
  });

  it("never leaks topology fields from the Gatus payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const serialized = JSON.stringify(await getSiteStatus()).toLowerCase();

    for (const forbidden of [
      "http",
      "url",
      "hostname",
      "group",
      "analytics",
      "dogancanyildiz",
      "8080",
      "averageresponsetime",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("ignores every endpoint other than the public site one", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.9993 }) : okJson(statusesFixture),
    );

    const status = await getSiteStatus();

    expect(status?.name).toBe("site");
    expect(status?.uptime24h).not.toBe(98.77);
  });

  it("accepts a bare numeric uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okText("0.98765") : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(98.77);
  });

  it("accepts an already-percentage uptime payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 99.5 }) : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(99.5);
  });

  it("falls back to the 24h uptime carried by the statuses payload", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h")
        ? new Response("not found", { status: 404 })
        : okJson(statusesFixture),
    );

    expect((await getSiteStatus())?.uptime24h).toBe(99.93);
  });

  it("reports down when the last check failed", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    const downFixture = {
      results: [
        {
          name: "site",
          group: "public",
          key: "public_site",
          url: "https://dogancanyildiz.sh/api/health",
          uptime: { "24h": 0.5 },
          results: [
            {
              status: 502,
              hostname: "dogancanyildiz.sh",
              errors: ["bad gateway"],
              success: false,
              timestamp: "2026-08-27T09:20:00Z",
            },
          ],
        },
      ],
    };
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.5 }) : okJson(downFixture),
    );

    const status = await getSiteStatus();

    expect(status?.up).toBe(false);
    expect(status?.lastCheck).toBe("2026-08-27T09:20:00Z");
  });

  it("returns null when GATUS_URL is not configured", async () => {
    vi.stubEnv("GATUS_URL", "");
    mockFetch(() => okJson(statusesFixture));

    expect(await getSiteStatus()).toBeNull();
  });

  it("returns null when Gatus is unreachable", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );

    expect(await getSiteStatus()).toBeNull();
  });

  it("returns null when the statuses payload does not match the schema", async () => {
    vi.stubEnv("GATUS_URL", GATUS_URL);
    mockFetch((url) =>
      url.includes("/uptimes/24h") ? okJson({ uptime: 0.99 }) : okJson({ results: "nope" }),
    );

    expect(await getSiteStatus()).toBeNull();
  });
});
```

- [ ] **Step 5: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/lib/status.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/status"` benzeri bir hata

- [ ] **Step 6: src/lib/status.ts'i yaz**

```ts
import { z } from "zod";

/**
 * Gatus endpoint key, derived by Gatus as "<group>_<name>".
 * Must stay in sync with infra/gatus/config/gatus.yaml.
 */
export const SITE_ENDPOINT_KEY = "public_site";

/**
 * Public alias shown to visitors. Never derived from the Gatus payload, so a
 * config change on the monitoring side can never rename it into a hostname.
 */
export const SITE_ENDPOINT_ALIAS = "site";

const REVALIDATE_SECONDS = 60;

const gatusResultSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
});

const gatusEndpointStatusSchema = z.object({
  key: z.string(),
  uptime: z.record(z.string(), z.number()).optional(),
  results: z.array(gatusResultSchema).default([]),
});

const gatusStatusesSchema = z.object({
  results: z.array(gatusEndpointStatusSchema).default([]),
});

const gatusUptimePayloadSchema = z.union([
  z.number(),
  z.object({ uptime: z.number() }).transform((value) => value.uptime),
]);

/**
 * The only shape that ever reaches a client component.
 * Adding a field here is a security decision, see docs/09-guvenlik.md section 3:
 * hostname, port, internal address, IP and the Gatus URL are never allowed.
 */
export interface SiteStatus {
  name: string;
  up: boolean;
  uptime24h: number | null;
  lastCheck: string;
}

function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

/**
 * Gatus reports uptime as a 0..1 ratio in some builds and as a 0..100
 * percentage in others. Normalise both to a percentage with two decimals.
 */
function toPercent(raw: number): number | null {
  if (!Number.isFinite(raw) || raw < 0) return null;
  const percent = raw <= 1 ? raw * 100 : raw;
  if (percent > 100) return null;
  return Math.round(percent * 100) / 100;
}

function parseUptimePayload(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  let candidate: unknown;
  try {
    candidate = JSON.parse(trimmed);
  } catch {
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? null : toPercent(numeric);
  }

  const parsed = gatusUptimePayloadSchema.safeParse(candidate);
  return parsed.success ? toPercent(parsed.data) : null;
}

/**
 * Reads the public site status from Gatus.
 *
 * Server-only: GATUS_URL is a Coolify runtime variable and must never be
 * bundled into client code. Returns null on any failure so the caller can fall
 * back to a neutral "status unavailable" message instead of throwing.
 */
export async function getSiteStatus(): Promise<SiteStatus | null> {
  const base = process.env.GATUS_URL;
  if (!base) return null;

  try {
    const [statusesResponse, uptimeResponse] = await Promise.all([
      fetch(apiUrl(base, "/api/v1/endpoints/statuses?page=1&pageSize=20"), {
        next: { revalidate: REVALIDATE_SECONDS },
      }),
      fetch(apiUrl(base, `/api/v1/endpoints/${SITE_ENDPOINT_KEY}/uptimes/24h`), {
        next: { revalidate: REVALIDATE_SECONDS },
      }),
    ]);

    if (!statusesResponse.ok) return null;

    const parsed = gatusStatusesSchema.safeParse(await statusesResponse.json());
    if (!parsed.success) return null;

    const endpoint = parsed.data.results.find((entry) => entry.key === SITE_ENDPOINT_KEY);
    if (!endpoint) return null;

    const lastResult = endpoint.results.at(-1);
    if (!lastResult) return null;

    let uptime24h: number | null = null;
    if (uptimeResponse.ok) {
      uptime24h = parseUptimePayload(await uptimeResponse.text());
    }
    if (uptime24h === null && endpoint.uptime?.["24h"] !== undefined) {
      uptime24h = toPercent(endpoint.uptime["24h"]);
    }

    return {
      name: SITE_ENDPOINT_ALIAS,
      up: lastResult.success,
      uptime24h,
      lastCheck: lastResult.timestamp,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 7: Testleri çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/lib/status.test.ts`
Expected: PASS, `10 passed`

- [ ] **Step 8: Tip kontrolü**

Run: `npm run typecheck`
Expected: çıktı yok, exit code 0

- [ ] **Step 9: Commit**

```bash
git add src/lib/status.ts tests/lib/status.test.ts tests/fixtures/gatus-statuses.json package.json package-lock.json vitest.config.ts
git commit -m "feat(status): read gatus endpoint status through a leak-proof server helper"
```

---

### Task 3: Build bilgisi (commit SHA + deploy zamanı) runtime env olarak

**Files:**
- Create: `src/lib/build-info.ts`
- Create: `tests/lib/build-info.test.ts`
- Create: `docker-entrypoint.sh`
- Modify: `Dockerfile`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Coolify Build Variable `GIT_SHA` (değeri `${SOURCE_COMMIT}`), opsiyonel `BUILD_TIME`.
- Produces:
  - `export interface BuildInfo { commitSha: string | null; shortSha: string | null; buildTime: string | null }`
  - `export function getBuildInfo(): BuildInfo`
  - Container runtime env'inde `GIT_SHA` ve `BUILD_TIME` (ikincisi entrypoint tarafından `/app/.build-time` dosyasından set edilir).

- [ ] **Step 1: Başarısız testi yaz**

`tests/lib/build-info.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBuildInfo } from "@/lib/build-info";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getBuildInfo", () => {
  it("returns the full sha and a seven character short sha", () => {
    vi.stubEnv("GIT_SHA", "42796ad9f1c3b7d0e5a2149c8b6f30ad71cc4e12");
    vi.stubEnv("BUILD_TIME", "2026-08-27T09:00:00Z");

    expect(getBuildInfo()).toEqual({
      commitSha: "42796ad9f1c3b7d0e5a2149c8b6f30ad71cc4e12",
      shortSha: "42796ad",
      buildTime: "2026-08-27T09:00:00.000Z",
    });
  });

  it("lowercases and trims the sha", () => {
    vi.stubEnv("GIT_SHA", "  42796AD  ");
    vi.stubEnv("BUILD_TIME", "");

    const info = getBuildInfo();

    expect(info.commitSha).toBe("42796ad");
    expect(info.shortSha).toBe("42796ad");
    expect(info.buildTime).toBeNull();
  });

  it("rejects a value that is not a hex sha", () => {
    vi.stubEnv("GIT_SHA", "unknown");
    vi.stubEnv("BUILD_TIME", "2026-08-27T09:00:00Z");

    expect(getBuildInfo().commitSha).toBeNull();
    expect(getBuildInfo().shortSha).toBeNull();
  });

  it("rejects an unparsable build time", () => {
    vi.stubEnv("GIT_SHA", "42796ad");
    vi.stubEnv("BUILD_TIME", "yesterday");

    expect(getBuildInfo().buildTime).toBeNull();
  });

  it("returns nulls when nothing is configured", () => {
    vi.stubEnv("GIT_SHA", "");
    vi.stubEnv("BUILD_TIME", "");

    expect(getBuildInfo()).toEqual({
      commitSha: null,
      shortSha: null,
      buildTime: null,
    });
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/lib/build-info.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/build-info"`

- [ ] **Step 3: src/lib/build-info.ts'i yaz**

```ts
/**
 * Deployment identity of the running container.
 *
 * Both values arrive as plain runtime environment variables, not as
 * NEXT_PUBLIC_* build constants, so a redeploy of the same image with a
 * different commit can never show a stale value in the client bundle.
 */
export interface BuildInfo {
  commitSha: string | null;
  shortSha: string | null;
  buildTime: string | null;
}

const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

export function getBuildInfo(): BuildInfo {
  const rawSha = process.env.GIT_SHA?.trim() ?? "";
  const commitSha = SHA_PATTERN.test(rawSha) ? rawSha.toLowerCase() : null;

  const rawTime = process.env.BUILD_TIME?.trim() ?? "";
  const parsedTime = rawTime === "" ? Number.NaN : Date.parse(rawTime);
  const buildTime = Number.isNaN(parsedTime) ? null : new Date(parsedTime).toISOString();

  return {
    commitSha,
    shortSha: commitSha ? commitSha.slice(0, 7) : null,
    buildTime,
  };
}
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/lib/build-info.test.ts`
Expected: PASS, `5 passed`

- [ ] **Step 5: Entrypoint script'ini yaz**

`docker-entrypoint.sh`:

```sh
#!/bin/sh
set -eu

# BUILD_TIME cannot be produced by a Dockerfile ENV instruction, because ENV
# cannot read a command result. The builder stage writes it to /app/.build-time
# and this entrypoint promotes it to a real environment variable before the
# Next.js server starts. An explicit BUILD_TIME build argument always wins.
if [ -z "${BUILD_TIME:-}" ] && [ -f /app/.build-time ]; then
  BUILD_TIME="$(cat /app/.build-time)"
  export BUILD_TIME
fi

exec "$@"
```

Run: `chmod +x docker-entrypoint.sh`

- [ ] **Step 6: Dockerfile'ı güncelle**

`Dockerfile` (tam içerik). Faz 1'in dosyası temel alınır ve **yalnızca** şunlar
eklenir: `ARG`/`ENV` blokları, `.build-time` yazımı, entrypoint kopyası ve
`ENTRYPOINT`. Faz 1'in sözleşmesi olduğu gibi korunur, aşağıdaki dört şey
SİLİNMEZ, aksi halde container Traefik'ten erişilemez veya sağlık kontrolü ölür:

- `# syntax=docker/dockerfile:1` satırı,
- `ENV HOSTNAME=0.0.0.0` (standalone sunucu bu olmadan yalnızca localhost'a bağlanır),
- `HEALTHCHECK` bloğu (Coolify'ın UI ayarını ezen asıl kaynak, `coollabsio/coolify#7500`),
- node imajının hazır `node` kullanıcısı (Faz 1 bilinçli olarak `addgroup`/`adduser` ile
  ayrı bir `nextjs` kullanıcısı yaratmıyor; `--chown=nextjs:nodejs` yazılırsa build patlar).

Ayrıca builder aşamasına **ayrı bir `RUN npx velite build` satırı eklenmez**: Faz 4
`package.json` içindeki `build` script'ini `velite --clean && next build` yaptı,
dolayısıyla `RUN npm run build` içeriği zaten derliyor; ayrı satır velite'ı iki
kez çalıştırır.

```dockerfile
# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: deps
# ---------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
# Stage 2: builder
# "npm run build" stays the single build entry point. Faz 4 turned that script
# into "velite --clean && next build", so the content pipeline runs here without
# a separate velite step.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh
ARG UMAMI_SCRIPT_URL=""
ARG UMAMI_WEBSITE_ID=""
ARG GIT_SHA=""
ARG BUILD_TIME=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV UMAMI_SCRIPT_URL=$UMAMI_SCRIPT_URL
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID
ENV GIT_SHA=$GIT_SHA
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# ENV cannot capture a command result, so the timestamp is written to a file and
# docker-entrypoint.sh promotes it to an environment variable at container start.
RUN if [ -n "$BUILD_TIME" ]; then \
      printf '%s' "$BUILD_TIME" > /app/.build-time; \
    else \
      date -u +%Y-%m-%dT%H:%M:%SZ > /app/.build-time; \
    fi

# ---------------------------------------------------------------------------
# Stage 3: runner
# The node image already provides an unprivileged "node" user, so no extra
# addgroup or adduser call is needed.
# ---------------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Repeated on purpose: the layout and the systems section are re-rendered on
# every ISR revalidation inside this container, so these values must exist at
# runtime as well, not only during the build.
ARG UMAMI_SCRIPT_URL=""
ARG UMAMI_WEBSITE_ID=""
ARG GIT_SHA=""
ENV UMAMI_SCRIPT_URL=$UMAMI_SCRIPT_URL
ENV UMAMI_WEBSITE_ID=$UMAMI_WEBSITE_ID
ENV GIT_SHA=$GIT_SHA

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/.build-time ./.build-time
COPY --chown=node:node docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER node
EXPOSE 3000

# The probe runs through node's built in fetch instead of curl or wget.
# coollabsio/coolify#7500 reports connection refused for curl and wget based
# health checks in Dockerfile built Node containers, and node:24-alpine ships
# no curl at all. The 30 second start period covers the standalone cold start.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

Not: `.build-time` dosyası builder aşamasında `/app/.build-time` yolunda üretilir
ama `.next/standalone` kopyalaması `/app` köküne açıldığı için runner'da da
`/app/.build-time` olur; entrypoint tam olarak bu yolu okur.

- [ ] **Step 6b: Faz 1'in Dockerfile sözleşme testinin hâlâ geçtiğini doğrula**

Faz 1 `tests/deploy/dockerfile.test.ts` dosyasını bu sözleşmeyi kilitlemek için
yazdı. Dockerfile'ı değiştirdikten sonra o test kırmızıya dönerse bir sözleşme
maddesi kaybolmuş demektir.

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/deploy/dockerfile.test.ts
```

Expected: PASS, 10 test. Kırmızıysa `HOSTNAME`, `HEALTHCHECK`, `USER node` veya
`CMD ["node", "server.js"]` satırlarından biri düşmüştür; testi değil Dockerfile'ı
düzelt.

- [ ] **Step 7: .env.example'ı güncelle**

`.env.example` dosyasının sonuna ekle:

```
# Gatus status widget (runtime only, never exposed to the browser)
GATUS_URL=https://status.dogancanyildiz.sh

# Deployment identity, injected as Docker build arguments by Coolify
GIT_SHA=
BUILD_TIME=

# Umami analytics (public values, injected as Docker build arguments)
UMAMI_SCRIPT_URL=https://analytics.dogancanyildiz.sh
UMAMI_WEBSITE_ID=
```

- [ ] **Step 8: Image'ı yerelde build edip env'lerin geldiğini doğrula**

Run:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh \
  --build-arg GIT_SHA="$(git rev-parse HEAD)" \
  -t portfolio:faz5 .
docker run --rm --entrypoint /app/docker-entrypoint.sh portfolio:faz5 sh -c 'echo "$GIT_SHA $BUILD_TIME"'
```

Expected: tek satırda 40 karakterlik commit SHA ve ardından `2026-...Z` biçiminde bir zaman damgası

- [ ] **Step 9: Coolify'a build değişkenlerini ekle**

Coolify > portfolio uygulaması > Environment Variables:
- Key `GIT_SHA`, Value `${SOURCE_COMMIT}`, Build Variable: **açık**
- `BUILD_TIME` eklenmiyor; entrypoint bunu image build zamanından türetiyor.

- [ ] **Step 10: Commit**

```bash
git add src/lib/build-info.ts tests/lib/build-info.test.ts docker-entrypoint.sh Dockerfile .env.example
git commit -m "feat(build): expose commit sha and build time as runtime environment"
```

---

### Task 4: Ana sayfada Systems bölümü

**Files:**
- Create: `src/components/sections/systems.tsx`
- Modify: `messages/en.json`
- Modify: `messages/tr.json`
- Modify: `src/app/[lang]/page.tsx`

**Interfaces:**
- Consumes:
  - `getSiteStatus(): Promise<SiteStatus | null>` ve `SiteStatus { name: string; up: boolean; uptime24h: number | null; lastCheck: string }` (`@/lib/status`, Task 2)
  - `getBuildInfo(): BuildInfo` ve `BuildInfo { commitSha: string | null; shortSha: string | null; buildTime: string | null }` (`@/lib/build-info`, Task 3)
  - `SectionHeading` (`@/components/ui/section-heading`, mevcut: `src/components/ui/section-heading.tsx:11-19`, props: `eyebrow?`, `title`, `description?`, `align?`, `action?`, `className?`)
  - `cn` (`@/lib/utils`)
  - next-intl 4 server API'leri: `getTranslations`, `getFormatter` (`next-intl/server`)
- Produces:
  - `export function Systems(): Promise<React.JSX.Element>` (async Server Component, prop almaz)
  - `messages/{en,tr}.json` içinde `systems` namespace'i

- [ ] **Step 1: EN mesajlarını ekle**

`messages/en.json` dosyasının en üst seviyesine bu bloğu ekle (mevcut anahtarlara dokunma, JSON virgüllerine dikkat et):

```json
"systems": {
  "eyebrow": "Systems",
  "title": "Live infrastructure",
  "description": "This site runs on a server I maintain myself. The numbers below come from my own monitoring and refresh every 60 seconds.",
  "siteLabel": "Site",
  "up": "Operational",
  "down": "Down",
  "uptimeLabel": "Uptime, last 24 hours",
  "deployLabel": "Last deploy",
  "commitLabel": "Commit",
  "stackLabel": "Runs on",
  "noData": "No data",
  "unavailable": "Status unavailable",
  "lastCheck": "Last checked {time}"
}
```

- [ ] **Step 2: TR mesajlarını ekle**

`messages/tr.json` dosyasının en üst seviyesine:

```json
"systems": {
  "eyebrow": "Sistemler",
  "title": "Canlı altyapı",
  "description": "Bu site kendi baktığım bir sunucuda çalışıyor. Aşağıdaki veriler kendi izleme sistemimden geliyor ve 60 saniyede bir yenileniyor.",
  "siteLabel": "Site",
  "up": "Çalışıyor",
  "down": "Kapalı",
  "uptimeLabel": "Son 24 saat çalışma oranı",
  "deployLabel": "Son yayın",
  "commitLabel": "Commit",
  "stackLabel": "Üzerinde çalıştığı yapı",
  "noData": "Veri yok",
  "unavailable": "Durum bilgisi şu an alınamıyor",
  "lastCheck": "Son kontrol {time}"
}
```

- [ ] **Step 3: JSON dosyalarının geçerli olduğunu doğrula**

Run:

```bash
node -e "for (const f of ['messages/en.json','messages/tr.json']) { const m = require('./' + f); if (!m.systems || !m.systems.unavailable) throw new Error(f); } console.log('MESSAGES_OK')"
```

Expected: `MESSAGES_OK`

- [ ] **Step 4: Systems bileşenini yaz**

`src/components/sections/systems.tsx`:

```tsx
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { getBuildInfo } from "@/lib/build-info";
import { getSiteStatus } from "@/lib/status";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

/**
 * Hard-coded on purpose. This line names technologies, never machines: no
 * hostname, no port, no internal service address, no IP.
 */
const STACK = ["Next.js", "Docker", "Coolify", "Traefik", "Cloudflare"] as const;

/**
 * Candidates for a later version, taken from docs/05-backend-icerik-ve-servisler.md
 * ("Ileride eklenebilecekler"). None of them is required today and none of them
 * may introduce a hostname, port, IP or internal service name:
 *   - total number of monitored services, as an aggregate count only
 *   - a link to the public status page itself
 *   - a link to the Umami instance
 *   - uptime of other public projects such as Cargo Pilot
 *   - 30 day uptime trend
 *   - deploy frequency, "N deploys in the last 30 days"
 *   - publication date of the most recent blog post
 *   - GitHub commit activity through the public GitHub API
 */

const DATE_FORMAT = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
} as const;

function SystemsNotice({ label }: { label: string }) {
  return (
    <div className="surface-panel p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SystemsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

async function SystemsPanel() {
  const [t, format, status] = await Promise.all([
    getTranslations("systems"),
    getFormatter(),
    getSiteStatus(),
  ]);
  const build = getBuildInfo();

  if (!status) {
    return <SystemsNotice label={t("unavailable")} />;
  }

  return (
    <div className="surface-panel space-y-6 p-6">
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SystemsField label={t("siteLabel")}>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                status.up ? "bg-primary" : "bg-destructive",
              )}
            />
            {status.up ? t("up") : t("down")}
          </span>
        </SystemsField>

        <SystemsField label={t("uptimeLabel")}>
          {status.uptime24h === null
            ? t("noData")
            : format.number(status.uptime24h / 100, {
                style: "percent",
                maximumFractionDigits: 2,
              })}
        </SystemsField>

        <SystemsField label={t("deployLabel")}>
          {build.buildTime
            ? format.dateTime(new Date(build.buildTime), DATE_FORMAT)
            : t("noData")}
        </SystemsField>

        <SystemsField label={t("commitLabel")}>
          <span className="font-mono">{build.shortSha ?? t("noData")}</span>
        </SystemsField>

        <div className="space-y-2 sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
            {t("stackLabel")}
          </dt>
          <dd className="text-sm font-medium text-foreground">{STACK.join(" · ")}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">
        {t("lastCheck", {
          time: format.dateTime(new Date(status.lastCheck), DATE_FORMAT),
        })}
      </p>
    </div>
  );
}

export async function Systems() {
  const t = await getTranslations("systems");

  return (
    <section id="systems" className="section-space pt-8">
      <div className="page-shell space-y-10">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <Suspense fallback={<SystemsNotice label={t("unavailable")} />}>
          <SystemsPanel />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Ana sayfaya bağla**

`src/app/[lang]/page.tsx` içinde iki değişiklik yap:

1. Import bloğuna ekle:

```tsx
import { Systems } from "@/components/sections/systems";
```

2. `<FeaturedProjects />` ile `<SkillsStrip />` arasına ekle:

```tsx
        <Systems />
```

3. Dosyanın en üstüne, import'ların hemen altına ekle:

```tsx
// GATUS_URL is a runtime variable, so the Gatus fetch does not run during the
// Docker build. Without this the route would be frozen as fully static and the
// systems panel would never leave its "status unavailable" state.
export const revalidate = 60;
```

Referans olarak, değişiklikten sonraki dosyanın beklenen şekli:

```tsx
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Hero } from "@/components/sections/hero";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Systems } from "@/components/sections/systems";
import { SkillsStrip } from "@/components/sections/skills-strip";

// GATUS_URL is a runtime variable, so the Gatus fetch does not run during the
// Docker build. Without this the route would be frozen as fully static and the
// systems panel would never leave its "status unavailable" state.
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }
  setRequestLocale(lang);

  return (
    <>
      <Hero />
      <FeaturedProjects />
      <Systems />
      <SkillsStrip />
    </>
  );
}
```

Faz 2'nin ürettiği dosya bundan farklıysa yalnızca üç değişikliği uygula (import satırı, `export const revalidate = 60;`, `<Systems />`), geri kalanına dokunma.

- [ ] **Step 6: Tip kontrolü ve lint**

Run: `npm run typecheck && npm run lint`
Expected: iki komut da çıktısız, exit code 0

- [ ] **Step 7: GATUS_URL olmadan build al ve nötr düşüşü doğrula**

Run:

```bash
npm run build
GATUS_URL= npx next start -p 3100 &
sleep 5
curl -s http://localhost:3100/ | grep -c "Status unavailable"
kill %1
```

Expected: `1` (Gatus yokken sayfa çökmüyor, nötr metni gösteriyor)

- [ ] **Step 8: Gerçek Gatus ile lokal doğrulama**

Run:

```bash
GATUS_URL=https://status.dogancanyildiz.sh GIT_SHA="$(git rev-parse HEAD)" \
  BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" npx next start -p 3100 &
sleep 8
curl -s http://localhost:3100/ | grep -o "Operational"
curl -s http://localhost:3100/ | grep -o "$(git rev-parse --short=7 HEAD)"
curl -s http://localhost:3100/ | grep -Eic "status\.dogancanyildiz|:8080|public_site"
kill %1
```

Expected: sırasıyla `Operational`, kısa commit SHA, ve son komut için `0` (Gatus adresi, portu ve endpoint anahtarı HTML'de hiç geçmiyor)

Not: ISR sebebiyle ilk istek build sırasındaki (Gatus'suz) HTML'i dönebilir; ikinci isteği 2 saniye sonra tekrarla.

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/systems.tsx messages/en.json messages/tr.json "src/app/[lang]/page.tsx"
git commit -m "feat(home): add live systems section backed by gatus"
```

---

### Task 5: Umami + Postgres yığını ve Gatus'a Umami endpoint'i

**Files:**
- Create: `infra/umami/docker-compose.yml`
- Modify: `infra/gatus/config/gatus.yaml`
- Modify: `infra/README.md`

**Interfaces:**
- Consumes: Task 1'de kurulan Gatus kaynağı ve config dosyası.
- Produces:
  - `https://analytics.dogancanyildiz.sh` üzerinde çalışan Umami instance'ı
  - Umami website ID'si (Task 6'da `UMAMI_WEBSITE_ID` Build değişkeni olarak kullanılacak)
  - Gatus'ta ikinci bir endpoint: anahtar `public_umami` (widget bunu göstermez, `SITE_ENDPOINT_KEY` filtresi dışarıda bırakır)

- [ ] **Step 1: Umami compose dosyasını yaz**

`infra/umami/docker-compose.yml`:

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: unless-stopped
    environment:
      SERVICE_FQDN_UMAMI_3000: /
      DATABASE_TYPE: postgresql
      DATABASE_URL: postgresql://umami:${SERVICE_PASSWORD_UMAMIDB}@umami-db:5432/umami
      APP_SECRET: ${SERVICE_PASSWORD_UMAMIAPP}
      DISABLE_TELEMETRY: "1"
    depends_on:
      umami-db:
        condition: service_healthy
    expose:
      - "3000"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://127.0.0.1:3000/api/heartbeat || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 90s

  umami-db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: ${SERVICE_PASSWORD_UMAMIDB}
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  umami-db-data:
```

Not: `SERVICE_PASSWORD_UMAMIDB` ve `SERVICE_PASSWORD_UMAMIAPP` Coolify'ın magic değişkenleri; Coolify bunları ilk deploy'da rastgele üretip kaynağın env listesine yazar, repoda hiçbir sır tutulmaz.

- [ ] **Step 2: Compose sözdizimini doğrula**

Run:

```bash
SERVICE_PASSWORD_UMAMIDB=x SERVICE_PASSWORD_UMAMIAPP=y \
  docker compose -f infra/umami/docker-compose.yml config --quiet && echo COMPOSE_OK
```

Expected: `COMPOSE_OK`

- [ ] **Step 3: infra/README.md'yi güncelle**

`infra/README.md` içindeki tabloya zaten `umami/` satırı var; tablonun altına şu paragrafı ekle:

```markdown
Umami generates its own database password and application secret through the
Coolify `SERVICE_PASSWORD_*` magic variables, so no secret is ever committed
here. The website id created inside the Umami dashboard is public by design and
is passed to the application as a Docker build argument.
```

- [ ] **Step 4: Cloudflare DNS kaydı**

Cloudflare > dogancanyildiz.sh > DNS > Records:
- Type `A`, Name `analytics`, Content: sunucunun public IPv4 adresi, Proxy status **Proxied**, TTL Auto.

- [ ] **Step 5: Coolify'da Umami kaynağını oluştur**

Coolify > Project > + New Resource > Docker Compose:
- Source: bu GitHub repository, branch `main`
- Base Directory: `/infra/umami`
- Docker Compose Location: `/docker-compose.yml`
- Deploy > Domains: `umami` servisi için `https://analytics.dogancanyildiz.sh`
- Deploy et.

- [ ] **Step 6: Umami'nin ayakta olduğunu doğrula**

Run:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.sh/api/heartbeat
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.sh/script.js
```

Expected: iki satır da `200`

- [ ] **Step 7: Umami'de website kaydı aç ve varsayılan parolayı değiştir**

`https://analytics.dogancanyildiz.sh` adresine gir:
1. Varsayılan hesapla giriş yap (`admin` / `umami`), Settings > Profile üzerinden parolayı hemen değiştir.
2. Settings > Websites > Add website: Name `dogancanyildiz.sh`, Domain `dogancanyildiz.sh`.
3. Oluşan Website ID'yi (UUID) not al, Task 6'da kullanılacak.

- [ ] **Step 8: Gatus config'ine Umami endpoint'ini ekle**

`infra/gatus/config/gatus.yaml` içindeki `endpoints:` listesinin sonuna ekle:

```yaml
  # Monitored but intentionally not rendered by the site widget: src/lib/status.ts
  # only ever returns the entry whose key equals SITE_ENDPOINT_KEY.
  - name: umami
    group: public
    url: https://analytics.dogancanyildiz.sh/api/heartbeat
    interval: 300s
    conditions:
      - "[STATUS] == 200"
```

- [ ] **Step 9: Commit ve Gatus'u yeniden deploy et**

```bash
git add infra/umami/docker-compose.yml infra/gatus/config/gatus.yaml infra/README.md
git commit -m "feat(infra): add umami analytics stack and monitor it from gatus"
```

Coolify > gatus kaynağı > Redeploy.

- [ ] **Step 10: Gatus'un iki endpoint gördüğünü doğrula**

Run:

```bash
curl -s https://status.dogancanyildiz.sh/api/v1/endpoints/statuses | jq -r '.results[].key' | sort
```

Expected:

```
public_site
public_umami
```

- [ ] **Step 11: Widget'ın hâlâ yalnızca site'ı gösterdiğini doğrula**

Run:

```bash
npx vitest run tests/lib/status.test.ts -t "ignores every endpoint other than the public site one"
```

Expected: PASS, `1 passed` (fixture Task 2'den beri `public_umami` kaydını içeriyor, bu test tam da onun dışarıda kaldığını doğruluyor)

---

### Task 6: Umami script tag'i ve CSP genişletmesi

**Files:**
- Create: `src/components/umami-script.tsx`
- Create: `tests/config/csp.test.ts`
- Modify: `next.config.ts`
- Modify: `src/app/[lang]/layout.tsx`

**Interfaces:**
- Consumes: Umami Website ID (Task 5 Step 7), `UMAMI_SCRIPT_URL` ve `UMAMI_WEBSITE_ID` build argümanları (Task 3 Step 6'da Dockerfile'a eklendi).
- Produces:
  - `export function UmamiScript(): React.JSX.Element | null` (Server Component, prop almaz)
  - `next.config.ts` içinde `export const UMAMI_ORIGIN: string` (değer: `"https://analytics.dogancanyildiz.sh"`), CSP testinin ve `script-src`/`connect-src` direktiflerinin tek kaynağı

- [ ] **Step 1: Başarısız CSP testini yaz**

`tests/config/csp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import nextConfig, { UMAMI_ORIGIN } from "../../next.config";

async function contentSecurityPolicy(): Promise<string> {
  const rules = await nextConfig.headers!();
  const header = rules[0].headers.find((entry) => entry.key === "Content-Security-Policy");
  if (!header) throw new Error("Content-Security-Policy header is not defined");
  return header.value;
}

describe("content security policy", () => {
  it("allows the umami origin in script-src", async () => {
    expect(await contentSecurityPolicy()).toContain(`script-src 'self' ${UMAMI_ORIGIN}`);
  });

  it("allows the umami origin in connect-src", async () => {
    expect(await contentSecurityPolicy()).toContain(`connect-src 'self' ${UMAMI_ORIGIN}`);
  });

  it("keeps the restrictive directives untouched", async () => {
    const csp = await contentSecurityPolicy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("does not widen script-src with a wildcard", async () => {
    expect(await contentSecurityPolicy()).not.toContain("script-src 'self' *");
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npx vitest run tests/config/csp.test.ts`
Expected: FAIL, `UMAMI_ORIGIN` export'u bulunamadığı için import hatası

- [ ] **Step 3: next.config.ts'i güncelle**

`next.config.ts` (tam içerik; Faz 0'ın header seti korunuyor, `script-src` ve `connect-src` genişletiliyor, `UMAMI_ORIGIN` dışa aktarılıyor):

```ts
import type { NextConfig } from "next";

/**
 * Single source of truth for the self-hosted Umami origin.
 * Both the CSP below and tests/config/csp.test.ts read this constant, so the
 * policy and the analytics host can never drift apart.
 */
export const UMAMI_ORIGIN = "https://analytics.dogancanyildiz.sh";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' ${UMAMI_ORIGIN}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${UMAMI_ORIGIN}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npx vitest run tests/config/csp.test.ts`
Expected: PASS, `4 passed`

- [ ] **Step 5: UmamiScript bileşenini yaz**

`src/components/umami-script.tsx`:

```tsx
/**
 * Self-hosted, cookieless Umami tracker.
 *
 * Both values are public by definition, they end up in the HTML source anyway,
 * but they are read here on the server instead of through NEXT_PUBLIC_* so that
 * nothing extra is inlined into the client bundle. They are supplied to the
 * image as Docker build arguments (see Dockerfile), because this layout is
 * prerendered: a runtime-only variable would render an empty tag.
 *
 * The origin used here must stay identical to UMAMI_ORIGIN in next.config.ts,
 * otherwise the CSP blocks the request.
 */
export function UmamiScript() {
  const scriptUrl = process.env.UMAMI_SCRIPT_URL?.trim();
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim();

  if (!scriptUrl || !websiteId) {
    return null;
  }

  return (
    <script
      async
      src={`${scriptUrl.replace(/\/+$/, "")}/script.js`}
      data-website-id={websiteId}
    />
  );
}
```

- [ ] **Step 6: Layout'a bağla**

`src/app/[lang]/layout.tsx` içinde iki değişiklik yap:

1. Import bloğuna ekle:

```tsx
import { UmamiScript } from "@/components/umami-script";
```

2. `<body>` içindeki en son öğe olarak, kapanış `</body>` etiketinden hemen önce ekle:

```tsx
        <UmamiScript />
```

- [ ] **Step 7: Tip kontrolü, lint ve tüm testler**

Run: `npm run typecheck && npm run lint && npm test`
Expected: üçü de hatasız; vitest özetinde `status.test.ts`, `build-info.test.ts`, `csp.test.ts` dosyalarının tamamı geçiyor

- [ ] **Step 8: Yerelde script tag'ini ve CSP başlığını doğrula**

Run:

Bu iki değişken layout prerender edilirken okunuyor, o yüzden `next start`'a değil `next build`'e verilmek zorunda; Coolify'da da bu yüzden Build Variable işaretleniyorlar.

```bash
UMAMI_SCRIPT_URL=https://analytics.dogancanyildiz.sh \
UMAMI_WEBSITE_ID=00000000-0000-4000-8000-000000000000 \
  npm run build
UMAMI_SCRIPT_URL=https://analytics.dogancanyildiz.sh \
UMAMI_WEBSITE_ID=00000000-0000-4000-8000-000000000000 \
  npx next start -p 3100 &
sleep 5
curl -s http://localhost:3100/ | grep -o 'data-website-id="[^"]*"'
curl -sI http://localhost:3100/ | grep -i "content-security-policy"
kill %1
```

Expected:
- birinci komut: `data-website-id="00000000-0000-4000-8000-000000000000"`
- ikinci komut: içinde hem `script-src 'self' https://analytics.dogancanyildiz.sh` hem `connect-src 'self' https://analytics.dogancanyildiz.sh` geçen tek satır

- [ ] **Step 9: Commit**

```bash
git add next.config.ts src/components/umami-script.tsx tests/config/csp.test.ts "src/app/[lang]/layout.tsx"
git commit -m "feat(analytics): load self-hosted umami tracker and widen csp for it"
```

- [ ] **Step 10: Coolify'a Umami build değişkenlerini ekle**

Coolify > portfolio uygulaması > Environment Variables:
- Key `UMAMI_SCRIPT_URL`, Value `https://analytics.dogancanyildiz.sh`, Build Variable: **açık**
- Key `UMAMI_WEBSITE_ID`, Value: Task 5 Step 7'de alınan UUID, Build Variable: **açık**

Gerekçe: bu iki değer public, sır değil; ancak layout prerender edildiği için yalnızca Runtime işaretlenirse HTML'e boş çıkar. Aynı tuzağın `NEXT_PUBLIC_SITE_URL` karşılığı `docs/09-guvenlik.md` bölüm 4'te anlatılıyor. `GATUS_URL` ise Runtime kalmaya devam ediyor, o bir iç adres.

---

### Task 7: Renovate ve Coolify otomatik redeploy zincirinin doğrulanması

**Files:**
- Create: `docs/runbooks/infrastructure.md`
- Modify: `renovate.json` (yalnızca major auto-merge açıksa)

**Interfaces:**
- Consumes: Task 1-6'nın tüm çıktıları (Gatus, Umami, Systems bölümü, build değişkenleri); Faz 0'ın repoya koyduğu `renovate.json`.
- Produces: `docs/runbooks/infrastructure.md` (env değişkenleri, Coolify kaynakları, bakım ritmi ve doğrulama komutlarının tek referansı); kurulmuş Renovate GitHub App'i.

- [ ] **Step 0: Renovate GitHub App'ini kur**

Faz 0 `renovate.json` dosyasını repoya koydu ama GitHub App'i kurmadı; dosya tek
başına hiçbir PR açmaz. Kurulum bu fazın maddesidir.

1. https://github.com/apps/renovate adresine git, **Configure**.
2. Hesap olarak `dogancanyildiz`, kapsam olarak **Only select repositories** ->
   `dogancanyildiz/portfolio` seç, **Install**.
3. Renovate ilk çalıştığında "Configure Renovate" adında bir onboarding PR'ı açar.
   Repoda zaten `renovate.json` olduğu için bu PR yalnızca Dependency Dashboard
   issue'sunu kurar; PR'ı merge et.

Doğrulama:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh api repos/dogancanyildiz/portfolio/installation --jq '.app_slug'
gh issue list --state open --json number,title --jq '.[] | select(.title | test("Dependency Dashboard")) | "\(.number) \(.title)"'
```

Expected: birinci komut `renovate` yazar, ikinci komut Dependency Dashboard
issue'sunu listeler. Birincisi `gh: Not Found` verirse App kurulmamıştır.

- [ ] **Step 1: Renovate yapılandırmasını denetle**

Run: `cat renovate.json`

Kontrol listesi:
- `packageRules` içinde `matchUpdateTypes: ["patch", "minor"]` için `automerge: true` var.
- `matchUpdateTypes: ["major"]` için `automerge: false` (veya major kuralı hiç yok, bu da varsayılan olarak false demek).
- `velite` için `rangeStrategy: "pin"` veya en azından exact pin'i bozacak bir `bump` stratejisi yok.

Major auto-merge açıksa `renovate.json` içindeki ilgili kuralı şu blokla değiştir:

```json
{
  "matchUpdateTypes": ["major"],
  "automerge": false,
  "addLabels": ["needs-manual-review"]
}
```

- [ ] **Step 2: Renovate'in en az bir PR açmış olduğunu doğrula**

Run: `gh pr list --state all --limit 20 --json number,title,author --jq '.[] | select(.author.login | test("renovate")) | "\(.number) \(.title)"'`
Expected: en az bir satır (ör. `12 chore(deps): update dependency ... to v...`)

Hiç satır yoksa Renovate'in Dependency Dashboard issue'sunu aç ve "Check this box to trigger a request for Renovate to run again" kutusunu işaretle, 10 dakika sonra komutu tekrarla.

- [ ] **Step 2b: Next.js güvenlik yayınlarının takibini bağla**

Renovate `next` için de PR açar ama sürüm çıktıktan sonra, sıradaki koşuda. Next
aylık güvenlik yayınlarını (Faz 0'ın gerekçesi olan CVE serisi) kaçırmamak için
iki kanal ayrıca açılır:

1. GitHub bildirimleri: `vercel/next.js` deposunda **Watch -> Custom -> Releases**
   ve **Security alerts** işaretlenir.
2. Repo tarafında Dependabot güvenlik uyarıları: GitHub -> `dogancanyildiz/portfolio`
   -> Settings -> Code security -> **Dependabot alerts** ve **Dependabot security
   updates** açılır. Renovate sürüm PR'larını, Dependabot yalnızca güvenlik
   yamalarını açar; ikisi çakışmaz çünkü Dependabot yalnızca advisory varken devreye girer.

Doğrulama:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
gh api repos/dogancanyildiz/portfolio/vulnerability-alerts -i --silent 2>&1 | head -1
gh api repos/dogancanyildiz/portfolio/subscription --jq '.subscribed'
```

Expected: birinci komut `HTTP/2.0 204` (uyarılar açık; kapalıysa `404`),
ikinci komut `true`.

- [ ] **Step 3: Runbook'u yaz**

`docs/runbooks/infrastructure.md`:

```markdown
# Altyapı runbook'u

Faz 5 ile canlıya alınan yan servisler, ortam değişkenleri ve doğrulama komutları.

## Coolify kaynakları

| Kaynak | Tip | Kaynak dizini | Domain |
|---|---|---|---|
| portfolio | Dockerfile (git tabanlı) | `/` | https://dogancanyildiz.sh |
| gatus | Docker Compose (git tabanlı) | `/infra/gatus` | https://status.dogancanyildiz.sh |
| umami | Docker Compose (git tabanlı) | `/infra/umami` | https://analytics.dogancanyildiz.sh |

## portfolio uygulamasının ortam değişkenleri

| Değişken | Katman | Değer / kaynak |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build | `https://dogancanyildiz.sh` |
| `UMAMI_SCRIPT_URL` | Build | `https://analytics.dogancanyildiz.sh` |
| `UMAMI_WEBSITE_ID` | Build | Umami panelindeki website UUID'si |
| `GIT_SHA` | Build | `${SOURCE_COMMIT}` |
| `GATUS_URL` | Runtime | `https://status.dogancanyildiz.sh` |
| `RESEND_API_KEY` | Runtime | Resend API anahtarı |
| `CONTACT_EMAIL` | Runtime | `me@dogancanyildiz.com` |
| `FROM_EMAIL` | Runtime | `dogancanyildiz.sh` üzerinde doğrulanmış gönderici |

`BUILD_TIME` elle set edilmiyor: builder aşaması `/app/.build-time` dosyasını
yazıyor, `docker-entrypoint.sh` bunu container başlarken ortam değişkenine
çeviriyor.

## Sızıntı kuralı

`src/lib/status.ts` yalnızca `name`, `up`, `uptime24h`, `lastCheck` alanlarını
döndürür. Bu listeye alan eklemek bir güvenlik kararıdır; hostname, port, IP, iç
servis adresi ve Gatus URL'i hiçbir koşulda client'a gitmez. Değişiklik
önerilirse `docs/09-guvenlik.md` bölüm 3'teki tablo checklist olarak kullanılır.

## Doğrulama komutları

```bash
# Gatus canlı ve iki endpoint izliyor
curl -s https://status.dogancanyildiz.sh/api/v1/endpoints/statuses | jq -r '.results[].key' | sort

# Umami canlı
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.sh/api/heartbeat

# Yayındaki commit, main'in ucuyla aynı
curl -s https://dogancanyildiz.sh/ | grep -c "$(git rev-parse --short=7 origin/main)"

# CSP Umami origin'ini içeriyor
curl -sI https://dogancanyildiz.sh/ | grep -i content-security-policy

# Sayfada topoloji sızıntısı yok
curl -s https://dogancanyildiz.sh/ | grep -Eic 'status\.dogancanyildiz|:8080|public_site'
```

## Bakım kadansı

- Renovate patch ve minor PR'larını CI kapısı yeşilse otomatik merge eder;
  merge `main`'e düşünce Coolify webhook'u otomatik redeploy tetikler.
- Major sürüm PR'ları `needs-manual-review` etiketiyle bekler, elle incelenir.
- Ayda bir nextjs.org/blog güvenlik duyuruları taranır; sürüm numarası
  değişmeden yayınlanan mitigasyonları otomasyon yakalayamaz. `vercel/next.js`
  deposunda Watch -> Releases + Security alerts açık, repoda Dependabot
  security updates açık (Task 7 Step 2b).

## İçerik kadansı ve Astro yeniden değerlendirmesi

`docs/10-yol-haritasi.md` Faz 5 ve `docs/00-ozet-ve-karar.md` tripwire'ı.

- **Ayda 1 blog yazısı.** Yazı TR-first yazılır, uluslararası ilgi görecek olan
  EN'e çevrilir (`docs/08-icerik-stratejisi.md`). Yeni yazı `content/blog/tr/`
  ve gerekiyorsa `content/blog/en/` altına aynı slug'la eklenir; çevirisi
  olmayan yazı diğer dilin sitemap ve hreflang alternates'ine girmez, bunu
  `getPostLocales(slug)` otomatik halleder.
- **Takip:** her ayın ilk haftası aşağıdaki komut çalıştırılır, sayı bir önceki
  aya göre artmamışsa o ay yazı yazılmamış demektir.

  ```bash
  ls content/blog/tr/*.mdx | wc -l
  ```

- **Astro yeniden değerlendirmesi:** Faz 5 merge tarihinden 3 ay sonra, blogda
  en az 12 yazı birikmişse `docs/02-stack-karari.md` yeniden okunur ve Astro
  kararı tekrar tartılır. Tetikleyici ölçüm: ana sayfanın first-load JS'i
  (`npm run build` çıktısındaki First Load JS sütunu) 150 KB gzip'i aşarsa
  veya blog derleme süresi 60 saniyeyi geçerse soru erkene alınır.
- **Karar tarihi:** yeniden değerlendirme sonucu, yapılsın veya yapılmasın,
  `docs/02-stack-karari.md` sonuna tarihli bir satır olarak yazılır.
```

- [ ] **Step 4: Commit**

```bash
git add docs/runbooks/infrastructure.md renovate.json
git commit -m "docs(infra): add infrastructure runbook and tighten renovate major policy"
```

- [ ] **Step 5: PR aç ve CI kapısını bekle**

```bash
git push -u origin feature/faz-5-altyapi-vitrini
gh pr create --base main --title "feat: phase 5 infrastructure showcase, analytics and maintenance automation" --body "$(cat <<'EOF'
Phase 5 of the modernisation roadmap (docs/10-yol-haritasi.md).

- Gatus compose stack under infra/gatus, monitoring only public URLs, no alerting, sqlite storage
- src/lib/status.ts reads the Gatus JSON API server side, validates it with Zod and returns only name, up, uptime24h and lastCheck
- Systems section on the home page: site state, 24 hour uptime, last deploy time, commit sha and stack line
- Commit sha and build time reach the container as runtime environment through a build argument and an entrypoint
- Umami compose stack under infra/umami, tracker script in the layout, CSP widened for that single origin
- Renovate GitHub App installed, Dependabot security updates enabled, infrastructure runbook with the maintenance and content cadence, stricter Renovate policy for major updates

Done criteria: docs/plans/2026-08-27-faz-5-altyapi-vitrini-ve-olcum.md
EOF
)"
gh pr checks --watch
```

Expected: `lint`, `typecheck`, `build` ve `test` adımlarının hepsi yeşil

- [ ] **Step 6: Merge et ve otomatik deploy'u doğrula**

```bash
gh pr merge --squash --delete-branch
git checkout main && git pull
sleep 240
curl -s https://dogancanyildiz.sh/ | grep -c "$(git rev-parse --short=7 HEAD)"
```

Expected: `1` (Coolify webhook'u merge'ü yakaladı, yeni image deploy oldu, widget yeni commit SHA'sını gösteriyor)

`0` çıkarsa Coolify > portfolio > Deployments listesini kontrol et; deploy hiç tetiklenmediyse GitHub App'in Deployments izni, tetiklenip başarısız olduysa build loglarını incele.

---

## Bitti sayılma kriteri

Aşağıdaki komutların tamamı beklenen çıktıyı vermeden faz kapanmaz.

**1. Yerel kapı**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
Beklenen: dördü de exit code 0; vitest özeti `tests/lib/status.test.ts`, `tests/lib/build-info.test.ts`, `tests/config/csp.test.ts` dosyalarında toplam 19 geçen test gösteriyor.

**2. Gatus canlı ve iki endpoint izliyor, alerting yok**

```bash
curl -s https://status.dogancanyildiz.sh/api/v1/endpoints/statuses | jq -r '.results[].key' | sort
grep -c "alerting" infra/gatus/config/gatus.yaml
```
Beklenen:
```
public_site
public_umami
```
ve ikinci komut için `0`.

**3. Umami canlı ve tracker yükleniyor**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.sh/api/heartbeat
curl -s https://dogancanyildiz.sh/ | grep -o 'data-website-id="[0-9a-f-]\{36\}"'
```
Beklenen: `200` ve tek satır `data-website-id="..."` (36 karakterlik UUID).

**4. CSP Umami origin'ini içeriyor, gevşetilmemiş**

```bash
curl -sI https://dogancanyildiz.sh/ | tr -d '\r' | grep -i "^content-security-policy:"
```
Beklenen: satırda hem `script-src 'self' https://analytics.dogancanyildiz.sh` hem `connect-src 'self' https://analytics.dogancanyildiz.sh` geçiyor; `script-src` içinde `*` veya `'unsafe-eval'` yok.

**5. Systems bölümü gerçek veriyle çalışıyor**

```bash
curl -s https://dogancanyildiz.sh/ | grep -o "Operational"
curl -s https://dogancanyildiz.sh/ | grep -c "$(git rev-parse --short=7 origin/main)"
curl -s https://dogancanyildiz.sh/tr | grep -o "Çalışıyor"
```
Beklenen: `Operational`, `1`, `Çalışıyor`.

**6. Topoloji sızıntısı yok**

```bash
curl -s https://dogancanyildiz.sh/ | grep -Eic 'status\.dogancanyildiz|public_site|public_umami|:8080|umami-db|127\.0\.0\.1'
curl -s https://dogancanyildiz.sh/tr | grep -Eic 'status\.dogancanyildiz|public_site|public_umami|:8080|umami-db|127\.0\.0\.1'
```
Beklenen: iki komut da `0`.

**7. Gatus düştüğünde site nötr düşüyor**

```bash
# Coolify > gatus kaynagini Stop et, ardindan:
sleep 70
curl -s -o /dev/null -w '%{http_code}\n' https://dogancanyildiz.sh/
curl -s https://dogancanyildiz.sh/ | grep -c "Status unavailable"
# Coolify > gatus kaynagini tekrar Start et
```
Beklenen: `200` ve `1`. Sayfa hiçbir koşulda 500 dönmüyor.

**8. Bakım otomasyonu**

```bash
gh pr list --state all --limit 20 --json number,title,author --jq '.[] | select(.author.login | test("renovate")) | .number' | wc -l
node -e "const c=require('./renovate.json'); const major=(c.packageRules||[]).find(r=>(r.matchUpdateTypes||[]).includes('major')); if (major && major.automerge === true) throw new Error('major automerge is enabled'); console.log('RENOVATE_OK')"
```
Beklenen: birinci komut `1` veya daha büyük, ikinci komut `RENOVATE_OK`.

**9. Üslup ve içerik kuralları**

```bash
grep -rn "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" src messages infra docs/runbooks || echo NO_DASHES
grep -rni "alex chen\|example.com\|techcorp\|startupxyz" src messages infra || echo NO_PLACEHOLDER_CONTENT
```
Beklenen: `NO_DASHES` ve `NO_PLACEHOLDER_CONTENT`.

---

## Devir notu şablonu

Faz 5 kapandığında bir sonraki ajana aşağıdaki dört başlık doldurulmuş olarak devredilir.

### Yapıldı

- `infra/gatus/` (compose + `config/gatus.yaml`) ve Coolify'da `gatus` kaynağı, `status.dogancanyildiz.sh` Cloudflare proxied.
- `infra/umami/` (Umami + Postgres 17 compose) ve Coolify'da `umami` kaynağı, `analytics.dogancanyildiz.sh` Cloudflare proxied.
- `src/lib/status.ts`, `src/lib/build-info.ts`, `src/components/sections/systems.tsx`, `src/components/umami-script.tsx`.
- `Dockerfile` build argümanları (`GIT_SHA`, `BUILD_TIME`, `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID`) ve `docker-entrypoint.sh`.
- `next.config.ts` CSP'sinde tek Umami origin'i için `script-src` ve `connect-src` genişletmesi.
- `messages/en.json` ve `messages/tr.json` içinde `systems` namespace'i.
- `docs/runbooks/infrastructure.md`.

### Doğrulandı

- Yukarıdaki "Bitti sayılma kriteri" bölümündeki 9 kontrolün tamamı, çalıştırılma tarihi ve çıktısıyla.
- Gatus kapalıyken ana sayfanın 200 dönmesi ve nötr metne düşmesi.
- Yayındaki HTML'de hostname, port, IP, endpoint anahtarı ve Gatus URL'inin hiç geçmemesi.
- Renovate'in en az bir PR açmış olması ve merge sonrası Coolify'ın otomatik deploy tetiklemesi.

### Açık kaldı

- Umami panelinin varsayılan `admin` hesabı: parola değiştirildi mi, iki faktörlü koruma isteniyor mu.
- `twinproduction/gatus:v5` etiketi major seviyesinde pinli; Renovate'in digest pin'i istenirse ayrıca yapılandırılmalı.
- `docs/05-backend-icerik-ve-servisler.md`'deki "ileride eklenebilecekler" listesi (`systems.tsx` içinde yorum olarak duruyor) uygulanmadı, bilinçli olarak v1 kapsamı dışında.
- `NEXT_PUBLIC_SITE_URL` runner aşamasına ARG/ENV olarak eklenmedi; ISR yeniden render'ında metadata üretimi bu değişkeni okuyorsa Faz 1'in Dockerfile kararı gözden geçirilmeli.
- İlk 3 ayın sonunda Astro yeniden değerlendirme sorusu (`docs/00-ozet-ve-karar.md` tripwire'ı) hâlâ açık; tetikleyici ölçümleri ve karar tarihi `docs/runbooks/infrastructure.md` "İçerik kadansı ve Astro yeniden değerlendirmesi" bölümünde yazılı.

### Üretilen arayüzler

| Ad | Yer | İmza / değer |
|---|---|---|
| `SITE_ENDPOINT_KEY` | `src/lib/status.ts` | `const SITE_ENDPOINT_KEY: string` = `"public_site"` |
| `SITE_ENDPOINT_ALIAS` | `src/lib/status.ts` | `const SITE_ENDPOINT_ALIAS: string` = `"site"` |
| `SiteStatus` | `src/lib/status.ts` | `interface SiteStatus { name: string; up: boolean; uptime24h: number \| null; lastCheck: string }` |
| `getSiteStatus` | `src/lib/status.ts` | `() => Promise<SiteStatus \| null>` |
| `BuildInfo` | `src/lib/build-info.ts` | `interface BuildInfo { commitSha: string \| null; shortSha: string \| null; buildTime: string \| null }` |
| `getBuildInfo` | `src/lib/build-info.ts` | `() => BuildInfo` |
| `Systems` | `src/components/sections/systems.tsx` | `() => Promise<React.JSX.Element>` (async Server Component, prop yok) |
| `UmamiScript` | `src/components/umami-script.tsx` | `() => React.JSX.Element \| null` (Server Component, prop yok) |
| `UMAMI_ORIGIN` | `next.config.ts` | `const UMAMI_ORIGIN: string` = `"https://analytics.dogancanyildiz.sh"` |
| `systems` mesaj namespace'i | `messages/en.json`, `messages/tr.json` | anahtarlar: `eyebrow`, `title`, `description`, `siteLabel`, `up`, `down`, `uptimeLabel`, `deployLabel`, `commitLabel`, `stackLabel`, `noData`, `unavailable`, `lastCheck` |
| `GATUS_URL` | Coolify Runtime env | `https://status.dogancanyildiz.sh` |
| `GIT_SHA` | Coolify Build env | `${SOURCE_COMMIT}` |
| `UMAMI_SCRIPT_URL` | Coolify Build env | `https://analytics.dogancanyildiz.sh` |
| `UMAMI_WEBSITE_ID` | Coolify Build env | Umami website UUID'si |
| Gatus JSON API | `https://status.dogancanyildiz.sh` | `/api/v1/endpoints/statuses`, `/api/v1/endpoints/public_site/uptimes/24h` |
