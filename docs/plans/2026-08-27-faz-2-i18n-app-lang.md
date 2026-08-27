# Faz 2: i18n yeniden mimarisi (app/[lang] + next-intl) Implementation Plan


> Durum: Uygulandı, PR #4 merge edildi (main). Devir notu: handoffs/faz-2.md
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cookie tabanlı i18n katmanını tamamen kaldırıp EN'i kökte, TR'yi `/tr` altında ayrı ve crawl edilebilir URL'lerde sunan, tüm içerik route'ları build zamanında prerender edilen, canonical/hreflang/x-default üreten bir `app/[lang]` + next-intl mimarisi kurmak.

**Architecture:** Route ağacı `src/app/[lang]/` altına taşınır ve kök layout burada yaşar; `src/app/api/` `[lang]` dışında kalır. next-intl 4.13.7 dört dosyaya yayılır: `src/i18n/routing.ts` (tek yapılandırma kaynağı), `src/i18n/request.ts` (locale -> `messages/<locale>.json`), `src/i18n/navigation.ts` (locale bilen `Link`/`usePathname`) ve `src/proxy.ts` (Next 16 proxy convention). Mesajlar `src/lib/i18n/translations.ts`'ten `messages/en.json` ve `messages/tr.json`'a taşınır, `cookies()` çağrılarının tamamı silinir, metadata/sitemap/robots `lang` route param'ından üretilir.

**Tech Stack:** Next.js 16.3.3 (App Router, `proxy.ts`, async `params`), React 19.2.x, next-intl 4.13.7, TypeScript 5.9, Tailwind CSS 4.3.x, motion 13.1.1 (`motion/react`), vitest (node environment), npm.

