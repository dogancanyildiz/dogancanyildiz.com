# Devir notu: yerelleştirilmiş yollar ve çeviri başına slug (2026-09-02)

Durum: Uygulandı, dal `feature/brand-assets` · Taban: `d5cb0b5` · Son kod commit'i: `2b9b568`
(düzeltme turu 2026-09-02, aşağıdaki "Düzeltme turu" bölümü)
Plan: [../2026-09-02-yerel-yollar-ve-ceviri-slug.md](../2026-09-02-yerel-yollar-ve-ceviri-slug.md)
(sahibinin kararları ve sapmalar plan dosyasının başındaki iki bölümde)
Push yok, PR yok. Ana ağaçta tek yazar çalıştı.

## Kısaca ne değişti

Türkçe taraf artık uçtan uca Türkçe yolda: `/yazilar`, `/yazilar/<tr-slug>`,
`/projeler`, `/projeler/<tr-slug>`. İngilizce taraf `/en/blog/...` ve
`/en/projects/...` altında. Her çevirinin kendi diline ait slug'ı var; iki
dil arasındaki bağ artık slug değil `translationKey` frontmatter alanı.
Yayınlanmış eski adreslerin tamamı tek atlamalık 308 ile yeni kanoniğe
gidiyor. hreflang, canonical, sitemap, feed, JSON-LD, OG kartları ve dil
değiştirici aynı anahtar üzerinden kuruluyor.

Yayın etkisi: **feed guid'lerinin tamamı değişti**, abonelere üç yazı bir
kere daha teslim edilecek. Kaçınılmazdı; yeni tag URI biçimi
(`tag:dogancanyildiz.com,2026:post/<locale>/<translationKey>`) bunun
tekrarlanmamasını sağlıyor, tarih bileşeni kalıcı sabit.

## Yapılanlar (commit sırası)

| Commit | Konu |
| --- | --- |
| `19ba820` | `feat(content): key every translation by translationKey and localize the Turkish slugs` |
| `ec207ee` | `feat(i18n): serve the Turkish blog and project paths in Turkish and 308 every old address` |
| `7155d18` | `feat(seo): build canonical, hreflang, sitemap and feed urls from per locale slugs` |
| `18559ec` | `refactor(i18n): point the language switcher at per locale translation targets` |
| `5e215ca` | `docs: record the localized path scheme and close the V-5 acceptance` |
| `92205f4` | `fix(docs): describe the per slug language redirect rule the code applies` |
| `ec197c9` | `fix(i18n): answer the old Coolify slug under the new Turkish blog path` |
| bu not | `docs(plans): archive the localized path plan with the owner decisions and the result` |

İlk beşi task uygulayıcılarının, `92205f4` Task 5 incelemesinin bıraktığı iki
bloklayan bulgunun düzeltmesi, son ikisi entegrasyon turunun.

### Slug değişiklikleri

| İçerik | Eski | Yeni TR | Yeni EN |
| --- | --- | --- | --- |
| Coolify yazısı | `self-hosting-with-coolify` (iki dilde) | `coolify-ile-kendi-sunucumda` | `self-hosting-with-coolify` |
| CAPT yazısı | `capt-sinavina-hazirlik` (iki dilde) | `capt-sinavina-hazirlik` | `capt-preparation-in-a-docker-lab` |
| CCNA yazısı | `ccna-dan-web-guvenligine` (iki dilde) | `ccna-dan-web-guvenligine` | `from-ccna-to-web-security` |
| Not ortalaması | `gpa-calculator` (iki dilde) | `not-ortalamasi-hesaplayici` | `gpa-calculator` |
| Bilet sistemi | `ticket-purchasing-system` (iki dilde) | `bilet-satin-alma-sistemi` | `ticket-purchasing-system` |
| Köklü Hukuk, Cargo Pilot, Hubit, Wikonya | değişmedi | aynı | aynı |

## Doğrulananlar

### Kapılar (`ec197c9` üzerinde, hepsi yeşil)

| Komut | Çıktı |
| --- | --- |
| `npm run build:content` | `[VELITE] build finished` |
| `rm -f tsconfig.tsbuildinfo && npm run typecheck` | çıktı yok, 0 hata |
| `npm run lint` | çıktı yok, `--max-warnings=0` |
| `npm test` | `Test Files 81 passed (81)` / `Tests 1233 passed (1233)` |
| `npm run format` | `All matched files use Prettier code style!` |
| `npm run build` | başarılı, `Generating static pages (44/44)` |
| `npm run verify:routes` | `41 content routes prerendered (en: 6 projects, 3 posts; tr: 6 projects, 3 posts)` |
| `npm run verify:docs` | `Doc verification passed (21 files scanned)` |

