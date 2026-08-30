# dogancanyildiz.com

Doğan Can YILDIZ'ın kişisel portfolyosu: tam yığın web geliştiricisi ve DevOps
uzmanı. Site, Next.js App Router uygulaması; Vercel olmadan, Coolify yönetimli
bir sunucuda Traefik ve Cloudflare arkasında self-host ediliyor.

## Yığın

| Katman    | Seçim                                                               |
| --------- | ------------------------------------------------------------------- |
| Çatı      | Next.js 16.3.3, App Router, `output: 'standalone'`                   |
| Arayüz    | React 19.2, Tailwind CSS 4, shadcn/ui, JS animasyon katmanı yok      |
| E-posta   | Resend, `/api/contact` üzerinden                                     |
| Çalışma   | Node 24, tek konteyner                                              |
| Barındırma | Coolify'ın ürettiği Docker imajı, önde Traefik, Cloudflare proxy    |

## Gereksinimler

- Node 24 (`.nvmrc` sabitler, `nvm use` alır)
- npm 11.16.0; kilit dosyası commit'li, aynı major ile yeniden üretilmeli
- `AGENTS.md` ve `CLAUDE.md` bilinçli olarak gitignore'da: `next dev` her
  açılışta yeniden yazar. Taze bir klon bunları ilk `npm run dev` ile geri
  alır; o ana kadar proje yönergeleri `docs/` altındadır (başlangıç:
  `docs/00-ozet-ve-karar.md`).

