# Güvenlik ve Bakım Operasyonu
Durum: Uygulandı (Faz 0, PR #2; Faz 1, PR #3; bakım otomasyonu Dependabot + CodeQL, PR #14; 2026-08-28 denetim kapanışı: HSTS, XFO/COOP/CORP, CSP raporlama, contact sertleştirme, prod audit 0; 2026-09-02 3. tur: consent geri alınabilir, contact/csp-report ek sertleştirme, install-script yüzeyi daraltıldı), kalan: origin'in Cloudflare'a kilitlenmesi, `TRUST_CF_CONNECTING_IP`, Cloudflare Min TLS/CAA/Always HTTPS, aylık güvenlik takibi, dev `npm audit` 2 high (kabul edilmiş, tripwire'lı) · Karar: 2026-08-27 · Güncelleme: 2026-09-02 · Kapsam: dogancanyildiz.com

## Özet

Repo şu an `next@16.1.6` sabitlenmiş durumda, bu sürüm 13 Temmuz 2026'da başlayan Next.js aylık güvenlik yayın programının tüm Temmuz ve Ağustos yamalarının gerisinde: 20-21 Temmuz'da 9 CVE, 25 Ağustos'ta 2 kritik CVE yayınlandı. Bu doküman yayına çıkmadan önce zorunlu kılınan altı kalemi, canlı status widget'ının veri sızıntısı sınırlarını, env sırlarının Coolify'da Build değil Runtime olarak işaretlenmesi kuralını ve yayın sonrası sürdürülecek bakım otomasyonunu (Renovate/Dependabot + Coolify auto-redeploy) tanımlıyor. Ortak tema: self-host duruşunun Vercel'e göre gerçek bedeli, kritik bir açık çıktığında Vercel yamalanmamış müşterilerine WAF mitigasyonu gönderirken Coolify kutusuna hiçbir şey gelmemesi; bu yüzden yama kadansı elle değil otomasyonla taşınmak zorunda. Contact endpoint'in tam sertleştirme tasarımı ve Gatus/Umami kurulum detayları burada tekrar edilmiyor, [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)'e bakınız; bu doküman yalnızca güvenlik gerekçesini ve yayın öncesi kontrol listesini taşıyor.

## Karar(lar)

### 1. Next.js 16.1.6 -> 16.3.3 zorunlu yükseltme

Yayına çıkmadan önce `next` ve `eslint-config-next` 16.3.3'e yükseltilir, `package-lock.json` tek bir npm sürümüyle normalize edilip commit edilir.

| Yama / CVE | Etki | Önem | Kapsam |
|---|---|---|---|
| AVIF/libheif RCE (25 Ağustos 2026) | `next/image` optimizasyonu + sharp/libheif üzerinden kimlik doğrulamasız RCE | Critical | ~10.0.0-15.5.24 ve <16.3.3 |
| CVE-2026-75604 | Pages + App Router karışık kullanımında (Cache Components kapalıyken), Windows dosya sisteminde çalışan sunucularda kimlik doğrulamasız RCE | Critical (CVSS 9.0) | 16.0-16.3.2 |
| CVE-2026-44578 | WebSocket upgrade üzerinden SSRF | High (CVSS 8.6) | Yalnızca self-hosted Node sunucusu, Vercel etkilenmiyor; ~79.000 açık instance tahmini; düzeltme 15.5.16 / 16.2.5 |
| 20-21 Temmuz 2026 yaması | 9 ayrı CVE (4 High, 5 Medium) | - | 16.3.2 öncesi |

Repo bugün `next/image` kullanmıyor, bu yüzden AVIF/libheif yolu şu an fiilen tetiklenemiyor. Ama Faz 4'te proje ekran görüntüleri için `next/image` devreye girecek, o noktada sürüm zaten güncel olmak zorunda. CVE-2026-44578 ise `next/image` kullanımından bağımsız, sadece self-hosted Node sunucusu koşuyor olmaktan kaynaklanıyor, yani bugünden geçerli bir risk.

### 2. Yayın öncesi zorunlu liste

| # | Kalem | Doğrulama |
|---|---|---|
| 1 | `next` 16.1.6 -> 16.3.3 | `npm ls next`, `package-lock.json` commit edilmiş |
| 2 | `poweredByHeader: false` | `next.config.ts`, response'ta `X-Powered-By` yok |
| 3 | Security headers + CSP taslağı | `next.config.ts` `headers()`, aşağıdaki kod bloğu |
| 4 | Contact sertleştirme | sunucu taraflı honeypot, IP rate limit, uzunluk sınırı (tam tasarım: [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)) |
| 5 | `.dockerignore` ile `.local/` dışlaması | image içinde `.local/` yok, build context'ine hiç girmiyor |
| 6 | `remotePatterns` tanımlanmaz | `next.config.ts` `images` bloğu yalnızca yerel dosyaları optimize ediyor |

Header/CSP taslağı (`next.config.ts`, staging'de gerçek sayfalarla test edilip daraltılacak):

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
```

`style-src`'te `'unsafe-inline'` şu an gerekli çünkü shadcn/Radix bileşenleri runtime'da inline `style` attribute'u üretiyor; nonce tabanlı bir CSP'ye geçiş yayın sonrası ayrı bir iyileştirme olarak bırakılıyor. `img-src` içindeki `data:` OG image route'unun ürettiği gömülü görseller için. Faz 5'te Umami eklendiğinde `script-src` ve `connect-src`'e self-host edilen Umami origin'i eklenmesi gerekiyor, o an bu dosya yeniden gözden geçirilmeli.

HSTS burada tanımlanmıyor: Traefik seviyesinde tek kaynaktan yönetiliyor (bkz. [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)), uygulama katmanında ikinci bir tanım tutarsızlık riski taşır.

### 3. Status widget: yalnızca agregat veri, topoloji asla değil

**Karar değişikliği (2026-08-30):** Gatus kaldırıldı; gerçek izleme Coolify'daki Uptime Kuma'da, ölçüm merkezi Umami'de (`umami.dravcore.com`). Systems paneli artık HİÇBİR üçüncü taraf uç noktasından veri çekmiyor: yalnızca build-time değerleri (son yayın, commit SHA, stack satırı) ve `NEXT_PUBLIC_STATUS_URL` doluysa public status sayfasına bir link basıyor. Aşağıdaki tablo tarihsel kayıt; "asla gönderilmeyen" sütunundaki kural (hostname, port, iç adres, IP yok) panel ve status sayfası için aynen geçerli.

Widget verisi sunucu tarafında (`/api/status` veya async Server Component) Gatus'un `/api/v1/endpoints/statuses` uç noktasından çekilir, 60 saniye revalidate ile cache'lenir, filtrelenip yalnızca aşağıdaki alanlar client'a gönderilir:

| İzin verilen | Asla gönderilmeyen |
|---|---|
| Servis takma adı (ör. "site", "api") | Hostname |
| Up/down durumu | Port |
| Son 24 saat uptime yüzdesi | İç servis topolojisi (hangi container hangi container'a bağlı) |
| Son deploy zamanı | IP adresi |
| Build-time commit SHA | Gatus URL'i |
| Stack satırı (ör. "Next.js / Coolify / Traefik") | Gatus auth token'ı (varsa) |

Gatus URL'i ve varsa token'ı hiçbir zaman client bundle'a girmiyor, çünkü ilgili env değişkeni Runtime-only işaretleniyor (karar 4). Bu bir güvenlik/DevOps kimliğini vitrine çıkaran site, kendi altyapı haritasını sızdırırsa iddiasının tersini kanıtlamış olur; alan seçimi bu yüzden bilinçli kısıtlanıyor. Hangi servislerin gösterileceği kararı sahibine açık, bkz. [11-acik-sorular.md](./11-acik-sorular.md) soru 6.

### 4. Env sırları: Build değil Runtime

| Değişken | Coolify katmanı | Neden |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Build | `next build` sırasında client bundle'a gömülmesi gerekiyor; Runtime işaretlenirse üretimde sessizce `undefined` kalır |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` (2026-08-31: Resend yerine Mailcow SMTP) | Runtime (yalnızca) | Build değişkeni image katmanlarına veya build loglarına sızabilir |
| `CONTACT_EMAIL` | Runtime (yalnızca) | Aynı risk; ayrıca prod'da eksikse route başlangıcında hata fırlatmalı, sessiz `onboarding@resend.dev` fallback'ine düşmemeli |
| `FROM_EMAIL` | Runtime (yalnızca) | Aynı risk |
| `NEXT_PUBLIC_STATUS_URL` | Build | Public status sayfası linki; herkese açık bir URL, sır değil (`GATUS_URL` 2026-08-30'da kaldırıldı) |

Kural basit: build zamanında client bundle'a gömülmesi gereken herkese açık config Build katmanında, sunucu tarafında kalması gereken her sır Runtime katmanında. Karıştırıldığında iki yönde de sessiz hata üretiyor, ya sır sızıyor ya da public değer boş kalıyor.

### 5. Bakım otomasyonu: Renovate/Dependabot + Active LTS

**Karar değişikliği (2026-08-28):** Renovate kurulmadı, Dependabot + CodeQL kuruldu (PR #14, `renovate.json` silindi). Uygulanan Dependabot politikası aşağıdaki "otomatik merge" cümlesini de değiştiriyor: patch ve minor güncellemeler haftalık gruplu PR olarak `dev`'e açılır ve **insan merge eder**, otomatik merge yok; majorlar (`next`, `eslint` 10, `typescript` 7) ignore listesinde. Bir güvenlik yaması bu yüzden "saatler içinde insan müdahalesi olmadan" değil, sahibinin PR'ı merge etmesiyle production'a çıkar. Hızlı yol istenirse Dependabot security update'leri açık, PR hemen açılır.

Renovate ya da Dependabot GitHub App olarak kurulur. Patch ve minor sürüm güncellemeleri, mevcut GitHub Actions kapısı (lint + `tsc --noEmit` + build, bkz. [06-devops-ve-deploy.md](./06-devops-ve-deploy.md)) yeşil geçtiğinde otomatik merge edilir; major sürümler (ör. bir sonraki Next major'ı) her zaman manuel review ister. `main`'e merge, Coolify'ın git tabanlı otomatik deploy'unu tetikler, yani bir patch güvenlik yaması insan müdahalesi olmadan saatler içinde production'a çıkar. Next.js Active LTS hattında kalınır ve aylık güvenlik yayın blogu (nextjs.org/blog) takip edilir; otomasyon sürüm numarasıyla gelen yamaları yakalıyor ama bazı mitigasyonlar (config değişikliği, geçici workaround) sürüm numarası değişmeden de yayınlanabiliyor, o yüzden blog taraması insan elinde kalan tek adım.

### 6. Cloudflare güven sınırı: CF-Connecting-IP, origin kısıtı, Bot Fight Mode

Site artık Cloudflare proxied modda çalışıyor ([06-devops-ve-deploy.md](./06-devops-ve-deploy.md) bölüm 8, site sahibinin 2026-08-27 cevabı); bu üç ek kuralı doğuruyor:

- **`CF-Connecting-IP` yalnızca güvenilir kaynaktan geldiğinde geçerli.** Bu header istemci tarafından taklit edilebilir bir HTTP header'ı; Traefik'in bunu gerçek ziyaretçi IP'si olarak kabul etmesi yalnızca istek doğrulanmış Cloudflare IP aralığından geliyorsa güvenlidir (`forwardedHeaders.trustedIPs`, Cloudflare'ın yayınladığı IPv4/IPv6 listesiyle set edilir). Bu ayar yoksa contact endpoint'inin IP bazlı rate limit'i (bkz. [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)) hem atlatılabilir hem de yanlışlıkla tüm istekleri tek IP'ye kilitleyebilir.
- **Origin'i yalnızca Cloudflare IP'lerine kısıtlamak (önerilir, Faz 1).** ufw veya Traefik `ipAllowList` ile `.sh` origin'ine IP üzerinden doğrudan erişim kapatılır; aksi halde bir saldırgan Cloudflare'ı bypass edip origin'e doğrudan bağlanabilir, Cloudflare Rate Limiting ve Bot Fight Mode gibi edge katmanındaki korumaları es geçebilir. `CF-Connecting-IP` güveni de bu kısıt olmadan tam anlamıyla eksiksiz sayılmamalı; ikisi birlikte tek bir savunma hattı oluşturur.
- **Bot Fight Mode açık.** Cloudflare'ın ücretsiz planında gelen bu koruma, bilinen bot trafiğini edge'de filtreler; contact formu ve genel trafik için sıfır maliyetli ek bir katman, uygulama içi honeypot/rate limit'in yerine geçmez, üstüne eklenir.

## Gerekçe

Next'in 13 Temmuz 2026'da aylık güvenlik yayın programına geçmesi, bakım yükünün ağırlık merkezini framework major'larından güvenlik kadansına taşıdı. Bu proje özelinde asıl fark Vercel'siz olmak: CVE-2026-44578 gibi bazı açıklar yalnızca self-hosted Node sunucusunu etkiliyor ve Vercel yamalanmamış müşterilerine WAF mitigasyonu gönderirken Coolify kutusuna hiçbir şey gelmiyor. Repo şu an 16.1.6 ile bu riskin canlı örneği; iki aylık yamanın (Temmuz + Ağustos) gerisinde durmak elle takibin sürdürülemediğinin kanıtı, otomasyon zorunlu.

`remotePatterns` tanımlanmaması doğrudan Ağustos'taki kritik açığın istismar yoluna karşılık geliyor: açık, attacker-controlled görselin AVIF/libheif decode aşamasına ulaşmasından geliyordu; `next/image`'i yalnızca yerel dosyalarla sınırlı tutmak bu yüzeyi baştan kapatıyor, harici bir host allowlist'e alınırsa (ör. gelecekte bir görsel CDN'i) yeniden açılıyor.

Status widget'ının alan sınırlaması, sitenin kendi iddiasıyla çelişmemesi için var: self-host/DevOps kimliğini vitrine çıkaran bir sayfa, kendi altyapı topolojisini (hostname, port, IP) sızdırırsa güvenilirliğini kaybeder. Sunucu tarafı proxy deseni zaten Gatus URL'ini client'tan tamamen ayırıyor, alan filtresi bunun üstüne ikinci bir güvenlik katmanı.

Env sırlarının Runtime'da kalması, Coolify'ın Build ve Runtime değişkenlerini farklı yaşam döngülerinde ele almasından kaynaklanıyor: Build değişkenleri image katmanlarına ve build loglarına karışabiliyor, Runtime değişkenleri yalnızca çalışan konteynerin ortamında kalıyor. `NEXT_PUBLIC_*` ise tam tersi bir sebeple Build'de olmak zorunda, çünkü `next build` onu statik olarak client bundle'a gömüyor, sonradan Runtime'da set etmenin bir etkisi yok.

## Reddedilen alternatifler (neden)

- **Güvenlik güncellemelerini elle ve düzensiz takip etmek**: reddedildi, mevcut durumun kendisi bunun kanıtı (16.1.6, iki aylık yamanın gerisinde). Kişisel bir sitede aylık kadansı elle taşımak sürdürülebilir değil.
- **Astro'ya geçerek CVE yükünden kaçınmak**: reddedildi. Astro'nun da 2025-2026 döneminde middleware bypass ve XSS dahil kendi açıkları var (CVE-2025-61925, CVE-2025-64525, CVE-2025-65019, CVE-2026-41067, GHSA-mr6q-rp88-fx84 x-astro-path kimlik doğrulamasız path override). Güvenlik kadansı tek başına framework kararını çevirmiyor, hangi framework seçilirse seçilsin otomasyon aynı şekilde gerekiyor (framework karşılaştırmasının tamamı: [02-stack-karari.md](./02-stack-karari.md)).
- **Cloudflare Turnstile'ı hemen eklemek**: reddedildi, YAGNI; kanıtlanmış bir spam problemi yokken üçüncü taraf bağımlılığı eklenmiyor, route'ta doğrulama seam'i açık bırakılıyor. Tam gerekçe ve honeypot/rate limit tasarımı: [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md).
- **HSTS'i `next.config.ts` `headers()` içinde tanımlamak**: reddedildi, Traefik'te zaten tek kaynaktan yönetiliyor; iki yerde tanımlamak tutarsızlık riski taşır, kaldırılırsa unutulma ihtimali de var.
- **`remotePatterns`'ı baştan bir CDN/host'a açık bırakmak**: reddedildi, bugün ihtiyaç yok. İhtiyaç doğarsa ayrı bir kararla ve dar bir allowlist ile açılır, "her ihtimale karşı" geniş bir liste eklenmiyor.

## Uygulama durumu (2026-08-27)

Kanıt: repodaki `package.json`, `next.config.ts`, `.dockerignore`, `.env.example`, `src/lib/client-ip.ts`, `.github/workflows/ci.yml`, `docs/plans/handoffs/faz-0.md`, `faz-1.md`, `faz-4.md`.

- **`next` 16.3.3'e yükseltildi** (karar 1): `package.json`'da `"next": "16.3.3"` ve `"eslint-config-next": "16.3.3"`, Faz 0'da (PR #2). Faz 4'ün doğrulama turunda (`feature/faz-4-icerik-ve-yayin` HEAD) sürüm hâlâ 16.3.3, gerileme yok.
- **`poweredByHeader: false` + security headers + CSP** (yayın öncesi liste madde 2-3): `next.config.ts` içinde uygulanmış durumda; `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` `headers()` ile tüm route'lara ekleniyor. Kod, dokümandaki statik taslaktan bir adım ileri gitti: `scriptSrc` ve `connectSrc` prod/dev'e göre koşullu (`isProduction`) üretiliyor, dev'de `'unsafe-eval'` ve `ws:` React Refresh/HMR için ekleniyor, prod'da yok. `style-src 'self' 'unsafe-inline'` (Radix/shadcn inline style) ve `img-src 'self' data:` (og-image route'u) dokümanla birebir aynı. HSTS burada tanımlı değil, doküman kararıyla tutarlı.
- **Contact sertleştirme** (madde 4): `src/lib/contact-validation.ts`, `src/lib/rate-limit.ts` (in-memory sliding window, `maxKeys` ile LRU tahliye, kod yorumu: "Cloudflare Rate Limiting sits in front of /api/contact as the outer layer"), `src/lib/request-body.ts`, `src/app/api/contact/route.ts` hepsi Faz 0'da eklendi ve mevcut.
- **`.dockerignore` ile `.local/` dışlaması** (madde 5): kök `.dockerignore` `.local`, `.nodeterm`, `.superpowers`, `.claude`, `.env*`, `.git`, `node_modules`, `.next`, `docs`, `*.md` (README hariç) satırlarını içeriyor; Faz 1'de `tests/deploy/dockerignore.test.ts` (17 test) ile kilitlendi.
- **`remotePatterns` tanımlanmadı** (madde 6, hâlâ geçerli): `next.config.ts`'te `images` bloğu yok. Not: Faz 4'te `next/image` fiilen devreye girdi (`src/components/sections/project-card.tsx`, proje detay sayfası), ama yalnızca yerel proje kapak görselleri için (şu an `covers=0`, hiç dolu değil); harici bir host allowlist'e girmedi, Ağustos AVIF/libheif RCE yüzeyi kapalı kalmaya devam ediyor.
- **CSP `unsafe-inline` notu doğrulandı, dosyanın sonundaki not güncel**: `script-src 'self' 'unsafe-inline'` prod'da hâlâ geçerli; `next.config.ts`'teki kod yorumu bu dokümanla neredeyse birebir aynı gerekçeyi tekrarlıyor (RSC payload'ı inline script, nonce tüm route'ları dynamic yapar). Faz 2 sonrasında kök layout artık cookie okumuyor ve yalnızca `/api/*` dynamic (Faz 4 build doğrulaması: `ƒ` yalnızca `/api/contact` ve `/api/health`), yani nonce'a geçişin önündeki tek engel hâlâ bu CSP kararı, teknik ön koşul (statik route'lar) karşılandı.
- **`CF-Connecting-IP` güven bayrağı kodda hazır, varsayılan kapalı** (karar 6): `src/lib/client-ip.ts` `trustCloudflare` parametresiyle çalışıyor, kod yorumu dokümandaki gerekçeyi (header taklit edilebilir, yalnızca origin Cloudflare'a kilitlendiğinde güvenilir, X-Forwarded-For fallback'i son hop) aynen taşıyor. `.env.example`'da `TRUST_CF_CONNECTING_IP=false`; `true`'ya çekilmesi origin'in Cloudflare IP'lerine kilitlenmesine bağlı, bu adım henüz uygulanmadı (aşağıya bakınız).
- **Origin kısıtı (`DOCKER-USER` + ufw ayrımı) hâlâ panel adımı, kod tarafında bir şey yok**: Faz 1'de karar netleşti (ufw tek başına Docker'ın yayınladığı portları filtrelemiyor, asıl kısıt `DOCKER-USER` zincirinde) ve `docs/plans/handoffs/faz-1-manual-checklist.md`'ye yazıldı; site henüz canlıya alınmadığı için uygulanmadı.
- **Env sırları Build/Runtime ayrımı** (madde 4, Karar 4): `.env.example` tabloyla birebir örtüşüyor: `NEXT_PUBLIC_SITE_URL` Build (zorunlu, `src/lib/env.ts` build'de doğruluyor), `RESEND_API_KEY`/`CONTACT_EMAIL`/`FROM_EMAIL` Runtime-only (tarihsel not: burada anılan `GATUS_URL` 2026-08-30'da Gatus ile, `RESEND_API_KEY` 2026-08-31'de Resend ile birlikte kaldırıldı; SMTP_* değişkenleri aynı Runtime-only kurala tabi). `CONTACT_EMAIL`/`FROM_EMAIL` prod'da eksikse sessiz fallback yerine hata fırlatıyor (Faz 0 kararı, `src/lib/env.ts`).
- **CI: hadolint + image build** (karar 5): `.github/workflows/ci.yml`'de `checks` (`Quality checks`) ve `docker` (`Docker image`) job'ları var (adlar 2026-08-28'de düzenlendi); Dockerfile Faz 4'te değişmedi, hadolint yalnızca `DL3066 info` üretiyor (`USER node`, bilinçli), `exit 0`. Registry'ye push yok.
- **npm audit, Faz 0'daki 17 bulgudan büyüdü, hâlâ ayrı PR bekliyor**: bu doküman güncellenirken çalıştırılan `npm audit`, güncel `feature/faz-4-icerik-ve-yayin` dalında **19 bulgu** veriyor (2 low, 4 moderate, 13 high), Faz 0'daki 17'den (2 low, 4 moderate, 11 high) fazla. Fark, Faz 4'ün eklediği `velite` bağımlılık ağacından geliyor: `velite` -> `sharp <0.35.0`, libvips CVE'leri (CVE-2026-33327/33328/35590/35591, high, `GHSA-f88m-g3jw-g9cj`), `npm audit fix --force` velite'ı `0.0.0`'a düşürüyor (kırıcı, uygulanmadı). Faz 0'daki `shadcn`/`hono` zinciri ve `resend`/`svix`/`uuid` (moderate) bulguları da hâlâ duruyor. Karar değişmedi: ayrı bir PR'da ele alınacak, `npm audit fix` (force olmadan) uygulanabilir kısmı kapatabilir.
- **Renovate GitHub App kurulmadı** (2026-08-28: Renovate yerine Dependabot + CodeQL kuruldu, `renovate.json` silindi; bu madde kapandı): `renovate.json` dosyası Faz 0'da eklendi ama App'in kendisi GitHub'a kurulmadı; Faz 4 devir notunun "Faz 2 ve 3'ten devralınıp hâlâ açık" listesinde `TRUST_CF_CONNECTING_IP`, `npm audit` ile birlikte "Renovate" olarak tekrar teyit edildi. Faz 5'e kaldı.
- **Status widget ve Umami henüz yok**: Faz 5 başlamadı; bu dokümandaki karar 3 ve son paragrafın Umami notu hâlâ öneri aşamasında.

## Uygulama durumu (2026-08-28)

Kanıt: `next.config.ts`, `src/app/api/contact/route.ts`, `src/app/api/csp-report/route.ts`, `src/instrumentation.ts`, `src/lib/analytics.ts`, `src/proxy.ts`, `tests/deploy/security-headers.test.ts`, `tests/config/csp.test.ts`, `.github/workflows/ci.yml`; dal `feature/audit-closure`.

- **Güvenlik başlıkları genişledi.** `Permissions-Policy` artık camera, microphone, geolocation, payment, usb, serial, midi, display-capture, browsing-topics ve interest-cohort'u kapatıyor; `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` eklendi (CORP yalnızca bizim servis ettiğimiz kaynakları kapsar, Umami script'ini ve `/feed.xml`'i etkilemez). `tests/deploy/security-headers.test.ts` bu seti ve prod `script-src`'te `'unsafe-eval'` olmadığını kilitliyor.
- **HSTS geçici olarak uygulamada (karar değişikliği).** Kararda "yalnızca Traefik" yazıyordu; Traefik middleware'i hiç kurulmadığı ve canlıda hiçbir yanıtta HSTS görünmediği için `next.config.ts` production'da `Strict-Transport-Security: max-age=31536000; includeSubDomains` gönderiyor (`preload` bilinçli olarak yok, geri alması zor). Traefik middleware'i devreye alınınca uygulama katmanındaki satır kaldırılır, iki katman aynı başlığı göndermez. Uyarı: `includeSubDomains` apex'i gören tarayıcıda `dev`, `preview`, `status`, `analytics`, `send` alt alanlarını bir yıl https'e kilitler; yayından önce hepsinin geçerli sertifikayla TLS sonlandırdığı doğrulanmalı.
- **CSP: `unsafe-inline` kalıyor, ölçüm eklendi.** Enforced politikada `script-src 'self' 'unsafe-inline' <umami>` duruyor; gerekçe App Router'ın RSC payload'ını inline script ile stream etmesi (nonce her rotayı dinamik yapar, `/api/*` dışındaki her şeyin statik kalması korunan özellik). Eski "kök layout cookies() okuyor" gerekçesi yanlıştı, kod yorumu düzeltildi. Yeni: `Reporting-Endpoints` + `report-uri /api/csp-report` (POST, `application/csp-report` ve `application/reports+json`, 64 KB üstü 413, istemci başına dakikada 30 rapor, JSON satır log `event: csp-violation`, 204). `CSP_REPORT_ONLY=1` build değişkeniyle bir deploy yapılırsa `'unsafe-inline'` içermeyen sıkı bir `Content-Security-Policy-Report-Only` de gider ve toplayıcı bütçesi 600/dk'ya çıkar; pencere kapanınca değişken kaldırılır (`src/app/api/csp-report/mode.ts`). Umami origin'i tek sabit (`src/lib/analytics.ts`), `UMAMI_SCRIPT_URL` bu origin'in dışına çıkarsa production build durur; script etiketi `data-domains="dogancanyildiz.com"` taşır.
- **Contact endpoint yeniden sertleştirildi.** `Content-Type: application/json` zorunlu (415), `Origin` `NEXT_PUBLIC_SITE_URL` ile eşit olmalı (403; production dışında localhost serbest), locale rate limit'ten önce çözülür (`X-Locale` > Referer yolu: `/en` önekliyse en, değilse tr > q ağırlıklı `Accept-Language`; 2026-08-30 TR-varsayılan şemasına göre), rate limit çözümlenmiş IP için 5/10 dk, paylaşılan `unknown` anahtarı için 30/10 dk ve yalnızca taşıma kontrollerini geçen istekler sayılır, `name`/`email` CR/LF ve C0 kontrol karakterlerinde reddedilir, gövdedeki `From:` satırı başlık taklidine benzemeyecek biçime çevrildi, `subject` ve bilinmeyen alanlar 400 (PR #35 ile zorunlu kapalı kümeli `topic` alanı eklendi), Resend çağrısı 10 sn zaman aşımı (504), `Reply-To` ve payload'dan türetilmiş `Idempotency-Key`, yanıtlarda `X-Request-Id`, `X-RateLimit-Limit/Remaining`, 429'da `Retry-After`. Loglar tek satır JSON (`src/lib/log.ts`), mesaj gövdesi ve ziyaretçi adresi hiçbir satıra girmez, sağlayıcı hatası yalnızca kod adıyla loglanır. Üçüncü taraf hata takibi (Sentry vb.) bilinçli olarak eklenmedi: gözlem yüzeyi Coolify log + Gatus probu. `MAX_BODY_BYTES` alan limitlerinden türetiliyor (32.824 bayt).
- **Health ve başlangıç kontrolü.** `/api/health` `{ status: "ok" | "degraded", checks: { content, mail }, timestamp }` döner, uptime/pid yok; HTTP her zaman 200 (Docker HEALTHCHECK eksik mail değişkeni yüzünden container'ı yeniden başlatmasın), Gatus `[BODY].status == ok` alarmı verir. `src/instrumentation.ts` production'da `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL` eksikse açılışta JSON hata satırı basar, crash etmez. Footer'daki `/api/health` linki kaldırıldı (robots `Disallow: /api/` ile çelişiyordu).
- **Proxy her yolda.** `src/proxy.ts` matcher'ı `/:path*`; i18n hariç tutmaları `isLocalizedRoutePath`'te. Böylece `x-pathname` her istekte sunucu tarafından yazılır, `global-not-found` istemcinin gönderdiği başlığa güvenmez.
- **CV indekslenmiyor.** `/cv/:path*` `X-Robots-Tag: noindex, nofollow` ve `Cache-Control: public, max-age=86400` (immutable yok, dosya adı hash'li değil).
- **Bağımlılık hijyeni.** `velite` devDependencies'e taşındı (Dockerfile'ın deps katmanı devDependencies kurmaya devam ediyor, imaj değişmedi); `shiki` doğrudan bağımlılığı kaldırıldı; `npm audit --omit=dev` 0, `npm audit` 2 high (velite -> sharp <0.35.0, GHSA-f88m-g3jw-g9cj). **Bilinçli kabul edilen risk:** sharp yalnızca build zamanında, güvenilen içerik üzerinde çalışıyor; düzeltme velite'ı 0.0.0'a düşüren `--force` olduğu için uygulanmadı. Tripwire: velite sharp >= 0.35 aralığına geçtiğinde kapatılır; CI'daki `npm audit --omit=dev --audit-level=high` adımı prod grafiğini korur, `dependency-review-action` PR'larda yüksek şiddetli yeni bağımlılığı durdurur. GitHub Actions ve hadolint imajı digest/SHA ile pinli.
- **Güven sınırı notu (MDX).** `content/` altındaki MDX gövdeleri sanitize edilmiyor; **`content/` dizinine yazma yetkisi build sunucusunda kod çalıştırma yetkisidir.** Repo public olduğu için dışarıdan içerik PR'ı gelebilir; böyle bir PR merge edilmeden önce MDX ifadeleri (JSX, `export`, `import`) elle okunmalı. Dışarıdan içerik katkısı düzenli hale gelirse bu karar (sanitize veya MDX yerine Markdown) yeniden değerlendirilir. Şema tarafında `links.live`/`links.repo` ve `verifyUrl` yalnızca `https://` kabul eder, `javascript:` reddedilir.
- **Hâlâ açık (panel):** origin'in Cloudflare IP aralıklarına kısıtlanması (Faz 5 ile Gatus ve Umami da origin'de, yüzey büyüdü), `TRUST_CF_CONNECTING_IP=true` (yalnızca ondan sonra), Traefik `trustedIPs` ve HSTS middleware'i, Cloudflare Always Use HTTPS / Minimum TLS 1.2 / CAA / managed robots.txt kontrolü, Umami panelinin varsayılan parolası domain bağlanmadan önce değiştirilmeli. Canlı site 2026-08-28'de 526 verdiği için hiçbiri canlıda doğrulanamadı.

## Uygulama durumu (2026-09-02, 3. tur)

Dal `feature/audit-followups`, 31 Ağustos incelemesinin (V-) bulguları üzerine.

- **Consent artık geri alınabilir (V-2, GDPR 7(3) / KVKK).** Banner bir kez cevaplandıktan sonra tercihi değiştirecek hiçbir yol yoktu. `/privacy`'ye yeni bir `ConsentControls` istemci bileşeni eklendi (durum cümlesi + tek geri alma/izin verme düğmesi); `setAnalytics` artık `memoryOverride`'ı başarılı `setItem` sonrası temizliyor, storage tek doğruluk kaynağı kalıyor (V-11). Banner `role="dialog"` yerine `role="region"`: zaten odak çalmıyor, `aria-modal`/Escape davranışı da yoktu, rol artık gerçek davranışla eşleşiyor (V-9).
- **Contact ve csp-report route'ları ek sertleştirme aldı** (ayrıntı [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) "Uygulama durumu (2026-09-02, 3. tur)"): honeypot artık string olmayan değerleri de tuzak sayıyor, Reply-To adres-listesi ayraçlarını reddediyor, Referer tabanlı locale tespiti yalnızca site origin'ine güveniyor, rate limit IP anahtarı normalize ediliyor, CSP raporlayıcı istek başına en fazla 20 rapor yazıyor (önceden yalnızca 64 KB gövde sınırı vardı, bir istek binlerce satır loglayabiliyordu).
- **Install-script yüzeyi daraltıldı.** `npm ci` artık `--ignore-scripts` ile çalışıp yalnızca gerçekten lifecycle script'i olan beş paketi (`sharp`, `esbuild`, `@swc/core`, `unrs-resolver`, `@parcel/watcher`) `npm rebuild` ile derliyor; bu, `Dockerfile`, `ci.yml` ve `links.yml`'in üçünde de aynı. `.dockerignore` artık test fixture `node_modules` ve `.velite-*` çıktı dizinlerini de dışlıyor.
- **Bağımlılık durumu değişmedi (kabul edilen risk devam ediyor).** `npm audit --omit=dev` hâlâ 0; `npm audit --include=dev` hâlâ 2 high (velite -> sharp <0.35.0, `GHSA-f88m-g3jw-g9cj`); üst akış velite hâlâ sharp'ı güncellemedi (`npm view velite@latest dependencies` sharp `^0.34.5`). typescript 7 ve eslint 10 majorları hâlâ Dependabot'ta ignore: `eslint-plugin-react@7.37.5` eslint 10'u desteklemiyor (transitif olarak `eslint-config-next` üzerinden), üst akış güncellemesi bekliyor.
- **Yeni, henüz kapanmamış bulgu:** `next-intl`'in mesaj anahtarı tip güvenliği için eklenen `AppConfig` augmentation'ı (`src/types/next-intl.d.ts`) `Locale` tipini `"en" | "tr"`'ye daraltıyor; bunun `src/i18n/navigation.ts`'teki `pathnameForLocale`'in `locale: string` parametresiyle çakışması `npm run typecheck`'i kırıyor (tsbuildinfo temizlenmeden koşulursa görünmez). Güvenlik açığı değil ama CI'ın typecheck kapısını geçersiz kılabilir; ayrıntı `audit/acik-kalanlar.md` T-56.

## Riskler ve tripwire'lar

- `next/image` için `remotePatterns` birisi tarafından eklenirse (ör. blog kapak görseli harici bir kaynaktan çekilecekse), AVIF RCE sınıfı yüzey yeniden açılır; bu değişikliğe PR review'da özel dikkat şart.
- `CONTACT_EMAIL`/`FROM_EMAIL` prod'da unutulursa route sessizce `onboarding@resend.dev`'e düşer, istek `200` dönebilir ama mesaj kimseye ulaşmaz. Tripwire: prod build/start aşamasında bu değişkenler eksikse hata fırlatılmalı, sessiz fallback olmamalı (detay: [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md)).
- Coolify'ın Dockerfile `HEALTHCHECK` + Node.js container'larında bilinen bir connection-refused hatası var ([coollabsio/coolify#7500](https://github.com/coollabsio/coolify/issues/7500)); health check staging'de ayrıca doğrulanmadan production'a güvenilmemeli, aksi halde otomatik rollback yanlış tetiklenebilir.
- Renovate/Dependabot major sürüm PR'larını auto-merge etmemeli, yalnızca patch/minor. Bir sonraki Next major'ı (17) manuel review olmadan otomatik geçerse kırıcı değişiklikler fark edilmeden yayına çıkabilir.
- Aylık güvenlik blog taraması otomasyona bağlanamıyor, insan elinde kalıyor; kişisel bir sitede kimse zorlamıyor. Takvime aylık bir hatırlatıcı eklenmesi öneriliyor, aksi halde sürüm numarası değişmeyen mitigasyon duyuruları kaçırılır.
- `forwardedHeaders.trustedIPs` Cloudflare listesiyle set edilmezse, `CF-Connecting-IP` güvenilmez bir header haline gelir; rate limit atlatılabilir veya yanlış IP'ye kilitlenebilir. Faz 1'de bu ayar elle doğrulanmalı (detay: [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) bölüm 8b).
- Status widget'a code review sırasında yanlışlıkla yeni bir alan eklenirse (ör. debug amaçlı hostname loglanırsa), yukarıdaki izin verilen/asla gönderilmeyen tablosu checklist olarak kullanılmalı.
- CSP taslağı gerçek sayfalarla test edilmeden yayına çıkarsa (ör. bir üçüncü taraf script veya font sonradan eklenirse) sayfa sessizce kırılabilir; Faz 3/4'te her yeni script/font eklendiğinde CSP yeniden gözden geçirilmeli, özellikle Faz 5'te Umami eklenince.

## Uygulama notları

`.dockerignore` içeriği (build context'ine `.local/` ve diğer gereksiz dosyaların girmemesi için):

```
node_modules
.next
.git
.local
.nodeterm
.env*
*.md
```

Bu doküman ile [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) arasındaki iş bölümü: burada güvenlik gerekçesi, CVE listesi, header/CSP taslağı, env katman kuralı ve bakım otomasyonu var; contact endpoint'in `validateBody` yapısı, honeypot UX pattern'i, Resend `null`-guard deseni ve Gatus/Umami container kurulumunun adım adım tasarımı o dokümanda. Hangi kalemin hangi fazda uygulanacağı için bkz. [10-yol-haritasi.md](./10-yol-haritasi.md) (Faz 0: sürüm + header + contact sertleştirme + `.dockerignore`; Faz 5: Renovate + Umami + status widget canlıya alma).

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md) - genel karar özeti
- [02-stack-karari.md](./02-stack-karari.md) - Next vs Astro karşılaştırması, Astro CVE'lerinin karara etkisi
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) - contact endpoint tam tasarımı, Gatus/Umami kurulumu, Resend domain doğrulaması
- [06-devops-ve-deploy.md](./06-devops-ve-deploy.md) - Dockerfile, Traefik HSTS, Coolify Build/Runtime env ayrımının uygulanışı, GitHub Actions kapısı
- [10-yol-haritasi.md](./10-yol-haritasi.md) - bu dokümandaki kararların fazlara dağılımı
- [11-acik-sorular.md](./11-acik-sorular.md) - status widget'ta hangi servislerin gösterileceği sorusu

## Kaynaklar

- [August 2026 Security Release | Next.js](https://nextjs.org/blog/august-2026-security-release)
- [Upcoming Next.js August Security Release | Next.js](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026)
- [Next.js Security Release Program | Next.js](https://nextjs.org/blog/next-security-release-program)
- [45M Weekly Downloads at Risk: Next.js CVE-2026-75604 (CVSS 9.0) Enables Unauthenticated Remote Code Execution](https://securityonline.info/nextjs-rce-vulnerability/)
- [Application API Endpoints | coollabsio/coolify | DeepWiki](https://deepwiki.com/coollabsio/coolify/8.2-application-api-endpoints)

Not (2026-08-27, Faz 0 planı): CSP taslağındaki `script-src 'self'` uygulamada `script-src 'self' 'unsafe-inline'` olarak başlıyor. Next.js App Router RSC payload'ını satır içi script ile gömüyor; nonce yolu tüm route'ları dinamik render'a zorlayıp Faz 2'nin "yalnızca /api/* dynamic" kriterini kırıyor. Nonce'lu sıkı CSP, Cache Components varsayılan olduğunda yeniden değerlendirilecek. Ayrıntı: docs/plans/2026-08-27-faz-0-guvenlik-ve-hijyen.md.
