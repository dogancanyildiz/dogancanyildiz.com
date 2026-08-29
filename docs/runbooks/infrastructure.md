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
| `TRUST_CF_CONNECTING_IP` | Runtime | `false`; origin Cloudflare'a kilitlenince `true` |
| `CSP_REPORT_ONLY` | Build, geçici | `1` yalnızca tek bir ölçüm deploy'u için; sıkı report-only CSP'yi yayınlar, sonra kaldırılır |

`GATUS_URL` asla Build Variable olarak işaretlenmez; sunucu tarafında okunur ve client bundle'a girmez. `UMAMI_SCRIPT_URL` `src/lib/analytics.ts`'teki `UMAMI_ORIGIN` ile aynı origin'de olmak zorunda, aksi halde production build durur. Üç mail değişkeninden biri eksikse container açılışta JSON hata satırı basar ve `/api/health` `"status":"degraded"` döner (HTTP 200).

## gatus kaynağının ortam değişkenleri

| Değişken | Değer / kaynak |
|---|---|
| `GATUS_ALERT_WEBHOOK_URL` | Discord veya Slack incoming webhook URL'i. Boşsa uyarı gönderilmez; `gatus.yaml` alerting bloğu 3 ardışık hatada uyarır, 2 başarıda çözüldü bildirir. Bu değer olmadan kesinti yalnızca panoda görünür, kimseye bildirilmez |

Gatus izlediği siteyle aynı sunucuda çalışır; sunucu tamamen düştüğünde pano da düşer. Harici ikinci bir prob (Cloudflare Health Check veya benzeri) `https://dogancanyildiz.com/api/health` için önerilir.

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

# Health gövdesi ve güvenlik başlıkları
curl -s https://dogancanyildiz.com/api/health
curl -sI https://dogancanyildiz.com/ | tr -d '\r' | grep -i -E '^(strict-transport-security|x-frame-options|cross-origin-opener-policy|reporting-endpoints):'

# Gatus config alerting bloğu taşıyor, uyarı kanalı env'den geliyor
grep -c 'GATUS_ALERT_WEBHOOK_URL' infra/gatus/config/gatus.yaml
```

Beklenen: Gatus anahtarları `public_site` ve `public_umami`; Umami curl'ları `200`; CSP satırında `analytics.dogancanyildiz.com` hem `script-src` hem `connect-src` içinde ve `report-uri /api/csp-report`; topoloji grep'i `0`; health gövdesi `{"status":"ok","checks":{"content":true,"mail":true},"timestamp":"..."}`; dört güvenlik başlığı görünüyor; alerting grep'i en az `1`.

## Bakım ritmi

- **Dependabot**: `npm`, `github-actions` ve `docker` ecosystem'leri `dev` dalına PR açar. Patch ve minor'ları CI yeşil geçtikten sonra merge et; `next` major ve `velite` ignore kurallarına dokunma.
- **CodeQL**: PR, push ve haftalık schedule üzerinde çalışır (`codeql.yml`).
- **Next.js güvenlik yayınları**: `vercel/next.js` Releases ve GitHub Dependabot security alerts açık tutulur.
- **Gatus / Umami volume'ları**: Coolify backup veya sunucu snapshot ritmine ekle; sqlite (`gatus-data`) ve Postgres (`umami-db-data`) veri kaybına karşı korunmalı.

## İçerik kadansı ve Astro yeniden değerlendirmesi

Blog için aylık bir yazı ritmi hedefleniyor. İlk üç ayın sonunda `docs/00-ozet-ve-karar.md` tripwire'ındaki Astro yeniden değerlendirme sorusu tekrar okunur: içerik üretim maliyeti, build süresi ve bakım yükü bu tarihte not edilir.

## Widget davranışı

Ana sayfadaki Systems bölümü yalnızca `public_site` endpoint'ini gösterir. `GATUS_URL` boş veya Gatus erişilemez olduğunda sayfa 200 döner ve nötr "Status unavailable" / "Durum bilgisi şu an alınamıyor" metni görünür. İstekler 3 saniyede zaman aşımına uğrar; uptime isteği düşerse durum yine gösterilir; `GATUS_URL` doluyken her hata container logunda tek satır JSON uyarı olarak (host maskelenmiş) görünür. "Son yayın" ve "son kontrol" ziyaretçinin diline göre ve kısa saat dilimi adıyla biçimlenir.
