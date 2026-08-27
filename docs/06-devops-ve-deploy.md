# DevOps, Docker, Coolify ve Deploy Hattı

Durum: Kısmen uygulandı: kod ve checklist'ler (Faz 1, PR #3), panel adımları sahibinde · Karar: 2026-08-27 · Güncelleme: 2026-08-27 · Kapsam: dogancanyildiz.com

## Özet

Repo şu an Docker'a hiç hazır değil: Dockerfile, .dockerignore, .github/workflows ve health-check route'u yok, next.config.ts boş bir NextConfig nesnesi (bkz. [01-mevcut-durum-denetimi.md](01-mevcut-durum-denetimi.md)). Bu doküman yayın hattını sıfırdan tanımlıyor: Coolify'ın GitHub App'i üzerinden git tabanlı Dockerfile build pack'i, çok aşamalı bir Dockerfile (deps, builder, runner), yalnızca PR kapısı olarak çalışan bir GitHub Actions workflow'u ve Cloudflare edge'inde tanımlanan dogancanyildiz.sh -> dogancanyildiz.com 301 yönlendirmesi (Traefik'teki karşılığı yalnızca yedek yol, bkz. bölüm 7-8). Karar, PR başına önizleme URL'i isteğinin Coolify'da yalnızca GitHub App + git tabanlı build ile çalışması (Deploy Key veya GHCR pull ile çalışmıyor) üzerine kuruluyor; bu tek koşul tek başına dört build yolundan birini eliyor. Health check ve rolling update tarafında bilinen, kapanmamış bir Coolify bug'ı (coollabsio/coolify#7500) var ve staging'de ayrıca doğrulanması gerekiyor. Sunucunun RAM/CPU kapasitesi yeterli olduğu ve darboğaz olmadığı site sahibi tarafından 2026-08-27'de doğrulandı (bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 7); build doğrudan sunucu üstünde alınıyor, GHCR pull yolu yalnızca ileride bir yükseltme kapısı olarak dokümante kalıyor.

## Kararlar

### 1. Build yolu: Coolify GitHub App + git tabanlı Dockerfile build pack

| Yol | Build nerede çalışır | PR Preview Deployment | Zero-downtime rolling update | Fit skoru | Durum |
|---|---|---|---|---|---|
| Dockerfile (git tabanlı) | VPS üzerinde, Coolify | Var (GitHub App zorunlu) | Var (dört koşulu karşılıyor) | 9/10 | **Seçildi** |
| GHCR image + Coolify pull | GitHub-hosted runner | Yok, native desteklenmiyor | Var | 6.5/10 | Gelecekteki yükseltme kapısı |
| Nixpacks | VPS üzerinde, Coolify | Var | Var | 4/10 | Önerilmiyor |
| docker-compose | VPS üzerinde, Coolify | Var ama elle etiketleme fazla | Yok, compose rolling update'i tamamen devre dışı bırakıyor | 3/10 | Önerilmiyor (bu app için) |

Preview Deployments Coolify'da yalnızca GitHub App entegrasyonu ve git tabanlı build ile çalışıyor; Deploy Key bu özelliği desteklemiyor. Kapsamda PR önizleme URL'i istendiği için bu tek koşul GHCR pull yolunu bugün için eler. docker-compose Coolify'da zero-downtime mekanizmasının dört koşulundan birini (compose olmaması) yapısal olarak karşılayamıyor; tek servisli bir portfolyo sitesinde hiçbir kazanç sağlamadan her deploy'da kısa kesinti riski ekliyor. Nixpacks'i üreten Railway artık aktif geliştirmediğini belirtmiş durumda, halefi Railpack Coolify v4.1.0+'da hâlâ beta; Next.js standalone çıktısının gerektirdiği .next/standalone + .next/static + public kopya deseni üzerinde Nixpacks'in ince kontrolü de yok. Hedef Coolify sürümü v4.3.1 (12 Ağustos 2026, stabil); v4.4-rc.1 (19 Ağustos 2026) OIDC ve token yönetimi getiriyor ama aday sürüm olduğu için üretime bağlanmıyor.

### 2. Dockerfile: deps -> builder -> runner

```dockerfile
# 1) deps: bağımlılıkları izole katmanda kur, cache dostu
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) builder: içerik derlemesi + Next.js build
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx velite build
RUN npm run build

# 3) runner: yalnızca standalone çıktısı, non-root kullanıcı
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

node:24-alpine tercih edildi çünkü .nvmrc ve package.json engines.node ile Faz 0'da zaten Node 24'e pinleniyor (bkz. [02-stack-karari.md](02-stack-karari.md)). `velite build` adımı builder aşamasında `next build`'den önce çalışmak zorunda; ya package.json'da bir `prebuild` script'i (`"prebuild": "velite build"`) olarak ya da Dockerfile'da ayrı bir RUN satırı olarak eklenebilir, ikisi de eşdeğer. runner aşaması sadece .next/standalone, .next/static ve public'i chown ile non-root kullanıcıya kopyalıyor; CMD `node server.js`, `npm start` değil, çünkü standalone çıktısı kendi server.js'ini üretiyor ve npm'i image'a dahil etmeye gerek kalmıyor.

### 3. .dockerignore

```
node_modules
.next
.git
.github
.claude
.local
.nodeterm
.env
.env.*
*.md
tsconfig.tsbuildinfo
```

`.local/` dahil edilmesi kritik: bu klasör gerçek portfolyo içeriğini barındırıyor (.local/content/portfolio-content.md) ve .gitignore ile git'ten hariç tutulmuş olması Docker build context'inden hariç tutulduğu anlamına gelmiyor; .dockerignore olmadan bu dosya image katmanlarına sızabilir.

### 4. next.config.ts eklemeleri

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

`output: "standalone"` olmadan Dockerfile'ın runner aşaması .next/standalone klasörünü bulamaz; build ya başarısız olur ya da yanlış (tüm node_modules'ü taşıyan, şişkin) bir çıktı kopyalanır. CSP dahil tam güvenlik başlığı seti burada tekrar edilmiyor, ayrıntı için [09-guvenlik.md](09-guvenlik.md). **Not**: Turbopack + standalone output kombinasyonunda serverExternalPackages'ın trace edilmediği açık bir regresyon var (vercel/next.js#88844); bugün bu projeyi ısırmıyor ama Dockerfile'a ileride harici bir paket (örn. bir native binding) eklenirse .next/standalone/node_modules içinde o paket eksik çıkabilir, bu durumda `next build --webpack`'e geçiş denenmeli.

### 5. GitHub Actions: yalnızca PR kapısı

```yaml
name: ci

