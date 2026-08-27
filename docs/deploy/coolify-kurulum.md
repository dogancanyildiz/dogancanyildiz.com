# Coolify kurulumu (el ile checklist)

Hedef Coolify sürümü: v4.3.1. Bu adımlar Coolify panelinde el ile yürütülür, repoda otomatikleştirilmez. Kaynak kararlar: `docs/06-devops-ve-deploy.md` bölüm 1, 2, 6 ve 9.

## 1. GitHub App kaynağı

- [ ] Coolify -> Sources -> "+ Add" -> GitHub App.
- [ ] App'i `dogancanyildiz/portfolio` reposuna kur.
- [ ] Repository permissions: Contents `Read`, Metadata `Read`, Pull requests `Read and write`, Checks `Read and write`, Deployments `Read and write`, Webhooks `Read and write`.
- [ ] Doğrulama: Coolify kaynak sayfasında repo listesi görünüyor. Pull requests izni eksikse Preview Deployments sessizce çalışmaz, Deploy Key ile bu özellik hiç desteklenmiyor.

## 2. Uygulama kaynağı

- [ ] "+ New" -> Application -> Private Repository (with GitHub App) -> `dogancanyildiz/portfolio`, branch `main`.
- [ ] Build Pack: **Dockerfile**. Nixpacks veya Docker Compose seçilmez.
- [ ] Base Directory: `/`
- [ ] Dockerfile Location: `/Dockerfile`
- [ ] Ports Exposes: `3000`
- [ ] Ports Mappings: **boş bırakılır**. Host port mapping tanımlanırsa Coolify'ın zero downtime rolling update koşullarından biri bozulur.

## 3. Domain

- [ ] Domains: `https://dogancanyildiz.sh`
- [ ] "Redirect" ayarı: www -> non-www (Coolify'ın dahili www yönlendirmesi). `dogancanyildiz.com -> dogancanyildiz.sh` cross domain yönlendirmesi burada değil, Cloudflare Redirect Rules'ta tanımlanır, bkz. `docs/deploy/cloudflare-kurulum.md`.

## 4. Env değişkenleri

Coolify'da her değişkenin yanındaki "Build Variable?" kutusu, o değişkenin `docker build --build-arg` olarak geçip geçmeyeceğini belirler.

| Değişken | Build Variable? | Değer | Gerekçe |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Evet** | `https://dogancanyildiz.sh` | `next build` bunu client bundle'a inline ediyor ve Dockerfile'daki `ARG NEXT_PUBLIC_SITE_URL` varsayılansız (commit `fc470e0`). Build Variable işaretlenmezse build sessizce `undefined` bırakmaz, `resolveSiteUrl` hatasıyla Coolify build logunda durur (`/robots.txt` prerender adımı). |
| `RESEND_API_KEY` | Hayır (Runtime) | Resend panelinden alınan `re_...` anahtarı | Sır. Build variable image katmanlarına ve build loglarına sızabilir. |
| `CONTACT_EMAIL` | Hayır (Runtime) | `me@dogancanyildiz.com` | Yalnızca sunucu tarafındaki contact route okuyor. |
| `FROM_EMAIL` | Hayır (Runtime) | `contact@dogancanyildiz.sh` | Aynı gerekçe. Resend'de doğrulanmış domain olmalı, bkz. `docs/deploy/resend-domain.md`. |
| `TRUST_CF_CONNECTING_IP` | Hayır (Runtime) | Task 9 tamamlanana kadar `false`, sonra `true` | Faz 0'ın `trustsCloudflareHeaders()` kapısı. Traefik `forwardedHeaders.trustedIPs` set edilmeden ve origin yalnızca Cloudflare adreslerine kısıtlanmadan `true` yapılırsa rate limit anahtarı istemcinin uydurduğu başlıktan türer ve limit tamamen atlanabilir. Bkz. `docs/deploy/traefik-ve-origin.md` bölüm 2 ve 5. |
| `GATUS_URL` | Hayır (Runtime) | Faz 5'te doldurulur | İç adres, client'a hiçbir koşulda gitmez. |

- [ ] Doğrulama: deploy sonrası Coolify build logunda `re_` ile başlayan hiçbir string yok.
- [ ] Doğrulama: canlı sayfanın HTML kaynağında `https://dogancanyildiz.sh` geçiyor (`NEXT_PUBLIC_SITE_URL` gerçekten gömülmüş).
- [ ] Doğrulama: `TRUST_CF_CONNECTING_IP` yalnızca Task 9 bittikten sonra `true` yapıldı; PR preview ortamlarında `false` kalıyor (preview'lar Cloudflare'ın arkasında değil).

## 5. Auto deploy ve Preview Deployments

- [ ] Advanced -> "Auto Deploy" açık. `main`'e push, GitHub App webhook'u üzerinden yeniden deploy tetikler.
- [ ] Advanced -> "Preview Deployments" açık.
- [ ] Preview URL şablonu: `http://{{pr_id}}.preview.dogancanyildiz.sh`
  - Şema bilerek `http`. Cloudflare ücretsiz planı wildcard DNS kaydını proxy'leyemiyor, dolayısıyla `*.preview` kaydı gri bulut kalıyor; gri bulutta Let's Encrypt HTTP-01 doğrulaması origin'e doğrudan ulaşmak zorunda kalır ve origin yalnızca Cloudflare IP'lerine açık olduğu için başarısız olur. Preview'lar TLS'siz ve yalnızca allowlist'teki admin IP'sinden erişilebilir kalır, bkz. `docs/deploy/traefik-ve-origin.md`.
- [ ] Doğrulama: test PR'ı açıldığında Coolify PR'a preview URL'i içeren bir yorum bırakıyor.

## 6. Health check

Dockerfile'da bir `HEALTHCHECK` tanımlıysa Coolify'ın UI ayarını ezer. Bu repoda `HEALTHCHECK` tanımlı, dolayısıyla asıl kaynak Dockerfile'dır. UI ayarı yine de aynı değerlerle doldurulur ki iki katman çelişmesin.

- [ ] Health Check: Enabled
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
200 {"status":"ok","uptime":<saniye>,"timestamp":"2026-..."}
```

Sözleşme yalnızca HTTP `200` ve gövdedeki `status` alanının `ok` olmasıdır. `uptime` ve `timestamp` her çağrıda değişir (`src/app/api/health/route.ts`), gövdenin birebir eşleşmesi beklenmez; Coolify health check'i de yalnızca status koduna bakar.

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

- [ ] GitHub -> Settings -> Branches -> `main` için "Require status checks to pass": `lint, typecheck, test, build` ve `hadolint and image build` işaretlenir. Bu iki check `.github/workflows/ci.yml` içindeki `checks` ve `docker` job'larının görünen adlarıdır.
