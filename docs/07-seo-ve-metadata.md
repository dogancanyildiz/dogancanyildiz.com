# SEO, Metadata ve Yapılandırılmış Veri
Durum: Uygulandı (Faz 2 ve Faz 4; 2026-08-28 denetim kapanışı; **2026-08-30, PR #36:** TR varsayılan, x-default ve JSON-LD kimlikleri TR köküne, eski EN yolları 308; 2026-09-02 3. tur: TR kelime sayımı Unicode'a geçti, çeviri paritesi testle kilitlendi), kalan: Search Console ve hreflang canlı doğrulaması · Karar: 2026-08-27 · Güncelleme: 2026-09-02 · Kapsam: dogancanyildiz.com

## Özet

Mevcut kurulumda `generateMetadata` cookie okuyor, `alternates` (canonical/languages) hiç yok, `openGraph` yalnızca title/description/type veriyor, `metadataBase` tanımsız ve `robots.ts` ile `sitemap.ts` set edilmemiş `NEXT_PUBLIC_SITE_URL` durumunda `https://example.com`'a düşüyor. Kod tabanında hiçbir JSON-LD yok. Bu doküman, [04-i18n.md](./04-i18n.md)'de kararlaştırılan `app/[lang]` + next-intl mimarisi üzerine kurulan metadata, sitemap, robots ve yapılandırılmış veri kurallarını tanımlar. Kapsam dışı kalan her şey (URL prefix stratejisinin kendisi, çeviri eksikliğinde sayfa üretmeme kararı) [04-i18n.md](./04-i18n.md)'e, içerik kaynağının hazırlanması [08-icerik-stratejisi.md](./08-icerik-stratejisi.md)'e link verilir, burada tekrar edilmez.

## Karar(lar)

1. **`generateMetadata` yalnızca `lang` route param'ından üretilir**, `cookies()` çağrısı kalkar. `metadataBase` kök layout'ta `new URL(process.env.NEXT_PUBLIC_SITE_URL)` olarak tanımlanır; `NEXT_PUBLIC_SITE_URL` eksikse build patlar (aşağıdaki tablo).
2. **`alternates.canonical` + `alternates.languages` + `x-default`** her sayfada set edilir. **Karar değişikliği (2026-08-30):** `x-default` Türkçe (varsayılan dil) kökünü işaret eder.
3. **`sitemap.ts` iki locale için de girdi üretir**, yalnızca gerçekten var olan çeviriler eklenir; çevirisi olmayan slug o dilin sitemap'ine hiç girmez.
4. **`robots.ts` gerçek domain'i kullanır** (`https://dogancanyildiz.com`), `example.com` fallback'i kaldırılır.
5. **JSON-LD üç tip için eklenir**: ana sayfada `Person`, blog yazılarında `BlogPosting`, proje detayında `CreativeWork`.
6. **`opengraph-image.tsx` ve `icon.tsx` yeniden yazılır**: gerçek isim/unvan/palet, "Alex Chen" ve "P" monogramı kalkar.
7. **`.com` birincil domain**, `.sh` yalnızca 301 hedefi. **Karar değişikliği (2026-08-27):** bu maddenin tarihsel metni ".sh birincil domain kalır, .com yalnızca 301 hedefi (öneri, sahibinin kesin onayı bekliyor)" idi; sahibinin 2026-08-27 kararıyla yön tersine döndü, aşağıdaki tam ihtimal aynen gerçekleşti (bkz. [11-acik-sorular.md](./11-acik-sorular.md) soru 5). SEO cezası yok, marka/güven notu var (Gerekçe'de). İki domain'de aynı içeriği aynı anda yayınlamak (`.sh` ve `.com`'un ikisinin de canlıda tam site sunması) **kesinlikle yapılmaz**, çünkü bu duplicate content yaratır ve `alternates.canonical` tek bir domain'e işaret etmek zorundadır. Yalnızca yönlendirmenin yönü ve `NEXT_PUBLIC_SITE_URL` değişti, `generateMetadata`/`sitemap.ts`/`robots.ts` kodu dokunulmadan kaldı.
8. **`NEXT_PUBLIC_SITE_URL` Coolify'da zorunlu Build-time env** olur, `.env.example`'a eklenir.
9. Yayın öncesi **Search Console + hreflang test aracıyla elle doğrulama** zorunlu adım. Search Console'da **iki ayrı property** açılır: `dogancanyildiz.com` ana property olarak sitemap gönderir ve indeksleme burada izlenir; `dogancanyildiz.sh` yalnızca yönlendirme sağlığını izlemek için ikinci bir property olarak eklenir (sitemap gönderilmez, herhangi bir sayfası indekslenmeye çalışılmaz), amacı yalnızca eski bağlantıların/301'in Google tarafında doğru işlendiğini Coverage raporunda görebilmektir.

## Gerekçe

**`generateMetadata` ve cookie sorunu.** Şu anki `layout.tsx`, `NEXT_LOCALE` cookie'sini okuyup aynı URL için farklı `title`/`description` döndürüyor (layout.tsx:10-13 ve :30-31). Aynı URL'in isteğe göre farklı içerik döndürmesi cloaking'e yakın bir davranış ve statik üretimi kapatıyor (build çıktısında 11 route'un 8'i dynamic). `app/[lang]` geçişiyle `lang` artık route param, `generateMetadata(props)` bunu doğrudan okuyabiliyor; `cookies()`'e ihtiyaç kalmıyor.

**`alternates` ve hreflang.** hreflang uyuşmazlıklarının çoğu eksik self-referencing tag'den kaynaklanıyor; hreflang kurulumlarının yaklaşık %75'inde hata bulunduğu raporlanıyor (dchost.com). URL şeması [04-i18n.md](./04-i18n.md)'de karara bağlandı: `localePrefix: 'as-needed'`; **2026-08-30'dan beri TR kökte prefix'siz, EN `/en` altında** (tarihsel karar metni tersiydi, aşağıdaki tablo günceldir). Örnek URL tablosu:

| Sayfa | TR (kanonik, varsayılan) | EN | x-default |
|---|---|---|---|
| Ana sayfa | `https://dogancanyildiz.com/` | `https://dogancanyildiz.com/en` | `https://dogancanyildiz.com/` |
| Hakkımda | `https://dogancanyildiz.com/hakkimda` | `https://dogancanyildiz.com/en/about` | `https://dogancanyildiz.com/hakkimda` |
| Projeler | `https://dogancanyildiz.com/projeler` | `https://dogancanyildiz.com/en/projects` | `https://dogancanyildiz.com/projeler` |
| Blog yazısı (iki dilde) | `https://dogancanyildiz.com/blog/<slug>` | `https://dogancanyildiz.com/en/blog/<slug>` | `https://dogancanyildiz.com/blog/<slug>` |
| Blog yazısı (yalnız TR) | `https://dogancanyildiz.com/blog/<slug>` | girmez | `https://dogancanyildiz.com/blog/<slug>` |

Her sayfa kendi dilini de `alternates.languages` içine yazar (self-referencing), aksi halde Google eksik cluster'ı yok sayabiliyor.

**`metadataBase` ve `NEXT_PUBLIC_SITE_URL`.** Denetim bulgusu B6 ([01-mevcut-durum-denetimi.md](./01-mevcut-durum-denetimi.md)): `robots.ts:9` ve `sitemap.ts:4` bu değişken tanımsızsa `https://example.com`'a düşüyor, değişken `.env.example`'da hiç yok. Karar bunu build'i patlatan bir kontrole çevirmeyi zorunlu kılıyor: yanlış domain'in production'a sızması (sitemap'in tamamının `example.com` altında oluşması) tek bir env satırı unutulduğunda gerçekleşebilir, bu kabul edilemez bir sessiz hata sınıfı. `NEXT_PUBLIC_SITE_URL` Coolify'da **Build** değişkeni olarak işaretlenir (Runtime değil), çünkü `NEXT_PUBLIC_*` değerleri `next build` sırasında client bundle'a gömülür; yalnızca Runtime işaretlenirse üretimde sessizce `undefined` dolaşır ([06-devops-ve-deploy.md](./06-devops-ve-deploy.md)).

**`openGraph.images`.** Mevcut `opengraph-image.tsx` sabit "Portfolio" etiketi, "Building clean, fast experiences for the web" başlığı ve "React · Next.js · TypeScript" alt metniyle jenerik (opengraph-image.tsx:54, :66-69, :79); `icon.tsx` yalnızca siyah zemin üstünde "P" harfi gösteriyor (icon.tsx:23). Her sayfanın `openGraph.images`'ı bu route'a bağlanır; route gerçek isim/unvan (Full-Stack + DevOps Engineer, Konya) ve [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md)'de kararlaştırılan nötr palet + tek emerald aksanla yeniden yazılır. `icon.tsx` gerçek baş harfler (DCY) ile değiştirilir.

**JSON-LD kapsamı.**
- **Person** (ana sayfa): isim, unvan, Konya konum bilgisi, `sameAs` ile GitHub/LinkedIn linkleri. Google'ın `ProfilePage` rehberi (developers.google.com/search/docs/appearance/structured-data/profile-page) isim aramasında Knowledge Panel olasılığını ve içerik otoritesini artırdığını belirtiyor; kod tabanında şu an `application/ld+json` referansı sıfır (grep sonucu boş).
- **BlogPosting** (blog yazıları): başlık, tarih, yazar (Person'a referans), açıklama.
- **CreativeWork** (proje detayları): başlık, açıklama, rol/stack alanları; `Person` ile `author`/`creator` ilişkisi kurulur.

Üçü de ucuz ve doğrudan getirisi olan bir kazanç; atlamak için bir sebep yok.

**`.sh` vs `.com` SEO notu.** Google `.sh` uzantısını algoritmik olarak cezalandırmıyor, marka uyumu SEO'dan daha belirleyici; geliştirici kitlesi için `.sh` "teknik kimlik" sinyali veriyor, `.com` ise teknik olmayan ziyaretçiler için evrensel güven taşıyor (kaynak: darazhost.com, wix.com). Tek risk davranışsal bir dönüşüm sorunu (İK/işveren tarafı tereddüt edebilir), algoritmik bir SEO cezası değil. **Karar değişikliği (2026-08-27):** sahibi tam da bu güven notunu gerekçe göstererek `.com`'u birincil domain seçti; tarihsel karar metni `.sh` birincil, `.com` 301 hedefi yönündeydi. `dogancanyildiz.sh -> dogancanyildiz.com` 301'i [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)'de artık birincil olarak Cloudflare Redirect Rules seviyesinde, dil prefix'ine dokunmadan tek atlamada tanımlanıyor (Traefik'teki karşılığı yalnızca yedek yol); bu doküman yalnızca sonucun `sitemap.ts`/`robots.ts`'te tek doğru domain (`.com`) olarak yansıdığını doğrular.

**robots.ts.** Gerçek domain'i sabit yazar, `example.com` fallback'i tamamen kalkar; `sitemap: https://dogancanyildiz.com/sitemap.xml` üretir.

## Reddedilen alternatifler (neden)

- **Metadata'yı cookie'den üretmeye devam etmek**: aynı URL'in isteğe göre farklı title döndürmesi cloaking'e yakın davranış, ayrıca statik üretimi kapatıyor. [04-i18n.md](./04-i18n.md)'deki cookie-tabanlı i18n reddiyle aynı gerekçeye dayanır.
- **JSON-LD'yi atlamak**: ucuz, düşük riskli, doğrudan SEO getirisi var; atlamanın hiçbir tasarruf gerekçesi yok.
- **`NEXT_PUBLIC_SITE_URL` eksikse sessizce `example.com`'a düşmeye izin vermek**: mevcut davranışın ta kendisi, canlıda tespit edilmesi zor bir hataya (yanlış domain'li sitemap) yol açtığı denetimde doğrulandı (bulgu B6); build'i patlatan zorunlu kontrole çevrildi.
- **Çevirisi olmayan içerik için fallback sayfa üretip sitemap'e eklemek**: bilinen bir çok dilli SEO hatası ("fallback sayfaların indekslenmesi", miaoosi.com); [04-i18n.md](./04-i18n.md) kararıyla tutarlı biçimde reddedildi, o dilin sitemap ve `alternates.languages`'ine hiç girmiyor.
- **`.com`'u birincil domain yapıp `.sh`'yi ikincil bırakmak**: bu doküman ilk yazıldığında reddedilmişti, sahip kararı `.sh` birincil idi. **Karar değişikliği (2026-08-27):** sahibi bu alternatifi seçti; artık reddedilen değil uygulanan karar (madde 7). SEO açısından nötr olduğu için teknik gerekçe zaten hiçbir yönü zorlamıyordu, tercih sahibinindir.

## Uygulama durumu (2026-08-27)

Kararın dokuz maddesi de uygulandı, Faz 2 (`app/[lang]` + next-intl geçişi) ve Faz 4'e (içerik + SEO detayları, PR #6) yayılmış olarak.

- **`generateMetadata` cookie'den kurtuldu, `metadataBase` ve `buildPageMetadata` (Faz 4).** `src/lib/seo/page-metadata.ts`'teki `buildPageMetadata(locale, path, options)` tüm rotalı sayfalarda ortak çağrı noktası; `title`/`description`'ı `next-intl` mesaj kataloğundan alıyor, `alternates` ve tam `openGraph` nesnesini `src/lib/seo/alternates.ts`'teki `buildAlternates`/`buildOpenGraph`'a devrediyor. Kod yorumunda kararın 22. satırdaki gerekçesiyle aynı uyarı tekrarlanıyor: Next bir alt segmentin `openGraph`'ını miras almıyor, üstündekini **değiştiriyor**; bu yüzden her sayfa kendi tam `openGraph` nesnesini kuruyor (kararda öngörülmeyen ama doğrudan sonucu olan bir uygulama detayı).
- **`alternates.canonical` + `languages` + `x-default` (Faz 2/4).** `buildAlternates` her locale için self-referencing bir `languages` girdisi üretiyor, `x-default` önce `en`'i tercih ediyordu; **2026-08-30'dan beri önce `routing.defaultLocale`'i (tr)**, yoksa `availableLocales[0]`'i, o da yoksa mevcut locale'i tercih ediyor (`src/lib/seo/alternates.ts`).
- **`sitemap.ts` iki locale, yalnızca var olan çeviriler (Faz 4).** `src/app/sitemap.ts` statik sayfaları (`/`, `/about`, `/projects`, `/blog`, `/contact`) iki locale için, proje/yazı sayfalarını `getProjects(locale)`/`getPosts(locale)` üzerinden yalnızca gerçekten var olan çeviriyle ekliyor; her girdinin `alternates.languages`'i `getProjectLocales`/`getPostLocales`'ten geliyor, yani tek dilde çevrilmiş bir proje diğer dile 404 veren bir hreflang linki hiç almıyor. Toplam **24 URL** (5 statik sayfa x 2 locale + 5 proje x 2 locale + 1 EN yazı + 3 TR yazı). **Açık kalan tek fark**: bu sitemap girdilerinin `alternates.languages` map'inde `x-default` anahtarı hiç yok (yalnızca `buildAlternates`'teki sayfa-level `<link rel=alternate>` etiketlerinde var); bu, Faz 4'ten Faz 5'e devredilen "sitemap x-default" maddesi (`docs/plans/handoffs/faz-4-manual-checklist.md` adım 4).
- **`robots.ts` gerçek domain (Faz 4).** `example.com` fallback'i tamamen kalktı; `src/app/robots.ts` `siteUrl()`'den okuyor (bu değişken build'de zorunlu, Faz 0'dan beri `src/lib/env.ts` bunu garantiliyor), `/api/` disallow ediliyor, `sitemap`/`host` alanları set.
- **JSON-LD üç tip (Faz 4).** `src/components/seo/person-jsonld.tsx` (`Person`, ana sayfa), `src/app/[lang]/projects/[slug]/page.tsx` içinde `CreativeWork`, `src/app/[lang]/blog/[slug]/page.tsx` içinde `BlogPosting`; ortak `JsonLd` bileşeni (`src/components/seo/json-ld.tsx`) `<` karakterini `<`'ye kaçırarak script tag injection'ını engelliyor.
- **`opengraph-image.tsx` ve `icon.tsx` yeniden yazıldı (Faz 3/4).** `icon.tsx` artık koyu zemin üstünde emerald `DCY` monogramı; "Alex Chen"/"P" kalıntısı kod tabanında sıfır (`tests/no-template-residue.test.ts` bunu garanti ediyor). `opengraph-image.tsx` locale başına üretiliyor (`generateImageMetadata`), gerçek isim/unvan ve `03-tasarim-ui-ux.md`'deki nötr palet + emerald aksanı kullanıyor.
- **`.com` birincil domain, `.sh` yalnızca 301 hedefi.** **Karar değişikliği (2026-08-27):** tarihsel durum burada `.sh` birincil olarak kayıtlıydı; sahibinin son kararıyla `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.com` (`.env.example`) oldu, tüm `absoluteUrl`/`sitemap`/`robots` çıktısı bu domain'e sabit. `.sh -> .com` 301'i Cloudflare Redirect Rules'ta hazır ama henüz canlıya alınmadı (bkz. [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)); iki domain'in aynı anda tam site sunması hiçbir noktada uygulanmadı/denenmedi.
- **`NEXT_PUBLIC_SITE_URL` Coolify Build-time env.** `src/lib/env.ts` bu değişken build'de eksikse `next build`'i patlatıyor (kararda tarif edilen "build'i patlatan zorunlu kontrol" aynen uygulandı), ayrıca http(s) origin formatını doğruluyor. `.env.example`'a eklendi.
- **Yayın öncesi elle doğrulama**: henüz yapılmadı. Search Console kaydı (iki property: `.com` ana, `.sh` yalnızca yönlendirme izleme), sitemap gönderimi, üçüncü parti hreflang test aracı taraması ve Lighthouse SEO kontrolü `docs/plans/handoffs/faz-4-manual-checklist.md`'de sahibinin bekleyen adımları arasında; hepsi canlı URL gerektiriyor, staging/PR preview'da tam doğrulanamıyor.

