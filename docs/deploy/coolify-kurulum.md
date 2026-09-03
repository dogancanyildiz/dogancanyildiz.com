# Coolify kurulumu (el ile checklist)

Hedef Coolify sürümü: v4.3.1. Bu adımlar Coolify panelinde el ile yürütülür, repoda otomatikleştirilmez. Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 1, 2, 6 ve 9.

## 1. GitHub App kaynağı

- [ ] Coolify -> Sources -> "+ Add" -> GitHub App.
- [ ] App'i `dogancanyildiz/dogancanyildiz.com` reposuna kur.
- [ ] Repository permissions: Contents `Read`, Metadata `Read`, Pull requests `Read and write`, Checks `Read and write`, Deployments `Read and write`, Webhooks `Read and write`.
- [ ] Doğrulama: Coolify kaynak sayfasında repo listesi görünüyor.

## 2. Uygulama kaynağı

- [ ] "+ New" -> Application -> Private Repository (with GitHub App) -> `dogancanyildiz/dogancanyildiz.com`, branch `main`.
- [ ] Build Pack: **Dockerfile**. Nixpacks veya Docker Compose seçilmez.
- [ ] Base Directory: `/`
- [ ] Dockerfile Location: `/Dockerfile`
- [ ] Ports Exposes: `3000`
- [ ] Ports Mappings: **boş bırakılır**. Host port mapping tanımlanırsa Coolify'ın zero downtime rolling update koşullarından biri bozulur.

## 3. Domain

**Karar (2026-09-02):** kanonik host www. Tek alan adı `dogancanyildiz.com`; ikinci bir alan adı 2026-09-03 kararıyla kapsam dışı.

**Karar değişikliği (2026-09-03, ilk canlı deploy):** apex -> www yönlendirmesi Coolify'ın dahili "Direction" ayarıyla (Traefik) yapılır; sahibi diğer sitesiyle aynı düzeni istedi. Cloudflare'deki `apex to www` Redirect Rule (`docs/deploy/cloudflare-kurulum.md` bölüm 3b) artık zorunlu değil, isteğe bağlı bir edge katmanı: eklenirse aynı yönde olduğu için çakışmaz ve yönlendirme 301 olarak edge'de biter. Coolify'ın yönlendirmesi **307** döner; kalıcı 301 istenirse Cloudflare kuralı eklenir.

