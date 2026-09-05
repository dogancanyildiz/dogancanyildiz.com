# DevOps, Docker, Coolify ve Deploy Hattı

Durum: Uygulandı, site 2026-09-03'te canlıda (Faz 1 #3; CI/Docker sertleştirmesi #34; apex yönlendirmesi ve healthcheck düzeltmesi #52) · Karar: 2026-08-27 · Güncelleme: 2026-09-03 · Kapsam: dogancanyildiz.com

## Kararlar

### 1. Build yolu: Coolify GitHub App + git tabanlı Dockerfile

Kararı o tarihte tek bir zorunlu koşul belirledi: PR başına önizleme URL'i.
Coolify'da bu özellik yalnızca GitHub App entegrasyonu ve git tabanlı build ile
çalışıyor, Deploy Key desteklemiyor. **Güncelleme (2026-09-03):** Preview
Deployments kapatıldı (tek geliştirici, her PR CI'dan geçiyor), ama GitHub App
+ Dockerfile build pack seçimi kendi başına da doğru kaldığı için
değiştirilmedi. Elenen yollar: GHCR image + pull (gelecekteki yükseltme
kapısı), Nixpacks (üreticisi aktif
geliştirmediğini ilan etti, halefi beta), docker-compose build pack (Coolify'da
zero-downtime rolling update'i tamamen devre dışı bırakıyor, tek servisli bir
sitede kazanç yok). Rolling update dört koşula bağlı ve seçilen yol dördünü de
yapısal olarak karşılıyor: health check geçiyor, varsayılan konteyner adları,
host port mapping yok, compose kullanılmıyor.

Sunucunun RAM/CPU'su yeterli (sahibi 2026-08-27'de doğruladı), build doğrudan
sunucu üstünde alınıyor; ayrı bir build sunucusu gerekmiyor.

### 2. Dockerfile: deps -> builder -> runner

