# Devir Notları (Handoff Notes)

Bu dizin, portfolio modernizasyon projesinin her fazından sonra teslim edilen devir notlarını ve manuel checklist'lerini içerir. Dosyalar faz lideri ve/veya doğrulayıcı tarafından yazılır ve bir sonraki faz başlamadan önce site sahibinin okuma ve onaylama sorumluluğudur.

**Domain varsayımı notu (2026-08-27):** bu dizindeki devir notları ve checklist'ler 2026-08-27'de ana domain `.sh` varsayımıyla yazıldı; aynı günün akşamı karar `.com` oldu, metinler tarihsel kayıt olarak değiştirilmedi, fiili uygulama `.com` ile yapıldı (ayrıntı: [../README.md](../README.md) "Domain varsayımı notu").

## Dosya dizini

| Dosya | Faz | İçerik | Durum |
|-------|-----|--------|-------|
| faz-0.md | 0 | Devir notu: Güvenlik, CVE'ler, hijyen | Uygulandı, PR #2 merged |
| faz-0-manual-checklist.md | 0 | Site sahibine yapması gereken manuel adımlar | Tamamlanacak |
| faz-1.md | 1 | Devir notu: Docker, Coolify, Cloudflare, Traefik | Uygulandı, PR #3 merged |
| faz-1-manual-checklist.md | 1 | Site sahibine yapması gereken manuel adımlar (panel konfigurasyonu) | Tamamlanacak |
| faz-2.md | 2 | Devir notu: i18n yeniden mimarisi, app/[lang] + next-intl | Uygulandı, PR #4 merged |
| faz-2-manual-checklist.md | 2 | Site sahibine yapması gereken manuel adımlar | Tamamlanacak |
| faz-3.md | 3 | Devir notu: Tasarım sistemi, tipografi, palet, hareket | Uygulandı, PR #5 merged |
| faz-3-notlar.md | 3 | Ara notlar: Task 0 doğrulaması ve plan düzeltmeleri | Bilgi amaçlı |
| faz-3-manual-checklist.md | 3 | Site sahibine yapması gereken manuel adımlar | Tamamlanacak |
| faz-4.md | 4 | Devir notu: İçerik pipeline, Velite, gerçek içerik, blog | Yazıldı (commit `2ffa35b`), PR #6 açık, merge kararı sahibinde |
| faz-4-brief.md | 4 | Görev brief'i: Faz 4 uygulanacak işlerin özeti | Başlangıç referansı |
| faz-4-manual-checklist.md | 4 | Site sahibine yapması gereken manuel adımlar | Tamamlanacak |

## Okuma sırası

Bir faz tamamlandıktan sonra şu sırayla okuyun:

1. **Görev brief'i** (varsa, örn. faz-4-brief.md): Faz başında yazılan, yapılacak işlerin özeti.
2. **Devir notu** (faz-N.md): Faz lideri tarafından yazılan, neler yapıldı, sapmalar, açık kalan işler ve teslimat.
3. **Manuel checklist** (faz-N-manual-checklist.md): Site sahibine yapması gereken panel konfigürasyonu, DNS ayarları, ortam değişkenleri vb.
4. **Ara notlar** (varsa, örn. faz-3-notlar.md): Faz sırasında doğrulama yapan tarafından yazılan ek bilgiler.

## Devir notu formatı

Her devir notu şunu içerir:

- **Neler yapıldı:** Faz boyunca tamamlanan task'lar ve PR detayları.
- **Sapmalar ve gerekçeler:** Plan'dan kasıtlı olarak sapılan yerler ve neden sapıldığı.
- **Açık kalan işler:** Bir sonraki faza devredilen işler.
- **Test sonuçları:** CI test sayısı, coverage, build sonuçları.
- **Deployment hazırlığı:** Production ortamında çalışması için gerekli konfigürasyonlar.

## Manuel checklist formatı

Her manuel checklist şunu içerir:

- **Panel ayarları:** Coolify, Cloudflare, Traefik üzerinde yapılması gereken konfigürasyonlar.
- **Ortam değişkenleri:** Ayarlanması gereken build ve runtime değişkenleri.
- **DNS ve domain:** Gerekiyorsa DNS kayıtları ve domain yönlendirmeleri.
- **Doğrulama adımları:** Ayarların doğru çalışması için curl/tarayıcı testleri.
- **Akış diyagramı:** Trafik akışı ve bileşen arası ilişkiler.

## Proje timeline

- **Faz 0**: Güvenlik ve hijyen (✓ merged PR #2)
- **Faz 1**: Deploy hattı (✓ merged PR #3)
- **Faz 2**: i18n mimarisi (✓ merged PR #4)
- **Faz 3**: Tasarım sistemi (✓ merged PR #5)
- **Faz 4**: İçerik pipeline (⏳ PR #6 açık, CI yeşil, HEAD `8b4fe40`, 21 commit; merge kararı sahibinde)
- **Faz 5**: Altyapı vitrini, otomasyonlar (⧗ henüz başlamadı; devir notu ve manuel checklist'i yok)

## Notlar

- Manuel checklist'ler site sahibi tarafından **yapılmalı**, faz lideri tarafından **yürütülmemelidir**.
- Devir notları yalnızca başarıyla merge edilmiş PR'ler için yazılır; açık PR'lerin devir notu PR kapatılmadan önce yazılabilir.
- Faz 5'te Faz 4'ün açık kalan işleri ve devir notundaki uyarılar bir sonraki görev çıktısı olur.
