# Altyapı runbook'u

Faz 5 ile canlıya alınan yan servisler, ortam değişkenleri ve doğrulama komutları.

## Coolify kaynakları

| Kaynak | Tip | Kaynak dizini | Domain |
|---|---|---|---|
| portfolio | Dockerfile (git tabanlı) | `/` | https://dogancanyildiz.com |
| gatus | Docker Compose (git tabanlı) | `/infra/gatus` | https://status.dogancanyildiz.com |
| umami | Docker Compose (git tabanlı) | `/infra/umami` | https://analytics.dogancanyildiz.com |

## portfolio uygulamasının ortam değişkenleri

| Değişken | Katman | Değer / kaynak |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build | `https://dogancanyildiz.com` |
| `NEXT_PUBLIC_BUILD_SHA` | Build | `${SOURCE_COMMIT}` veya CI `github.sha` |
| `NEXT_PUBLIC_BUILD_DATE` | Build | deploy zamanı (ISO) |
| `UMAMI_SCRIPT_URL` | Build | `https://analytics.dogancanyildiz.com` |
| `UMAMI_WEBSITE_ID` | Build | Umami panelindeki website UUID'si |
| `GATUS_URL` | Runtime | `https://status.dogancanyildiz.com` |
| `RESEND_API_KEY` | Runtime | Resend API anahtarı |
| `CONTACT_EMAIL` | Runtime | `me@dogancanyildiz.com` |
| `FROM_EMAIL` | Runtime | doğrulanmış gönderici adresi |

`GATUS_URL` asla Build Variable olarak işaretlenmez; sunucu tarafında okunur ve client bundle'a girmez.

## Sızıntı kuralı

`src/lib/status.ts` yalnızca `name`, `up`, `uptime24h`, `lastCheck` alanlarını döndürür. Bu listeye alan eklemek bir güvenlik kararıdır; hostname, port, IP, iç servis adresi ve Gatus URL'i hiçbir koşulda client'a gitmez. Değişiklik önerilirse `docs/09-guvenlik.md` bölüm 3'teki tablo checklist olarak kullanılır.

## Doğrulama komutları

```bash
# Gatus canlı ve iki endpoint izliyor
curl -s https://status.dogancanyildiz.com/api/v1/endpoints/statuses | jq -r '.results[].key' | sort

# Umami canlı
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/api/heartbeat
curl -s -o /dev/null -w '%{http_code}\n' https://analytics.dogancanyildiz.com/script.js

# CSP Umami origin'ini içeriyor
curl -sI https://dogancanyildiz.com/ | tr -d '\r' | grep -i '^content-security-policy:'

# Ana sayfada topology sızıntısı yok
curl -s https://dogancanyildiz.com/ | grep -Eic 'status\.dogancanyildiz|:8080|public_site|GATUS_URL'

# Gatus config'te alerting yok
grep -c alerting infra/gatus/config/gatus.yaml || echo 0
```

Beklenen: Gatus anahtarları `public_site` ve `public_umami`; Umami curl'ları `200`; CSP satırında `analytics.dogancanyildiz.com` hem `script-src` hem `connect-src` içinde; grep `0`; alerting sayacı `0`.

## Bakım ritmi

- **Dependabot**: `npm`, `github-actions` ve `docker` ecosystem'leri `dev` dalına PR açar. Patch ve minor'ları CI yeşil geçtikten sonra merge et; `next` major ve `velite` ignore kurallarına dokunma.
- **CodeQL**: PR, push ve haftalık schedule üzerinde çalışır (`codeql.yml`).
- **Next.js güvenlik yayınları**: `vercel/next.js` Releases ve GitHub Dependabot security alerts açık tutulur.
- **Gatus / Umami volume'ları**: Coolify backup veya sunucu snapshot ritmine ekle; sqlite (`gatus-data`) ve Postgres (`umami-db-data`) veri kaybına karşı korunmalı.

## İçerik kadansı ve Astro yeniden değerlendirmesi

Blog için aylık bir yazı ritmi hedefleniyor. İlk üç ayın sonunda `docs/00-ozet-ve-karar.md` tripwire'ındaki Astro yeniden değerlendirme sorusu tekrar okunur: içerik üretim maliyeti, build süresi ve bakım yükü bu tarihte not edilir.

## Widget davranışı

Ana sayfadaki Systems bölümü yalnızca `public_site` endpoint'ini gösterir. `GATUS_URL` boş veya Gatus erişilemez olduğunda sayfa 200 döner ve nötr "Status unavailable" / "Durum bilgisi şu an alınamıyor" metni görünür.
