# Faz 0: Güvenlik ve hijyen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bilinen Next.js CVE'lerini kapatmak, üretime hazır bir Next yapılandırması (standalone + güvenlik başlıkları) bırakmak, contact endpoint'ini sunucu tarafında sertleştirmek ve create-next-app kalıntılarını temizlemek.

**Architecture:** Değişiklikler dört bağımsız katmanda ilerliyor: (1) araç zinciri ve bağımlılık sürümleri, (2) `next.config.ts` üzerinden platform sertleştirmesi, (3) `src/lib/` altında saf, test edilebilir yardımcı modüller (`env`, `client-ip`, `rate-limit`, `contact-validation`) ve bunları tüketen ince route handler'lar, (4) repo hijyeni (ölü dosya, README, Renovate). Saf mantık route handler'ların dışına çıkarıldığı için vitest ile `next/server` yüklemeden test edilebiliyor; route handler yalnızca bu modülleri birleştiriyor.

**Tech Stack:** Next.js 16.3.3 (App Router, output standalone), React 19.2.3, TypeScript 5.x, Tailwind CSS 4.x, motion 13.1.1, Resend 6.x, vitest 4.x (node environment), prettier 3.x, npm 11.16.0, Node 24.

**Spec:**
- `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/10-yol-haritasi.md` (Faz 0 madde listesi ve bitiş kriteri)
- `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/09-guvenlik.md` (CVE listesi, header/CSP taslağı, env katman kuralı, Renovate)
- `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/05-backend-icerik-ve-servisler.md` (contact endpoint sertleştirme tasarımı)
- `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/01-mevcut-durum-denetimi.md` (B1-B9, D6-D11, F8 bulguları)
- `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/00-ozet-ve-karar.md` (stack ve sürüm tablosu)

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

## Faz 0'a özel notlar (uygulayıcı okumadan başlamasın)

**Dal adı:** `feature/faz-0-guvenlik-ve-hijyen`. Tüm task'lar bu tek dalda, tek PR olarak birleşir.

**CSP'de spec'ten bilinçli sapma (Task 3):** `09-guvenlik.md`'deki taslak `script-src 'self'` diyor. Next.js App Router, akış (streaming) RSC verisini üretim HTML'ine satır içi `<script>` etiketleriyle gömüyor; `'unsafe-inline'` veya nonce olmadan bu script'ler tarayıcı tarafından bloklanır ve sayfa hydrate olmaz. Next.js resmi CSP rehberi nonce yolunun **tüm sayfaları dinamik render'a zorladığını** açıkça yazıyor (statik optimizasyon ve ISR devre dışı kalıyor). Bu, Faz 2'nin bitiş kriteriyle (`yalnızca /api/* dynamic, geri kalan her şey statik`) doğrudan çelişiyor. Bu yüzden Faz 0 `script-src 'self' 'unsafe-inline'` ile çıkıyor; taslağın geri kalanı birebir uygulanıyor. Bu sapma devir notunda "açık kaldı" alanına yazılır.

**Repo bugünkü durumu (uygulayıcı için başlangıç noktası):**
- `package.json:16` -> `"next": "16.1.6"`, `package.json:9` -> `"framer-motion": "^12.34.3"`, `package.json:5-10` -> yalnızca dev/build/start/lint script'leri, `engines` alanı yok.
- `next.config.ts:1-6` -> tamamen boş `NextConfig`.
- `src/app/opengraph-image.tsx:3` -> `export const runtime = "edge";`
- `src/app/robots.ts:9` ve `src/app/sitemap.ts:4` -> `process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"`.
- `src/app/api/contact/route.ts:4-5` -> `?? "onboarding@resend.dev"` sessiz fallback; `:63-67` -> Resend'in ham `error.message`'ı client'a dönüyor; rate limit, honeypot kontrolü, uzunluk sınırı yok.
- `src/components/sections/contact-form.tsx:23-26` -> honeypot yalnızca client tarafında; `:116-119` -> gizli `website` input'u.
- `public/` -> `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`; hiçbiri koddan referans edilmiyor.
- `README.md:1-36` -> create-next-app şablonu, "Deploy on Vercel" bölümü var.
- `src/lib/` -> yalnızca `resend.ts`, `utils.ts`, `i18n/` var. Test dosyası yok.

**Faz 0 kapsamı dışında (bilerek):** i18n restructure (Faz 2), font vendoring ve palet (Faz 3), Dockerfile/.dockerignore/GitHub Actions (Faz 1), Velite ve gerçek içerik (Faz 4), Gatus/Umami (Faz 5), `lucide-react`/`shadcn`/`typescript` major yükseltmeleri (Faz 0 sonrası ayrı PR).

---

### Task 1: Dal, araç zinciri ve test altyapısı

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.nvmrc`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.prettierrc.json`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.prettierignore`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/vitest.config.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package.json:4-10` (scripts), `:11` (engines eklenir), devDependencies
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package-lock.json` (npm 11.16.0 ile normalize)
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/utils.test.ts`

**Interfaces:**
- Consumes: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts` (mevcut, değişmiyor).
- Produces:
  - npm script'leri: `npm run typecheck` (`tsc --noEmit`), `npm test` (`vitest run`), `npm run format` (`prettier --check .`), `npm run format:write` (`prettier --write .`).
  - vitest sözleşmesi: test dosyaları `src/**/*.test.ts` deseninde, node environment, `globals` kapalı (her testte `import { describe, expect, it } from "vitest"` zorunlu), `@/*` alias'ı `./src/*`'a çözülür.

- [ ] **Step 1: Dalı aç ve npm sürümünü doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git checkout main
git pull --ff-only
git checkout -b feature/faz-0-guvenlik-ve-hijyen
node -v
npm -v
```

Expected: `node -v` -> `v24.x.x`, `npm -v` -> `11.16.0`. Farklı bir npm sürümü çıkarsa `package-lock.json` normalizasyonu (D9 bulgusu) anlamını yitirir; devam etmeden önce `npm i -g npm@11.16.0` ile sabitle.

- [ ] **Step 2: Karar dokümanlarını ve bu planı ayrı bir commit ile kayda geçir**

`docs/` dizini şu an git tarafından izlenmiyor (`git status` çıktısında `?? docs/`). Kod değişikliklerine karışmaması için önce tek başına commit edilir:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add docs/
git commit -m "docs: add the modernization decision set and the phase 0 plan"
```

- [ ] **Step 3: `.nvmrc` dosyasını oluştur**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.nvmrc`:

```
24
```

- [ ] **Step 4: `package.json` script, engines ve devDependency alanlarını güncelle**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package.json` dosyasındaki `scripts` bloğunu tamamen aşağıdakiyle değiştir:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "format": "prettier --check .",
    "format:write": "prettier --write ."
  },
```

`scripts` bloğunun hemen ardına `engines` bloğunu ekle:

```json
  "engines": {
    "node": ">=20.9"
  },
```

`devDependencies` bloğuna iki satır ekle (alfabetik sırayı koru: `prettier` `eslint`'ten sonra, `shadcn`'den önce; `vitest` `typescript`'ten sonra):

```json
    "prettier": "^3.9.6",
    "vitest": "^4.1.11"
```

- [ ] **Step 5: Prettier yapılandırmasını oluştur**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.prettierignore`:

```
node_modules
.next
out
build
coverage
package-lock.json
next-env.d.ts
public
docs
.local
.nodeterm
src/app/favicon.ico
```

`docs/` bilinçli olarak hariç tutuluyor: karar dokümanlarındaki tablolar prettier tarafından yeniden sarılırsa spec metni gereksizce değişir.

- [ ] **Step 6: vitest yapılandırmasını oluştur**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/vitest.config.ts`:

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
    include: ["src/**/*.test.ts"],
    watch: false,
  },
});
```

- [ ] **Step 7: Bağımlılıkları kur ve lockfile'ı normalize et**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm install
```

Expected: hata yok; `package-lock.json` npm 11.16.0 ile yeniden yazılır (D9 bulgusundaki `"peer": true` metadata gürültüsü tek seferde çözülür).

