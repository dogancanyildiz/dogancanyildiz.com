# Yayın öncesi kontrol listesi (Faz 4 launch gate)

Bu listenin tamamı geçmeden `dogancanyildiz.sh -> www.dogancanyildiz.com` 301 yönlendirmesi
canlıya alınmaz (bkz. `docs/00-ozet-ve-karar.md`, Uygulama notları). Not (2026-08-28):
`dogancanyildiz.sh` kayıtlı değil; 301 için önce alan adı kararı gerekiyor (`docs/plans/README.md`).
**Karar (2026-09-02):** kanonik host www; apex (`dogancanyildiz.com`) de edge'de aynı
adrese 301 ile yönlenir.

Durum (2026-08-28, dal `feature/audit-closure`): bölüm 1'in tamamı ve bölüm 2'nin repoda
doğrulanabilir maddeleri yerelde ve CI'da geçti. Canlı site 2026-08-28'de her yolda
Cloudflare 526 verdiği için bölüm 3-5'in canlı URL isteyen maddelerinin hiçbiri koşulamadı;
önce Coolify/Traefik tarafındaki kesinti giderilmeli (`docs/plans/handoffs/denetim-kapanisi-2026-08-28.md`).

## 1. Otomatik kapılar

- [x] `npm run typecheck` hatasız
- [x] `npm run lint` hatasız
- [x] `npm test` tüm testler geçiyor (şema, içerik katmanı, sitemap, RSS, OG render, profil,
      kalıntı, güvenlik başlıkları, contact API, jsdom render testleri); güncel sayı devir
      notunda
- [x] `npm run format` hatasız
- [x] `NEXT_PUBLIC_SITE_URL=https://www.dogancanyildiz.com npm run build` başarılı ve build
      çıktısında dynamic (ƒ) yalnızca `/api/*` altında (`/api/contact`, `/api/csp-report`,
      `/api/health`); `npm run verify:routes` 41 içerik route'unu (6 proje x 2 locale, 3 yazı
      x 2 locale) ve statik meta route'larını doğruluyor; `npm run verify:docs` geçiyor

## 2. İçerik

- [x] En az 4 proje ve 3 blog yazısı yayında (6 proje x 2 locale, 6 yazı: 3 EN, 3 TR)
- [x] Kapaksız yayınlanan projelerde CSS gradyan veya stok görsel yok (`content/images/`
      boş, `covers=0`)
- [x] Sertifika satırları listede, `verifyUrl` gelmeyenlerde link yok ama satır duruyor
- [x] Konuşmalar bloğu ya gerçek veriyle dolu ya da hiç render edilmiyor (`speaking` dizileri
      boş, blok render edilmiyor)
- [x] CV PDF `public/cv/dogancanyildiz-cv.pdf` yolunda ise Download CV butonu görünüyor,
      dosya yoksa buton hiç yok (dosya commit'li, buton bu yola bağlı)
- [ ] Sahibi üç TR blog yazısını, üç EN çeviriyi ve beş proje case study'sini yayından önce
      doğruluk açısından gözden geçirdi; bu metinler `.local/content/portfolio-content.md` dosyasından
      türetildi, dosyadaki bir hata veya eksik olduğu gibi siteye geçmiş olabilir
- [ ] Sahibi CV PDF içeriğini onayladı; dosyanın içinde bir telefon numarası veya özel bir
      adres varsa bu, dosya `public/cv/` altında yayınlandığı için herkese açık olur
- [ ] Sahibi Wikonya projesinin canlı link kontrolünü yaptı; hedef site artık kendini
      "Konya Genç" olarak tanıtıyor, link hâlâ doğru hedefi mi gösteriyor teyit edilmeli
- [x] Sertifika `verifyUrl` değerleri 2026-09-02'de teslim alındı ve uygulandı (on üç
      kayıttan on ikisi Credly/Hackviser doğrulama linkine bağlı, rozet görselleri ve
      anahtar kelime satırlarıyla birlikte; Global AI Hub kural gereği linksiz kalıyor)
- [ ] Proje kapak görselleri kısmen teslim edildi (Köklü Hukuk 2026-09-02'de `cover` +
      `coverAlt` aldı); kalan beş proje hâlâ kapaksız, sahibinden gelince aynı desenle
      eklenecek
- [ ] Speaking verisi (etkinlik, konu, tarih) henüz teslim edilmedi, sahibinden gelince
      Konuşmalar bloğu doldurulacak
- [ ] Yazı ve proje sayfalarının sonundaki paylaş bloğu (X/LinkedIn/WhatsApp/e-posta,
      bağlantıyı kopyala) ve gösterdiği kart bir tarayıcıda gözle kontrol edildi; kartın
      kendisi sayfanın kendi OG rotası (`/opengraph-image/default`), kimlik kartı değil

## 3. SEO ve i18n

- [ ] `https://www.dogancanyildiz.com/sitemap.xml` Search Console'a gönderildi ve hatasız işlendi
- [ ] Search Console'da hem `/` (Türkçe) hem `/en` kapsamı doğrulandı (2026-08-30: TR kökte, EN /en altında)
- [ ] Search Console URL inceleme aracıyla bir blog yazısının `/yazilar/<tr-slug>` adresi
      (yalnız EN olan varsa `/en/blog/<en-slug>`) tek tek incelendi, dizinlenebilir çıktı
