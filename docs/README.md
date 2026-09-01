# dogancanyildiz.com Karar Dokümanları

Durum: Kod tarafı uygulandı (Faz 0-5 main'de, PR #2-#6 ve #31, son sürüm v0.3.1); 28 Ağustos denetiminin kod bulguları `feature/audit-closure` dalında kapatıldı (`plans/handoffs/denetim-kapanisi-2026-08-28.md`); kalan: sahibinin panel/DNS adımları, içerik teslimatları ve canlı doğrulamalar (site 2026-08-28'de Cloudflare 526 ile kapalı). Sürüm geçmişi kökteki [`CHANGELOG.md`](../CHANGELOG.md)'de tutuluyor. · Karar: 2026-08-27 · Güncelleme: 2026-08-28 · Kapsam: dogancanyildiz.com

Bu klasör, yarım kalmış portfolio reposunun modernizasyonu için yapılan denetim, araştırma ve karar kayıtlarını tutar. Kararlar 27 Ağustos 2026'da 3 denetim ve 6 araştırma ajanının çıktılarından sentezlendi, stack önerisi iki karşıt lensle doğrulandı. 2026-08-28 itibarıyla kararların kod tarafı tamamlandı: Faz 0-4 main dalında sırayla merge edildi (PR #2-#6, 2026-08-27), ana domain `.com` ve release akışı PR #7/#8 ile (v0.2.0), güven sinyalleri ve editoryal UI PR #11/#12 ile (v0.3.0), repo public yapılıp Dependabot/CodeQL kuruldu (PR #14), Faz 5 PR #31 ile main'e girdi (v0.3.1). Aynı gün 16 boyutlu bir denetim (162 bulgu) yapıldı ve kod tarafındaki açık bulgular `feature/audit-closure` dalında kapatıldı; ilgili dosyaların "Durum" satırları ve "Uygulama durumu (2026-08-28)" bölümleri buna göre güncellendi. Panel adımları (Coolify, Cloudflare, Traefik, Resend, Gatus, Umami) hâlâ sahibinde. Uygulamanın çalışma kayıtları docs/plans/ (faz planları) ve docs/plans/handoffs/ (devir notları, manuel checklist'ler) altında tutulur.

Tek gerçek kaynak bu klasördür. Site içeriği (biyografi, projeler, sertifikalar) `.local/content/portfolio-content.md` dosyasında durur ve gitignored'dır; kod ve dokümanlar bu dosyaya referans verir, kopyalamaz.

## Dosyalar

| Dosya | Konu | Okuma sırası |
|---|---|---|
| [00-ozet-ve-karar.md](00-ozet-ve-karar.md) | Üç kritik sorun, ana karar seti, fazların özeti, kararlar tablosu | 1 |
| [01-mevcut-durum-denetimi.md](01-mevcut-durum-denetimi.md) | 36 bulgu (frontend, backend/API, devops/repo), kanıtlar, korunacak parçalar | 2 |
| [02-stack-karari.md](02-stack-karari.md) | Next.js / Astro / SvelteKit / Nuxt / TanStack Start karşılaştırması, ölçümler, karşıt doğrulama, tripwire | 3 |
| [04-i18n.md](04-i18n.md) | Cookie i18n'den app/[lang] + next-intl'e geçiş, URL şeması, çeviri politikası | 4 |
| [06-devops-ve-deploy.md](06-devops-ve-deploy.md) | Dockerfile, Coolify, GitHub Actions, Traefik yönlendirme, env ayrımı | 5 |
| [03-tasarim-ui-ux.md](03-tasarim-ui-ux.md) | Terminal Editorial yönü, tipografi, nötr palet, layout, hareket, erişilebilirlik | 6 |
| [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) | Velite içerik pipeline'ı, contact sertleştirme (Turnstile ertelendi; posta 2026-08-31'den beri Mailcow SMTP), izleme/ölçüm kararları (2026-08-30'dan beri Uptime Kuma + merkezi Umami; Gatus bölümleri tarihsel) | 7 |
| [07-seo-ve-metadata.md](07-seo-ve-metadata.md) | generateMetadata, canonical/hreflang, sitemap, robots, JSON-LD, OG image | 8 |
| [08-icerik-stratejisi.md](08-icerik-stratejisi.md) | Sektör araştırması, case study formatı, içerik kararları, içerik dosyasının siteye haritası | 9 |
| [09-guvenlik.md](09-guvenlik.md) | CVE'ler ve 16.3.3 zorunluluğu, yayın öncesi güvenlik listesi, bakım otomasyonu | 10 |
| [10-yol-haritasi.md](10-yol-haritasi.md) | Faz 0-5, madde listeleri, bitiş kriterleri, launch noktası | 11 |
| [11-acik-sorular.md](11-acik-sorular.md) | Site sahibine 11 soru; tamamı 2026-08-27'de cevaplandı, açık soru sayısı 0 (soru 5: `.com` ana domain, `.sh` 301) | 12 |
| [12-kaynaklar.md](12-kaynaklar.md) | Dayanılan tüm URL'ler, kategoriye göre | referans |
| [launch-checklist.md](launch-checklist.md) | Yayın kapısı: otomatik kapılar, içerik, SEO/i18n, performans/erişilebilirlik, contact/altyapı; dogancanyildiz.sh -> dogancanyildiz.com 301 için önce alan adı kararı gerekiyor (.sh -> .com 301, .sh kayıtlı değil) | uygulama, launch öncesi |
| [trust-maintenance-checklist.md](trust-maintenance-checklist.md) | Güven sinyallerinin bakım ritmi (linkler, JSON-LD, Search Console, sahibinin içerik teslimatları) | bakım |
| [deploy/](deploy/) ve [runbooks/](runbooks/) | Panel checklist'leri (Coolify, Cloudflare, Traefik, Mailcow SMTP) ve altyapı runbook'u (Uptime Kuma, merkezi Umami, env değişkenleri) | uygulama |
| [plans/](plans/) | Faz başına uygulama planı (writing-plans formatı), 2026-08-27-faz-0..5 dosyaları; kararlar dokümanlarından türetildi, faz yürütülürken izlendi; `.sh` domain varsayımıyla yazıldığı için `plans/README.md`'deki not | uygulama kaydı |
| [plans/handoffs/](plans/handoffs/) | Faz başına devir notu (faz-N.md), sahibinin manuel checklist'i (faz-N-manual-checklist.md), ek notlar (faz-3-notlar.md, faz-4-brief.md) ve 28 Ağustos denetim kapanışının devir notu (denetim-kapanisi-2026-08-28.md); bir fazın gerçekte ne yaptığının, nelerin sahibi beklediğinin kanıtı | uygulama kaydı |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Keep a Changelog biçiminde sürüm geçmişi; `release.yml` her `main` merge'inde günceller | referans |

## Nasıl güncellenir

- Bir karar değişirse ilgili dosyanın "Durum" satırı (Öneri -> Onaylandı -> Uygulandı) ve `00-ozet-ve-karar.md` içindeki kararlar tablosu birlikte güncellenir.
- Yeni bir ölçüm eski bir rakamı geçersiz kılarsa eski değer silinmez, yanına tarih ve yeni değer yazılır (02-stack-karari.md'deki Astro ayak izi örneğindeki gibi).
- Açık sorulardan biri cevaplanınca 11-acik-sorular.md'de cevap işlenir ve varsayılanı kullanan dokümanlar düzeltilir.

### Durum değerleri sözlüğü

Her karar dokümanının 2-3. satırındaki "Durum" alanı şu değerlerden birini alır:

| Durum | Anlamı |
|---|---|
| Öneri, site sahibinin onayını bekliyor | Karar yazıldı, henüz onaylanmadı veya uygulanmadı. |
| Onaylandı | Sahibi kararı onayladı, uygulama henüz başlamadı veya sürüyor. |
| Uygulandı (Faz N, PR #M) | Karar tamamen koda döndü, ilgili faz dalı PR #M olarak açıldı veya merge edildi. |
| Kısmen uygulandı (…), kalan: … | Kararın bir kısmı koda döndü, kalan kısım açıkça sayılır (ör. panel adımı, sahibinin teslimatı, Faz 5). |
| Öneri, Faz 5'te uygulanacak | Karar onaylı ama ilgili faz henüz başlamadı. |

Bir dosyanın "Durum" satırı güncellenince aynı düzenlemede "Karar" (kararın alındığı tarih, sabit kalır) ve "Güncelleme" (satırın son düzenlendiği tarih) alanları da yazılır; ikisi farklı tarih taşıyabilir. Dosyanın gövdesindeki karar metni tarihsel kayıt olarak korunur, silinmez; değişen bir karar "Karar değişikliği:" etiketiyle işaretlenir ve dosyaya "## Uygulama durumu (tarih)" bölümü eklenir (ne uygulandı, plandan sapmalar ve gerekçesi, hâlâ açık olanlar).
