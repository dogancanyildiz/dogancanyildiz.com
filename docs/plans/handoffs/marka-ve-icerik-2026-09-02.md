# Devir notu: marka ve içerik turu (2026-09-02)

Durum: Uygulandı, dal `feature/brand-assets` · Taban: PR #44'ün merge commit'i
`c0156c0` (`dev`) · 62 commit, HEAD `a03fa4b`
Push yok, PR yok. Ana ağaçta tek yazar çalıştı; kaynak sahibinin Claude Design
export'u (`.local/export/`, gitignore altında).

Bu not dokuz iş kalemini, her kalemin commit'lerini, alınan kararları ve
gerekçelerini, görsel onay bekleyen değişiklikleri, sahibinin panel adımlarını
ve doğrulama yöntemini kaydeder. Yaşayan karar dokümanlarındaki karşılıkları:
[../../00-ozet-ve-karar.md](../../00-ozet-ve-karar.md) "Uygulama durumu
(2026-09-02, marka ve içerik turu)", [../../03-tasarim-ui-ux.md](../../03-tasarim-ui-ux.md),
[../../04-i18n.md](../../04-i18n.md), [../../05-backend-icerik-ve-servisler.md](../../05-backend-icerik-ve-servisler.md),
[../../07-seo-ve-metadata.md](../../07-seo-ve-metadata.md),
[../../08-icerik-stratejisi.md](../../08-icerik-stratejisi.md). Yerelleştirilmiş
yolların kendi ayrıntılı devir notu zaten var: [yerel-yollar-2026-09-02.md](./yerel-yollar-2026-09-02.md);
bu not madde 8'de ona atıf yapar, tekrar etmez.

## 1. Marka paketi

Sahibinin logo export'u statik dosyalara ve React SVG'ye dönüştü, OG kartı
sahibinin referans düzenine göre yeniden çizildi.

| Commit | Konu |
| --- | --- |
| `72335dd` | `feat(brand): serve the exported brand icons as static files` |
| `b9202c5` | `feat(brand): put the real logo mark in the header` |
| `159bdb2` | `feat(og): vendor Geist Mono and Geist 700 static instances for the card` |
| `2d5f89f` | `feat(og): rebuild the social card on the owner's design reference` |
| `a7d35a3` | `feat(og): give every post and project its own social card` |
| `e300695` | `fix(og): refuse a per page card for a slug that has no content` |
| `a04d373` | `fix(seo): point the jsonld image at the page's own og card` |
| `c27c590` | `fix(seo): describe the page card in its own alt text` |
| `e9116df` | `fix(header): let the brand name ellipsize instead of wrapping` |
| `1b79700` | `test: narrow the favicon assertion to the favicon rule` |
| `82ea1b6` | `docs: correct the icon and og notes to what the build actually does` |
| `4fb5a4d` | `docs: record the brand assets in the living documents` |

**Kararlar ve gerekçe:**
- İkonlar `ImageResponse` route'undan statik dosyaya geçti (`favicon.ico`,
  `icon.png`, `apple-icon.png`): satori'nin özel yazı tipi yükleyemediği için
  eski rota logoyu yaklaşık çiziyordu, statik dosya gerçek eserin kendisi.
  İkisi de tasarım aracının yazdığı 5.7 KB'lık C2PA (`caBX`) metadata
  chunk'ından temizlenerek yeniden kodlandı; bu chunk görselin kendisinden
  büyüktü.
- Marka işareti tek bir React SVG bileşeni (iki ayrı dosya değil): harfler
  `currentColor`, imleç bloğu `fill-primary`. İki temayı tek dosyayla
  karşılamak, tema sınıfı gelmeden yanlış renkte bir kare gösterme riskini
  ortadan kaldırıyor.
- OG kartının ortak kodu (`src/lib/seo/og-layout.tsx`) üç rotanın hepsinde
  aynı; sayfa rotaları bulunamayan slug için `notFound()` çağırıyor
  (istenen yol prompt satırına birebir yazıldığı için bu bir güvenlik
  düzeltmesi, kozmetik değil). Filigran sağa değil sola yaslı: referans
  boyutunda kelime ~900px genişliğinde, sağa yaslanınca kadraj dışına taşıyor.