`verify:routes` sayısı sahibinin 8 numaralı kararının beklediği gibi: dil
başına 6 proje + 3 yazı.

### Canlı curl matrisi (`PORT=3165 npm run start`, `BASE=http://localhost:3165`)

Planın "Bitti sayılma kriteri" bölümündeki matris, sahibinin kararlarına göre
uyarlanarak koşuldu (uyarlamalar aşağıda "Matriste plandan farklar").

**Eski adres -> 308, tek atlama: 33 satır, 33 geçti, 0 kaldı.** Her satırda
ilk yanıt `308`, `Location` beklenen hedef, `-L` sonrası `200` ve
`num_redirects=1`. Kapsanan sınıflar: öneksiz bölüm kökleri ve statik sayfalar
(`/blog`, `/projects`, `/about`, `/contact`, `/privacy`), öneksiz detay
adresleri (slug diline göre), `/en` önekli iki eski yazı slug'ı, `/tr` önekli
tüm bölüm ve detay adresleri, yeni Türkçe bölüm altındaki eski slug'lar.

Örnek satırlar:

```
/blog                              -> 308 /en/blog                              final 200, hops=1
/blog/capt-sinavina-hazirlik       -> 308 /yazilar/capt-sinavina-hazirlik       final 200, hops=1
/blog/self-hosting-with-coolify    -> 308 /en/blog/self-hosting-with-coolify     final 200, hops=1
/en/blog/ccna-dan-web-guvenligine  -> 308 /en/blog/from-ccna-to-web-security     final 200, hops=1
/tr/blog/self-hosting-with-coolify -> 308 /yazilar/coolify-ile-kendi-sunucumda   final 200, hops=1
/tr/projects/koklu-hukuk           -> 308 /projeler/koklu-hukuk                  final 200, hops=1
/projeler/gpa-calculator           -> 308 /projeler/not-ortalamasi-hesaplayici   final 200, hops=1
/yazilar/self-hosting-with-coolify -> 308 /yazilar/coolify-ile-kendi-sunucumda   final 200, hops=1
```

**Yeni adres -> 200: 32 satır, hepsi 200.** Altı statik sayfa x 2 dil, üç yazı
x 2 dil, altı proje x 2 dil, iki feed.

**`Link` başlığı yok (R-1):** `/yazilar/capt-sinavina-hazirlik`, `/hakkimda`,
`/en/blog/capt-preparation-in-a-docker-lab` ve `/projeler/koklu-hukuk`
yanıtlarında `grep -i '^link:'` boş. `alternateLinks: false` çalışıyor, tek
hreflang kaynağı HTML `<head>`.

**OG kartları: 11 adres, hepsi `200 image/png`.** İki genel kart, dört Türkçe
detay kartı, beş İngilizce detay kartı; Köklü Hukuk iki dilde de dahil.

**404 kalması gerekenler:**

```
404 /en/blog/coolify-ile-kendi-sunucumda   (TR slug EN tarafında)
404 /blog/nonexistent-slug
404 /yazilar/gpa-calculator                (proje slug'ı yazı bölümünde)
404 /projeler/gpa-calculator-nope
```

**Feed:** iki feed de üç `<guid isPermaLink="false">tag:...` taşıyor.

```
tag:dogancanyildiz.com,2026:post/tr/self-hosting-with-coolify
tag:dogancanyildiz.com,2026:post/tr/capt-sinavina-hazirlik
tag:dogancanyildiz.com,2026:post/tr/ccna-dan-web-guvenligine
```

Aynı üç anahtar `/en/feed.xml`'de `post/en/...` olarak. `<link>` alanları
TR feed'inde `https://dogancanyildiz.com/yazilar/...`, EN feed'inde
`https://dogancanyildiz.com/en/blog/...`.

**Sitemap:** `grep -c '<url>'` = **30**, `grep -c 'hreflang="x-default"'` = 30.
(6 statik x 2 + 6 proje x 2 + 3 yazı x 2. Plan 28 diyordu, altıncı proje
kararından önce yazılmıştı.) Türkçe girdilerin tamamı `/yazilar/...` ve
`/projeler/...` biçiminde.

**hreflang çifti** (`/yazilar/capt-sinavina-hazirlik`):