- [ ] **Step 8: İlk testi yaz (başarısız olması beklenmiyor, altyapıyı kanıtlıyor)**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("drops falsy class names", () => {
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("lets the last tailwind class win on conflict", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("returns an empty string when nothing is passed", () => {
    expect(cn()).toBe("");
  });
});
```

- [ ] **Step 9: Testi çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npm test
```

Expected: `Test Files  1 passed (1)` ve `Tests  3 passed (3)`, exit code 0.

- [ ] **Step 10: Repoyu bir kez prettier ile normalize et**

Mevcut dosyalar prettier ile biçimlendirilmemiş (örnek: `src/lib/utils.ts:1-2` satırlarında noktalı virgül yok), bu yüzden `--check` ilk çalıştırmada başarısız olur. Önce yaz, sonra doğrula:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run format:write
npm run format
```

Expected: `format:write` değişen dosyaları listeler; `format` çıktısı `All matched files use Prettier code style!`, exit code 0.

- [ ] **Step 11: typecheck ve lint'in hâlâ temiz olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck
npm run lint
```

Expected: iki komut da çıktısız/uyarısız, exit code 0.

- [ ] **Step 12: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add .nvmrc .prettierrc.json .prettierignore vitest.config.ts \
  package.json package-lock.json src/ \
  components.json eslint.config.mjs postcss.config.mjs tsconfig.json \
  next.config.ts README.md
git status --short
git commit -m "chore: add node pin, typecheck/test/format scripts and vitest setup

Pin Node 24 via .nvmrc and require node >=20.9 in engines. Add prettier
and vitest as dev dependencies, wire typecheck, test and format scripts,
and normalize the whole repo with a single prettier pass. package-lock is
regenerated with npm 11.16.0 so the peer metadata drift disappears."
```

---

### Task 2: Bağımlılık yükseltmesi (next 16.3.3, motion 13.1.1)

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package.json` (`next`, `eslint-config-next`, `framer-motion` -> `motion`)
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package-lock.json`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/about/page.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/contact/contact-page-content.tsx:3`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/header.tsx:5`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/language-switcher.tsx:3`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/theme-toggle.tsx:5`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/contact-form.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/featured-projects.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/hero.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-card.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-detail.tsx:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/skills-strip.tsx:3`

**Interfaces:**
- Consumes: Task 1'den `npm run typecheck`, `npm run lint`, `npm test`, `npm run format`.
- Produces: `motion` paketi 13.1.1 (exact pin) ve tek geçerli import yolu `import { motion } from "motion/react";`. Sonraki fazlar (özellikle Faz 3'ün LazyMotion geçişi) `framer-motion` yolunu bir daha kullanmaz.

- [ ] **Step 1: Yükseltmeden önceki durumu kaydet**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm ls next --depth=0
grep -rn "framer-motion" src/ | wc -l
```

Expected: `next@16.1.6`; grep sayısı `11`.

- [ ] **Step 2: `package.json` sürümlerini düzenle**

`dependencies` içinde:
- `"framer-motion": "^12.34.3"` satırını sil.
- `"motion": "13.1.1"` satırını ekle (alfabetik olarak `lucide-react` ile `next` arasına).
- `"next": "16.1.6"` -> `"next": "16.3.3"`.

`devDependencies` içinde:
- `"eslint-config-next": "16.1.6"` -> `"eslint-config-next": "16.3.3"`.

Değişiklik sonrası `dependencies` bloğu tam olarak şöyle olmalı:

```json
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.575.0",
    "motion": "13.1.1",
    "next": "16.3.3",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "resend": "^6.9.2",
    "tailwind-merge": "^3.5.0"
  },
```

- [ ] **Step 3: Kur ve sürümü doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
rm -rf node_modules
npm install
npm ls next motion eslint-config-next --depth=0
```

Expected çıktıda: `next@16.3.3`, `motion@13.1.1`, `eslint-config-next@16.3.3`, ve `framer-motion` hiç görünmüyor.

- [ ] **Step 4: Tüm motion import'larını taşı**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rl 'from "framer-motion"' src/ | xargs sed -i '' 's|from "framer-motion"|from "motion/react"|g'
grep -rn "framer-motion" src/ ; echo "exit=$?"
grep -rn 'from "motion/react"' src/ | wc -l
```

Expected: ilk grep hiçbir satır bulmaz (`exit=1`); ikinci grep `11` döner.

Linux'ta çalışılıyorsa `sed -i ''` yerine `sed -i` kullanılır.

- [ ] **Step 5: Tip, lint, test ve format kapılarını çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck
npm run lint
npm test
npm run format
```

Expected: dördü de exit code 0. `npm run format` bir dosyanın biçiminden şikayet ederse önce `npm run format:write` çalıştırıp tekrar dene.

- [ ] **Step 6: Üretim build'inin çalıştığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
```

Expected: `Compiled successfully`, build hatasız biter. (Bu aşamada `output: standalone` henüz yok, `.next/standalone` beklenmiyor.)

- [ ] **Step 7: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add package.json package-lock.json src/
git commit -m "fix: upgrade next to 16.3.3 and replace framer-motion with motion 13.1.1

next 16.1.6 is behind the July and August 2026 security releases, which
include an unauthenticated RCE through AVIF/libheif decoding and
CVE-2026-44578, a WebSocket upgrade SSRF that only affects self hosted
Node servers. Bump next and eslint-config-next to 16.3.3.

framer-motion is replaced by its successor package motion, pinned to
13.1.1, and every import moves to motion/react."
```

---

### Task 3: `next.config.ts` sertleştirmesi ve edge runtime kaldırma

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/next.config.ts:1-6` (tüm dosya yeniden yazılır)
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/opengraph-image.tsx:3` (satır silinir)

**Interfaces:**
- Consumes: Task 2'den `next@16.3.3`.
- Produces:
  - `next build` çıktısı `.next/standalone/server.js` üretir (Faz 1 Dockerfile'ı bu yola bağlanacak).
  - Her yanıtta şu başlıklar bulunur: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Content-Security-Policy` (aşağıdaki değer).
  - `X-Powered-By` başlığı hiçbir yanıtta yok.
  - `images.remotePatterns` tanımlanmaz; Faz 4'te `next/image` eklenirken bu kural PR review'da korunur.

- [ ] **Step 1: `next.config.ts` dosyasını tamamen yeniden yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/next.config.ts`:

```ts
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// script-src keeps 'unsafe-inline' on purpose. The App Router streams its RSC
// payload through inline script tags, and the nonce based alternative forces
// every route into dynamic rendering, which would break the "only /api/* is
// dynamic" requirement. 'unsafe-eval' and ws: are development only, they are
// needed by React Refresh and the HMR socket.
const scriptSrc = isProduction
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const connectSrc = isProduction ? "connect-src 'self'" : "connect-src 'self' ws:";

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  // Radix and shadcn components emit runtime inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // data: covers the images embedded by the next/og route.
  "img-src 'self' data:",
  "font-src 'self'",
  connectSrc,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// HSTS is deliberately absent here, it is owned by Traefik so there is a
// single source of truth for it.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
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

- [ ] **Step 2: OG image route'undan edge runtime satırını sil**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/opengraph-image.tsx` dosyasının 3. satırındaki

```ts
export const runtime = "edge";
```

satırını sil. Dosyanın ilk altı satırı silme sonrası şöyle olmalı:

```tsx
import { ImageResponse } from "next/og";

export const alt = "Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
```

Gerekçe: uygulama Coolify üzerinde tek bir Node process'i olarak çalışacak, edge runtime kullanılmıyor; satır kalırsa standalone build'de gereksiz bir runtime ayrımı doğuruyor.

- [ ] **Step 3: Build al ve standalone çıktısını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
ls .next/standalone/server.js
```

Expected: build başarılı; `ls` çıktısı `.next/standalone/server.js`.

- [ ] **Step 4: Sunucuyu başlat ve başlıkları curl ile doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run start &
sleep 4
curl -sI http://localhost:3000/ | grep -iE "x-powered-by|x-content-type-options|referrer-policy|permissions-policy|content-security-policy"
```

Expected (satır sırası değişebilir, `x-powered-by` HİÇ görünmemeli):

```
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
```

- [ ] **Step 5: Sayfanın CSP altında gerçekten çalıştığını doğrula**

```bash
curl -s http://localhost:3000/ | grep -c "__next_f"
```

Expected: `0`'dan büyük bir sayı (satır içi RSC payload script'leri HTML'de var). Ardından tarayıcıda `http://localhost:3000/` açılır, DevTools Console'da `Refused to execute inline script` içeren bir CSP ihlali OLMAMALI ve tema değiştirme butonu çalışmalı.

- [ ] **Step 6: Sunucuyu durdur**

```bash
pkill -f "next start" || true; pkill -f "next-server" || true
```

- [ ] **Step 7: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add next.config.ts src/app/opengraph-image.tsx
git commit -m "feat: harden next config with standalone output and security headers

Enable output: 'standalone' so the Docker image in phase 1 can ship the
minimal server bundle, turn off the X-Powered-By header and send
nosniff, Referrer-Policy, Permissions-Policy and a Content-Security-Policy
on every response. HSTS stays out of the app layer, Traefik owns it.

Drop the edge runtime export from the opengraph image route, the app runs
as a single Node process."
```

---

### Task 4: Env katmanı (`src/lib/env.ts`) ve `example.com` fallback'lerinin kaldırılması

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/env.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/env.test.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/robots.ts:9`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/sitemap.ts:4`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.env.example` (tüm dosya yeniden yazılır)

**Interfaces:**
- Consumes: Task 1'den vitest kurulumu.
- Produces (Task 8 bu imzaları birebir kullanır):
  - `DEV_FALLBACK_EMAIL: "onboarding@resend.dev"`
  - `resolveSiteUrl(value: string | undefined): string` (boşsa `Error` fırlatır, sondaki `/` karakterlerini kırpar)
  - `resolveRequiredEmail(name: "CONTACT_EMAIL" | "FROM_EMAIL", value: string | undefined, isProduction: boolean): string`
  - `resolveTrustCloudflare(value: string | undefined): boolean`
  - `siteUrl(): string`
  - `contactEmail(): string`
  - `fromEmail(): string`
  - `trustsCloudflareHeaders(): boolean`
- Yeni env değişkeni: `TRUST_CF_CONNECTING_IP` (Runtime, varsayılan kapalı). Faz 1'de Traefik'te `forwardedHeaders.trustedIPs` Cloudflare listesiyle set edildikten SONRA Coolify'da `"true"` yapılır.

- [ ] **Step 1: Başarısız testi yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  DEV_FALLBACK_EMAIL,
  resolveRequiredEmail,
  resolveSiteUrl,
  resolveTrustCloudflare,
} from "./env";

describe("resolveSiteUrl", () => {
  it("returns the value untouched when it has no trailing slash", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.sh")).toBe(
      "https://dogancanyildiz.sh"
    );
  });

  it("strips trailing slashes so joined paths never double up", () => {
    expect(resolveSiteUrl("https://dogancanyildiz.sh//")).toBe(
      "https://dogancanyildiz.sh"
    );
  });

  it("throws when the variable is missing", () => {
    expect(() => resolveSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("throws when the variable is blank", () => {
    expect(() => resolveSiteUrl("   ")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});

describe("resolveRequiredEmail", () => {
  it("returns the trimmed value when it is set", () => {
    expect(
      resolveRequiredEmail("CONTACT_EMAIL", " me@dogancanyildiz.com ", true)
    ).toBe("me@dogancanyildiz.com");
  });

  it("throws in production when the value is missing", () => {
    expect(() => resolveRequiredEmail("FROM_EMAIL", undefined, true)).toThrow(
      /FROM_EMAIL/
    );
  });

  it("falls back to the resend sandbox address outside production", () => {
    expect(resolveRequiredEmail("CONTACT_EMAIL", undefined, false)).toBe(
      DEV_FALLBACK_EMAIL
    );
  });
});

describe("resolveTrustCloudflare", () => {
  it("is enabled only for the literal string true", () => {
    expect(resolveTrustCloudflare("true")).toBe(true);
    expect(resolveTrustCloudflare("TRUE")).toBe(true);
  });

  it("is disabled for anything else", () => {
    expect(resolveTrustCloudflare(undefined)).toBe(false);
    expect(resolveTrustCloudflare("false")).toBe(false);
    expect(resolveTrustCloudflare("1")).toBe(false);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/env.test.ts
```

Expected: FAIL, `Failed to resolve import "./env"` benzeri bir hata.

- [ ] **Step 3: `src/lib/env.ts` dosyasını yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/env.ts`:

```ts
/**
 * Environment access for the portfolio.
 *
 * NEXT_PUBLIC_SITE_URL is a build time variable, it is inlined into the client
 * bundle by next build. RESEND_API_KEY, CONTACT_EMAIL, FROM_EMAIL and
 * TRUST_CF_CONNECTING_IP are runtime only, they must never be exposed to the
 * client bundle or to build logs.
 *
 * The resolve* functions are pure so they can be unit tested without touching
 * process.env. The exported readers are thin wrappers around them and must be
 * called inside a request handler or a metadata function, never at module
 * scope of a route, otherwise they run during next build.
 */

export const DEV_FALLBACK_EMAIL = "onboarding@resend.dev";

export function resolveSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set. It is a required build time variable, set it in .env.local for local builds and as a Build variable in Coolify."
    );
  }
  return trimmed.replace(/\/+$/, "");
}

export function resolveRequiredEmail(
  name: "CONTACT_EMAIL" | "FROM_EMAIL",
  value: string | undefined,
  isProduction: boolean
): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed) {
    return trimmed;
  }
  if (isProduction) {
    throw new Error(
      `${name} is not set. It is required in production, the silent onboarding@resend.dev fallback is development only.`
    );
  }
  return DEV_FALLBACK_EMAIL;
}

export function resolveTrustCloudflare(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function siteUrl(): string {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function contactEmail(): string {
  return resolveRequiredEmail(
    "CONTACT_EMAIL",
    process.env.CONTACT_EMAIL,
    process.env.NODE_ENV === "production"
  );
}

export function fromEmail(): string {
  return resolveRequiredEmail(
    "FROM_EMAIL",
    process.env.FROM_EMAIL,
    process.env.NODE_ENV === "production"
  );
}

export function trustsCloudflareHeaders(): boolean {
  return resolveTrustCloudflare(process.env.TRUST_CF_CONNECTING_IP);
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/env.test.ts
```

Expected: `Tests  9 passed (9)`, exit code 0.

- [ ] **Step 5: `robots.ts` dosyasını güncelle**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/robots.ts` dosyasını tamamen aşağıdakiyle değiştir:

```ts
import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: `sitemap.ts` dosyasını güncelle**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/sitemap.ts` dosyasını tamamen aşağıdakiyle değiştir:

```ts
import type { MetadataRoute } from "next";

import { projects } from "@/data/projects";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteUrl();
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      priority: 1,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      priority: 0.8,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/projects`,
      lastModified,
      priority: 0.9,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      priority: 0.6,
      changeFrequency: "yearly",
    },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...projectPages];
}
```

`@/data/projects` içindeki şablon projeler Faz 4'te gerçek Velite içeriğiyle değişecek; slug türetme mantığı o zaman da aynı kalıyor, bu yüzden burada dokunulmuyor.

- [ ] **Step 7: `.env.example` dosyasını yeniden yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.env.example`:

```
# Coolify layer: Build
# Required. next build fails if it is missing, robots.ts and sitemap.ts read it.
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh

# Coolify layer: Runtime only
# Resend API key for the contact form. Get one at https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxx

# Coolify layer: Runtime only
# Inbox that receives contact form messages. Required in production.
CONTACT_EMAIL=me@dogancanyildiz.com

# Coolify layer: Runtime only
# Sender address, must live on a domain verified in Resend. Required in
# production. Outside production it falls back to onboarding@resend.dev.
FROM_EMAIL=contact@dogancanyildiz.sh

# Coolify layer: Runtime only
# Set to "true" only once Traefik trusts the Cloudflare ranges through
# forwardedHeaders.trustedIPs. Until then the rate limiter reads the first
# x-forwarded-for value instead of CF-Connecting-IP.
TRUST_CF_CONNECTING_IP=false
```

- [ ] **Step 8: Yerel `.env.local` dosyasını hazırla (commit edilmez)**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
printf 'NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh\n' >> .env.local
git check-ignore -v .env.local
```

Expected: `git check-ignore` çıktısı `.gitignore:...:.env.*	.env.local` benzeri bir satır döndürür, yani dosya ignore ediliyor.

- [ ] **Step 9: Env eksikken build'in gerçekten patladığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
mv .env.local .env.local.bak
npm run build; echo "exit=$?"
mv .env.local.bak .env.local
```

Expected: build başarısız, çıktıda `NEXT_PUBLIC_SITE_URL is not set` mesajı var, `exit=1`. Bu davranış bilinçli: sessiz `example.com` fallback'i yerine gürültülü hata.

- [ ] **Step 10: Env varken build'in geçtiğini doğrula ve sitemap çıktısına bak**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
npm run start &
sleep 4
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml | head -5
pkill -f "next start" || true; pkill -f "next-server" || true
```

Expected: `robots.txt` içinde `Sitemap: https://dogancanyildiz.sh/sitemap.xml`; `sitemap.xml` içinde `<loc>https://dogancanyildiz.sh</loc>`; hiçbir yerde `example.com` yok.

- [ ] **Step 11: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add src/lib/env.ts src/lib/env.test.ts src/app/robots.ts src/app/sitemap.ts .env.example
git commit -m "feat: add env module and fail the build when the site url is missing

robots.ts and sitemap.ts silently fell back to https://example.com, which
would have indexed a wrong host. NEXT_PUBLIC_SITE_URL is now required and
the build throws when it is missing.

CONTACT_EMAIL and FROM_EMAIL are required in production, the
onboarding@resend.dev fallback is limited to development. .env.example
documents which Coolify layer each variable belongs to."
```

---

### Task 5: Gerçek ziyaretçi IP'sinin çözümlenmesi (`src/lib/client-ip.ts`)

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/client-ip.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/client-ip.test.ts`

**Interfaces:**
- Consumes: Task 4'ten `trustsCloudflareHeaders(): boolean` (yalnızca çağıran taraf olan Task 8'de birleşiyor, bu modül saf kalıyor).
- Produces (Task 8 bu imzaları birebir kullanır):
  - `UNKNOWN_IP: "unknown"`
  - `isIpAddress(value: string): boolean`
  - `type ClientIpOptions = { trustCloudflare: boolean }`
  - `getClientIp(headers: Headers, options: ClientIpOptions): string`

- [ ] **Step 1: Başarısız testi yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/client-ip.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { UNKNOWN_IP, getClientIp, isIpAddress } from "./client-ip";

function headersOf(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("isIpAddress", () => {
  it("accepts ipv4", () => {
    expect(isIpAddress("203.0.113.9")).toBe(true);
  });

  it("accepts ipv6", () => {
    expect(isIpAddress("2001:db8::1")).toBe(true);
  });

  it("rejects octets above 255", () => {
    expect(isIpAddress("999.0.0.1")).toBe(false);
  });

  it("rejects arbitrary text", () => {
    expect(isIpAddress("not-an-ip")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses CF-Connecting-IP when cloudflare is trusted", () => {
    const headers = headersOf({
      "cf-connecting-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.4, 10.0.0.1",
    });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe("203.0.113.9");
  });

  it("ignores CF-Connecting-IP when cloudflare is not trusted", () => {
    const headers = headersOf({
      "cf-connecting-ip": "203.0.113.9",
      "x-forwarded-for": "198.51.100.4, 10.0.0.1",
    });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe(
      "198.51.100.4"
    );
  });

  it("takes the first x-forwarded-for entry", () => {
    const headers = headersOf({
      "x-forwarded-for": " 198.51.100.4 , 10.0.0.1 ",
    });
    expect(getClientIp(headers, { trustCloudflare: false })).toBe(
      "198.51.100.4"
    );
  });

  it("falls back to x-forwarded-for when a spoofed CF header is not an ip", () => {
    const headers = headersOf({
      "cf-connecting-ip": "not-an-ip",
      "x-forwarded-for": "198.51.100.4",
    });
    expect(getClientIp(headers, { trustCloudflare: true })).toBe("198.51.100.4");
  });

  it("returns the unknown bucket when no usable header is present", () => {
    expect(getClientIp(headersOf({}), { trustCloudflare: true })).toBe(
      UNKNOWN_IP
    );
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/client-ip.test.ts
```

Expected: FAIL, `Failed to resolve import "./client-ip"`.

- [ ] **Step 3: `src/lib/client-ip.ts` dosyasını yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/client-ip.ts`:

```ts
/**
 * Resolves the real visitor IP for rate limiting.
 *
 * CF-Connecting-IP is a plain HTTP header, a client can forge it. It is only
 * trustworthy when the request provably came from a Cloudflare range, which is
 * enforced one layer down by Traefik forwardedHeaders.trustedIPs. The caller
 * passes that decision in through trustCloudflare, this module never guesses.
 */

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,7}$/i;

export const UNKNOWN_IP = "unknown";

export function isIpAddress(value: string): boolean {
  if (!value) {
    return false;
  }
  if (IPV4.test(value)) {
    return true;
  }
  return value.includes(":") && IPV6.test(value);
}

export type ClientIpOptions = {
  trustCloudflare: boolean;
};

export function getClientIp(
  headers: Headers,
  options: ClientIpOptions
): string {
  if (options.trustCloudflare) {
    const cloudflareIp = headers.get("cf-connecting-ip")?.trim() ?? "";
    if (isIpAddress(cloudflareIp)) {
      return cloudflareIp;
    }
  }

  const forwarded = headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim() ?? "";
  if (isIpAddress(first)) {
    return first;
  }

  return UNKNOWN_IP;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/client-ip.test.ts
```

Expected: `Tests  9 passed (9)`, exit code 0.

- [ ] **Step 5: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add src/lib/client-ip.ts src/lib/client-ip.test.ts
git commit -m "feat: resolve the real visitor ip from proxy headers

CF-Connecting-IP is only read when the caller says Cloudflare is trusted,
otherwise the first x-forwarded-for entry wins. Anything that does not
parse as an IP lands in a single unknown bucket so a forged header cannot
create endless rate limit keys."
```

---

### Task 6: In-memory sliding window rate limit (`src/lib/rate-limit.ts`)

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/rate-limit.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/rate-limit.test.ts`

**Interfaces:**
- Consumes: Task 1'den vitest kurulumu.
- Produces (Task 8 bu imzaları birebir kullanır):
  - `type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number }`
  - `type RateLimiterOptions = { limit: number; windowMs: number; maxKeys?: number }`
  - `type RateLimiter = { check(key: string, now?: number): RateLimitResult; reset(): void }`
  - `createRateLimiter(options: RateLimiterOptions): RateLimiter`
  - `CONTACT_RATE_LIMIT = { limit: 5, windowMs: 600_000 }`
  - `contactRateLimiter: RateLimiter` (process içi tekil örnek)

Tasarım notu: Coolify'da tek container, tek Node process çalışıyor, bu yüzden Redis gerekmiyor. Container yeniden başladığında pencere sıfırlanır, bu bilinçli kabul edilen bir risk. Dış katman olarak `/api/contact` üzerinde Cloudflare Rate Limiting kuralı Faz 1'de ayrıca tanımlanacak.

- [ ] **Step 1: Başarısız testi yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/rate-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { CONTACT_RATE_LIMIT, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 100).allowed).toBe(true);
    expect(limiter.check("a", 200).allowed).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("a", 100);
    limiter.check("a", 200);
    const blocked = limiter.check("a", 300);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports a retry-after that covers the oldest hit in the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("a", 0);
    const blocked = limiter.check("a", 1000);
    expect(blocked.retryAfterSeconds).toBe(9);
  });

  it("never reports a retry-after below one second", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    const blocked = limiter.check("a", 999);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("lets the window slide", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.check("a", 100);
    expect(limiter.check("a", 500).allowed).toBe(false);
    expect(limiter.check("a", 1101).allowed).toBe(true);
  });

  it("counts down the remaining budget", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limiter.check("a", 0).remaining).toBe(2);
    expect(limiter.check("a", 1).remaining).toBe(1);
    expect(limiter.check("a", 2).remaining).toBe(0);
  });

  it("keeps separate keys independent", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
  });

  it("forgets everything after reset", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    limiter.check("a", 0);
    limiter.reset();
    expect(limiter.check("a", 1).allowed).toBe(true);
  });

  it("prunes stale keys once the key budget is exceeded", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0);
    // "a" and "b" are outside the window by now, so the fourth key is still
    // allowed and the map does not grow without bound.
    expect(limiter.check("d", 5000).allowed).toBe(true);
    expect(limiter.check("a", 5000).allowed).toBe(true);
  });
});

describe("CONTACT_RATE_LIMIT", () => {
  it("allows five submissions per ten minutes", () => {
    expect(CONTACT_RATE_LIMIT.limit).toBe(5);
    expect(CONTACT_RATE_LIMIT.windowMs).toBe(600_000);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/rate-limit.test.ts
```

Expected: FAIL, `Failed to resolve import "./rate-limit"`.

- [ ] **Step 3: `src/lib/rate-limit.ts` dosyasını yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/rate-limit.ts`:

```ts
/**
 * In-memory sliding window rate limiter.
 *
 * The app runs as a single Node process inside a single Coolify container, so
 * a process local Map is consistent. State is lost on restart, which is an
 * accepted trade off. Cloudflare Rate Limiting sits in front of /api/contact
 * as the outer layer.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
};

export type RateLimiter = {
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
};

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const hits = new Map<string, number[]>();

  function prune(now: number): void {
    for (const [key, stamps] of hits) {
      const fresh = stamps.filter((stamp) => now - stamp < windowMs);
      if (fresh.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, fresh);
      }
    }
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      if (hits.size >= maxKeys) {
        prune(now);
      }

      const stamps = (hits.get(key) ?? []).filter(
        (stamp) => now - stamp < windowMs
      );

      if (stamps.length >= limit) {
        hits.set(key, stamps);
        const oldest = stamps[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((oldest + windowMs - now) / 1000)
          ),
        };
      }

      stamps.push(now);
      hits.set(key, stamps);
      return {
        allowed: true,
        remaining: limit - stamps.length,
        retryAfterSeconds: 0,
      };
    },
    reset(): void {
      hits.clear();
    },
  };
}

export const CONTACT_RATE_LIMIT = {
  limit: 5,
  windowMs: 600_000,
} as const;

// next dev re-evaluates modules on hot reload, a global handle keeps a single
// limiter alive across those reloads so the dev behaviour matches production.
const globalForRateLimit = globalThis as unknown as {
  contactRateLimiter?: RateLimiter;
};

export const contactRateLimiter: RateLimiter =
  globalForRateLimit.contactRateLimiter ??
  createRateLimiter({
    limit: CONTACT_RATE_LIMIT.limit,
    windowMs: CONTACT_RATE_LIMIT.windowMs,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.contactRateLimiter = contactRateLimiter;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/rate-limit.test.ts
```

Expected: `Tests  10 passed (10)`, exit code 0.

- [ ] **Step 5: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add src/lib/rate-limit.ts src/lib/rate-limit.test.ts
git commit -m "feat: add an in-memory sliding window rate limiter

The contact endpoint had no abuse protection at all. A process local Map
is enough here because the app runs as one Node process in one container,
Cloudflare Rate Limiting covers the outer layer. Keys are pruned once the
key budget is reached so a forged header cannot grow the map without
bound."
```

---

### Task 7: Contact gövde doğrulaması (`src/lib/contact-validation.ts`)

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/contact-validation.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/contact-validation.test.ts`

**Interfaces:**
- Consumes: Task 1'den vitest kurulumu.
- Produces (Task 8 bu imzaları birebir kullanır):
  - `MAX_NAME_LENGTH = 100`, `MAX_EMAIL_LENGTH = 200`, `MAX_SUBJECT_LENGTH = 200`, `MAX_MESSAGE_LENGTH = 5000`, `MAX_BODY_BYTES = 16384`
  - `type ContactPayload = { name: string; email: string; subject?: string; message: string }`
  - `type ValidationResult = { ok: true; data: ContactPayload } | { ok: false; reason: "invalid" | "honeypot" }`
  - `validateBody(body: unknown): ValidationResult`

Mevcut `route.ts:7-31` içindeki `validateBody` bu modüle taşınıyor; tip kontrolü + trim yapısı korunuyor, üstüne honeypot, email regex ve uzunluk sınırları geliyor. İmza değişiyor: eskiden `T | null` dönüyordu, artık ayrımlı birleşim (discriminated union) dönüyor, çünkü çağıran taraf honeypot ile diğer geçersizliği ayırt edip loglayabilmeli.

- [ ] **Step 1: Başarısız testi yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/contact-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  MAX_EMAIL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SUBJECT_LENGTH,
  validateBody,
} from "./contact-validation";

const validBody = {
  name: "Doğan Can",
  email: "visitor@mail.invalid",
  subject: "Hello",
  message: "I would like to talk about a project.",
};

describe("validateBody", () => {
  it("accepts a well formed body and trims every field", () => {
    const result = validateBody({
      name: "  Doğan Can  ",
      email: "  visitor@mail.invalid ",
      subject: "  Hello  ",
      message: "  I would like to talk about a project.  ",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Doğan Can",
        email: "visitor@mail.invalid",
        subject: "Hello",
        message: "I would like to talk about a project.",
      },
    });
  });

  it("treats a missing subject as absent instead of empty", () => {
    const result = validateBody({
      name: validBody.name,
      email: validBody.email,
      message: validBody.message,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: validBody.name,
        email: validBody.email,
        message: validBody.message,
      },
    });
  });

  it("rejects a filled honeypot field with its own reason", () => {
    const result = validateBody({ ...validBody, website: "http://spam.invalid" });
    expect(result).toEqual({ ok: false, reason: "honeypot" });
  });

  it("ignores an empty honeypot field", () => {
    const result = validateBody({ ...validBody, website: "   " });
    expect(result.ok).toBe(true);
  });

  it("rejects a non object body", () => {
    expect(validateBody(null)).toEqual({ ok: false, reason: "invalid" });
    expect(validateBody("hello")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects missing required fields", () => {
    expect(validateBody({ name: "a", email: "a@b.co" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects whitespace only fields", () => {
    expect(validateBody({ ...validBody, message: "   " })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an address without a dotted domain", () => {
    expect(validateBody({ ...validBody, email: "visitor@localhost" })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an address with a space in it", () => {
    expect(validateBody({ ...validBody, email: "vis itor@mail.invalid" })).toEqual(
      { ok: false, reason: "invalid" }
    );
  });

  it("rejects an over long name", () => {
    expect(
      validateBody({ ...validBody, name: "n".repeat(MAX_NAME_LENGTH + 1) })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long email", () => {
    const longLocal = "e".repeat(MAX_EMAIL_LENGTH);
    expect(
      validateBody({ ...validBody, email: `${longLocal}@mail.invalid` })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long subject", () => {
    expect(
      validateBody({ ...validBody, subject: "s".repeat(MAX_SUBJECT_LENGTH + 1) })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an over long message", () => {
    expect(
      validateBody({ ...validBody, message: "m".repeat(MAX_MESSAGE_LENGTH + 1) })
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("accepts a message that sits exactly on the limit", () => {
    const result = validateBody({
      ...validBody,
      message: "m".repeat(MAX_MESSAGE_LENGTH),
    });
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/contact-validation.test.ts
```

Expected: FAIL, `Failed to resolve import "./contact-validation"`.

- [ ] **Step 3: `src/lib/contact-validation.ts` dosyasını yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/contact-validation.ts`:

```ts
/**
 * Server side validation for the contact endpoint.
 *
 * The honeypot field lives in the form as a visually hidden input. The client
 * short circuits when it is filled, but a bot posting straight to the route
 * skips that path, so the field is checked here as well.
 */

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 200;
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 5000;

/** Upper bound for the raw request body, checked through Content-Length. */
export const MAX_BODY_BYTES = 16384;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; data: ContactPayload }
  | { ok: false; reason: "invalid" | "honeypot" };

const invalid: ValidationResult = { ok: false, reason: "invalid" };
const honeypot: ValidationResult = { ok: false, reason: "honeypot" };

export function validateBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return invalid;
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.website === "string" && raw.website.trim().length > 0) {
    return honeypot;
  }

  if (
    typeof raw.name !== "string" ||
    typeof raw.email !== "string" ||
    typeof raw.message !== "string"
  ) {
    return invalid;
  }

  const name = raw.name.trim();
  const email = raw.email.trim();
  const message = raw.message.trim();
  const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";

  if (!name || name.length > MAX_NAME_LENGTH) {
    return invalid;
  }
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    return invalid;
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return invalid;
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return invalid;
  }

  const data: ContactPayload = { name, email, message };
  if (subject) {
    data.subject = subject;
  }

  return { ok: true, data };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio && npx vitest run src/lib/contact-validation.test.ts
```

Expected: `Tests  14 passed (14)`, exit code 0.

- [ ] **Step 5: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add src/lib/contact-validation.ts src/lib/contact-validation.test.ts
git commit -m "feat: add server side contact validation with honeypot and limits

Moves validateBody out of the route handler so it can be unit tested
without pulling in next/server. On top of the existing type and trim
checks it now enforces an email pattern, per field length caps and the
honeypot field the client used to check on its own."
```

---

### Task 8: Contact route'unun sertleştirilmesi

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/api/contact/route.ts:1-71` (tüm dosya yeniden yazılır)

**Interfaces:**
- Consumes:
  - `src/lib/env.ts`: `contactEmail(): string`, `fromEmail(): string`, `trustsCloudflareHeaders(): boolean`
  - `src/lib/client-ip.ts`: `getClientIp(headers: Headers, options: { trustCloudflare: boolean }): string`
  - `src/lib/rate-limit.ts`: `contactRateLimiter: { check(key: string, now?: number): { allowed: boolean; remaining: number; retryAfterSeconds: number }; reset(): void }`
  - `src/lib/contact-validation.ts`: `validateBody(body: unknown): ValidationResult`, `MAX_BODY_BYTES: number`
  - `src/lib/resend.ts`: `resend: Resend | null` (mevcut, değişmiyor)
- Produces: `POST /api/contact` sözleşmesi
  - `200 { ok: true }` gönderim başarılı
  - `400 { error: string }` geçersiz gövde veya dolu honeypot
  - `413 { error: string }` Content-Length sınırı aşıldı
  - `429 { error: string }` + `Retry-After` başlığı, rate limit
  - `503 { error: string }` e-posta yapılandırması eksik (RESEND_API_KEY yok veya prod'da CONTACT_EMAIL/FROM_EMAIL yok)
  - `500 { error: string }` Resend hatası, mesaj jenerik, detay yalnızca sunucu logunda

Not: `src/components/sections/contact-form.tsx` bu task'ta DEĞİŞMİYOR. Client'ın honeypot dolduğunda erken çıkması iyi bir UX kalıbı ve tasarım değişmiyor; eklenen şey yalnızca sunucu tarafı kontrolü.

- [ ] **Step 1: Route handler'ı tamamen yeniden yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/api/contact/route.ts`:

```ts
import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/client-ip";
import { MAX_BODY_BYTES, validateBody } from "@/lib/contact-validation";
import { contactEmail, fromEmail, trustsCloudflareHeaders } from "@/lib/env";
import { contactRateLimiter } from "@/lib/rate-limit";
import { resend } from "@/lib/resend";

// Client facing copy stays generic on purpose. Provider details, env problems
// and honeypot hits are written to the server log only.
const INVALID_MESSAGE =
  "Invalid request. A name, a valid email address and a message are required.";
const TOO_LARGE_MESSAGE = "Request body is too large.";
const TOO_MANY_MESSAGE = "Too many requests. Please try again later.";
const GENERIC_MESSAGE = "Message could not be sent. Please try again later.";

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const ip = getClientIp(request.headers, {
    trustCloudflare: trustsCloudflareHeaders(),
  });
  const limit = contactRateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: TOO_MANY_MESSAGE },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const parsed = validateBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    if (parsed.reason === "honeypot") {
      console.warn("[contact] honeypot triggered");
    }
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  if (!resend) {
    console.error("[contact] RESEND_API_KEY is not configured");
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 503 });
  }

  let to: string;
  let from: string;
  try {
    to = contactEmail();
    from = fromEmail();
  } catch (configError) {
    console.error("[contact] email configuration error", configError);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 503 });
  }

  const subject =
    parsed.data.subject || `Portfolio contact from ${parsed.data.name}`;
  const text = [
    `From: ${parsed.data.name} <${parsed.data.email}>`,
    "",
    parsed.data.message,
  ].join("\n");

  const { error } = await resend.emails.send({ from, to, subject, text });

  if (error) {
    console.error("[contact] resend rejected the message", error);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Tip ve lint kapılarını çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint
```

Expected: iki komut da exit code 0.

- [ ] **Step 3: Build al ve sunucuyu başlat**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
RESEND_API_KEY= npm run start &
sleep 4
```

`RESEND_API_KEY` bilinçli olarak boş bırakılıyor: bu senaryoda `resend` `null` olur ve doğrulama katmanının Resend'e hiç ulaşmadan çalıştığını görebiliriz.

- [ ] **Step 4: Honeypot'un sunucu tarafında çalıştığını doğrula**

```bash
curl -s -o /dev/stdout -w "\nHTTP %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@mail.invalid","message":"buy things","website":"http://spam.invalid"}'
```

Expected:

```
{"error":"Invalid request. A name, a valid email address and a message are required."}
HTTP 400
```

Sunucu logunda `[contact] honeypot triggered` satırı görünür.

- [ ] **Step 5: Email regex ve uzunluk sınırlarını doğrula**

```bash
curl -s -o /dev/null -w "invalid email  -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Visitor","email":"visitor@localhost","message":"hello"}'

curl -s -o /dev/null -w "long message   -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Visitor\",\"email\":\"visitor@mail.invalid\",\"message\":\"$(printf 'm%.0s' $(seq 1 5001))\"}"

curl -s -o /dev/null -w "oversized body -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Visitor\",\"email\":\"visitor@mail.invalid\",\"message\":\"$(printf 'm%.0s' $(seq 1 20000))\"}"
```

Expected:

```
invalid email  -> 400
long message   -> 400
oversized body -> 413
```

- [ ] **Step 6: Rate limit'in devreye girdiğini doğrula**

Not: önceki adımlarda 3 istek harcandı, limit 10 dakikada 5. Sunucuyu yeniden başlatıp temiz sayaçla test et:

```bash
pkill -f "next start" || true; pkill -f "next-server" || true
RESEND_API_KEY= npm run start &
sleep 4
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "request $i -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Visitor","email":"visitor@mail.invalid","message":"hello"}'
done
curl -sI -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d '{}' | grep -i retry-after
```

Expected:

```
request 1 -> 503
request 2 -> 503
request 3 -> 503
request 4 -> 503
request 5 -> 503
request 6 -> 429
retry-after: <1 ile 600 arasında bir sayı>
```

İlk beş isteğin `503` dönmesi doğru: gövde geçerli, honeypot boş, ama `RESEND_API_KEY` bilinçli olarak boş bırakıldı. Altıncı istek gövdeye hiç bakılmadan `429` ile kesiliyor, yani limit doğrulamadan önce uygulanıyor.

- [ ] **Step 7: Resend hata mesajının artık sızmadığını doğrula**

```bash
pkill -f "next start" || true; pkill -f "next-server" || true
RESEND_API_KEY=re_invalid_key_for_testing CONTACT_EMAIL=me@dogancanyildiz.com FROM_EMAIL=contact@dogancanyildiz.sh npm run start &
sleep 4
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Visitor","email":"visitor@mail.invalid","message":"hello"}'
echo
pkill -f "next start" || true; pkill -f "next-server" || true
```

Expected: `{"error":"Message could not be sent. Please try again later."}` (Resend'in kendi hata metni yanıtta GÖRÜNMEMELİ). Sunucu logunda `[contact] resend rejected the message` satırı ve ham hata nesnesi görünür.

- [ ] **Step 8: Testler ve format, sonra commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm test && npm run format
git add src/app/api/contact/route.ts
git commit -m "fix: harden the contact endpoint against abuse and error leaks

The route had no rate limit, never read the honeypot field and returned
the raw Resend error message to the client. It now checks Content-Length,
rate limits per resolved visitor ip, validates the body server side and
returns a generic message on every failure while the details go to the
server log. Missing CONTACT_EMAIL or FROM_EMAIL in production is a 503
instead of a silent fallback to the Resend sandbox address."
```

---

### Task 9: `/api/health` liveness endpoint'i

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/api/health/route.ts`

**Interfaces:**
- Consumes: yok (dış bağımlılığı olmayan, bilinçli olarak yalın bir endpoint).
- Produces: `GET /api/health` -> `200 { status: "ok", uptime: number, timestamp: string }`, `Cache-Control: no-store`. Faz 1'de Coolify sağlık kontrolü bu yola bağlanır, Faz 5'te Gatus bu yolu izler.

Güvenlik notu: yanıt hostname, port, sürüm, commit SHA veya env değeri içermez. Bu endpoint kimlik doğrulaması olmadan açık, bu yüzden içeriği bilinçli olarak topolojiden arındırılmış tutuluyor.

- [ ] **Step 1: Route dosyasını yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";

// Never prerendered, never cached: a cached 200 would keep reporting healthy
// after the process stopped answering.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
```

- [ ] **Step 2: Build al ve endpoint'i doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
npm run start &
sleep 4
curl -s -o /dev/stdout -w "\nHTTP %{http_code}\n" http://localhost:3000/api/health
curl -sI http://localhost:3000/api/health | grep -i cache-control
pkill -f "next start" || true; pkill -f "next-server" || true
```

Expected:

```
{"status":"ok","uptime":4,"timestamp":"2026-08-27T..."}
HTTP 200
cache-control: no-store
```

- [ ] **Step 3: Build çıktısında route'un dynamic işaretlendiğini doğrula**

`npm run build` çıktısındaki route tablosunda `/api/health` satırı `ƒ` (Dynamic) işaretiyle görünmeli. Statik (`○`) işaretlenirse `export const dynamic = "force-dynamic";` satırı eksik demektir.

- [ ] **Step 4: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add src/app/api/health/route.ts
git commit -m "feat: add a liveness endpoint for the container health check

Coolify needs a cheap endpoint to decide whether the container is alive.
The payload is deliberately topology free, it carries no hostname, port,
version or env value because the route is public and unauthenticated."
```

---

### Task 10: Ölü dosya temizliği, README ve Renovate

**Files:**
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/file.svg`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/globe.svg`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/next.svg`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/vercel.svg`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/window.svg`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/.gitkeep`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/README.md:1-36` (tüm dosya yeniden yazılır)
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/renovate.json`

**Interfaces:**
- Consumes: Task 1'den npm script adları (README bunları belgeliyor), Task 4'ten `.env.example` değişken listesi.
- Produces: `renovate.json` sözleşmesi: patch ve minor otomatik merge, major manuel review, `velite` her zaman manuel, güvenlik uyarıları otomatik merge. Renovate GitHub App kurulumu Faz 5'te yapılır, config bu fazda repoda hazır bekler.

- [ ] **Step 1: SVG'lerin gerçekten referanssız olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rn "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src/ README.md; echo "exit=$?"
```

Expected: hiçbir satır bulunmaz, `exit=1`. Bir eşleşme çıkarsa o dosya silinmez, önce referans temizlenir.

- [ ] **Step 2: SVG'leri sil**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
touch public/.gitkeep
git add public/.gitkeep
ls public/
git ls-files public/
```

Expected: `ls public/` çıktısı boş; `git ls-files public/` yalnızca `public/.gitkeep` gösterir.

`.gitkeep` bilinçli: git boş dizinleri takip etmiyor, ama Faz 1'in Dockerfile'ı `COPY --from=builder /app/public ./public` yapacak ve dizin hiç yoksa build kırılır. Faz 4'te CV PDF'i ve proje ekran görüntüleri bu dizine gelecek.

- [ ] **Step 3: README'yi yeniden yaz**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/README.md`:

````markdown
# dogancanyildiz.sh

Personal portfolio of Doğan Can Yıldız, a full stack web developer and DevOps
engineer. The site is a Next.js App Router application that is self hosted on a
Coolify managed server behind Traefik and Cloudflare, without Vercel.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.3.3, App Router, `output: 'standalone'` |
| UI | React 19.2, Tailwind CSS 4, shadcn/ui, motion 13 |
| Email | Resend, through `/api/contact` |
| Runtime | Node 24, single container |
| Hosting | Docker image built by Coolify, Traefik in front, Cloudflare proxied |

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

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build, writes `.next/standalone` |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint with the Next.js config |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest, node environment, `src/**/*.test.ts` |
| `npm run format` | Prettier in check mode |
| `npm run format:write` | Prettier in write mode |

## Environment variables

Every variable is documented in `.env.example`. The split between Coolify build
and runtime variables is not cosmetic, getting it wrong fails silently in both
directions.

| Variable | Coolify layer | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Build | Yes | Inlined into the client bundle by `next build`. Marking it runtime leaves it undefined in production. |
| `RESEND_API_KEY` | Runtime | Yes in production | Build variables can leak into image layers and build logs. |
| `CONTACT_EMAIL` | Runtime | Yes in production | Inbox that receives form messages. |
| `FROM_EMAIL` | Runtime | Yes in production | Must live on a domain verified in Resend. |
| `TRUST_CF_CONNECTING_IP` | Runtime | No | Set to `true` only after Traefik trusts the Cloudflare ranges. |

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

The `Dockerfile`, `.dockerignore` and the GitHub Actions gate are added in phase
1 of the modernization plan, see `docs/10-yol-haritasi.md`.

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
````

- [ ] **Step 4: `renovate.json` dosyasını oluştur**

`/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":dependencyDashboard",
    ":semanticCommits"
  ],
  "timezone": "Europe/Istanbul",
  "schedule": ["before 6am on monday"],
  "labels": ["dependencies"],
  "minimumReleaseAge": "3 days",
  "packageRules": [
    {
      "description": "Patch and minor updates merge on their own once CI is green",
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true,
      "automergeType": "pr",
      "platformAutomerge": true
    },
    {
      "description": "Majors always need a human, next 17 must not land unreviewed",
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "addLabels": ["major-review"]
    },
    {
      "description": "velite is pinned exactly because it is still 0.x",
      "matchPackageNames": ["velite"],
      "rangeStrategy": "pin",
      "automerge": false,
      "addLabels": ["major-review"]
    },
    {
      "description": "engines.node is a deliberate floor, not a dependency",
      "matchDepTypes": ["engines"],
      "enabled": false
    }
  ],
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 6am on the first day of the month"],
    "automerge": true
  },
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "automerge": true,
    "minimumReleaseAge": null
  }
}
```

- [ ] **Step 5: Renovate config'inin geçerli JSON olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "JSON.parse(require('fs').readFileSync('renovate.json','utf8')); console.log('renovate.json is valid json')"
```

Expected: `renovate.json is valid json`.

- [ ] **Step 6: Build'in silinen dosyalardan sonra hâlâ geçtiğini doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build
```

Expected: `Compiled successfully`, exit code 0.

- [ ] **Step 7: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test && npm run format
git add -A
git commit -m "chore: drop create-next-app leftovers, rewrite the readme, add renovate

The five default SVGs in public/ were never referenced. The readme still
told people to deploy on Vercel, it now documents the real stack, the
scripts, the Coolify build and runtime env split and the security
posture. renovate.json automerges patch and minor updates once CI is
green and always sends majors to a human."
```

---

### Task 11: Faz kapanışı, tam doğrulama ve PR

**Files:**
- Modify: yok (yalnızca doğrulama ve PR)

**Interfaces:**
- Consumes: Task 1-10'un tüm çıktıları.
- Produces: `feature/faz-0-guvenlik-ve-hijyen` dalından `main`'e açılmış tek PR.

- [ ] **Step 1: Tam kapı setini baştan çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
rm -rf node_modules .next
npm ci
npm run typecheck
npm run lint
npm test
npm run format
npm run build
```

Expected: altı komut da exit code 0. `npm ci` lockfile ile `package.json`'ın uyumsuz olduğunu söylerse `npm install` çalıştırıp lockfile'ı commit et.

- [ ] **Step 2: Kapsam grep'lerini çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
echo "--- example.com in shipped files (expect no output)"
grep -rn "example\.com" src public README.md .env.example next.config.ts package.json renovate.json; echo "exit=$?"
echo "--- framer-motion (expect no output)"
grep -rn "framer-motion" src package.json; echo "exit=$?"
echo "--- edge runtime (expect no output)"
grep -rn 'runtime = "edge"' src; echo "exit=$?"
echo "--- next version"
node -e "console.log(require('./package.json').dependencies.next, require('./package.json').dependencies.motion)"
```

Expected:

```
--- example.com in shipped files (expect no output)
exit=1
--- framer-motion (expect no output)
exit=1
--- edge runtime (expect no output)
exit=1
--- next version
16.3.3 13.1.1
```

`docs/` bu grep'in dışında: karar dokümanları bulguyu kanıtlarken `example.com` string'ini kasıtlı olarak alıntılıyor.

- [ ] **Step 3: Çalışan sunucuda son uçtan uca kontrol**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run start &
sleep 4
curl -s -o /dev/null -w "health   -> %{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "home     -> %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "honeypot -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@mail.invalid","message":"spam","website":"x"}'
curl -sI http://localhost:3000/ | grep -ci "x-powered-by"
pkill -f "next start" || true; pkill -f "next-server" || true
```

Expected:

```
health   -> 200
home     -> 200
honeypot -> 400
0
```

Son satırdaki `0`, `X-Powered-By` başlığının hiç gönderilmediğini gösterir.

- [ ] **Step 4: Dalı push et ve PR aç**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git push -u origin feature/faz-0-guvenlik-ve-hijyen
gh pr create --base main --head feature/faz-0-guvenlik-ve-hijyen \
  --title "feat: phase 0, security and hygiene" \
  --body "$(cat <<'EOF'
Phase 0 of the modernization plan: close the known CVEs, leave a
production ready Next configuration behind, harden the contact endpoint
and clear the create-next-app leftovers. Plan:
docs/plans/2026-08-27-faz-0-guvenlik-ve-hijyen.md

## What changed

- next and eslint-config-next go to 16.3.3, which covers the July and
  August 2026 security releases including the AVIF/libheif RCE and
  CVE-2026-44578.
- framer-motion is replaced by motion 13.1.1, every import moves to
  motion/react.
- next.config.ts sets output standalone, turns off poweredByHeader and
  sends security headers plus a CSP. The edge runtime export is gone
  from the opengraph image route.
- Node 24 is pinned through .nvmrc, engines.node requires >=20.9, and
  typecheck, test and format scripts exist. prettier and vitest are set
  up and the repo is formatted once.
- /api/contact now checks Content-Length, rate limits per visitor IP,
  reads the honeypot field server side, enforces an email pattern and
  length caps, and returns a generic error while details go to the log.
  CONTACT_EMAIL and FROM_EMAIL are required in production.
- NEXT_PUBLIC_SITE_URL is documented in .env.example and the build fails
  when it is missing, the example.com fallback in robots.ts and
  sitemap.ts is gone.
- /api/health is added for the Coolify health check in phase 1.
- The unused create-next-app SVGs are deleted, the readme is rewritten
  around the real stack and the Coolify deployment, and renovate.json
  automerges patch and minor updates while sending majors to review.

## Known deviation from the spec

The CSP draft in docs/09-guvenlik.md uses script-src 'self'. The App
Router streams its RSC payload through inline scripts, and the nonce
based alternative forces every route into dynamic rendering, which would
break the phase 2 requirement that only /api/* stays dynamic. This
branch ships script-src 'self' 'unsafe-inline' and leaves the nonce
question open.

## Verification

npm ci, npm run typecheck, npm run lint, npm test, npm run format and
npm run build all pass. Against npm run start: /api/health returns 200,
a honeypot filled POST to /api/contact returns 400, the sixth request
inside ten minutes returns 429, and no response carries X-Powered-By.
EOF
)"
```

Expected: `gh` komutu PR URL'i yazdırır.

- [ ] **Step 5: PR'ı gözden geçir**

`gh pr view --web` ile PR'ı aç, diff'te aşağıdakilerin OLMADIĞINI doğrula: `.env.local`, `.local/`, `.nodeterm/`, `node_modules`, `.next`. Varsa `git rm --cached` ile çıkar ve `.gitignore`'u düzelt.

---

## Bitti sayılma kriteri

Faz 0 aşağıdaki komutların tamamı beklenen çıktıyı verdiğinde bitmiş sayılır. Komutlar temiz bir çalışma dizininde, `feature/faz-0-guvenlik-ve-hijyen` dalında çalıştırılır.

**1. Araç zinciri ve statik kapılar**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
cat .nvmrc
node -e "console.log(require('./package.json').engines.node)"
npm run typecheck && echo "typecheck OK"
npm run lint && echo "lint OK"
npm test
npm run format
```

Beklenen: `.nvmrc` -> `24`; engines -> `>=20.9`; `typecheck OK`; `lint OK`; vitest çıktısında `Test Files  5 passed (5)` ve `Tests  45 passed (45)` (utils 3 + env 9 + client-ip 9 + rate-limit 10 + contact-validation 14); prettier -> `All matched files use Prettier code style!`.

**2. Sürümler**

```bash
npm ls next motion eslint-config-next --depth=0
grep -rn "framer-motion" src package.json; echo "exit=$?"
```

Beklenen: `next@16.3.3`, `motion@13.1.1`, `eslint-config-next@16.3.3`; grep çıktısı boş, `exit=1`.

**3. Build ve standalone çıktısı**

```bash
npm run build
ls .next/standalone/server.js
```

Beklenen: build başarılı; `.next/standalone/server.js` var.

**4. Güvenlik başlıkları ve çalışma zamanı**

```bash
npm run start &
sleep 4
curl -sI http://localhost:3000/ | grep -iE "x-powered-by|x-content-type-options|referrer-policy|permissions-policy|content-security-policy"
curl -s -o /dev/null -w "health -> %{http_code}\n" http://localhost:3000/api/health
```

Beklenen: `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()` ve `content-security-policy: default-src 'self'; ...` satırları var; `x-powered-by` satırı YOK; `health -> 200`.

**5. Contact sertleştirmesi**

```bash
curl -s -o /dev/null -w "honeypot -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Bot","email":"bot@mail.invalid","message":"spam","website":"x"}'
curl -s -o /dev/null -w "bad email -> %{http_code}\n" -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Visitor","email":"visitor@localhost","message":"hello"}'
pkill -f "next start" || true; pkill -f "next-server" || true
```

Beklenen: `honeypot -> 400`, `bad email -> 400`.

**6. Env sertleştirmesi**

```bash
mv .env.local .env.local.bak && npm run build; echo "exit=$?"; mv .env.local.bak .env.local
```

Beklenen: build başarısız, çıktıda `NEXT_PUBLIC_SITE_URL is not set`, `exit=1`.

**7. Repo hijyeni**

```bash
ls public/ | wc -l
grep -rn "example\.com" src public README.md .env.example; echo "exit=$?"
grep -rn "Deploy on Vercel" README.md; echo "exit=$?"
node -e "JSON.parse(require('fs').readFileSync('renovate.json','utf8')); console.log('renovate OK')"
```

Beklenen: `public/` boş (`0`); iki grep de boş çıktı ve `exit=1`; `renovate OK`.

**8. Tek dal, tek PR**

```bash
git log --oneline main..feature/faz-0-guvenlik-ve-hijyen
gh pr list --head feature/faz-0-guvenlik-ve-hijyen
```

Beklenen: 11 commit (Task 1'in docs commit'i + Task 1-10'un birer commit'i), hiçbirinde AI atıf veya co-author satırı yok; `gh pr list` tek bir açık PR gösteriyor.

---

## Devir notu şablonu

Faz 0 kapandığında Faz 1 ajanına aşağıdaki dört alan doldurularak aktarılır.

### Yapıldı

- [ ] `next` ve `eslint-config-next` 16.3.3, `motion` 13.1.1 (exact pin), `framer-motion` kaldırıldı, 11 import `motion/react`'e taşındı.
- [ ] `package-lock.json` npm 11.16.0 ile normalize edildi ve commit edildi.
- [ ] `next.config.ts`: `output: "standalone"`, `poweredByHeader: false`, `headers()` ile 4 güvenlik başlığı ve CSP.
- [ ] `src/app/opengraph-image.tsx` edge runtime satırı silindi.
- [ ] `.nvmrc` (24), `engines.node >=20.9`, `typecheck` / `test` / `format` / `format:write` script'leri.
- [ ] prettier 3 ve vitest 4 kuruldu; `vitest.config.ts` node environment, `src/**/*.test.ts`, `@` alias'ı.
- [ ] `src/lib/env.ts`, `src/lib/client-ip.ts`, `src/lib/rate-limit.ts`, `src/lib/contact-validation.ts` ve dördünün de birim testleri.
- [ ] `src/app/api/contact/route.ts` sertleştirildi; `src/app/api/health/route.ts` eklendi.
- [ ] `robots.ts` / `sitemap.ts` `example.com` fallback'i kaldırıldı, `.env.example` yeniden yazıldı.
- [ ] `public/` altındaki 5 create-next-app SVG'si silindi, dizin `public/.gitkeep` ile korundu, README yeniden yazıldı, `renovate.json` eklendi.

### Doğrulandı

- [ ] `npm ci && npm run typecheck && npm run lint && npm test && npm run format && npm run build` -> hepsi exit 0.
- [ ] `.next/standalone/server.js` üretiliyor.
- [ ] `curl -sI /` -> 4 güvenlik başlığı var, `X-Powered-By` yok.
- [ ] `curl /api/health` -> `200`, `Cache-Control: no-store`.
- [ ] Honeypot dolu POST -> `400`; geçersiz email -> `400`; 16 KB üstü gövde -> `413`; 10 dakikada 6. istek -> `429` + `Retry-After`.
- [ ] `NEXT_PUBLIC_SITE_URL` yokken `npm run build` hata veriyor.
- [ ] `src`, `public`, `README.md`, `.env.example` içinde `example.com` yok.

### Açık kaldı

- [ ] **CSP `script-src 'unsafe-inline'` taşıyor.** Nonce tabanlı CSP tüm route'ları dinamik render'a zorluyor, bu Faz 2'nin "yalnızca /api/* dynamic" kriteriyle çelişiyor. Faz 5'te Umami eklendiğinde CSP zaten yeniden ele alınacak, nonce sorusu o noktaya bırakıldı.
- [ ] **`TRUST_CF_CONNECTING_IP` varsayılan olarak `false`.** Faz 1'de Traefik `forwardedHeaders.trustedIPs` Cloudflare listesiyle set edildikten SONRA Coolify'da `"true"` yapılmalı. Önce açılırsa taklit edilebilir bir header'a güvenilmiş olur.
- [ ] **Renovate GitHub App kurulu değil.** `renovate.json` repoda hazır ama App kurulumu Faz 5 maddesi; automerge ancak GitHub Actions kapısı (Faz 1) kurulduktan sonra anlamlı.
- [ ] **`lucide-react`, `shadcn`, `typescript` major yükseltmeleri yapılmadı.** Bilinçli olarak Faz 0 dışında bırakıldı, güvenlik yamasını geciktirmemek için ayrı bir PR'a kaldı.
- [ ] **Rate limit state container restart'ında sıfırlanıyor.** Kabul edilen risk; ölçek büyürse Redis'e geçiş tripwire'ı.
- [ ] **`src/data/projects.ts` hâlâ şablon projeleri içeriyor**, `sitemap.ts` bunları indexliyor. Faz 4'te Velite çıktısıyla değişecek, `sitemap.ts`'in türetme mantığı değişmeden kalacak.

### Üretilen arayüzler (sonraki fazlar bunları tüketiyor)

**Dosyalar**

| Yol | Rol |
| --- | --- |
| `src/lib/env.ts` | Tüm env okuma tek kapıdan |
| `src/lib/client-ip.ts` | Ziyaretçi IP çözümlemesi |
| `src/lib/rate-limit.ts` | Süreç içi sliding window limiter |
| `src/lib/contact-validation.ts` | Contact gövde doğrulaması |
| `src/app/api/health/route.ts` | Liveness endpoint'i |
| `vitest.config.ts` | Test sözleşmesi: node env, `src/**/*.test.ts`, `@` alias |
| `renovate.json` | Bakım otomasyonu yapılandırması |
| `.nvmrc` | Node 24 |

**İmzalar**

```ts
// src/lib/env.ts
export const DEV_FALLBACK_EMAIL: "onboarding@resend.dev";
export function resolveSiteUrl(value: string | undefined): string;
export function resolveRequiredEmail(name: "CONTACT_EMAIL" | "FROM_EMAIL", value: string | undefined, isProduction: boolean): string;
export function resolveTrustCloudflare(value: string | undefined): boolean;
export function siteUrl(): string;
export function contactEmail(): string;
export function fromEmail(): string;
export function trustsCloudflareHeaders(): boolean;

// src/lib/client-ip.ts
export const UNKNOWN_IP: "unknown";
export function isIpAddress(value: string): boolean;
export type ClientIpOptions = { trustCloudflare: boolean };
export function getClientIp(headers: Headers, options: ClientIpOptions): string;

// src/lib/rate-limit.ts
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };
export type RateLimiterOptions = { limit: number; windowMs: number; maxKeys?: number };
export type RateLimiter = { check(key: string, now?: number): RateLimitResult; reset(): void };
export function createRateLimiter(options: RateLimiterOptions): RateLimiter;
export const CONTACT_RATE_LIMIT: { readonly limit: 5; readonly windowMs: 600000 };
export const contactRateLimiter: RateLimiter;

// src/lib/contact-validation.ts
export const MAX_NAME_LENGTH: 100;
export const MAX_EMAIL_LENGTH: 200;
export const MAX_SUBJECT_LENGTH: 200;
export const MAX_MESSAGE_LENGTH: 5000;
export const MAX_BODY_BYTES: 16384;
export type ContactPayload = { name: string; email: string; subject?: string; message: string };
export type ValidationResult = { ok: true; data: ContactPayload } | { ok: false; reason: "invalid" | "honeypot" };
export function validateBody(body: unknown): ValidationResult;
```

**npm script'leri:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `format`, `format:write`.

**Env değişkenleri:** `NEXT_PUBLIC_SITE_URL` (Build, zorunlu), `RESEND_API_KEY` (Runtime), `CONTACT_EMAIL` (Runtime), `FROM_EMAIL` (Runtime), `TRUST_CF_CONNECTING_IP` (Runtime, varsayılan `false`).

**HTTP sözleşmeleri:**

| Yol | Metot | Yanıtlar |
| --- | --- | --- |
| `/api/health` | GET | `200 { status, uptime, timestamp }`, `Cache-Control: no-store`, dynamic |
| `/api/contact` | POST | `200 { ok: true }`, `400`, `413`, `429` + `Retry-After`, `500`, `503`, hepsinde `{ error: string }` |

**Faz 1'in doğrudan bağlanacağı noktalar:** Dockerfile `.next/standalone/server.js`'i çalıştırır; Coolify health check `/api/health`'e bağlanır; Coolify env ayrımı `.env.example`'daki "Coolify layer" yorumlarını takip eder; Traefik `forwardedHeaders.trustedIPs` set edildikten sonra `TRUST_CF_CONNECTING_IP=true` yapılır.
