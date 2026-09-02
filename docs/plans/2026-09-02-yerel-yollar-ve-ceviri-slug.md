# Yerelleştirilmiş yollar ve çeviri başına slug Implementation Plan

> Durum: Revizyon 2 (2026-09-02), **uygulandı** (dal `feature/brand-assets`, 6 commit, taban `7a73af6`).
> Plan gövdesi yazıldığı haliyle duruyor; sahibinin kararları ve gerçekleşen sapmalar için aşağıdaki
> "Kararlar" ve "Uygulama sonucu" bölümleri önceliklidir.
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Türkçe tarafta bölüm ve detay yollarının tamamını Türkçeleştirmek (`/projeler/<slug>`, `/yazilar`, `/yazilar/<slug>`), İngilizce tarafı `/en/projects/...` ve `/en/blog/...` altında bırakmak, her çevirinin kendi diline ait bir slug'a sahip olmasını sağlamak ve eski adreslerin tamamını tek atlamalık 308 ile yeni kanonik adrese taşımak. hreflang, dil değiştirici, sitemap, feed, JSON-LD ve OG kartları çeviri eşlemesini slug üzerinden değil `translationKey` üzerinden kurar.

**Architecture:** `src/i18n/routing.ts` içindeki `pathnames` haritası dinamik segmentli yerelleştirilmiş şablonlarla genişler (`"/blog/[slug]": { tr: "/yazilar/[slug]", en: "/blog/[slug]" }`), OG görsel alt yolları da aynı haritaya girer, ve next-intl'in kendi `Link: rel=alternate` başlığı kapatılır. Velite şeması `translationKey` (zorunlu) ve `legacySlugs` (opsiyonel) alanlarını kazanır; `src/lib/content.ts` slug tabanlı çeviri eşlemesini bırakıp anahtar tabanlı yardımcılara geçer. `src/i18n/legacy-en-paths.ts` üç tabloya bölünür (öneksiz, `/en` önekli, `/tr` önekli) ve `src/proxy.ts` bu tabloları next-intl'den önce çalıştırmaya devam eder. SEO katmanı tek yol yerine dil başına yol taşıyan imzalara geçer.

**Tech Stack:** Next.js 16.x (App Router, `proxy.ts`, async `params`), React 19.2.x, next-intl 4.14.1, Velite 0.4.0, TypeScript 5.9, vitest (node), npm.

**Spec:**
- Sahibinin 2026-09-02 kararı (bu planın 1. bölümündeki URL matrisi)
- `docs/04-i18n.md` (URL stratejisi, V-5 "bilinçli kabul" paragrafı bu planla kapanıyor)
- `docs/05-backend-icerik-ve-servisler.md` (Velite içerik modeli, fallback yok politikası)
- `docs/07-seo-ve-metadata.md` (alternates, sitemap, JSON-LD, OG rotaları, V-5 kabulü)

---

## Kararlar (sahibi, 2026-09-02)

Plan yazıldıktan sonra site sahibi, "Açık sorular (sahibine)" bölümündeki
soruların tamamını cevapladı ve bir de plana hiç girmemiş altıncı projeyi
kapsama ekledi. Uygulama bu kararlara göre yapıldı; plan gövdesindeki
öneriler ile bu bölüm çeliştiğinde **bu bölüm geçerlidir**. Plan gövdesi
tarihsel kayıt olarak, yazıldığı haliyle duruyor.

1. **İngilizce yazı slug'ları.** `capt-sinavina-hazirlik` -> EN
   `capt-preparation-in-a-docker-lab`; `ccna-dan-web-guvenligine` -> EN
   `from-ccna-to-web-security`. Plandaki uzun öneri
   `what-ccna-changed-about-exposing-an-app` **kullanılmadı**; plandaki slug
   tablosu, 308 listesi ve curl matrisi buna göre uyarlandı.
2. **Türkçe Coolify yazısının slug'ı.** `coolify-ile-kendi-sunucumda`.
   Plandaki `coolify-ile-kendi-sunucumda-yayinda` **kullanılmadı**.