**Spec:**
- `docs/04-i18n.md` (URL stratejisi, kütüphane seçimi, dosya yapısı, tripwire'lar)
- `docs/07-seo-ve-metadata.md` (generateMetadata, alternates, sitemap, robots, JSON-LD)
- `docs/01-mevcut-durum-denetimi.md` (F2, F7, B6 bulguları ve kanıt satırları)
- `docs/10-yol-haritasi.md` (Faz 2 madde listesi ve bitti sayılma kriteri)
- `docs/00-ozet-ve-karar.md` (faz sırası, sürüm tablosu)

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

## Bu fazın ön koşulları

- Faz 0 merge edilmiş: `next` 16.3.3, `motion` 13.1.1 (`motion/react` import'ları), `next.config.ts` içinde `output: 'standalone'`, `.nvmrc`, `typecheck`/`test`/`format` script'leri, vitest kurulumu, `NEXT_PUBLIC_SITE_URL` `.env.example`'da, `robots.ts`/`sitemap.ts`'teki `https://example.com` fallback'i kaldırılmış.
- Faz 1 merge edilmiş: Dockerfile, `.dockerignore`, GitHub Actions kapısı, Coolify auto-deploy.
- Dal: `feature/faz-2-i18n-app-lang`, main'den açılır, tek PR olarak merge edilir.

```bash
git checkout main
git pull --ff-only
git checkout -b feature/faz-2-i18n-app-lang
node -v          # v24.x bekleniyor
npm ls next      # next@16.3.3 bekleniyor
```

## İçerik politikası notu (bu faz için bağlayıcı)

Bu faz **mesajları taşır, metinleri yazmaz**. `messages/en.json` ve `messages/tr.json` içindeki `"Alex Chen"`, `"alex@example.com"`, `"TechCorp Inc."` gibi değerler `src/lib/i18n/translations.ts`'ten **birebir** (yalnızca uzun/en çizgiler kısa çizgiye normalize edilerek) taşınır ve **Faz 4'te gerçek içerikle değiştirilir**. Gerekçe: mevcut kopyayı taşımak yeni bir placeholder yayınlamak değildir ve diff'i okunur tutar.

Tek istisna, bu fazda **sıfırdan üretilen** yapılandırılmış veridir: Person JSON-LD'de taşınacak eski bir değer yoktur ve uydurma bir kimliği schema.org işaretlemesine yazmak Google tarafında geri alınması pahalı bir hatadır. Bu yüzden JSON-LD `.local/content/portfolio-content.md` satır 238-241'deki gerçek verilerle (`Doğan Can Yıldız`, `github.com/dogancanyildiz`, `linkedin.com/in/dogancanyildiz`, Konya) yazılır. Bu ayrım Task 6'da tekrar edilir.

## Dosya yapısı

Bu fazın sonunda repo'nun i18n ile ilgili tüm yüzeyi:

```
messages/
  en.json                     # tüm EN mesajları (namespace: nav, hero, home, footer, about, projects, contact, form, metadata, api)
  tr.json                     # aynı anahtar kümesi, TR değerler
src/
  proxy.ts                    # next-intl middleware, matcher /api ve statik dosyaları dışlar
  i18n/
    routing.ts                # defineRouting: tek yapılandırma kaynağı
    request.ts                # getRequestConfig: locale dogrulama + mesaj yükleme
    navigation.ts             # createNavigation: Link, redirect, usePathname, useRouter, getPathname
  app/
    [lang]/
      layout.tsx              # kök layout (html/body), setRequestLocale, generateStaticParams
      page.tsx                # ana sayfa + Person JSON-LD
      opengraph-image.tsx     # [lang] segmentine bağlı OG görseli
      about/page.tsx
      projects/page.tsx
      projects/[slug]/page.tsx
      contact/page.tsx
    api/contact/route.ts      # [lang] dışında, locale'i request body'sinden okur
    icon.tsx                  # değişmiyor
    favicon.ico               # değişmiyor
    robots.ts                 # iki locale, /api disallow
    sitemap.ts                # iki locale, per-entry alternates
    globals.css               # değişmiyor
  components/
    layout/header.tsx         # navigation Link + usePathname
    layout/footer.tsx         # navigation Link
    layout/language-switcher.tsx  # URL tabanlı, cookie yok
    sections/about-content.tsx      # eski src/app/about/page.tsx gövdesi
    sections/contact-page-content.tsx  # eski src/app/contact/contact-page-content.tsx
    seo/person-jsonld.tsx     # Person yapılandırılmış verisi
  lib/
    seo/locale-url.ts         # localePath / localeUrl / buildAlternates
    content/project-locales.ts  # bir slug'ın hangi dillerde var olduğu (Faz 4'te Velite'a bağlanacak seam)
    site-config.ts            # gerçek kişi verisi (JSON-LD ve Faz 4 için tek kaynak)
tests/
  i18n/routing.test.ts
  seo/locale-url.test.ts
  seo/sitemap.test.ts
scripts/
  assert-static-routes.mjs    # prerender-manifest.json üzerinden statiklik denetimi
```

Silinen dosyalar: `src/lib/i18n/translations.ts`, `src/lib/i18n/use-translation.ts`, `src/components/locale-provider.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/layout.tsx`, `src/app/about/page.tsx`, `src/app/projects/layout.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/contact/layout.tsx`, `src/app/contact/page.tsx`, `src/app/contact/contact-page-content.tsx`, `src/app/opengraph-image.tsx`.

---

### Task 1: next-intl kurulumu ve i18n yapılandırması

**Files:**
- Modify: `package.json` (dependencies)
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`
- Create: `messages/en.json`
- Create: `messages/tr.json`
- Modify: `next.config.ts`
- Modify/Create: `vitest.config.ts`
- Test: `tests/i18n/routing.test.ts`

**Interfaces:**
- Consumes: Faz 0'ın bıraktığı `npm run test` (= `vitest run`), `npm run typecheck` (= `tsc --noEmit`), `next.config.ts` içindeki `output: 'standalone'`.
- Produces:
  - `src/i18n/routing.ts`: `export const routing` (tip: `defineRouting` dönüşü; alanlar `locales: readonly ["en","tr"]`, `defaultLocale: "en"`, `localePrefix: "as-needed"`, `localeDetection: false`, `localeCookie: false`)
  - `src/i18n/navigation.ts`: `export const { Link, redirect, usePathname, useRouter, getPathname }` (next-intl `createNavigation(routing)` dönüşü)
  - `src/i18n/request.ts`: `export default getRequestConfig(...)` (next-intl plugin tarafından otomatik bulunur)
  - `messages/en.json`, `messages/tr.json`: namespace kümesi `nav`, `brand`, `hero`, `home`, `footer`, `about`, `projects`, `contact`, `form`, `metadata`, `api`

- [ ] **Step 1: next-intl bağımlılığını exact pin ile ekle**

```bash
npm install --save-exact next-intl@4.13.7
```

Beklenen: `package.json` içindeki `dependencies` bloğuna caret'siz `"next-intl": "4.13.7"` satırı eklenir, `package-lock.json` güncellenir.

```bash
grep '"next-intl"' package.json
# beklenen çıktı:     "next-intl": "4.13.7",
```

- [ ] **Step 2: Routing yapılandırması için başarısız testi yaz**

`tests/i18n/routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
  it("serves English at the root and Turkish under a prefix", () => {
    expect(routing.locales).toEqual(["en", "tr"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("never redirects based on Accept-Language or cookies", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.localeCookie).toBe(false);
  });
});
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm run test`
Expected: FAIL, `Failed to resolve import "@/i18n/routing"` (dosya henüz yok).

- [ ] **Step 4: vitest.config.ts dosyasının `@` alias'ını çözdüğünden emin ol**

Dosya Faz 0'da oluşturulduysa içeriğini aşağıdakiyle değiştir, yoksa oluştur. `tests/` dizini ve node ortamı bu fazın testleri için zorunlu.

`vitest.config.ts`:

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

- [ ] **Step 5: routing.ts dosyasını yaz**

`src/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for locale routing.
 *
 * localePrefix "as-needed" keeps English on the root (/, /about) and puts
 * Turkish under /tr (/tr, /tr/about). Automatic locale detection and the
 * NEXT_LOCALE cookie are both disabled on purpose: the URL is the only
 * signal that decides the language, so every page stays cacheable and
 * crawlable. See docs/04-i18n.md.
 */
export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
```

Not: `docs/04-i18n.md` bu ayarı `createMiddleware({ ...routing, localeDetection: false })` olarak gösteriyor. Davranış aynıdır; ayar `routing.ts`'e alındı çünkü tek kaynak olması hem `request.ts`/`navigation.ts` ile tutarlılığı hem de Step 2'deki birim testiyle doğrulanabilmesini sağlıyor.

- [ ] **Step 6: Testi tekrar çalıştır**

Run: `npm run test`
Expected: PASS, 2 passed.

- [ ] **Step 7: request.ts dosyasını yaz**

`src/i18n/request.ts`:

```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Corresponds to the [lang] segment; undefined in Route Handlers, where the
  // locale is passed explicitly instead.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 8: navigation.ts dosyasını yaz**

`src/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 9: next.config.ts dosyasına next-intl plugin'ini ekle**

Mevcut dosyada Faz 0'dan gelen `output`, `poweredByHeader` ve `headers()` alanları duruyor. Yalnızca import satırı ve export sarmalaması eklenir, mevcut alanlar aynen korunur:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Faz 0'dan gelen alanlar (output, poweredByHeader, headers) burada aynen kalır.
  output: "standalone",
  poweredByHeader: false,
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

Plugin argümansız çağrılır; `./src/i18n/request.ts` yolunu kendisi bulur.

**Dikkat:** Faz 0'ın `headers()` fonksiyonu ve varsa başka alanları silinmemeli. Değişiklikten sonra `git diff next.config.ts` çıktısı yalnızca iki import/export satırını göstermelidir.

- [ ] **Step 10: messages/en.json dosyasını yaz**

Değerler `src/lib/i18n/translations.ts`'in `en` bloğundan birebir alınmıştır; tek fark uzun çizgi (U+2014), en çizgi (U+2013) ve bölünemez çizginin (U+2011) kısa çizgiye normalize edilmesidir. `api` namespace'i ve `nav.languageLabel`, `metadata.ogAlt` anahtarları bu fazda yeni eklenmiştir.

`messages/en.json`:

```json
{
  "brand": "Alex Chen",
  "nav": {
    "home": "Home",
    "about": "About",
    "projects": "Projects",
    "contact": "Contact",
    "languageLabel": "Language"
  },
  "hero": {
    "greeting": "Hi, I'm",
    "name": "Alex Chen",
    "role": "Frontend Developer",
    "title": "Designing premium digital products with clarity, rhythm, and speed.",
    "subtitle": "I build interface systems, product experiences, and frontend architecture for teams that care about detail.",
    "viewProjects": "View projects",
    "contact": "Get in touch",
    "availableForWork": "Available for select work",
    "downloadCV": "Download CV",
    "eyebrow": "Independent frontend partner",
    "summaryTitle": "A sharper way to ship",
    "summaryBody": "From landing pages to internal tools, I turn rough product ideas into interfaces that feel editorial, modern, and easy to use.",
    "metricYears": "Years shipping products",
    "metricProjects": "Selected launches",
    "metricFocus": "Focus across design and code",
    "focus1": "Design systems",
    "focus2": "Product websites",
    "focus3": "Application UI",
    "focus4": "Frontend architecture",
    "note": "Currently based in Istanbul, collaborating remotely with product teams.",
    "focusLabel": "Focus"
  },
  "home": {
    "featuredTitle": "Featured projects",
    "featuredSubtitle": "A curated selection of launches, systems, and product work.",
    "skillsTitle": "Technologies I work with",
    "viewAll": "View all projects",
    "featuredEyebrow": "Selected work",
    "skillsEyebrow": "Capabilities",
    "skillsSubtitle": "A practical stack shaped by product delivery, systems thinking, and interface craft."
  },
  "footer": {
    "copyright": "All rights reserved.",
    "contact": "Contact",
    "github": "GitHub",
    "linkedin": "LinkedIn",
    "twitter": "Twitter",
    "elsewhere": "Elsewhere",
    "availability": "Available for select freelance and full-time collaborations.",
    "tagline": "Crafting interfaces with a calm visual voice and strong frontend foundations.",
    "emailLabel": "Primary email"
  },
  "about": {
    "title": "About",
    "intro": "I build product experiences that feel polished on the surface and dependable underneath.",
    "p1": "My work sits at the intersection of UI craft, frontend engineering, and system thinking. I care about speed, accessibility, and giving teams a visual language they can keep extending.",
    "p2": "Over the years I've worked on design systems, dashboards, e-commerce, internal tools, and launch surfaces. The throughline is always the same: make complex things feel legible.",
    "skillsTitle": "Skills & tools",
    "experienceTitle": "Experience",
    "educationTitle": "Education",
    "browseIntro": "You can browse my",
    "or": " or ",
    "projectsLink": "projects",
    "contactLink": "get in touch",
    "exp1Role": "Senior Frontend Developer",
    "exp1Company": "TechCorp Inc.",
    "exp1Period": "2021 - Present",
    "exp1Desc": "Lead frontend for the main product. Introduced design system and improved Core Web Vitals.",
    "exp2Role": "Frontend Developer",
    "exp2Company": "StartupXYZ",
    "exp2Period": "2019 - 2021",
    "exp2Desc": "Built customer dashboard and admin panel with React. Integrated REST and GraphQL APIs.",
    "exp3Role": "Junior Frontend Developer",
    "exp3Company": "WebAgency",
    "exp3Period": "2017 - 2019",
    "exp3Desc": "Developed responsive sites and small web apps. Worked with designers and backend team.",
    "edu1Degree": "B.Sc. Computer Science",
    "edu1School": "State University",
    "edu1Period": "2013 - 2017",
    "downloadCV": "Download CV",
    "skillsFrontend": "Frontend",
    "skillsBackend": "Backend",
    "skillsTools": "Tools",
    "eyebrow": "Profile",
    "manifestoEyebrow": "Approach",
    "manifestoTitle": "Frontend with an editorial eye",
    "manifestoBody": "I like products that feel deliberate: clear hierarchy, thoughtful motion, stable architecture, and just enough personality to be memorable.",
    "capabilitiesEyebrow": "Capabilities",
    "timelineEyebrow": "Career path",
    "educationEyebrow": "Background"
  },
  "projects": {
    "title": "Projects",
    "subtitle": "A collection of product, platform, and systems work spanning commerce, analytics, design systems, and internal tooling.",
    "backToProjects": "Back to projects",
    "viewLive": "Live demo",
    "viewSource": "Source code",
    "technologies": "Technologies",
    "notFound": "Project not found",
    "eyebrow": "Archive",
    "filtersTitle": "Browse by stack",
    "all": "All",
    "summary": "Project summary",
    "impact": "Impact",
    "role": "Role",
    "links": "Links",
    "items": {
      "1": {
        "title": "E-commerce platform",
        "description": "Full-stack online store with product catalog, cart, checkout, and admin panel. Built with Next.js, Stripe, and PostgreSQL. Handles thousands of SKUs and supports multiple locales."
      },
      "2": {
        "title": "Analytics dashboard",
        "description": "Real-time analytics dashboard for marketing teams. Custom charts, filters, and export to CSV/PDF. Integrates with Google Analytics and internal APIs. Used by 50+ companies."
      },
      "3": {
        "title": "Design system & docs",
        "description": "Internal design system with 40+ components, Storybook, and usage guidelines. Reduced UI inconsistency and sped up feature delivery across 5 product teams."
      },
      "4": {
        "title": "Developer CLI tool",
        "description": "Open-source CLI for scaffolding and deploying static sites. Published on npm with 10k+ weekly downloads. Written in TypeScript, supports plugins."
      },
      "5": {
        "title": "Mobile-first booking app",
        "description": "Booking flow for a service marketplace. Calendar, availability, payments, and push notifications. React Native (Expo) and Node.js backend."
      },
      "6": {
        "title": "Internal HR portal",
        "description": "Leave requests, timesheets, and org chart. SSO, role-based access, and audit logs. Built with React and .NET. Serves 500+ employees."
      }
    }
  },
  "contact": {
    "title": "Contact",
    "subtitle": "If you're shaping a product, refreshing a marketing surface, or refining a frontend system, I'd be glad to hear about it.",
    "location": "Based in Istanbul, Turkey",
    "email": "alex@example.com",
    "availability": "Open to full-time and freelance opportunities.",
    "eyebrow": "Start a conversation",
    "cardTitle": "What I can help with",
    "cardBody": "Design-forward product UI, landing page refreshes, component systems, and frontend clean-up for teams who want a sharper interface presence.",
    "responseTitle": "Typical response",
    "responseBody": "Usually within 1-2 business days.",
    "workingTitle": "Working style",
    "workingBody": "Structured, collaborative, and detail-oriented from kickoff through polish.",
    "availabilityTitle": "Availability",
    "availabilityBody": "Open for select product collaborations this quarter."
  },
  "form": {
    "name": "Name",
    "email": "Email",
    "subject": "Subject (optional)",
    "message": "Message",
    "placeholderName": "Your name",
    "placeholderEmail": "you@example.com",
    "placeholderSubject": "Subject",
    "placeholderMessage": "Your message...",
    "send": "Send message",
    "sending": "Sending...",
    "success": "Message sent. I'll get back to you soon.",
    "errorGeneric": "Something went wrong. Please try again.",
    "errorNetwork": "Network error. Please try again.",
    "introTitle": "Message",
    "introBody": "Share a little context and I'll reply with next steps."
  },
  "metadata": {
    "defaultTitle": "Alex Chen Portfolio",
    "defaultDescription": "Premium frontend portfolio, selected projects, experience, and contact.",
    "aboutTitle": "About",
    "aboutDescription": "About me and my work.",
    "projectsTitle": "Projects",
    "projectsDescription": "A selection of projects I've worked on.",
    "contactTitle": "Contact",
    "contactDescription": "Get in touch.",
    "ogAlt": "Portfolio"
  },
  "api": {
    "invalidRequest": "Invalid request. Name, email, and message are required.",
    "emailNotConfigured": "Email is not configured on the server.",
    "sendFailed": "The message could not be sent. Please try again later.",
    "tooManyRequests": "Too many requests. Please try again in a few minutes."
  }
}
```

- [ ] **Step 11: messages/tr.json dosyasını yaz**

Değerler `src/lib/i18n/translations.ts`'in `tr` bloğundan birebir alınmıştır, aynı çizgi normalizasyonu uygulanmıştır. Anahtar kümesi `en.json` ile birebir aynıdır.

`messages/tr.json`:

```json
{
  "brand": "Alex Chen",
  "nav": {
    "home": "Ana Sayfa",
    "about": "Hakkımda",
    "projects": "Projeler",
    "contact": "İletişim",
    "languageLabel": "Dil"
  },
  "hero": {
    "greeting": "Merhaba, ben",
    "name": "Alex Chen",
    "role": "Frontend Geliştirici",
    "title": "Netlik, ritim ve hızla premium dijital ürünler tasarlıyorum.",
    "subtitle": "Detaya önem veren ekipler için arayüz sistemleri, ürün deneyimleri ve frontend mimarisi geliştiriyorum.",
    "viewProjects": "Projeleri gör",
    "contact": "İletişime geç",
    "availableForWork": "Seçili işler için uygunum",
    "downloadCV": "CV İndir",
    "eyebrow": "Bağımsız frontend partneri",
    "summaryTitle": "Daha rafine teslimatlar",
    "summaryBody": "Landing page'lerden dahili araçlara kadar ham ürün fikirlerini editoryal, modern ve kullanımı kolay arayüzlere dönüştürüyorum.",
    "metricYears": "Yıllık ürün teslim deneyimi",
    "metricProjects": "Seçili lansman",
    "metricFocus": "Tasarım ve kod odağı",
    "focus1": "Tasarım sistemleri",
    "focus2": "Ürün siteleri",
    "focus3": "Uygulama arayüzleri",
    "focus4": "Frontend mimarisi",
    "note": "Şu anda İstanbul merkezli, ürün ekipleriyle uzaktan çalışıyorum.",
    "focusLabel": "Odak alanları"
  },
  "home": {
    "featuredTitle": "Öne çıkan projeler",
    "featuredSubtitle": "Yayına aldığım ürünler, sistemler ve arayüz çalışmalarından seçki.",
    "skillsTitle": "Çalıştığım teknolojiler",
    "viewAll": "Tüm projeleri gör",
    "featuredEyebrow": "Seçili işler",
    "skillsEyebrow": "Yetenekler",
    "skillsSubtitle": "Ürün teslimi, sistem yaklaşımı ve arayüz kalitesi etrafında şekillenmiş pratik bir teknoloji seti."
  },
  "footer": {
    "copyright": "Tüm hakları saklıdır.",
    "contact": "İletişim",
    "github": "GitHub",
    "linkedin": "LinkedIn",
    "twitter": "Twitter",
    "elsewhere": "Bağlantılar",
    "availability": "Seçili freelance ve tam zamanlı iş birliklerine açığım.",
    "tagline": "Sakin bir görsel dil ve güçlü frontend temelleriyle arayüzler geliştiriyorum.",
    "emailLabel": "Birincil e-posta"
  },
  "about": {
    "title": "Hakkımda",
    "intro": "Yüzeyde rafine, altında güvenilir hissettiren ürün deneyimleri geliştiriyorum.",
    "p1": "İşim; arayüz kalitesi, frontend mühendisliği ve sistem düşüncesinin kesişiminde duruyor. Hıza, erişilebilirliğe ve ekiplerin büyütebileceği bir görsel dile önem veriyorum.",
    "p2": "Yıllar içinde tasarım sistemleri, dashboard'lar, e-ticaret, dahili araçlar ve lansman yüzeyleri üzerinde çalıştım. Ortak hedef hep aynı: karmaşık işleri okunur hale getirmek.",
    "skillsTitle": "Yetenekler ve araçlar",
    "experienceTitle": "Deneyim",
    "educationTitle": "Eğitim",
    "browseIntro": "Projelerime göz atabilir veya",
    "or": " sayfasına gidebilir veya ",
    "projectsLink": "projeler",
    "contactLink": "iletişime geçin",
    "exp1Role": "Kıdemli Frontend Geliştirici",
    "exp1Company": "TechCorp Inc.",
    "exp1Period": "2021 - Günümüz",
    "exp1Desc": "Ana ürünün frontend'ine liderlik. Tasarım sistemi kuruldu, Core Web Vitals iyileştirildi.",
    "exp2Role": "Frontend Geliştirici",
    "exp2Company": "StartupXYZ",
    "exp2Period": "2019 - 2021",
    "exp2Desc": "React ile müşteri paneli ve admin arayüzü geliştirildi. REST ve GraphQL API entegrasyonları.",
    "exp3Role": "Junior Frontend Geliştirici",
    "exp3Company": "WebAgency",
    "exp3Period": "2017 - 2019",
    "exp3Desc": "Duyarlı siteler ve küçük web uygulamaları. Tasarımcılar ve backend ekibiyle çalışıldı.",
    "edu1Degree": "B.Sc. Bilgisayar Mühendisliği",
    "edu1School": "Devlet Üniversitesi",
    "edu1Period": "2013 - 2017",
    "downloadCV": "CV İndir",
    "skillsFrontend": "Frontend",
    "skillsBackend": "Backend",
    "skillsTools": "Araçlar",
    "eyebrow": "Profil",
    "manifestoEyebrow": "Yaklaşım",
    "manifestoTitle": "Editoryal bakış açısıyla frontend",
    "manifestoBody": "Benim için iyi ürünler; net hiyerarşi, yerinde motion, sağlam mimari ve akılda kalan ölçülü bir karakter taşır.",
    "capabilitiesEyebrow": "Yetkinlikler",
    "timelineEyebrow": "Kariyer yolu",
    "educationEyebrow": "Arka plan"
  },
  "projects": {
    "title": "Projeler",
    "subtitle": "E-ticaret, analitik, tasarım sistemleri ve dahili araçlar arasında uzanan ürün ve platform işleri.",
    "backToProjects": "Projelere dön",
    "viewLive": "Canlıya bak",
    "viewSource": "Kaynak kodu",
    "technologies": "Teknolojiler",
    "notFound": "Proje bulunamadı",
    "eyebrow": "Arşiv",
    "filtersTitle": "Teknolojiye göre filtrele",
    "all": "Tümü",
    "summary": "Proje özeti",
    "impact": "Etkisi",
    "role": "Rol",
    "links": "Bağlantılar",
    "items": {
      "1": {
        "title": "E-ticaret platformu",
        "description": "Ürün kataloğu, sepet, ödeme ve admin paneli olan tam yığın mağaza. Next.js, Stripe ve PostgreSQL. Binlerce SKU, çoklu dil desteği."
      },
      "2": {
        "title": "Analitik dashboard",
        "description": "Pazarlama ekipleri için gerçek zamanlı analitik. Özel grafikler, filtreler, CSV/PDF dışa aktarma. Google Analytics ve dahili API entegrasyonu. 50+ şirket tarafından kullanılıyor."
      },
      "3": {
        "title": "Tasarım sistemi ve dokümantasyon",
        "description": "40+ bileşenli dahili tasarım sistemi, Storybook ve kullanım kılavuzu. UI tutarlılığı artırıldı, 5 ürün ekibinde teslimat hızlandı."
      },
      "4": {
        "title": "Geliştirici CLI aracı",
        "description": "Statik siteleri iskeletleyen ve yayınlayan açık kaynak CLI. npm'de haftalık 10k+ indirme. TypeScript, eklenti desteği."
      },
      "5": {
        "title": "Mobil öncelikli rezervasyon uygulaması",
        "description": "Hizmet pazarı için rezervasyon akışı. Takvim, müsaitlik, ödemeler, push bildirimleri. React Native (Expo) ve Node.js backend."
      },
      "6": {
        "title": "Dahili İK portalı",
        "description": "İzin talepleri, zaman çizelgeleri, organizasyon şeması. SSO, rol tabanlı erişim, denetim kayıtları. React ve .NET. 500+ çalışan."
      }
    }
  },
  "contact": {
    "title": "İletişim",
    "subtitle": "Bir ürün şekillendiriyor, landing page yeniliyor ya da frontend sisteminizi rafine etmek istiyorsanız detayları duymaktan memnun olurum.",
    "location": "İstanbul, Türkiye",
    "email": "alex@example.com",
    "availability": "Tam zamanlı ve serbest çalışma fırsatlarına açığım.",
    "eyebrow": "Konuşmayı başlatalım",
    "cardTitle": "Destek olabileceğim alanlar",
    "cardBody": "Tasarım odaklı ürün arayüzleri, landing page yenilemeleri, component sistemleri ve daha güçlü bir arayüz varlığı isteyen ekipler için frontend iyileştirmeleri.",
    "responseTitle": "Yanıt süresi",
    "responseBody": "Genelde 1-2 iş günü içinde.",
    "workingTitle": "Çalışma tarzı",
    "workingBody": "Kickoff'tan son polish aşamasına kadar yapılandırılmış, iş birlikçi ve detay odaklı.",
    "availabilityTitle": "Uygunluk",
    "availabilityBody": "Bu çeyrekte seçili ürün iş birliklerine açığım."
  },
  "form": {
    "name": "Ad",
    "email": "E-posta",
    "subject": "Konu (isteğe bağlı)",
    "message": "Mesaj",
    "placeholderName": "Adınız",
    "placeholderEmail": "siz@ornek.com",
    "placeholderSubject": "Konu",
    "placeholderMessage": "Mesajınız...",
    "send": "Gönder",
    "sending": "Gönderiliyor...",
    "success": "Mesaj gönderildi. En kısa sürede dönüş yapacağım.",
    "errorGeneric": "Bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
    "errorNetwork": "Ağ hatası. Lütfen tekrar deneyin.",
    "introTitle": "Mesaj",
    "introBody": "Biraz bağlam paylaşın, sonraki adımlarla birlikte dönüş yapayım."
  },
  "metadata": {
    "defaultTitle": "Alex Chen Portfolyo",
    "defaultDescription": "Premium frontend portfolyosu, seçili projeler, deneyim ve iletişim.",
    "aboutTitle": "Hakkımda",
    "aboutDescription": "Ben ve çalışmalarım hakkında.",
    "projectsTitle": "Projeler",
    "projectsDescription": "Üzerinde çalıştığım projelerden bir seçki.",
    "contactTitle": "İletişim",
    "contactDescription": "İletişime geçin.",
    "ogAlt": "Portfolyo"
  },
  "api": {
    "invalidRequest": "Geçersiz istek. Ad, e-posta ve mesaj alanları zorunlu.",
    "emailNotConfigured": "E-posta gönderimi sunucuda yapılandırılmamış.",
    "sendFailed": "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
    "tooManyRequests": "Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin."
  }
}
```

- [ ] **Step 12: Anahtar kümelerinin iki dilde birebir aynı olduğunu doğrula**

```bash
node -e "
const en = require('./messages/en.json');
const tr = require('./messages/tr.json');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flat(v, p + k + '.') : [p + k]);
const a = flat(en).sort();
const b = flat(tr).sort();
const only = (x, y) => x.filter((k) => !y.includes(k));
console.log('en only:', only(a, b));
console.log('tr only:', only(b, a));
console.log('count:', a.length, b.length);
"
```

Expected:
```
en only: []
tr only: []
count: 148 148
```

Sayı iki tarafta eşit ve iki liste de boş olmalı. Boş değilse eksik anahtar eklenir.

- [ ] **Step 13: messages/ dizininin Docker build context'inde olduğunu doğrula**

```bash
grep -nE '^\s*(messages|src)' .dockerignore || echo "messages ve src dislanmiyor: OK"
```

Expected: `messages` veya `src` için bir dışlama satırı **çıkmamalı**. Çıkarsa `.dockerignore`'dan kaldır, çünkü `messages/*.json` build zamanında import ediliyor.

- [ ] **Step 14: Tam doğrulama**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: dördü de exit 0. Bu adımda `app/` yapısı hâlâ eski; plugin ve mesaj dosyaları henüz hiçbir sayfa tarafından kullanılmadığı için build çıktısı Faz 1'dekiyle aynı kalır.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json next.config.ts vitest.config.ts src/i18n messages tests/i18n
git commit -m "feat(i18n): add next-intl routing, request config and message catalogs"
```

---

### Task 2: app/[lang] route ağacı, proxy ve uygulama kabuğu

**Files:**
- Create: `src/proxy.ts`
- Create: `src/app/[lang]/layout.tsx`
- Create: `src/app/[lang]/page.tsx`
- Create: `src/app/[lang]/about/page.tsx`
- Create: `src/app/[lang]/projects/page.tsx`
- Create: `src/app/[lang]/projects/[slug]/page.tsx`
- Create: `src/app/[lang]/contact/page.tsx`
- Create: `src/app/[lang]/opengraph-image.tsx`
- Create: `src/components/sections/about-content.tsx`
- Create: `src/components/sections/contact-page-content.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/components/layout/language-switcher.tsx`
- Delete: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/layout.tsx`, `src/app/about/page.tsx`, `src/app/projects/layout.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/contact/layout.tsx`, `src/app/contact/page.tsx`, `src/app/contact/contact-page-content.tsx`, `src/app/opengraph-image.tsx`

**Interfaces:**
- Consumes: `routing` (`src/i18n/routing.ts`), `Link` / `usePathname` (`src/i18n/navigation.ts`), `messages/{en,tr}.json` namespace'leri (Task 1).
- Produces:
  - `src/app/[lang]/layout.tsx`: `export function generateStaticParams(): Array<{ lang: string }>`, `export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata>`, default export `LocaleLayout`
  - Her sayfa dosyası: `export function generateStaticParams()` ve `export default async function Page({ params }: { params: Promise<{ lang: string }> })`
  - `src/app/[lang]/projects/[slug]/page.tsx`: `generateStaticParams(): Array<{ lang: string; slug: string }>`, sayfa props'u `{ params: Promise<{ lang: string; slug: string }> }`
  - `src/components/sections/about-content.tsx`: `export function AboutContent(): JSX.Element` (client)
  - `src/components/sections/contact-page-content.tsx`: `export function ContactPageContent(): JSX.Element` (client)

**Geçiş notu:** Bu task'ta `src/components/locale-provider.tsx` ve `src/lib/i18n/translations.ts` **kasten yerinde bırakılır**. `[lang]` layout'u hem `NextIntlClientProvider` hem `LocaleProvider` render eder; kabuk bileşenleri (header, footer, language-switcher) next-intl'e geçer, içerik bileşenleri hâlâ eski sözlüğü kullanır ama artık cookie yerine URL'den gelen `lang` ile beslenir. Böylece bu task tek başına derlenir ve build edilir. Çift sağlayıcı Task 3'te kaldırılır.

- [ ] **Step 1: proxy.ts dosyasını yaz**

`src/proxy.ts`:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match every pathname except:
  // - /api (Route Handlers keep their own locale handling)
  // - /_next and /_vercel (framework internals)
  // - anything containing a dot (favicon.ico, robots.txt, sitemap.xml, static files)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
```

Dosya adı Next.js 16 konvansiyonudur (`middleware.ts` deprecated, bkz. nextjs.org/docs/messages/middleware-to-proxy). `localeDetection: false` ve `localeCookie: false` `routing`'den gelir (Task 1, Step 5).

- [ ] **Step 2: Kök layout'u [lang] altında oluştur**

`src/app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("defaultTitle")}`,
    },
    description: t("defaultDescription"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  // Enables static rendering for this layout and everything below it.
  setRequestLocale(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {/* Transitional: removed in Task 3 once every component reads from next-intl. */}
            <LocaleProvider initialLocale={lang}>
              <Header />
              <main className="min-h-[calc(100vh-7rem)]">{children}</main>
              <Footer />
            </LocaleProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Ana sayfayı oluştur**

