# Faz Planları

Durum: Tarihsel kayıt · Karar: 2026-08-27 · Güncelleme: 2026-08-28 · Kapsam: dogancanyildiz.com

Bu klasör, `docs/`'taki karar dokümanlarından türetilen faz başına uygulama
planlarını tutar (writing-plans formatı). Her `2026-08-27-faz-N-*.md` dosyası
ilgili faz başlamadan önce yazıldı ve faz yürütülürken adım adım izlendi;
gerçekte ne yapıldığı, sapmalar ve teslim durumu için bu dosyalar değil
`docs/plans/handoffs/faz-N.md` (devir notu) ve `docs/00-ozet-ve-karar.md` /
`docs/10-yol-haritasi.md`'deki "Uygulama durumu" bölümleri tek doğru kaynaktır.

## Domain varsayımı notu (2026-08-27)

Bu klasördeki plan dosyaları 2026-08-27 günü, o anki ana karar
"dogancanyildiz.sh ana domain, dogancanyildiz.com yalnızca 301 hedefi"
varsayımıyla yazıldı; metinlerinde bu yönde domain örnekleri, DNS/redirect
talimatları ve env değerleri geçer. Aynı günün akşamı site sahibi kararı
tersine çevirdi: dogancanyildiz.com ana domain, dogancanyildiz.sh yalnızca
301 ile ona yönlenen ikincil domain oldu (bkz.
[../11-acik-sorular.md](../11-acik-sorular.md) soru 5).

Bu plan dosyalarının metinleri geriye dönük düzeltilmedi; tarihsel kayıt
olarak, yazıldıkları andaki `.sh` varsayımıyla duruyorlar. Fiili uygulama
(kod, testler, `.env.example`, dokümanlar) her yerde `.com` ana domain
kararıyla yapıldı; bkz. `docs/00-ozet-ve-karar.md`, `docs/06-devops-ve-deploy.md`
"Karar değişikliği" notları ve dal `feature/com-primary-and-release-flow`.
Bir plan dosyasını okurken domain örneklerine güvenmeyin, güncel karar için
her zaman `docs/` altındaki numaralı karar dokümanlarına bakın.

**Ek not (2026-08-28):** 28 Ağustos denetimi `dogancanyildiz.sh` alan adının
hiç kayıtlı olmadığını gösterdi (DNS'te zone yok). Faz 5 planı 90 yerde `.sh`
hostname'i kullanıyor (`status.dogancanyildiz.sh`, `analytics.dogancanyildiz.sh`);
uygulama `.com` ile yapıldı (`infra/gatus`, `infra/umami`, `.env.example`).
`.sh` için karar sahibinde: ya alan adı kaydedilip Cloudflare'a eklenir ve
`docs/deploy/cloudflare-kurulum.md` bölüm "Zone: dogancanyildiz.sh" uygulanır,
ya da `.sh` kapsam dışı ilan edilir ve README, launch-checklist, cloudflare-kurulum,
traefik-ve-origin'deki 301 satırları kaldırılır. Karar gelene kadar `.sh -> .com`
301'i "canlıya alınmadı, alan adı kayıtsız" olarak okunmalı (bkz.
`docs/plans/handoffs/denetim-kapanisi-2026-08-28.md`).

## Dosyalar

| Dosya | Faz | Durum |
|---|---|---|
| [2026-08-27-faz-0-guvenlik-ve-hijyen.md](2026-08-27-faz-0-guvenlik-ve-hijyen.md) | 0. Güvenlik ve hijyen | Uygulandı, PR #2 merged |
| [2026-08-27-faz-1-deploy-hatti.md](2026-08-27-faz-1-deploy-hatti.md) | 1. Deploy hattı | Uygulandı, PR #3 merged; panel adımları sahibinde |
| [2026-08-27-faz-2-i18n-app-lang.md](2026-08-27-faz-2-i18n-app-lang.md) | 2. i18n yeniden mimarisi | Uygulandı, PR #4 merged |
| [2026-08-27-faz-3-tasarim-sistemi.md](2026-08-27-faz-3-tasarim-sistemi.md) | 3. Tasarım sistemi | Uygulandı, PR #5 merged |
| [2026-08-27-faz-4-icerik-ve-yayin.md](2026-08-27-faz-4-icerik-ve-yayin.md) | 4. İçerik ve yayın | Uygulandı, PR #6 merged (2026-08-27) |
| [2026-08-27-faz-5-altyapi-vitrini-ve-olcum.md](2026-08-27-faz-5-altyapi-vitrini-ve-olcum.md) | 5. Altyapı vitrini ve ölçüm | Kod tarafı uygulandı, PR #31 merged (2026-08-28, v0.3.1); Coolify/Cloudflare panel adımları `handoffs/faz-5-manual-checklist.md`'de sahibinde |

## İlgili dokümanlar

- [../00-ozet-ve-karar.md](../00-ozet-ve-karar.md) - güncel kararlar tablosu
- [../10-yol-haritasi.md](../10-yol-haritasi.md) - faz sırası ve bitiş kriterleri
- [../11-acik-sorular.md](../11-acik-sorular.md) - domain kararının değişikliği (soru 5)
- [handoffs/README.md](handoffs/README.md) - devir notları ve manuel checklist'ler