on:
  pull_request:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
```

Bu workflow image push etmiyor ve Coolify'a deploy tetiklemiyor; tek işi lint + `tsc --noEmit` + `next build`'i PR üzerinde zorunlu bir check olarak çalıştırmak. Coolify'ın kendi build'i (GitHub App webhook'u üzerinden) bundan tamamen bağımsız çalışıyor; bu iki katman Coolify'ın build'inde bir sorun çıkarsa bile PR aşamasında erken bir hata yakalama sağlıyor. `typecheck` script'i package.json'a Faz 0'da eklenmesi gereken bir öğe (bkz. [10-yol-haritasi.md](10-yol-haritasi.md)).

### 6. Coolify ayarları

- **GitHub App**: repoya bağlanır, Pull Requests + Checks + Deployments için Read & Write izni gerekir; bu izin olmadan Preview Deployments çalışmıyor.
- **Auto-deploy**: main'e her push webhook üzerinden otomatik redeploy tetikliyor, ek yapılandırma gerekmiyor.
- **Preview Deployments**: PR başına ayrı URL + PR'a otomatik yorum; yalnızca GitHub App + git tabanlı build ile çalışıyor.
- **Health check**: `/api/health` route'una bağlanır (Faz 0'da eklenecek basit `NextResponse.json({ status: "ok" })` handler'ı). Dockerfile'da bir `HEALTHCHECK` tanımlanırsa Coolify UI ayarını ezer. **Bilinen bug**: coollabsio/coolify#7500, Dockerfile ile build edilen Node.js container'larında curl/wget'in connection refused vermesiyle ilgili, GitHub'da hâlâ açık. Production'a almadan önce staging'de curl/wget'in container içinden gerçekten çalıştığı ve start-period'un yeterli olduğu elle doğrulanmalı; aksi halde rolling update sürekli unhealthy görüp yeni deploy'ları geri alabilir.
- **Rolling update (zero-downtime)**: dört koşula bağlı, hepsi birden sağlanmalı: (1) health check geçiyor, (2) varsayılan konteyner isimleri kullanılıyor, (3) host port mapping yok, (4) compose build pack kullanılmıyor. Seçilen yol (git tabanlı Dockerfile) bu dört koşulu yapısal olarak karşılıyor.
- **Env değişkenleri (Build/Runtime ayrımı)**:

| Değişken | Build/Runtime | Gerekçe |
|---|---|---|
| NEXT_PUBLIC_SITE_URL | Build | `next build` sırasında client bundle'a gömülüyor; yalnızca Runtime işaretlenirse üretimde sessizce undefined kalır |
| RESEND_API_KEY | Runtime | Sır; Build işaretlenirse image katmanlarına veya build loglarına sızma riski taşır |
| CONTACT_EMAIL | Runtime | Yalnızca server route'ta (contact API) okunuyor, client'a hiç gitmiyor |
| FROM_EMAIL | Runtime | Aynı gerekçe |
| TRUST_CF_CONNECTING_IP | Runtime | `false` (varsayılan, `.env.example`'da uygulandı); origin Cloudflare'a kilitlenip (yukarıdaki DOCKER-USER adımı) doğrulanana kadar `CF-Connecting-IP` okunmuyor, rate limit `X-Forwarded-For`'un son hop'una düşüyor |
| GATUS_URL | Runtime | Status widget verisi sunucu tarafında çekiliyor, client'a URL sızmıyor; `.env.example`'da tanımlı ama boş, Gatus Faz 5'te kuruluyor |

### 7. Traefik: redirect (yedek yol), HSTS/compress, buffering

**Karar değişikliği (2026-08-27):** ana domain artık dogancanyildiz.com, dogancanyildiz.sh 301 ile ona yönlenir. Tarihsel karar metni bu yönün tersini (dogancanyildiz.sh ana domain, .com 301) tarif ediyordu; aşağıdaki middleware/router adları ve regex örnekleri sahibinin son kararına göre güncellendi.

Bu bölümdeki redirectregex artık ana yönlendirme yolu değil. Ana yol Cloudflare Redirect Rules'tır (bölüm 8a); aşağıdaki Traefik middleware'i yalnızca Cloudflare proxied modu bir nedenle devre dışı kalırsa (ör. geçici DNS-only geçişi) devreye giren bir yedek olarak Coolify'da tanımlı tutuluyor, günlük akışta tetiklenmiyor.

```
# dogancanyildiz.sh -> dogancanyildiz.com, tek atlama, dil prefix'ine dokunmadan (yedek yol)
traefik.http.middlewares.redirect-to-com.redirectregex.regex=^https://dogancanyildiz\.sh/(.*)
traefik.http.middlewares.redirect-to-com.redirectregex.replacement=https://dogancanyildiz.com/$${1}
traefik.http.middlewares.redirect-to-com.redirectregex.permanent=true

