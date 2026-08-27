# Faz 1 devir notu: Deploy hattı

Tarih: 2026-08-27 · Dal: `feature/faz-1-deploy-hatti` · HEAD: bu commit (`513d853` üzerine) · Base: `feature/faz-0-guvenlik-ve-hijyen` @ `bc42737` · Plan: `docs/plans/2026-08-27-faz-1-deploy-hatti.md`

Durum: kod tarafı tamam ve yerelde doğrulandı. Dalda 10 task commit'i, 1 inceleme düzeltmesi (`fc470e0`), 1 manuel checklist (`56c3694`), 1 iş akışı script'i (`8328bc8`, uygulama kodu değil), 1 belge düzeltmesi (`513d853`) ve bu devir notu var. Panel tarafı (Coolify, Cloudflare, Traefik, Resend, GitHub) uygulanmadı; dal push edilmedi, PR açılmadı, canlı site bu fazda yayına alınmadı. Bitti sayılma kriterlerinin 1-4'ü yerelde geçti, 5-12 site sahibinin panel adımlarına bağlı ve `docs/plans/handoffs/faz-1-manual-checklist.md` içinde bekliyor. Bağımsız doğrulamadan sonra beş `fix:` commit'i daha eklendi, bkz. "Düzeltme turu" bölümü; panel checklist'lerini uygulamadan önce o bölüm okunmalı.

## Süreç notu

Şeffaflık için, sonraki fazın aynı tuzağa düşmemesi adına:

- Faz lideri ajan, kendi bağlamını miras alan bir fork ile aynı çalışma ağacında çakıştı: iki yazıcı aynı checkout üzerinde eşzamanlı çalıştı. Bunun üzerine paralel ajanlar durduruldu ve faz tek yazıcıya indirildi.
- Task 2-11 commit'leri (`4014508` ... `fc1a6fb`) faz lideri tarafından atıldı.
- Ana oturum, Dockerfile incelemesinden çıkan düzeltmeyi benimsedi ve `fc470e0` olarak commit'ledi: `ARG NEXT_PUBLIC_SITE_URL` varsayılanı kaldırıldı, HEALTHCHECK probe'u `PORT` env'ini okuyacak hale getirildi, `tests/deploy/dockerfile.test.ts` bu iki davranışı kilitleyecek şekilde güncellendi. Ana oturum ayrıca sahibin uygulayacağı manuel checklist'i commit'ledi (`56c3694`) ve faz iş akışı script'lerini güncelledi (`8328bc8`).
- Bu devir notu ve `513d853` entegrasyon ajanı tarafından yazıldı; yeni alt ajan açılmadı, fork tabanlı skill çağrılmadı.
- Doğrulama sırasında makinede önceki bir doğrulama koşusundan kalan `faz1-check` adlı container (port 3131, `portfolio-local:faz1` imajının eski bir sürümü) hâlâ ayaktaydı. Başka bir koşuya ait olabileceği için ona dokunulmadı. Bu oturumun kendi container'ı (`faz1-verify`) ve imajı (`portfolio-local:faz1`) doğrulama sonunda silindi; sahibi isterse `docker rm -f faz1-check` ile kalanı da temizler.

## Yapılanlar

