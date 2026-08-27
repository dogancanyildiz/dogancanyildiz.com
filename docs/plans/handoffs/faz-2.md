# Faz 2 devir notu: i18n yeniden mimarisi (app/[lang] + next-intl)

Tarih: 2026-08-27 · Dal: `feature/faz-2-i18n-app-lang` · HEAD: bu commit (`2b10bd7` üzerine) · Base: `feature/faz-1-deploy-hatti` @ `81f97c8` · Plan: `docs/plans/2026-08-27-faz-2-i18n-app-lang.md`

Durum: kod tarafı tamam ve yerelde doğrulandı. Dalda 8 task'ın 13 commit'i (8 task commit'i, 5 inceleme düzeltmesi), entegrasyon turunun 4 commit'i, ilk devir notu, bir düzeltme turu commit'i (`2b10bd7`) ve bu güncelleme var. Düzeltme turunun ne yaptığı aşağıda ayrı bölümde. Bitti sayılma kriterlerinin 1-8'i yerelde geçti; 9 (Coolify preview + CI) ve 10 (hreflang test aracı) herkese açık bir URL istediği için `docs/plans/handoffs/faz-2-manual-checklist.md` içinde sahibini bekliyor. Dal push edilmedi, PR açılmadı, CI hiç koşmadı. Faz 0 (#2) ve Faz 1 PR'ları da henüz merge edilmediği için bu dal üç fazlık bir yığının tepesinde duruyor: `main` -> Faz 0 -> Faz 1 -> Faz 2.

## Süreç notu

- Sekiz task tek çalışma ağacında sırayla, her biri ayrı bir alt ajanla yürütüldü; her task'tan sonra bağımsız bir inceleme koştu. Bloklayan bulgu çıkan beş task'ta düzeltme commit'i atıldı (aşağıdaki tabloda `fix:` satırları). Dört bloklayan bulgunun dördü de aynı şeydi: yeni dosya Prettier'a uymuyor. `npm run format` CI'da koşmuyor, yalnızca yerel kapı; bkz. "Açık kalanlar".
- Entegrasyon turunda (bu not) inceleme bulgularından dördü küçük ve testli olduğu için kapatıldı: `next dev`'in ürettiği dosyalar için `.gitignore` kararı, dil değiştiricinin `/en/...` yönlendirme atlaması, `verify:routes`'un CI'a girmesi, plandaki hatalı kriter komutu ve README script tablosu. Her biri ayrı commit, gerekçe commit gövdesinde.
- Bu oturumda yeni alt ajan açılmadı, fork tabanlı skill çağrılmadı.
- Doğrulama portları: `next start` için 3151, Docker container'ı için 3152 (plan 3000 yazar; port sözleşmesi değişmedi, yalnızca yerel çakışmadan kaçınıldı). Doğrulama sonunda `faz2-verify` container'ı ve `portfolio-local:faz2` imajı silindi.

## Yapılanlar

| Commit | Task | Özet |
| --- | --- | --- |
| `adfd07e` | Task 1 | next-intl 4.13.7 (exact pin), `src/i18n/routing.ts` (`as-needed`, `localeDetection: false`, `localeCookie: false`), `src/i18n/request.ts`, `src/i18n/navigation.ts`, `next.config.ts`'e `createNextIntlPlugin`, `messages/en.json` ve `messages/tr.json`, `tests/i18n/routing.test.ts` |
| `55c855f` | Task 2 | Route ağacı `src/app/[lang]/` altına taşındı (layout, page, about, projects, projects/[slug], contact, opengraph-image), `src/proxy.ts`, header/footer/dil değiştirici `@/i18n/navigation` üzerinden, about ve contact gövdeleri `src/components/sections/` altına, `tests/i18n/app-shell.test.ts` |
| `67c6808` | Task 2 düzeltmesi | 404'ler kabuksuz ve `<html lang>`'siz kalmıştı: `src/app/global-not-found.tsx` (kendi dokümanı, `experimental.globalNotFound: true`), `[lang]/layout.tsx`'e `dynamicParams = false`, `src/app/[lang]/not-found.tsx`, `notFound` namespace'i |
| `12e7589` | Task 3 | Dokuz içerik bileşeni `useTranslations`'a geçti; `src/lib/i18n/translations.ts`, `src/lib/i18n/use-translation.ts`, `src/components/locale-provider.tsx` silindi; `cookies()` çağrısı kalmadı |
| `7271a8a` | Task 3 düzeltmesi | Test dosyası Prettier'a uyduruldu; `useLocale` yasağı `contact-form.tsx`'i dışarıda bırakacak şekilde bölündü (Task 7 orada `useLocale` kullanır) |
| `926a4bd` | Task 4 | `src/lib/seo/locale-url.ts` (`localePath`, `localeUrl`, `buildAlternates`), `src/lib/content/project-locales.ts` (`localesForProject`), her sayfada `generateMetadata` ile title/description/canonical/hreflang/x-default, layout'ta `openGraph.locale` ve `alternateLocale`, `tests/seo/locale-url.test.ts` |
| `27bc6d5` | Task 5 | `sitemap.ts` iki locale ve per-entry `alternates.languages`, `robots.ts` `Disallow: /api/` + `host`, `tests/seo/sitemap.test.ts` |
| `a51b783` | Task 5 düzeltmesi | Sitemap testi Prettier'a uyduruldu |
| `68c0d3e` | Task 6 | `src/lib/site-config.ts` (`siteConfig.person`, gerçek kimlik verisi), `src/components/seo/person-jsonld.tsx`, ana sayfada `<PersonJsonLd locale={lang} />` |
| `eb52110` | Task 7 | `/api/contact` locale'i request body'sindeki `locale` alanından okuyor (`resolveLocale`, bilinmeyen değer `en`'e düşer), hata metinleri `api` namespace'inden, `contact-form.tsx` `useLocale` ile locale gönderiyor, `route.test.ts` güncellendi |
| `da59e3e` | Task 7 düzeltmesi | Route ve testi Prettier'a uyduruldu |
| `d740b38` | Task 8 | `scripts/assert-static-routes.mjs` + `npm run verify:routes`, README "Internationalization" bölümü |
| `2e667e6` | Task 8 düzeltmesi | Script Prettier'a uyduruldu, `tests/scripts/assert-static-routes.test.ts` eklendi |
| `26bf303` | entegrasyon | `.gitignore`'a `AGENTS.md` ve `CLAUDE.md` (`next dev` her başlangıçta yeniden yazıyor; temiz çalışma ağacı kriteri için gerekliydi, geri alınabilir, bkz. sapma 12) |
| `97cb727` | entegrasyon | Dil değiştirici `getPathname` ile prefix'siz EN URL üretiyor (`/about`, `/en/about` değil), `tests/i18n/navigation.test.ts`, `vitest.config.mts`'e `server.deps.inline: ["next-intl"]` |
| `72ab71a` | entegrasyon | `.github/workflows/ci.yml` `checks` job'ında build'den sonra `npm run verify:routes`; `tests/deploy/ci-workflow.test.ts` bunu kilitliyor |
| `1033563` | entegrasyon | Plan kriter 2'nin grep deseni ve beklentisi düzeltildi (PR gövdesi ve devir şablonu dahil); README script tablosuna `verify:routes` eklendi, `npm test` satırı `tests/**` kapsamını söylüyor |

Plan şablonundaki özet, gerçek değerlerle:

- next-intl 4.13.7 kuruldu (exact pin). Yapılandırma: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`, `src/proxy.ts`.
- Route ağacı `src/app/[lang]/` altına taşındı; kök layout artık `src/app/[lang]/layout.tsx`. `src/app/api/`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/icon.tsx`, `src/app/favicon.ico`, `src/app/global-not-found.tsx` `[lang]` dışında.
- Mesajlar `messages/en.json` ve `messages/tr.json`'da: 152 anahtar, iki dilde birebir aynı küme, 12 namespace (`brand`, `nav`, `hero`, `home`, `footer`, `about`, `projects`, `contact`, `form`, `notFound`, `metadata`, `api`).
- `src/lib/i18n/translations.ts`, `src/lib/i18n/use-translation.ts`, `src/components/locale-provider.tsx` silindi; `src/` altında `cookies()`, `next/headers`, `document.cookie` ve `next/link` importu yok.
- `generateMetadata` `lang` param'ından üretiliyor; canonical + hreflang + x-default + `metadataBase` var.
- `sitemap.ts` ve `robots.ts` iki locale üretiyor; Person JSON-LD ana sayfada, iki locale'de de.
- `/api/contact` locale'i request body'sinden okuyor.

## Plandan sapmalar

1. **`vitest.config.ts` yok, `vitest.config.mts` var** (Task 1). Faz 0'dan gelen `.mts` dosyası planın Step 4'te istediği her şeyi zaten içeriyordu; ikinci bir config yazılmadı. Plan Step 15'teki `git add ... vitest.config.ts` bu yüzden hiç koşmadı.
2. **`generateImageMetadata` locale fallback'i** (`src/app/[lang]/opengraph-image.tsx`, Task 2). Plandaki kod build'i patlatıyor: Next 16 sayfa verisi toplarken `generateImageMetadata`'yı önce boş params ile çağırıyor, `getTranslations({ locale: undefined })` da `headers()`'a düşüp "used headers() inside generateStaticParams" hatası veriyor. `hasLocale(routing.locales, lang) ? lang : routing.defaultLocale` eklendi; per-locale alt (EN "Portfolio", TR "Portfolyo") çalışmaya devam ediyor.
3. **`metadataBase` korundu** (`src/app/[lang]/layout.tsx`). Plan Task 2'nin layout kodu satırı düşürüyordu; Faz 1 devir notunun bağlayıcı uyarısı gereği taşındı ve `tests/i18n/app-shell.test.ts` kilitliyor. og:image'lar `https://dogancanyildiz.sh/...` olarak çıkıyor.
4. **404 mimarisi planda yoktu** (`67c6808`). Kök layout `[lang]` altına inince eşleşmeyen yollar hiçbir layout'a düşmüyor ve Next çıplak bir doküman basıyordu. Çözüm üç parça: `src/app/global-not-found.tsx` (kendi `<html>`'i, `globals.css`'i, EN metin + `lang="tr"` bloğu), `next.config.ts`'te `experimental.globalNotFound: true` (16.3.3 dosyayı bu bayrak olmadan görmüyor), `[lang]/layout.tsx`'te `dynamicParams = false`. Denenip reddedilen alternatif: `[lang]/[...rest]` catch-all, çünkü istek anında atılan `notFound()` 16.3.3'te `__next_error__` kabuğunu üretiyor. Yan etkisi "Açık kalanlar"da: `[lang]/not-found.tsx` bugün pratikte hiçbir istekte devreye girmiyor.
5. **`/api/health` de dinamik** (Task 2 Step 16, Task 8 Step 4, kriter 2). Plan tek `ƒ` satırı olarak `/api/contact` bekliyordu; `/api/health` Faz 0'dan beri bilerek `no-store` ve `uptime` döndüğü için dinamik ve öyle kalmalı. Kriter metni `1033563` ile `/api/*` olarak düzeltildi; Task 2 ve Task 8'in yürütülmüş adım metinlerine (plan satır 1194 ve 2534-2538) dokunulmadı.
6. **Kriter 2'nin grep deseni route satırı yakalamıyordu.** `^[[:space:]]*ƒ` yalnızca `ƒ Proxy (Middleware)` ve lejant satırını yakalıyor; route satırları `├ ƒ /api/contact` biçiminde. Plan artık `grep -E "ƒ /"` kullanıyor.
7. **Plan Step 12 / Step 5 grep'leri "OK" basmıyor, kod temiz.** Task 3 Step 12'nin deseni `NEXT_LOCALE` kelimesini `src/i18n/routing.ts:8`'deki açıklama yorumunda yakalıyor (cookie'nin neden kapalı olduğunu anlatan satır). Task 8 Step 5'in `grep -rn "example.com" src/` beklentisi bu fazda ulaşılamaz: `src/components/layout/footer.tsx:38,42` (`mailto:alex@example.com`) ve `src/data/projects.ts:30,62` (`liveUrl`) şablon değerleri taşıyor ve planın içerik politikası (satır 46-50) bunları Faz 4 launch kapısına bırakıyor. Bitti kriteri 8'in üç komutu boş dönüyor.
8. **Sitemap `x-default` üretmiyor, sayfa `<head>` üretiyor.** `buildAlternates` `x-default` ekliyor, `sitemap.ts`'teki `languagesFor` yalnızca `routing.locales` üzerinde dönüyor; `tests/seo/sitemap.test.ts` anahtar kümesini `["en","tr"]` olarak kilitliyor. Plan Step 3 kaynağı birebir böyle, yani plana sadık; iki hreflang yüzeyi bugün uyuşmuyor. Karar "Açık kalanlar"da.
9. **Plan Task 7'nin "hata gövdesi istekteki dilde" vaadi kısmen karşılanıyor.** 429 (limiter body okunmadan çalışır) ve okunamayan gövde 400'ü her zaman İngilizce, 413 metni sabit İngilizce (`TOO_LARGE_MESSAGE`). Doğrulama: aynı IP'den `{"locale":"tr"}` ile altıncı istek `{"error":"Too many requests. Please try again in a few minutes."}`. `contact-form.tsx:49` `data.error`'ı olduğu gibi basıyor, yani TR ziyaretçi limite takılırsa EN metin görür.
10. **Testler plandan fazla.** Task 2 (`tests/i18n/app-shell.test.ts`, 5 describe), Task 3 (aynı dosyaya `content components` bloğu), Task 8 düzeltmesi (`tests/scripts/assert-static-routes.test.ts`) ve entegrasyon (`tests/i18n/navigation.test.ts`) planda olmayan testler ekledi. Toplam 19 dosya, 207 test; Faz 1 sonunda 13 dosya, 125 test vardı. Kaynak metnini grep'leyen sözleşme testleri çoğunlukta; gerçek davranışı test edenler `tests/i18n/routing.test.ts` (config), `tests/i18n/navigation.test.ts` (`getPathname` prefix davranışı), `tests/seo/*` (URL üretimi) ve proxy matcher regex'i.
11. **Dil değiştirici planın Step 13 koduyla `/en/<yol>` üretiyordu** (`97cb727`). next-intl 4.13.7'de `Link`'e açık `locale` prop'u verilince `forcePrefix` devreye giriyor (`createSharedNavigationFns.js`: `forcePrefix: locale != null || undefined`), `as-needed`'e rağmen `/en/about` çıkıyor ve proxy bunu 307 ile `/about`'a çeviriyor. Her prerender edilmiş sayfa yönlendiren bir iç bağlantı taşıyordu; `docs/04-i18n.md`'nin "kök gerçek içerik sunar, redirect atlaması yok" gerekçesiyle çelişiyordu. Şimdi `getPathname({ locale, href: pathname })` + düz `<a>`: EN `/about`, TR `/tr/about`; `/` ve `/tr/about` HTML'inde `href="/en` geçmiyor. Sayfa yükünde `next/link` prefetch'i yok, dil değişimi zaten tam sayfa yeniden yüklemesi.
12. **`AGENTS.md` / `CLAUDE.md` `.gitignore`'a alındı** (`26bf303`). Faz 0 ve Faz 1 bu kararı sahibine bırakmıştı; bu faz "temiz çalışma ağacı" kriterini zorunlu tuttuğu için üç seçenekten en az müdahaleci ve en kolay geri alınabilir olanı seçildi: `.gitignore`'un mevcut "AI Tools" bölümü zaten `.claude/`, `.cursor/`, `.cursorrules`'u dışarıda tutuyor, iki dosya aynı kurala girdi. Dosyalar diskte duruyor (`next dev`'in hedeflediği yerel ajan araçları `@AGENTS.md` ipucunu görmeye devam eder), imaja `.dockerignore`'un kök `*.md` kuralı sayesinde girmiyor. Geri almak: `.gitignore`'daki iki satırı silip ya dosyaları commit etmek ya da `next.config.ts`'e `agentRules: false` eklemek.
13. **`verify:routes` CI'da** (`72ab71a`). Plan istemedi; yol haritasının bu faz için tanımladığı tripwire ("route'lar sessizce dynamic'e düşerse") elle koşulan bir script'le tripwire olmuyordu. `checks` job'ında build'den hemen sonra koşuyor, aynı job'ın `.next/prerender-manifest.json`'ını okuyor. Check adları değişmedi.
14. **`vitest.config.mts`'e `server.deps.inline: ["next-intl"]`** (`97cb727`). `src/i18n/navigation.ts` vitest altında yüklenemiyordu: next-intl'in client navigation girişi `next/navigation`'ı uzantısız import ediyor, `next` paketinin `exports` alanı yok, externalize edilen bağımlılıkta Node'un ESM çözümleyicisi bunu reddediyor ("Did you mean to import next/navigation.js?"). `vi.mock("next/navigation")` de çözmüyor (hata çözümleme aşamasında). Paket inline edilince Vite çözüyor; 207 testin tamamı bu ayarla yeşil, `src/app/api/contact/route.test.ts`'in `next-intl/server` mock'u etkilenmedi.
15. **Port ve staging farkları.** Doğrulama 3151/3152'de yapıldı; hiçbir task `git add -A` kullanmadı (plan Step'lerinde yazmasına rağmen), her commit dosya seçerek atıldı; `AGENTS.md`/`CLAUDE.md` hiçbir commit'e girmedi.
16. **Prettier tek satır kaydırmaları.** Task 4'te `tests/seo/locale-url.test.ts` plandaki metinden iki satır genişlik yüzünden `prettier --write` ile kaydırıldı, iddia sayısı değişmedi.

