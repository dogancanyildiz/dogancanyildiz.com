# dogancanyildiz.com Dokümanları

Durum: Site 2026-09-03'te yayında (v0.5.0) · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Bu klasör sitenin mimari kararlarını, panel kurulum checklist'lerini ve
kapanmamış işleri tutar. Başlangıç noktası
[00-ozet-ve-karar.md](00-ozet-ve-karar.md).

Site içeriği (biyografi, projeler, sertifikalar) `.local/content/portfolio-content.md`
dosyasında durur ve gitignored'dır; kod ve dokümanlar bu dosyaya referans verir,
kopyalamaz. Sürüm geçmişi kökteki [`CHANGELOG.md`](../CHANGELOG.md)'de.

## Dosyalar

| Dosya | Konu |
| --- | --- |
| [00-ozet-ve-karar.md](00-ozet-ve-karar.md) | Nereden başlandı, bugünkü durum, kararlar tablosu, stack gerekçesi, fazlar, karar geçmişi, kapsam dışı bırakılanlar |
| [03-tasarim-ui-ux.md](03-tasarim-ui-ux.md) | Terminal Editorial yönü, tipografi, nötr palet, token sözleşmesi, marka paketi, erişilebilirlik |
| [04-i18n.md](04-i18n.md) | `app/[lang]` + next-intl, TR varsayılan ve yerelleştirilmiş yollar, `translationKey`, 308 tabloları |
| [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md) | Velite içerik pipeline'ı, contact formu savunması, Mailcow SMTP, Systems paneli, merkezi Umami |
| [06-devops-ve-deploy.md](06-devops-ve-deploy.md) | Dockerfile, CI, Coolify, Cloudflare ve Traefik kararları, env katmanları, dallanma ve sürüm akışı |
| [07-seo-ve-metadata.md](07-seo-ve-metadata.md) | `generateMetadata`, canonical/hreflang/x-default, sitemap, robots, JSON-LD, OG kartları, RSS |
| [08-icerik-stratejisi.md](08-icerik-stratejisi.md) | Case study formatı, blog dil politikası, sertifika ve eğitim sunumu, içerik kontrol listesi |
| [09-guvenlik.md](09-guvenlik.md) | CVE hattı, güvenlik başlıkları ve CSP, env sırları, Cloudflare güven sınırı, bakım otomasyonu |
| [11-acik-isler.md](11-acik-isler.md) | Kapanmamış işler: teslimatlar, panel adımları, canlı doğrulamalar, kabul edilmiş teknik borç |
| [trust-maintenance-checklist.md](trust-maintenance-checklist.md) | Güven sinyallerinin bakım ritmi (linkler, JSON-LD, Search Console) |
| [deploy/](deploy/) | Panel checklist'leri: Coolify, Cloudflare, Traefik/origin, Mailcow SMTP |
| [runbooks/infrastructure.md](runbooks/infrastructure.md) | Uptime Kuma, merkezi Umami, ortam değişkenleri, bakım ritmi |
| [plans/README.md](plans/README.md) | Faz planlarının arşiv özeti ve git geçmişindeki tam metinlere erişim |

Numaralar dosya kimliği, sıra değil: 01, 02, 10 ve 12 numaralı dokümanlar
2026-09-03'te 00'a katıldı veya kaldırıldı, kalanların numarası kaynak
kodundaki referanslarla uyumlu kalsın diye korundu. Kaldırılan dosyaların tam
metinleri `git show v0.5.0:docs/<dosya>` ile okunur.

## Nasıl güncellenir

- Bir karar değişirse ilgili dosyanın "Durum" satırı ve
  `00-ozet-ve-karar.md`'deki kararlar tablosu birlikte güncellenir; yön
  değiştiren kararlar ayrıca oradaki "Karar geçmişi" tablosuna bir satır
  ekler.
- Kapanan bir iş `11-acik-isler.md`'den çıkarılır, ilgili dokümanda tek
  cümleyle "yapıldı" olarak kaydedilir.
- Gövde metinleri güncel durumu anlatır. Tarihsel karar metni gövdede
  tutulmaz, "Karar geçmişi" tablosuna taşınır; ayrıntısı gerekiyorsa git
  geçmişinden okunur.
- `npm run verify:docs` bu klasörle deploy checklist'leri arasındaki birkaç
  yapısal tutarlılığı (domain yönü, locale şeması, deploy adımlarının
  yayınlanan davranışla uyumu) CI'da denetler; bir dosyayı yeniden
  adlandırırken `scripts/verify-docs.mjs` de güncellenmeli.