```
<link rel="alternate" hrefLang="en" href="https://dogancanyildiz.com/en/blog/capt-preparation-in-a-docker-lab"/>
<link rel="alternate" hrefLang="tr" href="https://dogancanyildiz.com/yazilar/capt-sinavina-hazirlik"/>
<link rel="alternate" hrefLang="x-default" href="https://dogancanyildiz.com/yazilar/capt-sinavina-hazirlik"/>
<link rel="canonical" href="https://dogancanyildiz.com/yazilar/capt-sinavina-hazirlik"/>
```

`/projeler/not-ortalamasi-hesaplayici`, `/projeler/koklu-hukuk` ve
`/en/blog/from-ccna-to-web-security` için de aynı şekilde doğrulandı: her
sayfa karşı dilin kendi slug'ını gösteriyor, x-default her zaman Türkçe.

**Dil değiştirici, prerender HTML'i (R-2'nin doğrudan sınavı):** sunucudan
gelen `<a>` href'leri, 15 sayfada:

```
/yazilar/capt-sinavina-hazirlik      -> /en/blog/capt-preparation-in-a-docker-lab
/yazilar/ccna-dan-web-guvenligine    -> /en/blog/from-ccna-to-web-security
/yazilar/coolify-ile-kendi-sunucumda -> /en/blog/self-hosting-with-coolify
/projeler/not-ortalamasi-hesaplayici -> /en/projects/gpa-calculator
/projeler/bilet-satin-alma-sistemi   -> /en/projects/ticket-purchasing-system
/projeler/koklu-hukuk                -> /en/projects/koklu-hukuk
/yazilar                             -> /en/blog
/projeler                            -> /en/projects
```

ve ters yönde `/en/blog/capt-preparation-in-a-docker-lab -> /yazilar/capt-sinavina-hazirlik`,
`/en/projects/gpa-calculator -> /projeler/not-ortalamasi-hesaplayici` dahil
yedi sayfa. Hiçbirinde `[slug]` sızıntısı yok.

## Matriste plandan farklar

Plan metnindeki matris, sahibinin kararlarından önce yazılmıştı. Koşulan
matris şu noktalarda uyarlandı:

1. **EN CCNA slug'ı** `what-ccna-changed-about-exposing-an-app` yerine
   `from-ccna-to-web-security` (karar 1).
2. **TR Coolify slug'ı** `coolify-ile-kendi-sunucumda-yayinda` yerine
   `coolify-ile-kendi-sunucumda` (karar 2).
3. **Öneksiz iki detay adresi** `/en`'e değil Türkçeye gidiyor (karar 3):
   `/blog/capt-sinavina-hazirlik -> /yazilar/capt-sinavina-hazirlik`,
   `/blog/ccna-dan-web-guvenligine -> /yazilar/ccna-dan-web-guvenligine`.
4. **Köklü Hukuk satırları eklendi** (karar 8): iki 308, iki 200, iki OG kartı.
5. **Sitemap beklentisi 28 -> 30**, `verify:routes` beklentisi dil başına
   5 -> 6 proje (karar 8).
6. **Dil değiştirici grep'i düzeltildi.** Plan
   `grep -o 'hreflang="en" lang="en"[^>]*'` diyor; React'in bastığı işaretleme
   `<a href="..." hrefLang="en" lang="en" ...>`, yani hem `href` önce geliyor
   hem de öznitelik adı camelCase basılıyor. Kullanılan desen:
   `grep -o '<a href="[^"]*" hrefLang="en"'`. (HTML öznitelik adları
   büyük/küçük harfe duyarsız olduğu için işaretleme geçerli, yalnızca planın
   deseni eşleşmiyordu.)

## Sapmalar

Planın kendisinden sapmalar plan dosyasının "Uygulama sonucu" bölümünde
tek tek yazılı. Entegrasyon turunda ortaya çıkan ikisi:

### 1. Sondaki eğik çizgi iki atlama, bir değil (kabul edildi)

Planın matrisi `/blog/` ve `/tr/blog/capt-sinavina-hazirlik/` için tek atlama
bekliyordu. Gerçekte iki atlama oluyor, ikisi de 308:

```
/blog/                            -> 308 /blog                            -> 308 /en/blog                        (final 200)
/tr/blog/capt-sinavina-hazirlik/  -> 308 /tr/blog/capt-sinavina-hazirlik  -> 308 /yazilar/capt-sinavina-hazirlik  (final 200)
```