`src/app/[lang]/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Hero } from "@/components/sections/hero";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { SkillsStrip } from "@/components/sections/skills-strip";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return (
    <>
      <Hero />
      <FeaturedProjects />
      <SkillsStrip />
    </>
  );
}
```

- [ ] **Step 4: About sayfasının client gövdesini bileşene taşı**

`git mv` ile taşı, sonra üstteki iki satırı düzelt:

```bash
git mv src/app/about/page.tsx src/components/sections/about-content.tsx
```

`src/components/sections/about-content.tsx` dosyasında yalnızca şu değişiklikler yapılır (gövde aynen kalır):

```tsx
// 3. satır: import Link from "next/link";  ->
import { Link } from "@/i18n/navigation";

// 11. satır: export default function AboutPage() {  ->
export function AboutContent() {
```

Dosyanın ilk satırındaki `"use client";` ve `motion` import'u aynen kalır.

- [ ] **Step 5: About route'unu oluştur**

`src/app/[lang]/about/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AboutContent } from "@/components/sections/about-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <AboutContent />;
}
```

- [ ] **Step 6: Projects liste route'unu oluştur**

`src/app/[lang]/projects/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ProjectsSection } from "@/components/sections/projects-section";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ProjectsSection />;
}
```

- [ ] **Step 7: Proje detay route'unu oluştur**

