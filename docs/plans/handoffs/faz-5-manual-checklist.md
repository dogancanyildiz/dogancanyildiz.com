# Faz 5 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi veya kontrol oturumu uygular. Kod tarafı (infra compose dosyaları, `status.ts`, Systems bölümü, Umami script, CSP) repoda hazır; burada kalan iş Cloudflare, Coolify ve Umami panel adımlarıdır.

Durum (2026-08-28): Faz 5 kodu `dev` üzerinden `main`'e PR #31 ile merge edildi ve v0.3.1 olarak yayınlandı; bölüm 1 ve 9 bu yüzden kapandı. Bölüm 2-8 hâlâ sahibinin panel adımları. Sıra önemli: Umami paneli varsayılan `admin` / `umami` kimlik bilgisiyle açıldığı için bölüm 4'te deploy ile bölüm 5'teki parola değişikliği arasında panel herkese açık kalmamalı; bölüm 4'ün son adımı olan domain bağlamayı, parola değiştirilene kadar erteleyin.

## 1. PR ve CI

- [x] Faz 5 PR #31 (`dev -> main`) 2026-08-28'de merge edildi; kapsam ve `docs/runbooks/infrastructure.md` referansı PR gövdesinde.
- [x] Zorunlu check'ler yeşil geçti. Güncel adlar: `Quality checks`, `Docker image` (`ci.yml`) ve `CodeQL analysis` (`codeql.yml`); eski `lint`, `typecheck`, `test`, `build`, `hadolint and image build` job adları artık yok.
- [x] Vitest özetinde `tests/lib/status.test.ts` ve `tests/config/csp.test.ts` geçiyor.

## 2. Cloudflare DNS

Zone: `dogancanyildiz.com`

- [ ] Type `A` veya `CNAME`, Name `status`, origin sunucu adresi, **Proxied** (turuncu bulut).
- [ ] Type `A` veya `CNAME`, Name `analytics`, origin sunucu adresi, **Proxied**.
- [ ] SSL/TLS modu zone seviyesinde Full (strict).

## 3. Coolify: Gatus kaynağı

- [ ] + New Resource > Docker Compose.
- [ ] Source: GitHub repo, branch `main` (merge sonrası).
- [ ] Base Directory: `/infra/gatus`
- [ ] Docker Compose Location: `/docker-compose.yml`
- [ ] Domain: `gatus` servisi için `https://status.dogancanyildiz.com`
- [ ] Deploy ve doğrula:

```bash
curl -s https://status.dogancanyildiz.com/api/v1/endpoints/statuses | jq -r '.results[].key' | sort
```

Beklenen: `public_site`, `public_umami`

## 4. Coolify: Umami kaynağı

- [ ] + New Resource > Docker Compose.
- [ ] Base Directory: `/infra/umami`
- [ ] İlk deploy'u domain BAĞLAMADAN yap (Coolify'ın verdiği geçici adres veya yalnızca iç ağ); `SERVICE_PASSWORD_*` magic değişkenlerinin üretildiğini doğrula.
- [ ] Bölüm 5'teki parola değişikliğini tamamla, ancak ondan sonra `umami` servisine `https://analytics.dogancanyildiz.com` domain'ini bağla ve redeploy et. Varsayılan `admin` / `umami` çifti public domain'de bir saniye bile açık kalmamalı.
- [ ] Doğrula:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/api/heartbeat
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/script.js
```

Beklenen: iki satır `200`

## 5. Umami paneli

- [ ] Panele geçici adresten (domain bağlanmadan önce, bkz. bölüm 4) gir.
- [ ] Varsayılan `admin` / `umami` ile giriş, parolayı hemen değiştir; sonra bölüm 4'e dönüp domain'i bağla.
- [ ] Settings > Websites > Add website: Name `dogancanyildiz.com`, Domain `dogancanyildiz.com`
- [ ] Website UUID'yi not al.

## 6. Coolify: portfolio ortam değişkenleri

Portfolio uygulamasında:

| Key | Value | Build Variable |
|---|---|---|
| `GATUS_URL` | `https://status.dogancanyildiz.com` | **kapalı** (Runtime only) |
| `UMAMI_SCRIPT_URL` | `https://analytics.dogancanyildiz.com` | **açık** |
| `UMAMI_WEBSITE_ID` | Umami'den alınan UUID | **açık** |

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BUILD_SHA`, `NEXT_PUBLIC_BUILD_DATE` zaten Build Variable olarak set edilmiş olmalı (Faz 1).

- [ ] Redeploy portfolio uygulaması.

## 7. Canlı doğrulama

```bash
curl -s https://dogancanyildiz.com/ | grep -Eic 'status\.dogancanyildiz|:8080|public_site'
curl -sI https://dogancanyildiz.com/ | tr -d '\r' | grep -i '^content-security-policy:'
curl -s https://dogancanyildiz.com/ | grep -o 'data-website-id="[0-9a-f-]\{36\}"'
```

Beklenen: ilk komut `0`; CSP satırında Umami origin; üçüncü komut tek `data-website-id="..."` satırı.

Ana sayfada Systems bölümü: up/down, 24s uptime yüzdesi, son deploy tarihi ve commit SHA görünür (Gatus ve build env ayarlı olduğunda).

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
- Gatus, Umami ve Postgres imajlarının sürüm pinleri ve Dependabot'un `infra/` dizinlerini taraması 2026-08-28 denetim kapanışında ele alındı; bkz. `docs/plans/handoffs/denetim-kapanisi-2026-08-28.md`.
- Gatus uyarı kanalı: `infra/gatus` compose'unda `GATUS_ALERT_WEBHOOK_URL` boşsa uyarı gönderilmez; Coolify'da bu değişkeni doldurmadan kesinti kimseye bildirilmez.
- Runtime `GIT_SHA` entrypoint migration bilinçli olarak yapılmadı; footer ve Systems `NEXT_PUBLIC_BUILD_SHA/DATE` kullanıyor.
