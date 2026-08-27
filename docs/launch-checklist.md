# Yayın öncesi kontrol listesi (Faz 4 launch gate)

Bu listenin tamamı geçmeden `dogancanyildiz.com -> dogancanyildiz.sh` 301 yönlendirmesi
canlıya alınmaz (bkz. `docs/00-ozet-ve-karar.md`, Uygulama notları).

Durum (2026-08-27, Faz 4 HEAD `8b4fe40`, PR #6 açık): bölüm 1'in tamamı ve bölüm 2'nin
repoda doğrulanabilir maddeleri yerelde ve CI'da geçti, işaretlendi. İşaretsiz kalanlar
ya sahibinin teslimatını ya da canlı URL/tarayıcı gerektiren manuel kontrolleri bekliyor.

## 1. Otomatik kapılar

- [x] `npm run typecheck` hatasız
- [x] `npm run lint` hatasız
- [x] `npm test` tüm testler geçiyor (şema, içerik katmanı, sitemap, profil, kalıntı):
      32 dosya / 458 test
- [x] `npm run format` hatasız
- [x] `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build` başarılı ve build
      çıktısında dynamic (ƒ) yalnızca `/api/*` altında (`/api/contact`, `/api/health`);
      `npm run verify:routes` 26 içerik route'unu statik doğruluyor

## 2. İçerik

- [x] En az 4 proje ve 3 blog yazısı yayında (5 proje x 2 locale, 4 yazı: 1 EN, 3 TR)
- [x] Kapaksız yayınlanan projelerde CSS gradyan veya stok görsel yok (`content/images/`
      boş, `covers=0`)
- [x] Sertifika satırları listede, `verifyUrl` gelmeyenlerde link yok ama satır duruyor
- [x] Konuşmalar bloğu ya gerçek veriyle dolu ya da hiç render edilmiyor (`speaking` dizileri
      boş, blok render edilmiyor)
- [x] CV PDF `public/cv/dogancanyildiz-cv.pdf` yolunda ise Download CV butonu görünüyor,
      dosya yoksa buton hiç yok (dosya commit'li, buton bu yola bağlı)
- [ ] Sahibi üç blog yazısını ve beş proje case study'sini yayından önce doğruluk açısından
      gözden geçirdi; bu metinler `.local/content/portfolio-content.md` dosyasından
      türetildi, dosyadaki bir hata veya eksik olduğu gibi siteye geçmiş olabilir
- [ ] Sahibi CV PDF içeriğini onayladı; dosyanın içinde bir telefon numarası veya özel bir
      adres varsa bu, dosya `public/cv/` altında yayınlandığı için herkese açık olur
- [ ] Sahibi Wikonya projesinin canlı link kontrolünü yaptı; hedef site artık kendini
      "Konya Genç" olarak tanıtıyor, link hâlâ doğru hedefi mi gösteriyor teyit edilmeli
- [ ] Sertifika `verifyUrl` değerleri henüz teslim edilmedi, sahibinden gelince eklenecek
- [ ] Proje kapak görselleri henüz teslim edilmedi, sahibinden gelince eklenecek
- [ ] Speaking verisi (etkinlik, konu, tarih) henüz teslim edilmedi, sahibinden gelince
      Konuşmalar bloğu doldurulacak

## 3. SEO ve i18n

- [ ] `https://dogancanyildiz.sh/sitemap.xml` Search Console'a gönderildi ve hatasız işlendi
- [ ] Search Console'da hem `/` hem `/tr` kapsamı doğrulandı
- [ ] Search Console URL inceleme aracıyla yalnız Türkçe olan bir blog yazısının
      `/tr/blog/<slug>` adresi tek tek incelendi, dizinlenebilir çıktı
- [ ] Bir hreflang test aracıyla (technicalseo.com hreflang tester) ana sayfa, `/about`,
      `/projects`, bir proje detayı ve iki dilli blog yazısı tek tek tarandı, self-referencing
      ve karşılıklı hreflang hatası yok
- [ ] Yalnız TR olan blog yazısının EN adresi 404 dönüyor ve EN sitemap'inde geçmiyor
- [ ] `robots.txt` doğru domain'i ve `Disallow: /api/` satırını içeriyor
- [ ] `/feed.xml` ve `/tr/feed.xml` 200 ve `application/rss+xml` dönüyor

## 4. Performans ve erişilebilirlik

- [ ] Lighthouse (mobil, production URL): Performance, Accessibility, Best Practices ve
      SEO skorları kaydedildi; SEO 100, Accessibility 95 altına düşmüyor
- [ ] DevTools Network sekmesinde Google Fonts isteği yok
- [ ] `prefers-reduced-motion: reduce` açıkken hiçbir kayma veya fade animasyonu çalışmıyor

## 5. Contact ve altyapı

- [ ] Production'da contact formu uçtan uca test edildi, gerçek e-posta `me@dogancanyildiz.com`
      adresine ulaştı
- [ ] Honeypot alanı dolu bir `curl` isteği 4xx ile reddediliyor
- [ ] `curl -I https://dogancanyildiz.com/tr/about` tek atlamada
      `https://dogancanyildiz.sh/tr/about` adresine 301 dönüyor (site sahibinin domain
      onayı alındıktan sonra, bkz. `docs/11-acik-sorular.md` soru 5)
- [ ] Coolify sağlık kontrolü yeşil, `/api/health` 200 dönüyor