## 2. Header

| Commit | Konu |
| --- | --- |
| `e7efa54` | `fix(header): keep the controls on screen and drop the name below 420px` |
| `776bfee` | `docs(design): record the header brand rule below 420px` |
| `6365536` | `feat(header): use the owner's lockup with the name over a mono tagline` |
| `b7ca284` | `feat(brand): blink the cursor block in the header mark` |
| `9c76f7a` | `feat(header): flatten the language and theme controls, Turkish first` |

**Kararlar ve gerekçe:**
- **Tagline.** `brand.tagline` = "Full Stack · DevOps", iki katalogda aynı
  metin, `aria-hidden`; linkin erişilebilir adı yalnızca isim kalıyor.
- **480px kuralı.** Cihaz emülasyonuyla ölçüldü: 480px altında lockup (işaret
  + isim + tagline) 44px'lik kontrollerle birlikte sığmıyor. Kesim noktası
  keyfi değil, ölçülen taşma noktası; altında yalnızca işaret görünüyor, isim
  `sr-only` bir kopyayla ekran okuyucuda kalıyor.
- **İmleç.** İşaretteki yeşil blok header'da terminal imleci gibi yanıp
  sönüyor (`cursor="blink"`, 1.06s step-end); `prefers-reduced-motion`
  açıkken kapalı ve sabit. Footer'daki aynı bileşen varsayılan (`cursor`
  prop'suz) sabit kalıyor, sticky header ile footer aynı anda yanıp
  sönmesin diye.
- **Düz kontroller.** Dil değiştirici kapsül ve tema düğmesi daire olmaktan
  çıktı, sahibinin isteğiydi: pill ve daire, nav'ın düz metin diliyle farklı
  bir bileşen ailesi gibi okunuyordu. TR önce (varsayılan yerel), aktif dil
  foreground + yeşil alt çizgi.

## 3. Footer

| Commit | Konu |
| --- | --- |
| `6e08e1f` | `feat(footer): reuse the header lockup and rewrite the availability line` |

Lockup `src/components/brand/brand-lockup.tsx`'e taşındı (hook kullanmıyor,
hem client header'da hem server footer'da render oluyor). `brand.monogram`
anahtarının son okuyucusu gitti, silindi. Availability cümlesi "Yeni
projelere açığım, yazın yeter." oldu; eski mono DCY satırı ve bölüm başlığı
boyutundaki isim kalktı.

## 4. Paylaş bloğu

| Commit | Konu |
| --- | --- |
| `2d1ba85` | `feat(rss): carry each post's own card in the feed items` |
| `3287102` | `feat(share): put a page's own card on the page it belongs to` |
| `90ab924` | `fix(share): open mailto in place and wrap the copied url at word boundaries` |
| `ecbde7a` | `docs: record the feed cards and the share block` |

**Kararlar ve gerekçe:**
- **Kart kullanımı.** Her yazı/proje zaten kendi OG kartını üretiyordu ama
  onu görmeyen tek kitle, paylaşıp paylaşmayacağına karar veren okuyucuydu.
  Blok prose bittikten sonra, `ContactCta`'dan önce: parçaya ait, siteye
  değil, iletişim çağrısı son ses olarak kalıyor.
- RSS `media:content` (enclosure değil): `length` niteliği dosya boyutu ve
  kart istek anında üretiliyor, bunu doldurmak build'de her PNG'yi indirmek
  demekti.
- WhatsApp linki numarasız `wa.me` paylaşım sayfası (mevcut `whatsappHref`
  sahibiyle sohbet açardı, "paylaş"ı "bana yaz"a çevirirdi). Mailto
  `target=_blank` almıyor (bir belge değil, boş sekme bırakır).

## 5. Yazım ve yetkinlikler

| Commit | Konu |
| --- | --- |
| `a7968ed` | `content: write Full Stack without the hyphen everywhere` |
| `a6d2e74` | `feat(skills): add Tailwind CSS and C# with ASP.NET MVC` |

