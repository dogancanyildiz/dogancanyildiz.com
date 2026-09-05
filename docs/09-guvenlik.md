# Güvenlik ve Bakım Operasyonu

Durum: Uygulandı (Faz 0 #2, Faz 1 #3; Dependabot + CodeQL #14; denetim kapanışı #34; 3. tur #44) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

Self-host duruşunun Vercel'e göre gerçek bedeli şu: kritik bir açık çıktığında
Vercel yamalanmamış müşterilerine WAF mitigasyonu gönderirken Coolify kutusuna
hiçbir şey gelmiyor. Bu yüzden yama kadansı elle değil otomasyonla taşınıyor.
Contact endpoint'inin tam tasarımı
[05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)'de;
burada güvenlik gerekçesi, başlık seti, env kuralı ve bakım otomasyonu var.

## Kararlar

### 1. Sürüm hattı ve CVE takibi

Repo `next@16.1.6`'da donmuştu ve Temmuz-Ağustos 2026 yamalarının tamamının
gerisindeydi. Faz 0'da 16.3.3'e çıkıldı; kapanan başlıca açıklar:

| Yama / CVE | Etki | Önem |
| --- | --- | --- |
| AVIF/libheif RCE (2026-08-25) | `next/image` + sharp/libheif üzerinden kimlik doğrulamasız RCE | Critical |
| CVE-2026-75604 | Pages + App Router karışık kullanımında, Windows dosya sisteminde kimlik doğrulamasız RCE | Critical (CVSS 9.0) |
| CVE-2026-44578 | WebSocket upgrade üzerinden SSRF; yalnızca self-hosted Node sunucusu | High (CVSS 8.6) |
| 2026-07-20/21 yaması | 9 ayrı CVE | 4 High, 5 Medium |

Next.js 13 Temmuz 2026'da aylık güvenlik yayın programına geçti; Active LTS
hattında kalınıyor ve blog takibi insan elinde kalan tek adım, çünkü bazı
mitigasyonlar sürüm numarası değişmeden yayınlanabiliyor.

### 2. Güvenlik başlıkları ve CSP

`next.config.ts` `headers()` ile tüm rotalara:
`X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, geniş `Permissions-Policy` (camera,
microphone, geolocation, payment, usb, serial, midi, display-capture,
browsing-topics, interest-cohort kapalı), `X-Frame-Options: DENY`,
`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy:
same-origin`, üretimde `Strict-Transport-Security`.
`tests/deploy/security-headers.test.ts` bu kümeyi kilitliyor.

**CSP'de `'unsafe-inline'` kalıyor, gerekçesi kayda geçti.** App Router RSC
payload'ını inline script ile stream ediyor; nonce yolu her rotayı dinamik
üretime itiyor ve "yalnızca `/api/*` dinamik" korunan bir özellik. `script-src`
ve `connect-src` prod/dev'e göre koşullu üretiliyor (dev'de `'unsafe-eval'` ve
`ws:` React Refresh için, prod'da yok). `style-src 'self' 'unsafe-inline'`
Radix/shadcn'in runtime inline style attribute'ları için, `img-src 'self'
data:` OG rotasının gömülü görselleri için. Umami origin'i tek sabitten
geliyor (`src/lib/analytics.ts`); `UMAMI_SCRIPT_URL` o origin'in dışına
çıkarsa production build duruyor.

**Ölçüm yolu açık.** `Reporting-Endpoints` + `report-uri /api/csp-report`;
raporlayıcı `application/csp-report` ve `application/reports+json` kabul ediyor,
64 KB üstü 413, istemci başına dakikada 30 rapor ve **istek başına en fazla 20
rapor** (yalnızca gövde sınırı varken tek istek binlerce satır loglayabiliyordu).
`CSP_REPORT_ONLY=1` ile tek bir deploy alınırsa `'unsafe-inline'` içermeyen
sıkı bir report-only politika da gidiyor ve toplayıcı bütçesi yükseliyor;
pencere kapanınca değişken kaldırılıyor.

**HSTS (açık madde).** Karar "yalnızca Traefik" idi; Traefik middleware'i
kurulmadığı ve canlıda hiçbir yanıtta HSTS görünmediği için `next.config.ts`
production'da `max-age=31536000; includeSubDomains` gönderiyor (`preload`
bilinçli olarak yok, geri alması zor). Traefik middleware'i devreye alınınca
uygulama satırı kaldırılır. `includeSubDomains` apex'i gören tarayıcıda tüm
alt alanları bir yıl https'e kilitler; açılmadan önce hepsinin geçerli
sertifikayla TLS sonlandırdığı doğrulanmalı
([11-acik-isler.md](./11-acik-isler.md)).

### 3. `remotePatterns` tanımlanmaz

`next.config.ts`'te `images` bloğu yok. Bu doğrudan Ağustos 2026'daki kritik
açığın istismar yoluna karşılık geliyor: açık, saldırgan kontrolündeki bir
görselin AVIF/libheif decode aşamasına ulaşmasından geliyordu. `next/image`
yalnızca yerel dosyalarla çalıştığı sürece bu yüzey kapalı; harici bir host
allowlist'e alınırsa yeniden açılır ve ayrı bir inceleme gerektirir.

### 4. Env sırları: Build değil Runtime

Kural basit: build zamanında client bundle'a gömülmesi gereken herkese açık
config Build katmanında, sunucu tarafında kalması gereken her sır Runtime
katmanında. Karıştırıldığında iki yönde de sessiz hata üretiyor: ya sır imaj
katmanlarına ve build loglarına sızıyor ya da public değer boş kalıyor. Tam
tablo [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) bölüm 4'te.

### 5. Cloudflare güven sınırı

- **`CF-Connecting-IP` yalnızca güvenilir kaynaktan geldiğinde geçerli.** Bu
  taklit edilebilir bir HTTP header'ı; Traefik'in onu gerçek ziyaretçi IP'si
  saymasi ancak `forwardedHeaders.trustedIPs` Cloudflare listesiyle set
  edildiğinde güvenli. `TRUST_CF_CONNECTING_IP` varsayılan `false`; origin
  kilidi tamamlandığı için (2026-09-05, Hetzner firewall) değer `true`'ya
  çekilebilir.
- **Origin yalnızca Cloudflare'a açık olmalı.** Aksi halde saldırgan edge'i
  bypass edip origin'e doğrudan bağlanabilir ve rate limiting gibi edge
  korumalarını es geçebilir. `CF-Connecting-IP` güveni bu kısıt olmadan
  eksiksiz sayılmaz; ikisi tek bir savunma hattı. Kısıt Hetzner Cloud
  Firewall ile ağ kenarında uygulanıyor (bkz. `docs/deploy/traefik-ve-origin.md`
  bölüm 5); `DOCKER-USER` zinciri alternatif olarak aynı bölümde kalıyor,
  ufw tek başına yetmiyor.

### 6. Bakım otomasyonu: Dependabot + CodeQL

**Karar değişikliği (2026-08-28):** Renovate kurulmadı, `renovate.json`
silindi. Dependabot patch ve minor güncellemeleri haftalık gruplu PR olarak
`dev`'e açıyor ve **insan merge ediyor**; otomatik merge yok. Major'lar
(`next`, `eslint`, `typescript`) ignore listesinde: bir sonraki Next major'ı
inceleme olmadan geçerse kırıcı değişiklikler fark edilmeden yayına çıkabilir.
Güvenlik güncellemeleri açık, PR hemen açılıyor. CodeQL
(javascript-typescript) her PR'da ve haftalık koşuyor; ikisi de deponun
Security sekmesine raporluyor.

### 7. MDX güven sınırı

`content/` altındaki MDX gövdeleri sanitize edilmiyor: **`content/` dizinine
yazma yetkisi build sunucusunda kod çalıştırma yetkisidir.** Depo public olduğu
için dışarıdan içerik PR'ı gelebilir; böyle bir PR merge edilmeden önce MDX
ifadeleri (JSX, `export`, `import`) elle okunmalı. Dışarıdan içerik katkısı
düzenli hale gelirse karar (sanitize, ya da MDX yerine düz Markdown) yeniden
değerlendirilir.

## Kişisel veri yüzeyi

Sitenin HTML'inde sabit duran tek kişisel iletişim verisi WhatsApp numarası
(`src/lib/site.ts`, `WHATSAPP_NUMBER`); footer üzerinden her sayfada geçiyor
ve `whatsappHref` onu `wa.me` bağlantısına çeviriyor.

**Bilinçli kabul (2026-09-03):** numara herkese açık iş numarası. CV'de,
LinkedIn'de ve diğer kanallarda zaten yayında olduğu için env'e taşımak
sızıntıyı azaltmaz; yalnızca bir build değişkeni daha ekler ve değişken
tanımlanmadığında iletişim bloğu sessizce kaybolur. Numara Person JSON-LD'ye
girmiyor (bkz. `src/lib/site.ts` yorumu): yapılandırılmış veriye girmesi
kazıyıcılar için ayrı bir kolaylık olurdu, sohbet bağlantısı ise bir iletişim
yolu, kimlik URL'i değil. Karar numara özelleşirse geri alınır, o durumda
`WHATSAPP_NUMBER` env'den okunur ve boşken blok gizlenir.

## Bağımlılık durumu

`npm audit` 0 high. velite -> sharp <0.35.0 libvips zinciri
(`GHSA-f88m-g3jw-g9cj`, Dependabot #58) `package.json`'daki
`overrides: { "sharp": "^0.35.0" }` ile kapandı: velite `^0.34.5` istiyor,
override onu next'in zaten kullandığı 0.35.4'e sabitliyor ve iki ağaç tek
kopyada birleşiyor (`npm ls sharp` ikisini de 0.35.4 gösteriyor).
`npm audit fix --force` yolu kapalı, o velite'ı `0.0.0`'a düşürüyor.
Override'a dokunulduğunda `npx velite --clean --strict` (içerik görselleri) ve
`next build` (next/image optimizasyonu) yeniden koşulmalı, sharp yalnızca bu
iki yerde çalışıyor. velite kendi aralığını `^0.35` yapınca override
silinebilir.
CI'daki `npm audit --omit=dev --audit-level=high` adımı prod grafiğini
koruyor, `dependency-review-action` PR'larda yüksek şiddetli yeni bağımlılığı
durduruyor.

`npm ci --ignore-scripts` + beş paketin `npm rebuild`'i install-script yüzeyini
daraltıyor (`Dockerfile`, `ci.yml`, `links.yml`, üçünde de aynı).

## Riskler ve tripwire'lar

- `remotePatterns` eklenirse AVIF RCE sınıfı yüzey yeniden açılır; PR
  review'da özel dikkat şart.
- Dependabot major PR'ları auto-merge edilmemeli, yalnızca patch/minor.
- Aylık güvenlik blogu taraması otomasyona bağlanamıyor, insan elinde;
  takvime aylık hatırlatıcı öneriliyor, aksi halde sürüm numarası değişmeyen
  mitigasyon duyuruları kaçırılır.
- `forwardedHeaders.trustedIPs` set edilmezse `CF-Connecting-IP` güvenilmez
  hale gelir; rate limit atlatılabilir veya yanlış IP'ye kilitlenebilir.
- Status paneline code review sırasında yanlışlıkla yeni bir alan eklenirse
  sızıntı kuralı checklist olarak kullanılmalı
  ([05](./05-backend-icerik-ve-servisler.md) bölüm 3).
- CSP her yeni script veya font eklendiğinde gözden geçirilmeli; test
  edilmeden yayına çıkan bir politika sayfayı sessizce kırabilir.
- Coolify'ın Dockerfile `HEALTHCHECK` davranışı (bkz. 06 bölüm 7) yanlış
  kurulursa rollout iptal edilir; ilk canlı deploy'da tam bu oldu.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) - contact endpoint tasarımı
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) - env katmanları, origin kilidi, CI
- [11-acik-isler.md](./11-acik-isler.md) - açık panel adımları
- Kökte [SECURITY.md](../SECURITY.md) ve canlı sitede `/.well-known/security.txt`

## Kaynaklar

- https://nextjs.org/blog/august-2026-security-release
- https://nextjs.org/blog/next-security-release-program
- https://securityonline.info/nextjs-rce-vulnerability/
- https://github.com/coollabsio/coolify/issues/7500
- https://www.cloudflare.com/ips/
