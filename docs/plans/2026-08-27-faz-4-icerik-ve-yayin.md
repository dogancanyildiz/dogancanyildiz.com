# Faz 4: İçerik pipeline (Velite), gerçek içerik, blog ve yayın Implementation Plan


> Durum: Uygulandı, PR #6 açık (CI yeşil, 458 test); sapmalar ve teslimat listesi handoffs/faz-4.md
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Şablon persona'yı tamamen kaldırıp, Velite 0.4.0 tabanlı MDX içerik pipeline'ı üstünde gerçek case study'leri, iki dilli çekirdek metinleri ve ilk blog yazılarını yayına çıkarmak.

**Architecture:** İçerik build zamanında `content/{projects,blog}/{en,tr}/<slug>.mdx` dosyalarından Velite ile derlenir, Zod şeması ile doğrulanır ve `.velite/` altına JSON + tip olarak yazılır. Sayfalar bu çıktıyı `#site/content` alias'ı üzerinden `src/lib/content.ts` yardımcılarıyla okur; locale dosya yolundan türetilir, çevirisi olmayan slug diğer dilin route, sitemap ve hreflang alternates'ine hiç girmez. Prose metinler `messages/{en,tr}.json`, yapısal profil listeleri (sertifika, konuşma, eğitim, topluluk) `src/content/profile.ts` içinde tutulur.

**Tech Stack:** next 16.3.3, react 19.2.x, next-intl 4.13.7, velite 0.4.0 (exact pin), tailwindcss 4.3.x, motion 13.1.1, vitest, shiki (rehype), rehype-slug, rehype-autolink-headings, TypeScript 5.

**Spec:**
- `docs/00-ozet-ve-karar.md`
- `docs/04-i18n.md`
- `docs/05-backend-icerik-ve-servisler.md`
- `docs/07-seo-ve-metadata.md`
- `docs/08-icerik-stratejisi.md`
- `docs/10-yol-haritasi.md`
- `docs/11-acik-sorular.md`
- Gerçek içerik kaynağı: `.local/content/portfolio-content.md` (repoya girmez, `.gitignore`'da)

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

## Başlangıç durumu varsayımı

Bu plan Faz 0, 1, 2 ve 3 main'e merge edildikten sonra çalıştırılır. Devralınan durum:

- `src/app/[lang]/` altında `layout.tsx`, `page.tsx`, `about/page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx`, `contact/page.tsx` var; her page ve layout `setRequestLocale(lang)` çağırıyor ve `generateStaticParams` ile `en` + `tr` üretiyor.
- `src/i18n/routing.ts` (`export const routing = defineRouting({locales: ["en","tr"], defaultLocale: "en", localePrefix: "as-needed"})`), `src/i18n/request.ts`, `src/i18n/navigation.ts` (`export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing)`) var.
- `src/proxy.ts` var, `createMiddleware` `next-intl/middleware`'den import ediliyor, `localeDetection` kapalı.
- `messages/en.json` ve `messages/tr.json` var, `src/lib/i18n/translations.ts` + `src/components/locale-provider.tsx` silinmiş.
- `src/app/sitemap.ts` ve `src/app/robots.ts` iki locale için çalışıyor, `example.com` fallback'i yok, `NEXT_PUBLIC_SITE_URL` zorunlu.
- Fontlar `src/fonts/` altında vendor'lanmış, `next/font/local` ile yükleniyor; motion 13 `LazyMotion + domAnimation + m` deseniyle kullanılıyor.
- `vitest.config.ts` ve `npm test` (vitest run) çalışıyor; `tsc --noEmit`, `eslint` ve `prettier --check` temiz.
- `Dockerfile` + `.dockerignore` var, builder aşaması `npm run build` çalıştırıyor.

Bir dosya bu tarifle uyuşmuyorsa, ilgili task'taki tam dosya içeriği esas alınır ve dosya o içerikle değiştirilir.

## Dosya yapısı

Yeni oluşturulan dosyalar:

| Dosya | Sorumluluk |
|---|---|
| `velite.config.ts` | Velite koleksiyonları (projects, posts), Zod şeması, MDX rehype zinciri |
| `content/projects/{en,tr}/<slug>.mdx` | Proje case study gövdeleri |
| `content/blog/{en,tr}/<slug>.mdx` | Blog yazıları |
| `content/images/.gitkeep` | Kapak görselleri için ayrılmış klasör (görsel gelene kadar boş) |
| `src/lib/content.ts` | Velite çıktısına tek giriş noktası: locale filtreleme, slug listeleri, DTO dönüşümleri |
| `src/lib/seo/alternates.ts` | locale-aware yol/URL üretimi, canonical + hreflang alternates; Faz 2'nin `locale-url.ts` dosyasının yerini alır, `siteUrl`'ü `@/lib/env`'den yeniden dışa aktarır |
| `src/components/content/mdx-content.tsx` | Velite'ın derlediği MDX kodunu React ağacına çeviren sunucu bileşeni |
| `src/components/seo/json-ld.tsx` | JSON-LD script bileşeni (kaçışlı) |
| `src/components/sections/project-grid.tsx` | Proje kartı ızgarası (client, LazyMotion) |
| `src/components/sections/post-list.tsx` | Blog yazı listesi (client, LazyMotion) |
| `src/app/[lang]/blog/page.tsx` | Blog listesi |
| `src/app/[lang]/blog/[slug]/page.tsx` | Blog detayı + BlogPosting JSON-LD |
| `src/app/[lang]/feed.xml/route.ts` | Locale başına RSS 2.0 feed |
| `src/content/profile.ts` | Sertifika, konuşma, eğitim, topluluk, deneyim listeleri (iki dilli, tipli) |
| `src/lib/cv.ts` | CV PDF varlık kontrolü ve yolu |
| `tests/content-schema.test.ts` | Geçersiz frontmatter'ın Velite tarafından reddedildiğinin testi |
| `tests/content-layer.test.ts` | `src/lib/content.ts` davranış testleri |
| `tests/alternates.test.ts` | hreflang/canonical üretim testleri |
| `tests/no-template-residue.test.ts` | Şablon kalıntısı ve em dash taraması |
| `tests/fixtures/velite.invalid.config.ts` | Şema testi için ayrı Velite konfigürasyonu |
| `tests/fixtures/invalid-content/projects/en/broken.mdx` | Geçersiz frontmatter örneği |

Değiştirilen dosyalar: `package.json`, `tsconfig.json`, `.gitignore`, `eslint.config.mjs`, `vitest.config.ts`, `.env.example`, `Dockerfile`, `.github/workflows/ci.yml`, `src/proxy.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/[lang]/page.tsx`, `src/app/[lang]/projects/page.tsx`, `src/app/[lang]/projects/[slug]/page.tsx`, `src/app/[lang]/about/page.tsx`, `src/components/sections/project-card.tsx`, `src/components/sections/hero.tsx`, `src/components/layout/header.tsx`, `src/components/layout/footer.tsx`, `src/components/layout/language-switcher.tsx`, `src/components/sections/contact-form.tsx`, `messages/en.json`, `messages/tr.json`.

Silinen dosyalar: `src/data/projects.ts`, `src/components/sections/projects-section.tsx`, `src/components/sections/featured-projects.tsx`, `src/components/sections/project-row.tsx`, `src/lib/seo/locale-url.ts`, `src/lib/content/project-locales.ts`, `tests/seo/locale-url.test.ts`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`.

---

### Task 1: Velite kurulumu, şema ve şema doğrulama testi

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/velite.config.ts`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/images/.gitkeep`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/cargo-pilot.mdx` (şema kanıtı için minimal ilk dosya, Task 3'te gerçek gövdeyle değiştirilir)
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/fixtures/velite.invalid.config.ts`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/fixtures/invalid-content/projects/en/broken.mdx`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/content-schema.test.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/package.json`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tsconfig.json`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.gitignore`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/eslint.config.mjs`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/Dockerfile`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Faz 0'dan `npm test` (vitest run), `npm run typecheck`, `npm run lint`; Faz 1'den `Dockerfile` builder aşaması.
- Produces:
  - `velite.config.ts` default export; `.velite/projects.json`, `.velite/posts.json`, `.velite/index.js`, `.velite/index.d.ts` üretir.
  - `#site/content` TypeScript path alias: `import { projects, posts } from "#site/content"`.
  - Velite `Project` kaydı: `{ title: string; slug: string; summary: string; role: string; stack: string[]; year: number; links: { live?: string; repo?: string }; cover?: { src: string; height: number; width: number; blurDataURL: string; blurWidth: number; blurHeight: number }; outcome: string; featured: boolean; order: number; path: string; code: string; locale: "en" | "tr" }`
  - Velite `Post` kaydı: `{ title: string; slug: string; date: string; summary: string; tags: string[]; cover?: {...}; draft: boolean; path: string; code: string; metadata: { readingTime: number; wordCount: number }; locale: "en" | "tr" }`
  - npm script'leri: `build` = `velite --clean && next build`, `dev` = `velite --watch & next dev`, `build:content` = `velite --clean`. Faz 0/2/3'ün `format:write`, `verify:routes`, `vendor:fonts` script'leri korunur.

- [ ] **Step 1: Bağımlılıkları kur (velite exact pin, caret yok)**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm install --save-exact velite@0.4.0
npm install --save-dev rehype-slug@latest rehype-autolink-headings@latest @shikijs/rehype@latest shiki@latest
```

Doğrulama: `node -e "const p=require('./package.json');console.log(p.dependencies.velite)"` çıktısı tam olarak `0.4.0` olmalı (`^` veya `~` yok).

- [ ] **Step 2: `velite.config.ts` dosyasını yaz**

```ts
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import { defineCollection, defineConfig, s } from "velite";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// content/projects/en/cargo-pilot.mdx -> ["projects", "en", "cargo-pilot"]
function localeFromPath(path: string): "en" | "tr" {
  const segment = path.split("/")[1];
  return segment === "tr" ? "tr" : "en";
}

const projects = defineCollection({
  name: "Project",
  pattern: "projects/**/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(120),
      slug: s.string().regex(SLUG_PATTERN),
      summary: s.string().min(1).max(300),
      role: s.string().min(1).max(120),
      stack: s.array(s.string().min(1)).min(1),
      year: s.number().int().min(2015).max(2100),
      links: s
        .object({
          live: s.string().url().optional(),
          repo: s.string().url().optional(),
        })
        .default({}),
      cover: s.image().optional(),
      outcome: s.string().min(1).max(300),
      featured: s.boolean().default(false),
      order: s.number().int().min(1).max(999).default(100),
      path: s.path(),
      code: s.mdx(),
    })
    .transform((data) => ({ ...data, locale: localeFromPath(data.path) })),
});

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s
    .object({
      title: s.string().min(1).max(140),
      slug: s.string().regex(SLUG_PATTERN),
      date: s.isodate(),
      summary: s.string().min(1).max(300),
      tags: s.array(s.string().min(1)).default([]),
      cover: s.image().optional(),
      draft: s.boolean().default(false),
      path: s.path(),
      code: s.mdx(),
      metadata: s.metadata(),
    })
    .transform((data) => ({ ...data, locale: localeFromPath(data.path) })),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
  collections: { projects, posts },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      [
        rehypeShiki,
        {
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        },
      ],
    ],
  },
});
```

- [ ] **Step 3: İlk proje dosyasını oluştur (şemanın gerçekten derlendiğini kanıtlamak için)**

`content/projects/en/cargo-pilot.mdx`:

```mdx
---
title: Cargo Pilot
slug: cargo-pilot
summary: A logistics platform that digitizes and optimizes cargo and load planning.
role: DevOps Chapter Lead
stack:
  - Docker
  - GitHub Actions
  - Coolify
  - Linux
year: 2025
links:
  live: https://cargopilot.divizyon.org
outcome: Container based deploys and a GitHub Actions pipeline replaced manual releases.
featured: true
order: 1
---

## What I did

I led the DevOps chapter of Cargo Pilot.
```

Not: bu gövde Task 3'te tam case study metniyle değiştirilir; burada yalnızca şemanın derlendiğini doğrulamak için tek cümlelik bir gövde var. Bu adımda köşeli parantezli veya "placeholder" kelimesi geçen metin yazılmaz.

- [ ] **Step 4: `tsconfig.json`'a `#site/content` alias'ını ekle**

`compilerOptions.paths` bloğunu şu hale getir:

```json
    "paths": {
      "@/*": ["./src/*"],
      "#site/content": ["./.velite"]
    }
```

`include` dizisine `.velite/index.d.ts` ekle:

```json
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    ".velite/index.d.ts",
    "**/*.mts"
  ],
```

- [ ] **Step 5: `package.json` script'lerini güncelle**

`scripts` bloğunu şu hale getir. Yalnızca `dev` ve `build` değişiyor, ikisi
de velite ile sarılıyor; `build:content` yeni ekleniyor. Önceki fazların
bıraktığı script'ler AYNEN korunur: Faz 0'dan `typecheck`, `test`, `format`,
`format:write`; Faz 2'den `verify:routes`; Faz 3'ten `vendor:fonts`.

```json
  "scripts": {
    "dev": "velite --watch & next dev",
    "build": "velite --clean && next build",
    "build:content": "velite --clean",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "verify:routes": "node scripts/assert-static-routes.mjs",
    "vendor:fonts": "node scripts/vendor-fonts.mjs"
  }
```

Doğrulama, hiçbir script kaybolmamalı:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "const s=require('./package.json').scripts; for (const k of ['dev','build','build:content','start','lint','typecheck','test','format','format:write','verify:routes','vendor:fonts']) if (!s[k]) throw new Error('missing script: '+k); console.log('SCRIPTS_OK')"
```

Beklenen: `SCRIPTS_OK`.

Not: Velite'ın `next.config.ts` içine `import('velite').then(m => m.build(...))` şeklinde gömülen varyantı bilinçli kullanılmıyor; o yol build'i beklemediği için Docker'da yarış koşulu üretir. `velite --clean && next build` sıralaması deterministiktir.

- [ ] **Step 6: `.gitignore`'a Velite çıktılarını ekle**

Dosyanın sonuna ekle:

```
# ─── Velite content pipeline output ──────────────────────────────────────────
/.velite/
/public/static/
```

- [ ] **Step 7: `eslint.config.mjs`'e Velite çıktısını yok say**

`export default` dizisinin ilk elemanı olarak ekle:

```js
  { ignores: [".velite/**", "public/static/**", ".next/**"] },
```

- [ ] **Step 8: Velite'ı çalıştır ve çıktıyı doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content
ls .velite
```

Beklenen çıktı: `index.d.ts`, `index.js`, `posts.json`, `projects.json` dosyaları listelenir; komut `resolved 1 projects` benzeri bir satırla 0 exit code döner.

```bash
node -e "const p=require('./.velite/projects.json');console.log(p[0].slug,p[0].locale,p[0].featured,p[0].order)"
```

Beklenen çıktı: `cargo-pilot en true 1`

- [ ] **Step 9: Geçersiz frontmatter fixture'ını yaz**

`tests/fixtures/invalid-content/projects/en/broken.mdx`:

```mdx
---
title: Broken Project
slug: Broken_Slug
summary: Missing required fields on purpose.
year: 2025
---

Body.
```

(`slug` slug desenine uymuyor, `role`, `stack` ve `outcome` alanları eksik.)

`tests/fixtures/velite.invalid.config.ts`:

```ts
import { defineCollection, defineConfig, s } from "velite";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const projects = defineCollection({
  name: "InvalidProject",
  pattern: "projects/**/*.mdx",
  schema: s.object({
    title: s.string().min(1).max(120),
    slug: s.string().regex(SLUG_PATTERN),
    summary: s.string().min(1).max(300),
    role: s.string().min(1).max(120),
    stack: s.array(s.string().min(1)).min(1),
    year: s.number().int().min(2015).max(2100),
    outcome: s.string().min(1).max(300),
  }),
});

export default defineConfig({
  root: "tests/fixtures/invalid-content",
  output: {
    data: "tests/fixtures/.velite-invalid",
    assets: "tests/fixtures/.velite-invalid/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
  collections: { projects },
});
```

- [ ] **Step 10: Başarısız olan şema testini yaz**

`tests/content-schema.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function runVelite(configPath: string): { status: number; output: string } {
  try {
    const output = execFileSync(
      "npx",
      ["velite", "build", "--config", configPath, "--clean"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { status: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

describe("velite content schema", () => {
  it("rejects a project with an invalid slug and missing required fields", () => {
    const result = runVelite("tests/fixtures/velite.invalid.config.ts");
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/broken\.mdx/);
  });

  it("accepts the real content collections", () => {
    const result = runVelite("velite.config.ts");
    expect(result.status).toBe(0);
  });
});
```

- [ ] **Step 11: Testi çalıştır ve geçtiğini doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/content-schema.test.ts
```

Beklenen: 2 test PASS. İlk test geçmiyorsa (velite exit code 0 dönüyorsa) `velite.invalid.config.ts`'e `strict` bayrağı gerekmiş demektir; komuta `--strict` ekle ve testi tekrar çalıştır.

- [ ] **Step 12: Fixture çıktısını gitignore'a ekle**

`.gitignore` sonuna ekle:

```
tests/fixtures/.velite-invalid/
```

- [ ] **Step 13: Dockerfile'ın content klasörünü ve velite.config.ts'i build context'e aldığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "^COPY" Dockerfile
grep -n "content\|velite" .dockerignore
```

Beklenen: builder aşamasında `COPY . .` satırı var ve `.dockerignore` içinde `content` veya `velite` geçmiyor. Builder aşaması seçmeli kopyalama yapıyorsa (`COPY src ./src` gibi), `npm run build` satırından önce şu iki satırı ekle:

```dockerfile
COPY velite.config.ts ./
COPY content ./content
```

- [ ] **Step 14: GitHub Actions kapısına içerik derleme adımı ekle**

Faz 1'in `checks` job'ı sırayla `lint`, `typecheck`, `test`, `build` çalıştırıyor.
`.velite/` bu task'ta `.gitignore`'a girdiği için CI runner'ında o dizin yoktur;
`typecheck` `tsconfig.json`'daki `.velite/index.d.ts` girdisini bulamaz ve `test`
`#site/content` import'unu çözemez. `build` script'i velite'ı kendisi çalıştırıyor
ama sırada en sonda olduğu için geç kalır. Bu yüzden `npm ci` ile `npm run lint`
arasına bir adım eklenir.

`.github/workflows/ci.yml` içinde `checks` job'ındaki `- run: npm ci` satırının
hemen ALTINA ekle:

```yaml
      # Velite output is gitignored, so the content has to be compiled before
      # typecheck and test can resolve the #site/content alias.
      - run: npm run build:content
```

`docker` job'ına bir şey eklenmez: image build'i `npm run build` üzerinden gider
ve o script zaten `velite --clean && next build`.

Doğrulama:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "npm run build:content\|npm run lint\|npm run typecheck" .github/workflows/ci.yml
npx vitest run tests/deploy/ci-workflow.test.ts
```

Beklenen: `build:content` satırı `lint` satırından önce görünüyor; Faz 1'in
workflow sözleşme testi 7 test ile geçiyor (yeni adım hiçbir iddiayı bozmaz,
test yalnızca gerekli komutların varlığını arıyor).

- [ ] **Step 15: Tüm kapıları çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content && npm run typecheck && npm run lint && npm test
```

Beklenen: dördü de 0 exit code.

- [ ] **Step 16: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git checkout -b feature/faz-4-icerik-ve-yayin
git add velite.config.ts content tests package.json package-lock.json tsconfig.json .gitignore eslint.config.mjs Dockerfile .github/workflows/ci.yml
git commit -m "feat(content): add velite 0.4.0 pipeline with project and post schemas"
```

---

### Task 2: İçerik erişim katmanı, MDX render ve hreflang yardımcıları

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/content.ts`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/seo/alternates.ts` (Faz 2'nin `src/lib/seo/locale-url.ts` dosyasının yerini alır)
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/seo/locale-url.ts`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/content/project-locales.ts`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/seo/locale-url.test.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/layout.tsx` (yalnızca import satırları)
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/contact/page.tsx` (yalnızca import satırı ve `buildAlternates` çağrısı)
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/seo/person-jsonld.tsx` (yalnızca import satırı ve `localeUrl` çağrıları)
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/content/mdx-content.tsx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/seo/json-ld.tsx`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/content-layer.test.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/alternates.test.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/vitest.config.ts`