`src/app/[lang]/projects/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { projects } from "@/data/projects";
import { ProjectDetail } from "@/components/sections/project-detail";

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    projects.map((project) => ({ lang, slug: project.slug }))
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
```

- [ ] **Step 8: Contact içerik bileşenini taşı**

```bash
git mv src/app/contact/contact-page-content.tsx src/components/sections/contact-page-content.tsx
```

Dosya içinde değişiklik gerekmez; import'ları zaten `@/` alias'ı üzerinden ve bu dosya `Link` kullanmıyor.

- [ ] **Step 9: Contact route'unu oluştur**

`src/app/[lang]/contact/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ContactPageContent } from "@/components/sections/contact-page-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ContactPageContent />;
}
```

- [ ] **Step 10: opengraph-image route'unu [lang] altına taşı**

```bash
git mv src/app/opengraph-image.tsx src/app/[lang]/opengraph-image.tsx
```

Dosyanın **görsel içeriği bu fazda değişmiyor** (Faz 3'te gerçek isim, unvan ve yeni paletle yeniden yazılacak). Yalnızca üst kısım locale bilir hale gelir. Dosyanın ilk 8 satırı şununla değiştirilir:

```tsx
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return [{ id: "default", size, contentType, alt: t("ogAlt") }];
}

export default function OGImage() {
```

Bu düzenleme Faz 0'da silinmiş olan `export const runtime = "edge";` satırının geri gelmediğini de doğrular; dosyada `runtime` ifadesi bulunmamalı:

```bash
grep -n "runtime" "src/app/[lang]/opengraph-image.tsx" || echo "edge runtime yok: OK"
```

- [ ] **Step 11: Header'ı locale bilen navigasyona geçir**

`src/components/layout/header.tsx` içinde yalnızca import satırları ve `t` kaynağı değişir; JSX gövdesi aynen kalır. 1-22. satırlar şununla değiştirilir:

```tsx
"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navKeys = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/projects", key: "nav.projects" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const t = useTranslations();
```

`usePathname` artık `@/i18n/navigation`'dan geliyor ve locale prefix'i **kırpılmış** yol döndürüyor (`/tr/about` -> `/about`), bu yüzden 46-47. satırdaki aktiflik kontrolü değişmeden çalışır. `Link` de locale prefix'ini kendisi ekler.

- [ ] **Step 12: Footer'ı locale bilen navigasyona geçir**

`src/components/layout/footer.tsx` içinde 1-16. satırlar şununla değiştirilir, gövde aynen kalır:

```tsx
"use client";

import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const socialLinks = [
  { href: "https://github.com", labelKey: "footer.github", Icon: Github },
  { href: "https://linkedin.com", labelKey: "footer.linkedin", Icon: Linkedin },
  { href: "https://twitter.com", labelKey: "footer.twitter", Icon: Twitter },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations();
```

Not: `socialLinks` içindeki placeholder adresler ve `mailto:alex@example.com` bu fazda kasten değişmiyor, Faz 4'te gerçek linklerle değiştirilecek (denetim bulgusu F10).

- [ ] **Step 13: Language switcher'ı URL tabanlı hale getir**

`src/components/layout/language-switcher.tsx` dosyasının tamamı şununla değiştirilir:

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  en: "EN",
  tr: "TR",
};

const localeNames: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
};

export function LanguageSwitcher() {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("languageLabel")}
      className="flex rounded-full border border-border/70 bg-background/60 p-1"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            aria-current={isActive ? "true" : undefined}
            aria-label={localeNames[locale]}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] no-underline transition-colors",
              isActive
                ? "bg-accent/70 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
```

Cookie yazma, `setLocale` ve `motion` sarmalayıcıları tamamen kalktı: dil değişimi artık yalnızca URL değişimidir. `usePathname` locale prefix'siz yolu döndürdüğü için `href={pathname}` + `locale` prop'u doğru hedefi üretir (`/about` + `tr` -> `/tr/about`).

- [ ] **Step 14: Eski route dosyalarını sil**

```bash
git rm src/app/layout.tsx src/app/page.tsx \
  src/app/about/layout.tsx \
  src/app/projects/layout.tsx src/app/projects/page.tsx \
  "src/app/projects/[slug]/page.tsx" \
  src/app/contact/layout.tsx src/app/contact/page.tsx
```

`src/app/about/page.tsx` ve `src/app/contact/contact-page-content.tsx` Step 4 ve Step 8'de `git mv` ile taşındığı için burada listelenmiyor.

- [ ] **Step 15: Hiçbir yerde cookies() kalmadığını doğrula**

```bash
grep -rn "cookies()" src/ || echo "cookies() cagrisi yok: OK"
grep -rn "NEXT_LOCALE" src/ --exclude-dir=lib || echo "route katmaninda NEXT_LOCALE yok: OK"
```

Expected: iki komut da `OK` satırını basar. `src/lib/i18n/use-translation.ts` hâlâ `NEXT_LOCALE` sabitini içeriyor ama artık hiçbir yerden çağrılmıyor; o dosya Task 3 Step 11'de siliniyor, bu yüzden grep `lib` dizinini dışarıda bırakıyor.

- [ ] **Step 16: Build ve statik route doğrulaması**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: exit 0 ve build tablosunda `/[lang]`, `/[lang]/about`, `/[lang]/projects`, `/[lang]/projects/[slug]`, `/[lang]/contact` satırları prerender işaretiyle (`●` veya `○`) görünür; `ƒ` işaretli tek satır `/api/contact` olur.

- [ ] **Step 17: Çalışan sunucuda iki dili doğrula**

```bash
npm run start &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/en
curl -s http://localhost:3000/ | grep -o '<html lang="[a-z]*"'
curl -s http://localhost:3000/tr | grep -o '<html lang="[a-z]*"'
kill %1
```

Expected:
```
200
200
307 http://localhost:3000/
<html lang="en"
<html lang="tr"
```

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "feat(i18n): move routes under app/[lang] and add locale aware proxy"
```

---

### Task 3: İçerik bileşenlerini next-intl'e taşı ve eski i18n katmanını sil

**Files:**
- Modify: `src/components/sections/hero.tsx`
- Modify: `src/components/sections/featured-projects.tsx`
- Modify: `src/components/sections/skills-strip.tsx`
- Modify: `src/components/sections/projects-section.tsx`
- Modify: `src/components/sections/project-card.tsx`
- Modify: `src/components/sections/project-detail.tsx`
- Modify: `src/components/sections/contact-form.tsx`
- Modify: `src/components/sections/contact-page-content.tsx`
- Modify: `src/components/sections/about-content.tsx`
- Modify: `src/app/[lang]/layout.tsx`
- Delete: `src/lib/i18n/translations.ts`, `src/lib/i18n/use-translation.ts`, `src/components/locale-provider.tsx`

**Interfaces:**
- Consumes: `NextIntlClientProvider` (Task 2, `src/app/[lang]/layout.tsx`), `Link` (`src/i18n/navigation.ts`), `messages/{en,tr}.json` namespace'leri (Task 1).
- Produces: `useLocale()` ve `useTranslations()` dışında hiçbir dil kaynağı kalmaz; `src/components/locale-provider.tsx`'in `useLocale` export'u ve `translate(locale, key)` fonksiyonu repo'dan kalkar.

**Tip notu:** Bu fazda next-intl'in `AppConfig` / `Messages` TypeScript augmentation'ı (`declare module "next-intl"`) **kasten eklenmiyor**. Augmentation olmadan `t()` hesaplanmış anahtar kabul eder; `project-card.tsx` ve `project-detail.tsx` `t(\`projects.items.${project.id}.title\`)` çağrısını değiştirmeden kullanabilir. Anahtarların tip güvenliğine alınması, mesajlar Faz 4'te gerçek içerikle sabitlendikten sonra yapılacak ayrı bir adımdır.

- [ ] **Step 1: hero.tsx**

1-23. satırlar şununla değiştirilir, gövde aynen kalır:

```tsx
"use client";

import { motion } from "motion/react";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const t = useTranslations();
```

- [ ] **Step 2: featured-projects.tsx**

1-16. satırlar şununla değiştirilir:

```tsx
"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProjectCard } from "./project-card";
import { projects, featuredProjectIds } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const featured = featuredProjectIds
  .map((id) => projects.find((p) => p.id === id))
  .filter(Boolean) as typeof projects;

export function FeaturedProjects() {
  const t = useTranslations();
```

- [ ] **Step 3: skills-strip.tsx**

1-9. satırlar şununla değiştirilir:

```tsx
"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { skillCategories } from "@/data/skills";
import { SectionHeading } from "@/components/ui/section-heading";

export function SkillsStrip() {
  const t = useTranslations();
```

`skillCategories` içindeki `labelKey` değerleri (`about.skillsFrontend`, `about.skillsBackend`, `about.skillsTools`) `messages/*.json` içinde aynı yolda durduğu için `src/data/skills.ts` değişmez.

- [ ] **Step 4: projects-section.tsx**

1-11. satırlar şununla değiştirilir:

```tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProjectCard } from "./project-card";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";

export function ProjectsSection() {
  const t = useTranslations();
```

- [ ] **Step 5: project-card.tsx**

3-4. satırlardaki import'lar ve 13. satırdaki `useLocale` import'u şu üç satırla değiştirilir:

```tsx
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
```

ve 27. satır:

```tsx
  const t = useTranslations();
```

28-29. satırlardaki `t(\`projects.items.${project.id}.title\`)` ve `t(\`projects.items.${project.id}.description\`)` çağrıları **değişmez**.

- [ ] **Step 6: project-detail.tsx**

3-7. satırlar şununla değiştirilir:

```tsx
import { motion } from "motion/react";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";
```

ve 15. satır:

```tsx
  const t = useTranslations();
```

- [ ] **Step 7: contact-form.tsx**

1-14. satırlar şununla değiştirilir, gövde aynen kalır:

```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const t = useTranslations();
```

