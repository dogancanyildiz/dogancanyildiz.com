# Denetim kapanışı devir notu (28 Ağustos 2026)

Durum: Kod tarafı tamamlandı, dal `feature/audit-closure`, dev'e PR ile girer · Tarih: 2026-08-28 · Kaynak: 28 Ağustos denetim raporu (sahibinin Claude artifact'ı "dogancanyildiz.com denetimi": 16 boyut, 162 bulgu, adversarial doğrulama) · Kapsam: raporun kod tarafında kapatılabilen bütün açık ve kısmi bulguları; panel/DNS adımları ve sahibinin kararları bu notun "Sahibine kalanlar" bölümünde.

Bu not bir faz devir notu değil; fazlar arası çapraz kesen bir kapanış turunun kaydıdır. Faz notlarıyla aynı biçimde okunur: neler yapıldı, kararlar ve sapmalar, kapılar, sahibine kalanlar.

## Yürütme modeli

- Taban: `dev` 5677397 (v0.3.1 sync). Sekiz dosya-ayrık küme, her biri kendi git worktree'sinde kendi dalında (`audit/<küme>`) çalıştı; küme başına bir uygulayıcı (opus veya sonnet), salt okunur bir opus inceleyici (kapıları kendisi koştu, çürütmeye çalıştı) ve gerekirse aynı worktree'de bir düzeltme turu. 24 ajan, 1.914 araç çağrısı, 58 dakika.
- Kontrol oturumu dalları sırayla birleştirdi (3 çakışma elle çözüldü: `app-shell.test.ts` proxy matcher testi, `design-tokens.test.ts` ölü token testi, `about/page.tsx` scroll-mt ve `content-schema.test.ts` fixture testleri), üç entegrasyon kırığını kapattı (`errorPage` client namespace'i, `.section-label`/`.display-hero`/`.list-row` ölü CSS, `.table-wrap` allowlist), repo geneli `format:write`, ESLint ve tsc `.claude/` dışlaması.
- 2. tur ana ağaçta sıralı, tek yazar: tsconfig strict bayrakları, ESLint tipli kurallar + `--max-warnings=0`, jsdom + Testing Library render testleri; her görev opus inceleme + düzeltme.
- Doğrulama: iki bağımsız opus doğrulayıcı (kapsam: her bulgu kimliği done/skipped/owner; adversarial: regresyon, a11y, i18n eşitliği, güvenlik, Next 16 doğruluğu, canlı uygulama üzerinde curl) ve tek düzeltme turu.
- Kurallar (hafıza notlarından): aynı ağaçta tek yazar, `git add -A` yasak, fork ve inceleme skill'leri ajanlarda yasak, boş port (3131+), uzun çizgi yok, AI imzası yok.

## Küme sonuçları

| Küme | Model | Kapanan | Öne çıkan kararlar |
|---|---|---|---|
| contact | opus | F-017, F-023, F-041, F-042, F-043, F-044, F-058, F-059, F-060, F-066, F-083, F-107, F-108, F-120, F-122, F-123, F-131, F-147, F-148, F-153, E-03, N-06, N-10 | API sözleşmesi: yalnızca `name`, `email`, `message`, `extra_field`; `subject` yok; locale `X-Locale` başlığında; `Content-Type` 415, `Origin` 403, Resend 10 sn 504; `Reply-To`, idempotency anahtarı; `unknown` için ayrı 30/10 dk kova; JSON log + `X-Request-Id`; üçüncü taraf hata takibi yok (karar); health `{ status, checks, timestamp }`; `instrumentation.ts`. İmzalı render damgası yapılmadı (contact sayfası statik). 37 route testi. |
| layout-a11y | sonnet | F-039 (kısmen), F-051, F-052, F-053, F-054, F-056, F-057, F-061, F-100, F-101, F-113, F-114, F-115, F-116, F-117, F-119, F-126, F-128, F-150, E-07 | Footer server component, `/api/health` linki kaldırıldı; `about-subnav-list.tsx` (IntersectionObserver); `CLIENT_MESSAGE_NAMESPACES` listesi; tema düğmesi mevcut temanın ikonu + `aria-pressed`; `viewport.themeColor` (elle çevrilmiş hex, token değişirse güncellenmeli); DisplayHeading/SectionLabel/ölü export'lar silindi. |
| perf-motion | opus | F-019, F-020, F-032, F-055 (yarısı), F-062, F-064, F-065, F-124, F-125, F-129, N-23 | Hero, yetkinlik şeridi, proje ve yazı listeleri sunucu bileşeni, giriş animasyonu yok (görsel karar sahibinde); simple-icons istemciden çıktı; LazyMotion dinamik import; Instrument Serif preload kapalı; latin-ext preload; `adjustFontFallback` yalnızca son web yüzünde (mono `false`, Next Arial/Times dışını kabul etmiyor); `prefetch={false}`. F-063 (`<symbol>`) yapılmadı. |
| css-tokens | opus | F-018, F-021, F-045, F-046, F-047, F-109, F-110, F-149, F-151 | `--border-strong` / `--input-border` sözleşmesi, 3:1 kontrast testi; katman düzeni düzeltildi (`.tag-pill` override'ları artık çalışıyor, pill'ler normal yazım); ölü sınıf/token testi; prose blockquote/table/hr/h4/kbd; forced-colors; `tw-animate-css` ve `shadcn/tailwind.css` import'ları kaldırıldı. |
| security-config | opus | F-011, F-030, F-031, F-084, F-085, F-086, F-087, F-088 (yarısı), F-090, F-033, F-139 (profile), E-10, N-11, N-14, N-25 | HSTS geçici olarak uygulamada (`preload` yok); CSP `unsafe-inline` kalır, `report-uri /api/csp-report` + `Reporting-Endpoints`, `CSP_REPORT_ONLY=1` ölçüm penceresi; XFO/COOP/CORP, geniş Permissions-Policy; `/cv` noindex + 1 gün cache, `/fonts` 1 gün (immutable yok); velite devDependencies, shiki kaldırıldı, `predev`; `npm audit --omit=dev` 0; Umami origin tek sabit (`src/lib/analytics.ts`), `data-domains`; proxy `/:path*`. |
| pages-seo | opus | F-004, F-036, F-037, F-038, F-040, F-050, F-067, F-069, F-072, F-080, F-082, F-094, F-095, F-096, F-097, F-098, F-099, F-103, F-104, F-105, F-112, F-127, F-132, F-136, F-139 (velite), F-152, F-157; F-154, F-155 kabul | OG 500 kapandı (fontTools ile Geist 400/600 statik TTF, PNG imza testi); `defaultTitle` + `siteName`; `#person`/`#website` kimlikleri, WebSite ve BreadcrumbList, BlogPosting image/publisher/dateModified; sitemap statik sayfalarda lastmod yok; `updated`/`coverAlt`/projects `draft`/`https://` şema alanları; `error.tsx` (Next 16.3 `retry`) ve `global-error.tsx`; `getHomeProjects` (featured, yoksa ilk 3), boş durumlar; `resolveLocale`; ProjectMeta/Screenshot kaldırıldı; RSS/sitemap/draft/tek dilli fixture testleri. |
| tests-ci | sonnet | F-005, F-016, F-024, F-025, F-027, F-035, F-070, F-073, F-074, F-075, F-076, F-077, F-092, F-093, F-133, F-135, F-137, F-140, F-142, N-03, N-07; F-012/F-026 | Action'lar SHA pinli, dependency review, prod audit adımı (`continue-on-error`, prod 0 olduğu için kaldırılabilir), format ve `verify:docs` adımları, coverage eşikleri, docker smoke (imaj çalıştırılıp health dışarıdan curl), Buildx gha cache, digest pinli base, npm cache mount, `timeout-minutes`, `links.yml` haftalık, `release.yml` `workflow_run`, `release:check` semver max tag, Dependabot `infra/`. `npm ci --ignore-scripts` denendi, esbuild/sharp yüzünden vazgeçildi. |
| status-infra | sonnet | N-01, N-02, N-05, N-08, N-09, N-12, N-13, N-15, N-16, N-17, N-21, N-22, N-24 | Gatus fetch 3 sn timeout + `allSettled` + JSON uyarı + timestamp doğrulama; Systems tek PageSection, kontrast testi (oklch hesabı), `timeZoneName: "short"`; `buildInfo.year` yalnızca `NEXT_PUBLIC_BUILD_DATE`'ten (istemci `new Date()` fallback'i hidrasyon uyuşmazlığı üretiyordu, kaldırıldı; footer tarih yoksa yıl basmaz); Gatus alerting bloğu (`GATUS_ALERT_WEBHOOK_URL`), Umami ve Postgres imaj pinleri, `infra/README.md`. |
| 2. tur | opus, sonnet | F-013, F-068, F-134, F-138, N-20 | Bkz. "2. tur" bölümü. |
| kontrol oturumu | fable | F-006, F-034, F-078, F-091, F-146, F-156, F-015, E-04, E-12, N-04, N-18, N-19, E-09 | Doküman güncellemeleri (bu not, docs/00-12 durum bölümleri, README, deploy checklist'leri, runbook), `.gitignore` temizliği ve `.claude/` orkestrasyon dosyalarının takipten çıkarılması (yedek `.local/claude-backup/`), entegrasyon. |

## 2. tur (çapraz kesen, ana ağaçta sıralı)

| Görev | Model | Sonuç |
|---|---|---|
| strict-ts (F-138) | opus | `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch` açık, target ES2022. 75 hata (hepsi indeks erişimi) 20 dosyada kaynakta kapatıldı, hiç `!` yok; tek belgelenmiş fallback `rate-limit.ts` `stamps[0] ?? now`. Next build tsconfig'i yeniden yazmadı. 6 commit. |
| eslint-typed (F-013) | opus | `lint: eslint --max-warnings=0`; `parserOptions.projectService` ile tipli lint; `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-unnecessary-type-assertion`, `react/jsx-no-target-blank` error; jsx-a11y kuralları error. Gerçek bir hata yakalandı: contact formunun submit promise'i React'e verilen event handler'da gözlemlenmiyordu, düzeltildi. Lint ~9 sn. 3 commit. |
| render-tests (F-068, F-017 istemci, N-20, F-134) | sonnet | jsdom + Testing Library + jest-dom + user-event; `*.test.tsx` dosya başı `// @vitest-environment jsdom` (Vitest 4'te `environmentMatchGlobs` yok); `tests/helpers/render.tsx` (`renderWithIntl`), next-intl navigation ve next-themes mock kalıpları. Render testleri: contact form (alan bazlı hata, odak, honeypot POST, 429 geri sayımı, zaman aşımı, kalıcı aria-live, readOnly kilidi), mobil menü, tema düğmesi, dil değiştirici, about alt-nav (IntersectionObserver), Systems paneli, Umami script, brand icon/skill tag, error boundary. Tamamen kapsanan kaynak-metin assertion'ları kaldırıldı; `client-ip` testleri birleşti, `motion.test.ts` alias'a geçti. 5 commit. |

Sonuç: 66 test dosyası / 922 test (taban 39 dosya / 552 test), coverage eşikleri `vitest.config.mts`'te (satır 76). Üç incelemenin tamamı "pass" (yalnızca minor bulgular: bir tema düğmesi assertion'ı ve README satırı, kontrol oturumu kapattı).

## Kapılar (birleşik ağaç, son commit)

<!-- GATES -->

## Doğrulama

<!-- VERIFY -->

## Plandan sapmalar ve bilinçli kabuller

- **Giriş animasyonları kaldırıldı** (F-019): tasarım kararının 5. maddesi "minimum hareket" diyordu; ana sayfadaki dört bölümde artık hiç yok. Geri getirmek CSS ile mümkün, sahibinin kararı.
- **HSTS uygulamada** (F-011): karar "yalnızca Traefik" idi; Traefik kurulmadığı için geçici olarak `next.config.ts`. Traefik middleware'i gelince kaldırılır.
- **CSP nonce'a geçilmedi** (F-030): statik rotalar korunur; ölçüm penceresi ve raporlama eklendi.
- **Üçüncü taraf hata takibi yok** (E-03): Coolify log + Gatus.
- **İmzalı render damgası yok** (F-148): contact sayfası statik render edildiği için render anı damgası build anına eşitlenir; honeypot + rate limit ile kabul.
- **`cacheComponents` açılmadı** (F-032): rendering modelini değiştirir; liste linklerinde `prefetch={false}` tercih edildi.
- **`<symbol>`/`<use>` sprite yok** (F-063): ikon verisi zaten yalnızca sunucuda, düşük etki.
- **Instrument Serif kalıyor** (F-064): preload kapalı, prose blockquote'ta render oluyor.
- **`immutable` cache yok** (F-086): `/cv` ve `/fonts` dosya adları hash'li değil; `max-age=86400`.
- **CV indekslenmez** (E-10): `X-Robots-Tag: noindex, nofollow`.
- **`.pull-quote` allowlist'te**: sınıfın tüketicisi yok; blockquote display fontunu doğrudan alıyor.
- **Umami `data-domains`** (N-14): tracker yalnızca `dogancanyildiz.com`'da çalışır; preview/dev veri yazmaz.
- **`GATUS_URL` boşken uyarı yok** (N-09): yerel ve preview yapılandırması sayılır.
- **npm audit dev 2 high** (F-015): velite -> sharp <0.35.0, yalnızca build zamanı; `--force` velite'ı kırıyor; velite güncellenince kapanır.
- **F-154 / F-155**: kök URL eğik çizgi farkı ve `/en/*` 307 kabul edildi.
- **Tarihsel plan dosyaları düzeltilmedi** (E-04, T-3, T-32): Faz 5 planı `.sh` hostname'leriyle duruyor, başına düzeltme notu kondu; `plans/README.md` ek notu.

## Sahibine kalanlar

Tam liste yerel `audit/acik-kalanlar.md` defterinde (P-, O-, M- maddeleri). Öncelik sırasıyla:

1. **Canlı siteyi ayağa kaldır** (F-002/F-003, kritik): her HTTPS yolu Cloudflare 526; origin'de Traefik router yüklü değil. Coolify'da uygulama ve Custom Labels, sunucuda `docker inspect` + coolify-proxy logları; kalıcı çözüm Cloudflare Origin CA.
2. **Coolify env'leri doğrula:** `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL` (eksikse health `degraded`, Gatus alarm verir), `NEXT_PUBLIC_BUILD_SHA/DATE` (`SOURCE_COMMIT`), Faz 5 değişkenleri.
3. **Cloudflare:** Always Use HTTPS, Minimum TLS 1.2, CAA, managed robots.txt kapalı, Cache Rule, rate limiting, Bot Fight Mode (`docs/deploy/cloudflare-kurulum.md`).
4. **Traefik / origin:** trustedIPs, HSTS middleware (sonra uygulamadaki satır kaldırılır), `DOCKER-USER` origin kilidi; ardından `TRUST_CF_CONNECTING_IP=true`.
5. **Resend:** domain doğrulama kayıtları, mevcut DMARC'ı düzenle (yeni kayıt ekleme), kademeli `p=quarantine` -> `p=reject`.
6. **Gatus ve Umami:** Coolify kaynakları, `GATUS_ALERT_WEBHOOK_URL`, Umami parolası domain bağlanmadan önce; harici ikinci prob.
7. **`.sh` alan adı kararı:** kaydet veya kapsam dışı ilan et.
8. **GitHub:** `main` için `enforce_admins`; merge edilmiş `release/sync-v0.3.0` ve `feature/public-repo-security` uzak dallarını sil; preview wildcard DNS kararı.
9. **Görsel onaylar:** giriş animasyonlarının yokluğu, tema düğmesi ikon anlamı, pill'lerin normal yazımı, footer/CTA başlık ölçeği; tarayıcı turu (Faz 3 listesi + bu kapanış).
10. **Canlı doğrulamalar (site açılınca):** Lighthouse (CLS/LCP dahil), hreflang aracı, Search Console, Rich Results, OG önizleme, contact formu gerçek gönderim (Origin kırpılmıyor), `CSP_REPORT_ONLY=1` ölçüm penceresi, Resend idempotency penceresi.
11. **İçerik teslimatları:** kapaklar (`cover` + `coverAlt`), sertifika `verifyUrl`, Konuşmalar, profil fotoğrafı, metin ve CV onayı, Wikonya adı, ticket repo linki.

## Kalan teknik borç (küçük, sıralı PR'lara uygun)

- Contact sayfasında `m.*` elemanlarının `opacity:0` prerender'ı; `MotionProvider`'ın contact sınırına indirilmesi; `staggerContainer`/`staggerItem` ölü export'ları.
- `localePath` önek koruması; `assert-static-routes.mjs` locale listesi `routing.ts`'ten türetilmiyor; `readingTime` yuvarlaması iki yerde; `untranslated` dizisi her sayfanın payload'ında.
- `contact` namespace'i her sayfanın client kataloğunda (rota bazlı provider gerekir).
- `next dev` çökünce yetim `velite --watch`.
- `--status-down` token'ı tüketicisiz (Systems `bg-status-down`'a geçerse kullanılır).
- typescript 7 ve eslint 10 majorları (`eslint-config-next` desteği bekleniyor).
- Preview deployment'lar için ayrı `NEXT_PUBLIC_SITE_URL` (`docs/deploy/coolify-kurulum.md`'ye yazıldı, Coolify'da uygulanmalı).

## Öğrenilenler (orkestrasyon)

- Dosya-ayrık kümeler + worktree izolasyonu bu boyutta işe yaradı: 8 paralel uygulayıcı, yalnızca 3 küçük çakışma. Çakışmalar hep "paylaşılan test dosyası" ve "iki kümenin aynı bileşende farklı sınıf yazması" biçimindeydi; sahiplik listeleri brief'te net olduğunda ajanlar sınırı korudu, sınırı aşmak zorunda kaldıklarında `crossEdits` ile bildirdiler.
- Opus inceleme turu her kümede en az bir major bulgu çıkardı (yüzeysel kapanış, eksik test, sahiplik ihlali); bu adım atlanmamalı.
- Ana ağaçtaki `.claude/worktrees/` dizini ESLint ve tsc taramasına giriyor; `eslint.config.mjs` ve `tsconfig.json` bu dizini dışlamalı (yapıldı).
- Kaynak dosyalardaki yorumlara kesme işareti koymak `tests/messages.test.ts`'in dizgi taramasını bozuyor.