traefik.http.routers.redirect-sh.rule=Host(`dogancanyildiz.sh`)
traefik.http.routers.redirect-sh.middlewares=redirect-to-com
traefik.http.routers.redirect-sh.tls.certresolver=letsencrypt

# HSTS + sıkıştırma, Coolify'da "Readonly labels" kapatılıp eklenir
traefik.http.middlewares.security-headers.headers.stsSeconds=31536000
traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true
traefik.http.middlewares.compress.compress=true
```

Bu 301 (yedek yolda), hedefi doğrudan `https://dogancanyildiz.com/$1` yapıyor, `/en`'e değil; yanlış sırayla kurulursa sh -> com -> com/en gibi zincirli bir redirect oluşur ve bu SEO'ya zarar verir, aynı yasak Cloudflare Redirect Rules için de geçerli (bölüm 8a). dogancanyildiz.com apex ile www arasındaki yönlendirme Coolify'ın dahili www/non-www ayarıyla değil, yine Cloudflare Redirect Rules'ta tek yerden çözülüyor (bkz. bölüm 8a); dogancanyildiz.sh apex ve www kayıtları origin'e hiç ulaşmaz, yalnızca Cloudflare'da proxied birer kayıt olarak durur ve edge'de .com'a yönlenir. Cross-domain 301 için Coolify'da böyle bir ayar yok, docs'tan doğrulanan redirectregex + ayrı router/TLS deseni gerekiyor (yalnızca yedek yol olarak). compress middleware'i gzip/brotli/zstd'yi Accept-Encoding ile negotiate ediyor. React'ın streaming SSR yanıtlarını Traefik'in buffering middleware'i (mem/maxResponseBodyBytes) geciktirebiliyor; bu middleware ana router'a eklenmeden bırakılıyor, gerekirse staging'de streaming davranışı gözlemlenip ayarlanacak.

### 8. DNS/Cloudflare: proxied mod açık

Sunucu kendi statik IP'sine sahip ve NAT arkasında değil; Coolify, Traefik ile 80/443'ü doğrudan dinliyor. DNS Cloudflare'da yönetiliyor ve **proxied mod (turuncu bulut) açık** tutuluyor; SSL modu Full (strict), site sahibinin diğer projelerinde zaten kullandığı ayarla aynı (bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 8, 2026-08-27 cevabı). Bu, önceki "DNS-only, proxied kapalı" varsayımını tersine çeviriyor ve aşağıdaki sekiz alt karara yol açıyor.

**a) Domain yönlendirmesi Cloudflare Redirect Rules'ta.** **Karar değişikliği (2026-08-27):** ana domain artık dogancanyildiz.com; tarihsel karar metni ".sh ana domain, .com 301" idi, sahibinin son kararıyla yönü tersine döndü. `dogancanyildiz.sh -> dogancanyildiz.com` 301'i Traefik'te değil, Cloudflare edge'inde **Redirect Rules** ile tanımlanıyor: tek atlama, path korunuyor (`https://dogancanyildiz.com/${path}`), www dahil. Aynı Redirect Rules katmanı `www.dogancanyildiz.com -> dogancanyildiz.com` apex yönlendirmesini de tek yerden çözüyor; Coolify'ın dahili www/non-www ayarı bunun için kullanılmıyor. Traefik'teki redirectregex (bölüm 7) artık ana yol değil, yalnızca Cloudflare devre dışı kalırsa devreye giren bir yedek. Zincir redirect yasağı (`.sh -> .com -> .com/tr` gibi üçüncü bir atlama olmaması) burada da aynen geçerli.

**b) Gerçek ziyaretçi IP'si `CF-Connecting-IP` header'ından.** Proxied modda Traefik'in gördüğü bağlantı IP'si Cloudflare'ın edge IP'sidir, gerçek ziyaretçi IP'si `CF-Connecting-IP` header'ında gelir. Bu header **yalnızca** istek gerçekten Cloudflare IP aralıklarından geliyorsa güvenilir; bu yüzden Traefik entrypoint'inde `forwardedHeaders.trustedIPs`, Cloudflare'ın yayınladığı IPv4/IPv6 listesiyle set edilir (Coolify'da proxy config üzerinden). Contact formunun rate limit anahtarı bu doğrulanmış IP olur (detay: [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)); `trustedIPs` set edilmezse tüm istekler Cloudflare'ın kendi IP'sinden geliyormuş gibi görünür ve tek bir rate-limit kovasına düşer, meşru ziyaretçiler birbirine karışır.

**c) TLS: Cloudflare <-> origin arası Full (strict).** Origin sertifikası Traefik'in Let's Encrypt HTTP-01 akışıyla devam eder; Cloudflare proxied modda `/.well-known/acme-challenge` yolunu geçiriyor, "Always Use HTTPS" ayarı bu yolu engellemiyor. Alternatif olarak Cloudflare Origin CA sertifikası (15 yıl geçerli) not ediliyor; bugün gerekli değil, Let's Encrypt zaten yeterli.

