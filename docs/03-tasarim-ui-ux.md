# Tasarım Yönü, UI/UX ve Frontend

Durum: Uygulandı (Faz 3 #5; denetim kapanışı #34; marka paketi, paylaş bloğu ve sertifika v2 #45; izin bandı kaldırıldı #53) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

## Kararlar

1. **Yön: Terminal Editorial.** Nötr zemin, rol tabanlı üç fontlu tipografi,
   tek sütun editoryal omurga, minimum hareket. Karşılaştırılan iki alternatif
   yönden yalnızca parça alındı: Ops Console'un bento/telemetri fikri tek bir
   Systems bölümü olarak içeri gömüldü (bento grid mobilde hiyerarşiyi
   çökertiyor, uzun okumayla çelişiyor), Quiet Print'ten yalnızca blog okuma
   ölçüleri (66ch measure, 1.6 satır yüksekliği, 18-20px gövde).
2. **Tipografi:** Geist Sans Variable gövde ve başlıklarda, Geist Mono veri
   katmanında (yıl, stack etiketi, commit SHA, sertifika kimliği), Instrument
   Serif yalnızca blockquote ve OG kartında. Hepsi `next/font/local` ile
   vendor edilmiş woff2'den, `latin` + `latin-ext` alt kümesiyle.
3. **Palet:** nötr gri/siyah-beyaz zemin; yeşil tek role indirildi: link, focus
   ring ve "up" durumu. Bir DevOps sitesinde yeşilin "marka" değil "up"
   demesi, canlı status paneliyle tutarlı.
4. **Layout:** ana sayfa `Hero` -> seçili projeler -> `ExperienceSummary` ->
   `SkillsStrip` -> son yazılar -> `Systems` -> `ContactCta`. Container
   `max-w-6xl` (`page-shell`). Proje ve yazı listeleri kart değil numaralı
   editoryal satır; detay sayfasında 4 hücreli mono künye (Rol / Stack / Yıl /
   Sonuç).
5. **Hareket:** sitede JS animasyon katmanı yok (karar değişikliği,
   2026-08-28). Yalnızca imleç yanıp sönmesi ve kalıp açılışı gibi küçük CSS
   animasyonları var, hepsi `prefers-reduced-motion` altında kapanıyor.
6. **Erişilebilirlik:** WCAG 2.2 SC 2.5.8 tabanı (24x24 CSS px; kontroller ve
   metin bağlantıları 44px `tap-target`), form durum mesajlarında
   `role="alert"` / `role="status"`, solid aksan + 2px offset focus ring.

### Neden bu değerler

Başlangıçtaki tema teknik olarak marka değil Tailwind'in emerald ramp'inin
oklch'e çevrilmiş haliydi (light background emerald-50 ile birebir aynı) ve
`--primary` ile `--muted-foreground` aynı değerdeydi, yani üç seviyeli metin
hiyerarşisi ikiye düşmüştü. Ayrıca `globals.css` hiç tanımlanmamış bir
`--font-fraunces` değişkenine işaret ediyordu ve `next/font` hiç
yüklenmiyordu: tüm başlıklar sessizce sistem fontuna düşüyordu, CSS tanımsız
custom property'i hata vermeden yok saydığı için de fark edilmiyordu.

Referans sitelerin ortak kalıbı renkle değil tipografiyle ayrışmak: nötr
grotesk gövde + mono metadata + isteğe bağlı editoryal serif display.
`next/font/google` reddedildi çünkü build sırasında Google'a ağ isteği atıyor
ve build kendi sunucusunda alınıyor (vercel/next.js#91653).

Nötr token değerleri (kontrast hesaplandı, hepsi AA üstü):

| Rol | Dark | Light | Kontrast |
| --- | --- | --- | --- |
| Zemin | #0a0c0f | #f9fafb | - |
| Yüzey / kart | #14171b | #ffffff | - |
| Metin | #f1f3f4 | #14181c | - |
| Muted | #999fa6 | #60656b | 7.32:1 / 5.62:1 |
| Aksan (link/focus/up) | #4fcc8d | #007041 | 9.67:1 / 5.96:1 |

## Uygulama

### Token sözleşmesi

`--border` yalnızca dekoratif hairline (ayırıcı, pill kenarı, kod bloğu
çerçevesi); `--border-strong` bir kontrolün kendi sınırını çizdiği her yer
(outline buton, tema düğmesi, dil değiştirici); `--input-border` form alanları
için alias. İki temada da zemine karşı en az 3:1 (WCAG 1.4.11).
`tests/design-tokens.test.ts` kontrastı oklch'ten hesaplayıp assert ediyor ve
`globals.css`'te tanımlı her özel sınıfın `src/` altında kullanıldığını
doğruluyor (ölü CSS testi). Etiket tipografisi iki kademeli: bölüm etiketi
`.eyebrow` 0.8125rem/0.12em, satır içi etiketler (`.meta-label`, `.tag-pill`)
0.75rem/0.1em.

Tailwind kaynak taraması `source("../")` ile `src/`'ye kısıtlı; aksi halde
dokümanlarda ve testlerde geçen emekli sınıf adları derlenen CSS'e giriyordu.

### Marka paketi

- **İşaret** (`src/components/brand/brand-mark.tsx`): DCY harfleri artı sağ
  altta yeşil blok, harf metinleri path'e çevrili, yani hiçbir yazı tipi
  yüklenmeden okunuyor. Tek bileşen iki temayı da karşılıyor: harfler
  `currentColor`, blok `fill-primary`. İki ayrı SVG vendor edip birini
  gizlemek, tema sınıfı gelmeden yanlış renkte bir kare gösterirdi.
- **Lockup** (`brand-lockup.tsx`): işaret + ince dikey ayırıcı + isim + yeşil
  mono tagline. 480px altında yalnızca işaret görünüyor, isim `sr-only` bir
  kopyayla ekran okuyucuda kalıyor. Header'da yeşil blok terminal imleci gibi
  yanıp sönüyor (1.06s step-end, WCAG 2.3.1 eşiğinin çok altında,
  `prefers-reduced-motion` açıkken sabit); footer'da sabit.
- **Header kontrolleri düz.** Dil değiştirici kapsül, tema düğmesi daire
  olmaktan çıktı; TR önce, aktif dil yeşil alt çizgi.
- **Statik ikonlar:** `src/app/favicon.ico`, `icon.png`, `apple-icon.png`.
  Üretilen `ImageResponse` rotaları ve `/favicon.ico -> /icon` yönlendirmesi
  kalktı. Apple ikonu opak, çünkü iOS saydam ikonu beyaza bindiriyor.
- **OG kartı** (`src/lib/seo/og-layout.tsx`): sol üstte yeşil Geist Mono
  prompt satırı, ortada sayfa başlığı, sol altta isim ve unvan, arkada çok
  düşük kontrastlı filigran. Üç rota da aynı düzeni çağırıyor.

### Sayfa parçaları

- **Paylaş bloğu** (`share-card.tsx`): yazı ve proje sayfalarının sonunda,
  prose bittikten sonra ve `ContactCta`'dan önce. Sayfanın kendi OG kartını
  gösteriyor (mockup değil, servis edilen PNG'nin kendisi), X/LinkedIn/
  WhatsApp/e-posta bağlantıları ve bir "bağlantıyı kopyala" düğmesi. Kopyalama
  sonucu `role="status"` bölgesinde duyuruluyor; pano yoksa veya yazma
  reddedilirse aynı yoldan hata mesajı geliyor, kurtarma yolu düğmenin yanında
  duran mono URL.
- **Sertifikalar** (`certificate-list.tsx`): verene göre gruplu, satır başında
  64px rozet slotu, `md` ve üstünde iki sütun. Satırdaki tek bağlantı
  "Doğrula"; adı bağlantı yapmak ekran okuyucuya aynı yere iki kapı açardı.
  Rozet görseli tıklanınca platformun kendi `<dialog>`'u ile büyüyor
  (`showModal()` Escape'i, `inert` arka planı, odak tuzağını ve top layer'ı
  bedava veriyor). Adın altında verenin kendi beceri etiketlerinden en çok
  altı anahtar kelime. Eğitim satırlarında 40px okul amblemi slotu; amblemi
  olmayan kayıt slotu boş bırakıyor.
- **Kalıp için iki elle yazılmış davranış:** dışarı tıklayınca kapanma
  (`::backdrop` bir element değil, ona yapılan tıklama hedef olarak dialog'u
  bildiriyor, bu yüzden dialog'un kendi `padding`'i sıfır) ve `body` kaydırma
  kilidi. Kilit `close` olayına bağlı değil: Chrome, Escape ile kapatılmış bir
  `<dialog>` üzerinde sonraki `close()` çağrılarında olayı göndermiyor ve
  temizlik yalnızca `onClose`'a bağlı kalsaydı sayfa kaydırılamaz kalıyordu.

### Ölçüm ve gizlilik (2026-09-03)

İzin bandı, `/privacy` üzerindeki ölçüm anahtarı ve `dcy-consent` localStorage
anahtarı kaldırıldı (`src/components/consent/` silindi). Gerekçe: Umami bu
kurulumda çerez koymuyor ve IP saklamıyor (tekil ziyaretçi günlük değişen bir
tuzdan türetilen, ertesi gün geçersiz olan bir hash), yani izin istenecek bir
işleme yok. Tracker'ı `src/components/umami-script.tsx` layout'a `<script
defer>` olarak basıyor. Özel olay adları tek yerde:
`src/lib/analytics-events.ts` (`cv-download`, `contact-submit`,
`whatsapp-click`, `outbound-click`, `theme-toggle`, `locale-switch`); script
yüklü değilse hiçbiri bir şey yapmıyor.

## Riskler ve tripwire'lar

- **Hiçbir Google Fonts importu kabul edilmez.** Tripwire: `grep -rn
  "next/font/google" src` sıfır sonuç vermeli.
- **latin-ext unutulursa** TR sayfalarında ğ/İ/ı/ş fallback fonta düşer.
- **Instrument Serif tek ağırlıklı (400), variable değil.** Yalnızca büyük
  display kullanımında iyi duruyor; h3/h4 seviyesine indirilirse amatör
  görünür.
- **Yeşil artıkları.** Nötr palete geçiş yarım kalırsa (body gradyanı,
  `surface-panel` gölgesindeki hard-coded rgba, bileşenlerdeki doğrudan renk
  referansları) sonuç ilk halinden kötü görünür; PR'da `emerald`,
  `rgba(4,120,87` ve doğrudan hex renk taraması yapılmalı.
- **Bilinen ödünleşme:** koyu temada Konya Teknik Üniversitesi amblemi
  zayıflıyor (logonun siyaha yakın parçası kayboluyor). Arkasına beyaz plaka
  koymak tasarım diline yeni bir kutu eklerdi; amblem dekoratif ve okul adı
  yanında yazılı olduğu için bilgi kaybı yok, olduğu gibi bırakıldı.
- **CSS scroll-driven animations** Firefox'ta hâlâ bayrak arkasında; okuma
  ilerleme çubuğu gibi özellikler `@supports` ile progressive enhancement
  olarak kurulmalı.
- **Kapaksız yayın kuralı sürüyor:** gerçek ekran görüntüsü olmayan proje
  kapaksız yayınlanır, CSS gradyan veya stok görsel placeholder kullanılmaz.
- **Hizmetler sayfası hizalandı (2026-09-03):** `/hizmetler` artık About ve
  Projeler ile aynı `PageHeader`/`PageSubnav`/numaralı liste dilini kullanıyor,
  metin içeriği değişmedi.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [04-i18n.md](./04-i18n.md) - latin-ext alt kümesi, dil değiştirici
- [07-seo-ve-metadata.md](./07-seo-ve-metadata.md) - OG kartının metadata tarafı
- [08-icerik-stratejisi.md](./08-icerik-stratejisi.md) - kapak kuralı, sertifika içeriği
- [11-acik-isler.md](./11-acik-isler.md) - bekleyen görsel onaylar

## Kaynaklar

- https://nextjs.org/docs/app/api-reference/components/font
- https://github.com/vercel/next.js/issues/91653
- https://vercel.com/font
- https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