Sebep: varsayılan `trailingSlash` ayarıyla Next.js eğik çizgiyi kendi 308'inde
`proxy.ts` çalışmadan önce atıyor
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`,
"Advanced Proxy flags"). `legacy-paths.ts`'teki `withoutTrailingSlash` bu
yüzden canlı yol değil, emniyet ağı. Tek atlamaya indirmek
`skipTrailingSlashRedirect: true` demek, yani sitedeki her eğik çizgiyi
proxy'nin üstlenmesi; site hiçbir yerde eğik çizgili adres yayınlamadığı için
bu kabul edildi, gerekçe `src/i18n/legacy-paths.ts` yorumuna yazıldı
(`ec197c9`). Google 308 zincirini takip eder, sinyal kaybı yok.

### 2. `/yazilar/self-hosting-with-coolify` eklendi (`ec197c9`)

Planın "404 kalmalı" bloğu bu adresin 308 vermesini bekliyordu ama satır
öneksiz tabloda yoktu, yalnızca `/tr` tablosundaydı; adres 404 veriyordu.
Aynı şekildeki `/projeler/gpa-calculator` ise tabloya alınmıştı. İkisi de
hiç yayınlanmamış adres (Türkçe bölümler 2026-09-02'ye kadar `/blog` ve
`/projects` idi) ve ikisi de aynı gerekçeyle orada: `dynamicParams = false`
altında yeni bölüm + eski slug 404 verir. Tutarsızlık tek satırla kapatıldı
ve `tests/i18n/legacy-paths.test.ts`'e ikisini birlikte kilitleyen bir case
eklendi.

## Düzeltme turu (2026-09-02)

Bağımsız inceleme iki bloklayan bulgu bıraktı, ikisi de kapatıldı.

### 1. OG kart adresleri kırıktı (`2b9b568`)

Beş yayınlanmış kart adresi 404 veriyordu: `/blog/self-hosting-with-coolify`,
`/projects/gpa-calculator`, `/projects/ticket-purchasing-system` kartları ile
iki yazının `/en/blog/<tr-slug>` kartı. Bu adresler gerçekten yayındaydı;
her detay sayfası kendi kartını `og:image` içinde adıyla ilan ediyor ve iki
feed de aynı adresi `media:content` içinde yayınlıyordu. Sayfaları taşınınca
next-intl kartları 307 ile artık var olmayan bir yola atıyordu.

`docs/04-i18n.md`'deki "next-intl bunları zaten 307 ile yeni yola taşıyor"
notu yanlış bir örnekleme üzerine kuruluydu: ölçüm slug'ı değişmemiş tek
kartla (`/blog/ccna-dan-web-guvenligine/opengraph-image/default`) yapılmıştı,
o kart zaten çalışıyordu. Kıran tek şey slug ya da bölüm değişikliğiydi.

Çözüm dördüncü bir tablo değil, `legacyRedirectTarget` içindeki sonek
kuralı: yolun sonundaki `/opengraph-image/<id>` kırpılır, gövde aynı üç
tabloda aranır, bulunursa sonek hedefe geri eklenir. Kart, sayfasıyla aynı
tek atlamayı harcar. İki sınır durumu koda ve `docs/04-i18n.md`'ye yazıldı:
bölüm sayfalarının kendi kart route'u olmadığı için kural onlara
uygulanmaz (`/blog/opengraph-image/default` 404 kalır), ve kural düz
aramadan önce denenir, yoksa `/tr` önekli kart ikinci bir atlama harcardı.

`tests/i18n/legacy-paths.test.ts`'e beş yeni case eklendi: beş kırık adresin
hedefi, her detay anahtarının kartının sayfasıyla aynı yere gitmesi, `/tr`
önekli kartın tek atlaması, kimlik ve kanonik kartların dokunulmazlığı,
bölüm sayfası kartının uydurulmaması.

Ayrıca `docs/07-seo-ve-metadata.md`'deki "eski öneksiz kart 307 ile Türkçe
karşılığına gidiyor" cümlesi bu kurala göre düzeltildi.

**Canlı ölçüm (`next start`, PORT=3165, 2026-09-02).** Üç tablodaki her
anahtar, her detay anahtarının kart varyantı ve kimlik kartları, toplam 66
adres tarandı: hepsi tek atlamada (kanonikler sıfır atlamada) 200. Kart
satırlarının içerik tipi `image/png`. Örnek:

```
/blog/self-hosting-with-coolify/opengraph-image/default
  308 -> /en/blog/self-hosting-with-coolify/opengraph-image/default   200 image/png
/en/blog/ccna-dan-web-guvenligine/opengraph-image/default
  308 -> /en/blog/from-ccna-to-web-security/opengraph-image/default   200 image/png