**d) Ek katmanlar (ücretsiz plan).** Cloudflare cache'i `_next/static/*` ve `public/` altındaki görseller için açılıyor (Next zaten immutable cache header'ı veriyor, Cloudflare bunu edge'de tekrar cache'liyor); `/api/contact` için Cloudflare Rate Limiting kuralı dış katman olarak ekleniyor, uygulama içi in-memory limit iç katman olarak aynen kalıyor (detay: [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)); Bot Fight Mode açık. HSTS Cloudflare'dan da açılabilir ama tek yerden yönetiliyor: Traefik/Next `headers()`; Cloudflare'da ayrıca tanımlanmıyor, çift tanım tutarsızlık riski taşır.

**e) Origin'e doğrudan erişim kapatılır (önerilir, Faz 1).** Sunucu güvenlik duvarı (ufw) veya Traefik `ipAllowList` ile origin yalnızca Cloudflare IP aralıklarından erişilebilir kılınır; böylece `.com`'a IP üzerinden doğrudan bağlanıp Cloudflare'ı bypass etmek mümkün olmaz. Zorunlu değil ama güçlü tavsiye olarak Faz 1'e ekleniyor.

**f) Turnstile: bağımlılık maliyeti düştü, hâlâ ertelendi.** Cloudflare zaten proxied mod ile bir bağımlılık olduğu için Turnstile eklemenin ek maliyeti önemli ölçüde düştü. Yine de YAGNI gereği şimdi eklenmiyor; ama "gerçek spam görülürse ilk adım Turnstile" notu bu kararla güçleniyor, çünkü altyapı zaten hazır (detay: [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)).

**g) HTTP/3 ve Brotli: Traefik'te açmaya gerek yok.** Cloudflare proxied modda HTTP/3 ve Brotli zaten edge'de sağlanıyor; Traefik static config'inde bunları ayrıca açma konusu "gerekmez" olarak kapatılıyor.

**h) Yan servisler de Cloudflare proxied alt domain'lerde.** Umami ve Gatus gibi yan servisler (ör. `status.dogancanyildiz.com`) Cloudflare proxied alt domain'ler üzerinden çalışır. Gatus'un public gösterilecek endpoint'leri yine yalnızca sunucu tarafında okunur, client'a hiçbir zaman doğrudan Gatus URL'i sızmaz (detay: [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md), [09-guvenlik.md](09-guvenlik.md)).

### 9. Yedek/rollback

Coolify'ın tek tıkla rollback özelliği yalnızca sunucuda halihazırda duran local image'lar üzerinde çalışıyor; seçilen git tabanlı Dockerfile yolu bunu native sağlıyor. Coolify instance'ının kendisinin de ayrı bir backup/restore mekanizması var (bkz. Kaynaklar), bu deploy hattından bağımsız olarak kurulmalı. GHCR pull yoluna ileride geçilirse floating `latest` tag kullanılmamalı; Coolify rollback'i yalnızca sunucudaki local image'ları gördüğünden, Docker eski katmanları prune ettiğinde geri dönülecek imaj kalmayabilir, bu yüzden git SHA gibi sabit tag zorunlu.

## Gerekçe

Bu setin merkezinde tek bir zorunlu koşul var: PR önizlemesi. Coolify'da bu özellik GitHub App + git tabanlı build dışında hiçbir yolla çalışmıyor, dolayısıyla GHCR pull ve docker-compose otomatik olarak ikincil konuma düşüyor; ikisi de kendi başına savunulabilir yollar ama bu proje için "bugün gerekli" değil. Next.js standalone çıktısının kopyalama deseni (`.next/standalone` + `.next/static` + `public`, `node server.js`) sabit ve iyi belgelenmiş olduğundan, Nixpacks'in oto-algılamasının kazandırdığı zaman marjinal kalıyor; buna karşılık Nixpacks'in üretici tarafından aktif geliştirilmediği ilan edilmiş olması uzun vadeli üretim bağımlılığı olarak risk taşıyor. Health check ve rolling update tarafında ihtiyat payı bırakılmasının nedeni somut: Dockerfile HEALTHCHECK önceliği ile birlikte Node.js container'larında bilinen, kapanmamış bir bağlantı-reddi bug'ı var, bu yüzden "health check bağlı otomatik rollback" varsayımı staging'de doğrulanmadan production'a taşınmıyor. Env değişken ayrımı, repodaki somut resend bağımlılığı ve olası NEXT_PUBLIC_* kullanımıyla doğrudan ilişkili; yanlış taraf seçilirse biri sır sızdırır, diğeri sessizce çalışmaz. Cross-domain redirect'in uygulama kodunda değil edge katmanında (birincil: Cloudflare Redirect Rules, yedek: Traefik) yapılması, uygulamanın iki domain adını da bilmek zorunda kalmaması ve gelecekte domain değişse bile app kodunun dokunulmadan kalması için.

## Reddedilen alternatifler