**Interfaces:**
- Consumes: Task 1'den `#site/content` alias'ı ve `projects` / `posts` dizileri; `velite.config.ts`'in ürettiği `locale`, `slug`, `code`, `cover`, `metadata` alanları.
- Produces (sonraki bütün task'lar bunları kullanır):
  - `type Locale = "en" | "tr"`
  - `type Project = (typeof projects)[number]`, `type Post = (typeof posts)[number]`
  - `interface CoverImage { src: string; width: number; height: number; blurDataURL: string }`
  - `interface ProjectCardData { slug: string; title: string; summary: string; role: string; stack: string[]; year: number; href: string; cover: CoverImage | null }`
  - `interface PostCardData { slug: string; title: string; summary: string; date: string; tags: string[]; readingTime: number; href: string }`
  - `getProjects(locale: Locale): Project[]`
  - `getFeaturedProjects(locale: Locale): Project[]`
  - `getProject(locale: Locale, slug: string): Project | undefined`
  - `getProjectSlugs(locale: Locale): string[]`
  - `getProjectLocales(slug: string): Locale[]`
  - `getPosts(locale: Locale): Post[]`
  - `getPost(locale: Locale, slug: string): Post | undefined`
  - `getPostSlugs(locale: Locale): string[]`
  - `getPostLocales(slug: string): Locale[]`
  - `toProjectCardData(project: Project): ProjectCardData`
  - `toPostCardData(post: Post): PostCardData`
  - DTO içindeki `href` locale öneki TAŞIMAZ (`/projects/cargo-pilot`); önek `@/i18n/navigation`'daki next-intl `Link` bileşeni tarafından eklenir. Mutlak, önekli URL gereken yerlerde (`sitemap.ts`, RSS, JSON-LD) `absoluteUrl(locale, path)` kullanılır.
  - `siteUrl(): string` (Faz 0'ın `src/lib/env.ts` dosyasındaki `siteUrl` fonksiyonunun yeniden dışa aktarımı, ikinci bir uygulama YAZILMAZ)
  - `localePath(locale: Locale, path: string): string`
  - `absoluteUrl(locale: Locale, path: string): string`
  - `buildAlternates(currentLocale: Locale, path: string, availableLocales: Locale[]): { canonical: string; languages: Record<string, string> }`
  - **Faz 2'den devralınan adların eşlemesi** (bu task eski dosyaları siler, aşağıdaki üç dosya dışında tüm çağrı yerleri zaten bu fazda baştan yazılıyor):

    | Faz 2 (silinen) | Faz 4 (kalan) |
    |---|---|
    | `src/lib/seo/site-url.ts` yok, `siteUrl` zaten `@/lib/env` içinde | `siteUrl` `@/lib/seo/alternates`'ten yeniden dışa aktarılır |
    | `localeUrl(locale, pathname)` (`@/lib/seo/locale-url`) | `absoluteUrl(locale, path)` (`@/lib/seo/alternates`) |
    | `localePath(locale, pathname)` (`@/lib/seo/locale-url`) | `localePath(locale, path)` (`@/lib/seo/alternates`), imza aynı |
    | `buildAlternates(locale, pathname, availableLocales?)` | `buildAlternates(currentLocale, path, availableLocales)`, üçüncü argüman artık ZORUNLU |
    | `localesForProject(slug)` (`@/lib/content/project-locales`) | `getProjectLocales(slug)` (`@/lib/content`) |
    | `AppLocale` (`@/i18n/routing`) | `Locale` (`@/lib/content`), değer kümesi aynı |
  - `<MDXContent code={string} />` sunucu bileşeni
  - `<JsonLd data={Record<string, unknown>} />` sunucu bileşeni

- [ ] **Step 1: `vitest.config.ts`'i alias ve env ile güncelle**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#site/content": fileURLToPath(new URL("./.velite", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Faz 0 birim testleri src/lib/*.test.ts altinda, Faz 1 ve sonrasi tests/ altinda.
    // Iki desen de dahil, aksi halde Faz 0'in 45 testi sessizce calismaz.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    env: {
      NEXT_PUBLIC_SITE_URL: "https://dogancanyildiz.sh",
    },
  },
});
```

- [ ] **Step 2: Başarısız olan hreflang testini yaz**

`tests/alternates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildAlternates,
  localePath,
  siteUrl,
} from "@/lib/seo/alternates";

describe("localePath", () => {
  it("keeps english at the root", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/projects/cargo-pilot")).toBe("/projects/cargo-pilot");
  });

  it("prefixes turkish with /tr", () => {
    expect(localePath("tr", "/")).toBe("/tr");
    expect(localePath("tr", "/projects/cargo-pilot")).toBe("/tr/projects/cargo-pilot");
  });
});

describe("absoluteUrl", () => {
  it("joins the site url with the locale path", () => {
    expect(siteUrl()).toBe("https://dogancanyildiz.sh");
    expect(absoluteUrl("tr", "/blog")).toBe("https://dogancanyildiz.sh/tr/blog");
    expect(absoluteUrl("en", "/")).toBe("https://dogancanyildiz.sh/");
  });
});

describe("buildAlternates", () => {
  it("lists both languages and x-default when both translations exist", () => {
    const result = buildAlternates("tr", "/blog/self-hosting-with-coolify", ["en", "tr"]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
    );
    expect(result.languages).toEqual({
      en: "https://dogancanyildiz.sh/blog/self-hosting-with-coolify",
      tr: "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
      "x-default": "https://dogancanyildiz.sh/blog/self-hosting-with-coolify",
    });
  });

  it("omits the missing translation and falls back to the only locale for x-default", () => {
    const result = buildAlternates("tr", "/blog/capt-sinavina-hazirlik", ["tr"]);
    expect(result.canonical).toBe(
      "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik",
    );
    expect(result.languages).toEqual({
      tr: "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik",
      "x-default": "https://dogancanyildiz.sh/tr/blog/capt-sinavina-hazirlik",
    });
    expect(result.languages.en).toBeUndefined();
  });
});
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/alternates.test.ts
```

Beklenen: FAIL, `Failed to resolve import "@/lib/seo/alternates"`.

- [ ] **Step 4: `src/lib/seo/alternates.ts` dosyasını yaz**

Bu dosya Faz 2'nin `src/lib/seo/locale-url.ts` dosyasının yerini alır. `siteUrl`
Faz 0'ın `src/lib/env.ts` dosyasından yeniden dışa aktarılır, ÜÇÜNCÜ bir kopya
yazılmaz; `localePath` de "en kökte, tr `/tr` altında" kuralını sabit yazmak
yerine Faz 2'nin `routing` yapılandırmasından okur, böylece `localePrefix`
kararının tek kaynağı `src/i18n/routing.ts` olarak kalır.

```ts
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import type { Locale } from "@/lib/content";

// Faz 0'in env katmani tek site-url kapisi. Burada yeniden disa aktariliyor ki
// SEO tarafindaki cagiranlar tek modulden okusun.
export { siteUrl };

export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const trimmed = normalized === "/" ? "" : normalized.replace(/\/+$/, "");
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${trimmed}` || "/";
}

export function absoluteUrl(locale: Locale, path: string): string {
  return `${siteUrl()}${localePath(locale, path)}`;
}

export function buildAlternates(
  currentLocale: Locale,
  path: string,
  availableLocales: Locale[],
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of availableLocales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  const fallbackLocale: Locale = availableLocales.includes("en")
    ? "en"
    : (availableLocales[0] ?? currentLocale);
  languages["x-default"] = absoluteUrl(fallbackLocale, path);

  return {
    canonical: absoluteUrl(currentLocale, path),
    languages,
  };
}
```

- [ ] **Step 5: `src/lib/content.ts` dosyasını yaz**

```ts
import { posts, projects } from "#site/content";

export type Locale = "en" | "tr";
export type Project = (typeof projects)[number];
export type Post = (typeof posts)[number];

export interface CoverImage {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface ProjectCardData {
  slug: string;
  title: string;
  summary: string;
  role: string;
  stack: string[];
  year: number;
  href: string;
  cover: CoverImage | null;
}

export interface PostCardData {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  readingTime: number;
  href: string;
}

const includeDrafts = process.env.NODE_ENV === "development";

function byProjectOrder(a: Project, b: Project): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.year !== b.year) return b.year - a.year;
  return a.title.localeCompare(b.title, "en");
}

function byPostDateDesc(a: Post, b: Post): number {
  return b.date.localeCompare(a.date);
}

function toCover(cover: Project["cover"] | Post["cover"]): CoverImage | null {
  if (!cover) return null;
  return {
    src: cover.src,
    width: cover.width,
    height: cover.height,
    blurDataURL: cover.blurDataURL,
  };
}

export function getProjects(locale: Locale): Project[] {
  return projects.filter((project) => project.locale === locale).sort(byProjectOrder);
}

export function getFeaturedProjects(locale: Locale): Project[] {
  return getProjects(locale).filter((project) => project.featured);
}

export function getProject(locale: Locale, slug: string): Project | undefined {
  return projects.find((project) => project.locale === locale && project.slug === slug);
}

export function getProjectSlugs(locale: Locale): string[] {
  return getProjects(locale).map((project) => project.slug);
}

export function getProjectLocales(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of ["en", "tr"] as const) {
    if (getProject(locale, slug)) locales.push(locale);
  }
  return locales;
}

export function getPosts(locale: Locale): Post[] {
  return posts
    .filter((post) => post.locale === locale && (includeDrafts || !post.draft))
    .sort(byPostDateDesc);
}

export function getPost(locale: Locale, slug: string): Post | undefined {
  return getPosts(locale).find((post) => post.slug === slug);
}

export function getPostSlugs(locale: Locale): string[] {
  return getPosts(locale).map((post) => post.slug);
}

export function getPostLocales(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of ["en", "tr"] as const) {
    if (getPost(locale, slug)) locales.push(locale);
  }
  return locales;
}

export function toProjectCardData(project: Project): ProjectCardData {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    role: project.role,
    stack: project.stack,
    year: project.year,
    href: `/projects/${project.slug}`,
    cover: toCover(project.cover),
  };
}

export function toPostCardData(post: Post): PostCardData {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    date: post.date,
    tags: post.tags,
    readingTime: Math.max(1, Math.round(post.metadata.readingTime)),
    href: `/blog/${post.slug}`,
  };
}
```

- [ ] **Step 6: İçerik katmanı testini yaz**

`tests/content-layer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getProject,
  getProjectLocales,
  getProjectSlugs,
  getProjects,
  toProjectCardData,
} from "@/lib/content";

describe("project content layer", () => {
  it("returns only english projects for the en locale", () => {
    const list = getProjects("en");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((project) => project.locale === "en")).toBe(true);
  });

  it("sorts projects by order ascending", () => {
    const orders = getProjects("en").map((project) => project.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("finds cargo-pilot by slug", () => {
    const project = getProject("en", "cargo-pilot");
    expect(project?.title).toBe("Cargo Pilot");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("en", "does-not-exist")).toBeUndefined();
  });

  it("lists the locales a slug is translated into", () => {
    expect(getProjectLocales("cargo-pilot")).toContain("en");
    expect(getProjectLocales("does-not-exist")).toEqual([]);
  });

  it("builds a locale neutral href in the card dto", () => {
    const project = getProject("en", "cargo-pilot")!;
    const card = toProjectCardData(project);
    expect(card.href).toBe("/projects/cargo-pilot");
    expect(card.title).toBe("Cargo Pilot");
    expect(card.cover).toBeNull();
  });

  it("never returns a slug that is not a valid url segment", () => {
    for (const slug of getProjectSlugs("en")) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
```

- [ ] **Step 7: Testleri çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content && npx vitest run tests/alternates.test.ts tests/content-layer.test.ts
```

Beklenen: tüm testler PASS.

- [ ] **Step 8: `src/components/content/mdx-content.tsx` dosyasını yaz**

```tsx
import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

// Velite MDX'i "function-body" formatında derler; kod build sırasında sunucuda
// çalıştırılır ve statik HTML'e dönüşür. Tarayıcıda eval yapılmaz, bu yüzden
// CSP'de unsafe-eval gerekmez. Bu dosyaya asla "use client" eklenmemeli.
function getMDXComponent(code: string): ComponentType<{
  components?: Record<string, ComponentType>;
}> {
  const factory = new Function(code);
  return factory({ ...runtime }).default;
}

interface MDXContentProps {
  code: string;
  components?: Record<string, ComponentType>;
}

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = getMDXComponent(code);
  return <Component components={components} />;
}
```

- [ ] **Step 9: `src/components/seo/json-ld.tsx` dosyasını yaz**

```tsx
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
```

- [ ] **Step 10: Faz 2'nin eski SEO ve içerik seam dosyalarını kaldır**

Faz 2 aynı işi yapan üç dosya bırakmıştı. Bu task onların yerini aldığı için
dosyalar silinir; aksi halde repoda iki farklı hreflang üreticisi ve iki farklı
"bir slug hangi dillerde var" kaynağı kalır ve ikisi zamanla ayrışır.

Önce hangi dosyaların hâlâ bu modüllere baktığını gör:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rln "@/lib/seo/locale-url\|@/lib/content/project-locales" src tests
```

Beklenen liste (bu fazın diğer task'ları `projects/page.tsx`,
`projects/[slug]/page.tsx`, `about/page.tsx`, `sitemap.ts`, `robots.ts`
dosyalarını zaten baştan yazıyor, geriye şu üçü kalıyor):

```
src/app/[lang]/layout.tsx
src/app/[lang]/contact/page.tsx
src/components/seo/person-jsonld.tsx
```

`src/app/[lang]/layout.tsx` içindeki import satırını değiştir:

```ts
// eski
import { localeUrl } from "@/lib/seo/locale-url";
// yeni
import { absoluteUrl } from "@/lib/seo/alternates";
```

ve aynı dosyadaki `localeUrl(` çağrılarını `absoluteUrl(` yap. `siteUrl`
import'u (`@/lib/env`) olduğu gibi kalır.

`src/app/[lang]/contact/page.tsx` içinde:

```ts
// eski
import { buildAlternates } from "@/lib/seo/locale-url";
// yeni
import { buildAlternates } from "@/lib/seo/alternates";
```

`buildAlternates`'in üçüncü argümanı artık zorunlu olduğu için çağrıyı da
güncelle (contact sayfası iki dilde de var):

```ts
alternates: buildAlternates(lang, "/contact", ["en", "tr"]),
```

`src/components/seo/person-jsonld.tsx` içinde:

```ts
// eski
import { localeUrl } from "@/lib/seo/locale-url";
// yeni
import { absoluteUrl } from "@/lib/seo/alternates";
```

ve `localeUrl(` çağrılarını `absoluteUrl(` yap.

Sonra eski dosyaları sil:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm src/lib/seo/locale-url.ts src/lib/content/project-locales.ts tests/seo/locale-url.test.ts
rmdir src/lib/content 2>/dev/null || true
```

- [ ] **Step 11: Hiçbir dosyanın eski modüllere bakmadığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rn "@/lib/seo/locale-url\|@/lib/seo/site-url\|@/lib/content/project-locales\|localesForProject" src tests; echo "exit=$?"
```

Beklenen: hiç çıktı yok, `exit=1`.

- [ ] **Step 12: Kapıları çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
```

Beklenen: üçü de 0 exit code.

- [ ] **Step 13: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add -A src/lib/content.ts src/lib/seo src/lib/content src/components/content src/components/seo src/app/[lang]/layout.tsx src/app/[lang]/contact/page.tsx tests vitest.config.ts
git commit -m "feat(content): add content access layer, mdx renderer and hreflang helpers

Replaces the phase 2 seam modules src/lib/seo/locale-url.ts and
src/lib/content/project-locales.ts. siteUrl keeps living in src/lib/env.ts and
is only re-exported here, so the site origin still has a single implementation."
```

---

### Task 3: Öncelikli case study'ler (Cargo Pilot, Bilet Satın Alma) EN + TR

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/cargo-pilot.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/tr/cargo-pilot.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/ticket-purchasing-system.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/tr/ticket-purchasing-system.mdx`

**Interfaces:**
- Consumes: Task 1'deki Velite `projects` şeması (`title`, `slug`, `summary`, `role`, `stack[]`, `year`, `links{live?,repo?}`, `cover?`, `outcome`, `featured?`, `order`).
- Produces: `cargo-pilot` ve `ticket-purchasing-system` slug'ları, ikisi de `en` ve `tr` locale'lerinde mevcut; `featured: true` ve `order: 1` / `order: 2`.

Kural: EN ve TR dosyalarının `slug` değeri birebir aynı olmak zorunda; hreflang eşleşmesi slug üzerinden kurulur. Kapak görseli teslim edilmediği için `cover` alanı hiçbir dosyada yok, projeler kapaksız yayınlanıyor (CSS gradyan veya stok görsel kullanılmaz).

- [ ] **Step 1: `content/projects/en/cargo-pilot.mdx` dosyasının tamamını yaz**

```mdx
---
title: Cargo Pilot
slug: cargo-pilot
summary: A logistics platform that digitizes cargo and load planning, and optimizes how a load is placed.
role: DevOps Chapter Lead
stack:
  - Docker
  - GitHub Actions
  - Coolify
  - Linux
year: 2025
links:
  live: https://cargopilot.divizyon.org
outcome: Manual releases were replaced by a Docker plus GitHub Actions pipeline running on self-hosted Coolify infrastructure.
featured: true
order: 1
---

## What I did

Cargo Pilot is a web platform built at Divizyon that digitizes cargo and load planning for logistics operations. I led the DevOps chapter: I containerized the application with Docker, wrote the GitHub Actions pipelines that build and release it, and ran the whole thing on self-hosted Coolify infrastructure instead of a managed platform. Alongside the infrastructure work I contributed to the core load planning optimization algorithm, and I coordinated a cross functional team in an Agile workflow with sprint planning and task tracking in ClickUp.

## Why it was built this way

Load planning is the part of the job that people were doing by hand, on paper and in spreadsheets, so the product had to make the placement decision itself instead of only recording it. On the delivery side the team was small and the release step was the bottleneck: every deploy needed someone who knew the server. Moving the application into a container and putting the release behind a pipeline made the deploy step something any team member could trigger, and made the environment reproducible instead of hand tuned.

## What I learned

Owning both the algorithm and the infrastructure changed how I read the system. An optimization pass that looks cheap in a local test can turn into the slowest request in production once real load data hits it, and the only way to see that early is to run the real container against real data instead of a laptop. The second lesson was about people, not machines: a pipeline is only useful when the team trusts it, so the rollback path had to be as obvious as the deploy path before anyone started shipping on a Friday.
```

- [ ] **Step 2: `content/projects/tr/cargo-pilot.mdx` dosyasının tamamını yaz**

```mdx
---
title: Cargo Pilot
slug: cargo-pilot
summary: Kargo ve yük planlama süreçlerini dijitalleştiren, yükün nasıl yerleşeceğini optimize eden bir lojistik platformu.
role: DevOps Chapter Lead
stack:
  - Docker
  - GitHub Actions
  - Coolify
  - Linux
year: 2025
links:
  live: https://cargopilot.divizyon.org
outcome: Elle yapılan yayınların yerini, kendi sunucumuzdaki Coolify altyapısında çalışan Docker ve GitHub Actions hattı aldı.
featured: true
order: 1
---

## Ne yaptım

Cargo Pilot, Divizyon'da geliştirdiğimiz, lojistik operasyonlarında kargo ve yük planlamasını dijitalleştiren bir web platformu. DevOps chapter'ının sorumluluğunu üstlendim: uygulamayı Docker ile konteynerleştirdim, derleme ve yayın adımlarını GitHub Actions üzerinde kurdum, tümünü yönetilen bir platform yerine kendi sunucumuzdaki Coolify altyapısında çalıştırdım. Altyapı işinin yanında yük planlama optimizasyon algoritmasının çekirdeğine katkı verdim ve çok disiplinli ekibi Agile akışta, sprint planlama ve ClickUp üzerinde görev takibiyle koordine ettim.