## Yerel kurulum

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_SITE_URL`'in yedek değeri yok. Yoksa `npm run build` patlar;
sessiz bir yedek `robots.txt` ve `sitemap.xml`'e yanlış host yazardı.

## Betikler

| Betik                   | Ne yapar                                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | http://localhost:3000 geliştirme sunucusu, velite yanında izleme kipinde çalışır                                                                                                        |
| `npm run build`         | Üretim derlemesi, `.next/standalone` yazar                                                                                                                                               |
| `npm run build:content` | Velite'i sıkı kipte bir kez çalıştırır, her içerik dosyasını şemasına karşı doğrular                                                                                                     |
| `npm run build:app`     | Yalnızca `next build`; velite çıktısı taze olan ağaç için (CI bunu `build:content`'ten sonra kullanır)                                                                                  |
| `npm run start`         | Üretim derlemesini sunar                                                                                                                                                                 |
| `npm run lint`          | Next.js yapılandırmasıyla ESLint, tip-duyarlı kurallar açık, uyarı sıfır                                                                                                                 |
| `npm run typecheck`     | `tsc --noEmit`                                                                                                                                                                           |
| `npm test`              | vitest: `*.test.ts` için node, `*.test.tsx` için jsdom + Testing Library; CI `--coverage` ekler                                                                                           |
| `npm run format`        | Prettier kontrol kipi                                                                                                                                                                    |
| `npm run format:write`  | Prettier yazma kipi                                                                                                                                                                     |
| `npm run verify:routes` | Derlemeden sonra `.next/prerender-manifest.json`: her içerik rotası iki dilde prerender, `/api/*` dynamic                                                                                |
| `npm run verify:links`  | Proje canlı demo URL'leri ve sertifika doğrulama linklerinin HEAD/GET denetimi (`npm run build:content` önce); merge kapısı değil, `.github/workflows/links.yml` haftalık ve isteğe bağlı |
| `npm run verify:docs`   | `docs/` ve deploy checklist'leri üzerinde yapısal kontroller (`scripts/verify-docs.mjs`), CI'da çalışır                                                                                |
| `npm run release:check` | `scripts/release-version.mjs` kuru koşu: `main`'e bir sonraki merge'in keseceği sürümü basar, hiçbir şey yazmaz                                                                        |
| `npm run vendor:fonts`  | @fontsource paketlerindeki woff2 ve woff dosyalarını `src/fonts` ve `public/fonts/og`'ye kopyalar                                                                                       |

## Ortam değişkenleri

Her değişken `.env.example`'da belgelidir. Coolify'da build ile runtime
ayrımı kozmetik değil. Build değişkenini yalnızca runtime işaretlemek
derlemeyi doğrudan düşürür; bir sırrı build değişkeni yapmak imaj
katmanlarına ve derleme loglarına sızdırır.

| Değişken                 | Coolify katmanı | Zorunlu           | Not                                                                                                                                                                                                                      |
| ------------------------ | --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`   | Build           | Evet              | `next build` client bundle'a gömer. Dockerfile `ARG`'ının varsayılanı yok; bu argümansız derleme `/robots.txt` prerender'ında `resolveSiteUrl`'de düşer, tanımsız bir değer göndermez.                                  |
| `RESEND_API_KEY`         | Runtime         | Üretimde evet     | Build değişkenleri imaj katmanına ve derleme loguna sızabilir.                                                                                                                                                           |
| `CONTACT_EMAIL`          | Runtime         | Üretimde evet     | Form mesajlarının gittiği kutu.                                                                                                                                                                                         |
| `FROM_EMAIL`             | Runtime         | Üretimde evet     | Resend'de doğrulanmış bir domain'de olmalı.                                                                                                                                                                             |
| `TRUST_CF_CONNECTING_IP` | Runtime         | Hayır             | Yalnızca origin yalnızca Cloudflare'dan erişilebilir ve Traefik Cloudflare aralıklarına güvendikten sonra `true`. `trustedIPs` tek başına `CF-Connecting-IP`'yi korumaz.                                               |
| `NEXT_PUBLIC_BUILD_SHA`  | Build           | Hayır             | Systems panelindeki commit SHA; Coolify `SOURCE_COMMIT` veya CI `github.sha`. Boşsa alan gizlenir.                                                                                                                     |
| `NEXT_PUBLIC_BUILD_DATE` | Build           | Hayır             | Systems paneli ve footer yılı için ISO deploy zamanı. Boşsa ikisi de gizlenir.                                                                                                                                          |
| `GATUS_URL`              | Runtime         | Hayır             | Systems panelinin okuduğu Gatus taban URL'i. Yalnızca sunucu tarafı, client'a gitmez; boşsa nötr "durum alınamıyor" satırı görünür.                                                                                     |
| `UMAMI_SCRIPT_URL`       | Build           | Hayır             | Self-host Umami origin'i. CSP'nin izin verdiği origin ile aynı olmalı (`src/lib/analytics.ts`), aksi halde derleme düşer.                                                                                               |
| `UMAMI_WEBSITE_ID`       | Build           | Hayır             | Umami website UUID. İzleyici etiketi yalnızca iki Umami değeri de setken basılır.                                                                                                                                       |
| `CSP_REPORT_ONLY`        | Build           | Hayır             | Tek bir ölçüm deploy'u için `1`: sıkı report-only CSP'yi yayınlar, `/api/csp-report` bütçesini yükseltir. Pencere bitince kaldır.                                                                                        |

## Uluslararasılaştırma

- Türkçe kökte (`/`, `/hakkimda`, `/iletisim`), İngilizce `/en` altında
  (`/en`, `/en/about`, `/en/contact`).
- Dil yönlendirmesi `src/i18n/routing.ts`; `src/proxy.ts` uygular. Accept-Language
  otomatik yönlendirmesi ve locale cookie kapalı: tek sinyal URL.
- Eski prefix'siz İngilizce sayfalar (`/about`, `/projects`, `/contact`,
  `/privacy`) `/en/...`'e 308. Fazla `/tr/...` adresleri prefix'siz Türkçe
  slug'a gider.
- Mesajlar `messages/en.json` ve `messages/tr.json`. İki dosya aynı anahtar
  kümesini taşımak zorunda.
- `src/app/[lang]/` altındaki her sayfa ve layout `setRequestLocale(lang)`
  çağırmalı. Unutan sayfa sessizce statik üretimden düşer;
  `npm run verify:routes` yakalar.
- Route Handler `[lang]` parametresi almaz. `/api/contact` locale'i formun
  gönderdiği `X-Locale` başlığından, sonra `Referer` yolundan (`/en/...`
  İngilizce, geri kalanı Türkçe), sonra `Accept-Language`'den (q ağırlıklı)
  okur; rate limiter'dan önce, böylece her hata gövdesi çevrilmiş gelir.

## Güvenlik duruşu

- Güvenlik başlıkları ve Content Security Policy `next.config.ts` içinde
  `headers()` ile set: `X-Content-Type-Options`, `Referrer-Policy`, geniş
  `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy`
  ve `Cross-Origin-Resource-Policy: same-origin`, üretimde
  `Strict-Transport-Security` (`max-age=31536000; includeSubDomains`, preload
  yok). HSTS Traefik middleware canlı olunca oraya taşınır, uygulama satırı
  o zaman kalkar ki tek katman göndersin.
  `tests/deploy/security-headers.test.ts` kümeyi kilitler.
- Zorunlu CSP `script-src 'unsafe-inline'` tutar çünkü App Router RSC
  payload'ını inline script ile stream eder; nonce her rotayı dinamik
  üretime iter. İhlaller `/api/csp-report`'a gider; sıkı report-only politika
  derleme zamanında `CSP_REPORT_ONLY=1` ile ölçüm penceresi için yayınlanabilir.
- `/cv/*` `X-Robots-Tag: noindex, nofollow` ve bir günlük cache ile sunulur,
  `/fonts/*` bir günlük cache (`immutable` yok, dosya adları hash'li değil).
- `poweredByHeader` kapalı.
- `images.remotePatterns` bilinçli olarak tanımsız. Tanımsız bırakmak
  `next/image`'i yalnızca yerel dosyada tutar ve Ağustos 2026 Next.js
  uyarısındaki AVIF çözümleme yüzeyini kapatır. Uzak bir host eklemek bunu
  yeniden açar, ayrı bir inceleme ister.
- `/api/contact` `Content-Type: application/json` ister (aksi 415) ve
  `Origin`'in `NEXT_PUBLIC_SITE_URL` ile eşit olmasını ister (aksi 403, preview
  host kendi değerine ihtiyaç duyar); ziyaretçi IP'sine göre rate limit, paylaşılan
  "unknown" anahtarı için ayrı daha gevşek kova, gövdeyi `Content-Length` ve
  stream sırasında sınırlar (413), honeypot ve ad/e-postadaki CR/LF dahil her
  alanı sunucu tarafında doğrular; `X-Request-Id`, `X-RateLimit-Limit`,
  `X-RateLimit-Remaining` ve 429'da `Retry-After` döner. Hatalar çevrilir;
  400 gövdesi bozulan alanı adlandırır. Resend çağrısı 10 saniye zaman aşımı
  (504), `Reply-To` ve idempotency anahtarı taşır. Loglar satır başına bir JSON
  nesnesi, mesaj gövdesi ve ziyaretçi adresi asla içlerinde yok.
- `/api/health` `{ status: "ok" | "degraded", checks: { content, mail }, timestamp }`
  döner, HTTP her iki durumda da 200; bir mail değişkeni eksikse `status`
  `degraded` olur, Gatus koşulu buna alarm verir. `src/instrumentation.ts`
  o durumda açılışta yüksek sesli bir hata satırı da basar.
- Bağımlılık ve kod taraması: Dependabot (`.github/dependabot.yml`, haftalık
  gruplu PR'lar `dev`'e, güvenlik güncellemeleri isteğe bağlı) ve CodeQL
  (`.github/workflows/codeql.yml`, javascript-typescript, her PR ve haftalık).
  İkisi de depo Security sekmesine raporlar.
- Açık mı buldun? [SECURITY.md](./SECURITY.md) veya canlı sitedeki
  `/.well-known/security.txt`.

## Dağıtım

Uygulamayı Coolify bu git deposundan yayınlar:

1. Coolify GitHub App ile bağlıdır, Dockerfile build pack kullanır. `main`'e
   push derleme ve yayın tetikler, pull request'ler preview alır.
2. İmaj `.next/standalone` içinden `node server.js`'i root olmayan kullanıcıyla çalıştırır.
3. Konteyner sağlık kontrolü `/api/health`.
4. Traefik TLS sonlandırır, HSTS ve sıkıştırma ekler, Cloudflare aralıklarına
   `forwardedHeaders.trustedIPs` ile güvenir.
5. Cloudflare proxied kipte, SSL Full (strict). `dogancanyildiz.sh` →
   `dogancanyildiz.com` yönlendirmesi yolu koruyan tek atlamalı Cloudflare
   Redirect Rule olarak planlı; `.sh` henüz kayıtlı değil, kural canlı değil
   (`docs/plans/README.md`).

`Dockerfile`, `.dockerignore` ve GitHub Actions kapısı bu depoda. CI
bağımlılık incelemesi, lint, typecheck, coverage'lı test, `verify:docs`,
derleme, `verify:routes`, prettier ve üretim `audit` çalıştırır; sonra
Dockerfile'ı lint eder, önbellekli Buildx ile imajı üretir ve konteynerin
dışından `/api/health`'i bir kez yoklar. Her action commit SHA'sına
pin'li, `release.yml` o CI koşusu başarılı olana kadar bekler. GitHub
Actions imaj basmaz; Coolify sunucuda üretir.

### Yerel doğrulama

Üretim imajının yerel doğrulaması:

```bash
docker compose up --build -d
curl -s http://127.0.0.1:3000/api/health   # {"status":"ok","checks":{"content":true,"mail":false},...}
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # 200
docker compose down
```

Üç Resend değişkeni yoksa `mail` yerelde `false`; compose dosyası yalnızca
`NEXT_PUBLIC_SITE_URL` ister.

Dockerfile'ı CI ile aynı şekilde lint et:

```bash
docker run --rm -i hadolint/hadolint:v2.15.1-alpine hadolint --failure-threshold warning - < Dockerfile
```

### Panel checklist'leri

Kontrol panelinde, bu depoda olmayan adımlar adım adım checklist:

- `docs/deploy/coolify-kurulum.md` — GitHub App, build pack, env katmanları, sağlık kontrolü
- `docs/deploy/cloudflare-kurulum.md` — DNS, TLS, yönlendirme, cache, rate limiting
- `docs/deploy/traefik-ve-origin.md` — güvenilir proxy başlıkları, HSTS, origin kilidi
- `docs/deploy/resend-domain.md` — gönderici domain için SPF, DKIM, DMARC
- `docs/runbooks/infrastructure.md` — Gatus, Umami ve arkalarındaki ortam değişkenleri

## Depo düzeni

```
src/app        App Router rotaları, api handler'ları, metadata rotaları
src/components UI, yerleşim ve bölüm bileşenleri
src/lib        Çatıdan bağımsız yardımcılar, her biri birim testli
docs           Mimari kararlar ve fazlı yol haritası
docs/plans     Faz başına yürütülebilir uygulama planları
```

## Belgelendirme

Mimari kararlar `docs/` altında. Özet için `docs/00-ozet-ve-karar.md`,
faz sırası için `docs/10-yol-haritasi.md`.

## Dallama ve sürümler

```
feature/*  --PR-->  dev  --PR-->  main  --push-->  release workflow
```

- `feature/*` `dev`'den açılır. `dev` entegrasyon dalı, `main` yayınlanmış
  durumdur ve yalnızca `dev`'den pull request ile ilerler.
- `.github/workflows/ci.yml` hem `dev` hem `main` üzerindeki PR ve
  push'larda çalışır. İki işi (`Quality checks` ve `Docker image`) ile
  `codeql.yml`'deki `CodeQL analysis`, branch protection'daki zorunlu
  kontrollerdir; adları değişmemeli.
- Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  izler. Sürüm yalnızca bundan türetilir.

`main`'e her merge `.github/workflows/release.yml` çalıştırır:

1. son `v*` etiketinden beri commit'lerden sonraki sürümü türetir,
2. açıklamalı etiket basar ve gruplanmış notlarla GitHub Release yayınlar,
3. `package.json`, `package-lock.json` ve `CHANGELOG.md`'yi taşıyan
   `chore(release): sync version vX.Y.Z` pull request'ini `dev`'e açar.

| Commit tipi                                           | Sürüm artışı |
| ----------------------------------------------------- | ------------ |
| `feat`                                                | minor        |
| `fix`, `perf`, `refactor`                             | patch        |
| konuda `!:` veya gövdede `BREAKING CHANGE:`            | major        |
| `chore`, `docs`, `ci`, `test`, `style`, `build`       | yok          |

Yalnızca sürüm-nötr commit taşıyan bir batch etiketsiz biter.
`npm run release:check` kararı yerelde basar, hiçbir şey yazmaz.

Proje `0.x` ön sürümünde. `1.0.0` elle kesilir: `workflow_dispatch` ile
`version: 1.0.0`; ondan sonra yukarıdaki tablo kendi başına işler.
`CHANGELOG.md` [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
izler, release workflow yazar. Branch protection ayarları ve Coolify
staging seçeneği dahil tam akış `docs/06-devops-ve-deploy.md`'de.

## İçerik ekleme

Projeler ve blog yazıları `content/` altında MDX; Velite derleme ve
geliştirme zamanında `velite.config.ts` şemalarına karşı derler.

- Proje: `content/projects/<locale>/<slug>.mdx`. Zorunlu ön madde:
  `title`, `slug`, `summary`, `role`, `stack` (boş olmayan liste), `year`,
  `outcome`. `links.live`, `links.repo` (ikisi de `https://`), `cover`,
  `coverAlt`, `featured`, `order`, `updated` ve `draft` isteğe bağlı;
  `updated` sitemap `lastmod`'unu besler, ana sayfa `featured` projeleri
  gösterir yoksa ilk üçüne düşer. `stack`'i web yığınındaysa öğrenme
  sırasıyla (HTML, CSS, JavaScript, TypeScript, çatı) veya DevOps'ta boru
  hattı sırasıyla (Git, CI, konteyner, OS, yönlendirme) yaz.
- Blog yazısı: `content/blog/<locale>/<slug>.mdx`. Zorunlu ön madde:
  `title`, `slug`, `date`, `summary`. `tags`, `cover`, `coverAlt`, `updated`
  ve `draft` isteğe bağlı; `updated` BlogPosting şemasında `dateModified` ve
  sitemap `lastmod` olur.
- `<locale>` klasör adından türetilir, yalnızca `en` veya `tr`; elde
  `locale` alanı yok.
- Aynı içeriğin iki dil klasöründe AYNI `slug` değeri olmalı; İngilizce ve
  Türkçe sayfa arasındaki hreflang çifti bu eşleşmeden kurulur. Çeviri yoksa
  diğer dil için yer tutucu dosya açma: çevrilmemiş slug o dilin
  rotalarına, sitemap'ine veya hreflang alternatiflerine hiç girmez,
  yedek sayfa yok.
- Kapak görseli isteğe bağlı. `content/images/` altına koy, ön maddeden
  göreli yol ver, örneğin `cover: ../../images/<slug>-cover.png`. `cover`
  alanı olmayan içerik kapaksız yayınlanır; CSS gradyanı veya stok görsele
  düşmez.
- Ön madde değerleri YAML: `": "` (iki nokta + boşluk) içeren bir değer,
  örneğin alt başlıklı bir başlık, tırnak içinde olmalı yoksa ayrıştırıcı
  iç içe anahtar sanır.

`npm run dev` Velite'i Next.js geliştirme sunucusu yanında izleme kipinde
çalıştırır, içerik değişiklikleri yeniden başlatmadan alınır.
`npm run build:content` Velite'i sıkı kipte bir kez çalıştırır; yeni ön
maddenin şemaya uyduğunu tam derlemeden önce kontrol etmenin en hızlı yolu.

## Lisans

Kod MIT. Yazılı içerik, CV, görseller ve kişisel marka değil; tam ayrım
için [LICENSE](./LICENSE).
