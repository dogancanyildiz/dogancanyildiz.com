# Faz Planları (arşiv)

Durum: Arşiv · Kapsam: dogancanyildiz.com · Güncelleme: 2026-09-03

Modernizasyon 27 Ağustos 2026'da faz başına bir uygulama planıyla yürütüldü;
her fazın sonunda bir devir notu ve sahibi için bir manuel checklist yazıldı.
Fazların hepsi tamamlandı, site 3 Eylül 2026'da yayına çıktı ve plan
dosyalarıyla devir notları depodan kaldırıldı. Bu dosya hangi fazın ne yaptığını
ve hangi PR ile geldiğini tutar; tam metinler git geçmişinde duruyor.

## Fazlar

| Faz | Ne yaptı | PR |
| --- | --- | --- |
| 0. Güvenlik ve hijyen | next 16.1.6 -> 16.3.3, güvenlik başlıkları ve CSP, contact route'unun sunucu tarafında sertleştirilmesi, `/api/health`, Node 24 pini, create-next-app kalıntılarının temizliği. | #2 |
| 1. Deploy hattı | Çok aşamalı Dockerfile, `.dockerignore`, GitHub Actions kapısı, `docker-compose.yml` (yalnızca yerel doğrulama) ve panel checklist'lerinin ilk hali. | #3 |
| 2. i18n yeniden mimarisi | Cookie tabanlı i18n yerine `app/[lang]` + next-intl, `proxy.ts`, canonical/hreflang/x-default, tüm içerik rotalarının statik üretime alınması. | #4 |
| 3. Tasarım sistemi | Vendor'lanmış fontlar (`next/font/local`), nötr oklch palet, mobil menü, erişilebilirlik ve hareket kuralları. | #5 |
| 4. İçerik ve yayın | Velite içerik pipeline'ı, gerçek case study'ler ve blog yazıları, şablon persona'nın tamamen kaldırılması. | #6 |
| 5. Altyapı vitrini ve ölçüm | Systems paneli, build SHA ve tarihi, Umami entegrasyonu, Dependabot ve CodeQL. | #31 |
| Yerel yollar ve çeviri slug'ı (faz dışı) | TR bölüm ve detay yollarının Türkçeleşmesi, `translationKey` ile çeviri eşlemesi, üç 308 tablosu. | #45 |

Faz numarası taşımayan turlar: `.com` ana domain kararı ve sürüm otomasyonu
(#7, #8), güven sinyalleri ve editoryal UI yenilemesi (#11, #12), deponun public
yapılması, Dependabot/CodeQL ve güvenlik politikası (#14), 28 Ağustos
denetiminin kod tarafı kapanışı (#34), kimlik/consent/topic/WhatsApp (#35),
Türkçe varsayılan locale (#36), gözlemlenebilirliğin panele taşınması ve Mailcow
SMTP (#37), ultrareview kapanışı (#39), metin yenilemesi (#42, #43), 3. denetim
turu (#44), marka paketi ve sertifika rozetleri (#45), depo adı ve lisans
ayrımı (#49), Coolify apex yönlendirmesi ve healthcheck düzeltmesi (#52),
Umami'nin izin beklemeden yüklenmesi ve özel olaylar (#53).

## Domain varsayımı notu (tarihsel)

Plan dosyaları 27 Ağustos 2026'da, o anki karar olan "dogancanyildiz.sh ana
domain" varsayımıyla yazıldı; metinlerinde bu yönde DNS örnekleri ve env
değerleri geçer. Aynı günün akşamı sahibi yönü tersine çevirdi: ana domain
dogancanyildiz.com, `.sh` yalnızca 301 hedefi. Plan metinleri geriye dönük
düzeltilmedi, uygulama her yerde `.com` ile yapıldı. Bu dosyalar git
geçmişinden okunurken domain örneklerine güvenilmemeli.

## Tam metinlere erişim

Plan ve devir notu dosyalarının tamamı `v0.5.0` etiketinde duruyor:

```bash
git show v0.5.0:docs/plans/2026-08-27-faz-0-guvenlik-ve-hijyen.md
git show v0.5.0:docs/plans/2026-08-27-faz-1-deploy-hatti.md
git show v0.5.0:docs/plans/2026-08-27-faz-2-i18n-app-lang.md
git show v0.5.0:docs/plans/2026-08-27-faz-3-tasarim-sistemi.md
git show v0.5.0:docs/plans/2026-08-27-faz-4-icerik-ve-yayin.md
git show v0.5.0:docs/plans/2026-08-27-faz-5-altyapi-vitrini-ve-olcum.md
git show v0.5.0:docs/plans/2026-09-02-yerel-yollar-ve-ceviri-slug.md

git ls-tree --name-only v0.5.0 docs/plans/handoffs/
git show v0.5.0:docs/plans/handoffs/faz-4.md
```

Güncel kararlar için plan dosyaları değil `docs/` altındaki karar dokümanları
okunur; başlangıç noktası [../00-ozet-ve-karar.md](../00-ozet-ve-karar.md).