(İstek gövdesine `locale` alanının eklenmesi Task 7'de yapılır.)

- [ ] **Step 8: contact-page-content.tsx**

1-10. satırlar şununla değiştirilir:

```tsx
"use client";

import { motion } from "motion/react";
import { Mail, MapPin, Briefcase, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/sections/contact-form";
import { SectionHeading } from "@/components/ui/section-heading";

export function ContactPageContent() {
  const t = useTranslations();
```

- [ ] **Step 9: about-content.tsx**

Task 2 Step 4'te taşınan dosyanın 1-12. satırları şununla değiştirilir:

```tsx
"use client";

import { motion } from "motion/react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { skillCategories } from "@/data/skills";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

export function AboutContent() {
  const t = useTranslations();
```

- [ ] **Step 10: layout'tan geçici LocaleProvider'ı kaldır**

`src/app/[lang]/layout.tsx` içinde `import { LocaleProvider } from "@/components/locale-provider";` satırı silinir ve JSX şu hale gelir:

```tsx
          <NextIntlClientProvider>
            <Header />
            <main className="min-h-[calc(100vh-7rem)]">{children}</main>
            <Footer />
          </NextIntlClientProvider>
```

- [ ] **Step 11: Eski i18n katmanını sil**

```bash
git rm src/lib/i18n/translations.ts src/lib/i18n/use-translation.ts src/components/locale-provider.tsx
rmdir src/lib/i18n 2>/dev/null || true
```

- [ ] **Step 12: Hiçbir kalıntı referans kalmadığını doğrula**

```bash
grep -rn "locale-provider\|lib/i18n/translations\|use-translation\|NEXT_LOCALE\|framer-motion" src/ \
  || echo "eski i18n katmanindan kalinti yok: OK"
grep -rln "useLocale" src/
```

Expected: ilk komut `eski i18n katmanindan kalinti yok: OK` basar. İkinci komut yalnızca `useLocale`'i `next-intl`'den alan iki dosyayı listeler:

```
src/components/layout/language-switcher.tsx
src/components/sections/contact-form.tsx
```

(`contact-form.tsx` `useLocale`'i Task 7 Step 3'te alır; bu task tamamlandığında listede yalnızca `language-switcher.tsx` görünür.) Başka bir dosya listelenirse dönüşüm eksiktir.

- [ ] **Step 13: Doğrulama**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Expected: dördü de exit 0.

- [ ] **Step 14: İki dilin gerçekten farklı içerik döndürdüğünü doğrula**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000/about | grep -c "Hakkımda"
curl -s http://localhost:3000/tr/about | grep -c "Hakkımda"
curl -s http://localhost:3000/tr/projects | grep -o "Projelere dön\|Teknolojiye göre filtrele" | head -1
kill %1
```

Expected:
```
0
1
Teknolojiye göre filtrele
```

Yani EN sayfası TR metnini içermiyor, TR sayfası içeriyor.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "refactor(i18n): read all messages from next-intl and drop the cookie based dictionary"
```

---

### Task 4: Metadata, canonical ve hreflang

**Files:**
- Create: `src/lib/seo/locale-url.ts`
- Create: `src/lib/content/project-locales.ts`
- Test: `tests/seo/locale-url.test.ts`
- Modify: `src/app/[lang]/layout.tsx`
- Modify: `src/app/[lang]/page.tsx`
- Modify: `src/app/[lang]/about/page.tsx`
- Modify: `src/app/[lang]/projects/page.tsx`
- Modify: `src/app/[lang]/projects/[slug]/page.tsx`
- Modify: `src/app/[lang]/contact/page.tsx`

**Interfaces:**
- Consumes: `routing`, `AppLocale` (`src/i18n/routing.ts`); `getTranslations` (next-intl/server); Task 2'de oluşturulan sayfa dosyaları.
- Produces:
  - (Yeni dosya YOK) Site kökü Faz 0'ın `src/lib/env.ts` dosyasındaki `siteUrl(): string` fonksiyonundan okunur; sondaki `/` kırpılmış, env yoksa `Error` fırlatır. Faz 0 zaten `robots.ts` ve `sitemap.ts` içinde bu fonksiyonu kullanıyor, ikinci bir site-url modülü açılmaz.
  - `src/lib/seo/locale-url.ts`: `export function localePath(locale: AppLocale, pathname: string): string`, `export function localeUrl(locale: AppLocale, pathname: string): string`, `export function buildAlternates(locale: AppLocale, pathname: string, availableLocales?: readonly AppLocale[]): NonNullable<Metadata["alternates"]>`
  - `src/lib/content/project-locales.ts`: `export function localesForProject(slug: string): AppLocale[]`

- [ ] **Step 1: Yerel build ortamı için NEXT_PUBLIC_SITE_URL tanımla**

```bash
grep -q "NEXT_PUBLIC_SITE_URL" .env.example || echo "HATA: Faz 0 .env.example'a bu degiskeni eklememis"
printf 'NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh\n' >> .env.local
git check-ignore .env.local && echo ".env.local git tarafindan yok sayiliyor: OK"
```

Bu adımdan sonra `siteUrl()` build sırasında değer bulacak; değişken tanımsızsa build kasten patlar (denetim bulgusu B6).

- [ ] **Step 2: SEO yardımcıları için başarısız testi yaz**

`tests/seo/locale-url.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("locale url helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh/");
  });

  it("keeps the default locale on the root and prefixes the other one", async () => {
    const { localePath } = await import("@/lib/seo/locale-url");
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("tr", "/")).toBe("/tr");
    expect(localePath("en", "/about")).toBe("/about");
    expect(localePath("tr", "/about")).toBe("/tr/about");
    expect(localePath("tr", "/projects/design-system")).toBe(
      "/tr/projects/design-system"
    );
  });

  it("builds absolute urls and strips a trailing slash from the site url", async () => {
    const { localeUrl } = await import("@/lib/seo/locale-url");
    expect(localeUrl("en", "/")).toBe("https://dogancanyildiz.sh/");
    expect(localeUrl("tr", "/about")).toBe("https://dogancanyildiz.sh/tr/about");
  });

  it("emits a self referencing alternate plus x-default for every locale", async () => {
    const { buildAlternates } = await import("@/lib/seo/locale-url");
    expect(buildAlternates("tr", "/about")).toEqual({
      canonical: "https://dogancanyildiz.sh/tr/about",
      languages: {
        en: "https://dogancanyildiz.sh/about",
        tr: "https://dogancanyildiz.sh/tr/about",
        "x-default": "https://dogancanyildiz.sh/about",
      },
    });
  });

  it("omits locales that have no translated content", async () => {
    const { buildAlternates } = await import("@/lib/seo/locale-url");
    expect(buildAlternates("tr", "/blog/only-turkish", ["tr"])).toEqual({
      canonical: "https://dogancanyildiz.sh/tr/blog/only-turkish",
      languages: {
        tr: "https://dogancanyildiz.sh/tr/blog/only-turkish",
      },
    });
  });

  it("throws when the site url is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { siteUrl } = await import("@/lib/env");
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm run test`
Expected: FAIL, `Failed to resolve import "@/lib/seo/locale-url"`.

- [ ] **Step 4: Faz 0'ın env katmanının site kökünü verdiğini doğrula, yeni modül yazma**

Run:

```bash
cd /Users/dogancanyildiz/Dev/DCYLDZ/portfolio
grep -n "export function siteUrl\|export function resolveSiteUrl" src/lib/env.ts
grep -rn "siteUrl" src/app/robots.ts src/app/sitemap.ts
```

Expected: `src/lib/env.ts` iki fonksiyonu da export ediyor, `robots.ts` ve `sitemap.ts` zaten `import { siteUrl } from "@/lib/env"` kullanıyor.

Faz 0 `src/lib/env.ts` içinde `siteUrl()` fonksiyonunu şu davranışla yazdı ve bu faz onu OLDUĞU GİBİ tüketir, ikinci bir kopya açmaz:

```ts
// src/lib/env.ts, Faz 0 çıktısı, burada yalnızca hatırlatma amacıyla gösteriliyor
export function resolveSiteUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set. Define it as a build time environment variable."
    );
  }
  return trimmed.replace(/\/+$/, "");
}

export function siteUrl(): string {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
```

Bu grep eşleşmiyorsa Faz 0 merge edilmemiştir; faza devam edilmez.

- [ ] **Step 5: locale-url.ts dosyasını yaz**

`src/lib/seo/locale-url.ts`:

```ts
import type { Metadata } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";

/**
 * Locale prefixed pathname. The default locale (en) stays on the root because
 * routing uses localePrefix "as-needed".
 */
export function localePath(locale: AppLocale, pathname: string): string {
  const normalized = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${normalized}` || "/";
}

export function localeUrl(locale: AppLocale, pathname: string): string {
  return `${siteUrl()}${localePath(locale, pathname)}`;
}

/**
 * canonical + hreflang set for one page. Every locale points at itself as well
 * (self referencing tag), otherwise Google discards the whole cluster.
 * Locales without translated content are left out completely.
 */
export function buildAlternates(
  locale: AppLocale,
  pathname: string,
  availableLocales: readonly AppLocale[] = routing.locales
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};

  for (const candidate of routing.locales) {
    if (availableLocales.includes(candidate)) {
      languages[candidate] = localeUrl(candidate, pathname);
    }
  }

  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = localeUrl(routing.defaultLocale, pathname);
  }

  return {
    canonical: localeUrl(locale, pathname),
    languages,
  };
}
```

- [ ] **Step 6: project-locales.ts dosyasını yaz**

`src/lib/content/project-locales.ts`:

```ts
import { routing, type AppLocale } from "@/i18n/routing";
import { projects } from "@/data/projects";

/**
 * Locales a project detail page exists in.
 *
 * Today every project is a single locale independent record in
 * src/data/projects.ts whose title and description are translated in
 * messages/{en,tr}.json, so a known slug exists in both locales. Faz 4 swaps
 * the body of this function for a Velite lookup over
 * content/projects/{en,tr}/<slug>.mdx; sitemap and hreflang callers do not
 * change when that happens.
 */
export function localesForProject(slug: string): AppLocale[] {
  const project = projects.find((item) => item.slug === slug);
  if (!project) return [];
  return [...routing.locales];
}
```

- [ ] **Step 7: Testi tekrar çalıştır**

Run: `npm run test`
Expected: PASS, 5 passed (locale-url) + 2 passed (routing).

- [ ] **Step 8: Kök layout metadata'sını genişlet**

`src/app/[lang]/layout.tsx` içindeki `generateMetadata` fonksiyonunun `return` bloğu şununla değiştirilir; import bloğuna `import { siteUrl } from "@/lib/env";` ve `import { localeUrl } from "@/lib/seo/locale-url";` satırları eklenir:

```tsx
  const ogLocales = { en: "en_US", tr: "tr_TR" } as const;

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("defaultTitle")}`,
    },
    description: t("defaultDescription"),
    openGraph: {
      type: "website",
      siteName: t("defaultTitle"),
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      url: localeUrl(lang, "/"),
      locale: ogLocales[lang],
      alternateLocale: routing.locales
        .filter((candidate) => candidate !== lang)
        .map((candidate) => ogLocales[candidate]),
    },
  };
```

`lang` bu noktada `hasLocale` kontrolünden geçtiği için `AppLocale` olarak daraltılmıştır; `ogLocales[lang]` tip hatası vermez.

**Layout'a `alternates` yazılmaz.** Next.js metadata'yı miras aldırdığı için layout'a konan bir `canonical`, kendi `alternates`'ini tanımlamayan her alt sayfaya sızar ve yanlış canonical üretir. `alternates` yalnızca sayfa dosyalarında tanımlanır.

- [ ] **Step 9: Ana sayfaya metadata ekle**

`src/app/[lang]/page.tsx` dosyasına import'ların altına eklenir:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: { absolute: t("defaultTitle") },
    description: t("defaultDescription"),
    alternates: buildAlternates(lang, "/"),
  };
}
```

Gerekli import satırları:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/seo/locale-url";
```

`title.absolute` kullanılıyor çünkü layout'taki `%s | Alex Chen Portfolio` şablonu ana sayfada başlığı iki kez yazardı.

- [ ] **Step 10: About sayfasına metadata ekle**

`src/app/[lang]/about/page.tsx` dosyasına eklenir (import satırları Step 9'daki listeyle aynı):

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: buildAlternates(lang, "/about"),
  };
}
```

- [ ] **Step 11: Projects sayfasına metadata ekle**

`src/app/[lang]/projects/page.tsx` dosyasına eklenir:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: t("projectsTitle"),
    description: t("projectsDescription"),
    alternates: buildAlternates(lang, "/projects"),
  };
}
```

- [ ] **Step 12: Contact sayfasına metadata ekle**