**RSS eklentisi (kararda yoktu, Faz 4'te eklendi).** `buildAlternates` her sayfaya kendi locale'inin `/feed.xml`'ine (2026-08-30 sonrası: TR feed kökte `/feed.xml`, EN `/en/feed.xml`; `/tr/feed.xml` 308 ile köke düşer) bir `application/rss+xml` keşif linki ekliyor; `src/app/[lang]/feed.xml/route.ts` locale başına RSS üretiyor. Bu, kararın kapsamında yazılmamış ama JSON-LD ile aynı "ucuz, doğrudan getirisi olan" mantığa uyan bir ek.

## Uygulama durumu (2026-08-28)

Dal `feature/audit-closure`; kanıt `src/app/[lang]/opengraph-image.tsx`, `src/lib/seo/**`, `src/components/seo/**`, `src/app/sitemap.ts`, `tests/seo/**`.

- **OG görseli düzeldi (denetimin kritik bulgusu).** Rota üretimde 500 veriyordu: satori değişken (fvar/gvar) font okuyamıyor. `scripts/vendor-fonts.mjs` fontTools ile Geist'in wght 400 ve 600 statik TTF instance'larını üretiyor (`public/fonts/og/*.ttf`), rota bunları yüklüyor; `tests/og-image.test.ts` gerçek render yapıp PNG imzasını doğruluyor. Eski `public/fonts/og/*.woff` kopyaları ölü, temizlenecek.
- **Başlıklar.** `metadata.defaultTitle` "Doğan Can Yıldız | Full-Stack Web Developer and DevOps Engineer" (TR karşılığı), `metadata.siteName` yalın ad; alt sayfa `og:title` `"<başlık> | <siteName>"`, ana sayfa `buildPageMetadata(..., { absoluteTitle: true })` ortak yolunda. TR varsayılan açıklama 155 karakterin altında, iletişim açıklamaları 120-155.
- **JSON-LD kimlikleri.** Person `@id` `https://dogancanyildiz.com/#person`, WebSite `@id` `/#website` (ana sayfada, locale başına `inLanguage`), ikisinin `url`'i locale'den bağımsız olarak varsayılan dilin kökü (2026-08-30'dan beri TR kökü `https://dogancanyildiz.com/`; varlık kimliği tek, sayfa URL'leri locale'e duyarlı kalır). BlogPosting `image` (OG görselinin mutlak adresi), `publisher`/`author` `#person`'a referans, `dateModified = updated ?? date`; blog ve proje detaylarında `BreadcrumbList`; `buildOpenGraph` `article:author`, `article:tag`, `modified_time` üretiyor. `person-jsonld` ortak `JsonLd` bileşenini kullanıyor.
- **Sitemap.** Statik sayfalar `lastmod` taşımıyor; içerik girdileri `updated ?? date`. `x-default` Faz 5'ten beri var; tek dilli içerik sızmaz (fixture ile test, `tests/seo/**`). RSS rotası her locale için 200 + XML parse + item sayısı testiyle doğrulanıyor.
- **Bilinçli kabuller.** Kök canonical/hreflang eğik çizgisiz, sitemap `loc`'u eğik çizgili (tutarlılık iddiası yok, F-154). **2026-08-30 güncellemesi (F-155'in tersine dönüşü):** `/en/*` artık kanonik İngilizce adres; fazla `/tr/*` önekleri ve eski öneksiz İngilizce nav yolları kalıcı 308 ile yeni kanonik adrese gider (`src/i18n/legacy-en-paths.ts` + proxy). **CV indekslenmez:** `/cv/*` `X-Robots-Tag: noindex, nofollow` (karar, `robots.ts` değişmedi).
- **Hata sınırları.** `src/app/[lang]/error.tsx` (client, next-intl `errorPage` namespace'i, Next 16.3'ün kararlı `retry` prop'u) ve `src/app/global-error.tsx` (kendi html/body, fontlar).
- **Canlı doğrulama hâlâ yok:** Search Console, hreflang aracı, paylaşım önizlemesi ve Rich Results Test site 526 verdiği için koşulmadı.

## Uygulama durumu (2026-09-02)

- **Eski öneksiz `/blog` listesi yönlendirilmiyor (bilinçli kabul, V-5).** `/blog` iki dilde de aynı yol olduğu için öneksiz adres artık Türkçe listenin kanoniği; 308 tablosuna eklenmesi kanonik sayfayı kendi adresinden sürerdi. Eski İngilizce `/blog` sıralaması bu yüzden Türkçe listeye düşüyor, İngilizce giriş noktası `/en/blog`. Tam gerekçe ve reddedilen "tek dilli slug'ı `/en/blog/<slug>`'a yönlendir" seçeneği: [04-i18n.md](./04-i18n.md), "Eski öneksiz `/blog` yönlendirilmiyor".
- **`/feed.xml` dil değiştirdi, yönlendirilemiyor (V-16).** TR-varsayılan geçişinden önce öneksiz `/feed.xml` İngilizce feed'di, şimdi Türkçe feed. Aynı adres iki dilin kanoniği olamayacağı için eski aboneler için bir yönlendirme yok: İngilizce takip etmek isteyen `/en/feed.xml`'e kendi geçmek zorunda. Yumuşatma, feed'i tanınır kılmak: kanal başlığı ve her sayfanın `<link rel="alternate" type="application/rss+xml">` başlığı artık locale'e göre ayrışıyor ("Doğan Can YILDIZ · Yazılar" ve "Doğan Can YILDIZ · Writing"), `<language>` öğesi zaten locale'i yazıyordu. İki feed de prerender ediliyor (`scripts/assert-static-routes.mjs`) ve her sayfa yalnızca kendi dilinin feed'ini duyuruyor. Sahibi isterse tek seferlik bir duyuru yazısı geçişi feed içinden de anlatabilir; bu bir içerik kararı, kod değil.
- **Türkçe kelime sayımı Unicode'a geçti.** Velite'ın varsayılan `s.metadata()`'sı kelimeleri `/[a-zA-Z]+/` ile sayıyordu, yani `"Türkiye"` iki kelime (`"T"` + `"rkiye"`) sayılıyordu; TR yazılarda kelime sayısı ve okuma süresi yüzde 40-47 şişikti, bu sayı `BlogPosting` JSON-LD'sinde `wordCount` olarak da yayınlanıyordu. `velite.config.ts` artık Unicode `\p{L}\p{N}` kelime sınıfıyla kendi metadata'sını hesaplıyor (265 wpm). Test: `tests/content-schema.test.ts` "reading metadata" bloğu.
- **Çeviri paritesi ve yayın tarihi artık testle kilitli.** Bir projenin `featured`/`order`/`year`/`draft`/`links` alanları veya bir yazının yayın tarihi iki dil dosyasında ayrışırsa `tests/content-layer.test.ts` kırmızı verir; önceden şema bunu hiç kontrol etmiyordu.

## Riskler ve tripwire'lar

| Risk | Tripwire / doğrulama | Kaynak |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` Coolify'da unutulur, sitemap yanlış domain üretir | Build script'inde env kontrolü: değişken yoksa `next build` başarısız olsun | [01-mevcut-durum-denetimi.md](./01-mevcut-durum-denetimi.md) B6 |
| `alternates.languages` içinde self-referencing tag eksik kalır, hreflang cluster'ı Google tarafından yok sayılır | Yayın öncesi Search Console'da Coverage + International Targeting raporu, ayrıca bağımsız bir hreflang test aracıyla her sayfa tek tek kontrol | dchost.com |
| `setRequestLocale` bir sayfada unutulursa route sessizce dynamic'e düşer, `generateMetadata` build-time üretilmez | Build çıktısında route listesi kontrol edilir: yalnızca `/api/*` dynamic kalmalı ([04-i18n.md](./04-i18n.md) doğrulama adımıyla aynı) | [10-yol-haritasi.md](./10-yol-haritasi.md) Faz 2 |
| Çevrilmemiş bir slug yanlışlıkla sitemap'e veya `alternates.languages`'e sızar | Velite şeması ile sitemap üretimi arasında slug listesi kesişimi test edilir; iki dilde de var olmayan slug hiçbir çeviri alternate'i almaz | [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) |
| `next/root-params` Route Handler ve Server Action'da desteklenmiyor; contact route'u locale'i başka yoldan almalı | `/api/contact` içinde locale request header'dan veya form alanından elle taşınır, `root-params`'a güvenilmez | [02-stack-karari.md](./02-stack-karari.md), [04-i18n.md](./04-i18n.md) |
| `.sh` uzantısının teknik olmayan ziyaretçide dönüşüm tereddütü yaratması | **Karar değişikliği (2026-08-27):** `.com` artık birincil domain olduğu için bu risk büyük ölçüde ortadan kalktı, `.sh` yalnızca 301 hedefi; yine de kalan bir dönüşüm ölçümü Faz 5'teki Umami analytics'e bırakılır | [08-icerik-stratejisi.md](./08-icerik-stratejisi.md) |

## Uygulama notları

- `generateMetadata` imzası: `generateMetadata({ params }: { params: Promise<{ lang: string }> })` (Next 16 async params kuralı); `setRequestLocale(lang)` çağrısı her page/layout'ta [04-i18n.md](./04-i18n.md)'de tanımlanan disiplinle birlikte yapılır.
- `metadataBase` yalnızca kök `app/[lang]/layout.tsx`'te tanımlanır, alt sayfalar miras alır.
- `sitemap.ts` iki ayrı döngü çalıştırır (en, tr), her locale için yalnızca o locale'de MDX dosyası bulunan proje/blog slug'ları eklenir; `alternates` alanı sitemap girdisinde de (Next 16 `sitemap.ts` desteği varsa) veya en azından sayfa `alternates.languages`'inde tutarlı olmalı.
- `robots.ts`: `sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml``, `rules: { userAgent: '*', allow: '/' }`; `/api/*` disallow edilir.
- JSON-LD, sayfa içine `<script type="application/ld+json">` olarak Server Component'ten inject edilir; `dangerouslySetInnerHTML` kullanılıyorsa içerik `JSON.stringify` ile üretilir, kullanıcı girdisi karışmaz (contact formu bu akışa hiç girmiyor, risk yok).
- Yayın öncesi kontrol listesi ([10-yol-haritasi.md](./10-yol-haritasi.md) Faz 4 ile aynı): Google Search Console'da iki domain property'si açılır (`dogancanyildiz.com` ana property, `dogancanyildiz.sh` yalnızca 301 sağlığını izlemek için), `.com` property'sinde her iki locale de URL prefix olarak doğrulanır, `sitemap.xml` gönderilir, hreflang bir üçüncü parti test aracıyla (ör. Merkle/Sistrix tarzı) taranır, Lighthouse SEO skoru kontrol edilir.

## İlgili dokümanlar

- [04-i18n.md](./04-i18n.md): URL prefix stratejisi, `next-intl` kurulumu, çeviri eksikliğinde sayfa üretmeme kararı
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md): `.sh -> .com` 301'i, Coolify Build/Runtime env ayrımı
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md): Person/BlogPosting/CreativeWork için kaynak içerik
- [03-tasarim-ui-ux.md](./03-tasarim-ui-ux.md): OG image ve icon için palet/tipografi kuralları
- [09-guvenlik.md](./09-guvenlik.md): contact route locale taşıma ve genel sertleştirme
- [10-yol-haritasi.md](./10-yol-haritasi.md): Faz 4 yayın öncesi kontrol listesi

## Kaynaklar

- [Functions: generateMetadata | Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Profile Page (ProfilePage) Schema Markup | Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [The Hreflang Complete Guide 2026 (with Next.js Examples)](https://fridamarketing.com/seo/technical-seo/hreflang-complete-guide-nextjs-2026)
- [How to Use Canonical Tags and Hreflang in Next.js 16](https://www.buildwithmatija.com/blog/nextjs-advanced-seo-multilingual-canonical-tags)
- [Google Search Central - Localized Versions of your Pages](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Hreflang Done Right: ccTLDs, Subdirectories, Subdomains, X-default](https://www.dchost.com/blog/en/hreflang-done-right-the-calm-guide-to-cctlds-subdirectories-subdomains-and-x-default/)
- [Next.js Multilingual SEO: Do Not Let Fallback Pages Get Indexed](https://miaoosi.com/en/writing/nextjs-i18n-seo-observability)
- [.sh Domain Explained: Is It Worth It for Your Project?](https://www.darazhost.com/sh-domain-why-developers-love-the-shell-script-tld-and-when-to-use-it/)
- [What's the best domain extension for a personal website? - Wix](https://www.wix.com/blog/best-domain-extension-for-personal-website)