| Commit | Task | Özet |
| --- | --- | --- |
| `4014508` | Task 2 | `.dockerignore` ve build context sözleşmesi; `tests/deploy/dockerignore.test.ts` (17 test), `vitest.config.mts` include'una `tests/**/*.test.ts` eklendi |
| `cab5623` | Task 3 | Çok aşamalı `Dockerfile` (deps/builder/runner, `node:24-alpine`, `USER node`, standalone kopyalama, `CMD ["node","server.js"]`, node fetch tabanlı HEALTHCHECK); `tests/deploy/dockerfile.test.ts` |
| `d07224b` | Task 4 | Yalnızca yerel doğrulama için `docker-compose.yml` (servis `web`, imaj `portfolio-local:faz1`, port 3000) |
| `7676fb5` | Task 5 | `.github/workflows/ci.yml`, `checks` ve `docker` job'ları, registry push yok; `tests/deploy/ci-workflow.test.ts` |
| `4205b8c` | Task 6 | `tests/lib/client-ip-trust.test.ts`, Faz 0'ın `getClientIp(headers, { trustCloudflare })` imzasını ve `TRUST_CF_CONNECTING_IP` kapısını kilitler; `.env.example`'daki bayrak açıklaması güncellendi. Yeni modül yazılmadı |
| `371518a` | Task 7 | `docs/deploy/coolify-kurulum.md` (GitHub App, build pack, domain, env katmanları, auto deploy ve preview, health check, rolling update, rollback, branch protection) |
| `b091a86` | Task 8 | `docs/deploy/cloudflare-kurulum.md` (DNS, Full strict, `.com -> .sh` redirect rule, cache rule, rate limiting, Bot Fight Mode) |
| `0f8a01d` | Task 9 | `docs/deploy/traefik-ve-origin.md` (`forwardedHeaders.trustedIPs`, `security-headers`, `compress`, `cloudflare-only`, `redirect-to-sh`, ufw ve ipAllowList ile origin kısıtı, preview erişimi) |
| `e03f024` | Task 10 | `docs/deploy/resend-domain.md` (SPF, DKIM, DMARC) ve `.env.example`'a `GATUS_URL` |
| `fc1a6fb` | Task 11 | README deploy bölümü: yerel imaj doğrulama komutları, hadolint komutu, dört checklist'e bağlantı |
| `fc470e0` | Task 3 düzeltmesi | `ARG NEXT_PUBLIC_SITE_URL` varsayılansız hale getirildi, HEALTHCHECK `PORT`'u okuyor, testler güncellendi (ana oturum) |
| `56c3694` | Task 11 | `docs/plans/handoffs/faz-1-manual-checklist.md`, sahibin uygulayacağı 11 bölüm (ana oturum) |
| `8328bc8` | faz dışı | `.claude/workflows/*` faz iş akışı script'leri; uygulama kodu değil |
| `513d853` | entegrasyon | Checklist'teki "Dockerfile varsayılan taşır" cümlesi `fc470e0` ile çelişiyordu, düzeltildi; README'deki "Dockerfile ve CI kapısı Faz 1'de eklenecek" cümlesi güncel duruma çekildi |

## Plandan sapmalar

