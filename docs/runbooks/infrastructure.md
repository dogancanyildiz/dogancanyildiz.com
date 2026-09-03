# Altyapı runbook'u

Gözlemlenebilirlik ve yan servisler. **Karar (2026-08-30):** bu servisler
Coolify servis kataloğundan (tek tık) kurulur ve tamamen panelde yönetilir;
depo compose veya izleyici yapılandırması taşımaz. İzleme Uptime Kuma'da,
ziyaret ölçümü sahibinin merkezi Umami kurulumunda (`umami.dravcore.com`,
dravcore.com sahibinin altyapı domain'idir, sunucu yine kendisinindir).
**Karar (2026-09-02):** kanonik host www; apex edge'de (Cloudflare) www'ye 301
ile yönlenir, bu yüzden aşağıdaki adresler `www.dogancanyildiz.com` üzerinden
verilmiştir.

## Servisler

| Servis | Nerede | Ne yapar |
|---|---|---|
| portfolio | Coolify, Dockerfile (git tabanlı) | https://www.dogancanyildiz.com |
| Uptime Kuma | Coolify servis kataloğu, panelde yönetilir | `https://www.dogancanyildiz.com/api/health` monitörü, bildirim kanalları, public status sayfası |
| Umami (merkezi) | `umami.dravcore.com` (ayrı Coolify kaynağı, bu repo dışında) | Bu site orada bir website kaydı; tracker script'i oradan yüklenir |

Kuma'nın public status sayfası hangi domain'de yayınlanırsa `NEXT_PUBLIC_STATUS_URL`
o adresi gösterir; Systems paneli yalnızca link verir, Kuma'nın API'sinden veri
çekmez (dokümante değil, sürümle kırılır; `docs/05` karar kaydı).

## portfolio uygulamasının ortam değişkenleri

| Değişken | Katman | Değer / kaynak |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build | `https://www.dogancanyildiz.com` |
| `NEXT_PUBLIC_BUILD_SHA` | Build | Elle girilmez; boşsa Dockerfile Coolify'ın otomatik geçtiği `SOURCE_COMMIT` build-arg'ına döner, CI ise `github.sha`'yı geçirir |
| `NEXT_PUBLIC_BUILD_DATE` | Build | Elle girilmez; boşsa Dockerfile build anındaki UTC saatini (ISO 8601) kullanır |
| `NEXT_PUBLIC_STATUS_URL` | Build | Kuma public status sayfasının tam adresi; boşsa Systems'taki link satırı gizlenir, yalnızca https kabul edilir |
| `UMAMI_SCRIPT_URL` | Build | `https://umami.dravcore.com` (`src/lib/analytics.ts` `UMAMI_ORIGIN` ile aynı olmak zorunda, aksi halde production build durur) |
| `UMAMI_WEBSITE_ID` | Build | Merkezi Umami panelindeki bu siteye ait website UUID'si |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Runtime | Mailcow submission (587); uygulama parolası, `docs/deploy/mailcow-smtp.md` |
| `CONTACT_EMAIL` | Runtime | `me@dogancanyildiz.com` |
| `FROM_EMAIL` | Runtime | doğrulanmış gönderici adresi |
| `TRUST_CF_CONNECTING_IP` | Runtime | `false`; origin Cloudflare'a kilitlenince `true` |
| `CSP_REPORT_ONLY` | Build, geçici | `1` yalnızca tek bir ölçüm deploy'u için; sıkı report-only CSP'yi yayınlar, sonra kaldırılır |

Posta değişkenlerinden biri eksikse container açılışta JSON hata satırı basar ve
`/api/health` `"status":"degraded"` döner (HTTP 200). **Karar değişikliği
(2026-09-03):** tracker artık izin beklemiyor, layout'a `<script defer>` olarak
basılıyor ve yalnızca production derlemesinde çıkıyor; izin bandı ve `/privacy`
üzerindeki açma/kapama kontrolü kaldırıldı (gerekçe: Umami çerezsiz ve IP
saklamıyor). Script yine `data-domains="www.dogancanyildiz.com"` taşır: aynı
merkezi Umami'ye ekli diğer siteler veya preview kopyaları bu website kaydına
veri yazamaz.

## Sızıntı kuralı

Systems paneli ve public status sayfası hiçbir zaman iç hostname, konteyner
adı, özel IP veya iç port göstermez. Panel yalnızca build sabitlerini basar;
Kuma status sayfasında yalnızca genel URL'lere giden monitörler yayınlanır.
Bir alan eklemek güvenlik kararıdır, `docs/09-guvenlik.md` bölüm 3'teki tablo
checklist olarak kullanılır.

## Doğrulama komutları

```bash
# Health canlı ve gövde doğru
curl -s https://www.dogancanyildiz.com/api/health

# Systems panelindeki status linki ve Umami origin'i
curl -s https://www.dogancanyildiz.com/ | grep -o 'href="https://[^"]*"' | grep -i status
curl -sI https://www.dogancanyildiz.com/ | tr -d '\r' | grep -i '^content-security-policy:' | grep -c 'umami.dravcore.com'

# Ana sayfada topoloji sızıntısı yok
curl -s https://www.dogancanyildiz.com/ | grep -Eic ':8080|:3001|iç-servis|127\.0\.0\.1'

# Consent onayı sonrası tracker (tarayıcıda): script src umami.dravcore.com/script.js,
# data-domains="www.dogancanyildiz.com"
```

Beklenen: health gövdesi `{"status":"ok","checks":{"content":true,"mail":true},...}`;
status linki `NEXT_PUBLIC_STATUS_URL` değerini gösteriyor; CSP sayacı `1`;
topoloji grep'i `0`.

## Bakım ritmi

- **Uptime Kuma ve Umami güncellemeleri**: Coolify panelinden, bilinçli olarak
  (repo veya Dependabot takip etmez; imaj sürümü panelde sabit tutulur).
- **Dependabot**: `npm` ve `github-actions` ecosystem'leri `dev` dalına PR açar;
  docker yalnızca kök Dockerfile'ı izler.
- **CodeQL**: PR, push ve haftalık schedule (`codeql.yml`).
- **Kuma verisi**: Coolify backup veya sunucu snapshot ritmine ekle.
- **Harici prob**: Kuma izlediği sunucuda çalıştığı için sunucu tümden düşerse
  uyarı gönderemez; kontrol dışı bir yerden ikinci bir prob (ör. UptimeRobot,
  `https://www.dogancanyildiz.com/api/health`) bu körlüğü kapatır.

## İçerik kadansı ve Astro yeniden değerlendirmesi

Blog için aylık bir yazı ritmi hedefleniyor. İlk üç ayın sonunda
`docs/00-ozet-ve-karar.md` tripwire'ındaki Astro yeniden değerlendirme sorusu
tekrar okunur: içerik üretim maliyeti, build süresi ve bakım yükü not edilir.

## Widget davranışı

Ana sayfadaki Systems bölümü üçüncü taraf veri çekmez: son yayın tarihi
(`timeZoneName: "short"` ile), commit SHA'sı, stack satırı ve
`NEXT_PUBLIC_STATUS_URL` doluysa public status sayfasına bir link gösterir.
Build değişkenleri boşsa ilgili alanlar nötr "veri yok" satırına düşer; sayfa
tamamen statiktir, revalidate yoktur.
