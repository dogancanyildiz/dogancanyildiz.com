# SEO, Metadata ve Yapılandırılmış Veri

Durum: Uygulandı (Faz 2 #4, Faz 4 #6; denetim kapanışı #34; TR varsayılan #36; sayfa başına OG kartı ve yerelleştirilmiş yollar #45) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

## Kararlar

1. **`generateMetadata` yalnızca `lang` route param'ından üretilir.**
   `cookies()` çağrısı kalktı; `metadataBase` `siteUrl()`'den geliyor.
2. **Her sayfada `alternates.canonical` + `alternates.languages` +
   `x-default`.** `x-default` varsayılan dilin (Türkçe) kökünü işaret ediyor.
3. **`sitemap.ts` iki locale için de girdi üretir**, yalnızca gerçekten var
   olan çeviriler eklenir.
4. **`robots.ts` gerçek domain'i kullanır** (`https://www.dogancanyildiz.com`),
   `example.com` fallback'i yok, `/api/` disallow ediliyor.
5. **JSON-LD üç tip:** ana sayfada `Person` (+ `WebSite`), blog yazılarında
   `BlogPosting`, proje detayında `CreativeWork`; detay sayfalarında ayrıca
   `BreadcrumbList`.
6. **Her sayfa kendi OG kartını basar.**
7. **`NEXT_PUBLIC_SITE_URL` build'de zorunlu:** eksikse `next build` patlar.
8. **Yayın öncesi elle doğrulama zorunlu adım:** Search Console'da tek property
   (`www.dogancanyildiz.com`, sitemap oradan gönderilir), ayrıca üçüncü parti
   hreflang test aracı ve Rich Results Test.

## Gerekçe

**Cookie'den kurtulmak.** Aynı URL'in isteğe göre farklı `title`/`description`
döndürmesi cloaking'e yakın bir davranış ve statik üretimi kapatıyordu; `lang`
route param haline gelince `generateMetadata` bunu doğrudan okuyor.

**hreflang.** Kurulumların yaklaşık dörtte üçünde hata bulunduğu raporlanıyor
ve en yaygın hata eksik self-referencing tag. Her sayfa kendi dilini de
`alternates.languages` içine yazıyor.

| Sayfa | TR (kanonik, varsayılan) | EN |
| --- | --- | --- |
| Ana sayfa | `/` | `/en` |
| Hakkımda | `/hakkimda` | `/en/about` |
| Projeler | `/projeler` | `/en/projects` |
| Blog yazısı (iki dilde) | `/yazilar/<tr-slug>` | `/en/blog/<en-slug>` |
| Blog yazısı (yalnız TR) | `/yazilar/<tr-slug>` | girmez |

`x-default` her satırda TR karşılığını gösteriyor.

**`NEXT_PUBLIC_SITE_URL` neden build'i patlatıyor.** Denetim bulgusu buydu:
değişken tanımsızken `robots.ts` ve `sitemap.ts` `https://example.com`'a
düşüyordu. Yanlış domain'in üretime sızması tek bir env satırı unutulduğunda
gerçekleşebilen ve canlıda geç fark edilen bir hata sınıfı, o yüzden sessiz
fallback yerine sert kapı seçildi.

**`.sh` vs `.com`.** Google `.sh` uzantısını algoritmik olarak cezalandırmıyor;
tek risk davranışsal (teknik olmayan ziyaretçide tereddüt). Sahibi tam bu güven
notunu gerekçe göstererek `.com`'u birincil seçti. İki domain'de aynı içeriği
aynı anda yayınlamak duplicate content yaratacağı ve `canonical` tek bir
domain'e işaret etmek zorunda olduğu için hiçbir noktada denenmedi.

## Uygulama

### Metadata katmanı

`src/lib/seo/page-metadata.ts`'teki `buildPageMetadata(locale, path, options)`
tüm rotalı sayfaların ortak çağrı noktası; `title`/`description`'ı next-intl
kataloğundan alıyor, `alternates` ve tam `openGraph` nesnesini
`src/lib/seo/alternates.ts`'e devrediyor.

**Kritik davranış:** Next bir alt segmentin `openGraph`'ını miras almıyor,
üstündekini **değiştiriyor**. Bu yüzden her sayfa kendi tam `openGraph`
nesnesini kuruyor; dosya kuralına bırakılsaydı iki detay sayfası da kendi
görseli dururken jenerik kartı ilan ederdi.

### OG kartları

Üç rota: `[lang]/opengraph-image.tsx` (kimlik kartı),
`[lang]/blog/[slug]/opengraph-image.tsx` ve
`[lang]/projects/[slug]/opengraph-image.tsx`. Detay sayfaları kendi mutlak
adresini `src/i18n/navigation.ts`'teki `ogImageHref(locale, kind, slug)` ile
kuruyor. İki sayfa rotası slug bulunamazsa `notFound()` çağırıyor: aksi halde
404 veren bir slug için de 200 kart üretiliyor ve istenen yol kartın prompt
satırına birebir yazılıyordu. Kontrol handler'da, çünkü `dynamicParams = false`
metadata görsel rotalarında gerçek kartları da 404'e düşürüyor (Next
prerender manifest'ine somut yol yazmıyor).

Satori değişken (fvar/gvar) font okuyamıyor; `scripts/vendor-fonts.mjs`
fontTools ile statik TTF instance'ları üretiyor (`public/fonts/og/*.ttf`) ve
rota bunları yüklüyor. `tests/og-image.test.ts` gerçek render yapıp PNG
imzasını doğruluyor.

### JSON-LD kimlikleri

`Person` `@id` `https://www.dogancanyildiz.com/#person`, `WebSite` `@id`
`/#website`; ikisinin `url`'i locale'den bağımsız olarak varsayılan dilin kökü
(varlık kimliği tek, sayfa URL'leri locale'e duyarlı kalıyor). `BlogPosting` ve
`CreativeWork` `image` alanı sayfanın kendi OG kartının mutlak adresi, yani
`og:image` ile aynı kaynak; `publisher`/`author` `#person`'a referans;
`dateModified = updated ?? date`. Sertifikalar Person üzerinde `hasCredential`
olarak yayımlanıyor. Ortak `JsonLd` bileşeni `<` karakterini kaçırarak script
tag injection'ını engelliyor.

### Sitemap ve feed

Sitemap statik sayfaları iki locale için, proje ve yazı sayfalarını yalnızca
gerçekten var olan çeviriyle ekliyor; her girdinin `alternates.languages`'i
`getProjectLocalesByKey`/`getPostLocalesByKey`'den geliyor, yani tek dilde
çevrilmiş bir içerik diğer dile 404 veren bir hreflang linki hiç almıyor.
Statik sayfalar `lastmod` taşımıyor, içerik girdileri `updated ?? date`
taşıyor.

RSS locale başına üretiliyor (`/feed.xml` TR, `/en/feed.xml` EN) ve her sayfa
yalnızca kendi dilinin feed'ini duyuruyor. Üç uygulama detayı kayda değer:

- Her `<item>` `<media:content>` ile sayfanın kendi kartını taşıyor;
  namespace kök `<rss>` öğesinde, çünkü tanımsız bir önek tek öğeyi değil
  belgenin tamamını bozuyor. `<enclosure>` seçilmedi: `length` niteliği
  dosyanın bayt boyutu ve kart istek anında üretilen bir metadata görsel
  rotası, o sayıyı doldurmak build sırasında her PNG'yi indirmek demekti.
  Kanal seviyesinde `<image>` yok, RSS 2.0 onu 144x400 px ile sınırlıyor.
- Guid `tag:dogancanyildiz.com,2026:post/<locale>/<translationKey>` (RFC 4151
  tag URI), `<link>` gerçek URL'i taşımaya devam ediyor. Tarih bileşeni
  (`2026`) kalıcı sabit sözleşme: değişirse tüm guid'ler ikinci kez döner ve
  her aboneye arşiv yeniden teslim edilir. `tests/seo/feed.test.ts` bunu
  literal dizeyle kilitliyor.
- `/feed.xml`'in dili değişti (öneksiz feed artık Türkçe) ve aynı adres iki
  dilin kanoniği olamayacağı için eski aboneler yönlendirilemiyor; kanal
  başlıkları locale'e göre ayrışıyor.

### Bilinçli kabuller

- Kök canonical ve hreflang eğik çizgisiz, sitemap `loc`'u eğik çizgili;
  tutarlılık iddiası yok.
- `/cv/*` `X-Robots-Tag: noindex, nofollow` taşıyor (`robots.ts` değişmedi).
- Sitemap'te satır bazında `x-default` anahtarı var, ama sayfa
  `<head>`'indeki `alternates.languages` ile aynı kaynaktan geliyor.

## Riskler ve tripwire'lar

| Risk | Tripwire |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` unutulur, sitemap yanlış domain üretir | Build patlıyor (`src/lib/env.ts`), sessiz fallback yok |
| Eksik self-referencing hreflang cluster'ı yok saydırır | Search Console Coverage + bağımsız hreflang aracı, sayfa sayfa |
| `setRequestLocale` unutulan sayfa sessizce dinamikleşir, metadata build-time üretilmez | `npm run verify:routes` CI'da |
| Çevrilmemiş slug sitemap'e veya `alternates.languages`'e sızar | Fixture tabanlı testler (`tests/seo/**`) |
| `openGraph` miras alınmıyor, alt sayfa jenerik kart ilan eder | Her sayfa kendi tam nesnesini kuruyor; `tests/pages/**` kilitliyor |

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [04-i18n.md](./04-i18n.md) - URL şeması, 308 tabloları, OG kart sonek kuralı
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md) - OG kartının görsel düzeni
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md) - JSON-LD'yi besleyen içerik
- [11-acik-isler.md](./11-acik-isler.md) - Search Console ve hreflang canlı doğrulaması

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://developers.google.com/search/docs/appearance/structured-data/profile-page
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://www.dchost.com/blog/en/hreflang-done-right-the-calm-guide-to-cctlds-subdirectories-subdomains-and-x-default/
- https://miaoosi.com/en/writing/nextjs-i18n-seo-observability