"Full Stack" tiresiz, büyük harfli, iki kelime; job title, sayfa başlıkları,
alt metinler, hero metriği ve deneyim rolleri iki katalogda da bu yazımı
kullanıyor. Tailwind CSS frontend grubuna, C# / ASP.NET MVC backend grubuna
eklendi; simple-icons C# ikonu vermediği için ikisi .NET logosunu paylaşıyor.

## 6. Sertifikalar v2

| Commit | Konu |
| --- | --- |
| `0249778` | `assets(badges): add the credential images the About page will serve itself` |
| `f0f8684` | `feat(profile): give every certificate a date, a link and its own badge` |
| `fecb2e1` | `feat(about): show the certificates as badges grouped under their issuers` |
| `7b7b59d` | `feat(seo): publish the certificates as credentials on the Person node` |
| `0cbf50e` | `docs: record the certificate badge delivery and close open question 2` |
| `9cc1c94` | `fix(about): name each issuer once and keep brand casing in the headings` |
| `4043d16` | `feat(certificates): ship the badge artwork at 600px` |
| `33b2b52` | `feat(certificates): add a credential preview dialog` |
| `26fe794` | `feat(certificates): print keywords and run the rows in two columns` |
| `9c15045` | `feat(about): put each school's emblem on its education row` |
| `63a80fe` | `test: cover the credential preview, the keyword lines and the school logos` |
| `1b00f77` | `fix(certificates): give the preview dialog a width, not a maximum` |
| `e5bb37c` | `fix(certificates): release the preview scroll lock without the close event` |
| `e9a303b` | `docs: record the certificate preview, the keyword line and the school marks` |
| `a03fa4b` | `docs(design): record the dialog close event quirk and the lock's owner` |

**Rozet yaklaşımı.** On üç kayıt (Hackviser CAPT, 8 Cisco, 3 IBM SkillsBuild,
Global AI Hub), verene göre gruplu, en yeniden eskiye. On birinin Credly
rozeti `public/images/badges/`e sharp ile kayıpsız yeniden kodlanarak
kondu (CSP `img-src 'self'` olduğu için hotlink imkansız), Hackviser
sertifikası kendi JPEG'i olarak byte-eşit kopyalandı. Global AI Hub'ın
doğrulama linki yok, kural gereği satır linksiz duruyor, silinmedi.

**Anahtar kelime kaynağı.** Adın altındaki muted satır kurs adını
açıklamıyor, kurs adının kendisi hattının dışındaki okura bir şey
anlatmıyor: kelimeler verenin kendi yayımladığı etiketlerden (Credly rozet
sayfalarındaki resmi etiketler, Hackviser sertifikasının kendi metni)
birebir alındı, yeniden yazılmadı, uydurulmadı. En çok altı;
`withCheckedCertificates` eksik satırı, altıdan fazlasını, boş etiketi ve
iki dil arasında eşleşmeyen sayıyı build sırasında düşürüyor.