`node:24-alpine`, digest'e pinli. `deps` bağımlılıkları izole ve cache dostu
katmanda kuruyor, `builder` içerik derlemesi + `next build` çalıştırıyor,
`runner` yalnızca `.next/standalone`, `.next/static` ve `public`'i imajın hazır
`node` kullanıcısına kopyalayıp `node server.js` çalıştırıyor (`npm start`
değil, standalone çıktısı kendi server'ını üretiyor).

Kararda olmayan, uygulamada eklenen üç şey:

- **`NEXT_PUBLIC_SITE_URL` ARG'ının varsayılanı yok.** Unutulan bir build
  argümanı `/robots.txt` prerender'ında `resolveSiteUrl` ile build'i düşürüyor;
  prod URL'in sessizce yanlış bir ortamın imajına gömülmesini önlüyor. Aynı kural
  `NEXT_PUBLIC_STATUS_URL`, `NEXT_PUBLIC_BUILD_SHA` ve
  `NEXT_PUBLIC_BUILD_DATE` için de geçerli: bu ARG'lardan biri unutulursa
  ilgili alan üretimde sessizce boş kalıyordu (PR #39'un asıl bulgusu).
- **`HEALTHCHECK` curl/wget değil node'un yerleşik `fetch`'i ile.**
  `node:24-alpine`'da curl yok ve `coollabsio/coolify#7500` tam da curl/wget
  tabanlı health check'lerin connection refused verdiği bug.
- **`npm ci --ignore-scripts` + beş paketin `npm rebuild`'i** (`sharp`,
  `esbuild`, `@swc/core`, `unrs-resolver`, `@parcel/watcher`); aynı desen
  `ci.yml` ve `links.yml`'de de var, install-script yüzeyini daraltıyor.

`.dockerignore` `.local/` dizinini dışlıyor. Bu kritik: klasör gerçek portfolyo
içeriğini barındırıyor ve `.gitignore`'da olması Docker build context'inden
hariç tutulduğu anlamına gelmiyor. `docs`/`*.md` deseni kök seviyeyle sınırlı,
çünkü recursive `**/*.md` Velite'ın ihtiyaç duyduğu `content/**` dosyalarını da
düşürürdü.

### 3. GitHub Actions: kapı, deploy değil

CI image push etmiyor ve Coolify'a deploy tetiklemiyor; Coolify'ın kendi build'i
GitHub App webhook'u üzerinden bundan bağımsız çalışıyor. İki job branch
protection'a bağlı olduğu için adları sabit tutulmalı:

- **`Quality checks`:** `npm ci`, dependency review (PR'larda, high şiddette
  durdurur), `build:content`, lint (`--max-warnings=0`, tipli kurallar),
  typecheck, coverage'lı vitest, `verify:docs`, build, `verify:routes`,
  prettier, `npm audit --omit=dev --audit-level=high`.
- **`Docker image`:** hadolint (digest pinli imaj), gha cache'li Buildx build
  (push yok), sonra imaj çalıştırılıp `Healthcheck` config'inin boş olmadığı
  assert ediliyor, `docker inspect` ile `healthy` bekleniyor ve `/api/health`
  konteynerin dışından bir kez yoklanıyor.

Tüm action'lar commit SHA'sına pinli. `verify:links` merge kapısından çıktı,
`links.yml` haftalık ve `workflow_dispatch` ile koşuyor.

### 4. Env katmanları

Coolify'da Build ve Runtime ayrımı kozmetik değil; karıştırıldığında iki yönde
de sessiz hata üretiyor.

| Değişken | Katman | Neden |
| --- | --- | --- |
| `NEXT_PUBLIC_*` (SITE_URL, BUILD_SHA, BUILD_DATE, STATUS_URL) | Build | `next build` client bundle'a gömüyor; yalnızca Runtime işaretlenirse değer hiç gömülmez |
| `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID` | Build | Layout prerender edildiği için build zamanında gerekli |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Runtime | Sır; Build işaretlenirse imaj katmanlarına ve build loglarına sızar |
| `CONTACT_EMAIL`, `FROM_EMAIL` | Runtime | Yalnızca sunucu tarafında okunuyor |
| `TRUST_CF_CONNECTING_IP` | Runtime | Varsayılan `false`; origin Cloudflare'a kilitlenip doğrulanana kadar açılmaz |
| `CSP_REPORT_ONLY` | Build, geçici | Tek bir ölçüm deploy'u için |

Tam açıklamalar `.env.example` ve README'nin "Ortam değişkenleri" tablosunda.

### 5. Domain ve edge

- **Ana domain `dogancanyildiz.com`, kanonik host `www`.**
  `NEXT_PUBLIC_SITE_URL`, sitemap, robots, JSON-LD kimlikleri ve security.txt
  hepsi www'ye sabit.
- **Apex -> www yönlendirmesi Coolify'da** (karar değişikliği, 2026-09-03,
  ilk canlı deploy): Coolify'ın dahili "Redirect to www" ayarı Traefik'e bir
  label yazıyor ve **307** dönüyor. Cloudflare'daki `apex to www` Redirect
  Rule isteğe bağlı bir edge katmanı: eklenirse istek origin'e hiç düşmeden
  301 ile biter ve kalıcı sinyal verir; iki katman aynı yönde olduğu için
  çakışmaz. Ters kombinasyon ("Redirect to non-www" + edge'de apex to www)
  sonsuz döngü üretir, asla kurulmaz.
- **İkinci alan adı kapsam dışı** (karar 2026-09-03): hiç kaydedilmedi,
  planlanan `301` zinciri ve Traefik'teki `redirectregex` yedeği
  dokümanlardan kaldırıldı ([11-acik-isler.md](./11-acik-isler.md) bölüm 4).
- **Host tabanlı 301 uygulama kodunda çözülmez.** Next.js `redirects()`
  uygulamayı domain bilgisine bağlardı; yönlendirme edge/proxy katmanının işi,
  böylece domain değişse bile uygulama kodu dokunulmadan kalıyor.

### 6. Cloudflare proxied mod

DNS Cloudflare'da ve proxied mod açık, SSL modu Full (strict). Bu altı alt
karara yol açıyor:

- **Gerçek ziyaretçi IP'si `CF-Connecting-IP`'de.** Bu header istemci
  tarafından taklit edilebilir; yalnızca istek doğrulanmış Cloudflare
  aralıklarından geliyorsa güvenilir, o yüzden Traefik entrypoint'inde
  `forwardedHeaders.trustedIPs` Cloudflare listesiyle set edilmeli. Ayar
  yoksa tüm istekler tek bir rate-limit kovasına düşer.
- **Origin yalnızca Cloudflare'dan erişilebilir olmalı.** Origin kısıtı
  2026-09-05'te Hetzner Cloud Firewall ile tamamlandı: 80 ve 443 yalnızca
  Cloudflare IPv4/IPv6 aralıklarından, 22 ve ICMP herkese açık; sunucudan
  bağımsız, ağ kenarında çalışıyor. `DOCKER-USER` zincirine yazılan iptables
  kuralları alternatif bir yol olarak kaldı, kullanılmadı: Coolify'ın
  Traefik'i publish ettiği 80/443 Docker'ın DNAT'ıyla FORWARD zincirine
  giriyor, ufw INPUT'ta çalıştığı için o trafiği hiç görmüyor, dolayısıyla
  ufw tek başına yeterli olmazdı. `TRUST_CF_CONNECTING_IP=true` ancak bu
  adımdan sonra.
- **Traefik router adları uydurulmaz.** Coolify router adlarını uygulama
  UUID'sinden üretiyor (`https-0-<uuid>`, `http-0-<uuid>`); kuralı olmayan bir
  isme yazılan `middlewares` etiketi Traefik tarafından sessizce yok sayılıyor
  (`coollabsio/coolify#9886`), yani HSTS hiç gönderilmeden site yayına çıkar.
- **TLS:** origin sertifikası Traefik'in Let's Encrypt HTTP-01 akışıyla
  kalıyor; Cloudflare proxied modda `/.well-known/acme-challenge` yolunu
  geçiriyor. Cloudflare Origin CA (15 yıl) alternatif olarak not edildi.
- **Cache ve rate limiting:** `_next/static/*` ve statik görseller edge'de
  cache'leniyor; `/api/contact` için ücretsiz planın izin verdiği tek kuralla
  10 saniyede 3 istek. Uygulama içi in-memory limit iç katman olarak aynen
  duruyor.

Panelde tıklanacak adımların tamamı checklist olarak
[deploy/cloudflare-kurulum.md](./deploy/cloudflare-kurulum.md),
[deploy/coolify-kurulum.md](./deploy/coolify-kurulum.md) ve
[deploy/traefik-ve-origin.md](./deploy/traefik-ve-origin.md) dosyalarında;
canlı kurulumun en güncel hali oralarda.

### 7. Health check

Coolify UI'da Healthcheck açıksa Coolify kendi komutunu (önce `curl`, olmazsa
`wget`) konteynerin `healthcheck` tanımı olarak yazıyor ve Dockerfile'daki
`HEALTHCHECK` **eziliyor**, tersi değil. `node:24-alpine`'da curl yok; busybox
`wget` de `localhost:3000`'e connection refused alıyor, çünkü Alpine'da
`localhost` önce `::1`'e çözülüyor ve Next standalone yalnızca `0.0.0.0`
dinliyor. Sonuç, uygulama "Ready" dediği hâlde üç deneme sonunda "unhealthy" ve
iptal edilen rollout. Kullanılan çözüm: UI Healthcheck açık ve **Host
`127.0.0.1`**. İlk başarılı canlı deploy bu ayarla alındı.