/tr/projects/gpa-calculator/opengraph-image/default
  308 -> /projeler/not-ortalamasi-hesaplayici/opengraph-image/default 200 image/png
/blog/opengraph-image/default                                         404 (bilinçli)
/yazilar/coolify-ile-kendi-sunucumda/opengraph-image/default          200 image/png
```

### 2. "308 tablosu (tam liste)" eksikti (`5711c51`)

`docs/04-i18n.md`'nin kendini tam liste ilan eden bölümü `LEGACY_UNPREFIXED`'i
iki tabloya bölüp 17 satırın 16'sını yazıyordu. Eksik satır
`/yazilar/self-hosting-with-coolify`; kod doğruydu, satır entegrasyon
commit'i `ec197c9` ile eklenmişti, doküman ondan önce yazılmıştı. B tablosuna
eklendi, A ve B toplamının 17 olduğu ve son üç satırın neden orada olduğu
tabloya not düşüldü.

### Kapılar (düzeltme turu sonrası)

`build:content`, `typecheck` (temiz `tsconfig.tsbuildinfo` ile), `lint`,
`test` (81 dosya, 1238 test), `format`, `build`, `verify:routes`
(41 içerik route, dil başına 6 proje + 3 yazı), `verify:docs` (21 dosya):
hepsi geçti.

## Kalanlar

- **Hidrasyon uyarısı kontrolü tarayıcıda yapılmadı.** Planın son satırı
  `/yazilar/capt-sinavina-hazirlik` ve `/projeler/not-ortalamasi-hesaplayici`
  sayfalarının tarayıcı konsolunda uyarısız açılmasını istiyor. Sunucu
  render'ının doğru href'i bastığı curl ile kanıtlandı, istemci tarafı
  `tests/i18n/*` testleriyle iki şekilde de kilitli, ama gerçek tarayıcı
  konsolu bu turda açılmadı. Sahibi ilk `npm run dev` oturumunda bakmalı.
- **PR açılmadı, push yapılmadı.** Dal `feature/brand-assets` yerel; sahibi
  `dev`'e PR açacak.
- **`docs/10-yol-haritasi.md` ve `docs/04-i18n.md`'deki tarihli geçmiş
  kayıtlarda** eski route sayıları duruyor (26 içerik route vb.). Bilinçli:
  o cümleler geçmiş bir PR'ın durumunu anlatıyor, yaşayan iddia değil.
  Yaşayan sayımlar (launch-checklist, `docs/07`) güncellendi.
- **V-6 (`.sh` 301 zinciri) ve V-7** sahipte, bu iş kapsamına girmedi.

## Sahibinin yayın sonrası adımları

1. **Search Console, sitemap.** `dogancanyildiz.com` property'sinde
   `https://dogancanyildiz.com/sitemap.xml`'i yeniden gönder. Yeni sitemap 30
   URL bildiriyor, eskisinin bildirdiği Türkçe adreslerin tamamı değişti.
2. **Search Console, eski adresler.** İlk iki hafta "Sayfalar" raporunda
   "Sayfa yönlendirmesi var" grubunu izle: eski `/blog/...` ve `/projects/...`
   adreslerinin oraya düşmesi beklenen davranış. "Bulunamadı (404)" grubunda
   `/yazilar/...` veya `/projeler/...` görürsen tabloda eksik satır var demek,
   `src/i18n/legacy-paths.ts`'e ekle.
3. **URL Denetimi aracıyla üç adres.** `/yazilar/capt-sinavina-hazirlik`,
   `/en/blog/from-ccna-to-web-security` ve `/projeler/koklu-hukuk` için
   "Canlı URL'yi test et" çalıştır; kanonik ve hreflang'in bu notta yazılan
   değerlerle aynı olduğunu gör, sonra dizine eklenmesini iste.
4. **Üçüncü parti hreflang taraması.** En az bir yazı ve bir proje sayfasını
   dışarıdan bir hreflang doğrulayıcıdan geçir; `Link` başlığının olmadığını
   ve tek hreflang kümesinin `<head>`'den geldiğini teyit et.
5. **Feed.** Üç yazının abonelere bir kere daha düşeceğini bil; şikayet
   gelirse sebebi guid biçiminin değişmesi, tekrarlamayacak.
6. **Tarayıcı kontrolü.** Yukarıdaki "Kalanlar" maddesindeki iki sayfayı aç,
   dil değiştiriciye tıkla, konsolda hidrasyon uyarısı olmadığını gör.
