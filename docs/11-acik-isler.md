# Açık İşler

Durum: Site 2026-09-03'te yayında; kapanmamış maddeler aşağıda · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Site sahibine sorulan 11 açık sorunun tamamı 2026-08-27'de cevaplandı ve
cevaplar kararlara işlendi; soru listesi
`git show v0.5.0:docs/11-acik-sorular.md` ile okunur. Bu dosya kapanmamış
işleri tutuyor: sahibinin teslim edeceği içerik, panelde yapılacak adımlar,
canlı doğrulamalar ve bilinçli kabul edilmiş teknik borç.

## Canlıda doğrulanan durum (2026-09-03)

Bu satırlar `curl` ile ölçüldü, tahmin değil:

- `https://www.dogancanyildiz.com/` 200 döndü.
- `https://dogancanyildiz.com/` tek atlamada `https://www.dogancanyildiz.com/`
  adresine **307** ile yönlendi (Coolify/Traefik; kalıcı 301 istenirse
  Cloudflare Redirect Rule eklenir).
- `robots.txt` uygulamanın çıktısı: `Disallow: /api/`, `Host:` ve `Sitemap:`
  satırları var, yani Cloudflare'ın managed robots.txt'i kapalı.
- `/api/health` `{"status":"ok","checks":{"content":true,"mail":true}}` döndü,
  yani SMTP değişkenleri panelde tanımlı.
- Yanıt başlıklarında `x-frame-options: DENY`,
  `cross-origin-opener-policy`, `cross-origin-resource-policy` ve tam CSP
  (`report-uri /api/csp-report` dahil, `script-src`'te Umami origin'i) var.
- Umami tracker yükleniyor (`umami.dravcore.com/script.js`) ve sayfada
  `data-umami-event` öznitelikleri görünüyor.
- `dogancanyildiz.sh` DNS'te çözülmüyor.

## 1. Sahibinin teslimatları

- [ ] **Konuşmalar verisi** (etkinlik · konu · tarih). `speaking.en` ve
      `speaking.tr` dizileri boş, Hakkımda sayfası blok boşken hiç render
      etmiyor. `{ event, topic, date }` eklemek yeterli.
- [ ] **Kalan beş proje kapağı.** Köklü Hukuk kapağı teslim edildi; diğerleri
      kapaksız yayınlanıyor. Görsel gelince `content/images/<slug>-cover.jpg`
      ve MDX frontmatter'ına `cover` + `coverAlt`.
- [ ] **Metin onayı.** Üç TR yazı, üç EN çeviri ve altı case study'nin birinci
      şahıs cümleleri sahibinin onayını bekliyor; olgular (yıllar, teknoloji
      yığınları) herkese açık repolarla doğrulandı.
- [ ] **CV PDF içerik onayı.** Dosya `public/cv/` altında yayınlandığı için
      içindeki telefon numarası veya ev adresi herkese açık olur.
- [ ] **Wikonya canlı link teyidi.** Hedef site artık kendini "Konya Genç"
      olarak tanıtıyor; link hâlâ doğru hedefi gösteriyor mu kontrol edilmeli.

## 2. Görsel onaylar