## Neden böyle kurgulandı

Yük planlama, işin insanlar tarafından kağıt ve tablo üstünde yapılan kısmıydı; bu yüzden ürünün yerleşimi yalnızca kaydetmesi değil, kararı kendisinin vermesi gerekiyordu. Teslimat tarafında ise ekip küçüktü ve yayın adımı darboğazdı: her deploy sunucuyu tanıyan birini gerektiriyordu. Uygulamayı konteynere taşımak ve yayını bir hattın arkasına almak, deploy'u ekipteki herkesin tetikleyebileceği bir adıma çevirdi ve ortamı elle ayarlanan bir şey olmaktan çıkarıp tekrar üretilebilir hale getirdi.

## Ne öğrendim

Hem algoritmayı hem altyapıyı üstlenmek sistemi okuma biçimimi değiştirdi. Yerel testte ucuz görünen bir optimizasyon adımı, gerçek yük verisi geldiğinde üretimdeki en yavaş istek haline gelebiliyor; bunu erken görmenin tek yolu dizüstü bilgisayar yerine gerçek konteyneri gerçek veriyle çalıştırmak. İkinci ders makinelerle değil insanlarla ilgiliydi: bir hat ancak ekip ona güvendiğinde işe yarıyor, bu yüzden kimse cuma günü yayın almaya başlamadan önce geri alma yolunun deploy yolu kadar açık olması gerekiyordu.
```

- [ ] **Step 3: `content/projects/en/ticket-purchasing-system.mdx` dosyasını yaz**

```mdx
---
title: Ticket Purchasing System
slug: ticket-purchasing-system
summary: A containerized ticket purchasing application I attacked first and then hardened, built during the Siber Vatan program.
role: Security engineer, Siber Vatan training program
stack:
  - PHP
  - SQLite
  - Docker
year: 2024
outcome: Every finding from the penetration test was closed with input validation, secure session handling and a hardened Docker deployment.
featured: true
order: 2
---

## What I did

I built a ticket purchasing system as a security practice project inside the Siber Vatan training program, then ran a penetration test and a vulnerability assessment against my own application. The findings drove the second half of the work: input validation on every request that touches the database, session handling that survives a stolen cookie, and a Docker deployment where the application does not run as root and does not expose more than it needs to.

## Why it was built this way

Writing the application first and attacking it afterwards was the point. Reading a vulnerability list teaches you the name of a problem; watching your own checkout flow hand out someone else's ticket teaches you why the mitigation is shaped the way it is. Keeping the stack deliberately small, PHP with SQLite in a single container, meant nothing hid behind a framework: every input path and every session decision was code I had written and could break.

## What I learned

The fixes that mattered were not the exotic ones. Most of what I found came down to trusting a value that arrived from the client, and the pattern that closed it was always the same: validate at the boundary, keep the trusted state on the server, and never let the deployment be the place where a shortcut lives. Hardening the container turned out to be part of the same lesson, because a well written application on a permissive host is still a permissive system.
```

- [ ] **Step 4: `content/projects/tr/ticket-purchasing-system.mdx` dosyasını yaz**

```mdx
---
title: Bilet Satın Alma Sistemi
slug: ticket-purchasing-system
summary: Siber Vatan programında geliştirdiğim, önce saldırdığım sonra sertleştirdiğim konteyner tabanlı bilet satın alma uygulaması.
role: Güvenlik mühendisi, Siber Vatan eğitim programı
stack:
  - PHP
  - SQLite
  - Docker
year: 2024
outcome: Sızma testinde çıkan her bulgu girdi doğrulama, güvenli oturum yönetimi ve sertleştirilmiş Docker yayını ile kapatıldı.
featured: true
order: 2
---

## Ne yaptım

Siber Vatan eğitim programı kapsamında bir bilet satın alma sistemi geliştirdim, ardından kendi uygulamama karşı sızma testi ve zafiyet analizi yürüttüm. Bulgular işin ikinci yarısını belirledi: veritabanına dokunan her istekte girdi doğrulama, çalınan bir çereze karşı dayanıklı oturum yönetimi ve uygulamanın root olarak çalışmadığı, gereğinden fazlasını dışarı açmadığı bir Docker yayını.

## Neden böyle kurgulandı

Önce uygulamayı yazıp sonra ona saldırmak işin özüydü. Bir zafiyet listesini okumak size problemin adını öğretiyor; kendi satın alma akışınızın başkasının biletini teslim ettiğini görmek ise önlemin neden o biçimde olduğunu öğretiyor. Yığını bilinçli olarak küçük tutmak, yani tek konteynerde PHP ve SQLite, hiçbir şeyin bir framework'ün arkasına saklanmamasını sağladı: her girdi yolu ve her oturum kararı benim yazdığım ve kırabildiğim koddu.

## Ne öğrendim

Fark yaratan düzeltmeler egzotik olanlar değildi. Bulduklarımın çoğu istemciden gelen bir değere güvenmeye dayanıyordu ve bunu kapatan kalıp hep aynıydı: sınırda doğrula, güvenilen durumu sunucuda tut ve kısayolun yaşadığı yerin yayın adımı olmasına asla izin verme. Konteyneri sertleştirmek de aynı dersin parçası çıktı, çünkü izin veren bir sunucu üstünde iyi yazılmış bir uygulama hâlâ izin veren bir sistemdir.
```

- [ ] **Step 5: İçeriği derle ve iki dilin de tanındığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content
node -e "const p=require('./.velite/projects.json');console.log(p.map(x=>x.locale+':'+x.slug).sort().join(' '))"
```

Beklenen çıktı:

```
en:cargo-pilot en:ticket-purchasing-system tr:cargo-pilot tr:ticket-purchasing-system
```

- [ ] **Step 6: Uzun çizgi taraması yap**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" content/projects/en/*.mdx content/projects/tr/*.mdx; echo "exit=$?"
```

Beklenen çıktı: `exit=1` (eşleşme yok).

- [ ] **Step 7: Testleri çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm test
```

Beklenen: tüm testler PASS (`getProjectLocales("cargo-pilot")` artık `["en","tr"]` döner).

- [ ] **Step 8: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add content/projects
git commit -m "feat(content): write cargo pilot and ticket purchasing case studies in en and tr"
```

---

### Task 4: Kalan case study'ler (Wikonya, Hubit, GPA) EN + TR

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/wikonya.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/tr/wikonya.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/hubit.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/tr/hubit.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/en/gpa-calculator.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/projects/tr/gpa-calculator.mdx`

**Interfaces:**
- Consumes: Task 1'deki Velite `projects` şeması; alanlar `title`, `slug`, `summary`, `role`, `stack[]`, `year`, `links{live?,repo?}`, `cover?`, `outcome`, `featured?`, `order`.
- Produces: `wikonya` (order 3), `hubit` (order 4), `gpa-calculator` (order 5) slug'ları, hepsi `en` ve `tr` locale'lerinde; hiçbiri `featured` değil. Toplam 5 proje, 10 MDX dosyası.

- [ ] **Step 1: `content/projects/en/wikonya.mdx`**

```mdx
---
title: Wikonya
slug: wikonya
summary: An open source knowledge platform for students in Konya: academic resources, housing guides, events and a personal dashboard.
role: Frontend Developer
stack:
  - TypeScript
  - React
year: 2024
links:
  live: https://wikonya.vercel.app
  repo: https://github.com/dogancanyildiz/wikonya
outcome: Information that was scattered across group chats now lives in one public, searchable place.
order: 3
---

## What I did

Wikonya is a knowledge sharing platform for local students, built at Divizyon and open sourced on GitHub. I worked on the frontend in TypeScript and React, building the sections that hold academic resources, housing guides, career opportunities, events, discussion forums and a personal dashboard.

## Why it was built this way

The information already existed, it was just trapped in group chats and expired posts, which meant every new student started from zero. Making the project open source was part of the answer: a community platform that students cannot read the source of, or contribute a correction to, has the same trust problem as the group chat it replaces.

## What I learned

Breadth is the hard part in a project like this. Six sections with different shapes push you toward one generic component that fits none of them well, and the useful discipline was deciding early which parts genuinely shared a layout and which only looked similar from a distance.
```

- [ ] **Step 2: `content/projects/tr/wikonya.mdx`**

```mdx
---
title: Wikonya
slug: wikonya
summary: Konya'daki öğrenciler için açık kaynak bilgi platformu: akademik kaynaklar, barınma rehberleri, etkinlikler ve kişisel panel.
role: Frontend Geliştirici
stack:
  - TypeScript
  - React
year: 2024
links:
  live: https://wikonya.vercel.app
  repo: https://github.com/dogancanyildiz/wikonya
outcome: Grup sohbetlerine dağılmış bilgi, tek ve herkese açık, aranabilir bir yere taşındı.
order: 3
---

## Ne yaptım

Wikonya, Divizyon'da geliştirilen ve GitHub'da açık kaynak olarak yayınlanan, yerel öğrenciler için bir bilgi paylaşım platformu. Frontend tarafında TypeScript ve React ile çalıştım; akademik kaynaklar, barınma rehberleri, kariyer fırsatları, etkinlikler, tartışma forumları ve kişisel panel bölümlerini geliştirdim.

## Neden böyle kurgulandı

Bilgi zaten vardı, yalnızca grup sohbetlerinde ve süresi dolmuş paylaşımlarda sıkışıp kalmıştı; bu da her yeni öğrencinin sıfırdan başlaması demekti. Projeyi açık kaynak yapmak cevabın bir parçasıydı: kaynağını okuyamadığınız veya bir düzeltme gönderemediğiniz bir topluluk platformu, yerini aldığı grup sohbetiyle aynı güven sorununu taşır.

## Ne öğrendim

Böyle bir projede zor kısım genişlik. Birbirinden farklı altı bölüm, sizi hiçbirine tam uymayan tek bir genel bileşene doğru itiyor; işe yarayan disiplin, hangi parçaların gerçekten aynı düzeni paylaştığına ve hangilerinin yalnızca uzaktan benzediğine erken karar vermekti.
```

- [ ] **Step 3: `content/projects/en/hubit.mdx`**

```mdx
---
title: Hubit
slug: hubit
summary: Interactive 3D visualizations on the web, built with Three.js and tuned for smooth interaction on ordinary hardware.
role: Frontend Engineer and UI Designer
stack:
  - Three.js
  - JavaScript
year: 2024
outcome: The scene stays interactive on mid range laptops instead of only on a developer machine.
order: 4
---

## What I did

At Divizyon I built the interactive 3D layer of Hubit with Three.js and designed the interface around it. The work split into two halves: getting the scene to read clearly as a user interface rather than a demo, and getting it to stay responsive while it does.

## Why it was built this way

A 3D view earns its place only when it shows something a flat layout cannot. That constraint drove the design: every control had a plain counterpart, and the camera never moved in a way the user did not ask for, because a scene that moves on its own is a scene people stop trusting.

## What I learned

Rendering performance on the web is mostly a budgeting problem. The frame cost is decided long before the render loop, in how many objects exist, how many materials they share and how much work happens per frame that could have happened once. Profiling on a mid range laptop instead of my own machine changed which optimizations were worth doing.
```

- [ ] **Step 4: `content/projects/tr/hubit.mdx`**

```mdx
---
title: Hubit
slug: hubit
summary: Three.js ile geliştirilen, sıradan donanımda da akıcı kalacak şekilde ayarlanmış etkileşimli web tabanlı 3B görselleştirmeler.
role: Frontend Mühendisi ve Arayüz Tasarımcısı
stack:
  - Three.js
  - JavaScript
year: 2024
outcome: Sahne yalnızca geliştirici makinesinde değil, orta seviye dizüstü bilgisayarlarda da etkileşimli kalıyor.
order: 4
---

## Ne yaptım

Divizyon'da Hubit'in etkileşimli 3B katmanını Three.js ile geliştirdim ve etrafındaki arayüzü tasarladım. İş iki yarıya ayrıldı: sahnenin bir demo gibi değil bir kullanıcı arayüzü gibi okunmasını sağlamak ve bunu yaparken tepkisel kalmasını sağlamak.

## Neden böyle kurgulandı

Bir 3B görünüm, ancak düz bir düzenin gösteremeyeceği bir şeyi gösterdiğinde yerini hak eder. Bu kısıt tasarımı belirledi: her kontrolün düz bir karşılığı vardı ve kamera kullanıcının istemediği bir biçimde hiç hareket etmedi, çünkü kendi kendine hareket eden bir sahne insanların güvenmeyi bıraktığı bir sahnedir.

## Ne öğrendim

Web'de render performansı büyük ölçüde bir bütçe problemi. Kare maliyeti render döngüsünden çok önce belirleniyor: kaç nesne var, kaç materyal paylaşılıyor ve her karede bir kez yapılabilecek ne kadar iş tekrar ediliyor. Kendi makinem yerine orta seviye bir dizüstü bilgisayarda ölçüm almak, hangi optimizasyonun değdiğini değiştirdi.
```

- [ ] **Step 5: `content/projects/en/gpa-calculator.mdx`**

```mdx
---
title: GPA Calculator
slug: gpa-calculator
summary: A small grade calculator that tracks quiz, midterm and final scores and computes a running GPA.
role: Personal project
stack:
  - JavaScript
year: 2023
links:
  live: https://dogancanyildiz.github.io/gpa
  repo: https://github.com/dogancanyildiz/gpa
outcome: A single page tool with no backend, used by classmates through a term.
order: 5
---

## What I did

I wrote a grade calculator that takes quiz, midterm and final scores and computes a running GPA, then published it as a static page on GitHub Pages. No backend, no accounts, no storage beyond the browser.

## Why it was built this way

The problem was small and the audience was students who wanted an answer in ten seconds. Anything that asked for a sign up would have been slower than the spreadsheet it replaced, so the constraint was to keep it to one page that works on a phone in a corridor between classes.

## What I learned

Small tools survive on how quickly they explain themselves. Most of the effort went into the input layout and into what the page shows before you have typed anything, which is a different skill from the one a larger project exercises.
```

- [ ] **Step 6: `content/projects/tr/gpa-calculator.mdx`**

```mdx
---
title: Not Ortalaması Hesaplayıcı
slug: gpa-calculator
summary: Quiz, vize ve final notlarını takip edip anlık ortalama hesaplayan küçük bir araç.
role: Kişisel proje
stack:
  - JavaScript
year: 2023
links:
  live: https://dogancanyildiz.github.io/gpa
  repo: https://github.com/dogancanyildiz/gpa
outcome: Sunucusuz, tek sayfalık bir araç; bir dönem boyunca sınıf arkadaşlarım kullandı.
order: 5
---

## Ne yaptım

Quiz, vize ve final notlarını alıp anlık ortalama hesaplayan bir araç yazdım ve GitHub Pages üzerinde statik bir sayfa olarak yayınladım. Sunucu yok, hesap yok, tarayıcının dışında saklama yok.

## Neden böyle kurgulandı

Problem küçüktü ve hedef kitle cevabı on saniyede isteyen öğrencilerdi. Kayıt isteyen her şey, yerini aldığı hesap tablosundan daha yavaş olurdu; bu yüzden kısıt, ders arası koridorda telefonda çalışan tek bir sayfada kalmaktı.

## Ne öğrendim

Küçük araçlar kendilerini ne kadar hızlı anlattıklarıyla yaşıyor. Emeğin çoğu girdi düzenine ve siz hiçbir şey yazmadan önce sayfanın ne gösterdiğine gitti; bu, daha büyük bir projenin çalıştırdığından farklı bir beceri.
```

- [ ] **Step 7: İçeriği derle ve on dosyanın da geçerli olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content
node -e "const p=require('./.velite/projects.json');console.log(p.length);console.log(p.filter(x=>x.locale==='en').map(x=>x.order+':'+x.slug).sort().join(' '))"
```

Beklenen çıktı:

```
10
1:cargo-pilot 2:ticket-purchasing-system 3:wikonya 4:hubit 5:gpa-calculator
```

- [ ] **Step 8: Her slug'ın iki dilde de var olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "
const p=require('./.velite/projects.json');
const en=new Set(p.filter(x=>x.locale==='en').map(x=>x.slug));
const tr=new Set(p.filter(x=>x.locale==='tr').map(x=>x.slug));
const missing=[...en].filter(s=>!tr.has(s)).concat([...tr].filter(s=>!en.has(s)));
console.log(missing.length===0?'all project slugs translated':'missing: '+missing.join(','));
"
```

Beklenen çıktı: `all project slugs translated`

- [ ] **Step 9: Uzun çizgi taraması**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rn "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" content/; echo "exit=$?"
```

Beklenen çıktı: `exit=1`.

- [ ] **Step 10: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add content/projects
git commit -m "feat(content): add wikonya, hubit and gpa calculator case studies in en and tr"
```

---

### Task 5: Projects listesi ve ana sayfa öne çıkanlar Velite'a bağlanır, `src/data/projects.ts` kaldırılır

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-grid.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-card.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/projects/page.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/page.tsx`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/data/projects.ts`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/projects-section.tsx`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/featured-projects.tsx`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-row.tsx` (Faz 3 çıktısı, tek tüketicisi silinen `projects-section.tsx` idi)

**Interfaces:**
- Consumes: `getProjects(locale)`, `getFeaturedProjects(locale)`, `toProjectCardData(project)`, `ProjectCardData`, `Locale` (Task 2); `buildAlternates(currentLocale, path, availableLocales)` (Task 2); `routing` (`src/i18n/routing.ts`), `Link` (`src/i18n/navigation.ts`); Faz 3'ten `staggerDelay(index)` ve `MAX_STAGGER_ITEMS` (`src/lib/motion.ts`) ile `MotionProvider` (`src/components/motion-provider.tsx`).
- Produces:
  - `<ProjectGrid projects={ProjectCardData[]} />` (client bileşen, LazyMotion sarmalı)
  - `<ProjectCard project={ProjectCardData} index={number} />` (client bileşen)
  - `messages` anahtarları: `projects.title`, `projects.description`, `projects.role`, `projects.year`, `projects.stack`, `home.featuredTitle`, `home.featuredLink` (metinleri Task 11'de yazılır)

- [ ] **Step 1: `src/components/sections/project-card.tsx` dosyasını tamamen değiştir**

```tsx
"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProjectCardData } from "@/lib/content";
import { staggerDelay } from "@/lib/motion";

interface ProjectCardProps {
  project: ProjectCardData;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const t = useTranslations("projects");
  const reduceMotion = useReducedMotion();
  // Faz 3'un hareket butcesi: 40ms/eleman, en fazla 4 eleman. Sayiyi burada
  // tekrar yazmak yerine tek kaynaktan (src/lib/motion.ts) okunuyor.
  const delay = reduceMotion ? 0 : staggerDelay(index);

  return (
    <m.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="surface-panel relative flex h-full flex-col gap-4 p-6"
    >
      {project.cover ? (
        <Image
          src={project.cover.src}
          alt=""
          width={project.cover.width}
          height={project.cover.height}
          placeholder="blur"
          blurDataURL={project.cover.blurDataURL}
          sizes="(min-width: 1024px) 32rem, 100vw"
          className="h-40 w-full rounded-[1.25rem] object-cover"
        />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl leading-tight">
          <Link href={project.href} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{project.summary}</p>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.14em]">
        <div>
          <dt className="text-muted-foreground">{t("role")}</dt>
          <dd className="text-foreground">{project.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("year")}</dt>
          <dd className="text-foreground">{project.year}</dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-[0.08em] text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </m.article>
  );
}
```

Not: kartın tamamı `Link`'e sarılmıyor; başlık link, tıklama alanı `after:absolute after:inset-0` ile genişletiliyor (Faz 3 kararı).

- [ ] **Step 2: `src/components/sections/project-grid.tsx` dosyasını oluştur**

```tsx
"use client";

import { ProjectCard } from "@/components/sections/project-card";
import { MotionProvider } from "@/components/motion-provider";
import type { ProjectCardData } from "@/lib/content";

interface ProjectGridProps {
  projects: ProjectCardData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <MotionProvider>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <ProjectCard key={project.slug} project={project} index={index} />
        ))}
      </div>
    </MotionProvider>
  );
}
```

Faz 3'ün `MotionProvider` bileşeni tam olarak `<LazyMotion features={domAnimation} strict>` sarmalıdır; `domAnimation` seçimi orada gerekçelendirildi, burada tekrar edilmez.

- [ ] **Step 3: `src/app/[lang]/projects/page.tsx` dosyasını tamamen değiştir**

```tsx
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/sections/project-grid";
import { routing } from "@/i18n/routing";
import { getProjects, toProjectCardData, type Locale } from "@/lib/content";
import { buildAlternates } from "@/lib/seo/alternates";