`src/app/[lang]/contact/page.tsx` dosyasına eklenir:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: buildAlternates(lang, "/contact"),
  };
}
```

- [ ] **Step 13: Proje detay sayfasına metadata ekle**

`src/app/[lang]/projects/[slug]/page.tsx` dosyasına eklenir:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};

  const t = await getTranslations({ locale: lang, namespace: "projects.items" });

  return {
    title: t(`${project.id}.title`),
    description: t(`${project.id}.description`),
    alternates: buildAlternates(
      lang,
      `/projects/${slug}`,
      localesForProject(slug)
    ),
  };
}
```

Ek import satırları:

```tsx
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo/locale-url";
import { localesForProject } from "@/lib/content/project-locales";
```

(`notFound`, `setRequestLocale`, `routing`, `projects` import'ları Task 2 Step 7'den zaten var.)

- [ ] **Step 14: Doğrulama**

```bash
npm run typecheck && npm run lint && npm run test && npm run build
npm run start &
sleep 3
curl -s http://localhost:3000/about | grep -o '<link rel="alternate"[^>]*>'
curl -s http://localhost:3000/tr/about | grep -o '<link rel="canonical"[^>]*>'
kill %1
```

Expected:
```
<link rel="alternate" hrefLang="en" href="https://dogancanyildiz.sh/about"/>
<link rel="alternate" hrefLang="tr" href="https://dogancanyildiz.sh/tr/about"/>
<link rel="alternate" hrefLang="x-default" href="https://dogancanyildiz.sh/about"/>
<link rel="canonical" href="https://dogancanyildiz.sh/tr/about"/>
```

(Öznitelik yazımı Next sürümüne göre `hrefLang` veya `hreflang` olabilir; üç alternate satırının ve doğru canonical'ın bulunması yeterlidir.)

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat(seo): generate canonical and hreflang metadata from the lang route param"
```

---

### Task 5: sitemap.ts ve robots.ts iki locale için

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Test: `tests/seo/sitemap.test.ts`

**Interfaces:**
- Consumes: `routing` (`src/i18n/routing.ts`), `localeUrl` (`src/lib/seo/locale-url.ts`), `siteUrl` (`src/lib/env.ts`, Faz 0), `localesForProject` (`src/lib/content/project-locales.ts`), `projects` (`src/data/projects.ts`).
- Produces: `src/app/sitemap.ts` default export `sitemap(): MetadataRoute.Sitemap` (her girdi `url`, `lastModified`, `changeFrequency`, `priority`, `alternates.languages` taşır), `src/app/robots.ts` default export `robots(): MetadataRoute.Robots`.

- [ ] **Step 1: Başarısız testi yaz**

`tests/seo/sitemap.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh");
});

describe("sitemap", () => {
  it("lists every static page in both locales", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://dogancanyildiz.sh/");
    expect(urls).toContain("https://dogancanyildiz.sh/about");
    expect(urls).toContain("https://dogancanyildiz.sh/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/contact");
    expect(urls).toContain("https://dogancanyildiz.sh/tr");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/about");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/projects");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/contact");
  });

  it("adds one detail entry per project per locale", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const { projects } = await import("@/data/projects");
    const urls = sitemap().map((entry) => entry.url);

    const en = urls.filter((url) => /^https:\/\/dogancanyildiz\.sh\/projects\/[^/]+$/.test(url));
    const tr = urls.filter((url) => /^https:\/\/dogancanyildiz\.sh\/tr\/projects\/[^/]+$/.test(url));

    expect(en).toHaveLength(projects.length);
    expect(tr).toHaveLength(projects.length);
  });

  it("attaches language alternates to every entry", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    for (const entry of sitemap()) {
      expect(entry.alternates?.languages).toBeDefined();
      expect(Object.keys(entry.alternates!.languages!)).toEqual(["en", "tr"]);
    }
  });

  it("produces no duplicate urls", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = sitemap().map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never falls back to a placeholder domain", async () => {
    const sitemap = (await import("@/app/sitemap")).default;

    expect(JSON.stringify(sitemap())).not.toContain("example.com");
  });
});

describe("robots", () => {
  it("points at the real sitemap and blocks the api surface", async () => {
    const robots = (await import("@/app/robots")).default;
    const result = robots();

    expect(result.sitemap).toBe("https://dogancanyildiz.sh/sitemap.xml");
    expect(result.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ]);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm run test`
Expected: FAIL. `sitemap` testleri `expect(urls).toContain("https://dogancanyildiz.sh/tr")` satırında, `robots` testi `result.rules` karşılaştırmasında patlar (mevcut dosyalar tek locale üretiyor ve `rules` bir dizi değil).

- [ ] **Step 3: sitemap.ts dosyasını yaz**

`src/app/sitemap.ts` dosyasının tamamı şununla değiştirilir:

```ts
import type { MetadataRoute } from "next";
import { routing, type AppLocale } from "@/i18n/routing";
import { projects } from "@/data/projects";
import { localeUrl } from "@/lib/seo/locale-url";
import { localesForProject } from "@/lib/content/project-locales";

const STATIC_PAGES = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: "monthly" | "yearly";
}>;

function languagesFor(
  path: string,
  availableLocales: readonly AppLocale[]
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    if (availableLocales.includes(locale)) {
      languages[locale] = localeUrl(locale, path);
    }
  }

  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: localeUrl(locale, page.path),
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: languagesFor(page.path, routing.locales) },
      });
    }

    for (const project of projects) {
      const path = `/projects/${project.slug}`;
      const availableLocales = localesForProject(project.slug);

      // A project that is not translated into this locale gets no entry and no
      // alternate; see docs/04-i18n.md "fallback sayfa yok".
      if (!availableLocales.includes(locale)) continue;

      entries.push({
        url: localeUrl(locale, path),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: languagesFor(path, availableLocales) },
      });
    }
  }

  return entries;
}
```

- [ ] **Step 4: robots.ts dosyasını yaz**

`src/app/robots.ts` dosyasının tamamı şununla değiştirilir:

```ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
```

- [ ] **Step 5: Testi tekrar çalıştır**

Run: `npm run test`
Expected: PASS, toplam 13 test (2 routing + 5 locale-url + 5 sitemap + 1 robots).

- [ ] **Step 6: Üretilen dosyaları gerçek sunucuda doğrula**

```bash
npm run build
npm run start &
sleep 3
curl -s http://localhost:3000/sitemap.xml | grep -o "<url>" | wc -l
curl -s http://localhost:3000/sitemap.xml | grep -o 'hreflang="tr"' | wc -l
curl -s http://localhost:3000/robots.txt
kill %1
```

Expected: `<url>` sayısı `2 * (4 + proje sayısı)` (mevcut 6 proje ile 20), `hreflang="tr"` sayısı da 20 (her girdi kendi alternate kümesini taşıyor) ve robots.txt çıktısı. Sitemap tek satır halinde üretildiği için sayım `grep -o ... | wc -l` ile yapılır, `grep -c` ile değil:

```
User-Agent: *
Allow: /
Disallow: /api/

Host: https://dogancanyildiz.sh
Sitemap: https://dogancanyildiz.sh/sitemap.xml
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(seo): emit sitemap and robots entries for both locales"
```

---

### Task 6: Person JSON-LD

**Files:**
- Create: `src/lib/site-config.ts`
- Create: `src/components/seo/person-jsonld.tsx`
- Modify: `src/app/[lang]/page.tsx`

**Interfaces:**
- Consumes: `AppLocale` (`src/i18n/routing.ts`), `localeUrl` (`src/lib/seo/locale-url.ts`).
- Produces:
  - `src/lib/site-config.ts`: `export const siteConfig` (`{ person: { name: string; jobTitle: Record<AppLocale, string>; location: { city: string; country: string }; sameAs: readonly string[] } }`)
  - `src/components/seo/person-jsonld.tsx`: `export function PersonJsonLd({ locale }: { locale: AppLocale }): JSX.Element`

**İçerik notu:** Bu dosyalardaki veri `.local/content/portfolio-content.md` satır 20, 24, 238-241'den alınmıştır ve gerçektir. Faz 4'te hero/footer/contact metinleri yazılırken aynı `siteConfig` tek kaynak olarak kullanılacak, ikinci bir kopya oluşturulmayacak.

- [ ] **Step 1: site-config.ts dosyasını yaz**

`src/lib/site-config.ts`:

```ts
import type { AppLocale } from "@/i18n/routing";

/**
 * Real identity data, sourced from .local/content/portfolio-content.md.
 * Used by structured data today and by the page copy from Faz 4 on.
 */
export const siteConfig = {
  person: {
    name: "Doğan Can Yıldız",
    jobTitle: {
      en: "Full-Stack Web Developer and DevOps Engineer",
      tr: "Full-Stack Web Geliştirici ve DevOps Mühendisi",
    } satisfies Record<AppLocale, string>,
    location: {
      city: "Konya",
      country: "TR",
    },
    sameAs: [
      "https://github.com/dogancanyildiz",
      "https://www.linkedin.com/in/dogancanyildiz",
    ],
  },
} as const;
```

- [ ] **Step 2: person-jsonld.tsx dosyasını yaz**

`src/components/seo/person-jsonld.tsx`:

```tsx
import type { AppLocale } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo/locale-url";
import { siteConfig } from "@/lib/site-config";

/**
 * Person structured data for the home page.
 * The payload is fully static, but "<" is escaped anyway so the JSON can never
 * terminate the surrounding script tag.
 */
export function PersonJsonLd({ locale }: { locale: AppLocale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.person.name,
    jobTitle: siteConfig.person.jobTitle[locale],
    url: localeUrl(locale, "/"),
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.person.location.city,
      addressCountry: siteConfig.person.location.country,
    },
    sameAs: [...siteConfig.person.sameAs],
  };

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

- [ ] **Step 3: Ana sayfaya JSON-LD'yi bağla**

`src/app/[lang]/page.tsx` içindeki default export'un gövdesi şununla değiştirilir (import bloğuna `import { PersonJsonLd } from "@/components/seo/person-jsonld";` eklenir):

```tsx
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  return (
    <>
      <PersonJsonLd locale={lang} />
      <Hero />
      <FeaturedProjects />
      <SkillsStrip />
    </>
  );
}
```

`hasLocale` kontrolü burada iki iş yapıyor: `lang`'ı `AppLocale`'e daraltıyor (aksi halde `PersonJsonLd` prop tipi tutmaz) ve geçersiz bir segment için 404 döndürüyor.

- [ ] **Step 4: Doğrulama**

```bash
npm run typecheck && npm run lint && npm run build
npm run start &
sleep 3
curl -s http://localhost:3000/ | grep -o 'application/ld+json'
curl -s http://localhost:3000/ | grep -o '"@type":"Person"'
curl -s http://localhost:3000/ | grep -o '"name":"[^"]*"'
curl -s http://localhost:3000/ | grep -o '"url":"[^"]*"'
curl -s http://localhost:3000/tr | grep -o '"jobTitle":"[^"]*"'
kill %1
```

Expected:
```
application/ld+json
"@type":"Person"
"name":"Doğan Can Yıldız"
"url":"https://dogancanyildiz.sh/"
"jobTitle":"Full-Stack Web Geliştirici ve DevOps Mühendisi"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): add Person structured data to the home page"
```

---

### Task 7: Contact Route Handler locale'i request body'sinden alsın

**Files:**
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/components/sections/contact-form.tsx`

**Interfaces:**
- Consumes: `routing` (`src/i18n/routing.ts`), `getTranslations` (next-intl/server), `api` namespace'i (`messages/{en,tr}.json`, Task 1).
- Produces: `POST /api/contact` istek gövdesi artık `{ name, email, subject?, message, website?, locale? }` kabul eder; hata gövdesi `{ error: string }` alanını istekteki dilde döndürür.

**Neden:** `next/root-params` Route Handler'da ve Server Action'da desteklenmiyor (bkz. `docs/04-i18n.md`, "next/root-params Route Handler kısıtı"). `/api/contact` `[lang]` segmentinin dışında olduğu için locale'i istekten açıkça okumak zorunda.

- [ ] **Step 1: Locale çözümleyiciyi ve çevrilmiş hataları route'a ekle**

`src/app/api/contact/route.ts` dosyasının üstüne şu import ve yardımcı eklenir:

```ts
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Route Handlers do not receive the [lang] root param, so the client sends the
 * locale in the request body. Anything unexpected falls back to the default.
 */