### 8. Yedek ve rollback

Coolify'ın tek tıkla rollback'i yalnızca sunucuda duran yerel imajlar üzerinde
çalışıyor; git tabanlı Dockerfile yolu bunu native sağlıyor. GHCR yoluna
ileride geçilirse floating `latest` tag kullanılmamalı, git SHA gibi sabit bir
tag zorunlu (Docker eski katmanları prune ettiğinde geri dönülecek imaj
kalmayabilir). Coolify instance'ının kendi backup/restore mekanizması bu deploy
hattından bağımsız kurulmalı.

## Dallanma ve sürüm akışı

```
feature/*  --PR-->  dev  --PR-->  main  --CI başarılı-->  release.yml
```

`feature/*` dalları `dev`'den açılır, `dev` entegrasyon dalıdır, `main`
yayınlanan durumdur ve yalnızca `dev`'den gelen PR ile ilerler. `ci.yml` her
iki dalda hem `pull_request` hem `push` olaylarında koşar.

`release.yml` `main` üzerindeki CI koşusunun başarıyla bitmesini bekler
(`workflow_run`, `conclusion == success`); `main`'e push tetikleyicisi
2026-08-28'de kaldırıldı, böylece CI'ı bypass eden bir push sürüm üretemiyor.
İş akışı son `v*` tag'ini bulur, aradaki commit'leri Conventional Commits'e
göre sınıflandırır, tag ve GitHub Release üretir, sonra `package.json`,
`package-lock.json` ve `CHANGELOG.md` değişikliğini `main`'e push etmek yerine
`release/sync-vX.Y.Z` dalından `dev`'e bir PR olarak açar.