| Alternatif | Neden reddedildi |
|---|---|
| GHCR image + Coolify pull (bugün) | PR Preview Deployments'ı native desteklemiyor; VPS build yükünü azaltma avantajı bugünkü ölçekte gerekli değil. Gelecekteki yükseltme kapısı olarak tutuluyor. |
| Nixpacks | Üreticisi (Railway) aktif geliştirmediğini ilan etti; halefi Railpack hâlâ beta. Next.js standalone kopyalama deseni üzerinde ince kontrol sağlamıyor. |
| docker-compose build pack | Coolify'da zero-downtime rolling update'i tamamen devre dışı bırakıyor; tek servisli bir sitede kazanç yok, downtime riski var. Yeri: Gatus/Umami gibi yan servisleri ayrı bir resource olarak çalıştırmak. |
| 301'i Next.js `redirects()` içinde çözmek | Uygulamayı domain bilgisine bağlar; cross-domain yönlendirme edge/proxy katmanının işi, app kodunun değil. |
| DNS-only (gri bulut) modda kalmak | Site sahibi diğer projelerinde zaten Full (strict) + proxied kullanıyor; DDoS/cache/Bot Fight Mode avantajlarından vazgeçmenin gerekçesi kalmadı. CF-Connecting-IP + Traefik `trustedIPs` ile gerçek client IP sorunu da çözülüyor (bölüm 8b). |
| Traefik'te HTTP/3'ü ayrıca açmak | Cloudflare proxied modda HTTP/3 ve Brotli zaten edge'de sağlanıyor (bölüm 8g); Traefik'te tekrar açmanın getirisi yok. |

## Uygulama durumu (2026-08-27)

