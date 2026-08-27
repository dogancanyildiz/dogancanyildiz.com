# Faz 4 devir notu: içerik pipeline (Velite), gerçek içerik, blog ve yayın hazırlığı

Tarih: 2026-08-27 · Dal: `feature/faz-4-icerik-ve-yayin` · Base: `main` @ `ad56a51` (Faz 0-3 PR'ları #2-#5 merge edilmiş) · Plan: `docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md` · Brief: `docs/plans/handoffs/faz-4-brief.md` · Manuel liste: `docs/plans/handoffs/faz-4-manual-checklist.md`

Durum: kod tarafı tamam ve yerelde doğrulandı. Dalda 19 kod commit'i (Task 1-15, dört inceleme düzeltmesi, bir içerik düzeltmesi, bir chore) ve bu notun commit'i var. Planın "Bitti sayılma kriteri" bölümündeki sekiz maddenin yedisi yerelde geçti; sekizinci (Lighthouse, hreflang aracı, Search Console, contact uçtan uca, Cloudflare 301) herkese açık URL ve tarayıcı istediği için manuel listede. Dal push edildi ve PR açıldı, merge edilmedi; CI PR üzerinde koşar. Docker imajı yerelde build edilip 3172 portunda doğrulandı ve silindi.

## Süreç notu

- On beş task tek çalışma ağacında sırayla, her biri taze bir alt ajanla yürütüldü (mekanik kopyalama haiku, kod ve test sonnet); her task veya task grubundan sonra bağımsız bir opus incelemesi koştu (Task 1; Task 3+4 içerik; Task 2; Task 5+6; Task 7+8; Task 9+10; Task 12+13; Task 14+15 ve düzeltme commit'i). Bloklayan bulgu çıkan üç incelemede düzeltme commit'i atıldı: içerik olguları (`0d418af`), feed route'unun `dynamicParams` bayrağı (`48bbd9e`), TR başlık dilbilgisi ve `/contact` h1 (`b4fd6a8`). Tek yazar ve tek uygulayıcı kuralı korundu; hiçbir alt ajan commit atmadı, `git add -A` kullanılmadı, fork tabanlı skill çağrılmadı.
- Planın Task sırası her commit'in yeşil kalması için yeniden düzenlendi: 1, 3, 4, 2, 5+6, 7, 8, 9, 10, 12, 13, 14, 15. Task 11'in metinleri ilgili task'larda katalog anahtarı olarak eklendi, Task 11'in kendisi Task 15'in katalog temizliğine indirgendi (bkz. sapma 12).
- Bir hijyen hatası düzeltildi: içerik düzeltme commit'i, alt ajanın önceden `git rm` ile stage'lediği beş silmeyi de içine almıştı ve tek başına derlenmiyordu. Dal push edilmeden önce `bdf8a36` + `f8bf1eb` çifti `0d418af` + `65c7ab9` olarak yeniden bölündü; tarihçedeki her commit kendi başına typecheck ve test geçiyor.
- Doğrulama portları: `next start` 3171, Docker container'ı 3172, inceleme ajanları 3173 ve 3175 (git archive kopyasında). Task 15 alt ajanı 3000 portunda kendisine ait olmayan bir `next-server` sürecini yanlışlıkla sonlandırdı; manuel liste bölüm 7'de.
- Velite 0.4.0, next 16.3.3 ve next-intl 4.13.7 API'leri context7 ve `node_modules` kaynağıyla doğrulandı; plandan sapan noktalar aşağıda.

## Yapılanlar

| Commit | Task | Özet |
| --- | --- | --- |
| `46596f6` | Task 1 | velite 0.4.0 exact pin; `velite.config.ts` (projects ve posts koleksiyonları, locale dosya yolundan, rehype-slug + autolink + shiki, `prepare` hook aynı locale'de tekrar eden slug'ı reddediyor); `#site/content` alias'ı; `build` = `velite --clean --strict && next build`, `build:content`, `dev`; `.gitignore`, `.prettierignore`, `.dockerignore`, eslint ignore'ları; CI `checks` job'ına `npm run build:content`; `tests/content-schema.test.ts` iki fixture config ile |
| `0274155` | chore | Velite'ın fixture config'lerini `tests/fixtures/node_modules/` altına derlemesi gitignore'a |
| `f61a1af` | Task 3 | Cargo Pilot ve Bilet Satın Alma case study'leri EN+TR (plan metni birebir) |
| `047a80c` | Task 4 | Wikonya, Hubit, GPA case study'leri EN+TR; wikonya summary'leri YAML için tırnaklandı |
| `e302e0a` | Task 2 | `src/lib/content.ts` (erişim katmanı), `src/lib/seo/alternates.ts` (`localePath`, `absoluteUrl`, `buildAlternates`, `buildOpenGraph`), `src/lib/seo/page-metadata.ts` (`buildPageMetadata`), `mdx-content.tsx`, `json-ld.tsx`, vitest alias ve env; Faz 2'nin `locale-url.ts` ve testi silindi, çağıranlar taşındı |
| `0d418af` | içerik düzeltmesi | İnceleme: dört projenin yılı herkese açık repolarla çelişiyordu, GPA stack'i yanlıştı, ticket rolü uydurulmuştu; yıllar 2025, GPA TypeScript/React/Next.js, rol "Cybersecurity project, Siber Vatan program", ticket repo linki, before-state iddiaları hedef cümlesine çevrildi, on iki TR cümle düzeltildi |
| `65c7ab9` | Task 5+6 | `ProjectGrid` + yeniden yazılan `ProjectCard`, projects listesi ve ana sayfa öne çıkanlar Velite'tan; detay sayfası dört hücreli künye, canlı/kaynak butonları, opsiyonel kapak, CreativeWork JSON-LD, `.prose-content` ve shiki çift tema CSS'i; `src/data/projects.ts`, `projects-section`, `featured-projects`, `project-row`, `project-detail` silindi; testler taşındı |
| `294d4cf` | Task 7 | Blog listesi (`PostList`, UTC tarih), ilk TR yazı, `nav.blog` (`src/lib/nav.ts`), `verify:routes` `/en/blog` ve `/tr/blog` |
| `6d1b36c` | Task 5+6 düzeltmesi | Başlık autolink'leri link gibi renkleniyordu; `ProjectCard` `headingLevel` prop'u, projects sayfasında h2 |
| `2197c41` | Task 8 | Yazı sayfası (BlogPosting JSON-LD, article og:type, published_time); `server-only` guard'ı; `verify:routes` slug bazlı karşılaştırma (proje ve yazı, locale başına, draft hariç) |
| `965630d` | Task 9 | `feed.xml` route handler'ı (locale başına RSS 2.0, `lastBuildDate`), proxy matcher dizi (`/feed.xml`, `icon$`), feed keşif linki `buildAlternates.types` içinde, `/favicon.ico` 308 -> `/icon` |
| `988e951` | Task 10 | Sitemap Velite'tan (statik sayfalar + `/blog`, projeler ve yazılar yalnızca var oldukları locale'de, alternates gerçek çevirilerden); `project-locales.ts` silindi; dil değiştirici çevirisi olmayan sayfada bölüm köküne düşüyor (`getUntranslatedPaths`, `switchTargetPath`); `timeZone: "UTC"`; `verify:routes` feed route'ları |
| `2a1fefe` | Task 12 | `src/content/profile.ts` (skills, experience, community, speaking boş, certificates `verifyUrl` tanımsız, education Harp Okulu nötr), `src/lib/site.ts` (`SOCIAL`, `CONTACT_EMAIL_PUBLIC`, `CV_PATH`), `src/lib/cv.ts` (`hasCv`, server-only), `public/cv/dogancanyildiz-cv.pdf`, About sayfası sunucu bileşeni, `SkillsStrip` profil verisinden, `about-content.tsx` ve `data/skills.ts` silindi, `tests/profile.test.ts` |
| `d2eaf1e` | Task 13 | Hero, header (monogram + isim), footer (gerçek linkler, RSS), contact sayfası ve formu (`contact.form`, konu alanı yok, honeypot etiketi), `brand`/`hero`/`contact`/`footer`/`metadata` katalogları gerçek metinle, `metadata.ogAlt` gerçek kimlik |
| `48bbd9e` | Task 9 düzeltmesi | İnceleme: `/foo/feed.xml` 200 dönüyordu; route handler `dynamicParams = false`; `switchTargetPath` kök fallback testi |
| `c241ef6` | Task 14 | İki TR yazı + Coolify yazısının EN çevirisi, ana sayfada son yazılar bloğu, `PostList` `headingLevel`, `rehype-external-links`, testler gerçek yazı kümesine ve genel sitemap değişmezine göre |
| `5e36d7d` | Task 15 | `tests/no-template-residue.test.ts`, `tests/messages.test.ts` (anahtar paritesi + tüketilmeyen anahtar), `hero.title` silindi, `docs/launch-checklist.md`, README "Adding content" ve `build:content` |
| `b4fd6a8` | Task 12+13 düzeltmesi | İnceleme: TR `hero.tagline` ve `about.description` dilbilgisi (uygulamalar altyapıyı yayına alıyor gibi okunuyordu), `/contact` sayfasında h1 yoktu (`SectionHeading` `as` prop'u), "sıkılaştırıldığını", EN tireler, honeypot `autoComplete="off"`, RSS linki `prefetch={false}`, nav testi blog girdisi |
| `4b2cda3` | Task 14+15 düzeltmesi | İnceleme: `about.body2` ünlü uyumu ("de" -> "da"); Coolify yazısının iki cümlesi bu depoya uymuyordu (site adresi eksikse build bilerek hata veriyor, sağlık kontrolü curl değil Node fetch), CAPT yazısı ticket projesini sınav sonrasına tarihliyordu, üç TR cümle; README `vendor:fonts` satırı |

Plan şablonundaki özet, gerçek değerlerle:

- Velite 0.4.0 kuruldu (exact pin), `velite.config.ts` içinde `projects` ve `posts` koleksiyonları tanımlı; `.velite/` gitignore'da, CI ve Docker build'i velite'ı kendisi koşuyor.
- `content/` altında 5 proje (EN+TR, 10 dosya) ve 4 blog yazısı (3 TR, 1 EN çeviri) yayında; kapak yok (`covers=0`).
- `src/data/projects.ts` ve `src/data/skills.ts` kaldırıldı; veri kaynağı Velite ve `src/content/profile.ts`.
- Blog listesi, blog detayı, locale başına RSS, sitemap/hreflang entegrasyonu ve çevirisi olmayan sayfada dil değiştirici fallback'i tamam.
- Gerçek metinler `messages/en.json` ve `messages/tr.json` içinde (96 anahtar, 11 namespace, iki dosya aynı küme, hepsi tüketiliyor); şablon persona sıfır.

## Plandan sapmalar

1. **Task sırası** (Süreç notu): 1, 3, 4, 2, 5+6, 7, 8, 9, 10, 12, 13, 14, 15. Task 2 eski seam'i silerken sayfalar hâlâ `@/data/projects` okuyordu; planın sırası ara commit'lerde derlemeyi kırardı.
2. **`velite --strict`** (Task 1). Strict olmadan şema hatası exit 0 ile geçiyor; `build`, `build:content` ve şema testi `--strict` ile koşuyor. Ayrıca `prepare` hook'u aynı locale'de tekrar eden slug'ı build hatasına çeviriyor (plan yoktu).
3. **Velite yolları config dosyasına göre çözülüyor** (Task 1). Plan fixture config'lerinde `root: "tests/fixtures/invalid-content"` yazıyordu; gerçek çözümleme `dirname(config)` olduğu için `root: "invalid-content"` ve `output.data: ".velite-invalid"`. Geçerli koleksiyonlar için `tests/fixtures/velite.valid.config.ts` gerçek `collections` ve `mdx`'i import edip kendi çıktı dizinine yazıyor; şema testi gerçek `.velite/` dizinini `--clean` ile silmiyor (paralel test işçileri onu import ediyor). Velite config'i `<config dizini>/node_modules/.velite.config.compiled.mjs` olarak derliyor; `tests/fixtures/node_modules/` gitignore'a girdi.
4. **Planın YAML'ı iki yerde geçersizdi**: wikonya summary'lerinde ve iki TR blog başlığında tırnaksız `: ` (nested mapping hatası). Değerler tırnaklandı; README bunu kural olarak yazıyor.
5. **İçerik olguları** (`0d418af`): plan yıllarını uydurmuştu; herkese açık repolar gpa (2025-12), wikonya (2025-11), bilet-satin-alma (2025-10) ve t0-hubit (2025-05) gösteriyor. GPA reposu TypeScript/React/Next.js. Ticket rolü kaynaktaki "Cybersecurity project, Siber Vatan program" oldu, repo linki eklendi. Kaynağın desteklemediği "önce şöyleydi" iddiaları (elle yayın, darboğaz, geliştirici makinesi, dönem boyunca sınıf arkadaşları, her bulgu) hedef veya olgu cümlesine çevrildi.
6. **`buildOpenGraph` planda yoktu**, Faz 2 düzeltme turunun çıktısıydı ve tüm sayfalar kullanıyor; `alternates.ts`'e taşındı, `type` ve `publishedTime` opsiyonları eklendi. Yeni `buildPageMetadata(locale, path, { title, description, availableLocales, type?, publishedTime?, absoluteTitle? })` yedi sayfanın metadata'sını tek çağrıyla kuruyor; planın sayfa kodlarındaki eksik `openGraph` nesneleri (url ve görsel olmadan) Faz 2'nin testine takılırdı.
7. **`Locale`** `AppLocale`'in alias'ı; ikinci bir birlik tipi yazılmadı. **`vitest.config.mts`** (`.ts` yok).
8. **Hareket**: plan `whileInView` ve `LazyMotion` sarmalı kullanıyordu, Faz 3'ün `tests/motion.test.ts` ikisini de yasaklıyor. Kart ve satırlar `fadeUp(reduced)` + `custom={index}` + `motion/react-m` ile; `MotionProvider` layout'ta zaten var, `ProjectGrid` sunucu bileşeni.
9. **Feed keşif linki** layout `alternates.types`'ında değil `buildAlternates` çıktısında: Next çocuk segmentin `alternates`'ini bütünüyle değiştirdiği için layout girdisi hiçbir sayfaya ulaşmazdı. **Proxy matcher** dizi: `"/"`, `"/(en|tr)/:path*"` (dotlu `/en/feed.xml`'i `/feed.xml`'e 307 ile götürüyor), `"/feed.xml"`, genel desen `icon$` ile (yalnızca `/icon`; `/icons` locale rewrite'ına giriyor). `createMiddleware(routing)` çağrısı korundu (test bunu grep'liyor, routing zaten `localeDetection: false`).
10. **`/favicon.ico`** `next.config.ts` `redirects()` ile 308 -> `/icon`; ikinci bir ikon kaynağı üretilmedi.
11. **`CV_PATH` `src/lib/site.ts`'te**, `hasCv` `src/lib/cv.ts`'te (`server-only`): plan ikisini aynı dosyaya koyuyordu, hero istemci bileşeni `node:fs`'i tarayıcıya sürüklerdi. PDF teslim edildiği için `public/cv/.gitkeep` yerine dosyanın kendisi commit'lendi.
12. **Mesaj kataloğu task bazında** yazıldı; Task 11 sondaki temizliğe indirgendi. Planın "listede olmayan mevcut anahtarlar silinmez" kuralı uygulanmadı: şablon değerli anahtarlar (`projects.items`, `about.exp*`, `hero.metric*`, `contact.card*`, `form.*`, `footer.twitter`, `metadata.*Title`) kalıntı testine takılırdı, hepsi silindi. Plandan farklı adlar: `nav.languageLabel` korundu (`nav.switchLanguage` eklenmedi), site başlığı ve açıklaması `metadata.defaultTitle/defaultDescription` (planın `home.title/description`'ı yerine), `footer.navTitle` korundu, `home.skills*` üç anahtar yeniden yazıldı. Planın "82 anahtar" beklentisi gerçekte 96.
13. **`robots.ts` ve `.env.example` değişmedi**: ikisi de zaten doğru içeriği taşıyordu (Faz 1/2), planın yeniden yazımı gereksizdi; mevcut test `rules` dizisini bekliyor.
14. **Test yolları**: `tests/seo/alternates.test.ts` (`locale-url.test.ts` yerine), `tests/seo/sitemap.test.ts` yerinde yeniden yazıldı; planın `tests/sitemap.test.ts` ve `tests/alternates.test.ts` düz yolları kullanılmadı.
15. **Task 5 ve 6 tek commit**: detay sayfası ve liste aynı veri dosyasını sildiği için ayrı commit'ler derlenmezdi. **`ProjectCard` ve `PostList` `headingLevel` prop'u** (planda yok): projects sayfasında kartlar h1'in hemen altında olduğu için h2, ana sayfada h3.
16. **`.prose-content h2 > a, h3 > a`** kuralı: rehype-autolink başlıkları sarmalıyor, plan CSS'i onları link rengine boyuyordu.
17. **`SkillsStrip` silinmedi**, `src/content/profile.ts` içindeki `featured` işaretli gruplarla besleniyor (Frontend, Backend, DevOps ve altyapı, Güvenlik). Profil "Other" grubu (plan düşürmüştü) kaynakta olduğu için eklendi, `featured` değil. Plan metnindeki tire kaybı geri alındı ("end-to-end", "client-specific", "third-party", "knowledge-sharing", "user-friendly", "security-minded").
18. **`about-content.tsx` silindi** (About sunucu bileşeni oldu); **`contact-page-content.tsx` yeniden yazıldı** (plan yalnızca `contact/page.tsx`'e e-posta bloğu koyuyordu, sayfa gövdesi zaten bu bileşendeydi); **hero ve header yeniden tasarlandı** (planda tam kod yoktu): hero tek sütun, metrik kartları ve "available for work" rozeti yok; header monogram + görünür isim (plan `sr-only` istiyordu); footer CTA butonu kaldırıldı; form konu alanı kaldırıldı (API opsiyonel `subject`'i kabul etmeye devam ediyor).
19. **Dil değiştirici fallback'i** (planda yok): Task 8 incelemesi çevirisi olmayan yazıda EN linkinin 404'e gittiğini buldu. Layout her locale için `getUntranslatedPaths` listesini `Header`'a geçiriyor, `switchTargetPath` bölüm köküne düşüyor. İstemci bileşenleri `@/lib/content`'i import etmiyor (Velite JSON'ı tarayıcıya gitmesin).
20. **`timeZone: "UTC"`** `src/i18n/request.ts`'te ve iki tarih formatı çağrısında açık: velite `date`'i UTC gece yarısı ISO datetime olarak saklıyor, batı saat dilimlerinde bir önceki gün görünürdü.
21. **`server-only`** paketi bağımlılık; `mdx-content.tsx` ilk satırda import ediyor (istemci bileşeni onu import ederse build kırılır). vitest `server-only`'yi paketin `empty.js`'ine alias'lıyor (`react-server` koşulu yok).
22. **`verify:routes`** slug bazlı: `.velite/projects.json` ve `posts.json`'dan locale başına küme, prerender manifest'iyle birebir eşit (draft hariç); `/en/feed.xml`, `/tr/feed.xml`, `/en/blog`, `/tr/blog` `required` listesinde.
23. **`rehype-external-links`** (planda yok) MDX gövdelerindeki dış linklere `target=_blank rel=noopener noreferrer` veriyor.
24. **`tests/messages.test.ts`** (planda yok): iki kataloğun anahtar kümesi aynı ve her anahtar `src` altında tüketiliyor; `hero.title` bu testle silindi.
25. **Task 13'ün `.env.example` yeniden yazımı ve boilerplate SVG silmesi** yapılmadı: dosya Faz 1'den beri gerçek değerleri taşıyor (`FROM_EMAIL=contact@dogancanyildiz.sh`, planın `hello@`'su değil), SVG'ler Faz 0'da silinmişti.
26. **Kalıntı testi** ikili dosyaları (`.woff`, `.pdf`, görseller) ve `*.test.ts`'i atlıyor; `tbd`, `lorem ipsum`, `coming soon` kelime sınırıyla eşleşiyor.

## Doğrulananlar

Kapılar (bu dalın HEAD'inde, `.next` silinip sıfırdan build):

| Komut | Sonuç |
| --- | --- |
| `npm run build:content` | exit 0, 10 proje + 4 yazı |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | exit 0, `Test Files 32 passed (32)`, `Tests 458 passed (458)` |
| `npm run format` | exit 0 |
| `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build` | exit 0; `ƒ` yalnızca `/api/contact` ve `/api/health`; `MISSING_MESSAGE`/`INSUFFICIENT_PATH` 0 |
| `npm run verify:routes` | `Static route check passed: 26 content routes prerendered (5 project pages per locale, 1 en posts, 3 tr posts).` |

Faz 3 sonunda 27 dosya / 367 test vardı; bu faz 6 dosya ekledi (`content-schema` 2, `content-layer` 15, `profile` 5, `messages` 2, `no-template-residue` 14, `seo/alternates` 7), `locale-url.test.ts`'i sildi ve `page-metadata.test.ts`'i 63'ten 103 vakaya çıkardı (proje ve yazı sayfaları locale başına).

Bitti sayılma kriterleri (`next start -p 3171`):

| # | Kriter | Çıktı | Geçti mi |
| --- | --- | --- | --- |
| 1 | Otomatik kapılar | beşi de exit 0, 32 dosya / 458 test | evet |
| 2 | Şablon kalıntısı | `grep -ril "alex chen\|techcorp\|startupxyz\|example\.com\|alex@" $(git ls-files src content messages public .env.example)` boş, `exit=1` (test dosyaları dahil hiç eşleşme yok) | evet |
| 3 | Build ve statik route'lar | `ƒ` yalnızca `/api/*`; `/[lang]/projects/[slug]`, `/[lang]/blog/[slug]`, `/[lang]/feed.xml` `●` SSG | evet |
| 4 | İçerik hacmi | `projects en=5 tr=5`, `posts tr=3 en=1`, `covers=0` | evet |
| 5 | Uçtan uca HTTP | 18 yolun tamamı 200; `/blog/capt-sinavina-hazirlik` 404; ek: `/foo/feed.xml` 404, `/favicon.ico` 308 `location: /icon`, `/icons` 404, `/en` 307 `-> /` | evet |
| 6 | hreflang | `/about`: `en`, `tr`, `x-default`; `/tr/blog/capt-sinavina-hazirlik`: yalnızca `tr`, `x-default`; `/blog/self-hosting-with-coolify`: `en`, `tr`, `x-default`; `/tr/projects/cargo-pilot`: üçü (Next özniteliği `hrefLang` olarak basıyor, `<link rel="alternate"` etiketleri sayıldı) | evet |
| 7 | JSON-LD | `/projects/wikonya` CreativeWork 1, `/tr/blog/ccna-dan-web-guvenligine` BlogPosting 1, `/` Person 1 | evet |
| 8 | Elle yapılan yayın öncesi kontroller | koşulmadı: tarayıcı ve herkese açık URL yok | manuel liste bölüm 4-6 |

Kriterlerin ötesinde koşulanlar:

- Sitemap 24 `<url>` (10 statik, 10 proje, 4 yazı); TR-only yazının EN adresi sitemap'te yok; iki dilli yazı iki `<loc>` ile ve her ikisinde `en` + `tr` `xhtml:link`. `/tr/feed.xml` 3 `<item>`, `/feed.xml` 1, ikisi `application/rss+xml; charset=utf-8`, TR feed `xml.dom.minidom` ile geçerli. RSS keşif linki her sayfada kendi locale'inin feed'ini gösteriyor (`/tr/about` -> `/tr/feed.xml`).
- Başlıklar: `/` `<title>Doğan Can Yıldız</title>`, `/about` `About | Doğan Can Yıldız`; `og:site_name` gerçek; `/contact` tek `<h1>`; `/tr` TR tagline; `og:type` proje ve yazı sayfalarında `article`, `article:published_time` `2026-08-20T00:00:00.000Z`.
- Dil değiştirici: `/tr/blog/capt-sinavina-hazirlik` üzerinde EN linki `href="/blog"`; `/tr/about` üzerinde `/about`.
- `/cv/dogancanyildiz-cv.pdf` 200 `application/pdf`; Google Fonts referansı 0; render edilmiş yedi sayfada kalıntı 0.
- Docker (Faz 1 hattı, Dockerfile bu fazda değişmedi): hadolint yalnızca `DL3066 info`, exit 0; `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3172 -t portfolio-local:faz4 .` exit 0 (velite build imaj içinde koştu); container (`-p 3172:3000`, `CONTACT_EMAIL` ve `FROM_EMAIL` ile) `healthy`, `id -un` `node`, `/app` yalnızca `node_modules package.json public server.js`; `/api/health` `{"status":"ok",...}`; `/`, `/tr`, `/tr/blog`, iki dilli yazının iki adresi, iki feed, `/sitemap.xml` (24 url), `/cv/...pdf`, `/icon` 200; `/favicon.ico` 308; `/foo/feed.xml` ve `/blog/capt-sinavina-hazirlik` 404; TR tagline HTML'de. Container ve imaj silindi.
- Kural denetimi: `main..HEAD` aralığındaki 18 commit'in hiçbirinde `Co-Authored-By` veya AI atfı yok; commit mesajlarında ve eklenen satırlarda uzun/en çizgi yok; `.env*`, `.local/`, `.nodeterm/`, `.velite/`, `AGENTS.md`, `CLAUDE.md` hiçbir commit'te yok; sır yazılmadı; `.local/content/portfolio-content.md` commit'lenmedi (yalnızca PDF `public/cv/` altına kopyalandı, sahibinin kararıyla).

## İnceleme turları

| İnceleme | Bloklayan | Düzeltme | Bloklamayan bulguların özü |
| --- | --- | --- | --- |
| Task 1 | yok | yok | invalid fixture SLUG_PATTERN'i kopyalıyor; `prepare` hook'u fixture'da kapsanmıyor; `.dockerignore` kök bağlı olduğu için `tests/fixtures/node_modules` build context'e giriyor (runner'a değil) |
| Task 3+4 içerik | 7 (yıllar, GPA stack, program/rol) | `0d418af` | Wikonya canlı sitesi "Konya Genç"; Hubit ve ticket'ta repo linki yoktu (ticket eklendi, hubit fork); 12 TR cümle; before-state iddiaları |
| Task 2 | yok | yok | draft yolu testsiz; `localePath("tr","/tr")` `/tr/tr`; `publishedTime` `website` tipinde sessizce düşüyor; `server-only` guard önerisi (Task 8'de yapıldı); JSON-LD U+2028 (uygulanabilir değil) |
| Task 5+6 | yok | `6d1b36c` (autolink rengi, h2/h3) | SSR'da `opacity:0` (Faz 3 devri); `metadata.defaultTitle` hâlâ şablon (Task 13'te kapandı); sitemap testi vacuous olabilir; `.prose-content a` başlıkları boyuyor |
| Task 7+8 | yok | yok | `server-only` alias mutlak yol (pnpm'de kırılır); `assert-static-routes` özet satırı yalnızca EN sayısını yazıyor; `readingTime` iki yerde; BlogPosting `image` yok; dil değiştirici 404 (Task 10'da kapandı); `blog.description` RSS'e de gidiyor |
| Task 9+10 | 1 (`/foo/feed.xml` 200) | `48bbd9e` | `"/"` matcher girdisi gereksiz ama zararsız; `escapeXml` testsiz; sitemap `x-default` yok, `<head>` var (Faz 2 devri); statik sayfa `lastmod` build zamanı; `untranslated` dizisi her sayfanın RSC payload'ında |
| Task 12+13 | 3 (TR tagline, TR about.description, `/contact` h1) | `b4fd6a8` | "sertleştirme" -> "sıkılaştırma"; EN tireler; `about.languages` "posts on this site" (Task 14 ile doğru); header'da "Contact" iki kez (liste + CTA); footer `new Date().getFullYear()` yılbaşında hidrasyon uyuşmazlığı; honeypot `autoComplete`; RSS `prefetch`; `hero.title` tüketilmiyor (Task 15'te silindi); `nav.test` "four" (düzeltildi); `tests/profile.test.ts` `B1`/`A2` ham substring |
| Task 14+15 + düzeltme | 1 (`about.body2` "de" -> "da") | `4b2cda3` | CAPT yazısı ticket projesinin zamanı; Coolify yazısında env ve sağlık kontrolü iddiaları bu depoya uymuyordu (düzeltildi); `no-template-residue` `git ls-files`'a bağlı (tarball'da çalışmaz, yalnızca izlenen dosyaları görür); `messages.test` namespace+kalan sezgisi 211 kombinasyonda yanlış pozitif verebilir; planın kriter 6 grep'i `hreflang` küçük harf aradığı için hiçbir şey bulmaz (`<link rel="alternate"` etiketleri sayılmalı); README `vendor:fonts` eksikti (eklendi) |

## Açık kalanlar

- **Sahibinin teslimatı** (kod hazır): Konuşmalar verisi (`speaking` dizileri boş, blok render edilmiyor), sertifika `verifyUrl` değerleri (alan tanımsız, satırlar listede), proje kapak görselleri (`content/images/` boş, `covers=0`). Ayrıntı manuel liste bölüm 3.
- **İçerik onayı**: üç blog yazısı, EN çeviri ve beş case study plan metninden yazıldı; olgular repolarla doğrulandı ama birinci şahıs deneyim cümleleri sahibinin onayını bekliyor. Wikonya canlı sitesinin adı değişmiş; ticket repo linki eklendi (istenmezse silinir); CV PDF içeriği (telefon/adres) sahibinin onayında.
- **Manuel kapılar**: Lighthouse, hreflang test aracı, Search Console, contact uçtan uca, Cloudflare 301; hiçbiri koşulmadı.
- **Faz 5'e taşınabilecek küçük işler**: `tests/no-template-residue.test.ts`'in `git ls-files` bağımlılığı (dosya sistemi taraması + ignore listesi daha dayanıklı), `tests/messages.test.ts` sezgisinin sıkılaştırılması, planın kriter 6 komutunun `<link rel="alternate"` etiketlerini sayacak şekilde düzeltilmesi, sitemap `x-default` (head ile sitemap uyuşmuyor), statik sayfaların `lastModified`'ı build zamanı, header'da "Contact" iki kez (`<nav>` içinde liste + CTA), footer yılının istemcide hesaplanması, BlogPosting `image`/`publisher`, `escapeXml` ve `assert-static-routes` davranış testleri, `tests/profile.test.ts` `B1`/`A2` ham substring'i, `localePath` önek koruması, `server-only` alias'ının `node_modules` yoluna bağlılığı, `subject` doğrulama kodunun artık UI'dan beslenmemesi (`MAX_SUBJECT_LENGTH`, `ContactPayload.subject`), `untranslated` dizisinin her sayfanın RSC payload'ında taşınması (içerik büyürse bölüm bazına indirilebilir).
- **Faz 2 ve 3'ten devralınıp hâlâ açık**: reduced-motion gizli varyantı SSR HTML'de, 404 dokümanı hep `<html lang="en">`, 429/413 metinleri İngilizce, next-intl TypeScript augmentation, `npm run format` CI'da değil, DOM tabanlı test yok, `--destructive-foreground` ve `.pull-quote` ölü, panel adımlarının tamamı, `TRUST_CF_CONNECTING_IP`, Renovate, `npm audit`, CSP nonce.

## Üretilen arayüzler (Faz 5 bunları kullanır)

| Arayüz | İmza / şekil |
| --- | --- |
| `#site/content` | `.velite/` çıktısı: `projects` (`Project[]`), `posts` (`Post[]`), `index.d.ts`; alias tsconfig `paths` ve vitest `resolve.alias`'ta; build'den önce `npm run build:content` şart (CI ve Docker bunu yapıyor) |
| Velite `Project` | `{ title, slug, summary, role, stack[], year, links{live?,repo?}, cover?{src,width,height,blurDataURL,blurWidth,blurHeight}, outcome, featured, order, path, code, locale }` |
| Velite `Post` | `{ title, slug, date (ISO datetime, UTC gece yarısı), summary, tags[], cover?, draft, path, code, metadata{readingTime,wordCount}, locale }` |
| `@/lib/content` | `Locale` (= `AppLocale`), `Project`, `Post`, `CoverImage`, `ProjectCardData`, `PostCardData`; `getProjects`, `getFeaturedProjects`, `getProject`, `getProjectSlugs`, `getProjectLocales`, `getPosts` (draft'lar yalnızca development'ta), `getPost`, `getPostSlugs`, `getPostLocales`, `getUntranslatedPaths`, `toProjectCardData`, `toPostCardData`. DTO `href` locale öneksiz; istemci bileşenleri bu modülü import etmemeli |
| `@/lib/seo/alternates` | `siteUrl` (yalnızca `@/lib/env` yeniden dışa aktarımı), `localePath`, `absoluteUrl`, `buildAlternates(currentLocale, path, availableLocales)` -> `{ canonical, languages (x-default: en varsa en, yoksa ilk locale), types["application/rss+xml"] }`, `buildOpenGraph(locale, path, { title, description, siteName, imageAlt, type?, publishedTime? })` eksiksiz nesne (görsel dahil). Faz 2'nin `locale-url.ts` ve `content/project-locales.ts` dosyaları SİLİNDİ |
| `@/lib/seo/page-metadata` | `buildPageMetadata(locale, path, { title, description, availableLocales, type?, publishedTime?, absoluteTitle? })`: `metadata.defaultTitle` ve `metadata.ogAlt`'ı okur; yeni sayfa reçetesinin tek metadata çağrısı |
| `@/lib/site` | `SOCIAL { github, linkedin }` (`siteConfig.person.sameAs`'ten türetilir), `CONTACT_EMAIL_PUBLIC`, `CV_PATH`; istemciden import edilebilir |
| `@/lib/cv` | `hasCv()` (server-only, build zamanında `existsSync`), `CV_PATH` yeniden dışa aktarımı |
| `@/content/profile` | `SkillGroup { title, items, featured? }`, `ExperienceEntry`, `CommunityEntry`, `SpeakingEntry { event, topic, date }`, `CertificateEntry { name, issuer, detail?, verifyUrl? }`, `EducationEntry`; `skills`, `experience`, `community`, `speaking` (boş), `certificates`, `education`, hepsi `Record<Locale, ...>` |
| `@/i18n/switch-target` | `switchTargetPath(pathname, untranslated)`; layout `Header untranslated={Record<Locale, string[]>}` geçiriyor |
| `@/components/content/mdx-content` | `<MDXContent code components? />`, `server-only`; `new Function` yalnızca sunucuda, CSP `unsafe-eval` istemiyor |
| `@/components/seo/json-ld` | `<JsonLd data />` (`<` kaçışlı); Faz 5 status widget'ı için de kullanılabilir. `person-jsonld.tsx` hâlâ kendi script'ini yazıyor |
| Bileşenler | `ProjectGrid { projects, headingLevel? }` (sunucu), `ProjectCard { project, index, headingLevel? }`, `PostList { posts, headingLevel? }`, `Hero { showCv }`, `SkillsStrip { groups }`, `SectionHeading { as?: "h1" \| "h2" }` |
| CSS | `.prose-content` (h2/h3/a/ul/ol/pre/code; başlık autolink'leri foreground), shiki çift tema (`--shiki-light*` / `.dark` `--shiki-dark*`) |
| Route'lar | `/[lang]/blog`, `/[lang]/blog/[slug]`, `/[lang]/feed.xml` (`force-static`, `dynamicParams = false`), `/favicon.ico` -> `/icon` 308; proxy matcher dizi (`/feed.xml` açık, `icon$`) |
| Script'ler | `build` = `velite --clean --strict && next build`, `build:content`, `dev` = `velite --watch & next dev`; `verify:routes` slug bazlı ve feed route'larını istiyor |
| Mesaj katalogları | 96 anahtar, 11 namespace (`brand` nesne, `nav`, `home`, `hero`, `about`, `projects`, `blog`, `contact` + `contact.form`, `footer`, `notFound`, `metadata`, `api`, `a11y`); `tests/messages.test.ts` parite ve tüketimi kilitliyor |
| Test dosyaları | `tests/content-schema.test.ts` (fixture config'ler `tests/fixtures/`), `tests/content-layer.test.ts`, `tests/profile.test.ts`, `tests/messages.test.ts`, `tests/no-template-residue.test.ts`, `tests/seo/alternates.test.ts`; `tests/seo/page-metadata.test.ts` `PageCase.locales` filtresi ile yazı sayfalarını yalnızca var oldukları locale'de çağırıyor |

## Sonraki faza (Faz 5, altyapı vitrini ve ölçüm) uyarılar

- **Build sırası**: `.velite/` gitignore'da; `typecheck` ve `test` ondan önce `npm run build:content` ister. Yeni bir CI job'ı veya script eklerken bunu `npm ci`'dan hemen sonra koşun. Docker'da ayrı velite adımı EKLEMEYİN, `npm run build` zaten koşuyor.
- **Yeni sayfa reçetesi**: `generateStaticParams`, `hasLocale` + `notFound()`, `setRequestLocale(lang)`, `generateMetadata` içinde `buildPageMetadata(...)` (eksiksiz openGraph ve feed linki dahil); `tests/seo/page-metadata.test.ts` `PAGES` listesine ve `tests/i18n/app-shell.test.ts` `LANG_ROUTES`'a ekleyin; `scripts/assert-static-routes.mjs` `required` listesine girsin. Route handler'lar layout'un `dynamicParams`'ını devralmaz, kendi bayraklarını yazın (`feed.xml` örneği).
- **Status widget** (Faz 5): sunucu tarafı veri çekimi `[lang]` layout'unda veya ana sayfada; `JsonLd` bileşeni ve `absoluteUrl` hazır; istemciye yalnızca DTO geçirin (`untranslated` deseni gibi); hostname/port/IP asla. `GATUS_URL` `.env.example`'da runtime olarak duruyor.
- **Umami** script'i `next.config.ts` CSP'sinin `script-src 'self' 'unsafe-inline'` ve `connect-src 'self'` satırlarına eklenmeli; `img-src 'self' data:` kapak görselleri geldiğinde de yeterli (`/static/` aynı origin).
- **İçerik ekleme**: README "Adding content". Kapak görseli için `cover: ../../images/<slug>-cover.png`; ilk görselde `covers` sayısı 1 olur, `tests/content-layer.test.ts` `card.cover` `null` iddiası güncellenmeli. Yeni TR yazısı `getUntranslatedPaths("en")` listesini ve `tests/content-layer.test.ts`'in beklenen dizisini değiştirir; yeni EN çevirisi `tests/seo/sitemap.test.ts`'in "yalnız TR" örneğini etkilemez (capt yazısına sabitlendi).
- **Mesaj disiplini**: iki katalog aynı küme ve her anahtar tüketilmeli (`tests/messages.test.ts`); anahtar eklerken tüketen bileşeni de yazın, silerken `blog.empty` gibi koşullu tüketicilere dikkat. `blog.description` RSS kanal açıklaması olarak da çıkıyor.
- **Hareket ve renk kuralları** Faz 3'teki gibi; ek: `whileInView` ve `LazyMotion` bileşenlerde yasak (`tests/motion.test.ts` ve `design-tokens.test.ts`), başlık seviyesi prop'la verilir.
- **Proxy matcher** artık dizi; kök seviyeye nokta içermeyen yeni bir route (`/manifest`) eklenirse genel desenin lookahead'ine `manifest$` gibi girmeli, nokta içeren bir route (`/opensearch.xml`) eklenirse `/feed.xml` gibi açıkça listelenmeli. `tests/i18n/app-shell.test.ts` desenleri path-to-regexp yaklaşımıyla simüle ediyor.
- **Tarihler UTC**: `request.ts` `timeZone: "UTC"`; status widget'ta "son deploy" gibi gerçek zamanlı bir değer gösterilecekse formatı bilinçli seçin (sahibinin saat dilimi UTC+3).
- **Kalıntı ve katalog testleri** `git ls-files` ile çalışır; yeni dosyalar stage'lenmeden test edilmez (commit'ten önce `git add` sonra `npm test`).
- **CI check adları değişmedi** (`lint, typecheck, test, build`, `hadolint and image build`); `checks` job'ında yedi `run` adımı var.

## Manuel adımlar

Kodla yapılamayan her şey `docs/plans/handoffs/faz-4-manual-checklist.md` içinde, sıra bağlayıcı: (1) PR incelemesi ve CI, (2) Coolify preview ve canlı doğrulama, (3) sahibinin teslim edeceği içerik (Konuşmalar, sertifika linkleri, kapaklar, metin onayı, CV içeriği, Wikonya ve ticket linkleri), (4) Search Console, hreflang aracı, `x-default` kararı, (5) Lighthouse ve tarayıcı kontrolleri, (6) contact uçtan uca, honeypot, Cloudflare 301, Coolify sağlık, (7) sahibinin kararını bekleyen tasarım ve süreç maddeleri, (8) önceki fazlardan devralınanlar. `docs/launch-checklist.md` yayın kapısının kendisi.

## Task başına model ve inceleme özeti

| Task | Uygulayıcı | Commit | İnceleme (opus) | Bloklayan | Düzeltme |
| --- | --- | --- | --- | --- | --- |
| 1 velite | sonnet | `46596f6`, `0274155` | ayrı | yok | yok |
| 3 öncelikli case study'ler | haiku | `f61a1af` | 3+4 birlikte | 7 olgu bulgusu | `0d418af` (sonnet) |
| 4 kalan case study'ler | haiku | `047a80c` | 3+4 birlikte | aynı | aynı |
| 2 içerik katmanı | sonnet | `e302e0a` | ayrı | yok | yok |
| 5+6 projects | sonnet | `65c7ab9` | birlikte | yok | `6d1b36c` (lider) |
| 7 blog listesi | sonnet | `294d4cf` | 7+8 birlikte | yok | yok |
| 8 yazı sayfası | sonnet | `2197c41` | 7+8 birlikte | yok | yok |
| 9 RSS, proxy, favicon | sonnet | `965630d` | 9+10 birlikte | `/foo/feed.xml` 200 | `48bbd9e` (lider) |
| 10 sitemap, dil değiştirici | sonnet | `988e951` | 9+10 birlikte | yok | yok |
| 12 profil, About | sonnet | `2a1fefe` | 12+13 birlikte | TR dilbilgisi x2, contact h1 | `b4fd6a8` (lider) |
| 13 gerçek metin ve linkler | sonnet | `d2eaf1e` | 12+13 birlikte | aynı | aynı |
| 14 yazılar | sonnet | `c241ef6` | 14+15 birlikte | ünlü uyumu (`b4fd6a8`'den) | `4b2cda3` (lider) |
| 15 kalıntı testi, checklist | sonnet | `5e36d7d` | 14+15 birlikte | aynı | aynı |
| 11 katalog | Task 15'e katıldı | `5e36d7d` | | | |
| entegrasyon ve devir | fable | bu not | | kapılar ve kriterler yeşil | |