interface ProjectsPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: ProjectsPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  const t = await getTranslations({ locale: lang, namespace: "projects" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(lang as Locale, "/projects", ["en", "tr"]),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "projects" });
  const projects = getProjects(lang as Locale).map(toProjectCardData);

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <header className="max-w-2xl space-y-4">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("description")}</p>
        </header>
        <ProjectGrid projects={projects} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `src/app/[lang]/page.tsx` içindeki öne çıkan projeler bloğunu Velite'a bağla**

`FeaturedProjects` import'unu ve kullanımını sil, yerine şunu koy. Dosyanın üst kısmındaki import'lara ekle:

```tsx
import { ProjectGrid } from "@/components/sections/project-grid";
import { getFeaturedProjects, toProjectCardData, type Locale } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
```

(`getTranslations` zaten import ediliyorsa satırı tekrar ekleme.)

`setRequestLocale(lang)` çağrısından sonra ekle:

```tsx
  const tHome = await getTranslations({ locale: lang, namespace: "home" });
  const featured = getFeaturedProjects(lang as Locale).map(toProjectCardData);
```

`<FeaturedProjects />` kullanımını şununla değiştir:

```tsx
      <section className="section-space">
        <div className="page-shell space-y-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl">{tHome("featuredTitle")}</h2>
            <Link href="/projects" className="text-sm text-primary underline-offset-4 hover:underline">
              {tHome("featuredLink")}
            </Link>
          </div>
          <ProjectGrid projects={featured} />
        </div>
      </section>
```

- [ ] **Step 5: Şablon veri dosyalarını sil**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm src/data/projects.ts src/components/sections/projects-section.tsx src/components/sections/featured-projects.tsx
grep -rn "data/projects\|projects-section\|featured-projects" src/ || echo "no references left"
```

Beklenen çıktı: `no references left`.

- [ ] **Step 6: Build al ve route'ların statik olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
```

Beklenen: build başarılı; route listesinde `/[lang]/projects` ve `/[lang]/projects/[slug]` statik (○ veya SSG) işaretli, dynamic (ƒ) yalnızca `/api/*` altında.

- [ ] **Step 7: Kapıları çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
```

Beklenen: üçü de 0 exit code.

- [ ] **Step 8: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add -A src messages
git commit -m "feat(projects): render project list from velite and drop template project data"
```

---

### Task 6: Proje detay sayfası: case study künyesi, kapak ve CreativeWork JSON-LD

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/projects/[slug]/page.tsx`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/project-detail.tsx`

**Interfaces:**
- Consumes: `getProject(locale, slug)`, `getProjectSlugs(locale)`, `getProjectLocales(slug)`, `Locale` (Task 2); `buildAlternates`, `absoluteUrl` (Task 2); `<MDXContent code />` (Task 2); `<JsonLd data />` (Task 2); `routing`, `Link`.
- Produces: `/projects/<slug>` ve `/tr/projects/<slug>` statik route'ları; her sayfada 4 hücreli mono künye (Role / Stack / Year / Outcome) ve `CreativeWork` JSON-LD.

- [ ] **Step 1: `src/app/[lang]/projects/[slug]/page.tsx` dosyasını tamamen değiştir**

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXContent } from "@/components/content/mdx-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getProject,
  getProjectLocales,
  getProjectSlugs,
  type Locale,
} from "@/lib/content";
import { absoluteUrl, buildAlternates } from "@/lib/seo/alternates";

interface ProjectPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getProjectSlugs(lang as Locale).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const project = getProject(lang as Locale, slug);
  if (!project) notFound();

  return {
    title: project.title,
    description: project.summary,
    alternates: buildAlternates(
      lang as Locale,
      `/projects/${slug}`,
      getProjectLocales(slug),
    ),
    openGraph: {
      title: project.title,
      description: project.summary,
      type: "article",
      url: absoluteUrl(lang as Locale, `/projects/${slug}`),
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const project = getProject(lang as Locale, slug);
  if (!project) notFound();

  const t = await getTranslations({ locale: lang, namespace: "projects" });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    abstract: project.summary,
    inLanguage: lang,
    dateCreated: String(project.year),
    keywords: project.stack.join(", "),
    url: absoluteUrl(lang as Locale, `/projects/${slug}`),
    creator: {
      "@type": "Person",
      name: "Doğan Can Yıldız",
      url: absoluteUrl("en", "/"),
    },
  };

  return (
    <article className="section-space">
      <JsonLd data={structuredData} />
      <div className="page-shell-reading space-y-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>

        <header className="space-y-6">
          <h1 className="text-4xl leading-tight sm:text-5xl">{project.title}</h1>
          <p className="section-copy">{project.summary}</p>

          <dl className="grid gap-x-6 gap-y-4 border-y border-border py-6 font-mono text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("role")}
              </dt>
              <dd className="text-foreground">{project.role}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("stack")}
              </dt>
              <dd className="text-foreground">{project.stack.join(" · ")}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("year")}
              </dt>
              <dd className="text-foreground">{project.year}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("outcome")}
              </dt>
              <dd className="text-foreground">{project.outcome}</dd>
            </div>
          </dl>

          {project.links.live || project.links.repo ? (
            <div className="flex flex-wrap gap-3">
              {project.links.live ? (
                <Button asChild size="sm">
                  <a href={project.links.live} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    {t("viewLive")}
                  </a>
                </Button>
              ) : null}
              {project.links.repo ? (
                <Button asChild variant="outline" size="sm">
                  <a href={project.links.repo} target="_blank" rel="noopener noreferrer">
                    <Github className="size-4" />
                    {t("viewSource")}
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </header>

        {project.cover ? (
          <Image
            src={project.cover.src}
            alt={project.title}
            width={project.cover.width}
            height={project.cover.height}
            placeholder="blur"
            blurDataURL={project.cover.blurDataURL}
            sizes="(min-width: 1024px) 48rem, 100vw"
            className="w-full rounded-[1.5rem] border border-border object-cover"
            priority
          />
        ) : null}

        <div className="prose-content">
          <MDXContent code={project.code} />
        </div>
      </div>
    </article>
  );
}
```

Not: `project.cover` yoksa hiçbir görsel alanı render edilmiyor; CSS gradyan kapak eklenmiyor (08-icerik-stratejisi.md karar 2).

- [ ] **Step 2: Eski detay bileşenini sil**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm src/components/sections/project-detail.tsx
grep -rn "project-detail" src/ || echo "no references left"
```

Beklenen çıktı: `no references left`.

- [ ] **Step 3: `globals.css`'e MDX gövdesi için `prose-content` sınıfını ekle**

`src/app/globals.css` sonuna ekle:

```css
@layer components {
  .prose-content {
    @apply space-y-5 text-base leading-7 text-foreground/85;
  }
  .prose-content h2 {
    @apply mt-10 text-2xl leading-snug text-foreground;
  }
  .prose-content h3 {
    @apply mt-8 text-xl leading-snug text-foreground;
  }
  .prose-content a {
    @apply text-primary underline underline-offset-4;
  }
  .prose-content ul {
    @apply list-disc space-y-2 pl-6;
  }
  .prose-content ol {
    @apply list-decimal space-y-2 pl-6;
  }
  .prose-content pre {
    @apply overflow-x-auto rounded-[1.25rem] border border-border p-4 font-mono text-sm;
  }
  .prose-content :not(pre) > code {
    @apply rounded border border-border px-1.5 py-0.5 font-mono text-[0.85em];
  }
}
```

- [ ] **Step 4: Build al ve on proje sayfasının da üretildiğini doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
find .next/server/app -path "*projects*" -name "*.html" | sort
```

Beklenen: EN için 5, TR için 5, toplam 10 proje detay HTML dosyası listelenir.

- [ ] **Step 5: Çalışan sunucuda künyeyi ve JSON-LD'yi doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/projects/cargo-pilot | grep -o "CreativeWork"
curl -s http://localhost:3000/projects/cargo-pilot | grep -o "DevOps Chapter Lead"
curl -s http://localhost:3000/tr/projects/ticket-purchasing-system | grep -o "Bilet Satın Alma Sistemi"
kill %1
```

Beklenen çıktı sırasıyla: `CreativeWork`, `DevOps Chapter Lead`, `Bilet Satın Alma Sistemi`.

- [ ] **Step 6: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src
git commit -m "feat(projects): render case study detail from velite with creativework json-ld"
```

---

### Task 7: Blog listesi sayfası

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/blog/page.tsx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/post-list.tsx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/blog/tr/self-hosting-with-coolify.mdx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/header.tsx`

**Interfaces:**
- Consumes: `getPosts(locale)`, `toPostCardData(post)`, `PostCardData`, `Locale` (Task 2); `buildAlternates` (Task 2); `routing`, `Link`.
- Produces:
  - `<PostList posts={PostCardData[]} />` (client bileşen, LazyMotion sarmalı)
  - `/blog` ve `/tr/blog` statik route'ları
  - `messages` anahtarları: `blog.title`, `blog.description`, `blog.readingTime`, `blog.empty`, `nav.blog` (metinler Task 11'de)

Not: liste sayfasının boş olmaması için ilk blog yazısı bu task'ta ekleniyor; kalan yazılar Task 14'te.

- [ ] **Step 1: İlk blog yazısını oluştur**

`content/blog/tr/self-hosting-with-coolify.mdx`:

```mdx
---
title: Kendi sunucumda Coolify ve Traefik ile yayına almak
slug: self-hosting-with-coolify
date: 2026-08-20
summary: Bu siteyi Vercel yerine kendi sunucumda çalıştırıyorum. Coolify, Traefik ve Docker ile kurduğum hattın nasıl çalıştığını ve nerede tökezlediğimi anlatıyorum.
tags:
  - devops
  - coolify
  - docker
---

## Neden kendi sunucum

Bu siteyi yönetilen bir platformda barındırmak on dakikalık bir iş olurdu. Kendi sunucumda çalıştırmak ise sitenin kendisini bir iddianın kanıtına çeviriyor: DevOps yaptığını söyleyen bir portfolyonun, üstünde durduğu altyapıyı da göstermesi gerektiğini düşünüyorum.

## Hat nasıl çalışıyor

Uygulama çok aşamalı bir Dockerfile ile derleniyor; `deps`, `builder` ve `runner` aşamaları ayrı, çalışan konteyner root olmayan bir kullanıcıya düşüyor ve yalnızca `.next/standalone`, `.next/static` ve `public` klasörlerini taşıyor. Coolify, GitHub App entegrasyonu üzerinden depoyu izliyor: main dalına giden her commit otomatik bir yayın tetikliyor, açılan her pull request kendi önizleme adresini alıyor. Önde Traefik duruyor, TLS sonlandırma ve yönlendirme orada.

## Nerede tökezledim

İlk tökezleme sağlık kontrolüydü. Node tabanlı konteynerlerde Coolify'ın sağlık kontrolünün bağlantı reddi vermesi bilinen bir sorun, bu yüzden kontrolü production'a bağlamadan önce staging'de doğrulamak gerekiyor. İkincisi ortam değişkenlerinin katmanıydı: `NEXT_PUBLIC_` ile başlayan değerler derleme sırasında paket içine gömülüyor, yalnızca çalışma zamanı olarak işaretlenirse üretimde sessizce tanımsız kalıyorlar. Bunun tersi daha kötü: bir API anahtarını derleme değişkeni yapmak onu imaj katmanlarına ve derleme günlüklerine sızdırabiliyor.

## Ne kazandım

Yayın adımının tamamı bir komuta indi ve altyapının her parçası depoda duruyor. Karşılığında ödediğim bedel bakım: sunucu, sertifika ve güncellemeler artık benim işim. Kişisel bir site için bu değişim bana değdi, çünkü öğrenmek istediğim şey tam olarak buydu.
```

- [ ] **Step 2: `src/components/sections/post-list.tsx` oluştur**

```tsx
"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PostCardData } from "@/lib/content";

interface PostListProps {
  posts: PostCardData[];
}

export function PostList({ posts }: PostListProps) {
  const t = useTranslations("blog");
  const format = useFormatter();
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <ul className="divide-y divide-border border-y border-border">
        {posts.map((post, index) => (
          <m.li
            key={post.slug}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.3,
              delay: reduceMotion ? 0 : Math.min(index, 3) * 0.04,
              ease: "easeOut",
            }}
            className="relative py-6"
          >
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <time dateTime={post.date}>
                {format.dateTime(new Date(post.date), { dateStyle: "long" })}
              </time>
              <span aria-hidden="true"> · </span>
              {t("readingTime", { minutes: post.readingTime })}
            </p>
            <h2 className="mt-2 text-2xl leading-snug">
              <Link href={post.href} className="after:absolute after:inset-0">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.summary}</p>
          </m.li>
        ))}
      </ul>
    </LazyMotion>
  );
}
```

- [ ] **Step 3: `src/app/[lang]/blog/page.tsx` oluştur**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostList } from "@/components/sections/post-list";
import { routing } from "@/i18n/routing";
import { getPosts, toPostCardData, type Locale } from "@/lib/content";
import { buildAlternates } from "@/lib/seo/alternates";

interface BlogPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  const t = await getTranslations({ locale: lang, namespace: "blog" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(lang as Locale, "/blog", ["en", "tr"]),
    openGraph: { title: t("title"), description: t("description"), type: "website" },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "blog" });
  const posts = getPosts(lang as Locale).map(toPostCardData);

  return (
    <section className="section-space">
      <div className="page-shell-reading space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("description")}</p>
        </header>
        {posts.length > 0 ? (
          <PostList posts={posts} />
        ) : (
          <p className="section-copy">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
```

Not: `/blog` (EN) yazı listesi Task 14'te EN çevirisi eklenene kadar boş kalır ve `blog.empty` metnini gösterir. Bu bilinçli: çevirisi olmayan TR yazısı EN listesine, EN sitemap'ine ve hreflang alternates'ine girmez.

- [ ] **Step 4: Header'a Blog linkini ekle**

`src/components/layout/header.tsx` içindeki gezinme dizisini şu hale getir:

```tsx
const navItems = [
  { href: "/about", key: "about" },
  { href: "/projects", key: "projects" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;
```

Aynı diziyi mobil menü (Radix Dialog) bloğu da kullanıyorsa ayrı bir değişiklik gerekmez; ayrı bir liste varsa aynı dört maddeyi oraya da yaz.

- [ ] **Step 5: Build al ve blog route'larını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr/blog
curl -s http://localhost:3000/tr/blog | grep -o "Coolify ve Traefik"
kill %1
```

Beklenen çıktı: `200`, `200`, `Coolify ve Traefik`.

- [ ] **Step 6: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src content messages
git commit -m "feat(blog): add blog index page and first turkish post"
```

---

### Task 8: Blog detay sayfası ve BlogPosting JSON-LD

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getPost(locale, slug)`, `getPostSlugs(locale)`, `getPostLocales(slug)`, `Locale` (Task 2); `buildAlternates`, `absoluteUrl` (Task 2); `<MDXContent code />`, `<JsonLd data />` (Task 2); `routing`, `Link`; `.prose-content` sınıfı (Task 6).
- Produces: `/blog/<slug>` ve `/tr/blog/<slug>` statik route'ları; her yazıda `BlogPosting` JSON-LD.

- [ ] **Step 1: `src/app/[lang]/blog/[slug]/page.tsx` dosyasını yaz**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { MDXContent } from "@/components/content/mdx-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPost, getPostLocales, getPostSlugs, type Locale } from "@/lib/content";
import { absoluteUrl, buildAlternates } from "@/lib/seo/alternates";

interface PostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    getPostSlugs(lang as Locale).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const post = getPost(lang as Locale, slug);
  if (!post) notFound();

  return {
    title: post.title,
    description: post.summary,
    alternates: buildAlternates(lang as Locale, `/blog/${slug}`, getPostLocales(slug)),
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      url: absoluteUrl(lang as Locale, `/blog/${slug}`),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const post = getPost(lang as Locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale: lang, namespace: "blog" });
  const format = await getFormatter({ locale: lang });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: lang,
    keywords: post.tags.join(", "),
    wordCount: post.metadata.wordCount,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(lang as Locale, `/blog/${slug}`),
    },
    author: {
      "@type": "Person",
      name: "Doğan Can Yıldız",
      url: absoluteUrl("en", "/"),
    },
  };

  return (
    <article className="section-space">
      <JsonLd data={structuredData} />
      <div className="page-shell-reading space-y-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>

        <header className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <time dateTime={post.date}>
              {format.dateTime(new Date(post.date), { dateStyle: "long" })}
            </time>
            <span aria-hidden="true"> · </span>
            {t("readingTime", { minutes: Math.max(1, Math.round(post.metadata.readingTime)) })}
          </p>
          <h1 className="text-4xl leading-tight sm:text-5xl">{post.title}</h1>
          <p className="section-copy">{post.summary}</p>
          {post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-[0.08em] text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="prose-content">
          <MDXContent code={post.code} />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Build al ve yazı sayfasını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/tr/blog/self-hosting-with-coolify | grep -o "BlogPosting"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog/self-hosting-with-coolify
kill %1
```

Beklenen çıktı: `BlogPosting`, ardından `404` (EN çevirisi Task 14'te eklenecek, o zamana kadar route üretilmiyor; bu doğru davranış).

- [ ] **Step 3: hreflang alternates'inde yalnızca TR'nin göründüğünü doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/tr/blog/self-hosting-with-coolify | grep -o 'hreflang="[a-z-]*"' | sort -u
kill %1
```

Beklenen çıktı:

```
hreflang="tr"
hreflang="x-default"
```

`hreflang="en"` çıkmamalı.

- [ ] **Step 4: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src
git commit -m "feat(blog): add post detail page with blogposting json-ld"
```

---

### Task 9: RSS feed ve proxy matcher

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/feed.xml/route.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/proxy.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/layout.tsx`

**Interfaces:**
- Consumes: `getPosts(locale)`, `Locale` (Task 2); `absoluteUrl` (Task 2); `routing`.
- Produces: `/feed.xml` (EN) ve `/tr/feed.xml` (TR) statik route handler'ları, `application/rss+xml` içerik tipiyle; `<link rel="alternate" type="application/rss+xml">` head girdisi.

Kritik not: next-intl'in varsayılan proxy matcher'ı yolda nokta içeren istekleri (`.*\..*`) hariç tutar, bu yüzden `/feed.xml` düzeltilmezse EN feed'i 404 döner. Step 2 bunu kapatır.

- [ ] **Step 1: `src/app/[lang]/feed.xml/route.ts` dosyasını yaz**

```ts
import { routing } from "@/i18n/routing";
import { getPosts, type Locale } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

const CHANNEL: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Doğan Can Yıldız",
    description:
      "Notes on full-stack development, self-hosted infrastructure and web security.",
  },
  tr: {
    title: "Doğan Can Yıldız",
    description:
      "Full-stack geliştirme, kendi sunucusunda barındırma ve web güvenliği üzerine notlar.",
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const locale: Locale = lang === "tr" ? "tr" : "en";
  const channel = CHANNEL[locale];
  const posts = getPosts(locale);
  const feedUrl = absoluteUrl(locale, "/feed.xml");
  const blogUrl = absoluteUrl(locale, "/blog");

  const items = posts
    .map((post) => {
      const url = absoluteUrl(locale, `/blog/${post.slug}`);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
```

- [ ] **Step 2: `src/proxy.ts` matcher'ını güncelle**

Dosyanın tamamı:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware({
  ...routing,
  localeDetection: false,
});

export const config = {
  matcher: [
    // kök ve locale önekli tüm yollar
    "/",
    "/(en|tr)/:path*",
    // nokta içerdiği için aşağıdaki genel desene takılmayan feed
    "/feed.xml",
    // /api, /_next, /_vercel ve nokta içeren dosya yolları hariç her şey
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
```

- [ ] **Step 3: `src/app/[lang]/layout.tsx` içinde feed linkini Metadata API ile bildir**

Elle `<link>` etiketi eklenmez. `generateMetadata` dönüş nesnesindeki mevcut `alternates` alanına `types` anahtarını ekle (alan yoksa `alternates` alanını bu içerikle oluştur):

```tsx
    alternates: {
      types: {
        "application/rss+xml": [
          {
            url: absoluteUrl(lang as Locale, "/feed.xml"),
            title: "Doğan Can Yıldız",
          },
        ],
      },
    },
```

Import satırını ekle:

```tsx
import { absoluteUrl } from "@/lib/seo/alternates";
import type { Locale } from "@/lib/content";
```

- [ ] **Step 4: Build al ve iki feed'i de doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s -o /dev/null -w "en=%{http_code} %{content_type}\n" http://localhost:3000/feed.xml
curl -s -o /dev/null -w "tr=%{http_code} %{content_type}\n" http://localhost:3000/tr/feed.xml
curl -s http://localhost:3000/tr/feed.xml | grep -c "<item>"
kill %1
```

Beklenen çıktı:

```
en=200 application/rss+xml; charset=utf-8
tr=200 application/rss+xml; charset=utf-8
1
```

`en=404` görülürse Step 2'deki matcher uygulanmamış demektir; `src/proxy.ts` dosyasını kontrol et.

- [ ] **Step 5: XML'in geçerli olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/tr/feed.xml | python3 -c "import sys,xml.dom.minidom as m; m.parseString(sys.stdin.read()); print('valid xml')"
kill %1
```

Beklenen çıktı: `valid xml`.

- [ ] **Step 6: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src
git commit -m "feat(blog): add per locale rss feed and allow feed.xml through the proxy matcher"
```

---

### Task 10: sitemap ve robots yalnızca var olan çevirileri listeler

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/sitemap.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/robots.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `getProjects`, `getPosts`, `getProjectLocales`, `getPostLocales`, `Locale` (Task 2); `absoluteUrl`, `siteUrl` (Task 2).
- Produces: `sitemap(): MetadataRoute.Sitemap` (default export), her girdi `url`, `lastModified`, `changeFrequency`, `priority` ve `alternates.languages` içerir; `robots(): MetadataRoute.Robots` `/api/` yolunu engeller.

- [ ] **Step 1: Başarısız olan sitemap testini yaz**

`tests/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

const entries = sitemap();
const urls = entries.map((entry) => entry.url);

describe("sitemap", () => {
  it("lists both locales for the static pages", () => {
    expect(urls).toContain("https://dogancanyildiz.sh/");
    expect(urls).toContain("https://dogancanyildiz.sh/tr");
    expect(urls).toContain("https://dogancanyildiz.sh/about");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/about");
    expect(urls).toContain("https://dogancanyildiz.sh/blog");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/blog");
  });

  it("lists every project in both locales because all of them are translated", () => {
    expect(urls).toContain("https://dogancanyildiz.sh/projects/cargo-pilot");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/projects/cargo-pilot");
  });

  it("never lists a post url for a locale that has no translation", () => {
    const trOnly = "https://dogancanyildiz.sh/blog/self-hosting-with-coolify";
    const hasEnglishEntry = urls.includes(trOnly);
    const hasTurkishEntry = urls.includes(
      "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
    );
    expect(hasTurkishEntry).toBe(true);
    expect(hasEnglishEntry).toBe(false);
  });

  it("does not put an alternate language on an untranslated entry", () => {
    const entry = entries.find(
      (item) =>
        item.url === "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
    );
    expect(entry).toBeDefined();
    expect(entry?.alternates?.languages?.en).toBeUndefined();
    expect(entry?.alternates?.languages?.tr).toBe(
      "https://dogancanyildiz.sh/tr/blog/self-hosting-with-coolify",
    );
  });

  it("has no duplicate urls", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
```

- [ ] **Step 2: Testi çalıştır ve mevcut sitemap'in kaldığını gör**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/sitemap.test.ts
```

Beklenen: FAIL (blog ve proje girdileri eksik veya alternates yok).

- [ ] **Step 3: `src/app/sitemap.ts` dosyasını tamamen değiştir**

```ts
import type { MetadataRoute } from "next";
import {
  getPostLocales,
  getPosts,
  getProjectLocales,
  getProjects,
  type Locale,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/seo/alternates";

const LOCALES: Locale[] = ["en", "tr"];

const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

function languagesFor(path: string, locales: Locale[]): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of STATIC_PAGES) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(locale, page.path),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: languagesFor(page.path, LOCALES) },
      });
    }
  }

  for (const locale of LOCALES) {
    for (const project of getProjects(locale)) {
      const path = `/projects/${project.slug}`;
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: languagesFor(path, getProjectLocales(project.slug)) },
      });
    }

    for (const post of getPosts(locale)) {
      const path = `/blog/${post.slug}`;
      entries.push({
        url: absoluteUrl(locale, path),
        lastModified: new Date(post.date),
        changeFrequency: "yearly",
        priority: 0.6,
        alternates: { languages: languagesFor(path, getPostLocales(post.slug)) },
      });
    }
  }

  return entries;
}
```

- [ ] **Step 4: `src/app/robots.ts` dosyasını tamamen değiştir**

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/alternates";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
```