**Kod (Faz 1, PR #3, ana dala merge).** Dockerfile kararda tarif edilen deps -> builder -> runner sırasını `node:24-alpine` ile uyguluyor; küçük sapmalar var: `deps` aşaması `npm ci --no-audit --no-fund` kullanıyor, `builder` aşaması `NEXT_PUBLIC_SITE_URL`'i `ARG`/`ENV` ile alıyor ve **varsayılansız** bırakıyor (unutulan bir build argümanı `siteUrl()` içinde patlıyor, prod URL'in sessizce preview image'a gömülmesini önlüyor), `runner` aşaması node image'ının hazır `node` kullanıcısını kullanıyor (kararda tarif edilen `addgroup`/`adduser` yerine, aynı non-root sonucu daha az satırla veriyor). `HEALTHCHECK` kararda yoktu, sonradan eklendi: `curl`/`wget` değil **node'un yerleşik `fetch`'i** ile `/api/health`'i çağırıyor, çünkü `node:24-alpine`'da `curl` hiç yok ve `coollabsio/coolify#7500` tam da curl/wget tabanlı health check'lerin connection refused verdiği bug. `.dockerignore` kararda listelenenin ötesinde `coverage`, `.superpowers`, `.vscode`, `.idea`, `tsconfig.tsbuildinfo`, `.velite` ve `public/static`'i de kapsıyor; `docs`/`*.md` deseni kök seviyeyle sınırlı tutuluyor (yorum: recursive `**/*.md` `content/**/*.md`'yi de düşürür, Velite'ın Faz 4'te ihtiyaç duyduğu dosyalar). `.github/workflows/ci.yml` kararda "yalnızca PR kapısı" olarak tarif edilmişti; uygulamada iki job var: `checks` (`actions/checkout@v7`, `actions/setup-node@v7`, `npm run build:content` + lint + typecheck + test + build + `verify:routes`, hem `pull_request` hem main'e `push`'ta çalışıyor) ve `docker` (hadolint + `docker build`, image push yok): kararda geçmeyen bir genişleme, ama "image push yok, Coolify'a deploy tetiklemiyor" ilkesi korundu. `docker-compose.yml` yalnızca yerel doğrulama için, Coolify onu kullanmıyor (yorum satırında açıkça belirtilmiş).

**Karar değişikliği: ufw yerine DOCKER-USER.** `docs/deploy/traefik-ve-origin.md` bölüm 5'te net gerekçelendirilmiş: ufw kuralları INPUT zincirinde çalışıyor, Coolify'ın Traefik'i publish ettiği 80/443 Docker'ın DNAT'ıyla doğrudan FORWARD zincirine giriyor, ufw bu trafiği hiç görmüyor. Origin kilidi bu yüzden iki parçalı: ufw yalnızca host servislerini (SSH, publish edilmemiş portlar) kapatıyor, asıl origin kısıtı `DOCKER-USER` zincirine `-I` (başa ekleme, `-A` değil, çünkü zincirin varsayılanı tek bir `RETURN`) ile yazılan iptables/ip6tables kurallarıyla yapılıyor (Cloudflare IPv4/IPv6 blokları + admin IP allowlist + DROP). Bu adım henüz sunucuda uygulanmadı, `docs/deploy/traefik-ve-origin.md` bir checklist olarak duruyor.

**Traefik router adı bağlama.** Coolify router adlarını `traefik.http.routers.https-0-<uuid>` / `http-0-<uuid>` şeklinde uygulama UUID'sinden üretiyor; `portfolio` gibi sabit bir router adı hiç oluşmuyor. Kuralı olmayan bir isme yazılan `middlewares` etiketi Traefik tarafından sessizce yok sayılıyor (`coollabsio/coolify#9886`), bu yüzden HSTS/compress etiketleri Custom Labels alanındaki gerçek `<uuid>`'den kopyalanarak eklenmeli, uydurulmamalı. Bu da henüz panelde uygulanmadı.

**Cloudflare (kod değil, panel checklist, `docs/deploy/cloudflare-kurulum.md`).** Rate limiting kuralı ücretsiz planın sert sınırlarına göre netleşti: `/api/contact` yoluna **3 istek / 10 saniye**, `Block` aksiyonu 10 saniye (ücretsiz planda periyot/timeout üst sınırı zaten 10 sn, HTTP metoduna göre filtre yok). PR preview'ları (`*.preview.dogancanyildiz.com`) **DNS-only (gri bulut)** kalıyor çünkü ücretsiz planda wildcard DNS kaydı proxy'lenemiyor; bu yüzden yalnızca origin firewall'unda allowlist'e alınmış admin IP'sinden, TLS'siz `http` üzerinden erişilebiliyor. Panel adımları (DNS kayıtları, Redirect Rules, rate limiting kuralı, Bot Fight Mode) henüz Cloudflare'da uygulanmadı, doküman bir checklist.

**`FROM_EMAIL`**: `.env.example`'da `contact@dogancanyildiz.com` olarak set, alıcı (`CONTACT_EMAIL`) de `me@dogancanyildiz.com`. **Karar değişikliği (2026-08-27):** ana domain .com olduğu için gönderen ve alıcı artık aynı domain'de; kararda tarif edilen eski ayrım (gönderen yeni .sh domaini, alıcı eski .com) sahibinin son kararıyla geçersiz kaldı.

**Panel adımları henüz uygulanmadı.** Coolify GitHub App kurulumu, Preview Deployments, health check bağlama, rolling update doğrulaması, DNS/Cloudflare kayıtları, origin kilidi (yukarıdaki DOCKER-USER): hepsi `docs/plans/handoffs/faz-1-manual-checklist.md`'de sahibinin manuel listesi olarak duruyor, kod tarafı (Dockerfile/CI/compose/docs) tamamlandı ama sunucuda/Coolify panelinde/Cloudflare panelinde henüz koşulmadı.

## Riskler ve tripwire'lar

- **next.config.ts'de output: "standalone" eksikse**: Dockerfile .next/standalone klasörünü bulamaz, build başarısız olur ya da yanlış (şişkin) çıktı kopyalanır. Faz 0'da bu değişiklik Dockerfile'dan önce yapılmalı.
- **coollabsio/coolify#7500**: Dockerfile HEALTHCHECK + Node.js container'larında connection refused üreten, hâlâ açık bir bug. Staging'de curl/wget ile doğrulanmadan production health check'e güvenilmemeli; aksi halde rolling update sürekli unhealthy görüp yeni deploy'ları geri alabilir veya downtime yaratabilir.
- **RESEND_API_KEY yanlışlıkla Build variable işaretlenirse**: image katmanlarına veya build loglarına sızabilir.
- **NEXT_PUBLIC_* değişkenleri yalnızca Runtime işaretlenirse**: `next build` sırasında client bundle'a hiç gömülmez, üretimde sessizce undefined dolaşır.
- **Turbopack + standalone regresyonu (vercel/next.js#88844)**: serverExternalPackages trace edilmiyor. Dockerfile'a harici bir native paket eklenirse .next/standalone/node_modules'te eksik çıkabilir; `next build --webpack` fallback'i akılda tutulmalı.
- **Docker build cache eviction (~48 saat)**: sık deploy edilmezse cache sıfırlanıp build süresi uzayabilir; bu bir hata değil ama beklenen bir yavaşlama.
- **GHCR yoluna geçilirse floating `latest` tag**: Coolify rollback'i yalnızca local image üzerinden çalıştığından, prune sonrası geri dönülecek imaj kalmayabilir. O yola geçilirse git SHA tag zorunlu.
- **Cloudflare proxied modda `trustedIPs`/SSL mode yanlış kurulursa**: `forwardedHeaders.trustedIPs` set edilmezse Traefik gerçek ziyaretçi IP'sini Cloudflare edge IP'si sanır, contact formunun rate limit'i tüm istekleri tek kovada toplar; SSL modu yanlışlıkla Full (strict) yerine Flexible bırakılırsa Cloudflare ile origin arası düz HTTP'ye düşebilir. Faz 1'de bu iki ayar elle doğrulanmalı.
- **Sunucu RAM/CPU: geçerli değil.** Sahibi 2026-08-27'de sunucunun RAM/CPU açısından yeterli olduğunu ve darboğaz olmadığını doğruladı; build doğrudan sunucu üstünde (git tabanlı Dockerfile) sorunsuz alınabilir, ayrı bir build sunucusu veya erken GHCR geçişi gerekmiyor. Bkz. [11-acik-sorular.md](11-acik-sorular.md) soru 7.

## Uygulama notları

- Dosya sırası önemli: önce `next.config.ts`'e `output: "standalone"` eklenir (Faz 0), sonra Dockerfile/.dockerignore/GitHub Actions eklenir (Faz 1). Tersi sırayla Dockerfile ilk denemede başarısız olur.
- `.github/workflows/ci.yml` 2026-08-27'den beri `dev` ve `main` için hem `pull_request` hem `push` olaylarında koşuyor (bkz. aşağıdaki "Dallanma ve sürüm akışı"); yukarıdaki 5. karardaki "yalnızca PR kapısı" başlığı o tarihten öncesini anlatıyor. Coolify'ın kendi build'i bundan bağımsız çalışmayı sürdürüyor.
- Health check route'u (`src/app/api/health/route.ts`) Faz 0'da, Dockerfile'dan önce eklenmeli ki Coolify'da health check ayarı Faz 1'de doğrudan bağlanabilsin.
- Traefik label'larını eklemeden önce Coolify'da "Readonly labels" kapatılmalı, aksi halde elle eklenen middleware'ler UI tarafından ezilir.
- Detaylı faz sıralaması için bkz. [10-yol-haritasi.md](10-yol-haritasi.md) (Faz 0: Güvenlik ve hijyen, Faz 1: Deploy hattı).

## Dallanma ve sürüm akışı (2026-08-27)

Sahibi 2026-08-27'de ana domaini `dogancanyildiz.com` olarak sabitledi ve
dallanmayı üç kademeye ayırdı. `dogancanyildiz.sh` yalnızca 301 ile .com'a
yönlenen ikincil domain olarak duruyor.

### Dal hiyerarşisi

```
feature/*  --PR-->  dev  --PR-->  main  --push-->  release.yml
```

- **feature/\***: tek bir iş için açılır, tabanı `dev`'dir.
- **dev**: entegrasyon dalı. Bütün feature PR'ları buraya iner, CI burada da
  zorunlu koşar.
- **main**: yayınlanan durum. Yalnızca `dev`'den gelen PR ile ilerler.
- `main`'e her merge `release.yml`'i tetikler: tag, GitHub Release ve `dev`'e
  geri dönen sürüm senkron PR'ı.

`.github/workflows/ci.yml` artık hem `dev` hem `main` için `pull_request` ve
`push` olaylarında koşuyor; iki job adı (`lint, typecheck, test, build` ve
`hadolint and image build`) branch protection'a bağlandığı için sabit
tutulmalı, yeniden adlandırmak korumayı sessizce boşa düşürür.

### release.yml ne yapıyor

`.github/workflows/release.yml`, `main`'e push ve `workflow_dispatch` ile
çalışır. `workflow_dispatch` isteğe bağlı bir `version` girdisi alır; 1.0.0
gibi bir sürümü sahibi bu girdiyle elle keser.

1. `actions/checkout@v7` ile `fetch-depth: 0`, tüm geçmiş ve tag'ler alınır.
2. `actions/setup-node@v7`, `.nvmrc` (Node 24).
3. `scripts/release-version.mjs` son `v*` tag'ini bulur (yoksa taban
   `package.json`'daki 0.1.0), o tag'den beri gelen commit'leri Conventional
   Commits'e göre sınıflandırır ve sonraki sürümü JSON olarak yazar.
4. Sürüm çıkıyorsa annotated tag `main`'in HEAD'ine atılır ve push edilir.
5. `gh release create vX.Y.Z --title vX.Y.Z --notes-file` ile Release yayınlanır;
   notlar Features / Fixes / Other başlıkları altında kısa sha ve commit mesajı
   ile gruplanır, sonunda karşılaştırma linki durur.
6. `package.json`, `package-lock.json` ve `CHANGELOG.md` güncellenir, ama
   `main`'e doğrudan push edilmez: `release/sync-vX.Y.Z` dalından `dev`'e
   `chore(release): sync version vX.Y.Z` başlıklı bir PR açılır. Böylece `main`
   korumalı kalır, sürüm bilgisi bir sonraki `dev -> main` PR'ı ile geri döner.

Git kimliği `github-actions[bot]`. Notlarda ve commit'lerde yapay zeka atfı yok.

**Sürüm bumpu nasıl karar veriliyor:**

| Commit tipi | Etki |
|---|---|
| `feat` | minor |
| `fix`, `perf`, `refactor` | patch |
| `BREAKING CHANGE:` gövdede veya `!:` konu satırında | major |
| `chore`, `docs`, `ci`, `test`, `style`, `build` | sürüm yok |

Aralıkta yalnızca sürümsüz tipler varsa iş akışı tag atmadan temiz çıkar.
Yerelde denemek için `npm run release:check` (dry run, hiçbir şey yazmaz).

### İki bilinen kısıt

- **GITHUB_TOKEN ile açılan PR başka workflow tetiklemez.** Sürüm senkron PR'ı
  bu yüzden ci check'leri olmadan açılır. `dev` korumalı olduğu için merge
  edilemez; PR bir kez kapatılıp yeniden açıldığında check'ler koşar. Kalıcı
  çözüm bir makine hesabı PAT'i veya GitHub App token'ı olur, şimdilik gerekli
  değil.
- **Actions'ın PR açma izni ayrı bir ayar.** Settings > Actions > General >
  "Allow GitHub Actions to create and approve pull requests" kapalıysa senkron
  PR adımı 403 ile düşer.

### Coolify tarafı

- **Production**: `main` dalını izler, her merge sonrası otomatik deploy.
  Domain `dogancanyildiz.com`.
- **Preview Deployments**: PR başına ayrı URL, GitHub App üzerinden.
- **Staging (opsiyonel, önerilir)**: `dev` dalını izleyen ikinci bir Coolify
  uygulaması, `dev.dogancanyildiz.com` alt alan adıyla. Bu uygulamada
  `NEXT_PUBLIC_SITE_URL` staging alan adına ayarlanır ve Cloudflare tarafında
  alt alan adı arama motorlarına kapatılır (`X-Robots-Tag: noindex` ya da
  Cloudflare Transform Rule). Şimdilik zorunlu değil, PR preview'ları çoğu
  doğrulama için yetiyor; `dev` uzun süre `main`'in önünde kalmaya başlarsa
  kurulmalı.

### Branch protection kuralları

Ana oturum `gh api` ile uygular, iki dalda da aynı iskelet:

| Ayar | `main` | `dev` |
|---|---|---|
| Pull request zorunlu | evet | evet |
| Zorunlu status check: `lint, typecheck, test, build` | evet | evet |
| Zorunlu status check: `hadolint and image build` | evet | evet |
| Check'ler güncel dal üzerinde koşsun (strict) | evet | evet |
| Force push | kapalı | kapalı |
| Dal silme | kapalı | kapalı |
| Yönetici muafiyeti | kapalı tutulması önerilir | açık kalabilir |

`release.yml`'in tag push edebilmesi için tag koruması eklenmemeli, ya da
eklenirse `github-actions[bot]` muaf tutulmalı.

### Sürüm politikası

- **0.x**: yayın öncesi. İlk otomatik sürüm 0.2.0 olacak, çünkü `package.json`
  0.1.0'da duruyor ve `dev`'de biriken commit'ler arasında `feat` var.
- **1.0.0**: launch sürümü. Otomatik bumpla değil, sahibinin `workflow_dispatch`
  üzerinden `version: 1.0.0` girmesiyle kesilir.
- **1.0.0 sonrası**: tamamen Conventional Commits'e göre, yukarıdaki tabloyla.

`CHANGELOG.md` Keep a Changelog biçiminde tutuluyor; 0.1.0 girdisi Faz 0 ile 4
arasını (PR #2 ile #6) özetleyen taban girdisidir, sonraki her sürümü
`scripts/release-version.mjs --write-changelog` dosyanın başına ekler.

## İlgili dokümanlar

- [00-ozet-ve-karar.md](00-ozet-ve-karar.md)
- [01-mevcut-durum-denetimi.md](01-mevcut-durum-denetimi.md)
- [02-stack-karari.md](02-stack-karari.md)
- [05-backend-icerik-ve-servisler.md](05-backend-icerik-ve-servisler.md)
- [07-seo-ve-metadata.md](07-seo-ve-metadata.md)
- [09-guvenlik.md](09-guvenlik.md)
- [10-yol-haritasi.md](10-yol-haritasi.md)
- [11-acik-sorular.md](11-acik-sorular.md)

## Kaynaklar

- [Build Packs | Coolify Docs](https://coolify.io/docs/applications/build-packs/overview)
- [Nixpacks Build Pack | Coolify Docs](https://coolify.io/docs/applications/build-packs/nixpacks)
- [Setup GitHub App | Coolify Docs](https://next.coolify.io/docs/applications/ci-cd/github/setup-app)
- [GitHub Auto Deploy | Coolify Docs](https://coolify.io/docs/applications/ci-cd/github/auto-deploy)
- [GitHub Preview Deploy | Coolify Docs](https://coolify.io/docs/applications/ci-cd/github/preview-deploy)
- [GitHub Actions | Coolify Docs](https://coolify.io/docs/applications/ci-cd/github/actions)
- [Health checks | Coolify Docs](https://coolify.io/docs/knowledge-base/health-checks)
- [[Bug]: Big issues with health check on Dockerfile built nodejs deployment · Issue #7500 · coollabsio/coolify](https://github.com/coollabsio/coolify/issues/7500)
- [Coolify Zero Downtime Deployments: Measured and Fixed](https://learnwithhasan.com/guide/coolify-zero-downtime-deployment/)
- [Loopwerk: Prevent your Coolify deploys from randomly starting without a build cache](https://www.loopwerk.io/articles/2026/docker-buildkit-cache-coolify/)
- [Environment Variables | Coolify Docs](https://coolify.io/docs/knowledge-base/environment-variables)
- [Why I Switched From Coolify Builds to GHCR Deployments](https://www.vivinkv.me/blogs/why-i-switched-from-coolify-builds-to-ghcr-deployments)
- [Deploy private Docker images to Coolify from GHCR - SKIPPERKONGEN](https://skipperkongen.dk/2026/06/03/deploy-private-docker-images-to-coolify-from-ghcr/)
- [Custom Middlewares | Coolify Docs](https://coolify.io/docs/knowledge-base/proxy/traefik/custom-middlewares)
- [Redirects | Coolify Docs](https://coolify.io/docs/knowledge-base/proxy/traefik/redirects)
- [How to create wildcard SSL certificates with Traefik in Coolify](https://coolify.io/docs/knowledge-base/traefik/wildcard-certificates/)
- [Traefik Compress Documentation](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/compress/)
- [How Cloudflare DNS works · Cloudflare Fundamentals docs](https://developers.cloudflare.com/fundamentals/concepts/how-cloudflare-works/)
- [URL Forwarding / Redirects (Redirect Rules) · Cloudflare Rules docs](https://developers.cloudflare.com/rules/url-forwarding/)
- [Cloudflare IP Ranges](https://www.cloudflare.com/ips/)
- [Forwarded headers · Traefik entrypoints docs](https://doc.traefik.io/traefik/routing/entrypoints/#forwarded-headers)
- [Backup and Restore Coolify | Coolify Docs](https://coolify.io/docs/knowledge-base/how-to/backup-restore-coolify)
- [next.js/examples/with-docker · vercel/next.js](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [serverExternalPackages not traced with Turbopack standalone output · Issue #88844 · vercel/next.js](https://github.com/vercel/next.js/issues/88844)
