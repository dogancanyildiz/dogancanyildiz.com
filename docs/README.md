# dogancanyildiz.sh Karar Dokümanları

Durum: Öneri, site sahibinin onayını bekliyor · Tarih: 2026-08-27 · Kapsam: dogancanyildiz.sh

Bu klasör, yarım kalmış portfolio reposunun modernizasyonu için yapılan denetim, araştırma ve karar kayıtlarını tutar. Kararlar 27 Ağustos 2026'da 3 denetim ve 6 araştırma ajanının çıktılarından sentezlendi, stack önerisi iki karşıt lensle doğrulandı. Hiçbir karar henüz koda dönüşmedi; onay verildikçe ilgili dosyanın "Durum" satırı güncellenir.

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
| [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) | Velite içerik pipeline'ı, contact sertleştirme (Turnstile ertelendi), Gatus status widget, Umami | 7 |
| [07-seo-ve-metadata.md](07-seo-ve-metadata.md) | generateMetadata, canonical/hreflang, sitemap, robots, JSON-LD, OG image | 8 |
| [08-icerik-stratejisi.md](08-icerik-stratejisi.md) | Sektör araştırması, case study formatı, içerik kararları, içerik dosyasının siteye haritası | 9 |
| [09-guvenlik.md](09-guvenlik.md) | CVE'ler ve 16.3.3 zorunluluğu, yayın öncesi güvenlik listesi, bakım otomasyonu | 10 |
| [10-yol-haritasi.md](10-yol-haritasi.md) | Faz 0-5, madde listeleri, bitiş kriterleri, launch noktası | 11 |
| [11-acik-sorular.md](11-acik-sorular.md) | Site sahibine 11 soru; 10'u 2026-08-27'de cevaplandı, 1'i açık (iletişim domain'inin son hali) | 12 |
| [12-kaynaklar.md](12-kaynaklar.md) | Dayanılan tüm URL'ler, kategoriye göre | referans |

## Nasıl güncellenir

- Bir karar değişirse ilgili dosyanın "Durum" satırı (Öneri → Onaylandı → Uygulandı) ve `00-ozet-ve-karar.md` içindeki kararlar tablosu birlikte güncellenir.
- Yeni bir ölçüm eski bir rakamı geçersiz kılarsa eski değer silinmez, yanına tarih ve yeni değer yazılır (02-stack-karari.md'deki Astro ayak izi örneğindeki gibi).
- Açık sorulardan biri cevaplanınca 11-acik-sorular.md'de cevap işlenir ve varsayılanı kullanan dokümanlar düzeltilir.