**Dialog close olayı tuzağı.** Chrome, Escape ile kapatılmış bir
`<dialog>` üzerinde sonraki `close()` çağrılarında `close` olayını
göndermiyor. Kaydırma kilidi yalnızca `onClose`'a bağlı olsaydı aç, Escape,
aç, kapat sırası `body`'yi `overflow: hidden`'da bırakırdı. Kilit artık
kilidi alan yerin yanında, `close()`'u çağıran fonksiyonda bırakılıyor.
Bu, Chrome 152'de çerçevesiz düz bir `<dialog>` sayfasıyla da doğrulandı
(React'ten bağımsız, tarayıcı davranışı).

## 7. Köklü Hukuk vaka çalışması ve içerik düzeltmeleri

| Commit | Konu |
| --- | --- |
| `27338bb` | `feat(content): add the Köklü Hukuk homepage cover image` |
| `f2de3a5` | `feat(content): add the Köklü Hukuk case study in both locales` |
| `aedabe1` | `test(content): hold the project cover to the same parity rules as the rest` |
| `404a2da` | `content(projects): link the live Hubit demo` |
| `7a73af6` | `content(projects): describe the Köklü Hukuk team page as it is` |
| `f58cab1` | `content(projects): state the Köklü Hukuk outcome as a delivery, not a metric` |
| `d050a20` | `content(images): capture the Köklü Hukuk cover at 2x` |
| `b89c18f` | `content(about): describe English as the working language of the technical side` |

Altıncı proje, order 1, `featured: true`. **Outcome tarihsiz oldu:**
ilk sürüm Search Console'un son üç aylık rakamlarını (1.020 gösterim, 33
tıklama, pozisyon 11.9) alıntılıyordu; bu her ay değişecek bir anlık
görüntüydü. Nihai metin "2024 Temmuz'dan beri yayında, 2026 Temmuz'da
sıfırdan yeniden yazıldı, kendi sunucumda, CMS/veritabanı/form backend'i
yok" gibi eskimeyen bir teslim cümlesine döndü; arama dersi tarihli bir
gözlem olarak rakamsız kaldı. Kapak `content/images/koklu-hukuk-cover.jpg`
2x çekildi ve 16:9'a kırpıldı (2880x1620), ilk sürümdeki 1x çekim retina
ekranda yumuşak duruyordu.

## 8. Yerel yollar ve çeviri başına slug

Ayrıntılı devir notu: [yerel-yollar-2026-09-02.md](./yerel-yollar-2026-09-02.md).
Kısaca: her çeviri artık `translationKey` frontmatter alanıyla eşleniyor
(`slug` değil), TR tarafı tamamen Türkçe yola geçti
(`/yazilar`, `/yazilar/<tr-slug>`, `/projeler/<tr-slug>`), üç 308 tablosu
(öneksiz, `/en`, `/tr`) eski adresleri tek atlamada karşılıyor, dil
değiştirici `useParams` + `buildTranslationMap`'e geçti, feed guid
`translationKey` tabanlı tag URI'ye döndü. 31 Ağustos incelemesinin V-5
maddesi (öneksiz `/blog`'un yönlendirilmeden Türkçe listeyi sunması) bu işle
kapandı.

## 9. Kanonik host www

| Commit | Konu |
| --- | --- |
| `a34d2a1` | `fix(env): make www the canonical site host` |
| `3f8c2a1` | `docs(deploy): reverse the apex redirect to point at www` |
| `7bdb110` | `fix(docs): point every apex reference at the canonical www host` |

`NEXT_PUBLIC_SITE_URL`, security.txt Canonical satırı ve env doğrulama
hata mesajlarındaki örnek URL'ler `https://www.dogancanyildiz.com`'a
sabitlendi. Apex kayıtlı kalıyor ama edge'de (Cloudflare) www'ye 301 ile
yönlenecek; feed guid'inin tag URI otoritesi kasıtlı olarak dokunulmadı,
çünkü o kalıcı bir RFC 4151 tanımlayıcısı, çözümlenebilir bir URL değil.

## Görsel onay bekleyenler

Aşağıdakilerin hiçbiri koda bağlı değil, hepsi sahibinin tarayıcıda
görmesini bekliyor:

- Header lockup'ı (işaret + ayırıcı + isim + tagline) ve 480px altında
  yalnızca işarete düşme davranışı.
- İşaretteki yeşil bloğun header'da yanıp sönmesi (footer'da sabit).
- Düzleşen dil/tema kontrolleri (kapsül ve daire kalktı).
- Footer'ın yeni lockup'ı ve availability cümlesi.
- Yazı/proje sayfalarındaki paylaş bloğu (kart boyutu, link satırı, kopyala
  düğmesinin durum mesajı).
- Sertifika önizleme kalıbı: rozete tıklayınca açılan dialog, iki sütunlu
  liste, anahtar kelime satırı.