Tarayıcıda gözle bakılıp onaylanacak, hiçbiri yayını bloklamıyor: header
lockup ve imleç animasyonu, düz dil/tema kontrolleri, 44px hedef boyutuyla
uzayan footer, paylaş bloğu, sertifika önizleme kalıbı, okul amblemleri
(Konya Teknik'in koyu temada zayıflaması bilinçli kabul), Köklü Hukuk kapağı.
Ayrıca kırılım noktalarında (320, 375, 768, 1280) bir ekran görüntüsü turu hiç
yapılmadı.

## 3. Panel adımları

- [ ] **Uptime Kuma kurulumu.** Coolify servis kataloğundan, `/api/health`
      keyword monitörü, bir bildirim kanalı ve test uyarısı, public status
      sayfası. Sonra `NEXT_PUBLIC_STATUS_URL` doldurulup redeploy: bugün boş,
      Systems panelindeki link satırı gizli (canlıda doğrulandı).
- [ ] **Traefik `forwardedHeaders.trustedIPs`** Cloudflare listesiyle set
      edilmeli.
- [ ] **Origin kilidi.** `DOCKER-USER` zincirine Cloudflare IPv4/IPv6 blokları
      + admin IP allowlist + DROP; ufw yalnızca host servislerini kapatıyor.
- [ ] **`TRUST_CF_CONNECTING_IP=true`,** yalnızca yukarıdaki iki adımdan
      sonra. Bugün `false`, rate limit `X-Forwarded-For`'un son hop'una
      düşüyor, yani Cloudflare edge adresi başına sayıyor.
- [ ] **Cloudflare:** CAA kaydı (`letsencrypt.org`, `pki.goog`, `iodef`) ve
      Minimum TLS 1.2 ayarı; ikisi de 2026-08-28 denetiminde eksikti,
      sonrasında doğrulanmadı.
- [ ] **CSP ölçüm penceresi.** `CSP_REPORT_ONLY=1` ile tek bir deploy,
      `csp-violation` log satırlarının 1-2 saat izlenmesi, sonra değişkenin
      kaldırılması.

**Cloudflare panelinin bugünkü hali ile checklist arasında iki fark var.**
Sahibinin bildirdiğine göre Bot Fight Mode kapalı ve AI crawler'lar serbest
bırakılmış; `docs/deploy/cloudflare-kurulum.md` bölüm 6 hâlâ "Bot Fight Mode:
açık" diyor. Aynı şekilde HSTS bölüm 2'de "Cloudflare'da açılmaz" olarak
yazılı, ama canlı yanıt `strict-transport-security: max-age=15552000` (180 gün,
`includeSubDomains` yok) döndürüyor; bu uygulamanın gönderdiği
`max-age=31536000; includeSubDomains` değeri değil, edge'in kendi HSTS ayarı.
Yani HSTS bugün iki katmandan gidiyor ve edge olanı kazanıyor. Checklist'in bu
iki satırı panelin gerçek haline göre güncellenmeli, ve HSTS tek katmana
indirilmeli (tercihen uygulama satırı kaldırılıp edge veya Traefik tek kaynak
yapılmalı).

## 4. `dogancanyildiz.sh` kararı

Alan adı kayıtlı değil, DNS'te zone yok. İki yoldan biri seçilmeli:

- **Kaydedilir:** Cloudflare'a zone eklenir ve
  `docs/deploy/cloudflare-kurulum.md` bölüm 3 uygulanır.
  Karar: `.sh -> .com` 301 Cloudflare Redirect Rule ile, tek atlama, path
  korunarak; `dogancanyildiz.sh -> www.dogancanyildiz.com`. Doğrulama:
  `curl -I https://dogancanyildiz.sh/projeler` tek atlamada `https://www.dogancanyildiz.com/projeler` adresine 301 dönmeli,
  ikinci bir `location` satırı çıkmamalı.
- **Kapsam dışı ilan edilir:** README, `docs/deploy/cloudflare-kurulum.md`
  bölüm 3 ve `docs/deploy/traefik-ve-origin.md`'deki yedek redirect satırları
  kaldırılır.

Karar gelene kadar bu 301 "canlıya alınmadı, alan adı kayıtsız" olarak
okunmalı.

## 5. Canlı doğrulamalar

Hiçbiri koşulmadı; site 3 Eylül'e kadar Cloudflare 526 verdiği için
yapılamıyordu, yayına çıktıktan sonra da sırası gelmedi.

- [ ] Search Console: `www.dogancanyildiz.com` property'si açılır, sitemap
      gönderilir ve hatasız işlendiği görülür; hem `/` hem `/en` kapsamı
      doğrulanır; bir yazının adresi URL inceleme aracıyla tek tek bakılır.
      `.sh` kaydedilirse ikinci bir property yalnızca yönlendirme sağlığını
      izlemek için eklenir (sitemap gönderilmez).
- [ ] Bağımsız bir hreflang test aracıyla ana sayfa, `/hakkimda`, `/projeler`,
      `/en/about`, `/en/projects`, bir proje detayı ve iki dilli bir yazı
      taranır; self-referencing ve karşılıklı hreflang hatası olmamalı.
- [ ] 308 tablosu canlıda doğrulanır: `/about` -> `/en/about`,
      `/blog/capt-sinavina-hazirlik` -> `/yazilar/capt-sinavina-hazirlik`,
      `/projeler/gpa-calculator` -> `/projeler/not-ortalamasi-hesaplayici`,
      `/tr/hakkimda` gibi fazla önekler tek atlamada düşmeli, hiçbir zincirde
      döngü olmamalı (tam tablo `src/i18n/legacy-paths.ts`).
- [ ] Yalnız TR olan bir yazının `/en/blog/<slug>` adresi 404 dönmeli ve EN
      sitemap'inde geçmemeli.
- [ ] Bir paylaşım önizlemesi (LinkedIn/Slack) doğru OG kartını göstermeli.
- [ ] Rich Results Test: `/` (Person + WebSite), bir yazı (BlogPosting +
      BreadcrumbList), bir proje (CreativeWork + BreadcrumbList).
- [ ] Lighthouse (mobil, production URL): SEO 100 ve Accessibility 95 altına
      düşmemeli; CLS ve LCP ayrıca not edilmeli.
- [ ] `prefers-reduced-motion: reduce` açıkken hiçbir animasyon çalışmamalı ve
      DevTools Network sekmesinde Google Fonts isteği olmamalı.
- [ ] Contact formu üretimde uçtan uca test edilmeli: gerçek tarayıcı
      gönderimi `me@dogancanyildiz.com` kutusuna ulaşmalı, yanıtta
      `X-Request-Id` olmalı ve Coolify logunda aynı kimlikle JSON satırı
      görünmeli. `Origin` başlığı olmayan düz bir `curl` POST'u 403,
      honeypot alanı dolu bir istek 200 almalı ama posta gitmemeli.

## 6. Kabul edilmiş teknik borç

- **`sharp` npm `overrides` ile sabitleniyor** (`^0.35.0`). velite hâlâ
  `^0.34.5` istiyor; override kalkarsa libvips zinciri
  (`GHSA-f88m-g3jw-g9cj`) geri gelir. Tripwire: velite kendi aralığını
  `^0.35`'e taşıdığında `package.json`'daki `overrides` bloğu silinebilir,
  ayrıntı [09](./09-guvenlik.md) bölüm "Bağımlılık durumu".
- **typescript 7 ve eslint 10 majorları Dependabot'ta ignore.**
  `eslint-plugin-react` eslint 10'u desteklemiyor (transitif olarak
  `eslint-config-next` üzerinden), üst akış bekleniyor.
- **Harici prob yok.** Uptime Kuma izlediği sunucuda çalışacağı için sunucu
  tümden düşerse uyarı gönderemez; kontrol dışı bir yerden ikinci bir prob
  öneriliyor.
- **Dış linklerde yeni sekme işareti yok** (WCAG 3.2.5, AAA, isteğe bağlı).

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)
- [09-guvenlik.md](./09-guvenlik.md)
- [deploy/](./deploy/) - panel checklist'leri
- [runbooks/infrastructure.md](./runbooks/infrastructure.md)