1. **`ARG NEXT_PUBLIC_SITE_URL` varsayılanı yok** (`fc470e0`, `Dockerfile:29`). Plan Task 3 ve Task 7 checklist'i Dockerfile'ın `https://dogancanyildiz.sh` varsayılanı taşıdığını varsayıyordu. Gerekçe: build arg unutulursa preview veya staging bundle'ına sessizce üretim URL'si gömülür. Doğrulandı: `docker build -t portfolio-noarg:faz1 .` (arg'sız) exit 1 ve log'da `Error: NEXT_PUBLIC_SITE_URL is not set. It is a required build time variable...`. Sonuç: Coolify'da Build Variable set edilmek zorunda, opsiyonel değil.
2. **HEALTHCHECK `PORT`'a duyarlı** (`fc470e0`, `Dockerfile:60-62`): probe `http://127.0.0.1:${process.env.PORT || 3000}/api/health` adresine gidiyor. `docker run -e PORT=4000` ile doğrulandı, container `healthy` oldu.
3. **XFF son hop kararının testi genişledi.** Faz 0'ın `4a987eb` kararı (`getClientIp` X-Forwarded-For'un son hop'unu okur) Faz 1 testine yansıdı: `tests/lib/client-ip-trust.test.ts` 7 test içeriyor, plan 6 diyordu. Ek iki senaryo `tests/lib/client-ip-trust.test.ts:48` ("keys on the last x-forwarded-for hop") ve `:55` ("does not let a client supplied x-forwarded-for prefix move the key").
4. **Test sayıları plandakinden yüksek.** Plan: bu fazın 4 dosyası 40 test, Faz 0 ile birlikte 9 dosya 85 test. Gerçek: 10 dosya, 101 test. Bu fazın dosyaları `dockerignore` 17, `dockerfile` 10, `ci-workflow` 7, `client-ip-trust` 7 (toplam 41); Faz 0'ın dosyaları `client-ip` 13, `contact-validation` 14, `env` 13, `rate-limit` 11, `request-body` 6, `utils` 3 (toplam 60). Fark, Faz 0'ın düzeltme turunda eklediği testlerden geliyor; kayıp test yok.
5. **Bitti kriteri 4'ün beklenen değeri yanlış.** Plan `ls -a /app | grep -c -E "^(\.local|\.env|\.git|node_modules)$"` için `0` bekliyor, ancak Next standalone çıktısı kendi budanmış `node_modules`'ünü `/app` altına koyar, dolayısıyla komut her zaman `1` döner. Sızıntı yok: imajdaki `/app` listesi tam olarak `.next node_modules package.json public server.js`; pattern'den `node_modules` çıkarılınca sonuç `0`, `find /app -maxdepth 2 -name ".env*" -o -name ".git" -o -name ".local"` boş. Faz 2 bu kriteri kullanacaksa `node_modules`'ü pattern'den çıkarmalı.
6. **Panel adımları ayrı dosyalarda.** Plan checklist metinlerini task gövdelerine gömmüştü; dalda dört ayrı dosya var (`docs/deploy/coolify-kurulum.md`, `cloudflare-kurulum.md`, `traefik-ve-origin.md`, `resend-domain.md`) ve sahibin uygulama sırası `docs/plans/handoffs/faz-1-manual-checklist.md` içinde toplandı.
7. **hadolint bir `info` üretiyor**: `DL3066 info: Non-numeric user-id may not be resolvable by host system` (`Dockerfile:54`, `USER node`). `--failure-threshold warning` olduğu için exit 0; `node` kullanıcısı bilinçli tercih (plan Task 3, iki `RUN` katmanı tasarrufu).
8. **README'de iki deploy bölümü var**: Faz 0'dan gelen "Deployment" özeti (`README.md:77`) ve Faz 1'in eklediği "Deploy" bölümü (`README.md:111`). Birleştirilmedi, yalnızca eskisindeki geçersiz "Faz 1'de eklenecek" cümlesi `513d853` ile düzeltildi. Faz 2 belge düzenlemesi yaparsa iki bölüm birleştirilebilir.
9. **Yerel doğrulama portu.** Bu oturumda 3000 doluydu, doğrulama `-p 3141:3000` ile yapıldı. Container sözleşmesi (iç port 3000) değişmedi; `docker-compose.yml` ve README hâlâ 3000 kullanıyor.
10. **CI hiç koşmadı.** Dal push edilmediği için `gh run list --workflow=ci.yml` `HTTP 404: workflow ci.yml not found on the default branch` döndü. Workflow yerelde YAML parse edilerek doğrulandı (aşağıda).

## Doğrulananlar

Kapılar (hepsi bu dalın HEAD'inde, exit kodu ile):

| Komut | Sonuç |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | exit 0, `Test Files 10 passed (10)`, `Tests 101 passed (101)` |
| `npm run format` | exit 0, `All matched files use Prettier code style!` |
| `NEXT_PUBLIC_SITE_URL=https://dogancanyildiz.sh npm run build` | exit 0, 12 route, 18 statik sayfa üretildi |

Bitti sayılma kriterleri:

| # | Kriter | Komut | Çıktı | Geçti mi |
| --- | --- | --- | --- | --- |
| 1 | Yerel kod kapıları | `npm run lint && npm run typecheck && npm run test && npm run build` | dördü de exit 0; 10 dosya, 101 test | evet (test sayısı plandan yüksek, sapma 4) |
| 2 | Dockerfile denetimi | `docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile` | `DL3066 info` + `exit: 0` | evet |
| 3 | Yerel imaj davranışı | `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3141 -t portfolio-local:faz1 .` sonra `docker run -d --name faz1-verify -p 3141:3000 -e CONTACT_EMAIL=... -e FROM_EMAIL=... portfolio-local:faz1` | build exit 0; `{"status":"ok","uptime":15,"timestamp":"2026-08-27T03:21:30.489Z"}`; `root: 200`; `docker exec ... id -un` -> `node`; health status -> `healthy` | evet |
| 4 | Build context sızıntısı yok | `docker run --rm portfolio-local:faz1 sh -c 'ls -a /app \| grep -c -E "^(\.local\|\.env\|\.git\|node_modules)$"'` | `1` (standalone'un kendi `node_modules`'ü). Pattern'den `node_modules` çıkarılınca `0`; `/app` listesi `.next node_modules package.json public server.js` | evet, niyet karşılandı (plan beklentisi yanlış, sapma 5) |
| 5 | CI kapısı | `gh run list --workflow=ci.yml --limit 1 ...` | `HTTP 404: workflow ci.yml not found on the default branch` | manuel, checklist'te (bölüm 1-2) |
| 6 | Otomatik deploy ve canlı site | `curl -s https://dogancanyildiz.sh/api/health` | koşulmadı, site yayında değil | manuel, checklist'te (bölüm 8) |
| 7 | Preview deployment | Coolify PR yorumundaki URL | koşulmadı | manuel, checklist'te (bölüm 4) |
| 8 | `.com -> .sh` tek atlama 301 | `curl -sI https://dogancanyildiz.com/projects` | koşulmadı, sahibin onayı bekliyor | manuel, checklist'te (bölüm 9) |
| 9 | Origin kısıtı | allowlist dışı ağdan `curl --resolve ...` | koşulmadı | manuel, checklist'te (bölüm 6) |
| 10 | Gerçek istemci IP'si | `docker inspect coolify-proxy ... \| grep -c forwardedHeaders` | koşulmadı, sunucuya erişim yok | manuel, checklist'te (bölüm 6) |
| 11 | Contact formu uçtan uca | `curl -X POST https://dogancanyildiz.sh/api/contact` | koşulmadı | manuel, checklist'te (bölüm 7-8) |
| 12 | Rate limiting | canlıya 6 POST | koşulmadı | manuel, checklist'te (bölüm 8) |

Kriterlerin ötesinde koşulan ek doğrulamalar:

- Statik chunk servis ediliyor: kök HTML'den çekilen `/_next/static/chunks/310vm2bl3xxpt.js` için `200`, `content_type=application/javascript; charset=UTF-8`, `size=5364`. Yani `.next/static` kopyası doğru yere düşüyor.
- `X-Powered-By` yok: `curl -sI http://127.0.0.1:3141/ | grep -ci x-powered-by` -> `0`.
- CSP container'dan da geliyor: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. Yanında `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. HSTS yok, Traefik'in işi (Faz 0 sözleşmesi korunuyor).
- `/api/health` yanıtı `cache-control: no-store` taşıyor.
- `PORT` override'ı: `docker run -e PORT=4000 -p 3142:4000 ...` -> health `healthy`, `/api/health` `200`.
- Build arg zorunluluğu: arg'sız `docker build` exit 1, `resolveSiteUrl` hatası.
- CI workflow'u yerelde parse edildi (actionlint kurulu değil, node ile YAML parse): `name: ci`, `on: {"pull_request":{"branches":["main"]},"push":{"branches":["main"]}}`, job'lar `checks` (görünen ad `lint, typecheck, test, build`, 7 adım) ve `docker` (görünen ad `hadolint and image build`, 3 adım), `permissions: {"contents":"read"}`, `docker push` veya `push: true` yok. `tests/deploy/ci-workflow.test.ts` aynı sözleşmeyi 7 testle kilitliyor.
- Temizlik: `docker rm -f faz1-verify` ve `docker rmi portfolio-local:faz1` koşuldu, `portfolio-local` imajı kalmadı.

## Açık kalanlar

- Dal push edilmedi, PR açılmadı, CI hiç koşmadı. Faz 0 PR'ı (#2) merge edilmediği için Faz 1 PR'ının base'i ya `main` (Faz 0 merge sonrası) ya da Faz 0 dalı olacak; squash merge yapılırsa `git rebase --onto main bc42737 feature/faz-1-deploy-hatti`.
- Panel adımlarının hiçbiri uygulanmadı: Coolify uygulaması, Cloudflare DNS ve kuralları, Traefik `trustedIPs` ve origin kısıtı, Resend domain doğrulaması.
- `TRUST_CF_CONNECTING_IP` hâlâ `false`. `true` yapılması Traefik `trustedIPs` VE origin kısıtının ikisine birden bağlı (`docs/deploy/traefik-ve-origin.md` bölüm 2 ve 5). Sıra ters çevrilirse rate limit tamamen atlanabilir.
- `.com -> .sh` 301 kararı sahibinin onayını bekliyor (`docs/11-acik-sorular.md` soru 5). Onay gelmeden Cloudflare bölüm 3 uygulanmaz.
- Coolify health check'in `coollabsio/coolify#7500` yüzünden geçici kapatılıp kapatılmadığı bilinmiyor; sunucuda `docker inspect --format '{{.State.Health.Status}}'` ile bakılıp sonucu buraya yazılmalı.
- `ADMIN_IPV4` ve `ORIGIN_IPV4` değerleri bilinmiyor, kuruluma başlarken `curl -s https://api.ipify.org` ve sunucunun statik adresi ile doldurulacak. `ADMIN_IPV4` dinamik IP'de tazelenmek zorunda.
- `GATUS_URL` boş; Faz 5'te doldurulacak.
- Faz 0'dan devralınıp hâlâ açık olanlar: `npm audit` bulguları için karar, Renovate GitHub App kurulumu, `next dev`'in ürettiği `AGENTS.md` / `CLAUDE.md` dosyaları için karar, CSP nonce sorusu (Faz 5), `MAX_MESSAGE_LENGTH` ile `MAX_BODY_BYTES` ilişkisi, `theme-toggle.tsx`'in `resolvedTheme` okumaması (Faz 3).
- Makinede `faz1-check` adlı eski doğrulama container'ı ayakta kaldı (port 3131); bu oturuma ait olmadığı için silinmedi.

## Üretilen arayüzler

Faz 2 ve sonrası bunlara güvenebilir.

Dosyalar:

| Yol | Rol |
| --- | --- |
| `Dockerfile` | Üretim imajı, üç aşama (`deps`, `builder`, `runner`) |
| `.dockerignore` | Build context sözleşmesi; kök `*.md` hariç tutulur ama `README.md` korunur, `content/**/*.md` (Faz 4 Velite) bilerek kapsam dışı bırakılmadı |
| `docker-compose.yml` | Yalnızca yerel doğrulama, Coolify kullanmaz |
| `.github/workflows/ci.yml` | PR ve `main` push kapısı |
| `tests/deploy/*.test.ts` | Dockerfile, .dockerignore ve workflow sözleşme testleri |
| `tests/lib/client-ip-trust.test.ts` | Faz 0 IP güven kapısının kilidi |
| `docs/deploy/*.md` | Panel adımları (Coolify, Cloudflare, Traefik ve origin, Resend) |

Dockerfile sözleşmesi:

- Build arg: `ARG NEXT_PUBLIC_SITE_URL` (varsayılan YOK, verilmezse build patlar), `ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL` yalnızca `builder` aşamasında.
- Runner env: `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `PORT=3000`, `HOSTNAME=0.0.0.0`.
- `EXPOSE 3000`, `USER node`, `CMD ["node", "server.js"]` (çalışma dizini `/app`, standalone çıktısı köke kopyalanır).
- `HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3`, probe node'un yerleşik `fetch`'i ile `http://127.0.0.1:${PORT}/api/health`.
- Runner'a yalnızca `public`, `.next/standalone` ve `.next/static` kopyalanır, üçü de `--chown=node:node`.
- Build girişi tek satır: `RUN npm run build`. Faz 4 Velite'ı `package.json`'daki `build` script'ini `velite --clean && next build` yapar; Dockerfile'a ayrı bir velite adımı EKLENMEZ.
- Runtime sırrı imaj katmanına girmez: `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `GATUS_URL` adları Dockerfile'da hiç geçmez, `tests/deploy/dockerfile.test.ts:36` bunu kilitler.

Compose (yalnızca yerel): servis adı `web`, imaj etiketi `portfolio-local:faz1`, container adı `portfolio-local`, port `3000:3000`, build arg `NEXT_PUBLIC_SITE_URL: http://localhost:3000`, `restart: "no"`.

CI: workflow adı `ci`, job'lar `checks` (görünen ad `lint, typecheck, test, build`) ve `docker` (görünen ad `hadolint and image build`). Branch protection'da işaretlenecek iki check adı bunlardır. `actions/checkout@v7`, `actions/setup-node@v7`, node sürümü `.nvmrc`'den, npm cache açık. `checks` job'ı build'i `NEXT_PUBLIC_SITE_URL: https://dogancanyildiz.sh` ile koşar. `docker` job'ı hadolint `v2.15.1-alpine` ile lint eder ve imajı build eder, registry'ye push YOK.

Env: `.env.example` altı değişkeni de "Coolify layer" yorumuyla listeliyor. Build katmanı: `NEXT_PUBLIC_SITE_URL`. Runtime katmanı: `RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`, `TRUST_CF_CONNECTING_IP` (şimdilik `false`), `GATUS_URL` (boş, Faz 5).

Test yerleşimi: `vitest.config.mts` `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]`, alias `@` -> `./src`, environment `node`, `watch: false`. Faz 0'ın testleri `src/lib/` altında, Faz 1 ve sonrası `tests/` altında.

`getClientIp` imzası değişmedi: `getClientIp(headers: Headers, options: { trustCloudflare: boolean }): string`. Bu faz yeni modül yazmadı, yalnızca `TRUST_CF_CONNECTING_IP` bayrağının Traefik ayarıyla eşleşmesini test ile kilitledi.

Traefik middleware adları: `security-headers@file`, `compress@file`, `cloudflare-only@file` (paket seviyesi kısıt yerine ipAllowList seçilirse), `redirect-to-sh` (Cloudflare Redirect Rule'un yedeği). Bu middleware'ler Coolify'ın ürettiği `https-0-<uuid>` ve `http-0-<uuid>` router adlarına bağlanır, `portfolio` adında bir router yoktur.

Preview URL şablonu: `http://{{pr_id}}.preview.dogancanyildiz.sh`, şema bilerek `http`, DNS-only kayıt, yalnızca allowlist'teki IP'den erişilebilir. Preview'da `TRUST_CF_CONNECTING_IP` `false` kalır.

URL kararı: `.sh` ana domain, `.com` tek atlama 301. `NEXT_PUBLIC_SITE_URL` yalnızca `.sh` değerini alır, uygulama kodu `.com`'u hiç bilmez.

## Sonraki faza (Faz 2, i18n) uyarılar

- Dockerfile `public/`, `.next/standalone` ve `.next/static` kopyalar; bu üçü `app/[lang]` restructure'ından etkilenmez. Route ağacı tamamen değişse bile Dockerfile'a dokunmak gerekmez. Dokunmayı düşündüren tek şey `output: "standalone"` ayarının kaldırılması olur, o da yapılmamalı.
- `NEXT_PUBLIC_SITE_URL` build zamanı değişkendir ve varsayılanı yoktur: yeni bir build ortamı (CI matrisi, ek workflow, yeni compose dosyası) eklenirse arg açıkça geçilmeli, yoksa build `resolveSiteUrl` hatasıyla durur. CI'daki değer `https://dogancanyildiz.sh` (`.github/workflows/ci.yml`, `checks` job'ı).
- `metadataBase` `src/app/layout.tsx` içinde `new URL(siteUrl())` ile set edildi (Faz 0, `58bc79e`). `app/[lang]/layout.tsx`'e taşınırken bu satır korunmalı; düşerse og:image tekrar localhost'a çözülür ve build uyarısı geri gelir.
- `sitemap.ts`, `robots.ts` ve `alternates` üretimi `siteUrl()` üzerinden gitmeli. Bu fazın kanıtı: arg'sız docker build tam olarak `/robots.txt` prerender'ında patlıyor, yani metadata route'ları değişkenin tek tüketicisi.
- Faz 2 route'ları dinamikleştirirken `/api/health`'in sözleşmesini bozmamalı: HTTP `200`, gövdede `status: "ok"` alanı ve `no-store`. Gövde bundan ibaret değil, `uptime` ve `timestamp` de dönüyor ve her çağrıda değişiyor, dolayısıyla hiçbir kontrol gövdeyi birebir `{"status":"ok"}` ile karşılaştırmamalı. Coolify health check, Dockerfile HEALTHCHECK ve Gatus (Faz 5) aynı yola bakıyor.
- Yeni test dosyaları `tests/` altına konursa vitest include'u zaten kapsıyor; `src/` altına konursa da kapsıyor. Ayrıca CI'daki `npm run test` tüm dosyaları koşar, ayrı bir adım eklemek gerekmez.
- `.dockerignore` kök `*.md` dosyalarını dışarıda tutuyor ama `content/**/*.md` bilerek kapsam dışı: Faz 4 Velite içeriği build context'te kalmalı. Faz 2 yeni bir üst düzey dizin eklerse (`messages/`, `locales/`) build context'e girdiğinden emin olmalı, `.dockerignore`'da recursive bir desen yok.
- Faz 2'nin PR'ı `lint, typecheck, test, build` ve `hadolint and image build` check'lerinden geçmek zorunda; Dockerfile'a dokunulursa hadolint `--failure-threshold warning` seviyesinde koşar.

## Düzeltme turu (2026-08-27, doğrulama sonrası)

Bağımsız doğrulama beş bloklayan bulgu çıkardı; hepsi sahibin panelde takip edeceği checklist metinlerindeydi, uygulama kodunda değil. Beşi de düzeltildi ve testle kilitlendi.

| Commit | Bulgu | Ne değişti |
| --- | --- | --- |
| `914e267` | `NEXT_PUBLIC_SITE_URL` için "sessizce `undefined` kalır" iddiası, `fc470e0`'dan sonra yanlış | `docs/deploy/coolify-kurulum.md` bölüm 4 ve `README.md` env tablosu artık gerçek başarısızlığı yazıyor: arg'sız build `/robots.txt` prerender'ında `resolveSiteUrl` hatasıyla duruyor |
| `32b6701` | Health check beklentisi olarak yalnızca `status` alanından ibaret sabit bir gövde yazılmıştı, endpoint böyle bir gövdeyi hiç dönmüyor | Sözleşme "HTTP 200 + gövdedeki `status` alanı" olarak yazıldı, `uptime` ve `timestamp` değişken alanlar olarak belirtildi; `src/app/api/health/route.test.ts` gerçek şekli, docs testi de literal gövdenin geri gelmemesini kilitliyor |
| `a8b8111` | `traefik.http.routers.portfolio.middlewares=...` var olmayan bir router'a yazıyordu, HSTS ve compress hiç uygulanmayacaktı | Coolify'ın ürettiği `https-0-<uuid>` ve `http-0-<uuid>` router adlarına, mevcut satırın değeri korunarak ekleme yapılıyor; readonly labels kapatıldıktan sonra üretilmiş etiketlerin silinmemesi ayrı uyarı olarak yazıldı |
| `621975f` | ufw, Docker'ın publish ettiği 80/443'ü filtrelemiyor; "origin kapandı" maddesi hiçbir şey kapatmıyordu | Bölüm 5 ikiye ayrıldı: ufw yalnızca SSH ve publish edilmemiş portlar, asıl kısıt `DOCKER-USER` zincirinde (DROP önce, Cloudflare ve admin `RETURN` üstüne, `ip6tables` dahil, `netfilter-persistent` ile kalıcı). Tek geçerli kanıt `--resolve` ile doğrudan origin testi |
| `7611ab1` | `TRUST_CF_CONNECTING_IP` kapısının doğrulaması yapı gereği hiç başarısız olamıyordu | Sahte `CF-Connecting-IP` döngüsü kaldırıldı (edge başlığı eziyor, üstüne Cloudflare'ın 10 saniyede 3 istek kuralı zaten `429` veriyor). Yerine üç ayrık kanıt: `--resolve` origin testi, Traefik access log'unda `ClientHost`, ve edge eşiğinin altında koşan `/api/contact` probe'u |

Düzeltme turunda koşan kapılar: `npm run typecheck`, `npm run lint`, `npm test` (13 dosya, 125 test), `npm run format`, `NEXT_PUBLIC_SITE_URL=... npm run build` (18 route, ek test dosyaları route ağacına girmiyor).

Konteyner üzerinde yeniden ölçülen davranış (imaj ve container doğrulama sonunda silindi, port 3187 kullanıldı):

```
GET  /api/health -> 200 {"status":"ok","uptime":11,"timestamp":"2026-08-27T03:45:58.240Z"}, cache-control: no-store, health status: healthy
POST /api/contact -d '{}' x6 -> 400 400 400 400 400 429
6. yanıt: content-type: application/json, retry-after: 600, {"error":"Too many requests. Please try again later."}
```

Bu turda bilerek dokunulmayanlar:

- `docs/plans/2026-08-27-faz-1-deploy-hatti.md` (satır 1538 ve 1597) hâlâ `routers.portfolio` etiketini, birkaç yeri de literal `{"status":"ok"}` gövdesini içeriyor. Plan dosyası uygulanmış planın kaydı, sahibin takip ettiği doküman değil; sahibin izleyeceği metinler `docs/deploy/` ve `docs/plans/handoffs/` altındakiler ve onlar düzeltildi.
- `docs/plans/handoffs/faz-0-manual-checklist.md` satır 33 origin kısıtını hâlâ "ufw veya ipAllowList" diye anıyor. O madde bu fazın `docs/deploy/traefik-ve-origin.md` bölüm 5'i tarafından devralındı; Faz 0 devir notu başka bir fazın kaydı olduğu için değiştirilmedi, uygulanacak metin bu fazınki.
- `docs/plans/2026-08-27-faz-5-altyapi-vitrini-ve-olcum.md` Gatus'un `/api/health` gövdesini `{"status":"ok"}` diye anlatıyor. Faz 5 planı yazılırken gövde eşleşmesi değil, `200` ve `status` alanı kontrol edilmeli; bu uyarı yukarıdaki "Sonraki faza uyarılar" bölümünde de var.

## Manuel adımlar

Kodla yapılamayan her şey `docs/plans/handoffs/faz-1-manual-checklist.md` içinde, uygulama sırası bağlayıcı: (1) dalı push edip PR açmak ve diff'te yerel dizinlerin olmadığını doğrulamak, (2) CI check'lerinin geçtiğini görmek ve branch protection'a iki check'i eklemek, (3) Coolify uygulaması (GitHub App, Dockerfile build pack, Ports Exposes 3000, Mappings boş, env katmanları, auto deploy, preview, health check, rolling update koşulları), (4) preview deployment doğrulaması, (5) Cloudflare (DNS, Full strict, cache rule, rate limiting, Bot Fight Mode), (6) Traefik `forwardedHeaders.trustedIPs` ve origin kısıtı, ardından `TRUST_CF_CONNECTING_IP=true`, (7) Resend domain doğrulaması (SPF, DKIM, DMARC), (8) canlı doğrulama (health, root, başlıklar, contact formu, rate limit), (9) sahibin onayı gelirse `.com -> .sh` 301, (10) merge ve otomatik deploy, (11) Faz 0'dan devralınan açık maddeler.