- Eğitim satırlarındaki okul amblemleri; **bilinen ödünleşme:** Konya Teknik
  Üniversitesi amblemi koyu temada neredeyse siyah parçasını kaybediyor,
  geriye kırmızı halka kalıyor. Arkasına beyaz plaka koymak bunu çözerdi ama
  tasarım dilinde kart/rozet kutusu yok; amblem dekoratif ve okul adı yanında
  yazılı olduğu için bilgi kaybı yok, olduğu gibi bırakıldı.
- Köklü Hukuk kapağı (ilk kapaklı proje, diğer beşi hâlâ kapaksız).
- Yeni statik favicon/OG kartları bir paylaşım önizleyicisinde (LinkedIn/Slack).

## Sahibinin panel adımları (değişmedi)

Bu turda kod dışında hiçbir panel adımı eklenmedi; mevcut liste aynen
geçerli: Coolify'da site 526 (Traefik router eksik), Cloudflare'da apex ->
www Redirect Rule'un canlıya alınması, Coolify domain listesine her iki
domain'in de eklenmesi ve Build değişkenleri
(`NEXT_PUBLIC_SITE_URL=https://www.dogancanyildiz.com`, `UMAMI_SCRIPT_URL`,
`UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_STATUS_URL`), merkezi Umami'de www kaydının
yapılması, Uptime Kuma kurulumu, SMTP env'leri, `.sh` alan adı kararı,
`enforce_admins`. Tam liste: [../../00-ozet-ve-karar.md](../../00-ozet-ve-karar.md)
"Kalanlar" ve `audit/acik-kalanlar.md` bölüm 4 (gitignored, yerel).

## Kapılar (HEAD `a03fa4b`)

| Komut | Sonuç |
| --- | --- |
| `rm -f tsconfig.tsbuildinfo && npm run typecheck` | 0 hata |
| `npm run lint` | temiz, `--max-warnings=0` |
| `npm test` | 81 dosya / 1258 test yeşil |
| `npm run format` | temiz |
| `NEXT_PUBLIC_SITE_URL=https://www.dogancanyildiz.com npm run build` | başarılı, 44 sayfa, yalnızca `/api/contact`, `/api/csp-report`, `/api/health` dynamic |
| `npm run verify:routes` | 41 içerik rotası (en: 6 proje + 3 yazı; tr: 6 proje + 3 yazı) |
| `npm run verify:docs` | 21 dosya |
| sitemap `<loc>` sayısı | 30 |

## Doğrulama yöntemi

Kod tarafı testlerin yanında iki tür kanıt üretildi:

1. **Cihaz emülasyonu (CDP).** Header/footer/paylaş bloğu/sertifika önizleme
   ölçümleri 320, 375, 420, 480, 640, 768, 810, 834, 1024, 1280 genişliklerinde
   `document.scrollWidth`in görünüm genişliğine eşit olduğu (yatay taşma yok)
   ve hedef bileşenlerin ölçülen piksel değerleri karşılaştırılarak yapıldı;
   gerçek fare tıklaması ve gerçek Escape tuşu ile aç/kapat sıraları koşuldu
   (dialog close olayı tuzağı bu şekilde bulundu).
2. **Curl matrisi (`next start`, üretim build'i).** Yerel yollar işi için 66
   adreslik bir matris (öneksiz/`/en`/`/tr` eski adresler, yeni adresler, OG
   kart adresleri, feed guid'leri, hreflang çiftleri, dil değiştiricinin
   sunucudan gelen `href`'leri) koşuldu; tam çıktı
   [yerel-yollar-2026-09-02.md](./yerel-yollar-2026-09-02.md)'de. Sertifika ve
   marka varlıkları için ayrı, daha küçük curl/CDP turları
   `docs/03-tasarim-ui-ux.md`'deki ilgili "Uygulama durumu" bölümlerinde
   kayıtlı (port numaraları dahil, ör. 3162, 3163, 3165, 3170).

## Kalanlar

- İçerik teslimatları: Konuşmalar verisi, kalan beş proje kapağı.
- Yukarıdaki tüm görsel onaylar.
- Panel adımları (değişmedi, yukarıda listelendi).
- `.sh` alan adı kararı.