- [ ] **Step 5: Testi çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content && npx vitest run tests/sitemap.test.ts
```

Beklenen: 5 test PASS.

- [ ] **Step 6: Üretilen sitemap.xml'i doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
curl -s http://localhost:3000/sitemap.xml | grep -c "dogancanyildiz.sh/blog/self-hosting-with-coolify"
curl -s http://localhost:3000/robots.txt
kill %1
```

Beklenen: `<url>` sayısı 21 (10 statik + 10 proje + 1 TR blog yazısı); ikinci grep `0` (EN çevirisi olmayan yazı EN sitemap'ine girmiyor); `robots.txt` çıktısında `Disallow: /api/` ve `Sitemap: https://dogancanyildiz.sh/sitemap.xml` satırları var.

- [ ] **Step 7: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src tests
git commit -m "feat(seo): build sitemap and robots from velite content with per locale alternates"
```

---

### Task 11: Gerçek metinler (messages/en.json, messages/tr.json)

**Files:**
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/messages/en.json`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/messages/tr.json`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/contact-form.tsx`

**Interfaces:**
- Consumes: next-intl `useTranslations` / `getTranslations` namespace çağrıları (Task 5, 6, 7, 8 ve mevcut sayfalar).
- Produces: `brand`, `nav`, `home`, `hero`, `about`, `projects`, `blog`, `contact`, `footer` namespace'leri. Bu dosyalar Faz 4'ün metin otoritesidir; burada listelenen anahtarlar mevcut değerlerin yerine yazılır, listede olmayan mevcut anahtarlar silinmez.
- Kaynak: `.local/content/portfolio-content.md` bölüm 0, 1, 2, 9, 10.

- [ ] **Step 1: `messages/en.json` dosyasını yaz**

```json
{
  "brand": {
    "name": "Doğan Can Yıldız",
    "monogram": "DCY",
    "role": "Full-Stack Web Developer & DevOps Engineer"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "projects": "Projects",
    "blog": "Blog",
    "contact": "Contact",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "switchLanguage": "Türkçe"
  },
  "home": {
    "title": "Doğan Can Yıldız",
    "description": "Full-stack developer building scalable web apps with Next.js and Node.js, shipping on self-hosted Docker infrastructure. CAPT certified. Konya, Türkiye.",
    "featuredTitle": "Selected work",
    "featuredLink": "All projects",
    "latestPostsTitle": "Latest writing",
    "latestPostsLink": "All posts"
  },
  "hero": {
    "location": "Konya, Türkiye",
    "title": "Full-Stack Web Developer & DevOps Engineer",
    "tagline": "I build web applications and run the infrastructure they ship on.",
    "intro": "I'm a full-stack developer based in Konya, Türkiye. I build web applications with Next.js and Node.js, and I deploy them myself: Docker, GitHub Actions, Coolify and Linux servers. Alongside development I hold the CAPT certification and have completed the full Cisco CCNA track along with CyberOps Associate.",
    "viewProjects": "View projects",
    "downloadCv": "Download CV",
    "getInTouch": "Get in touch"
  },
  "about": {
    "title": "About",
    "description": "Full-stack developer in Konya, Türkiye, building web applications and running the infrastructure they ship on.",
    "lead": "Software engineer specializing in scalable, user friendly web applications with Next.js, Node.js/Express and MongoDB.",
    "body1": "I don't stop at writing the code. I build and ship on self-hosted infrastructure (Docker, GitHub Actions CI/CD, Coolify, Traefik and Linux servers) and work in Agile teams, using ClickUp for sprint planning and issue tracking.",
    "body2": "What sets my work apart is a strong networking and security foundation underneath the application layer: I'm CAPT certified, and I've completed the full Cisco CCNA track along with CyberOps Associate. This means I think about how a system is deployed, exposed and hardened, not just how it's built.",
    "body3": "Outside of work I spent two years as a GDG Konya organizer and served on the GDG Cloud Konya core team, organizing tech talks, study jams and hands-on workshops for the local developer community.",
    "nowLabel": "Now",
    "now": "Full-Stack Developer at BerrSoft, studying Mathematics and Computer Science at Necmettin Erbakan University",
    "locationLabel": "Location",
    "location": "Konya, Türkiye",
    "skillsTitle": "Skills",
    "experienceTitle": "Experience",
    "communityTitle": "Community",
    "speakingTitle": "Talks",
    "certificatesTitle": "Certificates",
    "certificateVerify": "Verify",
    "educationTitle": "Education",
    "languagesTitle": "Languages",
    "languages": "Turkish is my native language. I work in written English every day: documentation, repositories and the posts on this site.",
    "downloadCv": "Download CV"
  },
  "projects": {
    "title": "Projects",
    "description": "Five projects I shipped and still stand behind. Each one lists the role I held, the stack I used and what actually changed at the end.",
    "role": "Role",
    "stack": "Stack",
    "year": "Year",
    "outcome": "Outcome",
    "viewLive": "Live site",
    "viewSource": "Source",
    "back": "All projects"
  },
  "blog": {
    "title": "Writing",
    "description": "Notes on full-stack development, self-hosted infrastructure and web security. Posts are written in Turkish first; some of them are translated into English.",
    "readingTime": "{minutes} min read",
    "back": "All posts",
    "empty": "No English posts yet. The Turkish edition of this blog has more."
  },
  "contact": {
    "title": "Contact",
    "description": "Open to interesting projects and conversations. The fastest way to reach me is email.",
    "intro": "Open to interesting projects and conversations. The fastest way to reach me is email.",
    "emailLabel": "Email",
    "locationLabel": "Location",
    "location": "Konya, Türkiye",
    "form": {
      "name": "Name",
      "namePlaceholder": "Your name",
      "email": "Email",
      "emailPlaceholder": "you@company.com",
      "message": "Message",
      "messagePlaceholder": "What would you like to build?",
      "submit": "Send message",
      "sending": "Sending",
      "success": "Thanks, your message is on its way. I usually reply within a day.",
      "error": "The message could not be sent. Please email me directly instead.",
      "honeypotLabel": "Leave this field empty"
    }
  },
  "footer": {
    "tagline": "Full-stack development, self-hosted infrastructure, security minded engineering.",
    "copyright": "Built and self-hosted by me.",
    "emailLabel": "Email",
    "elsewhereLabel": "Elsewhere",
    "github": "GitHub",
    "linkedin": "LinkedIn",
    "rss": "RSS"
  }
}
```

- [ ] **Step 2: `messages/tr.json` dosyasını yaz**

```json
{
  "brand": {
    "name": "Doğan Can Yıldız",
    "monogram": "DCY",
    "role": "Full-Stack Web Geliştirici ve DevOps Mühendisi"
  },
  "nav": {
    "home": "Ana sayfa",
    "about": "Hakkımda",
    "projects": "Projeler",
    "blog": "Blog",
    "contact": "İletişim",
    "openMenu": "Menüyü aç",
    "closeMenu": "Menüyü kapat",
    "switchLanguage": "English"
  },
  "home": {
    "title": "Doğan Can Yıldız",
    "description": "Next.js ve Node.js ile ölçeklenebilir web uygulamaları geliştiren, bunları kendi Docker altyapısında yayına alan full-stack geliştirici. CAPT sertifikalı. Konya, Türkiye.",
    "featuredTitle": "Seçilmiş işler",
    "featuredLink": "Tüm projeler",
    "latestPostsTitle": "Son yazılar",
    "latestPostsLink": "Tüm yazılar"
  },
  "hero": {
    "location": "Konya, Türkiye",
    "title": "Full-Stack Web Geliştirici ve DevOps Mühendisi",
    "tagline": "Web uygulamaları geliştiriyorum ve yayına aldıkları altyapıyı kendim işletiyorum.",
    "intro": "Konya'da yaşayan bir full-stack geliştiriciyim. Next.js ve Node.js ile web uygulamaları geliştiriyorum ve bunları kendim yayına alıyorum: Docker, GitHub Actions, Coolify ve Linux sunucular. Geliştirmenin yanında CAPT sertifikasına sahibim, Cisco CCNA hattını ve CyberOps Associate eğitimini tamamladım.",
    "viewProjects": "Projeleri gör",
    "downloadCv": "CV'yi indir",
    "getInTouch": "İletişime geç"
  },
  "about": {
    "title": "Hakkımda",
    "description": "Konya'da yaşayan, web uygulamaları geliştiren ve yayına aldıkları altyapıyı da işleten full-stack geliştirici.",
    "lead": "Next.js, Node.js/Express ve MongoDB ile ölçeklenebilir, kullanıcı dostu web uygulamaları geliştiren bir yazılım mühendisiyim.",
    "body1": "İşim kodu yazmakla bitmiyor. Uygulamaları kendi sunucumdaki altyapıda derleyip yayına alıyorum (Docker, GitHub Actions CI/CD, Coolify, Traefik ve Linux sunucular) ve Agile ekiplerde çalışıyorum; sprint planlama ile iş takibini ClickUp üzerinde yürütüyorum.",
    "body2": "İşimi ayıran şey, uygulama katmanının altındaki güçlü ağ ve güvenlik temeli: CAPT sertifikalıyım, Cisco CCNA hattının tamamını ve CyberOps Associate eğitimini tamamladım. Bu, bir sistemin yalnızca nasıl kurulduğunu değil, nasıl yayına alındığını, dışarıya nasıl açıldığını ve nasıl sertleştirildiğini de düşünmek demek.",
    "body3": "İşin dışında iki yıl GDG Konya organizatörlüğü yaptım ve GDG Cloud Konya çekirdek ekibinde yer aldım; yerel geliştirici topluluğu için teknik konuşmalar, study jam'ler ve uygulamalı atölyeler düzenledik.",
    "nowLabel": "Şu anda",
    "now": "BerrSoft'ta Full-Stack Developer, Necmettin Erbakan Üniversitesi'nde Matematik ve Bilgisayar Bilimleri öğrencisi",
    "locationLabel": "Konum",
    "location": "Konya, Türkiye",
    "skillsTitle": "Yetkinlikler",
    "experienceTitle": "Deneyim",
    "communityTitle": "Topluluk",
    "speakingTitle": "Konuşmalar",
    "certificatesTitle": "Sertifikalar",
    "certificateVerify": "Doğrula",
    "educationTitle": "Eğitim",
    "languagesTitle": "Diller",
    "languages": "Ana dilim Türkçe. Yazılı İngilizceyi her gün kullanıyorum: dokümantasyon, depolar ve bu sitedeki yazılar.",
    "downloadCv": "CV'yi indir"
  },
  "projects": {
    "title": "Projeler",
    "description": "Yayına aldığım ve hâlâ arkasında durduğum beş proje. Her biri üstlendiğim rolü, kullandığım yığını ve sonunda gerçekten neyin değiştiğini gösteriyor.",
    "role": "Rol",
    "stack": "Stack",
    "year": "Yıl",
    "outcome": "Sonuç",
    "viewLive": "Canlı site",
    "viewSource": "Kaynak kod",
    "back": "Tüm projeler"
  },
  "blog": {
    "title": "Yazılar",
    "description": "Full-stack geliştirme, kendi sunucusunda barındırma ve web güvenliği üzerine notlar. Yazılar önce Türkçe yazılıyor, bir kısmı İngilizceye çevriliyor.",
    "readingTime": "{minutes} dakikalık okuma",
    "back": "Tüm yazılar",
    "empty": "Henüz yazı yok."
  },
  "contact": {
    "title": "İletişim",
    "description": "İlginç projelere ve sohbetlere açığım. Bana en hızlı ulaşma yolu e-posta.",
    "intro": "İlginç projelere ve sohbetlere açığım. Bana en hızlı ulaşma yolu e-posta.",
    "emailLabel": "E-posta",
    "locationLabel": "Konum",
    "location": "Konya, Türkiye",
    "form": {
      "name": "Ad",
      "namePlaceholder": "Adınız",
      "email": "E-posta",
      "emailPlaceholder": "siz@sirket.com",
      "message": "Mesaj",
      "messagePlaceholder": "Ne geliştirmek istiyorsunuz?",
      "submit": "Mesajı gönder",
      "sending": "Gönderiliyor",
      "success": "Teşekkürler, mesajınız yola çıktı. Genellikle bir gün içinde yanıtlıyorum.",
      "error": "Mesaj gönderilemedi. Lütfen doğrudan e-posta gönderin.",
      "honeypotLabel": "Bu alanı boş bırakın"
    }
  },
  "footer": {
    "tagline": "Full-stack geliştirme, kendi sunucusunda barındırma, güvenlik odaklı mühendislik.",
    "copyright": "Kendim geliştirdim, kendi sunucumda barındırıyorum.",
    "emailLabel": "E-posta",
    "elsewhereLabel": "Diğer kanallar",
    "github": "GitHub",
    "linkedin": "LinkedIn",
    "rss": "RSS"
  }
}
```

- [ ] **Step 3: `contact-form.tsx`'i yeni anahtar isimlerine hizala**

`src/components/sections/contact-form.tsx` içinde namespace ve anahtarları şu eşlemeye göre güncelle:

```tsx
const t = useTranslations("contact.form");
```

| Kullanım yeri | Anahtar |
|---|---|
| Ad alanının etiketi | `t("name")` |
| Ad alanının placeholder'ı | `t("namePlaceholder")` |
| E-posta etiketi | `t("email")` |
| E-posta placeholder'ı | `t("emailPlaceholder")` |
| Mesaj etiketi | `t("message")` |
| Mesaj placeholder'ı | `t("messagePlaceholder")` |
| Gönder butonu | `t("submit")` |
| Gönderim sırasındaki buton metni | `t("sending")` |
| Başarı mesajı (`role="status"`) | `t("success")` |
| Hata mesajı (`role="alert"`) | `t("error")` |
| Honeypot input'unun görsel gizli etiketi | `t("honeypotLabel")` |

Ayrıca `src/components/layout/language-switcher.tsx` içindeki erişilebilir etiket `useTranslations("nav")` ile `t("switchLanguage")` anahtarına bağlanır; bileşen başka bir anahtar kullanıyorsa o anahtar bu ada çevrilir.

- [ ] **Step 4: İki mesaj dosyasının anahtar kümelerinin aynı olduğunu doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "
const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&v!==null?flat(v,p+k+'.'):[p+k]);
const en=flat(require('./messages/en.json')).sort();
const tr=flat(require('./messages/tr.json')).sort();
const onlyEn=en.filter(k=>!tr.includes(k));
const onlyTr=tr.filter(k=>!en.includes(k));
console.log(onlyEn.length===0&&onlyTr.length===0?'message keys match ('+en.length+' keys)':'mismatch en-only:'+onlyEn+' tr-only:'+onlyTr);
"
```

Beklenen çıktı: `message keys match (82 keys)`; `mismatch` çıkarsa eksik anahtar eklenir.

- [ ] **Step 5: Build al ve eksik mesaj uyarısı olmadığını doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build 2>&1 | grep -i "MISSING_MESSAGE\|INSUFFICIENT_PATH" || echo "no missing messages"
```