3. **Öneksiz eski detay adresleri slug diline göre yönlendirilir**
   (plandaki açık soru 3'ün "alternatif" sütunu):
   `/blog/capt-sinavina-hazirlik` -> `/yazilar/capt-sinavina-hazirlik` ve
   `/blog/ccna-dan-web-guvenligine` -> `/yazilar/ccna-dan-web-guvenligine`
   (308); `/blog/self-hosting-with-coolify` ->
   `/en/blog/self-hosting-with-coolify`; `/blog` -> `/en/blog`; tüm
   `/projects/<slug>` -> `/en/projects/<slug>`.
4. **Yazı bölüm yolu `/yazilar` onaylandı**; projeler `/projeler`.
5. **OG kartındaki `$ cat blog/<slug>.md` prompt satırı iç yol olarak
   kalır** (yerelleştirilmedi).
6. **Feed guid'i:** `isPermaLink="false"` +
   `tag:dogancanyildiz.com,2026:post/<locale>/<translationKey>`, tarih
   bileşeni kalıcı sabit (koda yorum olarak yazıldı).
7. **`legacySlugs` frontmatter alanı eklenir.**
8. **Altıncı proje: Köklü Hukuk.** `content/projects/{tr,en}/koklu-hukuk.mdx`
   2026-09-02'de eklendi. Marka adı olduğu için iki dilde aynı slug,
   `translationKey: koklu-hukuk`. Plandaki tüm tablolara ve curl matrisine
   satırları eklendi: `/projects/koklu-hukuk` -> `/en/projects/koklu-hukuk`
   (308), `/tr/projects/koklu-hukuk` -> `/projeler/koklu-hukuk` (308),
   `/projeler/koklu-hukuk` 200, `/en/projects/koklu-hukuk` 200, OG kartları
   200. `verify:routes` dil başına **6 proje + 3 yazı** bildirmeli (plan
   metnindeki "5 proje" sayımı bu kararla geçersiz).
9. **Dokümanlardaki bayat sayımlar da düzeltilir:**
   `docs/launch-checklist.md` proje ve route sayıları, `docs/07`'nin
   "Toplam 24 URL" satırı, build sonrası `sitemap.xml`'deki gerçek sayıya
   (30 URL: 6 statik x 2 + 6 proje x 2 + 3 yazı x 2).
10. **Planın diğer tüm tavsiyeleri aynen uygulanır:** `alternateLinks: false`,
    `useParams` tabanlı dil değiştirici, `PageRoute`, `getPostLocalesByKey`
    adlandırması, dört velite `prepare` kuralı.

---

## Uygulama sonucu (2026-09-02)

Dal `feature/brand-assets`, taban `7a73af6`. Altı commit, tek yazar, push
yok. Doğrulama komutları ve curl matrisi çıktısı için devir notu:
[handoffs/yerel-yollar-2026-09-02.md](handoffs/yerel-yollar-2026-09-02.md).

| Task | Commit | Konu |
|---|---|---|
| 1 | `313bbf2` | `feat(content): key every translation by translationKey and localize the Turkish slugs` |
| 2 | `98b3f3e` | `feat(i18n): serve the Turkish blog and project paths in Turkish and 308 every old address` |
| 3 | `cd65d1c` | `feat(seo): build canonical, hreflang, sitemap and feed urls from per locale slugs` |
| 4 | `7aea3f6` | `refactor(i18n): point the language switcher at per locale translation targets` |
| 5 | `c97e62d` | `docs: record the localized path scheme and close the V-5 acceptance` |
| 5 (inceleme düzeltmesi) | `99b6c3d` | `fix(docs): describe the per slug language redirect rule the code applies` |

### Plandan sapmalar

Plan kodu okuyarak yazıldı ama beş yerde gerçek dosyayla çelişti; her
seferinde gerçek dosya kazandı.

**Yönlendirme ve dosya gerçekliği**

- Plan 1.3/1.4 `/projeler/<slug>`'in bugün canlı olduğunu varsayıyordu.
  Gerçekte `pathnames["/projects/[slug]"]` düz string `"/projects/[slug]"`
  idi, yani TR proje detay kanoniği `/projects/<slug>` idi ve
  `/projeler/<slug>` 404 veriyordu. Karar 3 ile birlikte bu, o an canlı olan
  Türkçe detay adreslerinin `/en`'e gönderilmesi demek. Planın
  `/projeler/gpa-calculator` ve `/projeler/ticket-purchasing-system`
  satırları yine de tabloda tutuldu: `dynamicParams = false` altında bu iki
  adres aksi halde 404 olurdu.
- Plan 3.3'ün geriye dönük invariant'ı ("her eski şekil tabloda anahtar
  olmalı") öneksiz tablo için harfiyen (anahtar var, hangi dile cevap
  verdiğine bakılmaz), önekli tablolar için katı (hedef, o kaydın kendi
  kanoniğine eşit olmalı) uygulandı. Daha katı bir öneksiz biçim karar 3 ile
  çelişirdi.
- `SECTION_TEMPLATE` Task 2'de `navigation.ts`'ten export edildi ama tek
  tüketicisi Task 4'ün dil değiştiricisi; Task 2 ile Task 4 arasında
  kasıtlı olarak kullanılmadan durdu.

**İçerik modeli**

- Karar 8'in altıncı projesi `koklu-hukuk` Task 1 başlamadan önce zaten
  ağaçtaydı; yalnızca iki dosyaya `translationKey: koklu-hukuk` eklendi,
  yeni içerik yazılmadı.
- Plan "kalan 11 MDX dosyası" diyordu; gerçek içerik ağacında 18 dosya var
  (13 yalnız `translationKey`, 5 yeniden adlandırma). Fark, planın
  gövdesindeki sayının `koklu-hukuk`'u ve `self-hosting-with-coolify`'ın EN
  dosyasını atlamasından geliyor; planın kendi dosya listesi doğru.
- `velite.config.ts`'in inline `prepare` callback'i `prepareContent` olarak
  export edildi (planda yok), çünkü fixture config'in aynı prepare
  invariant'larını fixture içeriğine karşı çalıştırması gerekiyor. Üç yeni
  prepare kuralı (tekrarlı `translationKey`, canlı slug'ı gölgeleyen
  `legacySlugs`, kendine referans veren `legacySlugs`) üç ayrı fixture yerine
  tek fixture'da toplandı; `prepare()` zaten tüm ihlalleri toplayıp bir kerede
  fırlatıyor.

**SEO yüzeyleri**

- `contentUrlsByKey` planın anlattığı `(kind, key)` yerine `(kind, slugs)`
  imzasıyla yazıldı, böylece `buildPageMetadata` elindeki `route.slugs`'ı
  ikinci bir arama yapmadan geçirebiliyor; planın "tek fonksiyon iki çağrı
  yerinde" niyeti korundu.
- Task 1'de `tests/seo/sitemap.test.ts`'teki iki iddia, `buildLanguageAlternates`
  henüz dil başına slug taşımadığı için bilinçli bir ara durumu (çapraz dil
  alternate'inin yanlış slug taşıması) sabitledi ve yorumla işaretledi;
  Task 3 bu iki testi doğru davranışa çevirdi.

**Dil değiştirici**

- `buildTranslationMap` aktif dilin kendi kaydını da içeriyor. Plan 4.4'ün
  örnek yükü yalnızca diğer dilleri gösteriyordu; 4.3'ün switcher gövdesiyle
  birleşince bu, aktif dilin kendi düğmesini her detay sayfasında bölüm
  köküne gönderirdi, yani bugünkü davranışa göre gerileme. Ölçülen maliyet
  1198 bayt (tr) / 1129 bayt (en), 4 KB tripwire'ının çok altında.
- Switcher prop tipini `@/lib/content`'ten `TranslationMap` import etmek
  yerine yapısal olarak tanımlıyor (mevcut `HeaderProps` gerekçesi: içerik
  katmanını client sınırının ötesine taşıma).

**Test kırılmaları (plan 6.1'in kırılma haritasında olmayanlar)**

- `tests/seo/page-metadata.test.ts`: proje test vakaları tek seferde
  `getProjectSlugs("en")`'den üretilip iki dilde paylaşılıyordu, yani her
  projenin iki dilde aynı slug'a sahip olduğunu sessizce varsayıyordu. İki
  Türkçe proje yeniden adlandırılınca Türkçe vaka `notFound()`'a düştü;
  vakalar dil başına üretilecek şekilde düzeltildi.
- `tests/content-layer.test.ts`: içerikleri diller arasında `slug` ile
  eşleştiriyordu; `translationKey` ile eşleştirmeye çevrildi.
- `tests/fixtures/velite.invalid-links.config.ts` ve
  `velite.schema-fields.config.ts` gerçek `collections` export'unu yeniden
  kullandığı için yeni zorunlu `translationKey` alanı 4 fixture MDX dosyasını
  kırdı; alan eklendi.
- `/blog` -> `/yazilar` bölüm kökü değişimi Task 2'de beş iddiayı kırdı
  (`tests/seo/sitemap.test.ts`, `tests/seo/alternates.test.ts`,
  `tests/seo/jsonld.test.ts`, `src/components/status/status-screen.test.ts`,
  `src/app/global-not-found.test.tsx`). Plan bunları Task 3/5'e atamıştı ama
  kapı yeşil olmadan task kapanamayacağı için her birine yalnızca yol
  beklentisi düzeltmesi yapıldı.
- `tests/scripts/assert-static-routes.test.ts`'in `dynamic` dışlama listesine
  iki yeni OG şablonu eklendi.
- `tests/perf/client-payload.test.ts` Task 4'te kırıldı (kaldırılan
  `.filter((locale) => locale !== lang)` satırını iddia ediyordu); planın
  4.5'te istediği payload bütçesi testiyle değiştirildi.
- `tests/i18n/app-shell.test.ts:236` literal `pathnameForLocale(locale, target)`
  iddiasını `pathnameForLocale(locale,` olarak daralttı.

**Dokümanlar**

- Karar 9 `docs/04-i18n.md` ve `docs/10-yol-haritasi.md`'de "26 URL" dizesini
  düzeltmeyi istiyor, ama o dize iki dosyada da yok. En yakın eşleşmeler
  ("26 içerik route", "26 route", "20 content routes") tarihli geçmiş durum
  kayıtlarının içinde geçiyor, yani yaşayan iddia değil; tarihsel kayıt
  olarak bırakıldı. Bunun yerine `04-i18n.md`'deki güncel V-5 paragrafı,
  `docs/07`'nin "Toplam 24 URL" satırı (-> 30) ve `docs/launch-checklist.md`
  sayımları düzeltildi.
- `docs/launch-checklist.md`'de karar 9'un literal hedeflerinin ötesine
  geçildi: "32 içerik route" -> 41 (`verify:routes`'un gerçek çıktısı),
  Türkçe kanonik için kalan `/blog/<slug>` satırları `/yazilar/<tr-slug>`
  yapıldı, 308 checklist satırına `/blog -> /en/blog` ve
  `/blog/<eski-slug> -> /en/blog/<en-slug>` eklendi.
- `docs/07-seo-ve-metadata.md`'de silinen `ogImagePathFor` adı `ogImageHref`
  olarak düzeltildi ve feed guid kararı tarihli madde olarak yazıldı;
  `docs/05-backend-icerik-ve-servisler.md`'ye `translationKey`/`legacySlugs`
  alanlarını ve altıncı projeyi anlatan tarihli alt bölüm eklendi.
- Task 5'in bağımsız incelemesi iki bloklayan bulgu çıkardı ve `99b6c3d` ile
  kapandı: dört dokümanda uygulanan 308 kuralının tersi ("öneksiz eski
  adreslerin tamamı `/en`'e gider") yazıyordu, ve URL matrisi repoda var
  olmayan bir plan dosyasına havale edilmişti. Bu plan dosyasının repoya
  kopyalanması ikinci bulgunun kalıcı çözümü.

---

## 0. Revizyon: bu sürümde ne değişti

Revizyon 1'in beş engeli giderildi. Hepsi `node_modules` kaynağından ve repo dosyalarından yeniden doğrulandı; uydurma API yok.

| # | Engel | Bu sürümdeki karşılığı |
|---|---|---|
| R-1 | next-intl'in `alternateLinks` başlığı, yerelleştirilmiş şablonlar eklendiği anda yanlış hreflang yayınlar | `defineRouting`'e `alternateLinks: false` eklendi (3.1), gerekçesi routing.ts yorumuna ve `docs/04`'e girdi, `tests/config/proxy.test.ts` "Link başlığı yok" iddiasını kilitliyor, curl matrisine `grep -i '^link:'` satırı eklendi |
| R-2 | `usePathname()` sunucu render'ında şablon değil somut yol döndürüyor; dil değiştirici prerender HTML'ine 404 href basar | 4. bölüm tamamen yeniden yazıldı: switcher artık `usePathname()` şekline hiç bağlı değil, `useParams()` + bölüm segmenti üzerinden çalışıyor; Task 4 testlerine sunucu şekli senaryosu ve "sunucu ile istemci aynı href'i üretir" iddiası girdi |
| R-3 | Task 3'ün dosya listesi `buildPageMetadata` / `buildOpenGraph` çağıranların çoğunu atlıyor ve Task 4 ile `layout.tsx` üzerinde çakışıyor | Task 3'ün listesine beş sayfa, `layout.tsx` ve üç test dosyası eklendi; "Task 3 ve Task 4 paralel" iddiası kaldırıldı, sıra zorunlu hale geldi (6. bölüm) |
| R-4 | `getPostLocales` / `getProjectLocales` anlamı değişiyor ama imzası aynı; derleyici çağrı yerlerini yakalamaz | `getPostLocalesByKey` / `getProjectLocalesByKey` olarak yeniden adlandırıldı (2.4), böylece Task 1 biter bitmez `tsc` her çağrı yerini işaret ediyor |
| R-5 | Task 1 kendi kapısından geçemiyor: yeniden adlandırmalar listede olmayan test dosyalarını kırıyor | Task 1'in dosya listesine, gerçekten kırılan iki test dosyası eklendi ve adımlara "slug'a bağlı beklentileri taşı" maddesi kondu (5. bölüm gerekçe, 6.1'de düzeltilmiş kırılma haritası) |

Ayrıca işlenen öneriler: `assert-static-routes.mjs` yorum satırı ve testi (Task 2), `/projects/hubit` testinin bilinçli tersine dönüşü (Task 2 adımları), 1.5'teki genişletilmiş "yönlendirilmeyenler" listesi, `docs/07` 24 -> 28 URL sayımı düzeltmesi (Task 5), feed guid tarih bileşeninin sabit sözleşme olarak kilitlenmesi (5.4), `buildTranslationMap` payload'ı için kayda geçen alternatif (4.5), dördüncü velite kuralı (2.2), açık soru 3 ve 5 için tavsiye.

Revizyon 1'in incelemesinde fazla genel tutulan iki nokta düzeltildi, çünkü uygulayıcı ajanın kırılma haritasının doğru olması gerekiyor:

- `tests/config/proxy.test.ts`, `tests/seo/alternates.test.ts` ve `src/components/layout/language-switcher.test.tsx` **Task 1'de kırılmaz**. Üçü de sabit string girdileriyle çalışan saf fonksiyon veya mock testi; gerçek Velite verisini okumuyorlar. Kırıldıkları yerler sırasıyla Task 2, Task 3 ve Task 4.
- Task 1'de gerçekten kırılan iki dosya `tests/seo/sitemap.test.ts` ve `tests/seo/page-metadata.test.ts`; ikisi de `getPostSlugs` / `getProjectSlugs` üzerinden gerçek içeriği okuyor ve slug'ları sabit string olarak iddia ediyor.

---

## 1. Hedef ve karar özeti

### 1.1 Kararlar

1. **Türkçe tarafta yolların tamamı Türkçe.** `/projeler`, `/projeler/<tr-slug>`, `/yazilar`, `/yazilar/<tr-slug>`. Dosya sistemi rotaları İngilizce kalır (`src/app/[lang]/blog/[slug]/page.tsx`); yerelleştirme yalnızca `pathnames` haritasında yaşar ve rewrite ile çözülür.
2. **İngilizce taraf `/en` altında ve İngilizce.** `/en/projects`, `/en/projects/<en-slug>`, `/en/blog`, `/en/blog/<en-slug>`.
3. **Her çevirinin kendi slug'ı var.** Eşleme `slug` üzerinden değil, frontmatter'daki `translationKey` üzerinden kurulur. Marka adı taşıyan projelerde iki dilde aynı slug kalır; bu bir istisna değil, aynı mekanizmanın aynı değeri üretmesidir.
4. **Eski öneksiz `/blog`, `/blog/<slug>`, `/projects/<slug>` adresleri `/en` karşılıklarına 308 gider.** Bunlar 30 Ağustos öncesinde İngilizce adreslerdi. `docs/04-i18n.md` içindeki V-5 "bilinçli kabul" paragrafı bu kararla geçersizleşir ve silinir. (Alternatif bir kural için açık soru 3'e bak.)
5. **`/tr/...` kalıntıları Türkçe kanoniğe 308 gider.** Mevcut `unprefixedTurkishPath` davranışı korunur, içerik yolları için tabloya satır eklenir.
6. **Çevirisi olmayan içerik politikası değişmez.** Bir `translationKey` yalnızca bir dilde varsa diğer dilde sayfa üretilmez, sitemap'e ve `hreflang` kümesine girmez, dil değiştirici bölüm köküne düşer.
7. **hreflang'in tek kaynağı HTML `<head>`.** next-intl'in HTTP `Link: rel=alternate` başlığı kapatılır (R-1, 3.1).
8. **Yazı sayısı artmaz.** Bu iş yalnızca yolları ve slug'ları değiştirir; yeni içerik yazılmaz.

### 1.2 Slug tablosu (öneri, sahibi değiştirebilir)

`translationKey` bugünkü ortak slug'tır; bu, mevcut tüm eşlemelerin davranışını koruyan tek değerdir.

| Tür | translationKey | TR slug | EN slug | Değişen taraf |
|---|---|---|---|---|
| post | `self-hosting-with-coolify` | `coolify-ile-kendi-sunucumda-yayinda` | `self-hosting-with-coolify` | TR |
| post | `capt-sinavina-hazirlik` | `capt-sinavina-hazirlik` | `capt-preparation-in-a-docker-lab` | EN |
| post | `ccna-dan-web-guvenligine` | `ccna-dan-web-guvenligine` | `what-ccna-changed-about-exposing-an-app` | EN |
| project | `cargo-pilot` | `cargo-pilot` | `cargo-pilot` | yok (marka) |
| project | `hubit` | `hubit` | `hubit` | yok (marka) |
| project | `wikonya` | `wikonya` | `wikonya` | yok (marka) |
| project | `gpa-calculator` | `not-ortalamasi-hesaplayici` | `gpa-calculator` | TR |
| project | `ticket-purchasing-system` | `bilet-satin-alma-sistemi` | `ticket-purchasing-system` | TR |

Gerekçeler:

- İki Türkçe yazı slug'ı (`capt-sinavina-hazirlik`, `ccna-dan-web-guvenligine`) zaten Türkçe ve zaten canlı Türkçe adres; değiştirmek bedava değil, kazancı yok. Yalnızca bölüm yolu değişiyor.
- İngilizce yazı slug'ları başlıktan türetildi. Sahibinin brief'inde geçen `preparing-for-the-capt-exam` / `from-ccna-to-web-security` alternatifleri açık soru 1'de duruyor.
- `self-hosting-with-coolify` İngilizce tarafta korunuyor: kurulu adres, değiştirmenin karşılığı yok. Türkçe tarafta başlıktan türedi.
- Slug deseni `^[a-z0-9]+(?:-[a-z0-9]+)*$` (`velite.config.ts:8`, `SLUG_PATTERN`). Türkçe slug'larda noktalı/noktasız i sorunu doğmaması için "yayında" -> `yayinda`, "ortalaması" -> `ortalamasi` şeklinde ASCII karşılığı yazıldı.

### 1.3 URL matrisi (eski -> yeni)

Kısaltmalar: A dönemi = 30 Ağustos 2026 öncesi (EN varsayılan, kökte), B dönemi = 30 Ağustos 2026 sonrası bugünkü hal (TR varsayılan, kökte).

| Yüzey | TR eski (B) | TR yeni | EN eski (B) | EN yeni |
|---|---|---|---|---|
| Yazı listesi | `/blog` | `/yazilar` | `/en/blog` | `/en/blog` (değişmez) |
| Yazı detayı | `/blog/<ortak-slug>` | `/yazilar/<tr-slug>` | `/en/blog/<ortak-slug>` | `/en/blog/<en-slug>` |
| Yazı OG kartı | `/blog/<slug>/opengraph-image/default` | `/yazilar/<tr-slug>/opengraph-image/default` | `/en/blog/<slug>/opengraph-image/default` | `/en/blog/<en-slug>/opengraph-image/default` |
| Proje listesi | `/projeler` | `/projeler` (değişmez) | `/en/projects` | `/en/projects` (değişmez) |
| Proje detayı | `/projeler/<ortak-slug>` | `/projeler/<tr-slug>` | `/en/projects/<ortak-slug>` | `/en/projects/<en-slug>` |
| Proje OG kartı | `/projeler/<slug>/opengraph-image/default` | `/projeler/<tr-slug>/opengraph-image/default` | `/en/projects/<slug>/opengraph-image/default` | `/en/projects/<en-slug>/opengraph-image/default` |
| Feed | `/feed.xml` | `/feed.xml` (değişmez) | `/en/feed.xml` | `/en/feed.xml` (değişmez) |
| Kimlik OG kartı | `/opengraph-image/default` | değişmez | `/en/opengraph-image/default` | değişmez |

Dikkat: `/projeler/<ortak-slug>` bugün canlı. `gpa-calculator` ve `ticket-purchasing-system` için bu adres değişiyor, diğer üç projede değişmiyor.

### 1.4 308 tablosu (tam liste)

Dört sınıf var. Anahtarlar sondaki eğik çizgi kırpıldıktan sonra eşlenir (mevcut `withoutTrailingSlash` davranışı korunur).

**A. Öneksiz eski adresler (A döneminde İngilizceydi) -> `/en/...`**

| Eski | Yeni |
|---|---|
| `/about` | `/en/about` (mevcut) |
| `/projects` | `/en/projects` (mevcut) |
| `/contact` | `/en/contact` (mevcut) |
| `/privacy` | `/en/privacy` (mevcut) |
| `/blog` | `/en/blog` (**yeni**, V-5 kabulünü kapatır) |
| `/blog/self-hosting-with-coolify` | `/en/blog/self-hosting-with-coolify` |
| `/blog/capt-sinavina-hazirlik` | `/en/blog/capt-preparation-in-a-docker-lab` |
| `/blog/ccna-dan-web-guvenligine` | `/en/blog/what-ccna-changed-about-exposing-an-app` |
| `/projects/cargo-pilot` | `/en/projects/cargo-pilot` |
| `/projects/hubit` | `/en/projects/hubit` |
| `/projects/wikonya` | `/en/projects/wikonya` |
| `/projects/gpa-calculator` | `/en/projects/gpa-calculator` |
| `/projects/ticket-purchasing-system` | `/en/projects/ticket-purchasing-system` |

**B. `/en` önekli eski slug'lar -> yeni EN slug**

| Eski | Yeni |
|---|---|
| `/en/blog/capt-sinavina-hazirlik` | `/en/blog/capt-preparation-in-a-docker-lab` |
| `/en/blog/ccna-dan-web-guvenligine` | `/en/blog/what-ccna-changed-about-exposing-an-app` |

**C. Öneksiz Türkçe eski slug'lar (B dönemi TR kanonikleri) -> yeni TR yolu**

| Eski | Yeni |
|---|---|
| `/projeler/gpa-calculator` | `/projeler/not-ortalamasi-hesaplayici` |
| `/projeler/ticket-purchasing-system` | `/projeler/bilet-satin-alma-sistemi` |

**D. `/tr` önekli kalıntılar -> Türkçe kanonik** (anahtar, `/tr` soyulduktan sonraki kalan)

| Kalan | Yeni |
|---|---|
| `/` | `/` (mevcut) |
| `/about` | `/hakkimda` (mevcut) |
| `/projects` | `/projeler` (mevcut) |
| `/contact` | `/iletisim` (mevcut) |
| `/privacy` | `/gizlilik` (mevcut) |
| `/blog` | `/yazilar` (**yeni**) |
| `/blog/self-hosting-with-coolify` | `/yazilar/coolify-ile-kendi-sunucumda-yayinda` |
| `/blog/capt-sinavina-hazirlik` | `/yazilar/capt-sinavina-hazirlik` |
| `/blog/ccna-dan-web-guvenligine` | `/yazilar/ccna-dan-web-guvenligine` |
| `/yazilar/self-hosting-with-coolify` | `/yazilar/coolify-ile-kendi-sunucumda-yayinda` |
| `/projects/cargo-pilot` | `/projeler/cargo-pilot` |
| `/projects/hubit` | `/projeler/hubit` |
| `/projects/wikonya` | `/projeler/wikonya` |
| `/projects/gpa-calculator` | `/projeler/not-ortalamasi-hesaplayici` |
| `/projects/ticket-purchasing-system` | `/projeler/bilet-satin-alma-sistemi` |
| `/projeler/gpa-calculator` | `/projeler/not-ortalamasi-hesaplayici` |
| `/projeler/ticket-purchasing-system` | `/projeler/bilet-satin-alma-sistemi` |

`/tr/yazilar` ve `/tr/projeler/<yeni-slug>` gibi kalanlar tabloda yok: `LEGACY_TR_PREFIXED[kalan] ?? kalan` kuralı bunları olduğu gibi geri verir, sonuç doğru kanonik.

`/tr` dalının kendi tam tablosuna sahip olması zorunlu: `/tr/projects/gpa-calculator` yalnızca `/tr` soyulup öneksiz tabloya düşseydi `/en/projects/gpa-calculator`'a giderdi, yani Türkçe bir adres İngilizce sayfaya. Bu, 3.3'teki dördüncü invariant testiyle kilitleniyor.

### 1.5 Yönlendirilmeyenler (bilinçli kabul)

1. **OG görsel alt yolları** (`/blog/<eski>/opengraph-image/default`). Yalnızca crawler ve paylaşım önizlemesi okur, sıralama taşımaz, kart yeniden çizilir. Tabloyu üç katına çıkarmanın karşılığı yok.
2. **Zaten kanonik olan adresler**: `/en/blog`, `/en/projects`, `/en/projects/<değişmeyen-slug>`, `/projeler/<değişmeyen-slug>`. Tabloya girerlerse kanonik sayfa kendi adresinden sürülür.
3. **Öneksiz + yeni EN slug** (`/blog/capt-preparation-in-a-docker-lab`). Tabloda yok, next-intl'e düşer. Kaynaktan doğrulanan sonuç: `getInternalTemplate` TR şablonunu (`/yazilar/[slug]`) deneyip eşleştiremez, EN şablonunu eşleştirir, geçerli dil `tr` olduğu için `formatTemplatePathname` ile `/yazilar/capt-preparation-in-a-docker-lab` üretilir ve 307 verilir; o adres 404. Hiç yayınlanmamış bir adres, kabul.
4. **Öneksiz + yeni TR slug** (`/projects/not-ortalamasi-hesaplayici`, `/blog/coolify-ile-kendi-sunucumda-yayinda`). Aynı zincir çalışır ve 307 ile `/projeler/not-ortalamasi-hesaplayici` (veya `/yazilar/coolify-...`) üretir, bu adresler **var**, yani 307 sonrası 200. Yine hiç yayınlanmamış adresler, düzeltilmesi gerekmiyor; not olarak kayda geçiyor ki ileride biri bunu hata sanmasın.
5. **`/en/yazilar/x` gibi karışık adresler.** next-intl 307 ile `/en/blog/x`'e taşır, tabloya girmezler.

---

## 2. Veri modeli

### 2.1 MDX frontmatter

İki koleksiyona da iki alan ekleniyor:

```yaml
translationKey: self-hosting-with-coolify   # zorunlu, slug deseni
legacySlugs:                                # opsiyonel, varsayılan []
  - self-hosting-with-coolify
```

- `translationKey`: bir içeriğin dilden bağımsız kimliği. Bugünkü ortak slug değeri buraya yazılır, yani hiçbir eşleme kopmaz.
- `legacySlugs`: bu dosyanın bu dilde daha önce yayınlandığı slug'lar. Yalnızca slug değişen beş dosyada dolu olacak. Amacı, yönlendirme tablosunun neden var olduğunu içeriğin yanında tutmak ve tablonun testle doğrulanmasını sağlamak.
- `slug` alanı ve "dosya adı = slug" kuralı korunur.

### 2.2 Velite şeması (`velite.config.ts`)

```ts
const TRANSLATION_KEY_PATTERN = SLUG_PATTERN;

// iki koleksiyonun schema objesine:
translationKey: s.string().regex(TRANSLATION_KEY_PATTERN),
legacySlugs: s.array(s.string().regex(SLUG_PATTERN)).default([]),
```

`prepare` içindeki doğrulama dört kurala çıkar (mevcut `findDuplicateLocaleSlugPairs` korunur, üçü eklenir):

1. `(locale, slug)` çifti benzersiz (mevcut, `velite.config.ts:158`).
2. `(locale, translationKey)` çifti benzersiz: bir `translationKey` bir dilde en çok bir kez görünebilir. İki Türkçe dosyanın aynı anahtarı taşıması, dil değiştiricinin hangisine gideceğini belirsiz bırakır.
3. `legacySlugs` içindeki hiçbir değer, aynı koleksiyonun aynı dilindeki **yaşayan** bir `slug` ile çakışamaz. Çakışırsa yönlendirme canlı bir sayfayı gölgeler.
4. Bir girdinin `legacySlugs`'ı kendi `slug`'ını içeremez. Kural 3 bunu teknik olarak zaten yakalar ama hata mesajı "canlı sayfayı gölgeliyor" der; asıl sebep neredeyse her zaman kopyala yapıştır hatasıdır, ayrı ve doğru mesaj teşhisi hızlandırır.

Dördü de `throw new Error(...)` ile build'i düşürür; `npm run build:content` ve `npm run build` bu yüzden kapı görevi görür.

Çevirisi olmayan içerik politikası **değişmiyor**: şema, bir `translationKey`'in her iki dilde de bulunmasını istemiyor.

### 2.3 `src/lib/content.ts` yeni yüzey

Mevcut slug tabanlı yardımcılar korunur (`getPost`, `getProject`, `getPostSlugs`, `getProjectSlugs`: hepsi hâlâ "bu dildeki slug" ile çalışır ve `generateStaticParams` bunları kullanmaya devam eder). Anahtar tabanlı katman eklenir, slug tabanlı çeviri eşlemesi silinir.

```ts
export type ContentKind = "post" | "project";

/** Bir dildeki, bu anahtara sahip içerik. */
export function getPostByKey(locale: Locale, key: string): Post | undefined;
export function getProjectByKey(locale: Locale, key: string): Project | undefined;

/** Anahtarın gerçekten var olduğu diller. Draft filtresi aynen uygulanır. */
export function getPostLocalesByKey(key: string): Locale[];
export function getProjectLocalesByKey(key: string): Locale[];

/** Anahtarın dil başına slug'ı; çevirisi olmayan dil haritada yok. */
export function postSlugsByKey(key: string): Partial<Record<Locale, string>>;
export function projectSlugsByKey(key: string): Partial<Record<Locale, string>>;
export function slugsByKey(kind: ContentKind, key: string): Partial<Record<Locale, string>>;
```

`getUntranslatedPaths(locale)` **Task 4'te** silinir (Task 1'de değil, bkz. 6.1). Yerini `buildTranslationMap` alıyor; o da `contentHref`'e bağlı olduğu için Task 2'den önce yazılamaz.

`toPostCardData` / `toProjectCardData` DTO'larına `translationKey` eklenmez: liste kartları kendi dilinin slug'ıyla link kurar, anahtara ihtiyaç duymaz.

### 2.4 Tip imzaları özeti

| Sembol | Eski | Yeni | Hangi task |
|---|---|---|---|
| `getPostLocales` | `(slug: string) => Locale[]` | **`getPostLocalesByKey(key: string) => Locale[]`** | 1 |
| `getProjectLocales` | `(slug: string) => Locale[]` | **`getProjectLocalesByKey(key: string) => Locale[]`** | 1 |
| `getUntranslatedPaths` | `(locale: Locale) => string[]` | silindi | 4 |
| `buildTranslationMap` | yok | `(locale: Locale) => TranslationMap` | 4 |
| `buildLanguageAlternates` | `(path, availableLocales, currentLocale?) => Record<string,string>` | `(urlsByLocale: Partial<Record<Locale,string>>) => Record<string,string>` | 3 |
| `buildAlternates` | `(locale, path, availableLocales, rssTitle?)` | `(locale, canonical: string, urlsByLocale, rssTitle?)` | 3 |
| `buildOpenGraph` | `(locale, path, content)` | `(locale, { url, imageUrl }, content)` | 3 |
| `buildPageMetadata` | `(locale, path, options)` | `(locale, route: PageRoute, options)` | 3 |
| `ogImagePathFor` | `(pagePath) => string` | silindi; yerine `ogImageHref(locale, kind, slug)`, `OG_IMAGE_PATH` sabiti kalır | 2 (ekleme) / 3 (silme) |
| `ShareCard` props | `{ locale, path, title }` | `{ locale, kind, slug, title }` | 3 |
| `LanguageSwitcher` props | `{ untranslated: Record<string,string[]> }` | `{ translations: TranslationMap }` | 4 |

Yeniden adlandırma (R-4) kasıtlı: `getPostLocales`'in anlamı slug'tan anahtara kayıyor ama imzası `(string) => Locale[]` olarak aynı kalıyordu. Beş içerikten üçünde slug ile anahtar eşit olduğu için unutulan bir çağrı yeri testte yeşil kalır ve yalnızca `gpa-calculator` ile `ticket-purchasing-system` sessizce tek dilli bir hreflang kümesi üretirdi. Ad değişince Task 1 biter bitmez `tsc` üç çağrı yerini (`src/app/sitemap.ts:62,75`, `src/app/[lang]/blog/[slug]/page.tsx:52`, `src/app/[lang]/projects/[slug]/page.tsx:50`) işaret eder.

`PageRoute`:

```ts
export type PageRoute =
  | { kind: "static"; path: StaticPathname }        // "/", "/about", "/blog", "/projects", "/coming-soon", "/updating"
  | { kind: "content"; content: ContentKind; slugs: Partial<Record<Locale, string>> };
```

Statik yol dalı bugünkü davranışın aynısı (`localePath` her dil için aynı iç yolu derler) ve `/coming-soon` ile `/updating` de bu daldan geçer (`src/components/status/status-route-content.tsx:32`). İçerik dalı, canonical'ı `slugs[currentLocale]`'den, `languages`'ı haritanın tamamından kurar ve OG kart yolunu kendi hesaplar; bu, iki detay sayfasındaki `imagePath: ogImagePathFor(...)` tekrarını siler.

---

## 3. Yönlendirme

### 3.1 `src/i18n/routing.ts`

```ts
export const pathnames = {
  "/": "/",
  "/about": { tr: "/hakkimda", en: "/about" },
  "/projects": { tr: "/projeler", en: "/projects" },
  "/projects/[slug]": { tr: "/projeler/[slug]", en: "/projects/[slug]" },
  "/projects/[slug]/opengraph-image/[id]": {
    tr: "/projeler/[slug]/opengraph-image/[id]",
    en: "/projects/[slug]/opengraph-image/[id]",
  },
  "/blog": { tr: "/yazilar", en: "/blog" },
  "/blog/[slug]": { tr: "/yazilar/[slug]", en: "/blog/[slug]" },
  "/blog/[slug]/opengraph-image/[id]": {
    tr: "/yazilar/[slug]/opengraph-image/[id]",
    en: "/blog/[slug]/opengraph-image/[id]",
  },
  "/contact": { tr: "/iletisim", en: "/contact" },
  "/privacy": { tr: "/gizlilik", en: "/privacy" },
  "/coming-soon": "/coming-soon",
  "/updating": "/updating",
  "/feed.xml": "/feed.xml",
} as const;

export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  // hreflang'in tek kaynağı buildAlternates ile üretilen HTML <head>.
  // next-intl'in Link: rel=alternate başlığı, dinamik segmentli
  // yerelleştirilmiş şablonlarda diğer dilin URL'sini AYNI param değerini
  // hedef şablona koyarak üretir; TR slug'ı EN şablonuna girince 404 bir
  // adres hreflang olarak ilan edilir ve HTML'deki doğru kümeyle çelişir.
  // Bkz. docs/04-i18n.md.
  alternateLinks: false,
  pathnames,
});
```

**`alternateLinks: false` neden zorunlu (R-1).** Kaynaktan doğrulandı:

- `node_modules/next-intl/dist/esm/development/routing/config.js`: `alternateLinks: input.alternateLinks ?? true`. Bugünkü `routing.ts` bunu ayarlamıyor, yani açık.
- `middleware/middleware.js:159-166`: yönlendirme yapılmayan her yanıta `Link` başlığı yazılıyor, `localizedPathnames` olarak `pathnames[internalTemplateName]` geçiliyor.
- `middleware/getAlternateLinksHeaderValue.js`, `getLocalizedPathname`: `if (localizedPathnames && typeof localizedPathnames === 'object')` dalında `formatTemplatePathname(pathname, sourceTemplate, targetTemplate)` çalışıyor, yani aynı param değeri diğer dilin şablonuna konuyor.

Bugün zararsız, çünkü `pathnames["/blog/[slug]"]` düz string ve `typeof ... === 'object'` kontrolü false dönüp yolu olduğu gibi bırakıyor. Bu plan o girdileri obje yapar yapmaz `/yazilar/capt-sinavina-hazirlik` isteği `Link: <https://dogancanyildiz.com/en/blog/capt-sinavina-hazirlik>; rel="alternate"; hreflang="en"` yayınlar; o adres 404 ve sayfanın `generateMetadata`'sının `translationKey`'den kurduğu HTML hreflang'iyle doğrudan çelişir. Ters yönde `/en/blog/capt-preparation-in-a-docker-lab` için hem `hreflang="tr"` hem `x-default` olarak `/yazilar/capt-preparation-in-a-docker-lab` (404) yayınlanır. Google HTTP `Link rel=alternate hreflang`'i okur; iki kaynağın çelişmesi kümenin tamamının atılmasına yol açar. Ayrıca çevirisi olmayan içerikte de var olmayan bir dili ilan eder, ki bu "fallback yok" politikasının tam tersi.

Kaybedilen şey: bugün doğru olan başlık (`/hakkimda` için `/en/about`). HTML `<head>` aynı bilgiyi zaten taşıdığı ve bu sayfaların hepsi HTML olduğu için kayıp yok.

**OG alt yollarının haritaya girmesi zorunlu, tercih değil.** Kaynaktan doğrulandı (`middleware/middleware.js`): haritada karşılığı olmayan bir yol `getInternalTemplate` ile eşleşmez ve genel dala düşer, orada `next(formatPathname(unprefixedExternalPathname, "/tr"))` çalışır. Yani `/yazilar/x/opengraph-image/default` isteği `/tr/yazilar/x/opengraph-image/default` rotasına rewrite edilirdi; böyle bir dosya rotası yok, sonuç 404. Şablon eklendiğinde `formatTemplatePathname` `/yazilar/x/opengraph-image/default` -> `/blog/x/opengraph-image/default` dönüşümünü yapar ve rewrite doğru iç rotaya gider.

Şablon çakışması yok: `templateToRegex` (`shared/utils.js:78`) `^...$` ile bağlanıyor, yani `/yazilar/[slug]` (`^/yazilar/([^/]+)$`) dört segmentli OG yolunu hiç eşlemez. `getSortedPathnames` / `comparePathnamePairs` kısa yolu öne alır, bu da sıralamayı belirsiz bırakmaz.

Kimlik kartı (`/opengraph-image/default`) haritaya girmiyor: iki dilde de aynı yol, bugünkü genel dal davranışı doğru sonucu veriyor.

### 3.2 `src/i18n/navigation.ts` yeni yardımcılar

Kaynaktan doğrulanan tuzak (`navigation/shared/utils.js:31`, `compileLocalizedPathname`): `getPathname({ locale, href })` **string** href aldığında `pathnames[href]` araması yapar. `/blog/hubit` gibi somut bir yol haritada yok, "Unknown pathnames" dalına düşer ve olduğu gibi döner, sonra yalnızca dil öneki eklenir. Yani `pathnameForLocale("tr", "/blog/x")` bugün `/blog/x` döndürüyor ve bu, slug'lar ve bölüm yolları iki dilde aynı olduğu için tesadüfen doğruydu; bu iş bittiğinde doğru olmayacak. Ayrıca haritada bulunan bir şablon string olarak verilirse (`"/blog/[slug]"`) `compiled.includes("[")` kontrolü (`utils.js:60`) `Insufficient params provided for localized pathname` hatası fırlatır.

Bu yüzden içerik yolları tek kapıdan geçer:

```ts
const CONTENT_TEMPLATE = {
  post: "/blog/[slug]",
  project: "/projects/[slug]",
} as const;

const OG_TEMPLATE = {
  post: "/blog/[slug]/opengraph-image/[id]",
  project: "/projects/[slug]/opengraph-image/[id]",
} as const;

/** Bir içerik detayının tam genel yolu, dil öneki dahil. */
export function contentHref(locale: AppLocale, kind: ContentKind, slug: string): string {
  return getPathname({ locale, href: { pathname: CONTENT_TEMPLATE[kind], params: { slug } } });
}

/** Aynı sayfanın OG kartının tam genel yolu. */
export function ogImageHref(locale: AppLocale, kind: ContentKind, slug: string): string {
  return getPathname({
    locale,
    href: { pathname: OG_TEMPLATE[kind], params: { slug, id: OG_IMAGE_ID } },
  });
}

/** Bölüm kökünün tam genel yolu; dil değiştiricinin fallback'i de bunu kullanır. */
export const SECTION_TEMPLATE = { post: "/blog", project: "/projects" } as const;
```

`pathnameForLocale(locale, href)` korunur ama sözleşmesi daralır: yalnızca `pathnames` anahtarı olan statik iç yollar ve harita dışı sabit yollar (`/opengraph-image/default`) için. Dokümantasyon yorumu ve bir test bunu kilitler: dinamik şablon veya somut içerik yolu verilirse çağrı yanlıştır.

`fillPathname` **korunur** ama artık `language-switcher.tsx` onu çağırmaz (4. bölüm). Silinmemesinin gerekçesi: aynı şablon döndürme davranışını okuyan başka bir tüketici (analitik, gelecekteki bir breadcrumb) aynı tuzağa düşebilir ve tek doğru doldurucu bu.

### 3.3 `src/i18n/legacy-en-paths.ts` yeni tablo

Dosya `legacy-paths.ts` olarak yeniden adlandırılır (artık yalnızca EN değil) ve üç tablo taşır:

```ts
/** Öneksiz eski adresler. A dönemi İngilizce nav ve içerik yolları, artı B dönemi TR slug'ı değişenler. */
const LEGACY_UNPREFIXED: Readonly<Record<string, string>> = { ... };   // 1.4 A + C

/** /en önekli, slug'ı değişen İngilizce içerik. */
const LEGACY_EN_PREFIXED: Readonly<Record<string, string>> = { ... };  // 1.4 B

/** /tr soyulduktan sonraki kalan -> Türkçe kanonik. */
const LEGACY_TR_PREFIXED: Readonly<Record<string, string>> = { ... };  // 1.4 D

export function legacyRedirectTarget(pathname: string): string | null;
```

`legacyRedirectTarget` sırası:

1. Sondaki eğik çizgiyi kırp (mevcut `withoutTrailingSlash`).
2. `/tr` veya `/tr/...` ise: kalanı hesapla, `LEGACY_TR_PREFIXED[kalan] ?? kalan` döndür. Öneksiz tabloya asla düşme.
3. Aksi halde `LEGACY_EN_PREFIXED[normalized] ?? LEGACY_UNPREFIXED[normalized] ?? null`.
4. Hedef, gelen yolun aynısıysa `null` döndür (mevcut davranış, sonsuz döngü koruması).

**Veri güdümlü mü, sabit tablo mu:** sabit tablo, testle içeriğe bağlanmış. Gerekçe: `src/proxy.ts` bu modülü import ediyor ve proxy bundle'ı `#site/content`'i taşıyamaz. Velite çıktısı her MDX'in derlenmiş `code` string'ini içeriyor; onu proxy'ye import etmek tüm gövdeleri middleware bundle'ına koyar. Bunun yerine:

- Gerçek kaynak frontmatter'daki `legacySlugs` alanıdır.
- Tablo elle yazılır (yaklaşık 30 satır, sabit string).
- `tests/i18n/legacy-paths.test.ts` dört invariant kilitler:
  - **İleri**: tablodaki her hedef, gerçek içerikte var olan bir kanonik yola çözülür (`contentHref` ile üretilen küme).
  - **Geri**: `legacySlugs` dolu olan her içerik girdisi için beklenen tüm eski şekiller (öneksiz, `/en` önekli veya `/tr` önekli) tabloda anahtar olarak bulunur.
  - **Çakışma**: hiçbir tablo anahtarı, bugünkü kanonik yol kümesinin elemanı değildir.
  - **`/tr` tamlığı**: öneksiz tabloda bulunan her içerik anahtarı `K` için `LEGACY_TR_PREFIXED` da `K`'yi taşır.

İleri ve geri invariantlar gerçek içeriği okuduğu için Task 1'in (yeniden adlandırma) Task 2'den önce bitmesi zorunlu. 6.1'deki sıralama gerekçesi bu.

### 3.4 Proxy sırası ve next-intl 30x'leriyle çakışma

`src/proxy.ts` sırası değişmiyor: `x-pathname` yaz -> `legacyRedirectTarget` (308) -> `isLocalizedRoutePath` -> next-intl. Sıranın bu olması kritik, çünkü next-intl kendi 30x'ini üretiyor.

Kaynaktan doğrulanan davranış, `/projects/hubit` isteği için (öneksiz, `localeDetection: false`, dolayısıyla `locale = tr`):

1. `getInternalTemplate` önce TR şablonunu dener (`/projeler/[slug]`, eşleşmez), sonra EN şablonunu (`/projects/[slug]`, eşleşir) ve `["en", "/projects/[slug]"]` döner.
2. Geçerli dilin şablonu eşleşmediği için `formatTemplatePathname` ile TR karşılığı üretilir: `/projeler/hubit`.
3. `redirect(...)` çağrılır. `NextResponse.redirect` varsayılanı **307**'dir, kalıcı değil.

Yani proxy'nin tablosu olmasaydı `/projects/hubit` 307 ile `/projeler/hubit`'e giderdi (İngilizce sıralama Türkçe sayfaya) ve `/projects/gpa-calculator` 307 ile artık var olmayan `/projeler/gpa-calculator`'a gidip 404 olurdu. Tablo bu iki sonucu da önlüyor ve 308 veriyor. Aynı analiz `/blog` ve `/blog/<slug>` için de geçerli.

**Bilinçli ters dönen test:** `tests/config/proxy.test.ts` içindeki `"does not redirect a project detail off the Turkish canonical"` testi bugün `/projects/hubit` için `status).not.toBe(308)` iddia ediyor. Bu karar o testi tersine çeviriyor: `/projects/hubit` artık 308 ile `/en/projects/hubit`'e gidecek. Test yeniden yazılır ve başlığı `"sends the old unprefixed project detail to the English canonical"` olur. Uygulayıcı ajan bunu bir regresyon sanıp kararı geri almamalı.

### 3.5 `dynamicParams = false` ve `assert-static-routes` sözleşmesi

İç rota ağacı değişmiyor: prerender edilen yollar hâlâ `/{locale}/blog/{slug}` ve `/{locale}/projects/{slug}`, yalnızca `{slug}` artık o dilin kendi slug'ı. `generateStaticParams` zaten `getPostSlugs(lang)` / `getProjectSlugs(lang)` kullanıyor, imzası değişmiyor.

`scripts/assert-static-routes.mjs` `.velite/{posts,projects}.json` içindeki `slug` alanını dil başına prerender kümesiyle karşılaştırıyor; regex'i `^/${locale}/(projects|blog)/([^/]+)$` ve next-intl rewrite ettiği için prerender manifest anahtarları `/tr/blog/<slug>` olarak kalıyor. Script'te **kod değişikliği gerekmiyor**. Eklenen tek şey `LOCALE_PAGES` tanımının üstüne bir yorum satırı:

```js
// Bunlar İÇ rota yolları, genel yerelleştirilmiş yollar değil. next-intl
// /yazilar'ı /tr/blog'a rewrite ettiği için prerender manifest anahtarları
// İngilizce kalır; buraya /yazilar yazmak kapıyı sessizce kırar.
```

ve `tests/scripts/assert-static-routes.test.ts` içinde bunu söyleyen bir iddia.

`dynamicParams = false` sözleşmesi korunuyor: bir dilde çevirisi olmayan `translationKey` o dilde hiç rota üretmez, o adres 404 olur, hiçbir hreflang veya sitemap girdisi oraya işaret etmez.

OG görsel rotalarında `dynamicParams` hâlâ kullanılamaz (manifest'te somut yol yok); mevcut `notFound()` koruması iki OG rotasında da aynen kalır.

---

## 4. Dil değiştirici veri akışı

### 4.1 Bugünkü akışın neden çöktüğü

`src/app/[lang]/layout.tsx:155-160` `getUntranslatedPaths(locale)` ile dil başına "bu dilde olmayan yollar" listesi üretiyor, `Header` -> `LanguageSwitcher` bunu alıyor ve şunu yapıyor:

```ts
const pathname = fillPathname(usePathname(), params);   // "/blog/[slug]" -> "/blog/<mevcut-dilin-slugı>"
const target = switchTargetPath(pathname, untranslated[locale] ?? []);
const href = pathnameForLocale(locale, target);
```

Kırılma noktaları:

1. `fillPathname` şablonu mevcut dilin slug'ıyla dolduruyor. Diğer dilin slug'ı farklı olduğunda üretilen yol o dilde yok.
2. `pathnameForLocale` somut yolu haritada bulamıyor, olduğu gibi bırakıp yalnızca önek ekliyor; `/yazilar/...` üretmesi mümkün değil.
3. `untranslated` listesi iç yollar taşıyor (`/blog/<slug>`), ama artık "aynı slug diğer dilde var mı" sorusunun cevabı slug'ta değil anahtarda.

### 4.2 R-2: `usePathname()` her yerde şablon döndürmüyor

Revizyon 1 bu üç maddeyi doğru tespit etmişti ama `usePathname()`'in her zaman iç şablonu (`/blog/[slug]`) döndürdüğünü varsayıyordu. Kaynaktan doğrulanan zincir bunu yalanlıyor:

- next-intl `useBasePathname` (`navigation/react-client/useBasePathname.js`) -> `next/navigation` `usePathname` -> app router'ın `canonicalUrl` değeri.
- `create-initial-router-state.js:30-32`: `location ? createHrefFromUrl(location) : initialCanonicalUrl`. Yani tarayıcıda `window.location`, sunucuda RSC payload'ındaki `c` alanı.
- `app-render.js:721,1126`: `payload.c = prepareInitialCanonicalUrl(url)`, yani **render edilen iç rota**. Statik prerender'da bu `/tr/blog/<tr-slug>`.
- `useBasePathname`: `getLocalePrefix("tr", { mode: "as-needed" })` -> `prefixes` tanımlı olmadığı için `getLocaleAsPrefix("tr")` = `/tr`; `/tr` soyulur, elde `/blog/<tr-slug>` kalır. (Aynı fonksiyondaki `config.localePrefix.prefixes` koşullu workaround dalı bizde hiç çalışmaz, çünkü `receiveLocalePrefixConfig` string girdiden `{ mode }` üretiyor ve `prefixes` yok.)
- `getRoute("tr", "/blog/<tr-slug>", pathnames)` (`navigation/shared/utils.js:115`) yalnızca **geçerli dilin** şablonlarını dener: `/yazilar/[slug]` eşleşmez, eşleşen başka anahtar da yok, fonksiyon yolu olduğu gibi geri verir.

Sonuç, şekil matrisi:

| Sayfa | Sunucu render'ında `usePathname()` | Hidrasyondan sonra |
|---|---|---|
| TR içerik detayı | `/blog/<tr-slug>` (somut) | `/blog/[slug]` (şablon) |
| EN içerik detayı | `/blog/<en-slug>` -> `getRoute` eşleştirir -> `/blog/[slug]` | `/blog/[slug]` |
| TR bölüm kökü (`/yazilar`) | `/blog` | `/blog` |
| TR statik sayfa (`/hakkimda`) | `/about` | `/about` |

Yani yalnızca **TR içerik detay sayfaları** iki farklı şekil görüyor. Revizyon 1'in gövdesi (`contentKindForTemplate(template)` tam eşleşme) sunucu şeklinde `null` döner, kod `pathnameForLocale("en", "/blog/coolify-ile-kendi-sunucumda-yayinda")` -> `/en/blog/coolify-ile-kendi-sunucumda-yayinda` üretir, bu 404; hidrasyondan sonra istemci doğru href'i hesaplar, üstüne bir hidrasyon uyuşmazlığı gelir. Marka slug'lı `/projeler/hubit`'te href tesadüfen doğru çıkar ama uyuşmazlık kalır.

Not: `/yazilar/<slug>` şekli hiç görünmez, çünkü istemcide `getRoute` onu şablona geri çeviriyor. Yine de aşağıdaki desen üç şekle de toleranslı, çünkü tolerans bedava ve gelecekteki bir next-intl davranış değişikliğine karşı ucuz sigorta.

### 4.3 Çözüm: şekilden bağımsız switcher

Kural: **hedefi `usePathname()`'in şeklinden değil, `useParams()`'tan ve bölüm segmentinden türet.** Böylece sunucu ve istemci aynı girdilerden aynı href'i hesaplar, uyuşmazlık kalmaz.

```ts
const pathname = usePathname();     // şekli garanti değil, yalnızca bölüm segmenti için okunur
const params = useParams();

/** İlk segment, dört olası dilde. */
const SECTION_KIND: Record<string, ContentKind> = {
  blog: "post",
  yazilar: "post",
  projects: "project",
  projeler: "project",
};

function sectionKind(pathname: string): ContentKind | null {
  const first = pathname.split("/")[1] ?? "";
  return SECTION_KIND[first] ?? null;
}

/**
 * Detay sayfasının slug'ı. useParams birinci kaynak; RSC payload'ında
 * params gelmediği patolojik durumda ikinci segmentten okunur ve şablon
 * yer tutucusu ("[slug]") reddedilir.
 */
function currentSlug(pathname: string, params: ReturnType<typeof useParams>): string | null {
  if (typeof params.slug === "string" && params.slug.length > 0) return params.slug;
  const [, , second] = pathname.split("/");
  if (!second || second.startsWith("[")) return null;
  return second;
}

const href = (locale: AppLocale): string => {
  const kind = sectionKind(pathname);
  const slug = kind ? currentSlug(pathname, params) : null;

  if (kind && slug) {
    const mapped = translations[kind]?.[slug]?.[locale];
    // Çevirisi yoksa bölüm kökü; 404'e link vermek yerine listeye düşer.
    return mapped ?? pathnameForLocale(locale, SECTION_TEMPLATE[kind]);
  }
  if (kind) {
    // Bölüm kökü: /blog veya /yazilar, ikisi de aynı hedefe çözülür.
    return pathnameForLocale(locale, SECTION_TEMPLATE[kind]);
  }
  // Statik sayfa: pathname burada pathnames anahtarı (/about, /), somut yol
  // değil. getPathname doğru yerelleştirilmiş yolu üretir.
  return pathnameForLocale(locale, pathname);
};
```

`fillPathname` çağrısı kalkar. **Yeni haldeki asıl tuzak** şablonu doldurmak değil, şablonu string olarak `pathnameForLocale`'e vermek: `compileLocalizedPathname` `pathnames["/blog/[slug]"]`'i bulur, `params` olmadığı için `[slug]` yerinde kalır ve `Insufficient params provided for localized pathname` fırlatır; bu client bileşeninde tüm sayfayı düşürür. Yukarıdaki gövdede `kind` kontrolü **önce** geldiği için `/blog/[slug]` hiçbir zaman son dala ulaşmaz, ve Task 2'deki "throws" testi bu sözleşmeyi ayrıca kilitler.

`src/i18n/switch-target.ts` **silinir**: `switchTargetPath` yol string'i üzerinde `startsWith("/blog/")` yapıyordu, bu bilgi artık `kind` olarak tip düzeyinde taşınıyor. Testleri `language-switcher.test.tsx` ve yeni `tests/i18n/translation-map.test.ts` içine taşınır. `tests/i18n/app-shell.test.ts:245-249` bu import'un varlığını iddia ediyor, o iddia da yeni desene çevrilir.

### 4.4 Layout'tan taşınan harita

Layout sayfa bileşenine erişemez (Header layout'ta, sayfa child olarak geliyor), yani hedefi "sayfanın ilettiği" bir yolla taşımak ek bir client sarmalayıcı ve state gerektirir. Bunun yerine layout hazır çözülmüş hedefleri taşır:

```ts
// src/lib/content.ts
export type TranslationMap = Record<ContentKind, Record<string, Record<string, string>>>;
// kind -> mevcut dildeki slug -> hedef dil -> hedef dilin tam genel yolu

export function buildTranslationMap(locale: Locale): TranslationMap;

// src/app/[lang]/layout.tsx
const translations = buildTranslationMap(lang);
<Header translations={translations} />
```

`buildTranslationMap("tr")` örneği:

```json
{
  "post": {
    "coolify-ile-kendi-sunucumda-yayinda": { "en": "/en/blog/self-hosting-with-coolify" },
    "capt-sinavina-hazirlik": { "en": "/en/blog/capt-preparation-in-a-docker-lab" }
  },
  "project": {
    "not-ortalamasi-hesaplayici": { "en": "/en/projects/gpa-calculator" }
  }
}
```

Çevirisi olmayan bir girdi haritada yok; switcher onu bölüm köküne düşürür. "untranslated" bilgisi ayrı bir liste olmaktan çıkıp haritadaki yokluk haline geliyor: iki yapı yerine bir yapı, ve "listede var ama haritada yok" tutarsızlığı hiç doğmuyor.

`buildTranslationMap` tip olarak `src/lib/content.ts` içinde durur ama yolu `src/i18n/navigation.ts`'teki `contentHref` ile üretir. İçerik katmanının i18n katmanına bağımlı olması yeni değil: `content.ts` bugün de `routing`'i import ediyor.

`Header` props'u `untranslated: Record<string, string[]>` yerine `translations: TranslationMap` alır; `HeaderProps` yorumundaki "plain Record" gerekçesi (client sınırında `Locale` import etmemek) aynen geçerli, tip yine düz `Record<string, ...>` kalır.

### 4.5 Client payload: bugünkü kabul ve kayda geçen alternatif

Bugün 8 içerik girdisi, dil başına en fazla bir hedef, girdi başına yaklaşık 60 karakter, toplam 1 KB'ın altında. Bugünkü `untranslated` haritasından anlamlı biçimde büyük değil. `tests/perf/client-payload.test.ts` mesaj namespace'lerini denetliyor, bu veriyi değil; yeni testte harita boyutu için bir üst sınır (`JSON.stringify(map).length < 4096`) iddia edilir ki içerik büyüdüğünde karar yeniden gözden geçirilsin.

Kabul edilen zayıflık: harita **her** sayfanın RSC payload'ına giriyor, `/hakkimda` ve ana sayfa dahil, oralarda hiç kullanılmıyor. 4 KB tripwire bunu bugün sınırlıyor ama büyüme eğrisi doğrusal: 30 yazıya çıkıldığında her sayfada taşınan ölü veri olur.

**Alternatif (bugün uygulanmıyor, kayda geçiyor):** haritayı layout'tan çıkarıp yalnızca içerik detay şablonlarında render edilen bir client provider'a indirmek, hatta yalnızca o sayfanın kendi anahtarını taşımak (`<TranslationTargets value={slugsByKey(kind, key)} />`). Switcher provider'ı boş bulduğunda bölüm köküne düşer, yani statik sayfalarda davranış aynı kalır. Maliyeti bir provider ve bir context; kazancı payload'ın içerik sayısından bağımsız hale gelmesi. Tripwire kırıldığında bu alternatif uygulanır.

---

## 5. SEO

### 5.1 `src/lib/seo/alternates.ts`

- `localePath(locale, path)` ve `absoluteUrl(locale, path)` korunur, sözleşmesi "statik iç yol" olarak daraltılır. `LEADING_LOCALE` soyma davranışı ve yorumu aynen kalır.
- Yeni: `contentUrl(locale, kind, slug)` = `siteUrl() + contentHref(locale, kind, slug)`.
- `buildLanguageAlternates` imzası dil başına mutlak URL haritası alır:

```ts
export function buildLanguageAlternates(
  urlsByLocale: Partial<Record<Locale, string>>
): Record<string, string> {
  const languages: Record<string, string> = { ...urlsByLocale } as Record<string, string>;
  const fallback = urlsByLocale[routing.defaultLocale] ?? Object.values(urlsByLocale)[0];
  if (fallback) languages["x-default"] = fallback;
  return languages;
}
```

  x-default kuralı değişmiyor: varsa TR, yoksa mevcut tek dil. "Çevirisi olmayan dil hiç listelenmez" garantisi, haritada o anahtarın hiç olmamasıyla sağlanıyor.
- Kolaylık yardımcısı, statik sayfalar için: `staticLanguageUrls(path): Record<Locale, string>` (her dil için `absoluteUrl(locale, path)`).
- `buildAlternates(currentLocale, canonical, urlsByLocale, rssTitle)`: `canonical` artık hazır mutlak URL. `types["application/rss+xml"]` bloğu aynen kalır.
- `buildOpenGraph(locale, { url, imageUrl }, content)`: `url` ve `images[0].url` hazır mutlak URL alır, `content.imagePath` alanı kalkar. Alternatif (yolu içeride derlemek) `PageRoute`'u iki yere kopyalar.

### 5.2 `src/lib/seo/page-metadata.ts`

`buildPageMetadata(locale, route: PageRoute, options)`:

- `route.kind === "static"`: `canonical = absoluteUrl(locale, route.path)`, `languages = staticLanguageUrls(route.path)`, `imageUrl = absoluteUrl(locale, OG_IMAGE_PATH)` (mevcut davranış).
- `route.kind === "content"`: `canonical = contentUrl(locale, route.content, route.slugs[locale]!)`, `languages` haritadaki her dil için `contentUrl(...)`, `imageUrl = siteUrl() + ogImageHref(locale, route.content, route.slugs[locale]!)`.

`options` içinden `availableLocales` ve `imagePath` alanları kalkar; `imageAlt` kalır (kart başlığı taşıdığı için alt metin sayfaya özel olmak zorunda, mevcut gerekçe geçerli).

**Çağrı yerlerinin tam listesi (R-3).** `availableLocales` / `imagePath` kalkınca ve ikinci parametre `PageRoute` olunca derlenmeyen her dosya:

| Dosya | Satır | Çağrı |
|---|---|---|
| `src/app/[lang]/page.tsx` | 42 | `buildPageMetadata(locale, "/", { ..., availableLocales })` |
| `src/app/[lang]/about/page.tsx` | 45 | aynı, `/about` |
| `src/app/[lang]/contact/page.tsx` | 25 | aynı, `/contact` |
| `src/app/[lang]/privacy/page.tsx` | 33 | aynı, `/privacy` |
| `src/app/[lang]/blog/page.tsx` | 24 | aynı, `/blog` |
| `src/app/[lang]/projects/page.tsx` | 24 | aynı, `/projects` |
| `src/components/status/status-route-content.tsx` | 32 | `VARIANT_PATH[variant]` ile `/coming-soon` veya `/updating` |
| `src/app/[lang]/blog/[slug]/page.tsx` | 49-60 | içerik dalı |
| `src/app/[lang]/projects/[slug]/page.tsx` | 47-57 | içerik dalı |
| `src/app/[lang]/layout.tsx` | 124 | `buildOpenGraph(lang, "/", {...})`, imza değiştiği için |

Statik olanların yeni hali: `buildPageMetadata(locale, { kind: "static", path: "/about" }, { ... })`.

İki detay sayfası:

```ts
return buildPageMetadata(
  locale,
  { kind: "content", content: "post", slugs: postSlugsByKey(post.translationKey) },
  { title: post.title, description: post.summary, type: "article", ..., imageAlt: tMeta("ogAltPage", { title: post.title }) }
);
```

`layout.tsx`'in Task 3'teki payı **yalnızca** `generateMetadata` içindeki `buildOpenGraph(lang, "/", ...)` çağrısı; `LocaleLayout` gövdesine (Task 4'ün alanı) dokunulmaz.

### 5.3 `src/app/sitemap.ts`

- Statik sayfa döngüsü: `languagesFor` çağrısı `staticLanguageUrls(page.path)` olur, gerisi aynı. x-default zaten üretiliyor (`buildLanguageAlternates` her zaman ekliyor), bu davranış korunur; `docs/07` içindeki "sitemap'te x-default yok" cümlesi bayat, düzeltilecek.
- İçerik döngüsü: `url = contentUrl(locale, kind, entry.slug)`, `alternates.languages = buildLanguageAlternates(contentUrlsByKey(kind, entry.translationKey))`.
- `contentUrlsByKey(kind, key)` yardımcı fonksiyonu `slugsByKey` üzerinden dil başına mutlak URL üretir; sayfa `alternates` kümesiyle sitemap kümesinin ayrışmaması için tek fonksiyon.
- `tests/seo/sitemap.test.ts` içindeki "her sitemap URL'si gerçek bir içeriğe çözülür" testi yol desenini `/(en/)?(blog|projects|yazilar|projeler)/<slug>` olarak günceller ve slug'ı doğru dilde arar.
- Toplam URL sayısı: 6 statik x 2 + 5 proje x 2 + 3 yazı x 2 = **28**.

### 5.4 `src/app/[lang]/feed.xml/route.ts`

- `blogUrl = absoluteUrl(locale, "/blog")` -> TR'de artık `/yazilar` üretir, kod değişmez (statik iç yol).
- Öğe `link` ve `media:content`: `contentUrl(locale, "post", post.slug)` ve `siteUrl() + ogImageHref(locale, "post", post.slug)`.
- **guid kararı: `isPermaLink="false"`, `translationKey` tabanlı tag URI.**

```
<guid isPermaLink="false">tag:dogancanyildiz.com,2026:post/<locale>/<translationKey></guid>
```

  Gerekçe: bu sürümde her guid zaten değişiyor (TR tarafında bölüm yolu, EN tarafında iki slug). Yani "guid'i koruyalım" seçeneği bu sürümde mevcut değil; tek soru, değişimin bir kez mi yoksa her yol değişikliğinde mi tekrarlanacağı. Anahtar tabanlı tag URI RFC 4151'e uyar, bir daha slug veya bölüm değişse bile sabit kalır. `<link>` gerçek URL'yi taşımaya devam eder. Maliyet: bu sürümde bir kerelik yeniden teslim, site henüz duyurulmadığı için abone sayısı sıfıra yakın.
- **Tarih bileşeni sabit sözleşmedir.** `2026` bir daha asla değişmemeli, yoksa tüm guid'ler ikinci kez döner. Bunu iki yerde kilitle: `feed.xml/route.ts`'e bir yorum (`// Sabit. Bu sayıyı değiştirmek her aboneye tüm arşivi yeniden teslim eder.`) ve `tests/seo/feed.test.ts`'e literal dize iddiası (`expect(xml).toContain('tag:dogancanyildiz.com,2026:post/tr/')`).
- `tests/seo/feed.test.ts` ayrıca: guid deseni, `isPermaLink="false"`, `link`'in yeni yolu ve TR feed'inin `/yazilar` linki.

### 5.5 `src/lib/seo/jsonld.ts`

- `buildBlogPosting`: `image` ve `mainEntityOfPage["@id"]` `contentUrl` / `ogImageHref` üzerinden.
- `buildProjectCreativeWork`: `url` ve `image` aynı şekilde.
- `buildBreadcrumbList` değişmez: son öğe `item` yayımlamıyor, önceki öğe bölüm yolu (`/blog`, `/projects`) ve bu bir `pathnames` anahtarı olduğu için `absoluteUrl` doğru Türkçe yolu üretiyor. Yalnızca iki detay sayfasındaki `path: /blog/${slug}` argümanı (kullanılmayan son öğe) okunabilirlik için `contentHref` sonucuna çevrilir.
- `personId`, `websiteId`, `identityUrl` değişmez.

### 5.6 `src/lib/seo/og-image.ts` ve OG rotaları

- `OG_IMAGE_ID`, `OG_IMAGE_SIZE`, `OG_IMAGE_CONTENT_TYPE`, `OG_IMAGE_PATH` sabitleri kalır.
- `ogImagePathFor(pagePath)` silinir, yerine `src/i18n/navigation.ts` içindeki `ogImageHref(locale, kind, slug)` geçer. Gerekçe: yol birleştirme doğru sonucu verse bile ikinci bir kaynak olur; `getPathname` şablonu tek kaynak yapar. Bir test iki yolun eşitliğini iddia ederek birleştirme sezgisinin de doğru kaldığını gösterir.
- `src/app/[lang]/blog/[slug]/opengraph-image.tsx` ve `projects/[slug]/opengraph-image.tsx`: `generateStaticParams` aynı kalır (dil başına o dilin slug'ları). `notFound()` koruması aynen kalır. Kartın prompt satırındaki `$ cat blog/${slug}.md` metni **iç yol olarak kalır** (açık soru 5'in tavsiyesi): yerelleştirmek kart metnini ikinci bir yol kaynağına bağlar ve `generateImageMetadata`'nın boş params ile çağrıldığı enumerasyon turunda dili bilmeyen bir dal daha açar, kazancı yok.

### 5.7 `src/components/sections/share-card.tsx`

Props `{ locale, kind, slug, title }` olur; `url = contentUrl(...)`, `cardSrc = ogImageHref(...)` (dil öneki dahil, `<Image src>` için doğru genel yol). Bugünkü `localePath(locale, ogImagePathFor(path))` zinciri silinir.

`tests/pages/content-page-contracts.test.ts:104-112` bugün kaynak metninde `path={\`/blog/${slug}\`}` arıyor; o iddia `kind="post"` ve `slug={slug}` prop'larına çevrilir. `share-card.test.tsx` yeni props'a ve `/yazilar/...` beklentisine güncellenir.

### 5.8 robots ve diğerleri

- `src/app/robots.ts` değişmez.
- `src/components/status/status-screen.tsx` `SECONDARY_PATHS` iç yolları taşıyor, `localePath` bunları yerelleştiriyor: değişiklik gerekmez, ama `src/app/global-not-found.test.tsx` içindeki `["/projeler", "/blog", "/iletisim"]` beklentisi `/yazilar` olarak güncellenir.
- `src/lib/nav.ts` iç yolları taşıyor, `isNavItemActive` iç şablonla karşılaştırıyor: değişiklik gerekmez.
- `src/components/sections/post-list.tsx` ve `project-list.tsx` zaten `href={{ pathname: "/blog/[slug]", params: { slug } }}` kullanıyor: değişiklik gerekmez, `Link` doğru yerelleştirilmiş yolu üretir. Bu iki dosya bu iş için hazır yazılmış tek doğru desen.

---

## 6. Task listesi

Ön koşul: `feature/copy-refresh` dalındaki içerik değişiklikleri (`content/blog/**`, `content/projects/**` üzerindeki commit edilmemiş düzenlemeler) dev'e inmiş olmalı. Task 1 aynı dosyaları `git mv` ile yeniden adlandırıyor; commit edilmemiş bir düzenlemenin üstünde rename yapmak diff'i okunmaz hale getirir.

### 6.1 Sıra ve gerekçesi

```
Task 1 (içerik modeli + yeniden adlandırma)
      |
Task 2 (routing + alternateLinks + yönlendirme tabloları)
      |
Task 3 (SEO yüzeyleri)
      |
Task 4 (dil değiştirici)
      |
Task 5 (dokümanlar + kapılar)
```

**Tamamen sıralı, paralel dal yok (R-3).** Revizyon 1 Task 3 ile Task 4'ü paralel gösteriyordu; ikisi de `src/app/[lang]/layout.tsx` yazıyor (Task 3 `generateMetadata` içindeki `buildOpenGraph`, Task 4 `LocaleLayout` gövdesindeki `getUntranslatedPaths`), yani paralel çalıştırılamazlar.

**Yeniden adlandırma neden Task 1'de (R-5).** İki seçenek vardı: (a) yeniden adlandırmayı SEO'dan sonraya almak, (b) Task 1'e kırılan test dosyalarını eklemek. (b) seçildi, çünkü 3.3'teki "ileri" ve "geri" invariantları gerçek içeriği okuyor: Task 2'nin yönlendirme tablosu, yazıldığı anda canlı içeriğe karşı doğrulanabilmeli. Yeniden adlandırma sonraya bırakılırsa Task 2 tablosu doğrulanamadan yazılır, ki SEO riskinin tam olarak toplandığı yer orası.

Ara durum güvenli: Task 1 ile Task 2 arasında dal iç tutarlı kalır (tüm linkler, sitemap ve canonical yeni slug'ları kullanır), yalnızca yönlendirme tablosu eksiktir. Plan ortasında hiçbir şey dağıtılmıyor.

**Düzeltilmiş kırılma haritası.** Hangi test hangi task'ta kırılır (doğrulandı):

| Test dosyası | Kırıldığı task | Neden |
|---|---|---|
| `tests/content-layer.test.ts` | 1 | `getPostLocales` -> `getPostLocalesByKey` adı, `getUntranslatedPaths` hâlâ var (Task 4'te kırılır) |
| `tests/seo/sitemap.test.ts` | 1 ve 3 | 1'de: `getPosts` gerçek içerikten geliyor, satır 65-120'deki sabit slug'lar tutmuyor. 3'te: `buildLanguageAlternates` / `buildAlternates` imzası (satır 228, 255) ve yol şekli |
| `tests/seo/page-metadata.test.ts` | 1 ve 3 | 1'de: `PAGES` `getPostSlugs`/`getProjectSlugs`'tan üretiliyor, satır 409/426/440'taki case adları yok oluyor. 3'te: `buildPageMetadata` imzası |
| `tests/config/proxy.test.ts` | 2 | Saf tablo davranışı, Task 1'den etkilenmez |
| `tests/i18n/navigation.test.ts` | 2 ve 4 | 2'de `pathnameForLocale` sözleşmesi, 4'te `switchTargetPath` blokları taşınır |
| `tests/seo/alternates.test.ts` | 3 | Sabit string girdili saf fonksiyon testi, Task 1'den etkilenmez |
| `tests/seo/feed.test.ts`, `tests/seo/jsonld.test.ts`, `tests/og-image.test.ts` | 3 | `ogImagePathFor` ve URL şekli |
| `tests/pages/content-page-contracts.test.ts` | 3 | `ShareCard` prop kaynak metni iddiası (satır 104-112) |
| `src/components/sections/share-card.test.tsx` | 3 | Props |
| `src/components/layout/language-switcher.test.tsx` | 4 | Mock testi, Task 1'den etkilenmez |
| `tests/accessibility.test.ts` | 4 | Satır 198, `Header` `untranslated` prop'uyla render ediliyor |
| `tests/i18n/app-shell.test.ts` | 4 | Satır 239 ve 245-249, switcher kaynak metni iddiaları |
| `src/app/global-not-found.test.tsx` | 5 | `/blog` -> `/yazilar` beklentisi |
| `tests/scripts/assert-static-routes.test.ts` | 2 (ekleme) | Yeni iddia, mevcut testler kırılmıyor |

### Task 1: İçerik modeli (translationKey, legacySlugs, dosya adları)

**Model:** sonnet

**Files:**
- Modify: `velite.config.ts`
- Rename + modify: `content/blog/tr/self-hosting-with-coolify.mdx` -> `content/blog/tr/coolify-ile-kendi-sunucumda-yayinda.mdx`
- Rename + modify: `content/blog/en/capt-sinavina-hazirlik.mdx` -> `content/blog/en/capt-preparation-in-a-docker-lab.mdx`
- Rename + modify: `content/blog/en/ccna-dan-web-guvenligine.mdx` -> `content/blog/en/what-ccna-changed-about-exposing-an-app.mdx`
- Rename + modify: `content/projects/tr/gpa-calculator.mdx` -> `content/projects/tr/not-ortalamasi-hesaplayici.mdx`
- Rename + modify: `content/projects/tr/ticket-purchasing-system.mdx` -> `content/projects/tr/bilet-satin-alma-sistemi.mdx`
- Modify (yalnızca frontmatter): kalan 11 MDX dosyası (`translationKey` eklenir)
- Modify: `src/lib/content.ts`
- Modify: `src/app/sitemap.ts` (yalnızca iki çağrı: `getProjectLocalesByKey(project.translationKey)`, `getPostLocalesByKey(post.translationKey)`)
- Modify: `src/app/[lang]/blog/[slug]/page.tsx`, `src/app/[lang]/projects/[slug]/page.tsx` (yalnızca `availableLocales` argümanı)
- Modify: `tests/content-layer.test.ts`, `tests/content-schema.test.ts`
- Modify: `tests/seo/sitemap.test.ts`, `tests/seo/page-metadata.test.ts` (yalnızca slug'a bağlı beklentiler)
- Create: `tests/fixtures/velite.duplicate-key.config.ts` ve fikstür MDX'leri

**Adımlar:**
- [ ] `tests/content-layer.test.ts` içine başarısız testler yaz: `getPostLocalesByKey("self-hosting-with-coolify")` iki dil döner; `postSlugsByKey("self-hosting-with-coolify")` `{ tr: "coolify-ile-kendi-sunucumda-yayinda", en: "self-hosting-with-coolify" }` döner; `getPostByKey("tr", "capt-sinavina-hazirlik")` dosyayı bulur.
- [ ] Mevcut "keeps the non prose fields of a translated project identical" ve "keeps the publish date of a translated post identical" testlerini slug yerine `translationKey` üzerinden eşleyecek şekilde güncelle.
- [ ] `velite.config.ts`: `translationKey` ve `legacySlugs` alanları, `prepare` içinde dört kural (2.2).
- [ ] Yeni fikstür + test: aynı dilde iki kez kullanılan `translationKey` build'i düşürür; `legacySlugs` içinde yaşayan bir slug build'i düşürür; `legacySlugs` kendi slug'ını içerirse ayrı mesajla düşer.
- [ ] Dosyaları `git mv` ile yeniden adlandır, frontmatter `slug` ve `translationKey` alanlarını yaz, değişen beş dosyaya `legacySlugs` ekle. Kalan 11 dosyaya yalnızca `translationKey` (mevcut slug değeri).
- [ ] `src/lib/content.ts`: anahtar tabanlı yardımcılar (2.3). `getPostLocales` -> `getPostLocalesByKey`, `getProjectLocales` -> `getProjectLocalesByKey` yeniden adlandırması. `getUntranslatedPaths` **bu task'ta kalır**, Task 4'te silinir.
- [ ] `tsc`'nin işaret ettiği üç çağrı yerini (`sitemap.ts:62,75`, iki detay sayfası) `entry.translationKey` geçecek şekilde düzelt.
- [ ] `tests/seo/sitemap.test.ts` ve `tests/seo/page-metadata.test.ts` içindeki slug'a bağlı beklentileri yeni slug'lara taşı. Yol şekli bu task'ta değişmiyor: `/en/blog/capt-sinavina-hazirlik` -> `/en/blog/capt-preparation-in-a-docker-lab`, `/blog/self-hosting-with-coolify` (tr) -> `/blog/coolify-ile-kendi-sunucumda-yayinda`, `blog/self-hosting-with-coolify [tr]` case adı -> `blog/coolify-ile-kendi-sunucumda-yayinda [tr]`.
- [ ] `npm run build:content && npm run typecheck && npm run test` yeşil.

**Commit:** `feat(content): key every translation by translationKey and localize the Turkish slugs`

### Task 2: Yerelleştirilmiş yollar ve yönlendirme tabloları

**Model:** opus (yönlendirme sırası, next-intl davranışı ve SEO kaybı riski burada toplanıyor)

**Files:**
- Modify: `src/i18n/routing.ts`
- Modify: `src/i18n/navigation.ts`
- Rename + rewrite: `src/i18n/legacy-en-paths.ts` -> `src/i18n/legacy-paths.ts`
- Modify: `src/proxy.ts` (yalnızca import yolu)
- Modify: `scripts/assert-static-routes.mjs` (yalnızca `LOCALE_PAGES` üstüne yorum)
- Create: `tests/i18n/legacy-paths.test.ts`
- Modify: `tests/i18n/navigation.test.ts`, `tests/i18n/routing.test.ts`, `tests/config/proxy.test.ts`, `tests/scripts/assert-static-routes.test.ts`

**Adımlar:**
- [ ] `tests/i18n/navigation.test.ts` içine başarısız testler: `contentHref("tr","post","x")` -> `/yazilar/x`; `contentHref("en","post","x")` -> `/en/blog/x`; `ogImageHref("tr","project","y")` -> `/projeler/y/opengraph-image/default`; `pathnameForLocale("tr","/blog/[slug]")` **fırlatır**.
- [ ] `tests/config/proxy.test.ts` içine 1.4 tablosunun tamamı için 308 iddiaları, artı "hiçbir kanonik yol 308 almaz" iddiası ve `/tr/projects/gpa-calculator` -> `/projeler/not-ortalamasi-hesaplayici` tek atlama iddiası.
- [ ] Aynı dosyadaki mevcut `"does not redirect a project detail off the Turkish canonical"` testini **tersine çevir**: `/projects/hubit` artık 308 ile `/en/projects/hubit`'e gider (3.4). Bu bir regresyon değil, kararın kendisi.
- [ ] `tests/config/proxy.test.ts` içine `alternateLinks` iddiası: yerelleştirilmiş dalda dönen yanıt (`/yazilar` gibi yönlendirilmeyen bir yol) `Link` başlığı taşımaz.
- [ ] `src/i18n/routing.ts`: 3.1'deki `pathnames` ve `alternateLinks: false` (yorumuyla birlikte).
- [ ] `src/i18n/navigation.ts`: `contentHref`, `ogImageHref`, `SECTION_TEMPLATE`, `pathnameForLocale` sözleşme yorumu.
- [ ] `src/i18n/legacy-paths.ts`: üç tablo + `legacyRedirectTarget` sırası (3.3).
- [ ] `tests/i18n/legacy-paths.test.ts`: dört invariant (ileri, geri, çakışma, `/tr` tamlığı).
- [ ] `scripts/assert-static-routes.mjs`: `LOCALE_PAGES` üstüne 3.5'teki yorum; `tests/scripts/assert-static-routes.test.ts`'e "LOCALE_PAGES iç yolları taşır, yerelleştirilmiş yolları değil" iddiası.
- [ ] `npm run test && npm run typecheck` yeşil.

**Commit:** `feat(i18n): serve the Turkish blog and project paths in Turkish and 308 every old address`

### Task 3: SEO yüzeyleri

**Model:** sonnet

**Files:**
- Modify: `src/lib/seo/alternates.ts`, `src/lib/seo/page-metadata.ts`, `src/lib/seo/jsonld.ts`, `src/lib/seo/og-image.ts`
- Modify: `src/app/sitemap.ts`, `src/app/[lang]/feed.xml/route.ts`
- Modify: `src/app/[lang]/blog/[slug]/page.tsx`, `src/app/[lang]/projects/[slug]/page.tsx`, `src/app/[lang]/blog/page.tsx`, `src/app/[lang]/projects/page.tsx`
- Modify (R-3, `PageRoute` geçişi): `src/app/[lang]/page.tsx`, `src/app/[lang]/about/page.tsx`, `src/app/[lang]/contact/page.tsx`, `src/app/[lang]/privacy/page.tsx`, `src/components/status/status-route-content.tsx`
- Modify (R-3, yalnızca `generateMetadata` içindeki `buildOpenGraph` çağrısı): `src/app/[lang]/layout.tsx`
- Modify: `src/components/sections/share-card.tsx` + `src/components/sections/share-card.test.tsx`
- Modify: `tests/seo/alternates.test.ts`, `tests/seo/sitemap.test.ts`, `tests/seo/feed.test.ts`, `tests/seo/jsonld.test.ts`, `tests/seo/page-metadata.test.ts`, `tests/og-image.test.ts`
- Modify (R-3): `tests/pages/content-page-contracts.test.ts` (ShareCard prop iddiası), `tests/content-layer.test.ts` (satır ~375, eski imzalı `buildLanguageAlternates` çağrısı)

**Adımlar:**
- [ ] Başarısız testler önce: `buildLanguageAlternates` dil başına farklı yol üretir (`tr: /yazilar/...`, `en: /en/blog/...`, `x-default` = TR); tek dilli içerik yalnızca kendi dilini listeler.
- [ ] `alternates.ts`: yeni imzalar (5.1), `staticLanguageUrls`, `contentUrl`, `buildOpenGraph(locale, { url, imageUrl }, content)`.
- [ ] `page-metadata.ts`: `PageRoute` ve iki dal (5.2).
- [ ] 5.2'deki tablodaki **on** çağrı yerinin hepsini geçir. `status-route-content.tsx` statik dalı `/coming-soon` ve `/updating` ile çalışır; `layout.tsx`'te yalnızca `generateMetadata` içindeki `buildOpenGraph` satırına dokun, `LocaleLayout` gövdesine dokunma (Task 4'ün alanı).
- [ ] `jsonld.ts`, `sitemap.ts`, `feed.xml/route.ts` (guid ve sabit tarih yorumu dahil), `share-card.tsx`.
- [ ] `og-image.ts`: `ogImagePathFor` silinir, sabitler kalır; `ogImageHref` ile eşitliğini gösteren test.
- [ ] `npm run test && npm run typecheck` yeşil.

**Commit:** `feat(seo): build canonical, hreflang, sitemap and feed urls from per locale slugs`

### Task 4: Dil değiştirici veri akışı

**Model:** opus (sunucu/istemci `usePathname` şekil farkı ve hidrasyon uyuşmazlığı burada)

**Files:**
- Modify: `src/lib/content.ts` (`buildTranslationMap` eklenir, `getUntranslatedPaths` silinir)
- Modify: `src/app/[lang]/layout.tsx` (yalnızca `LocaleLayout` gövdesi ve `<Header>` prop'u)
- Modify: `src/components/layout/header.tsx`, `src/components/layout/language-switcher.tsx` + `language-switcher.test.tsx`
- Delete: `src/i18n/switch-target.ts`
- Create: `tests/i18n/translation-map.test.ts`
- Modify: `tests/i18n/app-shell.test.ts`, `tests/i18n/navigation.test.ts` (switchTargetPath blokları taşınır), `tests/content-layer.test.ts` (untranslated blokları), `tests/accessibility.test.ts` (satır 198 Header prop'u)

**Adımlar:**
- [ ] Başarısız testler, **iki `usePathname` şekliyle de** (R-2): TR yazı detayında EN bağlantısı `/en/blog/<en-slug>`, hem `usePathname` -> `"/blog/[slug]"` hem `usePathname` -> `"/blog/coolify-ile-kendi-sunucumda-yayinda"` senaryosunda. Ek bir test iki senaryonun **aynı href'i** ürettiğini iddia eder (hidrasyon uyuşmazlığı koruması).
- [ ] Diğer başarısız testler: çevirisi olmayan bir yazıda EN bağlantısı `/en/blog`; `/hakkimda` sayfasında (`usePathname` -> `"/about"`) EN bağlantısı `/en/about`; `/yazilar` bölüm kökünde (`usePathname` -> `"/blog"`) EN bağlantısı `/en/blog`; harita boyutu 4 KB altında.
- [ ] `buildTranslationMap` yazılır (4.4), `getUntranslatedPaths` silinir, `tests/content-layer.test.ts`'teki untranslated blokları `tests/i18n/translation-map.test.ts`'e taşınır.
- [ ] `LanguageSwitcher` 4.3'teki gövdeye geçer (`sectionKind` + `currentSlug`, `fillPathname` çağrısı yok), `Header` props'u güncellenir, `layout.tsx` `buildTranslationMap(lang)` çağırır.
- [ ] `switch-target.ts` silinir, testleri taşınır; `tests/i18n/app-shell.test.ts:239,245-249` iddiaları yeni desene çevrilir.
- [ ] `tests/accessibility.test.ts:198`'deki `Header` render'ı yeni prop'a geçer.
- [ ] `npm run test && npm run typecheck` yeşil.

**Commit:** `refactor(i18n): point the language switcher at per locale translation targets`

### Task 5: Dokümanlar ve kapılar

**Model:** haiku

**Files:**
- Modify: `docs/04-i18n.md` (V-5 paragrafı silinir, URL tablosu, yeni yönlendirme politikası, `alternateLinks: false` gerekçesi)
- Modify: `docs/05-backend-icerik-ve-servisler.md` (frontmatter alanları, `translationKey` eşlemesi)
- Modify: `docs/07-seo-ve-metadata.md` (URL tablosu, V-5 kabulünün kapanışı, feed guid kararı, sitemap x-default cümlesi ve URL sayımı)
- Modify: `README.md` (satır 253-273 "İçerik ekleme": yeni zorunlu `translationKey` alanı, `legacySlugs`, "iki dilde aynı slug" kuralının kalkması, ASCII slug uyarısı; satır 87 civarındaki i18n cümlesi)
- Modify: `src/app/global-not-found.test.tsx` (`/yazilar` beklentisi)

**Adımlar:**
- [ ] Dokümanlardaki `/blog/<slug>` örneklerini 1.3'teki matrisle değiştir.
- [ ] `docs/04-i18n.md` içindeki "Eski öneksiz `/blog` yönlendirilmiyor: bilinçli kabul (2026-09-02, V-5)" bölümünü (satır ~181-187) tamamen sil, yerine "2026-09-02 kararı: TR yolları Türkçe, eski öneksiz adresler `/en`'e 308" notunu ve 1.5'teki yönlendirilmeyenler listesini yaz.
- [ ] `docs/07-seo-ve-metadata.md` satır 65'teki iki bayat ifadeyi düzelt: "Toplam 24 URL (5 statik sayfa x 2 locale + 5 proje x 2 locale + 1 EN yazı + 3 TR yazı)" -> "Toplam 28 URL (6 statik sayfa x 2 locale + 5 proje x 2 locale + 3 yazı x 2 locale)"; "Açık kalan tek fark: sitemap girdilerinde `x-default` yok" cümlesini sil, `buildLanguageAlternates` artık her girdide üretiyor.
- [ ] `README.md` satır 267'deki "Aynı içeriğin iki dil klasöründe AYNI `slug` değeri olmalı" kuralını "AYNI `translationKey` değeri olmalı; `slug` her dilde farklı olabilir ve olmalıdır" ile değiştir. ASCII zorunluluğunu açıkça yaz (ı, ş, ğ reddedilir).
- [ ] `npm run test` (verify-docs testi dahil) yeşil.

**Commit:** `docs: record the localized path scheme and close the V-5 acceptance`

---

## Bitti sayılma kriteri

### Kapılar

```bash
npm run build:content
npm run typecheck
npm run lint
npm run test
npm run build
npm run verify:routes
```

Hepsi yeşil. `verify:routes` çıktısı dil başına 5 proje + 3 yazı bildirmeli.

### curl matrisi

`npm run build && npm start` üzerinde, `BASE=http://localhost:3000`.

**Eski adres -> 308 ve tek atlama:**

```bash
for pair in \
  "/blog|/en/blog" \
  "/projects|/en/projects" \
  "/blog/self-hosting-with-coolify|/en/blog/self-hosting-with-coolify" \
  "/blog/capt-sinavina-hazirlik|/en/blog/capt-preparation-in-a-docker-lab" \
  "/blog/ccna-dan-web-guvenligine|/en/blog/what-ccna-changed-about-exposing-an-app" \
  "/projects/hubit|/en/projects/hubit" \
  "/projects/gpa-calculator|/en/projects/gpa-calculator" \
  "/projects/ticket-purchasing-system|/en/projects/ticket-purchasing-system" \
  "/en/blog/capt-sinavina-hazirlik|/en/blog/capt-preparation-in-a-docker-lab" \
  "/en/blog/ccna-dan-web-guvenligine|/en/blog/what-ccna-changed-about-exposing-an-app" \
  "/projeler/gpa-calculator|/projeler/not-ortalamasi-hesaplayici" \
  "/projeler/ticket-purchasing-system|/projeler/bilet-satin-alma-sistemi" \
  "/tr/blog|/yazilar" \
  "/tr/blog/self-hosting-with-coolify|/yazilar/coolify-ile-kendi-sunucumda-yayinda" \
  "/tr/blog/capt-sinavina-hazirlik|/yazilar/capt-sinavina-hazirlik" \
  "/tr/projects/gpa-calculator|/projeler/not-ortalamasi-hesaplayici" \
  "/tr/projeler/ticket-purchasing-system|/projeler/bilet-satin-alma-sistemi" \
  "/blog/|/en/blog" \
  "/tr/blog/capt-sinavina-hazirlik/|/yazilar/capt-sinavina-hazirlik" \
; do
  from="${pair%%|*}"; to="${pair##*|}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$from")
  loc=$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE$from")
  final=$(curl -s -o /dev/null -L -w '%{http_code} %{url_effective}' "$BASE$from")
  echo "$from -> $code $loc | final: $final   (beklenen 308 $BASE$to, final 200 $BASE$to)"
done
```

Kabul: her satırda kod `308`, `redirect_url` beklenen hedef, `-L` sonrası `200` ve `url_effective` aynı hedef.

**Yeni adres -> 200:**

```bash
for p in \
  "/" "/yazilar" "/projeler" "/hakkimda" "/iletisim" "/gizlilik" "/feed.xml" \
  "/yazilar/coolify-ile-kendi-sunucumda-yayinda" \
  "/yazilar/capt-sinavina-hazirlik" \
  "/yazilar/ccna-dan-web-guvenligine" \
  "/projeler/cargo-pilot" "/projeler/hubit" "/projeler/wikonya" \
  "/projeler/not-ortalamasi-hesaplayici" "/projeler/bilet-satin-alma-sistemi" \
  "/en" "/en/blog" "/en/projects" "/en/about" "/en/feed.xml" \
  "/en/blog/self-hosting-with-coolify" \
  "/en/blog/capt-preparation-in-a-docker-lab" \
  "/en/blog/what-ccna-changed-about-exposing-an-app" \
  "/en/projects/cargo-pilot" "/en/projects/gpa-calculator" \
  "/en/projects/ticket-purchasing-system" \
; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")" "$p"; done
```

Kabul: hepsi `200`.

**`Link` başlığı yok (R-1 kabul kriteri):**

```bash
curl -sI "$BASE/yazilar/capt-sinavina-hazirlik" | grep -i '^link:'
curl -sI "$BASE/hakkimda"                       | grep -i '^link:'
curl -sI "$BASE/en/blog/capt-preparation-in-a-docker-lab" | grep -i '^link:'
```

Kabul: üç satırda da **çıktı yok**.

**OG kartları -> 200 image/png:**

```bash
for p in \
  "/opengraph-image/default" "/en/opengraph-image/default" \
  "/yazilar/capt-sinavina-hazirlik/opengraph-image/default" \
  "/yazilar/coolify-ile-kendi-sunucumda-yayinda/opengraph-image/default" \
  "/projeler/not-ortalamasi-hesaplayici/opengraph-image/default" \
  "/en/blog/capt-preparation-in-a-docker-lab/opengraph-image/default" \
  "/en/projects/gpa-calculator/opengraph-image/default" \
; do printf '%s %s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")" "$(curl -s -o /dev/null -w '%{content_type}' "$BASE$p")" "$p"; done
```

Kabul: hepsi `200 image/png`.

**404 kalmalı:**

```bash
for p in "/yazilar/self-hosting-with-coolify" "/en/blog/coolify-ile-kendi-sunucumda-yayinda" "/blog/nonexistent-slug"; do
  printf '%s %s\n' "$(curl -s -o /dev/null -L -w '%{http_code}' "$BASE$p")" "$p"
done
```

Kabul: birinci satır `308` sonrası `200` (D tablosunda var), ikinci ve üçüncü `404`.

**Feed ve sitemap:**

```bash
curl -s "$BASE/feed.xml" | grep -c '<guid isPermaLink="false">tag:'      # 3 beklenir
curl -s "$BASE/feed.xml" | grep -o 'tag:dogancanyildiz.com,2026:post/tr/[a-z0-9-]*' | head -3
curl -s "$BASE/feed.xml" | grep -o '<link>[^<]*</link>' | head -5        # /yazilar/... beklenir
curl -s "$BASE/en/feed.xml" | grep -o '<link>[^<]*</link>' | head -5     # /en/blog/... beklenir
curl -s "$BASE/sitemap.xml" | grep -c '<url>'                            # 28 beklenir
curl -s "$BASE/sitemap.xml" | grep -o 'https://[^<]*yazilar[^<]*' | head
curl -s "$BASE/sitemap.xml" | grep -c 'hreflang="x-default"'             # 28 beklenir
```

**hreflang çifti:**

```bash
curl -s "$BASE/yazilar/capt-sinavina-hazirlik" | grep -o '<link rel="alternate"[^>]*>'
# beklenen: hreflang="tr" .../yazilar/capt-sinavina-hazirlik
#           hreflang="en" .../en/blog/capt-preparation-in-a-docker-lab
#           hreflang="x-default" .../yazilar/capt-sinavina-hazirlik
curl -s "$BASE/yazilar/capt-sinavina-hazirlik" | grep -o 'rel="canonical"[^>]*'
```

**Dil değiştirici (prerender HTML'i, R-2 kabul kriteri):**

```bash
curl -s "$BASE/yazilar/capt-sinavina-hazirlik" | grep -o 'hreflang="en" lang="en"[^>]*'
# beklenen href: /en/blog/capt-preparation-in-a-docker-lab
curl -s "$BASE/projeler/not-ortalamasi-hesaplayici" | grep -o 'hreflang="en" lang="en"[^>]*'
# beklenen href: /en/projects/gpa-calculator
```

Bu iki satır sunucu render'ından geliyor, yani R-2'nin doğrudan sınavı. Ek olarak tarayıcıda aynı iki sayfayı aç ve konsolda hidrasyon uyarısı olmadığını doğrula.

### Yayın sonrası (sahibinin elle adımı)

- Search Console'da eski URL'lerin 308 raporunu izle; `dogancanyildiz.com` property'sinde yeni sitemap'i tekrar gönder.
- Üçüncü parti hreflang aracıyla en az bir yazı ve bir proje sayfasını tara.

---

## Riskler

1. **Öneksiz `/blog/capt-sinavina-hazirlik` İngilizceye gidiyor ama 30 Ağustos'tan beri Türkçe kanonikti.** Üç günlük bir pencerede sitemap bu adresi TR olarak bildirdi. Karar sahibinin; alternatif için açık soru 3.
2. **Bir yol iki tabloya girerse sessizce yanlış dile gider.** `/tr` dalının kendi tam tablosuna sahip olmaması `/tr/projects/<slug>` isteklerini iki atlamada İngilizceye taşır. 3.3'teki dördüncü invariant testi bu hatayı derlemede değil testte yakalar.
3. **`pathnameForLocale`'e dinamik şablon string olarak sızarsa header render'ı fırlatır.** `compileLocalizedPathname` `Insufficient params` atıyor ve bu client bileşeninde tüm sayfayı düşürür. Task 2'deki "throws" testi ve Task 4'teki `kind` kontrolü birlikte gerekli.
4. **OG şablonları haritaya eklenmezse detay kartları 404 olur**, sayfa 200 kalır, yani sessiz bozulma. curl matrisindeki OG bloğu kabul kriterinin parçası.
5. **`alternateLinks` açık kalırsa hreflang kümesi çelişir ve Google kümenin tamamını atar.** Kod değişikliği tek satır, ama unutulması sessiz ve en pahalı SEO hatası. `tests/config/proxy.test.ts` iddiası ve curl matrisindeki `grep -i '^link:'` satırı birlikte gerekli.
6. **Sunucu ile istemci arasında farklı `usePathname` şekli.** Yalnızca TR içerik detay sayfalarında; yanlış ele alınırsa prerender HTML'ine 404 href basılır ve üstüne hidrasyon uyuşmazlığı gelir. Task 4'ün iki şekilli testi ve "aynı href" iddiası bunu kilitler; curl ile prerender HTML'i doğrudan denetlenir.
7. **Feed guid'leri bu sürümde toptan değişiyor.** Abonelere bir kerelik yeniden teslim gider. Kaçınılmaz; tag URI kararı bunu tekrarlamaz hale getiriyor, ama tarih bileşeni bir daha değişmemeli.
8. **`slug` ile `translationKey`'in çoğu içerikte eşit olması** ikisinin aynı şey olduğu izlenimini yaratır. Bir sonraki slug değişikliğinde biri güncellenip diğeri unutulabilir. Velite `prepare` kuralları ve `legacy-paths` testleri bu hatayı build'de yakalar; `getPostLocalesByKey` adı da çağrı yerlerini derleyiciye görünür kılar.
9. **Türkçe URL'lerde ASCII zorunluluğu.** `SLUG_PATTERN` "ı" ve "ş"yi reddediyor; insan gözüyle "yayında" yazıp build'in düştüğünü görmek yeni bir sürtünme. README notu bunu açıkça yazmalı.
10. **`assert-static-routes.mjs` iç rota adlarına bağlı** (`blog`, `projects`). Bu iş iç rotaları değiştirmiyor, ama bir gelecek okuyucu "yollar Türkçeleşti" diye script'i de değiştirmeye kalkarsa kapı kırılır. Yorum satırı ve testi Task 2'de.
11. **`buildTranslationMap` her sayfanın payload'ına giriyor.** Bugün 1 KB altında, 4 KB tripwire var; 30 yazıda karar yeniden açılmalı. Alternatif 4.5'te kayıtlı.
12. **`git mv` ile yeniden adlandırılan beş MDX dosyasında commit edilmemiş değişiklik varsa** diff okunmaz hale gelir. Ön koşul maddesi bunu engelliyor.

---

## Açık sorular (sahibine)

1. **İngilizce yazı slug'ları.** Öneri: `capt-preparation-in-a-docker-lab` ve `what-ccna-changed-about-exposing-an-app` (başlıktan türetildi). Brief'teki alternatifler: `preparing-for-the-capt-exam` ve `from-ccna-to-web-security` (kısa, arama terimine yakın). Hangisi?
2. **Türkçe Coolify yazısının slug'ı.** Öneri `coolify-ile-kendi-sunucumda-yayinda`. Kısa alternatif: `coolify-ile-kendi-sunucumda`. Ya da Türkçe tarafta da `self-hosting-with-coolify` bırakılıp yalnızca bölüm yolu değiştirilebilir (sıfır yönlendirme).
3. **Öneksiz eski detay adresleri: sınıf kuralı mı, slug diline göre mi?** İki seçenek var, veriyle birlikte:

   | Adres | A dönemi (30 Ağ öncesi) | B dönemi (30 Ağ sonrası, ~3 gün) | Sınıf kuralı (plandaki) | Slug diline göre (alternatif) |
   |---|---|---|---|---|
   | `/blog/self-hosting-with-coolify` | EN | TR | `/en/blog/self-hosting-with-coolify` | `/en/blog/self-hosting-with-coolify` (slug İngilizce) |
   | `/blog/capt-sinavina-hazirlik` | EN | TR | `/en/blog/capt-preparation-in-a-docker-lab` | `/yazilar/capt-sinavina-hazirlik` |
   | `/blog/ccna-dan-web-guvenligine` | EN | TR | `/en/blog/what-ccna-changed-about-exposing-an-app` | `/yazilar/ccna-dan-web-guvenligine` |
   | `/projects/gpa-calculator` | EN | TR | `/en/projects/gpa-calculator` | `/en/projects/gpa-calculator` (slug İngilizce) |

   **Tavsiye: slug diline göre.** İki adres için farklı sonuç veriyor ve o iki adresin slug'ı zaten Türkçe, yani hem daha az sinyal kaybı hem daha az açıklama. Sınıf kuralı yalnızca "hepsi A döneminde İngilizceydi" gerekçesine dayanıyor, ama o dönemde bu iki adres Türkçe slug'lı İngilizce sayfaydı, ki zaten tuhaf bir durumdu.
4. **Proje bölüm yolu `/projeler` kalıyor, yazı bölümü `/yazilar` oluyor.** "Blog" kelimesi Türkçede de yaygın; `/yazilar` tercihi doğrulansın mı?
5. **OG kartındaki prompt satırı.** Bugün `$ cat blog/<slug>.md`. **Tavsiye: iç yol olarak bırak.** Yerelleştirmek kart metnini ikinci bir yol kaynağına bağlar ve `generateImageMetadata`'nın boş params ile çağrıldığı enumerasyon turunda dili bilmeyen bir dal daha açar; kazancı yok.
6. **Feed guid'i.** Öneri: `isPermaLink="false"` + `tag:dogancanyildiz.com,2026:post/<locale>/<translationKey>`, tarih bileşeni kalıcı sabit. Onaylanıyor mu?
7. **`legacySlugs` frontmatter alanı isteniyor mu?** Yönlendirme tablosu elle yazılacak (proxy bundle gerekçesi); `legacySlugs` yalnızca testin geri yönünü besliyor ve tarihçeyi içeriğin yanında tutuyor. İstenmezse tablo tek başına kalır ve yalnızca ileri yön testi çalışır.
