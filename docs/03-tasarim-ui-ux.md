# Tasarım Yönü, UI/UX ve Frontend
Durum: Uygulandı (Faz 3, PR #5; içerik ve hero Faz 4, PR #6) · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Mevcut tema teknik olarak "Emerald" değil, Tailwind'in emerald ramp'inin oklch'e çevrilmiş hali: sRGB karşılığı light background #ecfdf5, yani emerald-50 ile birebir örtüşüyor. Ziyaretçinin tanıdığı bir framework varsayılanı premium okunmuyor, "shadcn kurulmuş" okunuyor. Buna ek olarak iki ayrı bug tasarımı sessizce geçersiz kılıyor: globals.css:161'deki h1-h4 kuralı hiç tanımlanmamış bir `--font-fraunces` değişkenine işaret ediyor ve next/font hiç yüklenmiyor (tüm başlıklar sistem fontuna düşüyor), globals.css:66 ile :69'daki `--primary` ve `--muted-foreground` aynı değerde (oklch(0.516 0.114 157.2)) olduğu için üç seviyeli metin hiyerarşisi ikiye düşmüş durumda. Üç moodboard karşılaştırıldı; **Terminal Editorial** yönü seçildi: nötr zemin, rol tabanlı bir font sistemi (Geist Sans + Geist Mono + Instrument Serif), tek sütun editoryal layout ve minimum hareket. Ops Console yönünün bento/telemetri fikri tek bir "systems" bölümü olarak bu yönün içine gömülüyor, Quiet Print yönünden yalnızca blog okuma ölçüleri alınıyor. Mobil navigasyon şu an tamamen kırık (header.tsx:44 `hidden md:flex`, footer'da sayfa linki yok) ve `prefers-reduced-motion` desteği sıfır; bu doküman bu iki kırığın da düzeltilmesini karar setine dahil ediyor.

## Karar(lar)

1. **Tasarım yönü**: Terminal Editorial (A). Nötr zemin + rol tabanlı üç fontlu tipografi + tek sütun editoryal omurga + minimum hareket.
2. **Tipografi**: Geist Sans Variable (gövde/UI) + Geist Mono Variable (etiket, yıl, stack rozeti, uptime, commit SHA, sertifika kodu) + Instrument Serif 400 (yalnızca h1 ve büyük pull quote). Üçü de `next/font/local` ile vendor edilmiş woff2 dosyalarından yüklenir, `latin` + `latin-ext` alt kümesi zorunlu.
3. **Palet**: Nötr gri/siyah-beyaz zemin, emerald tek role indirilir: link, focus ring ve "up" durumu.
4. **Layout**: Tek sütun editoryal; proje ve yazı listeleri kart değil satır (yıl · başlık · rol · stack, mono hizalı); proje detayında 4 hücreli mono künye + tam genişlik kapak; md altı için Radix Dialog tabanlı mobil menü.
5. **Hareket**: motion (eski framer-motion) LazyMotion + `m` ile, yalnızca opacity + 2-4px translate, 150-220ms, stagger 40ms ve en fazla 4 eleman; `useReducedMotion` + global `prefers-reduced-motion` CSS fallback'i zorunlu.
6. **Erişilebilirlik**: WCAG 2.2 SC 2.5.8 (24x24 CSS px minimum hedef boyutu), contact form durum mesajlarında `role="alert"` / `role="status"`, solid accent + 2px offset focus ring.

### Üç moodboard karşılaştırması

| Yön | Font çifti | Palet | Layout | Hareket | Fit |
|---|---|---|---|---|---|
| **A. Terminal Editorial** (seçilen) | Geist Sans + Geist Mono + Instrument Serif (yalnız h1/pull quote) | Nötr zemin: dark #0a0c0f, light #f9fafb; emerald tek aksan (dark #4fcc8d, light #007041) | Tek sütun editoryal, satır listeleri, mono künye, tam genişlik kapak | opacity + 2-4px translate, 150-220ms, stagger 40ms/max 4 | 9/10 |
| B. Ops Console | Inter Variable + JetBrains Mono | Grafit zemin + semantik durum renkleri (up/degraded/down) | Bento grid dashboard, kart başına ayrı mobil sıralama gerekir | Sayısal ticker'lar, transform yok | 6/10 |
| C. Quiet Print | Newsreader Variable + Geist/Inter + IBM Plex Mono | Sıcak kağıt zemini, tek kısıtlı aksan, light-first | İki sütun + sidenote, mobilde sidenote çöküyor | Neredeyse hareketsiz, crossfade | 5/10 |

Terminal Editorial'ın 9/10 fit skoru full-stack + DevOps + security kimliğine en iyi oturmasından geliyor: serif display "yazıyorum, düşünüyorum" der, mono metadata "terminalde yaşıyorum" der, nötr zemin ikisinin önüne geçmez. Ops Console kimliği en doğrudan anlatan ama en riskli yön: terminal/hacker klişesine en yakın, bento grid mobilde tek sütuna düştüğünde hiyerarşi kayboluyor ve uzun okuma (blog) bu dille çelişiyor. Quiet Print en "premium" hissi veren yön ama developer sinyali zayıf, DevOps/security kimliği tamamen içerikten çıkmak zorunda kalıyor.

**Seçilen yöne B ve C'den alınanlar**: Ops Console'un bento/telemetri fikri tüm siteye yayılmıyor, yalnızca ana sayfada tek bir "systems" bölümü olarak (Gatus'tan beslenen mono şerit, bkz. [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)) A'nın içine gömülüyor. Quiet Print'ten yalnızca blog okuma ölçüleri taşınıyor: 66ch measure, 1.6 satır yüksekliği, 18-20px gövde puntosu.

## Gerekçe

**Palet.** Mevcut tema marka değil varsayılan. Hesaplanan sRGB karşılıkları Tailwind'in emerald ramp'iyle birebir örtüşüyor. Ayrıca globals.css:66 (`--primary`) ve globals.css:69 (`--muted-foreground`) aynı değerde: oklch(0.516 0.114 157.2). Kontrast oranı bu çift için 5.02:1, AA geçiyor ama "ikincil metin" olarak okunmuyor çünkü marka rengiyle aynı. Nötr zemine geçiş bunu düzeltiyor ve emerald'in taşıdığı anlamı geri kazandırıyor: bir DevOps sitesinde yeşil artık "marka" değil "up" demeye başlıyor, bu da canlı status widget'ıyla tutarlı.

Nötr token değerleri (kontrast hesaplandı, hepsi AA üstü):

| Rol | Dark | Light | Kontrast (zemine karşı) |
|---|---|---|---|
| Zemin | #0a0c0f | #f9fafb | - |
| Yüzey / kart | #14171b | #ffffff | - |
| Metin | #f1f3f4 | #14181c | - |
| Muted (ikincil metin) | #999fa6 | #60656b | dark 7.32:1, light 5.62:1 |
| Çizgi (hairline) | #2a2e33 | - | - |
| Aksan (link/focus/up) | #4fcc8d | #007041 | dark 9.67:1, light 5.96:1 |

Değişiklik yalnızca `:root` ve `.dark` token bloklarını değil, body arka planındaki üç katmanlı gradyanı, `surface-panel` gölgesindeki hard-coded `rgba(4,120,87,0.30)` değerini ve `project-card` içindeki `bg-accent/40`, `border-primary/30` gibi doğrudan renk referanslarını da kapsıyor. Yarım yapılırsa yeşil artıklar kalır ve sonuç ilk halinden kötü görünür; bu yüzden tek PR'da bitirilecek iş olarak işaretlendi.

**Tipografi.** İncelenen referans sitelerin hiçbiri renkle değil tipografiyle ayrışıyor: leerob.com'un derlenmiş CSS'inde üç ayrı sistem var (`--font-geist-sans`, `--font-geist-mono` ve `src: local(Iowan Old Style)` ile yüklenen sıfır-byte maliyetli bir serif); joshwcomeau.com'da `--font-family` Wotfard, `--font-family-mono` Cartograph CF, `--font-family-spicy` Sriracha; emilkowal.ski'de dört ayrı yüz (Sans/Serif/serifInline/Mono). Ortak kalıp: nötr grotesk gövde + mono metadata + isteğe bağlı editoryal serif display, yani rol tabanlı bir font sistemi. Bu projede ise şu an hiç font yüklenmiyor: globals.css:161 `font-family: var(--font-fraunces)` diyor ama bu değişken `:root`'ta, `.dark`'ta ya da `@theme inline` bloğunda hiçbir yerde set edilmiyor (grep tek eşleşme veriyor) ve `src/` altında hiç `next/font` importu yok. package.json'da Fraunces bağımlılığı da yok. Sonuç: başlıklar sessizce `--font-sans-stack`'e (Inter, Avenir Next, Segoe UI) düşüyor, hata da vermiyor çünkü CSS tanımsız custom property'i sessizce yok sayıyor.

Çözüm: Geist Sans Variable, Geist Mono Variable ve Instrument Serif 400 woff2 dosyaları latin + latin-ext alt kümeleriyle `@fontsource` paketlerinden alınıp `src/fonts/` altına repoya konur ve `next/font/local` ile yüklenir; CSS değişkenleri `--font-sans` / `--font-mono` / `--font-display` olarak body'ye inject edilir, globals.css:161'deki ölü referans `--font-display`'e bağlanır. `next/font/google` reddedildi çünkü build sırasında Google'a çıkıyor; build Coolify/GitHub Actions üzerinde kendi sunucusunda alınacağı için bu deploy'u kırabilen gerçek bir bağımlılık (bkz. Riskler). latin-ext şart, aksi halde TR sayfalarda ğ/İ/ı/ş fallback fonta düşer; doğrulama fonts.googleapis.com üzerinden yapıldı, Instrument Serif dahil incelenen tüm adaylar U+0100-02BA aralığını (Türkçe kapsamı) içeriyor, yani engel font seçimi değil konfigürasyon disiplini.

Kullanım kuralı net: serif yalnızca h1 ve büyük pull quote'ta (Instrument Serif tek ağırlıklı ve variable değil, h3/h4 seviyesine indirilirse zayıf ve amatör görünür), mono yalnızca veri katmanında (yıl, stack etiketi, uptime yüzdesi, deploy zamanı, commit SHA, sertifika kodu). Mono'yu tema değil veri katmanı olarak kullanmak "yeşil-siyah terminal" klişesinden kaçınırken "bu kişi terminalde çalışıyor" bilgisini gövde metnini bozmadan veriyor.

**Layout.** Mobil navigasyon eksikliği şu an kullanılabilirlik açısından kritik bir kırık: header.tsx:44'teki nav listesi `hidden md:flex` ile yalnızca md breakpoint üzerinde görünüyor, altında hiçbir alternatif (Sheet/Dialog/hamburger) yok; footer.tsx'te de About/Projects/Home linkleri yok, yalnızca Contact butonu ve sosyal ikonlar var. Küçük ekranda ziyaretçinin Home dışında hiçbir sayfaya ulaşma yolu yok. md altı için Radix Dialog tabanlı bir mobil menü ve footer'a sayfa linkleri ekleniyor.

Proje ve yazı listelerinin kart yerine satır (yıl · başlık · rol · stack, mono hizalı) olması hem uzun listede tarama hızını artırıyor hem de kart tasarımının gerektirdiği görsel/gradyan bağımlılığını azaltıyor. Proje detayında üstte 4 hücreli mono künye (Role / Stack / Year / Outcome), recruiter'ın 30 saniyede alması gereken dört bilgiyi açıklama paragrafını okumaya gerek bırakmadan veriyor; örnek: "DevOps Chapter Lead / Docker · GH Actions · Coolify / self-hosted CI-CD / 1 platform, 0 Vercel". project-card.tsx:96'da şu an tüm kart bir `Link` içine sarılmış; repo ve canlı link eklendiğinde iç içe interaktif eleman sorunu çıkarıyor. Düzeltme: başlık link olur, kart `::after` ile genişletilmiş tıklama alanı alır.

**Hareket.** `src/` içinde tek bir `prefers-reduced-motion` kuralı yok (grep sıfır sonuç), buna karşılık project-card.tsx:83-92 her karta `index * 0.08` gecikme veriyor; 6 projede son kart görünür olduktan 400ms sonra beliriyor, bu "scroll reveal" hissi yerine sitenin yavaş olduğu izlenimini bırakıyor. Çözüm: motion `LazyMotion` + `m` ile yüklenir, yalnızca opacity + 2-4px translate, 150-220ms, stagger 40ms'e indirilir ve en fazla 4 elemanla sınırlanır; `useReducedMotion` hook'uyla variant'lar koşullu hale getirilir ve globals.css'e global `@media (prefers-reduced-motion: reduce)` fallback'i eklenir.

**Erişilebilirlik.** İki somut madde doğrulandı. Birincisi, WCAG 2.2 SC 2.5.8 minimum 24x24 CSS px hedef boyutu istiyor; project-card.tsx:56'daki `size-11` (44px) ok butonu bu şartı karşılıyor ama header'daki dil/tema anahtarları ve tag pill'lerinin ölçülmesi gerekiyor. İkincisi, contact-form.tsx:120-129'daki `status === "error"/"success"` koşullu render edilen `<p>` etiketlerinde `aria-live`, `role="status"` veya `role="alert"` yok (grep sıfır sonuç); form submit sonrası DOM'a eklenen mesajı ekran okuyucu kullanıcıları fark etmeyebilir. Honeypot alanı (contact-form.tsx:116-119) doğru şekilde `aria-hidden` + `tabIndex=-1` ile gizlenmiş, bu kısım korunuyor. Ayrıca mevcut `--ring` opaklığı (%55) nötr zeminde zayıf kalacağı için focus ring solid accent + 2px offset'e geçiyor.

## Reddedilen alternatifler (neden)

- **Mevcut emerald paletini korumak**: Son commit'te yeni geldi ama kaynağı Tailwind varsayılanı, ayırt edici değil; ayrıca `--primary`/`--muted-foreground` çakışması sürer.
- **Ops Console'u tüm site yönü yapmak**: Terminal/hacker klişesine en yakın yön, bento grid mobilde hiyerarşiyi çökertiyor, uzun okuma (blog) diliyle çelişiyor. Yalnızca ana sayfadaki "systems" bölümü olarak içeri gömülüyor.
- **Quiet Print / light-first editoryal yön**: En premium hissi veren yön ama developer sinyali zayıf, DevOps/security kimliği tamamen içerikten çıkmak zorunda kalırdı. Buradan yalnızca blog okuma ölçüleri alınıyor.
- **`next/font/google` ile Instrument Serif/Fraunces yüklemek**: Build sırasında Google'a çıkan bir bağımlılık; self-host build senaryosunda pazarlık konusu değil (bkz. Riskler).
- **`@fontsource` paketini doğrudan CSS'e import etmek**: node_modules yolu kırılgan, `next/font`'un preload/CSS değişkeni avantajı kaybolur.
- **Yalnızca sistem font stack'i**: Mevcut durumun ta kendisi, yani tipografik sistem yok demek.
- **React ViewTransition ile sayfa geçişleri**: motion bağımlılığını azaltırdı ve proje kapağının grid'den detaya morph etmesini bedavaya getirirdi, ama Safari'de davranış farkları var ve şu an YAGNI; ertelendi, motion (LazyMotion) ile devam ediliyor.
- **CSS scroll-driven animations (`animation-timeline: scroll()`) ile okuma ilerleme çubuğu**: Firefox'ta hâlâ bayrak arkasında; gerekirse `@supports` ile progressive enhancement olarak eklenir, tek yol olarak kurulmaz.
- **Nav'ı mobilde yatay kaydırılabilir bar yapmak**: Dialog'dan daha az keşfedilebilir, Radix Dialog tabanlı mobil menü tercih edildi.
- **Tüm kartı `Link`'e sarmaya devam etmek**: Repo/canlı link eklendiğinde iç içe interaktif eleman sorunu çıkarır.

## Uygulama durumu (2026-08-27)

Bu kararların kod tarafı Faz 3'te (dal `feature/faz-3-tasarim-sistemi`, PR #5, merge commit `a3b2aed`) uygulandı; hero, header ve içerik metinleri Faz 4'te (dal `feature/faz-4-icerik-ve-yayin`, PR #6, henüz merge edilmedi, HEAD `8b4fe40`) yeniden ele alındı.

**Fontlar.** Geist Sans, Geist Mono ve Instrument Serif woff2 dosyaları (latin + latin-ext, artı lisans metinleri) `src/fonts/` altında repoya vendor edildi, `src/fonts/index.ts` `next/font/local` ile yüklüyor ve `fontVariables`'ı hem `src/app/[lang]/layout.tsx` hem `src/app/global-not-found.tsx`'teki `<html>` etiketine bağlıyor. `grep -rn "next/font/google" src` sıfır sonuç veriyor; hiçbir Google Fonts isteği yok.

**Palet.** `src/app/globals.css` nötr oklch token sistemine geçti (`--background: oklch(0.9846 0.0017 247.8)` light, `oklch(0.1535 0.0072 258.4)` dark), `--shadow-color` token'ı eklendi ve panel gölgeleri buradan türetiliyor. `--primary` (oklch(0.4794 0.1156 156.3)) ile `--muted-foreground` (oklch(0.5044 0.0114 252.9)) artık ayrı değerler, çakışma bug'ı kapandı.

**Layout.** `src/components/layout/mobile-menu.tsx` Radix Dialog tabanlı mobil menü ekliyor, `src/components/layout/footer.tsx` artık sayfa linklerini (`navItems`) ayrı bir `nav` bloğunda listeliyor; ikisi de kararla uyumlu. Proje/yazı listeleri satır formatında (`project-row`/blog satırı, mono hizalı). Hero (`src/components/sections/hero.tsx`) ve header (`src/components/layout/header.tsx`) Faz 4'te yeniden tasarlandı: hero tek sütun, plandaki metrik kartları ve "available for work" rozeti yok; header monogram (`{t("brand.monogram")}`) + görünür isim gösteriyor (plan `sr-only` istiyordu). Bu, aşağıdaki "Sapmalar" bölümünde ayrıca not edildi.

**Hareket.** `src/components/motion-provider.tsx` `LazyMotion` + `domAnimation` + `m` kalıbını kuruyor ve kök layout'ta sarmalayıcı olarak kullanılıyor. `src/lib/motion.ts` stagger'ı 40ms'e (`STAGGER_SECONDS = 0.04`), süreyi 180ms'e sabitliyor ve `MAX_STAGGER_ITEMS = 4` ile sınırlıyor; `useReducedMotion` her animasyonlu bileşende okunuyor. `globals.css:218` civarında global `@media (prefers-reduced-motion: reduce)` fallback'i var. Açık madde: `staggerItem`/`fadeUp` varyantlarının `hidden` durumu `reduced` bilgisine bakılmaksızın sunucu tarafında `opacity: 0` ile render ediliyor (useReducedMotion sunucuda `null` döner, `?? false`'a düşer), yani reduced-motion tercihi olan bir ziyaretçide bile ilk HTML'de içerik gizli geliyor, hidrasyona kadar; tarayıcıda doğrulanan bir tur yapılmadı.

**Erişilebilirlik.** `src/app/[lang]/layout.tsx:88-89` skip link (`.skip-link`, `#main`), `contact-form.tsx:121` ve `:129` `role="alert"`/`role="status"`, `:139` `aria-busy={status === "loading"}`, `globals.css:272` `.tap-target` sınıfı 24x24 minimum hedef boyutu için, `theme-toggle.tsx:27` ve `:40` `aria-label={t("a11y.toggleTheme")}` ile TR/EN çevirili. Hepsi doğrulandı.

**OG image / icon.** `src/app/icon.tsx` "DCY" monogramını kararın dark zemin (#0a0c0f) + accent (#4fcc8d) paletiyle render ediyor; `src/app/[lang]/opengraph-image.tsx` gerçek isim, unvan ve lokasyonu Instrument Serif ile basıyor, şablon "Building clean, fast experiences for the web" metni gitti.

**Sapmalar (Faz 4, `d2eaf1e`):** Faz 4 devir notuna göre hero ve header planda tam kodu olmayan bir alanda yeniden tasarlandı: hero tek sütun, metrik kartları ve "available for work" rozeti kaldırıldı; header'da monogram + görünür isim kullanıldı (plan `sr-only` istiyordu); footer CTA butonu kaldırıldı; contact formundaki konu alanı kaldırıldı (API opsiyonel `subject`'i kabul etmeye devam ediyor). Bu değişiklikler bu dokümanın Karar 4'ünü daraltıyor ama ihlal etmiyor; site sahibinin onayı bekleniyor (bkz. `docs/plans/handoffs/faz-4.md`).

**Hâlâ açık olanlar:**
- Tarayıcıda ekran görüntüsü turu yapılmadı (Faz 3 manuel checklist'in 14 maddelik listesi, `docs/plans/handoffs/faz-3-manual-checklist.md`, sahibini bekliyor).
- Proje kapakları henüz teslim edilmedi; `project-card.tsx:37` kapak alanını yalnızca `project.cover` varsa render ediyor, yoksa hiçbir gradyan placeholder göstermiyor (kararla uyumlu, ama görsel yok).
- React ViewTransition alınmadı (`grep -ri "ViewTransition" src` sıfır sonuç); motion (LazyMotion) ile devam ediliyor, reddedilen alternatifler bölümündeki karar hâlâ geçerli.

## Riskler ve tripwire'lar

- **Font yükleme yolu altyapıya bağlı**: `next/font/google` build sırasında Google'a ağ isteği atıyor; Coolify + Docker + GitHub Actions ile kendi sunucusunda build alırken bu deploy'u kırabilir (vercel/next.js#91653, "Failed to fetch Geist from Google Fonts"). Tripwire: hiçbir Google Fonts importu kabul edilmez, yalnızca vendor edilmiş woff2 + `next/font/local`.
- **latin-ext unutulursa** TR sayfalarında ğ/İ/ı/ş fallback fonta düşer ve iki dilli sitede görünür bir tipografi kırılması olur. Tripwire: `next/font/local` subsets/kaynak dosya kontrolü PR review checklist'ine eklenir.
- **Instrument Serif tek ağırlıklı (400), variable değil**: Yalnızca 48px üstü display kullanımında iyi duruyor; h3/h4 seviyesine indirilirse zayıf görünür. Kural: yalnızca h1 ve büyük pull quote.
- **Nötr palete geçiş yarım kalırsa** (token blokları tamamlanır ama body gradyanı, `surface-panel` hard-coded rgba veya component'lerdeki doğrudan renk referansları atlanırsa) yeşil artıklar kalır, sonuç ilk halinden kötü görünür. Tripwire: PR'da grep ile `emerald`, `rgba(4,120,87` ve doğrudan hex renk referansları taranır.
- **CSS scroll-driven animations Firefox'ta bayrak arkasında** (FF 152, Haziran 2026 itibarıyla doğrulandı): okuma ilerleme çubuğu gibi özellikler `@supports` ile progressive enhancement olarak kurulmalı.
- **İçerik hazır olmadan görsel yön uygulanırsa** hiçbir tasarım kurtarmaz: proje kartlarındaki "görsel alanlar" şu an project-card.tsx:35 ve project-detail.tsx:42'de CSS radial-gradient placeholder, gerçek proje görseli yok. Gerçek ekran görüntüsü olmayan projeler kapaksız yayınlanır, CSS gradyan placeholder kullanılmaz (bkz. [08-icerik-stratejisi.md](08-icerik-stratejisi.md)).
- **Canlı status/"systems" bölümü gerçek veri istiyor**: Statik "%99.9 uptime" yazısı DevOps kimliğini güçlendirmez, zayıflatır; veri kaynağı ve gizlilik sınırları [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)'de.

## Uygulama notları

Faz 3 (Tasarım sistemi) sırası, [10-yol-haritasi.md](10-yol-haritasi.md) ile senkron:

1. Geist Sans/Mono Variable + Instrument Serif woff2 (latin + latin-ext) `src/fonts/` altına vendor edilir, `next/font/local` ile yüklenir, globals.css:161'deki ölü `--font-fraunces` referansı düzeltilir.
2. globals.css token blokları nötr palete geçirilir, emerald yalnızca link/focus/status rengine indirilir, `--primary`/`--muted-foreground` ayrışması düzeltilir.
3. body gradyanı, `surface-panel` gölgesindeki hard-coded rgba ve bileşenlerdeki doğrudan renk referansları temizlenir.
4. md altı için Radix Dialog tabanlı mobil menü eklenir, footer'a sayfa linkleri eklenir.
5. LazyMotion + `m`'ye geçiş; stagger 40ms, en fazla 4 eleman; `useReducedMotion` + global `prefers-reduced-motion` CSS fallback'i.
6. Erişilebilirlik: contact form mesajlarına `role="alert"`/`role="status"`, 24x24 minimum hedef boyutu denetimi, solid focus ring.
7. `opengraph-image` ve `icon` route'ları gerçek isim, unvan ve yeni paletle yeniden yazılır (mevcut "Building clean, fast experiences for the web" şablon metni gider).
8. project-card'da tüm kartı `Link`'e sarma kalıbı bırakılır; başlık link olur, kart `::after` ile genişletilmiş tıklama alanı alır.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](00-ozet-ve-karar.md)
- [01-mevcut-durum-denetimi.md](01-mevcut-durum-denetimi.md) (audit bulgularının tamamı)
- [02-stack-karari.md](02-stack-karari.md) (motion/framer-motion sürüm kararı, Next 16.3.3 yükseltmesi)
- [04-i18n.md](04-i18n.md) (locale switcher, dil bazlı font/latin-ext bağlantısı)
- [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) (Gatus status widget veri kaynağı)
- [08-icerik-stratejisi.md](08-icerik-stratejisi.md) (proje görselleri, case study formatı, kapaksız düzen kuralı)
- [10-yol-haritasi.md](10-yol-haritasi.md) (Faz 3 zamanlaması)

## Kaynaklar

- leerob.com derlenmiş CSS (Geist Sans/Mono değişkenleri ve `local(Iowan Old Style)` @font-face): https://leerob.com/_next/static/chunks/38df25e856253ffd.css
- joshwcomeau.com derlenmiş CSS (`--font-family: Wotfard`, `--font-family-mono: Cartograph CF`): https://www.joshwcomeau.com/_next/static/css/5f479326fc7a6aa8.css
- brittanychiang.com derlenmiş CSS (next/font Inter + sistem mono stack): https://brittanychiang.com/_next/static/css/1205f04d95fac248.css
- Emil Kowalski kişisel sitesi (Sans/Serif/serifInline/Mono dört yüzlü sistem): https://emilkowal.ski
- Rauno Freiberg kişisel sitesi (JetBrains Mono + Georgia): https://rauno.me
- Linear self-hosted InterVariable font dosyası: https://static.linear.app/fonts/InterVariable.woff2
- Next.js Font Module API referansı (build-time indirme, subsets, variable, localFont): https://nextjs.org/docs/app/api-reference/components/font
- Next.js issue #91653, "Build failed: Failed to fetch Geist from Google Fonts": https://github.com/vercel/next.js/issues/91653
- Geist Font (Vercel, OFL-1.1): https://vercel.com/font
- Fontsource variable Geist paketi (npm, self-host): https://www.npmjs.com/package/@fontsource-variable/geist
- Google Fonts CSS API, Instrument Serif unicode-range (latin-ext U+0100-02BA): https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap
- WCAG 2.2 checklist, 2.5.8 Target Size (Minimum) 24x24 CSS px, AA: https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/
- MDN, CSS scroll-driven animations (animation-timeline, tarayıcı desteği): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- UXPin, Optimal line length for readability: https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