function resolveLocale(value: unknown): AppLocale {
  return routing.locales.includes(value as AppLocale)
    ? (value as AppLocale)
    : routing.defaultLocale;
}
```

- [ ] **Step 2: POST gövdesini locale bilir hale getir**

Faz 0'dan gelen `POST` fonksiyonunda gövde bir kez okunup doğrulanıyor. Şu üç değişiklik yapılır, **honeypot, rate limit, uzunluk ve e-posta doğrulaması dahil Faz 0'ın diğer tüm blokları olduğu gibi kalır**:

1. Gövde okunduktan hemen sonra locale çözülür ve çevirmen kurulur:

```ts
  const body = await request.json().catch(() => null);
  const locale = resolveLocale(
    body && typeof body === "object"
      ? (body as Record<string, unknown>).locale
      : undefined
  );
  const t = await getTranslations({ locale, namespace: "api" });
```

2. Her hata yanıtındaki sabit İngilizce metin karşılık gelen çeviri anahtarıyla değiştirilir:

| Durum | Eski (sabit metin) | Yeni |
|---|---|---|
| Doğrulama başarısız, 400 | `"Invalid request. Name, email, and message are required."` | `t("invalidRequest")` |
| Rate limit aşıldı, 429 | Faz 0'ın rate limit mesajı | `t("tooManyRequests")` |
| `resend` yapılandırılmamış, 503 | `"Email is not configured. Please set RESEND_API_KEY."` | `t("emailNotConfigured")` |
| Resend hata döndürdü, 500 | Faz 0'ın jenerik mesajı | `t("sendFailed")` |

Örnek:

```ts
    return NextResponse.json({ error: t("invalidRequest") }, { status: 400 });
```

3. `validateBody` fonksiyonu `locale` alanını görmezden gelir (mevcut haliyle zaten yalnızca `name`, `email`, `subject`, `message` alanlarını okuyor, değişiklik gerekmez).

- [ ] **Step 3: Formun locale'i göndermesini sağla**

`src/components/sections/contact-form.tsx` içinde:

```tsx
// import bloğuna:
import { useLocale, useTranslations } from "next-intl";

// bileşenin ilk satırlarına:
  const t = useTranslations();
  const locale = useLocale();

// fetch gövdesine (subject satırının altına):
          locale,
```

Gövde son hali:

```tsx
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject") || "Portfolio contact",
          message: formData.get("message"),
          locale,
        }),
```

- [ ] **Step 4: İki dilde hata yanıtını doğrula**

```bash
npm run build
npm run start &
sleep 3
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"locale":"tr"}'
echo
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"locale":"en"}'
echo
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"locale":"de"}'
kill %1
```

Expected:
```
{"error":"Geçersiz istek. Ad, e-posta ve mesaj alanları zorunlu."}
{"error":"Invalid request. Name, email, and message are required."}
{"error":"Invalid request. Name, email, and message are required."}
```

Üçüncü istek bilinmeyen bir locale gönderiyor ve varsayılan dile düşmeli.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(contact): localize api error responses using the locale from the request body"
```

---

### Task 8: Statiklik denetimi, uçtan uca doğrulama ve PR

**Files:**
- Create: `scripts/assert-static-routes.mjs`
- Modify: `package.json` (scripts)
- Modify: `README.md`

**Interfaces:**
- Consumes: `npm run build` çıktısı (`.next/prerender-manifest.json`), Task 2-7'nin tüm çıktıları.
- Produces: `npm run verify:routes` komutu (exit 0 = tüm içerik route'ları prerender edilmiş).

- [ ] **Step 1: Statiklik denetim script'ini yaz**

Build tablosunu metin olarak ayrıştırmak kırılgan; script bunun yerine Next'in ürettiği prerender manifest'ini okur. `setRequestLocale` unutulan bir sayfa manifest'te hiç görünmez, bu yüzden eksik route listesi tripwire'ın kendisidir.

`scripts/assert-static-routes.mjs`:

```js
#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const manifestUrl = new URL("../.next/prerender-manifest.json", import.meta.url);

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
} catch {
  console.error("prerender-manifest.json not found. Run `npm run build` first.");
  process.exit(1);
}

const routes = Object.keys(manifest.routes ?? {});

const required = [
  "/en",
  "/tr",
  "/en/about",
  "/tr/about",
  "/en/projects",
  "/tr/projects",
  "/en/contact",
  "/tr/contact",
];

const missing = required.filter((route) => !routes.includes(route));

const detail = (prefix) =>
  routes.filter((route) =>
    new RegExp(`^${prefix}/projects/[^/]+$`).test(route)
  );

const enDetail = detail("/en");
const trDetail = detail("/tr");

const apiRoutes = routes.filter((route) => route.startsWith("/api"));

const problems = [];

if (missing.length > 0) {
  problems.push(`not prerendered: ${missing.join(", ")}`);
}
if (enDetail.length === 0) {
  problems.push("no prerendered project detail page for en");
}
if (enDetail.length !== trDetail.length) {
  problems.push(
    `project detail count differs: en=${enDetail.length} tr=${trDetail.length}`
  );
}
if (apiRoutes.length > 0) {
  problems.push(`api routes must stay dynamic: ${apiRoutes.join(", ")}`);
}

if (problems.length > 0) {
  console.error("Static route check failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const contentRoutes = required.length + enDetail.length + trDetail.length;

console.log(
  `Static route check passed: ${contentRoutes} content routes prerendered ` +
    `(${enDetail.length} project pages per locale).`
);
```

- [ ] **Step 2: package.json'a script ekle**

`scripts` bloğuna eklenir:

```json
    "verify:routes": "node scripts/assert-static-routes.mjs",
```

- [ ] **Step 3: Script'i çalıştır**

```bash
npm run build && npm run verify:routes
```

Expected:
```
Static route check passed: 20 content routes prerendered (6 project pages per locale).
```

Hata verirse: eksik listelenen sayfada `setRequestLocale(lang)` veya `generateStaticParams` çağrısı yoktur.

- [ ] **Step 4: Build tablosunda dynamic route kalmadığını doğrula**

```bash
npm run build 2>&1 | tee /tmp/faz2-build.log | grep -E "^[[:space:]]*ƒ" || echo "dynamic isaretli route yok"
grep -E "^[[:space:]]*ƒ" /tmp/faz2-build.log | grep -v "/api/"
```

Expected: ilk komut yalnızca `/api/contact` satırını basar; ikinci komut hiçbir satır basmaz (exit 1, çıktı boş). `/api/` dışında `ƒ` işaretli bir satır çıkarsa faz bitmemiştir.

- [ ] **Step 5: Kalıntı taraması**

```bash
grep -rn "cookies()" src/ || echo "cookies yok: OK"
grep -rn "example.com" src/ || echo "src icinde example.com yok: OK"
ls src/middleware.ts middleware.ts 2>/dev/null || echo "middleware.ts yok: OK"
test -f src/proxy.ts && echo "src/proxy.ts var: OK"
grep -rn "hreflang\|alternate" src/lib/seo/locale-url.ts >/dev/null && echo "hreflang uretimi yerinde: OK"
```

Expected: beş satırın hepsi `OK` ile biter.

- [ ] **Step 6: Uçtan uca dil ve SEO doğrulaması**

```bash
npm run start &
sleep 3
for path in / /tr /about /tr/about /projects /tr/projects /contact /tr/contact /projects/design-system /tr/projects/design-system; do
  printf "%-32s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$path)"
done
curl -s -o /dev/null -w "/en -> %{http_code} %{redirect_url}\n" http://localhost:3000/en
curl -s -o /dev/null -w "/fr -> %{http_code}\n" http://localhost:3000/fr
kill %1
```

Expected: on yolun tamamı `200`; `/en -> 307 http://localhost:3000/`; `/fr -> 404`.

- [ ] **Step 7: hreflang karşılıklılığını doğrula**

```bash
npm run start &
sleep 3
for path in / /tr /about /tr/about; do
  echo "--- $path"
  curl -s http://localhost:3000$path | grep -o 'hrefLang="[a-z-]*" href="[^"]*"'
done
kill %1
```

Expected: dört sayfanın her birinde üç satır (`en`, `tr`, `x-default`); `/about` ile `/tr/about` **aynı üç URL'i** listelemeli (karşılıklı ve self-referencing). Farklıysa hreflang cluster'ı geçersizdir.

- [ ] **Step 8: README'de i18n bölümünü güncelle**

`README.md` içine "Internationalization" başlığı altında eklenir:

```markdown
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
```

- [ ] **Step 9: Son doğrulama ve commit**

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run verify:routes
git add -A
git commit -m "chore(i18n): add static route verification script and document the locale setup"
```

- [ ] **Step 10: PR aç**

```bash
git push -u origin feature/faz-2-i18n-app-lang
gh pr create \
  --title "Faz 2: i18n yeniden mimarisi (app/[lang] + next-intl)" \
  --body "$(cat <<'BODY'
Implements docs/plans/2026-08-27-faz-2-i18n-app-lang.md (Faz 2 of docs/10-yol-haritasi.md).

## What changed
- Routes moved under `app/[lang]`; English stays on the root, Turkish lives under `/tr`.
- next-intl 4.13.7 wired up: `src/i18n/routing.ts`, `src/i18n/request.ts`,
  `src/i18n/navigation.ts`, `src/proxy.ts` with locale detection and locale cookie off.
- The cookie based dictionary (`src/lib/i18n/translations.ts`, `locale-provider.tsx`,
  `use-translation.ts`) is gone; messages now live in `messages/{en,tr}.json`.
- Every `cookies()` call is removed, so all content routes are prerendered again.
- `generateMetadata` derives title, description, canonical, hreflang and x-default from the
  `lang` route param; `sitemap.ts` and `robots.ts` cover both locales.
- Person structured data on the home page uses the real identity data.
- `/api/contact` reads the locale from the request body and answers in that language.

## Verification
- `npm run typecheck && npm run lint && npm run test && npm run build && npm run verify:routes`
- Only the `/api/*` route handlers (`/api/contact`, `/api/health`) are marked dynamic in the build output.
- `/` and `/tr` return 200 with different `<html lang>`; `/en` redirects to `/` with 307.
- hreflang tags are mutual and self referencing on `/`, `/tr`, `/about`, `/tr/about`.

## Follow-ups (out of scope here)
- Copy still shows the template persona; Faz 4 replaces it from `.local/content/portfolio-content.md`.
- `opengraph-image` and `icon` keep their current visuals; Faz 3 rewrites them.
BODY
)"
```

---

## Bitti sayılma kriteri

Aşağıdaki komutların tamamı temiz bir çalışma ağacında sırayla çalıştırılır ve beklenen çıktıyı verir.

**1. Kalite kapısı**

```bash
npm run typecheck && npm run lint && npm run test && npm run build && npm run verify:routes
```

Beklenen: hepsi exit 0; `verify:routes` çıktısı `Static route check passed: 20 content routes prerendered (6 project pages per locale).`

**2. Build çıktısında dynamic route yalnızca /api**

```bash
npm run build 2>&1 | grep -E "ƒ /" | grep -v "/api/"
```

Beklenen: hiçbir satır yok (exit 1, boş çıktı). Route satırları `├ ƒ /api/contact` biçiminde, satır başında ağaç karakteri var; `^[[:space:]]*ƒ` deseni yalnızca `ƒ Proxy (Middleware)` ve lejant satırını yakalar, route satırlarını yakalamaz. `grep -E "ƒ /"` tek başına yalnızca `/api/contact` ve `/api/health` satırlarını basar; `/api/health` Faz 0'dan beri bilerek dinamiktir (`no-store`, `uptime`).

Not: Faz 5, ana sayfaya `export const revalidate = 60` ekleyerek `/` ve `/tr` route'larını ISR (◐ veya ● + revalidate) yapacak; o fazdan sonra bu kriter "yalnızca /api/* ƒ, ana sayfa ISR" olarak okunur. Faz 2 için kriter aynen geçerli.

**3. İki dil ayrı URL'de ve doğru `<html lang>`**

```bash
npm run start &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/         # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr       # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/en   # 307 http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/fr       # 404
curl -s http://localhost:3000/ | grep -o '<html lang="en"'              # <html lang="en"
curl -s http://localhost:3000/tr | grep -o '<html lang="tr"'            # <html lang="tr"
kill %1
```

**4. hreflang ve canonical**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000/about    | grep -o 'hrefLang="[a-z-]*"' | sort   # en, tr, x-default
curl -s http://localhost:3000/tr/about | grep -o 'hrefLang="[a-z-]*"' | sort   # en, tr, x-default
curl -s http://localhost:3000/tr/about | grep -o '<link rel="canonical"[^>]*>' # .../tr/about
kill %1
```

