# SEO, Metadata ve Yapılandırılmış Veri
Durum: Uygulandı (Faz 2 ve Faz 4) · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Mevcut kurulumda `generateMetadata` cookie okuyor, `alternates` (canonical/languages) hiç yok, `openGraph` yalnızca title/description/type veriyor, `metadataBase` tanımsız ve `robots.ts` ile `sitemap.ts` set edilmemiş `NEXT_PUBLIC_SITE_URL` durumunda `https://example.com`'a düşüyor. Kod tabanında hiçbir JSON-LD yok. Bu doküman, [04-i18n.md](./04-i18n.md)'de kararlaştırılan `app/[lang]` + next-intl mimarisi üzerine kurulan metadata, sitemap, robots ve yapılandırılmış veri kurallarını tanımlar. Kapsam dışı kalan her şey (URL prefix stratejisinin kendisi, çeviri eksikliğinde sayfa üretmeme kararı) [04-i18n.md](./04-i18n.md)'e, içerik kaynağının hazırlanması [08-icerik-stratejisi.md](./08-icerik-stratejisi.md)'e link verilir, burada tekrar edilmez.

## Karar(lar)

1. **`generateMetadata` yalnızca `lang` route param'ından üretilir**, `cookies()` çağrısı kalkar. `metadataBase` kök layout'ta `new URL(process.env.NEXT_PUBLIC_SITE_URL)` olarak tanımlanır; `NEXT_PUBLIC_SITE_URL` eksikse build patlar (aşağıdaki tablo).
2. **`alternates.canonical` + `alternates.languages` + `x-default`** her sayfada set edilir, EN kökü işaret eder.
3. **`sitemap.ts` iki locale için de girdi üretir**, yalnızca gerçekten var olan çeviriler eklenir; çevirisi olmayan slug o dilin sitemap'ine hiç girmez.
4. **`robots.ts` gerçek domain'i kullanır** (`https://dogancanyildiz.com`), `example.com` fallback'i kaldırılır.
5. **JSON-LD üç tip için eklenir**: ana sayfada `Person`, blog yazılarında `BlogPosting`, proje detayında `CreativeWork`.
6. **`opengraph-image.tsx` ve `icon.tsx` yeniden yazılır**: gerçek isim/unvan/palet, "Alex Chen" ve "P" monogramı kalkar.
7. **`.com` birincil domain**, `.sh` yalnızca 301 hedefi. **Karar değişikliği (2026-08-27):** bu maddenin tarihsel metni ".sh birincil domain kalır, .com yalnızca 301 hedefi (öneri, sahibinin kesin onayı bekliyor)" idi; sahibinin 2026-08-27 kararıyla yön tersine döndü, aşağıdaki tam ihtimal aynen gerçekleşti (bkz. [11-acik-sorular.md](./11-acik-sorular.md) soru 5). SEO cezası yok, marka/güven notu var (Gerekçe'de). İki domain'de aynı içeriği aynı anda yayınlamak (`.sh` ve `.com`'un ikisinin de canlıda tam site sunması) **kesinlikle yapılmaz**, çünkü bu duplicate content yaratır ve `alternates.canonical` tek bir domain'e işaret etmek zorundadır. Yalnızca yönlendirmenin yönü ve `NEXT_PUBLIC_SITE_URL` değişti, `generateMetadata`/`sitemap.ts`/`robots.ts` kodu dokunulmadan kaldı.
8. **`NEXT_PUBLIC_SITE_URL` Coolify'da zorunlu Build-time env** olur, `.env.example`'a eklenir.
9. Yayın öncesi **Search Console + hreflang test aracıyla elle doğrulama** zorunlu adım.

## Gerekçe

**`generateMetadata` ve cookie sorunu.** Şu anki `layout.tsx`, `NEXT_LOCALE` cookie'sini okuyup aynı URL için farklı `title`/`description` döndürüyor (layout.tsx:10-13 ve :30-31). Aynı URL'in isteğe göre farklı içerik döndürmesi cloaking'e yakın bir davranış ve statik üretimi kapatıyor (build çıktısında 11 route'un 8'i dynamic). `app/[lang]` geçişiyle `lang` artık route param, `generateMetadata(props)` bunu doğrudan okuyabiliyor; `cookies()`'e ihtiyaç kalmıyor.

**`alternates` ve hreflang.** hreflang uyuşmazlıklarının çoğu eksik self-referencing tag'den kaynaklanıyor; hreflang kurulumlarının yaklaşık %75'inde hata bulunduğu raporlanıyor (dchost.com). URL şeması [04-i18n.md](./04-i18n.md)'de karara bağlandı: `localePrefix: 'as-needed'`, EN kökte prefix'siz, TR `/tr` altında. Örnek URL tablosu:

| Sayfa | EN (kanonik) | TR | x-default |
|---|---|---|---|
| Ana sayfa | `https://dogancanyildiz.com/` | `https://dogancanyildiz.com/tr` | `https://dogancanyildiz.com/` |
| About | `https://dogancanyildiz.com/about` | `https://dogancanyildiz.com/tr/about` | `https://dogancanyildiz.com/about` |
| Projects | `https://dogancanyildiz.com/projects` | `https://dogancanyildiz.com/tr/projects` | `https://dogancanyildiz.com/projects` |
| Blog yazısı (iki dilde) | `https://dogancanyildiz.com/blog/<slug>` | `https://dogancanyildiz.com/tr/blog/<slug>` | `https://dogancanyildiz.com/blog/<slug>` |
| Blog yazısı (yalnız TR) | girmez | `https://dogancanyildiz.com/tr/blog/<slug>` | girmez |

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
- **`alternates.canonical` + `languages` + `x-default` (Faz 2/4).** `buildAlternates` her locale için self-referencing bir `languages` girdisi üretiyor, `x-default` önce `en`'i, yoksa `availableLocales[0]`'i, o da yoksa mevcut locale'i tercih ediyor. Kararda tarif edilenden bir adım daha esnek (yalnız-TR içerikte `x-default` EN'e değil mevcut TR'ye düşebiliyor), ama satır 32'deki "yalnız TR" örnek satırıyla tutarlı: EN çevirisi yoksa `x-default` de EN'e sabit kalmıyor.
- **`sitemap.ts` iki locale, yalnızca var olan çeviriler (Faz 4).** `src/app/sitemap.ts` statik sayfaları (`/`, `/about`, `/projects`, `/blog`, `/contact`) iki locale için, proje/yazı sayfalarını `getProjects(locale)`/`getPosts(locale)` üzerinden yalnızca gerçekten var olan çeviriyle ekliyor; her girdinin `alternates.languages`'i `getProjectLocales`/`getPostLocales`'ten geliyor, yani tek dilde çevrilmiş bir proje diğer dile 404 veren bir hreflang linki hiç almıyor. Toplam **24 URL** (5 statik sayfa x 2 locale + 5 proje x 2 locale + 1 EN yazı + 3 TR yazı). **Açık kalan tek fark**: bu sitemap girdilerinin `alternates.languages` map'inde `x-default` anahtarı hiç yok (yalnızca `buildAlternates`'teki sayfa-level `<link rel=alternate>` etiketlerinde var); bu, Faz 4'ten Faz 5'e devredilen "sitemap x-default" maddesi (`docs/plans/handoffs/faz-4-manual-checklist.md` adım 4).
- **`robots.ts` gerçek domain (Faz 4).** `example.com` fallback'i tamamen kalktı; `src/app/robots.ts` `siteUrl()`'den okuyor (bu değişken build'de zorunlu, Faz 0'dan beri `src/lib/env.ts` bunu garantiliyor), `/api/` disallow ediliyor, `sitemap`/`host` alanları set.
- **JSON-LD üç tip (Faz 4).** `src/components/seo/person-jsonld.tsx` (`Person`, ana sayfa), `src/app/[lang]/projects/[slug]/page.tsx` içinde `CreativeWork`, `src/app/[lang]/blog/[slug]/page.tsx` içinde `BlogPosting`; ortak `JsonLd` bileşeni (`src/components/seo/json-ld.tsx`) `<` karakterini `<`'ye kaçırarak script tag injection'ını engelliyor.
- **`opengraph-image.tsx` ve `icon.tsx` yeniden yazıldı (Faz 3/4).** `icon.tsx` artık koyu zemin üstünde emerald `DCY` monogramı; "Alex Chen"/"P" kalıntısı kod tabanında sıfır (`tests/no-template-residue.test.ts` bunu garanti ediyor). `opengraph-image.tsx` locale başına üretiliyor (`generateImageMetadata`), gerçek isim/unvan ve `03-tasarim-ui-ux.md`'deki nötr palet + emerald aksanı kullanıyor.
- **`.com` birincil domain, `.sh` yalnızca 301 hedefi.** **Karar değişikliği (2026-08-27):** tarihsel durum burada `.sh` birincil olarak kayıtlıydı; sahibinin son kararıyla `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.com` (`.env.example`) oldu, tüm `absoluteUrl`/`sitemap`/`robots` çıktısı bu domain'e sabit. `.sh -> .com` 301'i Cloudflare Redirect Rules'ta hazır ama henüz canlıya alınmadı (bkz. [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)); iki domain'in aynı anda tam site sunması hiçbir noktada uygulanmadı/denenmedi.
- **`NEXT_PUBLIC_SITE_URL` Coolify Build-time env.** `src/lib/env.ts` bu değişken build'de eksikse `next build`'i patlatıyor (kararda tarif edilen "build'i patlatan zorunlu kontrol" aynen uygulandı), ayrıca http(s) origin formatını doğruluyor. `.env.example`'a eklendi.
- **Yayın öncesi elle doğrulama**: henüz yapılmadı. Search Console kaydı, sitemap gönderimi, üçüncü parti hreflang test aracı taraması ve Lighthouse SEO kontrolü `docs/plans/handoffs/faz-4-manual-checklist.md`'de sahibinin bekleyen adımları arasında; hepsi canlı URL gerektiriyor, staging/PR preview'da tam doğrulanamıyor.

**RSS eklentisi (kararda yoktu, Faz 4'te eklendi).** `buildAlternates` her sayfaya kendi locale'inin `/feed.xml`'ine (TR için `/tr/feed.xml`) bir `application/rss+xml` keşif linki ekliyor; `src/app/[lang]/feed.xml/route.ts` locale başına RSS üretiyor. Bu, kararın kapsamında yazılmamış ama JSON-LD ile aynı "ucuz, doğrudan getirisi olan" mantığa uyan bir ek.

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
- Yayın öncesi kontrol listesi ([10-yol-haritasi.md](./10-yol-haritasi.md) Faz 4 ile aynı): Google Search Console'da her iki locale de ayrı property/URL prefix olarak doğrulanır, `sitemap.xml` gönderilir, hreflang bir üçüncü parti test aracıyla (ör. Merkle/Sistrix tarzı) taranır, Lighthouse SEO skoru kontrol edilir.

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