| Commit tipi | Etki |
| --- | --- |
| `feat` | minor |
| `fix`, `perf`, `refactor` | patch |
| konuda `!:` veya gövdede `BREAKING CHANGE:` | major |
| `chore`, `docs`, `ci`, `test`, `style`, `build` | sürüm yok |

`1.0.0` otomatik bumpla değil, sahibinin `workflow_dispatch` ile `version:
1.0.0` girmesiyle kesilir. Yerelde `npm run release:check` kuru koşu yapar.
Release notlarında ve commit'lerde yapay zeka atfı yok.

**İki bilinen kısıt.** `GITHUB_TOKEN` ile açılan PR başka workflow
tetiklemiyor, bu yüzden sürüm senkron PR'ı check'ler olmadan açılıyor; bir kez
kapatıp açmak veya boş commit atmak tetikliyor. Ayrıca Settings > Actions >
"Allow GitHub Actions to create and approve pull requests" kapalıysa senkron PR
adımı 403 ile düşüyor (v0.2.0'da tam bu oldu, PR elle açıldı).

### Depo ayarları

Varsayılan dal `dev`; `main` ve `dev` korumalı: PR zorunlu, `Quality checks`,
`Docker image` ve `CodeQL analysis` kontrolleri güncel dal üzerinde yeşil
olmalı, force push ve dal silme kapalı. Workflow varsayılan token'ı salt
okunur; iş akışları ihtiyaç duydukları izni kendi `permissions` bloğunda
istiyor. `release.yml`'in tag push edebilmesi için tag koruması eklenmemeli,
eklenirse `github-actions[bot]` muaf tutulmalı.

## Riskler ve tripwire'lar

- **`output: "standalone"` eksikse** Dockerfile'ın runner aşaması
  `.next/standalone`'u bulamaz.
- **Turbopack + standalone regresyonu** (vercel/next.js#88844):
  `serverExternalPackages` trace edilmiyor. Dockerfile'a harici bir native
  paket eklenirse `next build --webpack` fallback'i akılda tutulmalı.
- **Docker build cache eviction (~48 saat):** sık deploy edilmezse cache
  sıfırlanıp build süresi uzayabilir; hata değil, beklenen yavaşlama.
- **Coolify UI ayarları Dockerfile'ı eziyor** (health check bölümü). Aynı
  şekilde Traefik label'ları eklemeden önce "Readonly labels" kapatılmalı,
  aksi halde elle eklenen middleware'ler UI tarafından eziliyor; Coolify'ın
  ürettiği label'lar silinmez.
- **SSL modu yanlışlıkla Flexible bırakılırsa** Cloudflare ile origin arası
  düz HTTP'ye düşer.
- **Job adları branch protection'a bağlı;** yeniden adlandırmak korumayı
  sessizce boşa düşürür.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](./00-ozet-ve-karar.md)
- [05-backend-icerik-ve-servisler.md](./05-backend-icerik-ve-servisler.md) - rate limit ve `CF-Connecting-IP` kullanımı
- [09-guvenlik.md](./09-guvenlik.md) - güvenlik başlıkları, origin kilidi, bakım otomasyonu
- [deploy/](./deploy/) - Coolify, Cloudflare, Traefik ve Mailcow panel checklist'leri
- [runbooks/infrastructure.md](./runbooks/infrastructure.md) - Uptime Kuma, merkezi Umami, env tablosu
- [11-acik-isler.md](./11-acik-isler.md)

## Kaynaklar

- https://coolify.io/docs/applications/build-packs/overview
- https://coolify.io/docs/applications/ci-cd/github/preview-deploy
- https://coolify.io/docs/knowledge-base/health-checks
- https://github.com/coollabsio/coolify/issues/7500
- https://coolify.io/docs/knowledge-base/environment-variables
- https://coolify.io/docs/knowledge-base/proxy/traefik/custom-middlewares
- https://developers.cloudflare.com/rules/url-forwarding/
- https://www.cloudflare.com/ips/
- https://doc.traefik.io/traefik/routing/entrypoints/#forwarded-headers
- https://github.com/vercel/next.js/tree/canary/examples/with-docker
- https://github.com/vercel/next.js/issues/88844