- [ ] Domains: `https://www.dogancanyildiz.com` ve `https://dogancanyildiz.com` (Traefik ikisi için de sertifika üretir ve router tanımlar).
- [ ] www satırında Direction: **Redirect to www**. "Redirect to non-www" seçilirse kanonik www ile ters düşer: canonical, sitemap, Umami `data-domains` ve iletişim formunun Origin kontrolü (`NEXT_PUBLIC_SITE_URL`) hepsi www'ye bağlı, apex'te form 403 alır ve ölçüm düşmez (ilk deploy'da tam bu oldu).
- [ ] Direction değişikliği Docker label'ı olarak konteynere yazılır, kaydetmek yetmez: **Redeploy** (veya Restart) gerekir, yoksa Traefik eski yönü kullanmaya devam eder.
- [ ] Doğrulama: `curl -sI 'https://dogancanyildiz.com/en/blog?x=1'` `location: https://www.dogancanyildiz.com/en/blog?x=1` vermeli (yol ve sorgu korunur), `curl -sI https://www.dogancanyildiz.com/` `200` dönmeli.

## 4. Env değişkenleri

Coolify'da her değişkenin yanındaki "Build Variable?" kutusu, o değişkenin `docker build --build-arg` olarak geçip geçmeyeceğini belirler.

| Değişken | Build Variable? | Değer | Gerekçe |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Evet** | `https://www.dogancanyildiz.com` | `next build` bunu client bundle'a inline ediyor ve Dockerfile'daki `ARG NEXT_PUBLIC_SITE_URL` varsayılansız (commit `fc470e0`). Build Variable işaretlenmezse build sessizce `undefined` bırakmaz, `resolveSiteUrl` hatasıyla Coolify build logunda durur (`/robots.txt` prerender adımı). |
| `SMTP_HOST` + `SMTP_PORT` + `SMTP_USER` + `SMTP_PASSWORD` | Hayır (Runtime) | Mailcow submission bilgileri, uygulama parolası (`docs/deploy/mailcow-smtp.md`) | Sır. Build variable image katmanlarına ve build loglarına sızabilir. |
| `CONTACT_EMAIL` | Hayır (Runtime) | `me@dogancanyildiz.com` | Yalnızca sunucu tarafındaki contact route okuyor. |
| `FROM_EMAIL` | Hayır (Runtime) | `contact@dogancanyildiz.com` | Aynı gerekçe. Mailcow'da tanımlı, DKIM imzalı adres olmalı, bkz. `docs/deploy/mailcow-smtp.md`. |
| `TRUST_CF_CONNECTING_IP` | Hayır (Runtime) | Task 9 tamamlanana kadar `false`, sonra `true` | Faz 0'ın `trustsCloudflareHeaders()` kapısı. Traefik `forwardedHeaders.trustedIPs` set edilmeden ve origin yalnızca Cloudflare adreslerine kısıtlanmadan `true` yapılırsa rate limit anahtarı istemcinin uydurduğu başlıktan türer ve limit tamamen atlanabilir. Bkz. `docs/deploy/traefik-ve-origin.md` bölüm 2 ve 5. |

- [ ] Doğrulama: deploy sonrası Coolify build logunda `SMTP_PASSWORD` değeri geçmiyor (Runtime sırlar build'e hiç girmemeli, Build Variable işaretli tek değerler `NEXT_PUBLIC_*` ve `UMAMI_*`).
- [ ] Doğrulama: canlı sayfanın HTML kaynağında `https://www.dogancanyildiz.com` geçiyor (`NEXT_PUBLIC_SITE_URL` gerçekten gömülmüş).
- [ ] Doğrulama: `TRUST_CF_CONNECTING_IP` yalnızca Task 9 bittikten sonra `true` yapıldı. Cloudflare'ın arkasında olmayan bir ortama deploy edilirse `false` kalmalı.
- [ ] Build değişkenleri `NEXT_PUBLIC_BUILD_SHA` (Coolify `SOURCE_COMMIT`) ve `NEXT_PUBLIC_BUILD_DATE` (deploy zamanı, ISO) set; boşsa Systems paneli "son yayın" alanını gizler ve footer yıl basmaz. Faz 5 değişkenleri (`NEXT_PUBLIC_STATUS_URL`, `UMAMI_SCRIPT_URL` ve `UMAMI_WEBSITE_ID`, üçü de Build) `docs/runbooks/infrastructure.md`'de. `CSP_REPORT_ONLY=1` yalnızca tek bir ölçüm deploy'u için Build değişkeni olarak eklenir ve sonra kaldırılır.
- [ ] Doğrulama: container açılış logunda `SMTP_*`, `CONTACT_EMAIL`, `FROM_EMAIL` için hata satırı yok ve `curl -s https://www.dogancanyildiz.com/api/health` gövdesinde `"status":"ok"` (eksik mail değişkeni `"degraded"` üretir, HTTP yine 200).

## 5. Auto deploy

- [ ] Advanced -> "Auto Deploy" açık. `main`'e push, GitHub App webhook'u üzerinden yeniden deploy tetikler.
- [ ] Advanced -> "Preview Deployments" kapalı (karar 2026-09-03): tek geliştirici, her PR CI'dan geçiyor.

## 6. Health check

**Düzeltme (2026-09-03, Coolify v4.3.14):** UI'da Healthcheck açıksa Coolify kendi komutunu (önce `curl`, olmazsa `wget`) konteynerin `healthcheck` tanımı olarak yazar ve Dockerfile'daki `HEALTHCHECK` **ezilir**, tersi değil. `node:24-alpine` imajında curl yok; busybox `wget` de `localhost:3000`'e "connection refused" alır, çünkü Alpine'da `localhost` önce `::1`'e çözülür ve Next standalone yalnızca `0.0.0.0` (IPv4) dinler. Sonuç: uygulama "Ready" dediği hâlde üç deneme sonunda "unhealthy", rollout iptal.

İki geçerli ayar:

- **Kullanılan (2026-09-03):** UI Healthcheck açık ve **Host: `127.0.0.1`** (`localhost` değil). wget IPv4'e bağlanır, kontrol geçer; ilk başarılı deploy bu ayarla alındı.
- Alternatif: UI Healthcheck kapalı. Coolify o zaman Dockerfile'daki probe'a düşer; o zaten `127.0.0.1` ve node'un yerleşik `fetch`'iyle çalışır.

UI açık tutulacaksa değerler Dockerfile ile aynı olmalı ki iki katman çelişmesin:

- [ ] Health Check: Enabled
- [ ] Host: `127.0.0.1`
- [ ] Path: `/api/health`
- [ ] Port: `3000`
- [ ] Method: `GET`, Expected Status: `200`
- [ ] Interval: `15`, Timeout: `5`, Retries: `3`, **Start Period: `30`**

Start period kritik: `coollabsio/coolify#7500`, Dockerfile ile build edilen Node container'larında curl ve wget tabanlı probe'ların connection refused vermesini raporluyor ve issue hâlâ açık. Bu repoda probe curl kullanmıyor (node'un yerleşik `fetch`'i kullanılıyor, `node:24-alpine` zaten curl içermiyor) ve start period standalone soğuk başlangıcı kapsıyor.

- [ ] Doğrulama, production'a bağlamadan önce sunucuda elle çalıştır:

```bash
# <container> yerine Coolify'ın oluşturduğu konteyner adını yaz
docker ps --format '{{.Names}}\t{{.Status}}' | grep -i portfolio
docker inspect --format '{{.State.Health.Status}}' <container>
docker exec <container> node -e "fetch('http://127.0.0.1:3000/api/health').then(async (r) => { console.log(r.status, await r.text()); })"
```

Beklenen:

```
healthy
200 {"status":"ok","checks":{"content":true,"mail":true},"timestamp":"2026-..."}
```

Sözleşme yalnızca HTTP `200` ve gövdedeki `status` alanının `ok` olmasıdır. `timestamp` her çağrıda değişir, `checks.mail` posta değişkenleri (SMTP_*, CONTACT_EMAIL, FROM_EMAIL) eksikse `false` olur ve `status` `degraded`e düşer (HTTP yine 200; `src/app/api/health/route.ts`, 2026-08-28), gövdenin birebir eşleşmesi beklenmez; Coolify health check'i yalnızca status koduna bakar, Uptime Kuma keyword monitörü gövdedeki `"status":"ok"` metniyle `degraded` durumunu alarm olarak görür.

`unhealthy` görülürse rolling update yeni deploy'ları geri alır. O durumda Coolify UI'da health check geçici olarak kapatılır, sorun `#7500` referansıyla not edilir ve production'a health check bağlı halde geçilmez.

## 7. Rolling update (zero downtime) koşulları

Dördü birden sağlanmalı:

- [ ] Health check geçiyor (bölüm 6)
- [ ] Varsayılan konteyner isimleri kullanılıyor (Coolify'ın ürettiği isim değiştirilmedi)
- [ ] Host port mapping yok (bölüm 2)
- [ ] Compose build pack kullanılmıyor (bölüm 2)

## 8. Rollback ve yedek

- [ ] Coolify'ın tek tıkla rollback'i yalnızca sunucuda duran local image'lar üzerinde çalışır; git tabanlı Dockerfile yolu bunu native sağlar, ek ayar gerekmez.
- [ ] Coolify instance'ının kendi backup/restore mekanizması bu deploy hattından bağımsız olarak kurulur.
- [ ] GHCR pull yoluna ileride geçilirse floating `latest` tag kullanılmaz, git SHA tag zorunludur.

## 9. GitHub branch protection

- [ ] GitHub -> Settings -> Branches -> `main` için "Require status checks to pass": `Quality checks`, `Docker image` ve `CodeQL analysis` işaretlenir (adlar 2026-08-28'de böyle; `.github/workflows/ci.yml` ve `codeql.yml` job adları). `enforce_admins` da açılmalı, aksi halde bir admin CI'ı bypass edip doğrudan push edebilir.
