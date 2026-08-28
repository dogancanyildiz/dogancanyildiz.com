# Faz 5 manuel kontrol listesi

Bu adımlar kodla yapılamaz, site sahibi veya kontrol oturumu uygular. Kod tarafı (infra compose dosyaları, `status.ts`, Systems bölümü, Umami script, CSP) repoda hazır; burada kalan iş Cloudflare, Coolify ve Umami panel adımlarıdır.

Dal: `feature/faz-5-altyapi-vitrini` (veya eşdeğer). Tek PR, `main` hedefi.

## 1. PR ve CI

- [ ] PR gövdesinde Faz 5 kapsamı, bitti kriteri ve `docs/runbooks/infrastructure.md` referansı var.
- [ ] `gh pr checks --watch`: `lint`, `typecheck`, `test`, `build`, `hadolint and image build` yeşil.
- [ ] Vitest özetinde `tests/lib/status.test.ts` ve `tests/config/csp.test.ts` geçiyor.

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
- [ ] Domain: `umami` servisi için `https://analytics.dogancanyildiz.com`
- [ ] İlk deploy sonrası Coolify `SERVICE_PASSWORD_*` magic değişkenlerini üretmiş olmalı.
- [ ] Doğrula:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/api/heartbeat
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/script.js
```

Beklenen: iki satır `200`

## 5. Umami paneli

- [ ] `https://analytics.dogancanyildiz.com` adresine gir.
- [ ] Varsayılan `admin` / `umami` ile giriş, parolayı hemen değiştir.
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

## 9. Release v0.2.0 (merge sonrası)

- [ ] `feat:` / `fix:` commit'lerle squash merge → `main`.
- [ ] `release.yml` tag ve GitHub Release oluşturur.
- [ ] `release/sync-v*` PR'ını dev'e merge et (workflow notundaki reopen trick ile CI tetiklenebilir).

## Açık / opsiyonel

- Umami 2FA isteniyor mu?
- `twinproduction/gatus:v5` major pin; digest pin istenirse Dependabot docker ecosystem ile takip edilebilir.
- Runtime `GIT_SHA` entrypoint migration bilinçli olarak yapılmadı; footer ve Systems `NEXT_PUBLIC_BUILD_SHA/DATE` kullanıyor.