Beklenen çıktı: `no missing messages`. Bir anahtar eksik çıkarsa, eksik olan anahtar bu iki JSON dosyasına eklenir (bileşen değiştirilmez).

- [ ] **Step 6: Uzun çizgi taraması**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" messages/en.json messages/tr.json; echo "exit=$?"
```

Beklenen çıktı: `exit=1`.

- [ ] **Step 7: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add messages src/components/sections/contact-form.tsx
git commit -m "feat(content): replace template copy with real bilingual site text"
```

---

### Task 12: Profil verisi ve About sayfası blokları

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/content/profile.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/about/page.tsx`
- Delete: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/data/skills.ts`
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/profile.test.ts`

**Interfaces:**
- Consumes: `Locale` (Task 2); `about.*` mesaj anahtarları (Task 11); `buildAlternates` (Task 2).
- Produces:
  - `interface SkillGroup { title: string; items: string[] }`
  - `interface ExperienceEntry { role: string; company: string; location: string; period: string; bullets: string[]; stack: string[] }`
  - `interface CommunityEntry { role: string; organization: string; period: string; description: string }`
  - `interface SpeakingEntry { event: string; topic: string; date: string }`
  - `interface CertificateEntry { name: string; issuer: string; detail?: string; verifyUrl?: string }`
  - `interface EducationEntry { program: string; school: string; period: string }`
  - `skills: Record<Locale, SkillGroup[]>`, `experience: Record<Locale, ExperienceEntry[]>`, `community: Record<Locale, CommunityEntry[]>`, `speaking: Record<Locale, SpeakingEntry[]>`, `certificates: Record<Locale, CertificateEntry[]>`, `education: Record<Locale, EducationEntry[]>`
- Kaynak: `.local/content/portfolio-content.md` bölüm 3, 4, 6, 7, 8.

Kurallar (08-icerik-stratejisi.md kararları 4, 5, 6, 7):
- `speaking` dizileri şu an boş; etkinlik adı, konu ve tarih site sahibinden teslim edilmedi. Boş dizi için About sayfası Konuşmalar bloğunu HİÇ render etmez. Köşeli parantezli placeholder metin (`[Etkinlik adı]` gibi) hiçbir koşulda yazılmaz.
- Her sertifikada `verifyUrl` alanı modellenir ama linkler henüz gelmedi; alan tanımsız bırakılır, satır listeden çıkarılmaz.
- Harp Okulu satırı yalnızca yıl aralığı ve program adıyla yazılır, "(not completed)" veya "tamamlanmadı" ifadesi eklenmez.
- CEFR seviyesi (B1, A2) hiçbir yerde geçmez; diller `about.languages` mesajıyla tek cümle olarak verilir.

- [ ] **Step 1: `src/content/profile.ts` dosyasını yaz**

```ts
import type { Locale } from "@/lib/content";

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
  stack: string[];
}

export interface CommunityEntry {
  role: string;
  organization: string;
  period: string;
  description: string;
}

export interface SpeakingEntry {
  event: string;
  topic: string;
  date: string;
}

export interface CertificateEntry {
  name: string;
  issuer: string;
  detail?: string;
  verifyUrl?: string;
}

export interface EducationEntry {
  program: string;
  school: string;
  period: string;
}

export const skills: Record<Locale, SkillGroup[]> = {
  en: [
    {
      title: "Frontend",
      items: ["TypeScript", "JavaScript", "Next.js", "React", "HTML", "CSS", "Bootstrap"],
    },
    { title: "Backend", items: ["Node.js / Express.js", "PHP", "RESTful API design"] },
    { title: "Databases", items: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"] },
    {
      title: "DevOps and infrastructure",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD pipelines",
        "Traefik",
        "Coolify",
        "Linux server engineering",
        "QEMU",
        "Go",
      ],
    },
    {
      title: "Networking",
      items: [
        "Network fundamentals",
        "Routing and switching",
        "VLAN configuration",
        "IP addressing and subnetting",
        "WAN technologies",
        "Network automation",
        "Troubleshooting",
      ],
    },
    {
      title: "Security",
      items: [
        "Vulnerability assessment and exploitation",
        "Network and system penetration testing",
        "Web application security testing",
        "SOC fundamentals",
      ],
    },
    {
      title: "Ways of working",
      items: [
        "Agile / Scrum",
        "Sprint planning",
        "ClickUp",
        "Code review",
        "Issue and bug tracking",
        "Technical team leadership",
      ],
    },
  ],
  tr: [
    {
      title: "Frontend",
      items: ["TypeScript", "JavaScript", "Next.js", "React", "HTML", "CSS", "Bootstrap"],
    },
    { title: "Backend", items: ["Node.js / Express.js", "PHP", "RESTful API tasarımı"] },
    { title: "Veritabanları", items: ["MySQL", "PostgreSQL", "MongoDB", "SQLite"] },
    {
      title: "DevOps ve altyapı",
      items: [
        "Git",
        "GitHub Actions",
        "Docker",
        "CI/CD hatları",
        "Traefik",
        "Coolify",
        "Linux sunucu yönetimi",
        "QEMU",
        "Go",
      ],
    },
    {
      title: "Ağ",
      items: [
        "Ağ temelleri",
        "Yönlendirme ve anahtarlama",
        "VLAN yapılandırması",
        "IP adresleme ve alt ağ",
        "WAN teknolojileri",
        "Ağ otomasyonu",
        "Sorun giderme",
      ],
    },
    {
      title: "Güvenlik",
      items: [
        "Zafiyet analizi ve istismar",
        "Ağ ve sistem sızma testi",
        "Web uygulaması güvenlik testi",
        "SOC temelleri",
      ],
    },
    {
      title: "Çalışma biçimi",
      items: [
        "Agile / Scrum",
        "Sprint planlama",
        "ClickUp",
        "Kod incelemesi",
        "İş ve hata takibi",
        "Teknik ekip liderliği",
      ],
    },
  ],
};

