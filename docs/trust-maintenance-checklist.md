# Güven bakımı checklist'i

Portfolyonun güven sinyallerini doğru tutan üç aylık ve yayın anı
kontrolleri. Canlı demo URL'lerini kod haftalık zamanlar
(`.github/workflows/links.yml` `npm run verify:links` çalıştırır, artık
merge kapısı değil); geri kalanı elle.

## Her yayın

- [ ] En son `Live links` workflow koşusu yeşil, veya `npm run build:content`
      ardından yerelde `npm run verify:links` geçiyor (içerikteki canlı demo
      URL'leri ve sertifika doğrulama linkleri).
- [ ] `/` üzerindeki Person JSON-LD `knowsAbout`, `alumniOf`, `worksFor` ve
      `sameAs` içeriyor (şema değişince Rich Results Test).
- [ ] `siteConfig.person.name` `messages/en.json` ve `messages/tr.json`
      içindeki `brand.name` ile aynı (`tests/trust.test.ts` bunu kilitler).

## Üç ayda bir

- [ ] `npm run verify:links`'i yerelde yeniden çalıştır, kırık demo veya
      sertifika doğrulama URL'sini düzelt.
- [ ] `src/content/profile.ts` içindeki sertifika `verifyUrl` değerlerinin
      hâlâ açıldığını doğrula (Credly, Hackviser, Cisco).
- [ ] Yeni bir sertifika gelirse aynı deseni uygula: rozet görselini
      `public/images/badges/`e ekle, `issued`, `verifyUrl` (varsa) ve verenin
      kendi etiketlerinden en çok altı anahtar kelime gir; `withCheckedCertificates`
      eksik alanı, altıdan fazla veya iki dil arasında eşleşmeyen kelime sayısını
      build sırasında düşürür.
- [ ] GitHub, LinkedIn ve site footer linklerini gözden geçir; adın yazımı
      her yerde aynı olmalı.
- [ ] Search Console: ana URL'de yeni yapılandırılmış veri hatası yok;
      sitemap hâlâ temiz işleniyor.

## Sahip içeriği (teslim edilince)

- [ ] `public/images/profile.jpg` (veya `.webp`) Hero ve Hakkımda'da görünür;
      Person şeması `image` kendiliğinden dolar.
- [ ] Proje kapakları `content/images/<slug>-cover.png`, MDX ön maddesinde
      `cover:` ve `coverAlt:`.
- [ ] Yeni CV aynı yola gider; yüklemeden sonra Cloudflare'da `/cv/*`
      önbelleğini temizle (dosya bir günlük cache ile sunulur, adı
      sürümlenmez).
- [ ] `src/content/profile.ts` içinde konuşma kayıtları (`speaking.en` /
      `speaking.tr`).
- [ ] Referanslar onaylandıktan sonra `src/content/testimonials.ts`.
- [ ] `public/cv/dogancanyildiz-cv.pdf` (dosya varken indirme düğmesi
      görünür).

## Search Console (Person şeması güncellemelerinden sonra)

1. `https://www.dogancanyildiz.com/` (ve ayrı indekslenmişse `/en`) üzerinde
   URL Inspection.
2. **Person** zengin sonuç önizlemesini veya kritik hatasız geçerli
   JSON-LD'yi doğrula.
3. Büyük URL veya hreflang değişikliği yayınlandıysa sitemap'i yeniden
   gönder.

## Tutarlılık QA

| Kaynak                   | Alan          | Beklenen              |
| ------------------------ | ------------- | --------------------- |
| `src/lib/site-config.ts` | `person.name` | Doğan Can YILDIZ      |
| `messages/*.json`       | `brand.name`  | Aynı yazım            |
| GitHub profili           | Görünen ad    | Aynı yazım            |
| LinkedIn                 | Ad            | Aynı yazım            |