Beklenen: iki sayfa da aynı üç hreflang değerini listeler, canonical her sayfada kendi URL'ini gösterir.

**5. sitemap ve robots**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000/sitemap.xml | grep -o "<url>" | wc -l     # 20
curl -s http://localhost:3000/sitemap.xml | grep -o "/tr/" | wc -l     # >= 18
curl -s http://localhost:3000/robots.txt | grep "Disallow: /api/"      # eslesir
curl -s http://localhost:3000/sitemap.xml | grep -o "example.com" | wc -l  # 0
kill %1
```

**6. Person JSON-LD**

```bash
npm run start &
sleep 3
curl -s http://localhost:3000/ | grep -o '"@type":"Person"' | wc -l           # 1
curl -s http://localhost:3000/ | grep -o '"name":"Doğan Can Yıldız"' | wc -l   # 1
kill %1
```

**7. Contact route locale'i body'den alıyor**

```bash
npm run start &
sleep 3
curl -s -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d '{"locale":"tr"}'
kill %1
```

Beklenen: TR hata metni (`{"error":"Geçersiz istek. Ad, e-posta ve mesaj alanları zorunlu."}`).

**8. Eski i18n katmanından kalıntı yok**

```bash
grep -rn "cookies()" src/ ; grep -rn "locale-provider\|lib/i18n/translations\|use-translation" src/ ; ls src/middleware.ts 2>/dev/null
```

Beklenen: üç komut da boş çıktı verir.

**9. Deploy doğrulaması (Faz 1 hattı üzerinden)**

- PR açıldığında Coolify preview URL üretir; preview'da `/` ve `/tr` farklı dilde açılır.
- GitHub Actions kapısı (lint + typecheck + build) yeşil.
- Preview URL'de `curl -I` ile `/en` -> `/` yönlendirmesi doğrulanır.

**10. Elle yapılacak tek kontrol**

Preview URL üzerinden bir hreflang test aracıyla (ör. technicalseo.com hreflang tester) `/` ve `/tr` taranır; self-referencing ve karşılıklı etiket hatası çıkmaz. Not: bu araç yalnızca herkese açık bir URL ile çalışır, bu yüzden preview deploy'u beklenir. Search Console doğrulaması Faz 4 launch kapısına aittir, bu fazın kriteri değildir.

---

## Devir notu şablonu

Faz 2 PR'ı merge edildikten sonra bir sonraki faz ajanına aşağıdaki blok doldurulmuş halde aktarılır.

```markdown
## Faz 2 devir notu

### Yapıldı
- next-intl 4.13.7 kuruldu (exact pin). Yapılandırma: src/i18n/routing.ts, src/i18n/request.ts,
  src/i18n/navigation.ts, src/proxy.ts.
- Route ağacı src/app/[lang]/ altına taşındı; kök layout artık src/app/[lang]/layout.tsx.
  src/app/api/, src/app/robots.ts, src/app/sitemap.ts, src/app/icon.tsx, src/app/favicon.ico
  [lang] dışında kaldı.
- Mesajlar messages/en.json ve messages/tr.json'a taşındı (<anahtar sayısı> anahtar, iki dilde aynı).
- src/lib/i18n/translations.ts, src/lib/i18n/use-translation.ts, src/components/locale-provider.tsx
  silindi; repo'da cookies() çağrısı kalmadı.
- generateMetadata locale param'ından üretiliyor; canonical + hreflang + x-default + metadataBase var.
- sitemap.ts ve robots.ts iki locale üretiyor; Person JSON-LD ana sayfada.
- /api/contact locale'i request body'sinden okuyor.

### Doğrulandı
- npm run typecheck / lint / test / build / verify:routes: hepsi yeşil (tarih: <tarih>).
- Build çıktısında ƒ işaretli route'lar yalnızca /api/contact ve /api/health.
- / ve /tr 200 ve farklı <html lang>; /en 307 ile /'a; /fr 404.
- sitemap.xml <url> sayısı: <sayı>; robots.txt Disallow: /api/ içeriyor.
- hreflang test aracı sonucu: <sonuç / preview URL>.

### Açık kaldı
- Site metinleri hâlâ şablon persona ("Alex Chen", alex@example.com, TechCorp/StartupXYZ,
  placeholder sosyal linkler). Faz 4'te messages/{en,tr}.json içindeki değerler
  .local/content/portfolio-content.md'den yeniden yazılacak; anahtar yapısı değişmeyecek.
- opengraph-image ve icon route'ları eski görsel içeriğini koruyor, Faz 3 yeniden yazacak.
- next-intl TypeScript augmentation (declare module "next-intl", AppConfig.Messages) eklenmedi;
  hesaplanmış anahtar kullanımı (projects.items.<id>.title) buna bağlı. İçerik Velite'a taşınınca
  yeniden değerlendirilecek.
- Blog route'ları (/blog, /blog/[slug]) henüz yok; Faz 4'te [lang] altına eklenecek ve
  localesForProject ile aynı desende bir localesForPost yardımcısı gerekecek.

### Üretilen arayüzler (sonraki fazlar bunları kullanır)
- `src/i18n/routing.ts`: `routing`, `type AppLocale = "en" | "tr"`
- `src/i18n/navigation.ts`: `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`
- `src/lib/seo/locale-url.ts`: `localePath(locale, pathname)`, `localeUrl(locale, pathname)`,
  `buildAlternates(locale, pathname, availableLocales?)`
- `src/lib/content/project-locales.ts`: `localesForProject(slug): AppLocale[]` (Faz 4'te Velite'a bağlanacak seam)
- `src/lib/site-config.ts`: `siteConfig.person` (gerçek isim, unvan, konum, sameAs)
- `src/components/seo/person-jsonld.tsx`: `PersonJsonLd({ locale })`
- `messages/{en,tr}.json` namespace'leri: nav, brand, hero, home, footer, about, projects, contact,
  form, metadata, api
- `npm run verify:routes` (scripts/assert-static-routes.mjs)
```

---

## Self-Review

**1. Spec kapsamı**

| Spec maddesi | Kaynak | Karşılayan task |
|---|---|---|
| app/[lang] yapısına taşıma, generateStaticParams ile iki locale prerender | 10-yol-haritasi.md Faz 2 | Task 2 (Step 2-9) |
| next-intl 4.13.7: routing.ts, request.ts, proxy.ts, setRequestLocale | 04-i18n.md Kararlar 2-4 | Task 1, Task 2 |
| localePrefix as-needed, localeDetection kapalı | 04-i18n.md Karar 1 ve 3 | Task 1 Step 5, Task 2 Step 1 |
| translations.ts / locale-provider.tsx / use-translation.ts silinir, messages/*.json gelir | 04-i18n.md Karar 5 | Task 1 Step 10-11, Task 3 Step 11 |
| Dört layout'taki cookies() kaldırılır | 01-mevcut-durum-denetimi.md F2, F7 | Task 2 Step 14-15 |
| generateMetadata locale param'ından | 07-seo-ve-metadata.md Karar 1 | Task 4 Step 8-13 |
| alternates.canonical + languages + x-default, metadataBase | 07-seo-ve-metadata.md Karar 1-2 | Task 4 Step 5, 8-13 |
| sitemap.ts ve robots.ts iki locale, /api disallow | 07-seo-ve-metadata.md Karar 3-4 | Task 5 |
| Çevirisi olmayan içerik sitemap ve alternates'e girmez | 04-i18n.md Karar 6 | Task 4 Step 6 (`localesForProject`), Task 5 Step 3 |
| Person JSON-LD | 07-seo-ve-metadata.md Karar 5 | Task 6 |
| language-switcher URL tabanlı | 04-i18n.md Uygulama notları | Task 2 Step 13 |
| html lang route param'ından | 04-i18n.md Türkçe notları | Task 2 Step 2 |
| Contact route locale'i elle alır (root-params kısıtı) | 04-i18n.md, 07-seo-ve-metadata.md risk tablosu | Task 7 |
| openGraph.images her sayfada | 07-seo-ve-metadata.md Gerekçe | Task 2 Step 10 (opengraph-image [lang] segmentine taşındı, tüm alt sayfalara miras kalıyor) |
| Build çıktısı statiklik denetimi (tripwire) | 04-i18n.md TRIPWIRE, 10-yol-haritasi.md | Task 8 Step 1-4 |
| Vitest ile routing ve sitemap birim testleri | Global Constraints | Task 1 Step 2, Task 4 Step 2, Task 5 Step 1 |

Kapsam dışı bırakılanlar ve gerekçeleri: gerçek içerik metinleri (Faz 4), opengraph-image/icon görsel içeriği (Faz 3), BlogPosting ve CreativeWork JSON-LD (blog ve Velite Faz 4'te geliyor), Search Console doğrulaması (Faz 4 launch kapısı), next-intl TypeScript augmentation (içerik sabitlendikten sonra).

**2. Yer tutucu taraması**

"TBD", "uygun şekilde", "benzer şekilde", "gerekli düzenlemeleri yap" ifadeleri planda geçmiyor; her kod adımı tam dosya içeriği veya tam satır aralığı değişimi veriyor. Tek yerde referans var: Task 7 Step 2, Faz 0'ın yazdığı rate limit ve doğrulama bloklarına dokunmadığını söylüyor ve değişecek satırları bir tabloyla tek tek listeliyor; bu bir yer tutucu değil, dokunulmayacak kodun sınırının tanımı.

**3. Tip tutarlılığı**

- `AppLocale` tek yerde tanımlı (`src/i18n/routing.ts`) ve `locale-url.ts`, `project-locales.ts`, `site-config.ts`, `person-jsonld.tsx`, `route.ts` tarafından aynı isimle import ediliyor.
- `buildAlternates(locale, pathname, availableLocales?)` imzası Task 4 Step 5'te tanımlanıp Step 9-13'te aynı sırayla çağrılıyor; üçüncü argüman yalnızca proje detayında (`localesForProject(slug)`) veriliyor.
- `localesForProject(slug: string): AppLocale[]` Task 4 Step 6'da tanımlanıyor, Task 5 Step 3'te aynı imzayla kullanılıyor.
- Sayfa props tipi her dosyada `{ params: Promise<{ lang: string }> }` (detay sayfasında `{ lang: string; slug: string }`); `lang` daraltması her yerde `hasLocale(routing.locales, lang)` ile yapılıyor.
- Faz 0'ın `siteUrl()` fonksiyonu sondaki `/` kırpıyor, `localePath` kök için `/` döndürüyor, bu yüzden `localeUrl("en", "/")` tam olarak `https://dogancanyildiz.sh/` üretiyor; Task 4 Step 2'deki test bu değeri doğruluyor.
- `siteConfig.person.jobTitle` `Record<AppLocale, string>` olarak `satisfies` ile kısıtlanıyor, `PersonJsonLd` `jobTitle[locale]` erişiminde tip hatası vermiyor.