export const experience: Record<Locale, ExperienceEntry[]> = {
  en: [
    {
      role: "Full-Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Present",
      bullets: [
        "Build web applications with Next.js and React on the front end, Node.js/Express.js and PHP on the back end, designing and consuming RESTful APIs.",
        "Work across MySQL, MongoDB and SQLite, selecting the right database per project for scalable, maintainable systems.",
        "Delivered 5 production applications end to end, owning the full lifecycle from architecture and API design through deployment and maintenance.",
        "Automated build and release with GitHub Actions and Coolify, deploying Dockerized applications to self-hosted servers; managed sprint boards and issue tracking in ClickUp.",
      ],
      stack: [
        "Next.js",
        "React",
        "Node.js",
        "Express",
        "PHP",
        "MySQL",
        "MongoDB",
        "Docker",
        "GitHub Actions",
        "Coolify",
      ],
    },
    {
      role: "Frontend Web Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "06/2021 - 11/2024",
      bullets: [
        "Built responsive, accessible web interfaces with HTML, CSS, JavaScript and Bootstrap for 5+ client projects.",
        "Delivered 10+ custom WordPress themes and client specific websites; improved UI/UX and ensured compatibility across mobile, tablet and desktop.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Intern",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "Developed a vehicle tracking management panel using PHP, JavaScript and third party API integrations.",
        "Implemented simulation and API integration for municipal traffic light management.",
      ],
      stack: ["PHP", "JavaScript", "REST APIs"],
    },
  ],
  tr: [
    {
      role: "Full-Stack Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "11/2024 - Devam ediyor",
      bullets: [
        "Ön yüzde Next.js ve React, arka yüzde Node.js/Express.js ve PHP ile web uygulamaları geliştiriyorum; RESTful API'leri tasarlıyor ve tüketiyorum.",
        "MySQL, MongoDB ve SQLite ile çalışıyorum; ölçeklenebilir ve sürdürülebilir sistemler için her projede doğru veritabanını seçiyorum.",
        "5 üretim uygulamasını uçtan uca teslim ettim; mimari ve API tasarımından yayın ve bakıma kadar tüm yaşam döngüsünü üstlendim.",
        "GitHub Actions ve Coolify ile derleme ve yayın adımlarını otomatikleştirdim, Docker ile paketlenmiş uygulamaları kendi sunucularımıza yayına aldım; sprint panolarını ve iş takibini ClickUp üzerinde yürüttüm.",
      ],
      stack: [
        "Next.js",
        "React",
        "Node.js",
        "Express",
        "PHP",
        "MySQL",
        "MongoDB",
        "Docker",
        "GitHub Actions",
        "Coolify",
      ],
    },
    {
      role: "Frontend Web Developer",
      company: "BerrSoft Bilgi Teknolojileri",
      location: "İstanbul",
      period: "06/2021 - 11/2024",
      bullets: [
        "5'ten fazla müşteri projesi için HTML, CSS, JavaScript ve Bootstrap ile duyarlı ve erişilebilir web arayüzleri geliştirdim.",
        "10'dan fazla özel WordPress teması ve müşteriye özel web sitesi teslim ettim; arayüz deneyimini iyileştirdim, mobil, tablet ve masaüstü uyumunu sağladım.",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap", "WordPress"],
    },
    {
      role: "Stajyer",
      company: "Konya Büyükşehir Belediyesi, Bilgi İşlem Daire Başkanlığı",
      location: "Konya",
      period: "07/2024 - 08/2024",
      bullets: [
        "PHP, JavaScript ve üçüncü parti API entegrasyonlarıyla bir araç takip yönetim paneli geliştirdim.",
        "Belediye trafik ışığı yönetimi için simülasyon ve API entegrasyonu uyguladım.",
      ],
      stack: ["PHP", "JavaScript", "REST API"],
    },
  ],
};

export const community: Record<Locale, CommunityEntry[]> = {
  en: [
    {
      role: "Core team member",
      organization: "GDG Cloud Konya",
      period: "05/2025 - 10/2025",
      description:
        "Organized technical events, hands-on workshops and community projects focused on Google Cloud technologies.",
    },
    {
      role: "Organizer",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "Co-organized tech talks, study jams and networking events across two years, supporting knowledge sharing around Google technologies.",
    },
  ],
  tr: [
    {
      role: "Çekirdek ekip üyesi",
      organization: "GDG Cloud Konya",
      period: "05/2025 - 10/2025",
      description:
        "Google Cloud teknolojileri odağında teknik etkinlikler, uygulamalı atölyeler ve topluluk projeleri düzenledim.",
    },
    {
      role: "Organizatör",
      organization: "GDG Konya",
      period: "10/2023 - 10/2025",
      description:
        "İki yıl boyunca teknik konuşmalar, study jam'ler ve tanışma etkinlikleri düzenledim; Google teknolojileri etrafında bilgi paylaşımını destekledim.",
    },
  ],
};

// Etkinlik adı, konu ve tarih site sahibinden henüz teslim edilmedi.
// Diziler boş kaldığı sürece About sayfası Konuşmalar bloğunu render etmez.
// Placeholder metin (köşeli parantezli örnek satır) buraya ASLA yazılmaz.
export const speaking: Record<Locale, SpeakingEntry[]> = {
  en: [],
  tr: [],
};

// verifyUrl alanları site sahibi doğrulama linklerini ilettiğinde doldurulur.
// Link gelene kadar alan tanımsız kalır, satır listeden çıkarılmaz.
export const certificates: Record<Locale, CertificateEntry[]> = {
  en: [
    { name: "Certified Associate Penetration Tester (CAPT)", issuer: "Hackviser" },
    {
      name: "CCNA complete track",
      issuer: "Cisco Networking Academy",
      detail:
        "Introduction to Networks · Switching, Routing and Wireless Essentials · Enterprise Networking, Security and Automation",
    },
    { name: "CyberOps Associate", issuer: "Cisco Networking Academy" },
    { name: "Network Technician Career Path", issuer: "Cisco Networking Academy" },
    { name: "Linux Unhatched", issuer: "Cisco Networking Academy" },
    { name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
    { name: "Version Control Systems and Portfolio", issuer: "Global AI Hub" },
  ],
  tr: [
    { name: "Certified Associate Penetration Tester (CAPT)", issuer: "Hackviser" },
    {
      name: "CCNA tam hattı",
      issuer: "Cisco Networking Academy",
      detail:
        "Introduction to Networks · Switching, Routing and Wireless Essentials · Enterprise Networking, Security and Automation",
    },
    { name: "CyberOps Associate", issuer: "Cisco Networking Academy" },
    { name: "Network Technician Career Path", issuer: "Cisco Networking Academy" },
    { name: "Linux Unhatched", issuer: "Cisco Networking Academy" },
    { name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
    { name: "Version Control Systems and Portfolio", issuer: "Global AI Hub" },
  ],
};

export const education: Record<Locale, EducationEntry[]> = {
  en: [
    {
      program: "Mathematics and Computer Science",
      school: "Necmettin Erbakan University",
      period: "09/2025 - 06/2028",
    },
    {
      program: "Computer Programming, associate degree",
      school: "Konya Technical University",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Web Design and Coding",
      school: "Anadolu University",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Electronics and Communications Engineering",
      school: "National Defence University, Turkish Military Academy",
      period: "10/2017 - 06/2021",
    },
  ],
  tr: [
    {
      program: "Matematik ve Bilgisayar Bilimleri",
      school: "Necmettin Erbakan Üniversitesi",
      period: "09/2025 - 06/2028",
    },
    {
      program: "Bilgisayar Programcılığı, ön lisans",
      school: "Konya Teknik Üniversitesi",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Web Tasarımı ve Kodlama",
      school: "Anadolu Üniversitesi",
      period: "09/2023 - 06/2025",
    },
    {
      program: "Elektronik ve Haberleşme Mühendisliği",
      school: "Milli Savunma Üniversitesi, Kara Harp Okulu",
      period: "10/2017 - 06/2021",
    },
  ],
};
```

- [ ] **Step 2: Profil verisi testini yaz**

`tests/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  certificates,
  community,
  education,
  experience,
  skills,
  speaking,
} from "@/content/profile";

const LOCALES = ["en", "tr"] as const;
const FORBIDDEN = [
  "not completed",
  "tamamlanmadı",
  "B1",
  "A2",
  "TBD",
  "placeholder",
  "Lorem",
];

describe("profile data", () => {
  it("has the same number of entries in both locales", () => {
    expect(skills.en.length).toBe(skills.tr.length);
    expect(experience.en.length).toBe(experience.tr.length);
    expect(community.en.length).toBe(community.tr.length);
    expect(certificates.en.length).toBe(certificates.tr.length);
    expect(education.en.length).toBe(education.tr.length);
    expect(speaking.en.length).toBe(speaking.tr.length);
  });

  it("models a verifyUrl field on every certificate without inventing links", () => {
    for (const locale of LOCALES) {
      for (const certificate of certificates[locale]) {
        expect(certificate.name.length).toBeGreaterThan(0);
        expect(certificate.issuer.length).toBeGreaterThan(0);
        if (certificate.verifyUrl !== undefined) {
          expect(certificate.verifyUrl).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("keeps the military academy line neutral and drops cefr levels", () => {
    const serialized = JSON.stringify({
      skills,
      experience,
      community,
      certificates,
      education,
      speaking,
    });
    for (const term of FORBIDDEN) {
      expect(serialized).not.toContain(term);
    }
  });

  it("contains no bracketed placeholder text in the speaking list", () => {
    const serialized = JSON.stringify(speaking);
    expect(serialized).not.toMatch(/\[[^\]]+\]/);
  });

  it("uses no em dash or en dash", () => {
    const serialized = JSON.stringify({
      skills,
      experience,
      community,
      certificates,
      education,
    });
    expect(serialized).not.toMatch(/[\u2013\u2014]/);
  });
});
```

- [ ] **Step 3: Testi çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/profile.test.ts
```

Beklenen: 5 test PASS.

- [ ] **Step 4: `src/app/[lang]/about/page.tsx` dosyasını tamamen değiştir**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  certificates,
  community,
  education,
  experience,
  skills,
  speaking,
} from "@/content/profile";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/content";
import { CV_PATH, hasCv } from "@/lib/cv";
import { buildAlternates } from "@/lib/seo/alternates";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  const t = await getTranslations({ locale: lang, namespace: "about" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(lang as Locale, "/about", ["en", "tr"]),
    openGraph: { title: t("title"), description: t("description"), type: "profile" },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const locale = lang as Locale;
  const t = await getTranslations({ locale, namespace: "about" });
  const talks = speaking[locale];
  const showCv = hasCv();

  return (
    <div className="section-space">
      <div className="page-shell-reading space-y-16">
        <header className="space-y-6">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("lead")}</p>
          <p className="section-copy">{t("body1")}</p>
          <p className="section-copy">{t("body2")}</p>
          <p className="section-copy">{t("body3")}</p>

          <dl className="grid gap-4 border-y border-border py-6 font-mono text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("nowLabel")}
              </dt>
              <dd>{t("now")}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("locationLabel")}
              </dt>
              <dd>{t("location")}</dd>
            </div>
          </dl>

          {showCv ? (
            <Button asChild size="sm">
              <a href={CV_PATH} download>
                <Download className="size-4" />
                {t("downloadCv")}
              </a>
            </Button>
          ) : null}
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl">{t("skillsTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {skills[locale].map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </h3>
                <p className="text-sm leading-6 text-foreground/85">
                  {group.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl">{t("experienceTitle")}</h2>
          {experience[locale].map((entry) => (
            <article key={`${entry.company}-${entry.period}`} className="space-y-3">
              <h3 className="text-xl leading-snug">{entry.role}</h3>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {entry.company} · {entry.location} · {entry.period}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/85">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="font-mono text-xs text-muted-foreground">
                {entry.stack.join(" · ")}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl">{t("communityTitle")}</h2>
          {community[locale].map((entry) => (
            <article key={`${entry.organization}-${entry.period}`} className="space-y-2">
              <h3 className="text-lg leading-snug">
                {entry.organization} · {entry.role}
              </h3>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {entry.period}
              </p>
              <p className="text-sm leading-6 text-foreground/85">{entry.description}</p>
            </article>
          ))}
        </section>

        {talks.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl">{t("speakingTitle")}</h2>
            <ul className="space-y-2">
              {talks.map((talk) => (
                <li
                  key={`${talk.event}-${talk.date}`}
                  className="font-mono text-sm text-foreground/85"
                >
                  {talk.event} · {talk.topic} · {talk.date}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl">{t("certificatesTitle")}</h2>
          <ul className="space-y-4">
            {certificates[locale].map((certificate) => (
              <li key={certificate.name} className="space-y-1">
                <p className="text-base leading-6">
                  {certificate.name}
                  {certificate.verifyUrl ? (
                    <>
                      {" "}
                      <a
                        href={certificate.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4"
                      >
                        {t("certificateVerify")}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {certificate.issuer}
                </p>
                {certificate.detail ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {certificate.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl">{t("educationTitle")}</h2>
          <ul className="space-y-3">
            {education[locale].map((entry) => (
              <li key={`${entry.school}-${entry.period}`} className="space-y-1">
                <p className="text-base leading-6">{entry.program}</p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {entry.school} · {entry.period}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl sm:text-3xl">{t("languagesTitle")}</h2>
          <p className="section-copy">{t("languages")}</p>
        </section>
      </div>
    </div>
  );
}
```

Not: `hasCv` ve `CV_PATH` Task 13'te oluşturuluyor. Task 12 ve Task 13 ardışık uygulanmalı; Task 12 tek başına derlenmez. Sıralı yürütmede sorun yok, ancak paralel çalışılıyorsa Task 13'ün Step 1'i önce uygulanmalı.

- [ ] **Step 5: Eski skill verisini sil**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm src/data/skills.ts
grep -rn "data/skills" src/ || echo "no references left"
rmdir src/data 2>/dev/null || true
```

Beklenen çıktı: `no references left`.

`src/components/sections/skills-strip.tsx` hâlâ `data/skills`'i kullanıyorsa, bileşeni `skills` verisini prop olarak alacak şekilde güncelle veya kullanılmıyorsa `git rm src/components/sections/skills-strip.tsx` ile sil (grep çıktısı hangisinin geçerli olduğunu gösterir).

- [ ] **Step 6: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add -A src tests
git commit -m "feat(about): render real profile data with talks, certificates and education"
```

---

### Task 13: Gerçek linkler, DCY monogramı, koşullu CV butonu, boilerplate temizliği

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/cv.ts`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/public/cv/.gitkeep`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/lib/site.ts`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/footer.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/layout/header.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/components/sections/hero.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/page.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/contact/page.tsx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/.env.example`
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

**Interfaces:**
- Consumes: `footer.*`, `hero.*`, `nav.*`, `contact.*`, `brand.*` mesaj anahtarları (Task 11).
- Produces:
  - `src/lib/site.ts`: `export const SOCIAL: { github: string; linkedin: string }` (değerler Faz 2'nin `src/lib/site-config.ts` dosyasındaki `siteConfig.person.sameAs` listesinden TÜRETİLİR, elle tekrar yazılmaz), `export const CONTACT_EMAIL_PUBLIC = "me@dogancanyildiz.com"`
  - `src/lib/site-config.ts` (Faz 2 çıktısı) kişi kaydının tek kaynağı olarak KALIR ve Person JSON-LD ile sosyal linkler aynı diziden beslenir.
  - `src/lib/cv.ts`: `export const CV_PATH = "/cv/dogancanyildiz-cv.pdf"`, `export function hasCv(): boolean`
  - `<Hero showCv={boolean} />` prop imzası

- [ ] **Step 1: `src/lib/cv.ts` dosyasını yaz**

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";

export const CV_PATH = "/cv/dogancanyildiz-cv.pdf";

/**
 * Yalnızca sunucu tarafında, build sırasında çağrılır (statik prerender).
 * Dosya teslim edilene kadar false döner ve CV butonu hiç render edilmez.
 */
export function hasCv(): boolean {
  return existsSync(join(process.cwd(), "public", "cv", "dogancanyildiz-cv.pdf"));
}
```

- [ ] **Step 2: `public/cv/.gitkeep` oluştur ve gerçek dosyayı gitignore etmemeyi doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
mkdir -p public/cv
touch public/cv/.gitkeep
git check-ignore -v public/cv/dogancanyildiz-cv.pdf || echo "cv pdf is not ignored"
```

Beklenen çıktı: `cv pdf is not ignored`.

- [ ] **Step 3: `src/lib/site.ts` dosyasını yaz**

Sosyal linkler burada ikinci kez yazılmaz. Faz 2 bunları `src/lib/site-config.ts`
içinde `siteConfig.person.sameAs` olarak tanımladı ve Person JSON-LD o diziyi
kullanıyor; footer ile JSON-LD farklı URL göstermesin diye `SOCIAL` aynı
diziden türetilir. (Faz 2'deki LinkedIn değeri `https://www.linkedin.com/in/dogancanyildiz`,
`www` ile; footer da bu değeri gösterir.)

Önce kaynağın yerinde olduğunu doğrula:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "sameAs" -A 4 src/lib/site-config.ts
```

Beklenen: `https://github.com/dogancanyildiz` ve
`https://www.linkedin.com/in/dogancanyildiz` satırları.

`src/lib/site.ts`:

```ts
import { siteConfig } from "@/lib/site-config";

/**
 * Social links shown in the UI. Derived from the same array the Person
 * JSON-LD publishes, so schema.org sameAs and the visible footer links can
 * never drift apart. site-config.ts stays the single source of the identity.
 */
function findSocial(host: string): string {
  const match = siteConfig.person.sameAs.find((url) => url.includes(host));
  if (!match) {
    throw new Error(`siteConfig.person.sameAs is missing a ${host} entry`);
  }
  return match;
}

export const SOCIAL = {
  github: findSocial("github.com"),
  linkedin: findSocial("linkedin.com"),
};

export const CONTACT_EMAIL_PUBLIC = "me@dogancanyildiz.com";
```

- [ ] **Step 4: `src/components/layout/footer.tsx` dosyasını tamamen değiştir**

```tsx
import { Github, Linkedin, Mail, Rss } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL_PUBLIC, SOCIAL } from "@/lib/site";

const NAV_ITEMS = [
  { href: "/about", key: "about" },
  { href: "/projects", key: "projects" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-10">
      <div className="page-shell grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-2xl">{tBrand("name")}</p>
          <p className="section-copy max-w-md">{t("tagline")}</p>
          <p className="text-sm text-muted-foreground">
            © {year} {tBrand("name")}. {t("copyright")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <nav aria-label={tNav("home")}>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4">
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("emailLabel")}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
              >
                <Mail className="size-4" aria-hidden="true" />
                {CONTACT_EMAIL_PUBLIC}
              </a>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("elsewhereLabel")}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={SOCIAL.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("github")}
                  className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github className="size-4" aria-hidden="true" />
                </a>
                <a
                  href={SOCIAL.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("linkedin")}
                  className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin className="size-4" aria-hidden="true" />
                </a>
                <Link
                  href="/feed.xml"
                  aria-label={t("rss")}
                  className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Rss className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

Not: Twitter/X linki kaldırıldı, çünkü `.local/content/portfolio-content.md` bölüm 10'da böyle bir hesap yok. Placeholder sosyal link yayına çıkmaz.

- [ ] **Step 5: Header logosunu DCY monogramına çevir**

`src/components/layout/header.tsx` içindeki marka linkini şu hale getir:

```tsx
      <Link href="/" className="flex items-center gap-2" aria-label={tBrand("name")}>
        <span className="flex size-9 items-center justify-center rounded-lg border border-border font-mono text-sm tracking-[0.08em]">
          {tBrand("monogram")}
        </span>
        <span className="sr-only">{tBrand("name")}</span>
      </Link>
```

Dosyanın üstüne ekle (yoksa):

```tsx
const tBrand = useTranslations("brand");
```

- [ ] **Step 6: Hero'yu koşullu CV butonuna çevir**

`src/components/sections/hero.tsx` içinde:

```tsx
interface HeroProps {
  showCv: boolean;
}

export function Hero({ showCv }: HeroProps) {
```

CV butonu bloğunu şu hale getir:

```tsx
        {showCv ? (
          <Button asChild variant="outline" size="lg">
            <a href={CV_PATH} download>
              <Download className="size-4" />
              {t("downloadCv")}
            </a>
          </Button>
        ) : null}
```

Import ekle:

```tsx
import { CV_PATH } from "@/lib/cv";
```

`src/app/[lang]/page.tsx` içinde kullanımı güncelle:

```tsx
import { hasCv } from "@/lib/cv";
...
      <Hero showCv={hasCv()} />
```

- [ ] **Step 7: Contact sayfasındaki e-posta ve konum satırlarını gerçek değerlere bağla**

`src/app/[lang]/contact/page.tsx` içinde e-posta gösteren blok:

```tsx
import { CONTACT_EMAIL_PUBLIC } from "@/lib/site";
...
          <div className="space-y-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("emailLabel")}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
              className="text-sm transition-colors hover:text-primary"
            >
              {CONTACT_EMAIL_PUBLIC}
            </a>
          </div>
```

- [ ] **Step 8: create-next-app boilerplate SVG'lerini sil**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg 2>/dev/null || true
grep -rn "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src/ || echo "no references left"
```

Beklenen çıktı: `no references left`.

- [ ] **Step 9: `.env.example` dosyasını gerçek değerlerle yaz**

```
# Public site URL. Coolify'da BUILD değişkeni olarak işaretlenir.
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh

# Resend (contact form). Coolify'da RUNTIME değişkeni olarak işaretlenir.
RESEND_API_KEY=re_xxxxxxxxxxxx

# Contact form messages are delivered to this address. RUNTIME.
CONTACT_EMAIL=me@dogancanyildiz.com

# From address, must be a verified domain in Resend. RUNTIME.
FROM_EMAIL=hello@dogancanyildiz.sh
```

- [ ] **Step 10: Build al ve gerçek linkleri doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/ | grep -o "github.com/dogancanyildiz"
curl -s http://localhost:3000/ | grep -o "linkedin.com/in/dogancanyildiz"
curl -s http://localhost:3000/ | grep -o "me@dogancanyildiz.com"
curl -s http://localhost:3000/ | grep -c "cv/dogancanyildiz-cv.pdf"
kill %1
```

Beklenen çıktı: ilk üç grep eşleşir; son grep `0` döner (CV PDF henüz teslim edilmediği için buton render edilmiyor). PDF `public/cv/` altına konulduktan sonra aynı grep `1` dönmelidir.

- [ ] **Step 11: Kapıları çalıştır ve commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run typecheck && npm run lint && npm test
git add -A src public .env.example
git commit -m "feat(site): use real social links, dcy monogram and conditional cv button"
```

---

### Task 14: Kalan blog yazıları (2 TR) ve seçili yazının EN çevirisi

**Files:**
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/blog/tr/capt-sinavina-hazirlik.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/blog/tr/ccna-dan-web-guvenligine.mdx`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/content/blog/en/self-hosting-with-coolify.mdx`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/src/app/[lang]/page.tsx`

**Interfaces:**
- Consumes: Task 1'deki Velite `posts` şeması (`title`, `slug`, `date`, `summary`, `tags[]`, `cover?`, `draft?`); `getPosts`, `toPostCardData` (Task 2); `<PostList />` (Task 7); `home.latestPostsTitle`, `home.latestPostsLink` (Task 11).
- Produces: TR blogunda 3 yazı, EN blogunda 1 yazı; `self-hosting-with-coolify` slug'ı iki dilde de var olduğu için hreflang çifti kurulur, diğer iki yazı yalnızca TR sitemap'ine girer.

- [ ] **Step 1: `content/blog/tr/capt-sinavina-hazirlik.mdx`**

```mdx
---
title: CAPT sınavına hazırlık: pratik bir anlatım
slug: capt-sinavina-hazirlik
date: 2026-07-15
summary: Hackviser'ın CAPT sınavına nasıl hazırlandığımı, hangi konuların gerçekten karşıma çıktığını ve neyi fazladan çalıştığımı anlatıyorum.
tags:
  - guvenlik
  - sertifika
  - pentest
---

## Sınav ne ölçüyor

CAPT, sızma testinin ezberden değil elle yapılan kısmını ölçüyor. Bir hedefi tanımak, çıkan bulguyu doğrulamak ve bulunanın neden önemli olduğunu yazabilmek üçü birden isteniyor. Bu yüzden hazırlığın büyük kısmı okumak değil, laboratuvarda vakit geçirmekti.

## Nasıl çalıştım

Önce eksiklerimi listeledim ve konuları ikiye ayırdım: hiç dokunmadıklarım ve yüzeysel bildiklerim. Hiç dokunmadıklarıma sıfırdan başladım, yüzeysel bildiklerimi ise kendi kurduğum zafiyetli ortamlarda tekrar ettim. Kendi Docker ortamımı kurmak burada beklediğimden çok işe yaradı, çünkü hazır bir laboratuvarda tek tıkla gelen ortam, gerçek bir hedefte harcayacağınız kurulum ve keşif zamanını size hiç göstermiyor.

## Neyi fazladan çalıştım

Raporlamayı. Bulguyu bulmak işin yarısı, karşı tarafın anlayacağı biçimde yazmak diğer yarısı. Kendi notlarımı her seferinde "ne buldum, nasıl doğruladım, ne yapılmalı" başlıklarıyla tutmaya başladım ve bu alışkanlık hem sınavda hem sonrasında işime yaradı.

## Sonraki adım

Sertifika bir bitiş çizgisi değil, bir başlangıç noktası. Bir sonraki hedefim, öğrendiklerimi geliştirdiğim uygulamalara sistemli biçimde uygulamak; bunun ilk örneği bu sitedeki Bilet Satın Alma projesi.
```

- [ ] **Step 2: `content/blog/tr/ccna-dan-web-guvenligine.mdx`**

```mdx
---
title: CCNA'dan web güvenliğine: ağ temelinin uygulama katmanına katkısı
slug: ccna-dan-web-guvenligine
date: 2026-06-10
summary: Ağ eğitiminin bana kazandırdığı bakış açısı, web uygulaması geliştirirken aldığım kararları nasıl değiştirdi.
tags:
  - network
  - guvenlik
  - ccna
---

## Ağ eğitimi neyi değiştirdi

CCNA hattını tamamlarken öğrendiğim en kalıcı şey, paketin bir yerden bir yere kendi başına gitmediğiydi. Bir isteğin hangi arayüzden çıktığını, hangi kuralın onu geçirdiğini ve nerede durduğunu bilmek, uygulama katmanına baktığımda da aynı soruyu sormamı sağladı: bu istek buraya nasıl ulaştı ve kim ulaşmasına izin verdi.

## Uygulamada karşılığı

Bu bakış açısı en çok yayın kararlarında işe yarıyor. Bir servisin dışarı hangi portu açtığı, ters vekil sunucunun hangi başlıkları ilettiği ve gerçek ziyaretçi adresinin nereden okunduğu, uygulama kodundan bağımsız görünen ama doğrudan güvenliği belirleyen kararlar. Örneğin bir hız sınırlayıcının anahtarını yanlış başlıktan okumak, tüm ziyaretçileri tek bir kovaya düşürür ve korumayı sessizce işe yaramaz hale getirir.

## Alt ağ bilmenin faydası

Alt ağ hesabı kağıt üstünde sıkıcı bir konu, ama bir kuralın hangi adres aralığına uygulandığını doğru yazabilmek tam olarak bu bilgiye dayanıyor. Kaynak adres kısıtlaması yazarken aralığı bir bit kaydırmak, kuralı ya işlevsiz ya da fazla geniş yapıyor.

## Özet

Ağ tarafını bilmek beni daha iyi bir güvenlik uzmanı yapmadı, ama uygulamanın nerede bittiğini ve sistemin nerede başladığını görmemi sağladı. Geliştirici olarak en çok fark yaratan şey bu sınırı görebilmek oldu.
```

- [ ] **Step 3: `content/blog/en/self-hosting-with-coolify.mdx` (TR yazısının çevirisi, aynı slug)**

```mdx
---
title: Self-hosting this site with Coolify and Traefik
slug: self-hosting-with-coolify
date: 2026-08-20
summary: This site runs on my own server instead of a managed platform. Here is how the Coolify, Traefik and Docker pipeline works, and where it tripped me up.
tags:
  - devops
  - coolify
  - docker
---

## Why my own server

Hosting this site on a managed platform would have taken ten minutes. Running it on my own server turns the site itself into evidence: a portfolio that claims DevOps work should also be willing to show the infrastructure it stands on.

## How the pipeline works

The application is built by a multi stage Dockerfile with separate deps, builder and runner stages. The running container drops to a non root user and carries only the standalone output, the static assets and the public folder. Coolify watches the repository through its GitHub App integration: every commit on the main branch triggers a deploy, and every pull request gets its own preview URL. Traefik sits in front and handles TLS termination and routing.

## Where it tripped me up

The first snag was the health check. Connection refused on Node containers is a known Coolify issue, so the check has to be verified on staging before it is wired to production. The second was the environment variable layer. Values prefixed with NEXT_PUBLIC_ are inlined at build time, so marking one as runtime only leaves it silently undefined in production. The reverse is worse: marking an API key as a build variable can leak it into image layers and build logs.

## What I got out of it

The whole release step collapsed into one command, and every piece of the infrastructure lives in the repository. The price is maintenance: the server, the certificates and the updates are now my job. For a personal site that trade was worth it, because operating it is exactly the thing I wanted to learn.
```

- [ ] **Step 4: Ana sayfaya son yazılar bloğunu ekle**

`src/app/[lang]/page.tsx` içindeki öne çıkan projeler bölümünün altına ekle:

```tsx
      {latestPosts.length > 0 ? (
        <section className="section-space">
          <div className="page-shell-reading space-y-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl">{tHome("latestPostsTitle")}</h2>
              <Link
                href="/blog"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                {tHome("latestPostsLink")}
              </Link>
            </div>
            <PostList posts={latestPosts} />
          </div>
        </section>
      ) : null}
```

Aynı dosyaya ekle:

```tsx
import { PostList } from "@/components/sections/post-list";
import { getPosts, toPostCardData } from "@/lib/content";
...
  const latestPosts = getPosts(lang as Locale).slice(0, 3).map(toPostCardData);
```

- [ ] **Step 5: İçeriği derle ve dağılımı doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content
node -e "
const p=require('./.velite/posts.json');
console.log('total='+p.length);
console.log(p.map(x=>x.locale+':'+x.slug).sort().join(' '));
"
```

Beklenen çıktı:

```
total=4
en:self-hosting-with-coolify tr:capt-sinavina-hazirlik tr:ccna-dan-web-guvenligine tr:self-hosting-with-coolify
```

- [ ] **Step 6: hreflang eşleşmesini doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
echo "--- iki dilli yazı ---"
curl -s http://localhost:3000/blog/self-hosting-with-coolify | grep -o 'hreflang="[a-z-]*"' | sort -u
echo "--- yalnız TR yazı ---"
curl -s http://localhost:3000/tr/blog/capt-sinavina-hazirlik | grep -o 'hreflang="[a-z-]*"' | sort -u
echo "--- yalnız TR yazının EN adresi ---"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog/capt-sinavina-hazirlik
kill %1
```

Beklenen çıktı:

```
--- iki dilli yazı ---
hreflang="en"
hreflang="tr"
hreflang="x-default"
--- yalnız TR yazı ---
hreflang="tr"
hreflang="x-default"
--- yalnız TR yazının EN adresi ---
404
```

- [ ] **Step 7: RSS içeriklerini doğrula**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/tr/feed.xml | grep -c "<item>"
curl -s http://localhost:3000/feed.xml | grep -c "<item>"
kill %1
```

Beklenen çıktı: `3` ve `1`.

- [ ] **Step 8: Uzun çizgi taraması ve kapılar**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -rn "$(printf '[\xe2\x80\x93\xe2\x80\x94]')" content/; echo "exit=$?"
npm run typecheck && npm run lint && npm test
```

Beklenen: `exit=1` ve üç kapının da 0 exit code döndürmesi.

- [ ] **Step 9: Commit**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add content src
git commit -m "feat(blog): add remaining turkish posts and the english translation of the coolify post"
```

---

### Task 15: Şablon kalıntısı testi ve yayın öncesi kontrol listesi

**Files:**
- Test: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/tests/no-template-residue.test.ts`
- Create: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/docs/launch-checklist.md`
- Modify: `/Users/dogancanyildiz/Dev/DCYLDZ/portfolio/README.md`

**Interfaces:**
- Consumes: git ile takip edilen `src/`, `content/`, `messages/`, `public/`, `.env.example` dosyaları.
- Produces: `npm test` içinde çalışan, şablon kalıntısını ve uzun çizgiyi yakalayan kalıcı bir kapı; yayın öncesi elle yapılacak kontrollerin kayıtlı listesi.

- [ ] **Step 1: Kalıntı testini yaz**

`tests/no-template-residue.test.ts`:

```ts
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const TRACKED_PATHS = ["src", "content", "messages", "public", ".env.example"];

const FORBIDDEN_SUBSTRINGS = [
  "alex chen",
  "alex@example.com",
  "example.com",
  "techcorp",
  "startupxyz",
  "lorem ipsum",
  "coming soon",
  "your name here",
  "tbd",
];

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "em dash or en dash", pattern: /[\u2013\u2014]/ },
  { label: "bracketed placeholder", pattern: /\[(Etkinlik|Konu|Tarih|Şehir|TODO)[^\]]*\]/ },
  { label: "placeholder social root link", pattern: /https:\/\/(github|linkedin|twitter)\.com\/?["']/ },
];

function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files", ...TRACKED_PATHS], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((file) => !file.endsWith(".ico") && !file.endsWith(".woff2") && !file.endsWith(".pdf"));
}

describe("no template residue", () => {
  const files = trackedFiles();

  it("tracks a non trivial set of content files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN_SUBSTRINGS)("does not contain %s anywhere", (needle) => {
    const hits = files.filter((file) =>
      readFileSync(file, "utf8").toLowerCase().includes(needle),
    );
    expect(hits).toEqual([]);
  });

  it.each(FORBIDDEN_PATTERNS)("does not contain $label", ({ pattern }) => {
    const hits = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
    expect(hits).toEqual([]);
  });

  it("does not use a css gradient as a project cover", () => {
    const hits = files.filter((file) => {
      if (!file.startsWith("src/components/sections/")) return false;
      const source = readFileSync(file, "utf8");
      return source.includes("radial-gradient") || source.includes("linear-gradient");
    });
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Testi çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npx vitest run tests/no-template-residue.test.ts
```

Beklenen: tüm testler PASS. Bir test kalıyorsa, çıkan dosya listesi düzeltilecek dosyayı gösterir; testi gevşetmek değil dosyayı düzeltmek doğru davranıştır.

- [ ] **Step 3: `docs/launch-checklist.md` dosyasını yaz**

```markdown
# Yayın öncesi kontrol listesi (Faz 4 launch gate)

Bu listenin tamamı geçmeden `dogancanyildiz.com -> dogancanyildiz.sh` 301 yönlendirmesi
canlıya alınmaz (bkz. `docs/00-ozet-ve-karar.md`, Uygulama notları).

## 1. Otomatik kapılar

- [ ] `npm run typecheck` hatasız
- [ ] `npm run lint` hatasız
- [ ] `npm test` tüm testler geçiyor (şema, içerik katmanı, sitemap, profil, kalıntı)
- [ ] `npm run format` hatasız
- [ ] `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build` başarılı ve build
      çıktısında dynamic (ƒ) yalnızca `/api/*` altında

## 2. İçerik

- [ ] En az 4 proje ve 3 blog yazısı yayında
- [ ] Kapaksız yayınlanan projelerde CSS gradyan veya stok görsel yok
- [ ] Sertifika satırları listede, `verifyUrl` gelmeyenlerde link yok ama satır duruyor
- [ ] Konuşmalar bloğu ya gerçek veriyle dolu ya da hiç render edilmiyor
- [ ] CV PDF `public/cv/dogancanyildiz-cv.pdf` yolunda ise Download CV butonu görünüyor,
      dosya yoksa buton hiç yok

## 3. SEO ve i18n

- [ ] `https://dogancanyildiz.sh/sitemap.xml` Search Console'a gönderildi ve hatasız işlendi
- [ ] Search Console'da hem `/` hem `/tr` kapsamı doğrulandı
- [ ] Bir hreflang test aracıyla (technicalseo.com hreflang tester) ana sayfa, `/about`,
      `/projects`, bir proje detayı ve iki dilli blog yazısı tek tek tarandı, self-referencing
      ve karşılıklı hreflang hatası yok
- [ ] Yalnız TR olan blog yazısının EN adresi 404 dönüyor ve EN sitemap'inde geçmiyor
- [ ] `robots.txt` doğru domain'i ve `Disallow: /api/` satırını içeriyor
- [ ] `/feed.xml` ve `/tr/feed.xml` 200 ve `application/rss+xml` dönüyor

## 4. Performans ve erişilebilirlik

- [ ] Lighthouse (mobil, production URL): Performance, Accessibility, Best Practices ve
      SEO skorları kaydedildi; SEO 100, Accessibility 95 altına düşmüyor
- [ ] DevTools Network sekmesinde Google Fonts isteği yok
- [ ] `prefers-reduced-motion: reduce` açıkken hiçbir kayma veya fade animasyonu çalışmıyor

## 5. Contact ve altyapı

- [ ] Production'da contact formu uçtan uca test edildi, gerçek e-posta `me@dogancanyildiz.com`
      adresine ulaştı
- [ ] Honeypot alanı dolu bir `curl` isteği 4xx ile reddediliyor
- [ ] `curl -I https://dogancanyildiz.com/tr/about` tek atlamada
      `https://dogancanyildiz.sh/tr/about` adresine 301 dönüyor (site sahibinin domain
      onayı alındıktan sonra, bkz. `docs/11-acik-sorular.md` soru 5)
- [ ] Coolify sağlık kontrolü yeşil, `/api/health` 200 dönüyor
```

- [ ] **Step 4: README'ye içerik ekleme talimatını ekle**

`README.md` sonuna ekle:

```markdown
## İçerik ekleme

Proje ve blog içerikleri `content/` altında MDX olarak durur ve build sırasında Velite ile derlenir.

- Proje: `content/projects/<locale>/<slug>.mdx`, zorunlu alanlar `title`, `slug`, `summary`,
  `role`, `stack`, `year`, `outcome`.
- Blog: `content/blog/<locale>/<slug>.mdx`, zorunlu alanlar `title`, `slug`, `date`, `summary`.
- `<locale>` yalnızca `en` veya `tr` olabilir, locale klasör adından türetilir.
- Aynı içeriğin iki dildeki dosyası AYNI `slug` değerini taşımalıdır; hreflang eşleşmesi
  slug üzerinden kurulur. Çevirisi olmayan slug diğer dilin route, sitemap ve hreflang
  alternates'ine hiç girmez.
- Kapak görseli isteğe bağlıdır: `content/images/` altına konur ve frontmatter'da göreli
  yolla (`cover: ../../images/<slug>-cover.png`) referans verilir. Görsel yoksa `cover`
  alanı hiç yazılmaz, içerik kapaksız yayınlanır.

Yerel geliştirmede `npm run dev` velite'ı izleme modunda başlatır. Şemayı doğrulamak için
`npm run build:content` yeterlidir.
```

- [ ] **Step 5: Tüm kapıları son kez çalıştır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content && npm run typecheck && npm run lint && npm test && npm run format
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
```

Beklenen: hepsi 0 exit code.

- [ ] **Step 6: Commit ve PR**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
git add tests docs README.md
git commit -m "test(content): guard against template residue and add launch checklist"
git push -u origin feature/faz-4-icerik-ve-yayin
gh pr create --base main --title "Faz 4: content pipeline, real content, blog and launch" --body "$(cat <<'BODY'
Phase 4 of the modernization plan: docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md

- Velite 0.4.0 content pipeline with zod schemas for projects and posts
- Five real case studies and three Turkish posts, one of them translated into English
- Blog index, post detail with BlogPosting json-ld, per locale RSS feed
- Sitemap and hreflang alternates list only the translations that actually exist
- Template persona removed: real name, real social links, DCY monogram, conditional CV button

Done criteria: docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md, "Bitti sayılma kriteri"
Launch gate: docs/launch-checklist.md
BODY
)"
```

---

## Bitti sayılma kriteri

Aşağıdaki komutların tamamı sırayla çalıştırılır ve beklenen çıktıyı vermelidir. Herhangi biri sapıyorsa faz bitmemiştir.

**1. Otomatik kapılar**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
npm run build:content && npm run typecheck && npm run lint && npm test && npm run format
```

Beklenen: hepsi 0 exit code; vitest çıktısında `tests/content-schema.test.ts`, `tests/content-layer.test.ts`, `tests/alternates.test.ts`, `tests/sitemap.test.ts`, `tests/profile.test.ts`, `tests/no-template-residue.test.ts` dosyalarının tamamı PASS.

**2. Şablon kalıntısı sıfır**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -ril "alex chen\|techcorp\|startupxyz\|example\.com\|alex@" $(git ls-files src content messages public .env.example); echo "exit=$?"
```

Beklenen çıktı: `exit=1` (hiçbir dosya eşleşmiyor).

**3. Build ve statik route kontrolü**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build
```

Beklenen: build başarılı; route tablosunda dynamic (ƒ) işaretli yol yalnızca `/api/*` altında; `/[lang]/projects/[slug]`, `/[lang]/blog/[slug]` ve `/[lang]/feed.xml` statik.

**4. İçerik hacmi**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
node -e "
const pr=require('./.velite/projects.json'), po=require('./.velite/posts.json');
const en=pr.filter(p=>p.locale==='en').length, tr=pr.filter(p=>p.locale==='tr').length;
console.log('projects en='+en+' tr='+tr);
console.log('posts tr='+po.filter(p=>p.locale==='tr').length+' en='+po.filter(p=>p.locale==='en').length);
console.log('covers='+pr.filter(p=>p.cover).length);
"
```

Beklenen çıktı:

```
projects en=5 tr=5
posts tr=3 en=1
covers=0
```

`covers=0` bugünkü doğru durumdur (görseller teslim edilmedi, projeler kapaksız yayınlanıyor). Görsel geldikçe bu sayı artar, azalması bir regresyondur.

**5. Uçtan uca HTTP doğrulaması**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
for path in / /tr /about /tr/about /projects /tr/projects /blog /tr/blog /contact /tr/contact \
  /projects/cargo-pilot /tr/projects/cargo-pilot /tr/blog/self-hosting-with-coolify \
  /blog/self-hosting-with-coolify /feed.xml /tr/feed.xml /sitemap.xml /robots.txt; do
  printf "%s -> %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$path)"
done
printf "%s -> %s\n" "/blog/capt-sinavina-hazirlik" \
  "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/blog/capt-sinavina-hazirlik)"
kill %1
```

Beklenen: listedeki 18 yolun tamamı `200`; son satır `/blog/capt-sinavina-hazirlik -> 404` (çevirisi olmayan yazı diğer dilde üretilmiyor).

**6. hreflang doğruluğu**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/about | grep -o 'hreflang="[a-z-]*"' | sort -u
curl -s http://localhost:3000/tr/blog/capt-sinavina-hazirlik | grep -o 'hreflang="[a-z-]*"' | sort -u
kill %1
```

Beklenen: birinci komut `hreflang="en"`, `hreflang="tr"`, `hreflang="x-default"`; ikinci komut yalnızca `hreflang="tr"` ve `hreflang="x-default"`.

**7. JSON-LD varlığı**

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm start &
sleep 5
curl -s http://localhost:3000/projects/wikonya | grep -c '"@type":"CreativeWork"'
curl -s http://localhost:3000/tr/blog/ccna-dan-web-guvenligine | grep -c '"@type":"BlogPosting"'
kill %1
```

Beklenen çıktı: `1` ve `1`.

**8. Elle yapılan yayın öncesi kontroller**

`docs/launch-checklist.md` içindeki 5 bölümün tamamı işaretlenmiş olmalı: Lighthouse ölçümü kaydedilmiş, hreflang üçüncü parti araçla taranmış, Search Console'a sitemap gönderilmiş ve hatasız işlenmiş, contact formu production'da uçtan uca test edilmiş (gerçek e-posta ulaşmış), Cloudflare 301 kuralı tek atlamada doğrulanmış.

Bu sekiz maddenin tamamı geçtiğinde Faz 4 biter ve launch noktasına ulaşılmış olur.

---

## Devir notu şablonu

Faz 5 ajanına aktarılacak not aşağıdaki başlıklarla doldurulur.

```markdown
# Faz 4 devir notu

## Yapıldı
- Velite <sürüm> kuruldu, `velite.config.ts` içinde `projects` ve `posts` koleksiyonları tanımlı.
- `content/` altında <N> proje (EN/TR) ve <M> blog yazısı yayında.
- `src/data/projects.ts` ve `src/data/skills.ts` kaldırıldı, veri kaynağı Velite ve `src/content/profile.ts`.
- Blog listesi, blog detayı, RSS feed ve sitemap/hreflang entegrasyonu tamamlandı.
- Gerçek metinler `messages/en.json` ve `messages/tr.json` içine yazıldı, şablon persona tamamen kaldırıldı.

## Doğrulandı
- `npm run build:content && npm run typecheck && npm run lint && npm test && npm run format`: <sonuç>
- `NEXT_PUBLIC_SITE_URL=... npm run build`: dynamic route yalnızca `/api/*`: <evet/hayır>
- Şablon kalıntısı grep taraması: <sonuç>
- hreflang: çevirisi olmayan yazının diğer dil adresi 404: <evet/hayır>
- `docs/launch-checklist.md` bölümleri: <hangileri işaretlendi>

## Açık kaldı
- CV PDF dosyası teslim edildi mi? (`public/cv/dogancanyildiz-cv.pdf`) Buton koşullu render ediliyor.
- Sertifika `verifyUrl` linkleri geldi mi? (`src/content/profile.ts` içinde alanlar hazır)
- Proje ekran görüntüleri geldi mi? (`content/images/`, `cover` alanı hazır, şu an kapaksız)
- Konuşmalar bloğu verisi geldi mi? (`src/content/profile.ts` içindeki `speaking` dizileri boş)
- Domain kararı: `.com -> .sh` 301 canlıya alındı mı? (`docs/11-acik-sorular.md` soru 5)

## Üretilen arayüzler (Faz 5 bunları kullanır)
- `#site/content` alias'ı ve `.velite/` çıktısı (`projects.json`, `posts.json`, `index.d.ts`)
- `src/lib/content.ts`: `Locale`, `Project`, `Post`, `CoverImage`, `ProjectCardData`, `PostCardData`,
  `getProjects`, `getFeaturedProjects`, `getProject`, `getProjectSlugs`, `getProjectLocales`,
  `getPosts`, `getPost`, `getPostSlugs`, `getPostLocales`, `toProjectCardData`, `toPostCardData`
- `src/lib/seo/alternates.ts`: `siteUrl` (yalnızca `@/lib/env`'in yeniden dışa aktarımı), `localePath`, `absoluteUrl`, `buildAlternates`. Faz 2'nin `src/lib/seo/locale-url.ts`, `src/lib/seo/site-url.ts` ve `src/lib/content/project-locales.ts` dosyaları bu fazda SİLİNDİ.
- `src/lib/site.ts`: `SOCIAL` (Faz 2'nin `siteConfig.person.sameAs` dizisinden türetilir), `CONTACT_EMAIL_PUBLIC`. Kişi kaydının tek kaynağı hâlâ `src/lib/site-config.ts`.
- `src/lib/cv.ts`: `CV_PATH`, `hasCv`
- `src/content/profile.ts`: `SkillGroup`, `ExperienceEntry`, `CommunityEntry`, `SpeakingEntry`,
  `CertificateEntry`, `EducationEntry`, `skills`, `experience`, `community`, `speaking`,
  `certificates`, `education`
- `src/components/content/mdx-content.tsx`: `<MDXContent code />`
- `src/components/seo/json-ld.tsx`: `<JsonLd data />` (Faz 5'te status widget'ı için de kullanılabilir)
- `src/components/sections/project-grid.tsx`, `project-card.tsx`, `post-list.tsx`
- `.prose-content` CSS sınıfı (`src/app/globals.css`)
- npm script'leri: `build:content`, `build` (velite + next), `dev` (velite --watch + next dev)
```

---

## Notlar ve varsayımlar

1. **Konuşmalar verisi teslim edilmedi.** `docs/08-icerik-stratejisi.md` karar 4 sahibinin etkinlik, konu ve tarih bilgisini verebildiğini söylüyor, ancak `.local/content/portfolio-content.md` bölüm 6'da bu alan hâlâ köşeli parantezli placeholder. Plan, verilmemiş veriyi uydurmak yerine `speaking` dizilerini boş bırakıp bloğu koşullu render ediyor ve placeholder metni bir testle yasaklıyor. Veri geldiğinde tek yapılacak `src/content/profile.ts` içindeki iki diziyi doldurmak.
2. **Blog slug'ları iki dilde aynıdır.** hreflang eşleşmesi slug üzerinden kurulduğu için TR yazısının EN çevirisi Türkçe bir slug taşımaz; `self-hosting-with-coolify` her iki dilde de kullanılır.
3. **`velite --clean && next build` sıralaması bilinçlidir.** Velite'ın `next.config.ts` içine gömülen varyantı derlemeyi beklemediği için Docker'da yarış koşulu üretir.
4. **`/feed.xml` proxy matcher'ına elle eklendi.** next-intl'in varsayılan matcher'ı nokta içeren yolları hariç tuttuğu için aksi halde EN feed'i 404 döner.
5. **`new Function(code)` yalnızca sunucuda çalışır.** Sayfalar statik prerender edildiği için tarayıcıya eval gitmez, CSP'de `unsafe-eval` gerekmez. `mdx-content.tsx` dosyasına `"use client"` eklemek bu güvenceyi bozar.
6. **Rehype eklentilerinin sürümleri `@latest` ile kurulur.** Yalnızca velite exact pin'lidir (0.4.0); `rehype-slug`, `rehype-autolink-headings`, `@shikijs/rehype` ve `shiki` caret ile kurulur ve `package-lock.json` commit edilir.
7. **Proje sayısı 5.** `docs/08-icerik-stratejisi.md` 4-5 diyor; Sportlink yerine GPA seçildi çünkü GPA'nın public linki ve deposu var, Sportlink'in ise canlı linki yok.
8. **CV butonu dosya varlığına bağlıdır.** `public/cv/dogancanyildiz-cv.pdf` teslim edilene kadar buton hiç render edilmez, kırık bir link yayına çıkmaz.

## Self-Review

**1. Spec kapsamı.** Velite exact pin ve şema (Task 1), locale klasörden türetme (Task 1), rehype-slug + autolink + shiki (Task 1), build/dev script'leri ve `.velite` gitignore (Task 1), `src/data/projects.ts` kaldırma (Task 5), Velite'tan beslenen proje listesi ve mono künyeli detay + koşullu kapak (Task 5, 6), blog listesi ve detayı + BlogPosting JSON-LD (Task 7, 8), RSS (Task 9), yalnızca var olan çevirilerin sitemap'e girmesi (Task 10), hero/about/contact gerçek metinleri ve TR çevirileri (Task 11), Speaking + sertifika `verifyUrl` + Harp Okulu nötr satırı + CEFR yok + GDG rolleri (Task 12), footer/header gerçek linkleri, DCY monogramı, koşullu Download CV, `public/cv/.gitkeep` (Task 13), 3 TR + 1 EN blog yazısı (Task 7, 14), kalıntı grep testi (Task 15), yayın öncesi kontrol listesi (Task 15), üç zorunlu test türü (Task 1, 10, 15). Kapsam dışı bırakılan hiçbir spec maddesi kalmadı.

**2. Yer tutucu taraması.** "TBD", "uygun şekilde", "benzer şekilde", "Task N'deki gibi" ifadeleri planda geçmiyor. Her kod adımı tam dosya içeriği veya tam blok veriyor. Task 12'nin `hasCv`/`CV_PATH` bağımlılığı Task 13'e işaret ediyor ve bu bağımlılık adımın içinde açıkça yazılı, gizli bir referans değil.

**3. Tip tutarlılığı.** `Locale` tek yerde (`src/lib/content.ts`) tanımlanıyor, `alternates.ts` ve `profile.ts` onu import ediyor. `ProjectCardData.href` locale öneksiz, tüm tüketiciler next-intl `Link` kullanıyor; mutlak URL gereken üç yer (`sitemap.ts`, `feed.xml/route.ts`, JSON-LD) `absoluteUrl` kullanıyor. `getProjectLocales` / `getPostLocales` dönüş tipi `Locale[]`, `buildAlternates`'in üçüncü parametresiyle birebir uyuşuyor. Velite şemasındaki `order` alanı `.default(100)` olduğu için `Project["order"]` daima `number`, `byProjectOrder` karşılaştırması güvenli. `post.metadata.readingTime` iki yerde (`toPostCardData` ve blog detayı) aynı `Math.max(1, Math.round(...))` normalizasyonundan geçiyor.