## Doğrulananlar

Kapılar (bu dalın HEAD'inde, `NEXT_PUBLIC_SITE_URL` `.env.local`'dan `https://dogancanyildiz.sh`):

| Komut | Sonuç |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test` | exit 0, `Test Files 19 passed (19)`, `Tests 207 passed (207)` |
| `npm run format` | exit 0, `All matched files use Prettier code style!` |
| `rm -rf .next && npm run build` | exit 0, 27 statik sayfa; route tablosunda `●` ile `/en`, `/tr` ve altları, `ƒ` yalnızca `/api/contact` ve `/api/health`, `○` ile `/_not-found`, `/icon`, `/robots.txt`, `/sitemap.xml` |
| `npm run verify:routes` | exit 0, `Static route check passed: 20 content routes prerendered (6 project pages per locale).` |

`.next/prerender-manifest.json`'da 26 route var: 20 içerik route'u (`/en`, `/tr`, ikişer `about`, `projects`, `contact`, altışar proje detayı), `/_global-error`, `/_not-found`, `/favicon.ico`, `/icon`, `/robots.txt`, `/sitemap.xml`; `/api/*` yok.

Bitti sayılma kriterleri (3-7 için `npm run start -- -p 3151`, komutlardaki 3000 yerine 3151):

| # | Kriter | Komut | Çıktı | Geçti mi |
| --- | --- | --- | --- | --- |
| 1 | Kalite kapısı | `npm run typecheck && npm run lint && npm run test && npm run build && npm run verify:routes` | beşi de exit 0, `verify:routes` çıktısı beklenen satırla birebir | evet |
| 2 | Dinamik route yalnızca `/api` | plandaki eski desen `grep -E "^[[:space:]]*ƒ" \| grep -v "/api/"` | `ƒ Proxy (Middleware)` ve `ƒ  (Dynamic)  server-rendered on demand` (route değil, sapma 6); düzeltilmiş desen `grep -E "ƒ /" \| grep -v "/api/"` boş, exit 1; `grep -E "ƒ /"` tek başına `├ ƒ /api/contact`, `├ ƒ /api/health` | evet (plan metni düzeltildi) |
| 3 | İki dil ayrı URL'de | `curl` dizisi | `/` 200, `/tr` 200, `/en` `307 http://localhost:3151/`, `/fr` 404, `/` `<html lang="en"`, `/tr` `<html lang="tr"` | evet |
| 4 | hreflang ve canonical | `curl ... \| grep -o 'hrefLang="[a-z-]*"' \| sort` | `/about` ve `/tr/about` `<link rel="alternate">` kümesi `en`, `tr`, `x-default`; plandaki grep dil değiştiricinin `<a hrefLang>` özniteliklerini de yakaladığı için `en` ve `tr` ikişer kez görünür; `/tr/about` canonical `https://dogancanyildiz.sh/tr/about`, `/about` canonical `https://dogancanyildiz.sh/about`, `/` canonical `https://dogancanyildiz.sh` (Next sondaki `/`'ı düşürür, sitemap ile uyumlu) | evet |
| 5 | sitemap ve robots | `curl` dizisi | `<url>` 20; `/tr/` 27; `Disallow: /api/` eşleşti; `example.com` 0; `/en/` ile başlayan `<loc>` 0; `x-default` 0 (sapma 8) | evet |
| 6 | Person JSON-LD | `curl -s /` | `"@type":"Person"` 1, `"name":"Doğan Can Yıldız"` 1; `/tr`'de `jobTitle` "Full-Stack Web Geliştirici ve DevOps Mühendisi", `url` `https://dogancanyildiz.sh/tr` | evet |
| 7 | Contact locale body'den | `curl -X POST /api/contact -d '{"locale":"tr"}'` | `{"error":"Geçersiz istek. Ad, e-posta ve mesaj alanları zorunlu."}`; `en`, `de` ve `{}` -> `{"error":"Invalid request. Name, email, and message are required."}`; boş gövde 400 | evet |
| 8 | Eski katmandan kalıntı yok | `grep -rn "cookies()" src/`, `grep -rn "locale-provider\|lib/i18n/translations\|use-translation" src/`, `ls src/middleware.ts` | üçü de boş | evet |
| 9 | Deploy doğrulaması | Coolify preview + CI | koşulmadı: dal push edilmedi, Faz 1'in Coolify adımları uygulanmadı | manuel, checklist bölüm 1-3 |
| 10 | hreflang test aracı | technicalseo.com hreflang tester | koşulmadı, herkese açık URL yok | manuel, checklist bölüm 4 |

Kriterlerin ötesinde koşulan doğrulamalar:

- Docker (Faz 1 hattı, `Dockerfile` bu fazda değişmedi): `docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile` -> `DL3066 info` (Faz 1 ile aynı), exit 0. `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3152 -t portfolio-local:faz2 .` exit 0. Container (`-p 3152:3000`, `CONTACT_EMAIL` ve `FROM_EMAIL` ile): `/api/health` `{"status":"ok","uptime":1,...}`, `/` 200 `<html lang="en"`, `/tr` `<html lang="tr"`, nav metinleri EN `About Contact Projects`, TR `Hakkımda İletişim Projeler`, `/en` `307 http://localhost:3152/`, `/fr` 404, `/tr/about`'ta "Hakkımda" 7 kez, contact TR gövdesi, `Set-Cookie` yok, `id -un` `node`, health status `healthy`. `/app` listesi `.next node_modules package.json public server.js`. Yani `messages/*.json` standalone çıktısına bundle'lanıyor, Faz 1 notunun uyardığı `.dockerignore` sorunu yok (`messages/` build context'te). Container ve imaj silindi.
- Dil değiştirici (`97cb727` sonrası): `/about`'ta `<a href="/about" hrefLang="en" aria-current="true">EN</a>` ve `<a href="/tr/about" hrefLang="tr">TR</a>`; `/tr/projects/design-system`'de `href="/projects/design-system"` ve `href="/tr/projects/design-system"`; altı hedef de yönlendirmesiz 200.
- Cookie yok: `/` ve `/tr` yanıtlarında `Set-Cookie` 0. `src/` altında `NEXT_LOCALE` yalnızca `src/i18n/routing.ts:8` yorumunda.
- 404'ler: `/tr/projects/unknown`, `/projects/unknown`, `/tr/nonexistent`, `/nonexistent`, `/fr`, `/foo.txt`, `/xx/about` hepsi 404 ve `<html lang="en">` ile tam doküman; `/tr/nonexistent` gövdesinde `lang="tr"` bloğu var. Ayrıntı "Açık kalanlar"da.
- Ham anahtar sızıntısı yok: sekiz içerik route'unun HTML'inde `hero.*`, `home.*`, `nav.*` gibi çözülmemiş anahtar 0.
- Mesaj paritesi: `messages/en.json` ve `messages/tr.json` 152 anahtar, küme birebir aynı (düzleştirilmiş anahtar listeleri karşılaştırıldı).
- Rate limit: aynı IP'den `{"locale":"tr"}` ile ardışık POST'larda beşinci istekten sonra 429, gövde İngilizce (sapma 9).
- og:image: `/opengraph-image/default` 200 `image/png` 39928 bayt; `/tr/opengraph-image/default` 200; EN sayfaların ilan ettiği `/en/opengraph-image/default` 307 ile `/opengraph-image/default`'a gidiyor ("Açık kalanlar").
- Sayfa metadata'sı: `/about` `<title>About | Alex Chen Portfolio</title>`, `/tr/about` `<title>Hakkımda | Alex Chen Portfolyo</title>`, description'lar locale'e göre; `og:locale` `en_US`/`tr_TR`, `og:locale:alternate` karşıt değer, `og:type` `website`.
- Kural denetimi: 17 commit'in hiçbirinde `Co-Authored-By` veya AI atfı yok; dalın tüm diff'inde eklenen satırlarda uzun/en çizgi yok (`.gitignore`'daki `─` kutu çizim karakteri U+2500, çizgi değil); `.env*`, `.local/`, `.nodeterm/`, `AGENTS.md`, `CLAUDE.md` hiçbir commit'te yok.

## Düzeltme turu

Tarih: 2026-08-27 · Commit: `2b10bd7` + bu not · Model: opus · Dal aynı, push yok.

Entegrasyon sonrası bağımsız incelemenin tek bloklayan bulgusu kapatıldı: **her alt sayfa OpenGraph'ta ana sayfayı gösteriyordu.** `/about` için `og:url` `https://dogancanyildiz.sh`, `/tr/projects/design-system` için `og:title` "Alex Chen Portfolyo" çıkıyordu; canonical ve hreflang doğru olduğu için sinyaller kendi içinde çelişiyordu. Aynı madde "Açık kalanlar"da bilinçli plan seçimi olarak duruyordu, artık orada değil.

Kök neden `node_modules/next/dist/lib/metadata/resolve-metadata.js` içinde: `mergeMetadata`'nın `case "openGraph"` dalı çocuk segmentin nesnesini ata nesnenin **yerine** koyuyor, birleştirmiyor. Bir segment `openGraph` döndürmezse ata nesne olduğu gibi devralınıyor, alt sayfaların hepsi bu durumdaydı.

Aynı fonksiyonun ikinci yarısı düzeltmenin şeklini belirledi. `mergeStaticMetadata` dosya tabanlı görseli yalnızca **o segmentin** `staticFilesMetadata`'sından alıyor; `opengraph-image.tsx` `[lang]` segmentinde olduğu için alt sayfalar görseli sadece miras yoluyla görüyordu. Bulgunun önerdiği kısmi override (`{ url, title, description }`) bu yüzden `og:image`'i sessizce düşürüyordu: ara adımda build çıktısında doğrulandı, `/en/about.html` görselsiz kaldı. Bu yüzden `buildOpenGraph` eksiksiz nesne döndürüyor, `images` dahil.

Değişenler:

| Yol | Ne oldu |
| --- | --- |
| `src/lib/seo/locale-url.ts` | `buildOpenGraph(locale, pathname, { title, description, siteName, imageAlt })`: `type`, `siteName`, `title`, `description`, `url`, `locale`, `alternateLocale` ve tek elemanlı `images`. `og:locale` haritası (`en_US`/`tr_TR`) layout'tan buraya taşındı |
| `src/lib/seo/og-image.ts` | Yeni. `OG_IMAGE_ID`, `OG_IMAGE_SIZE`, `OG_IMAGE_CONTENT_TYPE`, `OG_IMAGE_PATH`; görseli üreten route ile ona link veren sayfalar aynı kaynağı okuyor, id ve boyut ayrışamıyor |
| `src/app/[lang]/opengraph-image.tsx` | `size`, `contentType` ve `id` artık `og-image.ts`'ten geliyor; `generateImageMetadata`'nın boş params fallback'i olduğu gibi duruyor |
| `src/app/[lang]/layout.tsx` | Kendi `openGraph` nesnesini `buildOpenGraph(lang, "/")` ile kuruyor; yalnızca ana sayfa bu nesneyi devralıyor |
| `[lang]/page.tsx`, `about`, `projects`, `contact`, `projects/[slug]` | Her `generateMetadata` kendi `openGraph`'ını döndürüyor. Detay sayfası `siteName` ve `imageAlt` için `metadata` namespace'ini ikinci bir `getTranslations` ile okuyor |
| `tests/seo/page-metadata.test.ts` | Yeni. On sayfa (dört statik sayfa + altı proje detayı) ve iki locale için `generateMetadata` gerçekten çağrılıyor, 20 vaka |
| `tests/seo/locale-url.test.ts` | `buildOpenGraph` birim testi |

Test yaklaşımı: `next-intl/server` istek bağlamı dışında client build'ine düşüp `getTranslations`'ı patlattığı için `vi.mock` ile stub'lanıyor, ama stub gerçek `messages/{en,tr}.json` dosyalarını okuyor, olmayan anahtar testi düşürüyor. İddialar: `og:url` sayfanın kendi canonical'ına eşit, `og:title` ve `og:description` sayfanın kendi başlığına ve açıklamasına eşit, `og:locale` doğru ve `alternateLocale` kendini içermiyor, `images` tek elemanlı ve locale'in kendi görseline bakıyor, `og-image.ts` sabitleri route'un export'larıyla aynı. Regresyon yakalaması doğrulandı: `about/page.tsx`'ten `openGraph` satırı geçici olarak silindiğinde beş test kırmızıya döndü. Eski testler yalnızca kaynak grep'i olduğu için bunu yakalamıyordu.

Doğrulama (`NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh`, `next start` portu 3113):

- `npm run format`, `npm run lint`, `npm run typecheck`, `npm test` (20 dosya, 271 test), `npm run build`, `npm run verify:routes` yeşil. Prerender sayısı değişmedi: 20 içerik route'u.
- Build çıktısında `og:url` ile `<link rel="canonical">` sekiz sayfada birebir aynı: `/`, `/tr`, `/about`, `/tr/about`, `/projects`, `/tr/contact`, `/tr/projects/design-system`, `/projects/ecommerce-platform`.
- `og:image` her sayfada var; `/opengraph-image/default` ve `/tr/opengraph-image/default` çalışan sunucuda 200 `image/png` (39928 bayt) döndü.

Yan kazanç: "Açık kalanlar"daki **EN og:image `/en/` prefix'i** maddesi de kapandı. Görsel artık `localeUrl` ile üretildiği için İngilizce sayfalarda `https://dogancanyildiz.sh/opengraph-image/default`, yani 307 hop'u yok; hash query'si düştü, o yalnızca cache buster'dı.

Kapsam dışı bırakılanlar: proje detay sayfalarının `og:type`'ı `website` kaldı, `article`'a geçmek `publishedTime` ve `author` ister, içerik Velite'a taşınınca (Faz 4) anlamlı olur. `twitter` bloğu hâlâ yok, kartlar og etiketlerine düşüyor. `docs/plans/handoffs/faz-2-manual-checklist.md` bölüm 6'daki "og:image prefix'i" maddesi artık sahibinin kararını beklemiyor, ilgili satır işaretlendi.

## Açık kalanlar

- **Dal push edilmedi, PR açılmadı, CI hiç koşmadı.** Kriter 9 ve 10 preview URL'e bağlı, o da Faz 1 checklist'inin Coolify bölümlerine (3-4) bağlı. Üç faz yığılmış durumda; merge sırası ve rebase notu `faz-2-manual-checklist.md` bölüm 1'de.
- **Site metinleri hâlâ şablon persona** (`Alex Chen`, `alex@example.com`, `TechCorp Inc.`, `StartupXYZ`, `example.com` liveUrl'leri). Faz 4'te `messages/{en,tr}.json` değerleri `.local/content/portfolio-content.md`'den yeniden yazılacak, anahtar yapısı değişmeyecek. Faz 4 launch kapısındaki `alex chen` / `example.com` grep'i `messages/` dizinini de kapsamalı (`docs/10-yol-haritasi.md`'deki kapı şu an `src/app`, `public`, `README.md`, `.env.example` sayıyor). JSON-LD gerçek ismi söylerken görünen içerik şablon ismi gösteriyor; Faz 2 tek başına yayına alınırsa bu uyuşmazlık canlıda görünür, bu yüzden Faz 4'ten önce yayın kararı sahibinin.
- **`[lang]/not-found.tsx` bugün pratikte devreye girmiyor.** `dynamicParams = false` bilinmeyen `slug`'ı router seviyesinde reddettiği için `/tr/projects/unknown` da `global-not-found.tsx`'e düşüyor: 404 dokümanı `<html lang="en">`, EN metin ve altında `lang="tr"` işaretli TR paragrafı, header/footer yok. Locale'e özel 404 istenirse iki yol var: `dynamicParams`'ı `[slug]` için açıp sayfada `notFound()`'a güvenmek (67c6808'in commit gövdesi 16.3.3'te bunun `__next_error__` kabuğu ürettiğini kaydediyor, yeniden denenmeden yapılmamalı) ya da Next'in `global-not-found` davranışı düzelince dosyayı locale'e göre dallandırmak. Faz 3 tasarım sistemini `global-not-found.tsx`'e de uygulamak zorunda (aşağıdaki uyarılar).
- **Sitemap `x-default` yok, `<head>` var** (sapma 8). Google sitemap'te `x-default`'u destekliyor; eklenirse `tests/seo/sitemap.test.ts:39` güncellenir ve `languagesFor` yerine `buildAlternates`'in `languages` haritasını paylaşan tek bir yardımcı kullanılır (iki döngü bugün kopya).
- **`lastModified` tek build zamanı** (`sitemap.ts`): 20 girdi aynı `<lastmod>`'u taşıyor, her deploy'da hepsi değişmiş görünüyor. Faz 4 Velite front matter'ından proje bazlı tarih verebilir.
- **429, 413 ve okunamayan gövde 400'ü İngilizce** (sapma 9). Seçenekler: locale'i `?locale=` query param'ı ile göndermek (limiter'dan önce okunur), formda 429'u kendi çevirisiyle karşılamak, ya da davranışı `route.ts`'te yorumla kayda geçirmek. `src/app/api/contact/route.test.ts`'in `getTranslations` mock'u `locale` argümanını yok sayıyor; `${locale}.${key}` döndürüp `tr.invalidRequest` / `en.invalidRequest` iddiası eklemek locale kablolamasını kilitler. Mock'taki EN metinler `messages/en.json` ile elle senkron.
- **`npm run format` CI'da koşmuyor.** Sekiz task'ın dördü bu kapıya takıldı ve düzeltme commit'i gerektirdi; `ci.yml`'e `- run: npm run format` eklemek (ve `tests/deploy/ci-workflow.test.ts` listesine) bir satır. Entegrasyon turunda bilerek yapılmadı, karar sahibinin.
- **next-intl TypeScript augmentation** (`declare module "next-intl"`, `AppConfig.Messages`) eklenmedi; `projects.items.<id>.title` gibi hesaplanmış anahtarlar buna bağlı. İçerik Velite'a taşınınca yeniden değerlendirilecek.
- **Blog route'ları yok**; Faz 4 `[lang]` altına `blog/` ve `blog/[slug]` ekleyecek, `localesForProject` deseninde bir `localesForPost` gerekecek.
- **`localesForProject`'in `[]` dalı ve sitemap'in "çevirisi yok" dalı test edilmiyor** (bugün her bilinen slug iki locale'de var). Faz 4 gövdeyi Velite'a bağlarken iki durumlu bir test eklemeli; `scripts/assert-static-routes.mjs`'in eşit sayı iddiası (`enDetail.length !== trDetail.length`) o anda per-slug karşılaştırmaya dönmek zorunda, ayrıca script `/en` ve `/tr`'yi `routing.ts`'ten türetmek yerine sabit yazıyor.
- **`tests/seo/locale-url.test.ts` env stub'ını temizlemiyor** (`vi.stubEnv` var, `afterEach(() => vi.unstubAllEnvs())` yok, `vitest.config.mts`'te `unstubEnvs` yok). Son test `NEXT_PUBLIC_SITE_URL`'i `""` bırakıyor; bugün başka test `process.env`'i çalışma anında okumadığı için zararsız.
- **Belge kayıtlarında eski metinler**: `docs/plans/handoffs/faz-1.md:173` eski 429 gövdesini, `faz-0.md:79,84` eski 400/500 gövdelerini yazıyor (geçmiş koşuların kaydı, değiştirilmedi); API metinleri artık `api` namespace'inden geliyor. README'de Faz 1'den kalan iki deploy bölümü ("Deployment" ve "Deploy") hâlâ birleştirilmedi.
- **Faz 0 ve Faz 1'den devralınıp hâlâ açık olanlar**: panel adımlarının hiçbiri (Coolify, Cloudflare, Traefik, Resend), `TRUST_CF_CONNECTING_IP` `false`, `.com -> .sh` onayı, Coolify health check (`coollabsio/coolify#7500`), `ADMIN_IPV4`/`ORIGIN_IPV4`, `GATUS_URL`, `npm audit` kararı, Renovate GitHub App, CSP nonce (Faz 5), `MAX_MESSAGE_LENGTH` ile `MAX_BODY_BYTES` ilişkisi, `theme-toggle.tsx`'in `resolvedTheme` okumaması (Faz 3), Tailwind 4.2 -> 4.3 güncellemesi (Faz 3). `AGENTS.md`/`CLAUDE.md` kararı bu fazda `.gitignore` ile kapatıldı (sapma 12), sahibinin itirazı varsa geri alınır.

## Üretilen arayüzler

Faz 3 ve sonrası bunlara güvenebilir.

| Yol | Rol |
| --- | --- |
| `src/i18n/routing.ts` | `routing` (`locales: ["en","tr"]`, `defaultLocale: "en"`, `localePrefix: "as-needed"`, `localeDetection: false`, `localeCookie: false`) ve `type AppLocale = "en" \| "tr"` |
| `src/i18n/request.ts` | `getRequestConfig`: `requestLocale`'i `hasLocale` ile doğrular, `messages/<locale>.json`'ı dinamik import eder; Route Handler'da `requestLocale` undefined, locale açıkça verilir |
| `src/i18n/navigation.ts` | `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` (`createNavigation(routing)`); `usePathname` prefix'siz iç yolu döner |
| `src/proxy.ts` | `createMiddleware(routing)`, matcher `/((?!api\|_next\|_vercel\|.*\\..*).*)`: `/api`, framework iç yolları ve nokta içeren her yol (favicon, robots, sitemap, statik dosya) proxy'ye girmez |
| `src/app/[lang]/layout.tsx` | Kök layout: `generateStaticParams`, `dynamicParams = false`, `generateMetadata` (`metadataBase`, title template, `buildOpenGraph(lang, "/")`), `setRequestLocale`, `<html lang={lang}>`, `NextIntlClientProvider`. Buradaki `openGraph`'ı yalnızca ana sayfa devralır |
| `src/app/[lang]/*/page.tsx` | Her sayfa: `generateStaticParams`, `hasLocale` kontrolü, `setRequestLocale(lang)`, `generateMetadata` içinde `openGraph: buildOpenGraph(lang, path, …)` ve `alternates: buildAlternates(lang, path[, localesForProject(slug)])` |
| `src/app/[lang]/not-found.tsx` | Locale içi `notFound()` sınırı (`notFound` namespace'i); bugün ulaşılmıyor, bkz. "Açık kalanlar" |
| `src/app/global-not-found.tsx` | Eşleşmeyen tüm yollar için kendi `<html>`'ini kuran 404 dokümanı, `globals.css`'i kendisi import eder, `experimental.globalNotFound: true` ile açık |
| `src/app/[lang]/opengraph-image.tsx` | `generateImageMetadata` per-locale `alt` üretir, boş params için `defaultLocale` fallback'i; `size`, `contentType`, `id` `og-image.ts`'ten; `runtime` export'u yok |
| `src/lib/seo/locale-url.ts` | `localePath(locale, pathname)`, `localeUrl(locale, pathname)`, `buildAlternates(locale, pathname, availableLocales?)` (canonical + `languages` + `x-default`), `buildOpenGraph(locale, pathname, { title, description, siteName, imageAlt })` (eksiksiz `openGraph` nesnesi, `images` dahil) |
| `src/lib/seo/og-image.ts` | `OG_IMAGE_ID`, `OG_IMAGE_SIZE`, `OG_IMAGE_CONTENT_TYPE`, `OG_IMAGE_PATH`; `opengraph-image.tsx` ile `buildOpenGraph` arasındaki tek kaynak |
| `src/lib/content/project-locales.ts` | `localesForProject(slug): AppLocale[]`; Faz 4'te gövdesi Velite lookup'ına dönecek seam, çağıranlar (`sitemap.ts`, `[slug]/page.tsx`) değişmez |
| `src/lib/site-config.ts` | `siteConfig.person` (`name`, `jobTitle` per locale, `location`, `sameAs`), `.local/content/portfolio-content.md` kaynaklı gerçek veri; Faz 4'te sayfa metinlerine de kaynaklık edecek |
| `src/components/seo/person-jsonld.tsx` | `PersonJsonLd({ locale })`, `<` kaçışlı JSON-LD script'i |
| `src/app/sitemap.ts`, `src/app/robots.ts` | İki locale, per-entry `alternates.languages`; `Disallow: /api/`, `host`, `sitemap` |
| `src/app/api/contact/route.ts` | İstek gövdesi `{ name, email, subject?, message, website?, locale? }`; `locale` `resolveLocale` ile `AppLocale`'e daraltılır, bilinmeyen değer `en`; hata metinleri `api` namespace'inden (`invalidRequest`, `tooManyRequests`, `emailNotConfigured`, `sendFailed`) |
| `messages/{en,tr}.json` | 152 anahtar, 12 namespace: `brand`, `nav`, `hero`, `home`, `footer`, `about`, `projects` (`items.<id>.title/description`), `contact`, `form`, `notFound`, `metadata`, `api`; iki dosya aynı küme |
| `scripts/assert-static-routes.mjs` | `npm run verify:routes`: manifest'te `/en`, `/tr` ve `about`/`projects`/`contact` çiftleri, en az bir proje detayı, iki locale'de eşit proje sayısı, hiç `/api` route'u; CI'da build'den sonra koşuyor |
| `tests/seo/page-metadata.test.ts` | Her sayfanın `generateMetadata`'sını iki locale'de çağırır: `og:url` = canonical, og başlık/açıklama = sayfanınki, locale'in kendi og görseli. `next-intl/server` `vi.mock` ile stub'lanır, mesajlar gerçek katalogdan okunur |
| `tests/i18n/app-shell.test.ts` | Kabuk sözleşmesi: proxy matcher davranışı, route dosyaları ve `setRequestLocale`, `metadataBase`, `next/link` yasağı, `LINK_USING_CONTENT_COMPONENTS` ve içerik bileşeni listeleri; yeni bileşen yazınca listeye eklenmeli |
| `next.config.ts` | `createNextIntlPlugin()` sarmalı, `experimental.globalNotFound: true`, `output: "standalone"` korunuyor |
| `vitest.config.mts` | `server.deps.inline: ["next-intl"]`; `@/i18n/navigation` importu testte çalışır |

## Sonraki faza (Faz 3, tasarım sistemi) uyarılar

- **`global-not-found.tsx` ayrı bir dokümandır.** `[lang]/layout.tsx`'e eklenecek her şey (`next/font/local` sınıfları, tema provider'ı, yeni token'lar, header/footer) 404 dokümanına otomatik gelmez; Faz 3 iki dosyayı birlikte düzenlemeli, aksi halde 404 sayfası eski fontla ve temasız kalır. `tests/i18n/app-shell.test.ts` dosyanın `globals.css`'i import ettiğini kilitliyor.
- **Yeni sayfa reçetesi**: `generateStaticParams` (`routing.locales`), `hasLocale` kontrolü + `notFound()`, `setRequestLocale(lang)` render'dan önce, `generateMetadata` içinde `buildAlternates` **ve** `buildOpenGraph`. İkincisi opsiyonel değil: `openGraph` döndürmeyen sayfa layout'un nesnesini olduğu gibi devralır ve ana sayfanın `og:url`'ünü gösterir, `tests/seo/page-metadata.test.ts` bunu yakalar ama yalnızca `PAGES` listesine eklenmiş sayfalar için. Birini unutan sayfa sessizce dinamik'e düşer; `npm run verify:routes` bunu CI'da yakalar ama yalnızca `required` listesindeki route'lar için, yeni bir route eklenince `scripts/assert-static-routes.mjs`'teki listeye de girmeli. `dynamicParams = false` olduğu için `generateStaticParams` dışındaki her param 404'tür.
- **Bileşenlerde `next/link` ve `next/navigation` yerine `@/i18n/navigation`.** `Link`'e açık `locale` prop'u vermek prefix'i zorlar (`/en/...`), dil değiştirici bu yüzden `getPathname` kullanıyor; mobil menü yazılırken `LanguageSwitcher` olduğu gibi yeniden kullanılmalı. Header'daki `isActive` karşılaştırmaları `usePathname`'in prefix'siz değeriyle çalışıyor (`/tr/about`'ta `pathname` `/about`).
- **Mesaj disiplini**: iki JSON aynı anahtar kümesini taşımak zorunda, `tests/i18n/app-shell.test.ts` yalnızca `notFound` namespace'ini kilitliyor; yeni metin eklerken ikisine birden yazın. Uzun/en çizgi kullanılmaz. Metin değerleri Faz 4'e kadar şablon, Faz 3 metin yazmaz.
- **`opengraph-image.tsx`'i yeniden yazarken** `generateImageMetadata`'nın boş params ile ilk çağrısını unutmayın (`hasLocale` fallback'i kalmalı), `runtime` export'u eklemeyin (edge kullanılmıyor), `metadataBase` layout'ta kalmalı. Görselin id'si, boyutu ve yolu `src/lib/seo/og-image.ts`'te; dosya adını veya id'yi değiştirirseniz sayfaların `og:image` URL'si oradan güncellenmeli, `tests/seo/page-metadata.test.ts` iki tarafın uyuştuğunu kilitliyor. Sayfa başına farklı görsel istenirse alt segmentlere kendi `opengraph-image.tsx`'i eklenir, o zaman `buildOpenGraph`'ın `images` alanı segment bazında override edilmeli.
- **`experimental.globalNotFound` bayrağı** Next minor güncellemesinde kararlı hale gelebilir veya ad değiştirebilir; `next` yükseltilirken `/nonexistent`'ın tam doküman döndüğü curl ile yeniden kontrol edilmeli.
- **Prettier kapsamı**: `tests/`, `scripts/`, `.github/`, kök markdown ve config dosyaları Prettier'a tabi, `docs/` değil. Commit'ten önce `npm run format` koşun; bu fazın düzeltme commit'lerinin tamamı bu kapıdan çıktı.
- **vitest'te next-intl inline.** `next-intl/server` importu olan modüller testte `vi.mock("next-intl/server")` istemeye devam ediyor (`route.test.ts` deseni); `@/i18n/navigation` ve `@/i18n/routing` doğrudan import edilebilir.
- **Docker ve build context**: `messages/` build context'te ve standalone çıktısına bundle'lanıyor (container'dan doğrulandı). `.dockerignore`'a `*.json` gibi bir desen eklemeyin; kök `*.md` kuralı `AGENTS.md`/`CLAUDE.md`'yi zaten dışarıda tutuyor. Faz 3'te `public/fonts/` eklenecekse `public` runner'a olduğu gibi kopyalanıyor, Dockerfile'a dokunmak gerekmez.
- **CI check adları değişmedi** (`lint, typecheck, test, build` ve `hadolint and image build`); `checks` job'ında artık altı `run` adımı var, `tests/deploy/ci-workflow.test.ts` `npm run verify:routes` satırını kilitliyor.
- **Faz 4 için seam'ler**: `localesForProject` (ve gelecek `localesForPost`), sitemap'in "çevirisi yoksa girdi yok" dalı, `verify:routes`'un per-slug karşılaştırmaya geçmesi, launch kapısı grep'inin `messages/` kapsaması, `siteConfig.person`'ın metinlere kaynaklık etmesi.

## Manuel adımlar

Kodla yapılamayan her şey `docs/plans/handoffs/faz-2-manual-checklist.md` içinde, sıra bağlayıcı: (1) dalı push edip PR açmak (yığın sırası ve rebase notu ile), diff'te yerel dosya olmadığını doğrulamak, (2) CI'da `verify:routes` dahil altı adımın geçtiğini görmek, (3) Coolify preview'da `/` ve `/tr`'nin farklı dilde açıldığını ve `/en` 307'sini doğrulamak (Faz 1 checklist bölüm 3-4 ön koşul), (4) preview URL üzerinde hreflang test aracı, (5) merge ve canlı doğrulama (`/`, `/tr`, `/en`, sitemap, robots, JSON-LD, contact TR hatası), (6) sahibinin kararını bekleyen maddeler (`.gitignore` kararı, sitemap `x-default`, og:image prefix'i, 429/413 metinleri, 404 locale'i, `npm run format` CI adımı, Faz 4'ten önce yayın), (7) Faz 0/1'den devralınan açık maddeler.

## Task başına model ve inceleme özeti

| Task | Model | Commit | Bloklayan bulgu | Düzeltme | Bloklamayan bulguların özü |
| --- | --- | --- | --- | --- | --- |
| 1 next-intl kurulumu | sonnet | `adfd07e` | yok | yok | `vitest.config.ts` yerine mevcut `.mts`; `routing.test.ts` echo testi (davranış testi entegrasyonda eklendi); `messages/` persona değerleri Faz 4 kapısına girmeli; `@parcel/watcher` lockfile'a girdi (runner'ı etkilemez); `routing.localePrefix` tipi `undefined` içeriyor |
| 2 app/[lang] ve proxy | opus | `55c855f` | 404'ler kabuksuz ve `lang`'siz | `67c6808` | Dil değiştirici `/en/...` 307 atlaması (entegrasyonda `97cb727`); EN og:image `/en/` prefix'i; sayfa metadata'sı Task 4'e kadar geçici düştü; `/api/health` de `ƒ`; `NEXT_LOCALE` grep'i yorumu yakalıyor; testler çoğunlukla kaynak grep'i |
| 3 içerik bileşenleri | sonnet | `12e7589` | `npm run format` kırmızı; test `contact-form.tsx`'te `useLocale`'i yasaklıyordu (Task 7 ile çelişki) | `7271a8a` | Step 12 grep'i "OK" basmıyor (yorum satırı); mesaj kapsaması ve hesaplanmış anahtarlar iki dilde tam; eski katman gerçekten gitti; `AGENTS.md`/`CLAUDE.md` untracked |
| 4 metadata, canonical, hreflang | sonnet | `926a4bd` | yok | yok | Alt sayfalarda `og:url`/`og:title` layout'tan miras (plan seçimi, düzeltme turunda bloklayan bulgu olarak geri geldi ve `2b10bd7` ile kapandı); `locale-url.test.ts` env stub temizliği; `project-locales.ts` testsiz; beşinci test `env.test.ts` ile çakışık; `/` canonical'ında sondaki `/` düşüyor (eşdeğer) |
| 5 sitemap ve robots | sonnet | `27bc6d5` | `npm run format` kırmızı | `a51b783` | Sitemap `x-default` yok, `<head>` var; `languagesFor` ile `buildAlternates` kopya; "çevirisi yok" dalı ölü; tek `lastModified`; `lastModified`/`changeFrequency`/`priority`/`host` test edilmiyor; `verify:routes` o an yoktu |
| 6 Person JSON-LD | haiku | `68c0d3e` | yok | yok | Plana birebir; veri `.local` kaynaklı, sır yok; görünen isim ile JSON-LD ismi Faz 4'e kadar uyuşmuyor; JSON-LD gövdesi için otomatik test yok; `127.0.0.1` ile standalone isteği 307 döner (host uyuşmazlığı, hata değil) |
| 7 contact locale | haiku | `eb52110` | `npm run format` kırmızı | `da59e3e` | 429 ve okunamayan gövde 400'ü İngilizce, 413 sabit; `route.test.ts` mock'u `locale`'i yok sayıyor; eski devir notlarındaki API metinleri eski; yorum yeri kozmetik |
| 8 statiklik denetimi | haiku | `d740b38` | `npm run format` kırmızı | `2e667e6` | Kriter 2 grep deseni route satırı yakalamıyor (entegrasyonda düzeltildi); `/api/health` de dinamik; Step 5 `example.com` beklentisi Faz 4'e ait; `verify:routes` CI'da değildi (entegrasyonda eklendi); README script tablosu eksikti (eklendi); script `/en`/`/tr`'yi sabit yazıyor ve sayı karşılaştırıyor |
| entegrasyon | fable | `26bf303`, `97cb727`, `72ab71a`, `1033563`, bu not | kapılar ve kriterler yeşil | yok | Bu notun "Açık kalanlar" bölümü |
| düzeltme turu | opus | `2b10bd7`, bu not | Alt sayfaların OpenGraph'ı ana sayfayı gösteriyordu | `2b10bd7` | Kısmi override `og:image`'i düşürüyordu, eksiksiz nesne ile kapatıldı; `og:type` detay sayfalarında `website` kaldı; `twitter` bloğu hâlâ yok |