- [ ] Bir hreflang test aracıyla (technicalseo.com hreflang tester) ana sayfa, `/hakkimda`,
      `/projeler`, `/en/about`, `/en/projects`, bir proje detayı ve iki dilli blog yazısı tek tek
      tarandı, self-referencing ve karşılıklı hreflang hatası yok
- [ ] Yalnız TR olan blog yazısının `/en/blog/<slug>` adresi 404 dönüyor ve EN sitemap'inde geçmiyor
- [ ] 308 tablosu doğrulandı: `/about` -> `/en/about`, `/projects` -> `/en/projects`, `/contact` -> `/en/contact`, `/blog` -> `/en/blog`, `/blog/capt-sinavina-hazirlik` -> `/yazilar/capt-sinavina-hazirlik` (öneksiz Türkçe slug Türkçe kalır), `/en/blog/capt-sinavina-hazirlik` -> `/en/blog/capt-preparation-in-a-docker-lab`, `/projeler/gpa-calculator` -> `/projeler/not-ortalamasi-hesaplayici`, `/tr/hakkimda` benzeri fazla önekler ve `/tr/about` prefix'siz TR karşılığına tek 308 ile düşüyor; hiçbir zincirde döngü yok (tam tablo: `docs/04-i18n.md`)
- [ ] `robots.txt` doğru domain'i ve `Disallow: /api/` satırını içeriyor
- [ ] `/feed.xml` (TR) ve `/en/feed.xml` 200 ve `application/rss+xml` dönüyor; `/tr/feed.xml` 308 ile köke düşüyor
- [ ] `/opengraph-image` (TR kökü) ve `/en/opengraph-image` ile bir blog/proje OG rotası 200 ve PNG dönüyor
      (2026-08-28 denetiminde 500 veriyordu, statik font instance'larıyla düzeltildi); bir
      paylaşım önizlemesi (LinkedIn/Slack) doğru görseli gösteriyor
- [ ] Rich Results Test: `/` (Person + WebSite), bir blog yazısı (BlogPosting + BreadcrumbList)
      ve bir proje (CreativeWork + BreadcrumbList) hatasız

## 4. Performans ve erişilebilirlik

- [ ] Lighthouse (mobil, production URL): Performance, Accessibility, Best Practices ve
      SEO skorları kaydedildi; SEO 100, Accessibility 95 altına düşmüyor; CLS ve LCP ayrıca
      not edildi (font fallback ve SSR görünürlük düzeltmeleri ölçümsüz kapandı)
- [ ] DevTools Network sekmesinde Google Fonts isteği yok
- [ ] `prefers-reduced-motion: reduce` açıkken hiçbir kayma veya fade animasyonu çalışmıyor

## 5. Contact ve altyapı

- [ ] Production'da contact formu uçtan uca test edildi, gerçek e-posta `me@dogancanyildiz.com`
      adresine ulaştı
- [ ] `Origin` başlığı olmayan düz bir `curl` POST'u `/api/contact`'tan 403 alıyor (honeypot
      okunmadan, transport kontrolü)
- [ ] `Content-Type: application/json` ve `Origin: https://www.dogancanyildiz.com` taşıyan, honeypot
      alanı (`extra_field`) dolu bir `curl` 200 alıyor ama posta kutusuna hiçbir mesaj düşmüyor
      (doğrulama yanıt kodu değil, mesajın gelmemesi)
- [ ] Gerçek tarayıcı gönderiminde 403 yok (Cloudflare veya Coolify `Origin`'i kırpmıyor);
      yanıtta `X-Request-Id` var ve Coolify logunda aynı kimlikle JSON satırı görünüyor
- [ ] Bir deploy `CSP_REPORT_ONLY=1` ile yapıldı, `csp-violation` log satırları 1-2 saat
      izlendi, değişken kaldırılıp yeniden deploy edildi (ölçüm penceresi)
- [ ] `curl -I https://dogancanyildiz.sh/tr/about` tek atlamada
      `https://www.dogancanyildiz.com/tr/about` adresine 301 dönüyor (site sahibinin
      2026-08-27 kararıyla domain yönü tersine döndü, 2026-09-02 kararıyla kanonik host
      www oldu, bkz. `docs/11-acik-sorular.md` soru 5)
- [ ] `curl -I https://dogancanyildiz.com/` tek atlamada `https://www.dogancanyildiz.com/`
      adresine 301 dönüyor (apex -> www, karar 2026-09-02)
- [ ] Coolify sağlık kontrolü yeşil, `/api/health` 200 ve gövdede `"status":"ok"`
      (`degraded` ise Coolify'da `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_EMAIL` veya `FROM_EMAIL` eksik;
      container açılış logunda aynı hata satırı görünür)
- [ ] Yanıt başlıklarında `strict-transport-security`, `x-frame-options: DENY`,
      `cross-origin-opener-policy` ve `content-security-policy` (`report-uri /api/csp-report`
      ile) görünüyor; `http://` istek 301 ile `https://`'e dönüyor (Cloudflare Always Use HTTPS)
- [ ] Uptime Kuma Coolify'da yayında, `https://www.dogancanyildiz.com/api/health` monitörü yeşil,
      bir bildirim kanalı bağlı ve bir test uyarısı gerçekten ulaştı; public status sayfası
      açık ve `NEXT_PUBLIC_STATUS_URL` o sayfayı gösteriyor (Systems panelindeki link çalışıyor)
- [ ] Site `umami.dravcore.com`'daki merkezi Umami'ye website olarak eklendi, onay sonrası
      ziyaretler panelde görünüyor, sayfada CSP ihlali yok
