# Faz 5 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi veya kontrol oturumu uygular. Kod tarafı (infra compose dosyaları, `status.ts`, Systems bölümü, Umami script, CSP) repoda hazır; burada kalan iş Cloudflare, Coolify ve Umami panel adımlarıdır.

Durum (2026-08-30): Faz 5 kodu PR #31 ile main'de (v0.3.1). Gözlemlenebilirlik 2026-08-30 kararıyla panele taşındı (bölüm 2); bölüm 3-7 güncel akış, bölüm 8 aynen geçerli.

## 1. PR ve CI

- [x] Faz 5 PR #31 (`dev -> main`) 2026-08-28'de merge edildi; kapsam ve `docs/runbooks/infrastructure.md` referansı PR gövdesinde.
- [x] Zorunlu check'ler yeşil geçti. Güncel adlar: `Quality checks`, `Docker image` (`ci.yml`) ve `CodeQL analysis` (`codeql.yml`); eski `lint`, `typecheck`, `test`, `build`, `hadolint and image build` job adları artık yok.
- [x] Vitest özetinde `tests/lib/status.test.ts` ve `tests/config/csp.test.ts` geçiyor.

## 2. Karar değişikliği (2026-08-30): gözlemlenebilirlik panele taşındı

Bölüm 2-7'nin repodaki compose dosyalarına dayanan eski adımları geçersiz:
`infra/` silindi. İzleme Coolify servis kataloğundan kurulan **Uptime Kuma**,
ziyaret ölçümü sahibinin **merkezi Umami** kurulumu (`umami.dravcore.com`).
Aşağıdaki adımlar güncel akıştır; runbook: `docs/runbooks/infrastructure.md`.

## 3. Coolify: Uptime Kuma

- [ ] + New Resource > Service > Uptime Kuma (katalogdan); imaj sürümünü şablonda sabitle.
- [ ] İlk açılışta yönetici hesabını oluştur (Kuma ilk kullanıcıyı kurulumda ister, varsayılan parola yoktur), domain'i ondan sonra bağla.
- [ ] Monitör: `https://dogancanyildiz.com/api/health`, keyword `"status":"ok"` (health gövdesi `degraded` olursa alarm).
- [ ] En az bir bildirim kanalı bağla (Discord/Telegram/e-posta) ve bir test bildirimi gönder; kanal yoksa kesinti kimseye görünmez.
- [ ] Public status sayfası oluştur, yalnızca genel URL'lere giden monitörleri yayınla (iç hostname/port asla) ve sayfanın adresini not et.
- [ ] Kuma aynı sunucuda: harici ikinci prob (ör. UptimeRobot, `/api/health`) sunucu tümden düştüğünde haber verir; kur.

## 4. Merkezi Umami'ye site kaydı

- [ ] `umami.dravcore.com` paneline gir, Settings > Websites > Add website: Name `dogancanyildiz.com`, Domain `dogancanyildiz.com`.
- [ ] Website UUID'yi not al.
- [ ] Bu sitenin tracker'ı consent onayından sonra enjekte edilir ve `data-domains="dogancanyildiz.com"` taşır; merkezi kurulumdaki diğer siteler bu kayda veri yazamaz.

## 5. (Kaldırıldı)

Repo tarafında Gatus/Umami kurulumu kalmadı; bu bölüm tarihsel olarak boş.

## 6. Coolify: portfolio ortam değişkenleri

Portfolio uygulamasında:

| Key | Value | Build Variable |
|---|---|---|
| `NEXT_PUBLIC_STATUS_URL` | Kuma public status sayfasının adresi | **açık** |
| `UMAMI_SCRIPT_URL` | `https://umami.dravcore.com` | **açık** |
| `UMAMI_WEBSITE_ID` | merkezi Umami'den alınan UUID | **açık** |

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BUILD_SHA`, `NEXT_PUBLIC_BUILD_DATE` zaten Build Variable olarak set edilmiş olmalı (Faz 1).

- [ ] Redeploy portfolio uygulaması.

## 7. Canlı doğrulama

```bash
curl -s https://dogancanyildiz.com/ | grep -o 'href="https://[^"]*"' | grep -i status
curl -sI https://dogancanyildiz.com/ | tr -d '\r' | grep -i '^content-security-policy:' | grep -c 'umami.dravcore.com'
curl -s https://dogancanyildiz.com/ | grep -Eic ':8080|:3001|127\.0\.0\.1'
```

Beklenen: ilk komut Systems panelindeki status linkini basar; CSP sayacı `1`; topoloji grep'i `0`. Tarayıcıda consent onayı sonrası `umami.dravcore.com/script.js` yüklenir, `data-website-id` UUID'yi ve `data-domains="dogancanyildiz.com"`ı taşır.

## 8. Dependabot ve CodeQL (GitHub Settings)

- [ ] Settings > Code security: Dependabot alerts ve security updates açık.
- [ ] `.github/dependabot.yml` üç ecosystem (`npm`, `github-actions`, `docker`) `dev` hedefli.
- [ ] CodeQL workflow PR/push/schedule koşuyor.
- [ ] En az bir Dependabot PR (açık veya merged) `npm`, `github-actions` veya `docker` için mevcut veya beklenen schedule sonrası oluşacak.

## 9. Release (merge sonrası)

- [x] Faz 5 `main`'e PR #31 ile girdi; PR #31'in squash başlığı Conventional Commits biçiminde olmadığı için o push sürüm üretmedi, hemen ardından gelen PR #32 (`fix(deps)`) ile `release.yml` v0.3.1 tag'ini ve GitHub Release'i kesti, Faz 5 bu sürümün içinde (v0.2.0 ve v0.3.0 daha önce kesilmişti).
- [x] `release/sync-v0.3.1` PR #33 `dev`'e merge edildi.

## Açık / opsiyonel

- Umami 2FA isteniyor mu?
- İmaj sürümleri (Uptime Kuma, merkezi Umami) 2026-08-30 kararıyla panelde elle sabitlenir; repo ve Dependabot izlemez (tarihsel not: 2026-08-28 kapanışındaki `infra/` pinleri ve `GATUS_ALERT_WEBHOOK_URL` bu kararla geçersizleşti, bkz. `denetim-kapanisi-2026-08-28.md` "Ek karar" bölümleri).
- Runtime `GIT_SHA` entrypoint migration bilinçli olarak yapılmadı; footer ve Systems `NEXT_PUBLIC_BUILD_SHA/DATE` kullanıyor.
